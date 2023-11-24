import { Boom } from '@hapi/boom'
import NodeCache from 'node-cache'
import pino from '../../utils/logger'
import { Reply } from '../../types/Client'
import auth from './session'
import db from '../../db/client'
import qrCode from "qrcode-terminal"
import log from '../../utils/logger'

import makeWASocket, {
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidUser
} from '@whiskeysockets/baileys'

const logger = pino.child({});
logger.level = 'debug'

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache()


// start a connection
const startSock = async () => {
    const { state, saveState } = await auth(db)
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    log.info(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        // ignore all non user (group, broadcast) messages
        shouldIgnoreJid: jid => !isJidUser(jid),
    })


    // prevent immediate send without read message that may cause banned
    const sendMessageWTyping: Reply = async (msg, jid) => {
        await sock.presenceSubscribe(jid)
        await delay(500)

        await sock.sendPresenceUpdate('composing', jid)
        await delay(1000)

        await sock.sendPresenceUpdate('paused', jid)
        await sock.sendMessage(jid, msg)
    }

    sock.ev.process(
        async (events) => {
            if (events[ 'connection.update' ]) {
                const update = events[ 'connection.update' ]

                if (update.qr) {
                    log.info('New QR received, please scan to continue')
                    qrCode.generate(update.qr, { small: true })
                }

                const { connection, lastDisconnect } = update
                if (connection === 'close') {
                    // reconnect if not logged out
                    if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                        setTimeout(() => {
                            startSock()
                        }, 3000);
                    } else {
                        log.fatal('Connection closed. You are logged out.')
                        process.exit(1)
                    }
                }

                log.info('connection update', update)
            }

            if (events[ 'creds.update' ]) {
                await saveState()
            }

            if (events.call) {
                log.info('recv call event', events.call)
            }

        }
    )

    // read the message
    sock.ev.on("messages.upsert", m => {
        let msg = m.messages[ 0 ]
        console.log(JSON.stringify(msg, null, 2))

        if (msg.key.fromMe) return;
        sock.readMessages([ msg.key ]);
    })

    return { sock, sendMessageWTyping }
}


export default startSock