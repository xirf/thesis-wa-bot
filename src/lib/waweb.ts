import { Client, LocalAuth } from 'whatsapp-web.js';
import logger from '../utils/logger';
import qrcode from "qrcode-terminal"
import command from '../command';
import database from '../database';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

// Create a new client instance
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "waweb",
        dataPath: "sessions"
    })
});

// When the client received QR-Code
client.on('qr', (qr) => {
    logger.info({}, 'QR Code received, scan it!');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', (session) => {
    logger.info({ session }, 'Client is authenticated!');
})

// When the client is connected
client.on('auth_failure', (msg) => {
    logger.error({ msg }, 'Authentication failure');
})

// When the client is connected
client.on('ready', () => {
    logger.info('WhatsApp client is ready!');
})

// When the client is connected
client.on('message', async (msg) => {

    try {
        if (msg.fromMe || msg.isStatus) return;
        let mediaPath = null;

        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            mediaPath = `media/${msg.id.id}.${media.mimetype.split("/")[ 1 ]}`;
            if (!existsSync("media")) mkdirSync("media");
            writeFileSync(mediaPath, media.data);
        }

        await database.chat.create({
            data: {
                id: msg.id.id,
                msgKey: JSON.stringify(msg.id),
                senderJid: msg.from,
                type: msg.type,
                content: msg.body,
                mediaPath: mediaPath,
                rawContent: JSON.stringify(msg)
            }
        })

        logger.info(`New message received from ${msg.from}: ${msg.body}`);
        await command(msg)
    } catch (error) {
        logger.error({ error }, `Error processing message from ${msg.from}`);
    }
})


export default client;