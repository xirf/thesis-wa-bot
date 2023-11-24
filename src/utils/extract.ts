import { WAMessage, downloadMediaMessage } from "@whiskeysockets/baileys";

export interface ParsedMessage {
    sender: string;
    phoneNumber: string;
    pushName: string;
    image: Buffer | null;
    video: Buffer | null;
    text: string;
}


/**
 * Parse a message into a more usable format 
 * @param message WAMessage
 * @returns ParsedMessage
 */
const extractMessage = async (message: WAMessage): Promise<ParsedMessage> => {
    try {
        const m = message
        const sender = message.key.remoteJid;
        const _number = sender.split('@')[ 0 ];
        const pushName = message.pushName || message.verifiedBizName || message.key.remoteJid
        let phoneNumber = _number;

        if (_number.startsWith('62')) {
            phoneNumber = _number.replace('62', '0');
        }

        let image = null;
        let video = null;

        if (Object.keys(m)[ 0 ] == 'imageMessage') {
            image = await downloadMediaMessage(m, 'buffer', {}, null);
        } else if (Object.keys(m)[ 0 ] == 'videoMessage') {
            video = await downloadMediaMessage(m, 'buffer', {}, null);
        }

        const text = m.message.conversation
            || m.message.extendedTextMessage?.text
            || m.message.imageMessage?.caption
            || m.message.videoMessage?.caption

            || "no messages";
        return {
            sender,
            phoneNumber,
            pushName,
            image,
            video,
            text
        }
    } catch (error) {

    }
}


export default extractMessage;
