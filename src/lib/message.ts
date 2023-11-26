import { AnyMessageContent, proto, makeWASocket } from "@whiskeysockets/baileys";

class Message {
    readonly state: any;
    readonly message: proto.IWebMessageInfo;
    readonly socket: ReturnType<typeof makeWASocket> | null = null;
    readonly sender: string;
    readonly quoted: proto.IMessage | null = null;
    readonly text: string | null = null;

    constructor(msg: proto.IWebMessageInfo, socket: ReturnType<typeof makeWASocket>) {
        this.message = msg;
        this.socket = socket;
        this.sender = msg.key.remoteJid;
        this.quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        this.text = msg.message.conversation || msg.message.imageMessage.caption || msg.message.videoMessage.caption || msg.message.extendedTextMessage?.text;
    }

    public reply(params: AnyMessageContent): void {
        this.read();
        this.socket?.sendMessage(this.message.key.remoteJid, params, {
            quoted: this.message,
        });
    }

    public async sendText(text: string): Promise<void> {
        this.read();
        this.socket?.sendMessage(this.message.key.remoteJid, {
            text: text,
        });
    }

    public async read(): Promise<void> {
        this.socket?.readMessages([ this.message.key ])
    }
}

export default Message;