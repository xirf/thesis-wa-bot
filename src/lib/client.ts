import { Boom } from '@hapi/boom'
import logger from "../utils/logger";
import session from './session';
import qrcode from "qrcode";
import Message from './message';

import makeWASocket, {
    DisconnectReason,
    Browsers,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidUser
} from '@whiskeysockets/baileys'
import Database from "../database"
import command from '../command';

const log = logger.child({ module: 'client' }) as any;
log.level = 'debug';
class Client {
    protected socket: ReturnType<typeof makeWASocket> | null = null;

    constructor() {
        this.socket = null;
    }

    public async connect() {
        log.info("Starting WhatsApp client using Baileys " + (await fetchLatestBaileysVersion()).version + "...");

        const { clearState, saveState, state } = await session(Database);

        const socket = makeWASocket(
            {
                logger: log,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, log),
                },
                browser: Browsers.appropriate("Firefox"),
                shouldIgnoreJid: (jid) => !isJidUser(jid),
            }
        );

        this.socket = socket;

        socket.ev.on("connection.update", (update) => {
            const { lastDisconnect, connection } = update;

            if (connection == "connecting") log.info("Connecting to WhatsApp");
            if (connection == "open") log.info("Connected to WhatsApp");

            if (connection == "close") {
                log.warn("Disconnected from WhatsApp", lastDisconnect);
                if ((lastDisconnect?.error as Boom).output.statusCode !== DisconnectReason.loggedOut) {
                    log.warn("Reconnecting in 2 seconds");
                    setTimeout(() => {
                        this.connect();
                    }, 2000);
                } else {
                    log.fatal("Logged out, clearing session");
                    clearState();
                }
            }

            if (update.qr) {
                log.info("New QR code received, please scan");
                qrcode.toString(update.qr, { type: "terminal", small: true }).then(console.log).catch(log.error);

            }
        })


        socket.ev.on("creds.update", saveState);

        socket.ev.on("messages.upsert", async (m) => {
            let msg = m.messages[ 0 ];
            if (msg.key.fromMe) return;
            const message = new Message(msg, socket);
            await command(message);

        })

    }

}

export default new Client;
