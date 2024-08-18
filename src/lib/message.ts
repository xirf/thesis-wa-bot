import { AnyMessageContent, proto, makeWASocket, downloadMediaMessage, MiscMessageGenerationOptions, AnyMediaMessageContent } from "@whiskeysockets/baileys";
import logger from "../utils/logger";
import database from "../database";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import crypto from "crypto";
import { allowedMessageType, mediaMessageType } from "../constants/chat";

class Message {
    readonly state: any;
    readonly message: proto.IWebMessageInfo;
    readonly socket: ReturnType<typeof makeWASocket> | null = null;
    readonly sender: string;
    readonly quoted: proto.Message.IExtendedTextMessage | null = null;
    readonly text: string | null = null;
    readonly command: string | null = null;
    readonly arg: string;
    readonly msgType: string;
    readonly stanzaId: string;
    readonly quotedStanzaId: string | null = null;
    protected mediaPath: string | null = null;
    protected mimetype: string | null = null;
    #prefix: string = process.env.PREFIX || "/";

    constructor(msg: proto.IWebMessageInfo, socket: ReturnType<typeof makeWASocket>) {
        this.message = msg;
        this.socket = socket;
        this.sender = msg.key.remoteJid;
        this.stanzaId = msg.key.id;
        this.quoted = msg.message?.extendedTextMessage;
        this.text = msg.message?.conversation
            || msg.message?.imageMessage?.caption
            || msg.message?.videoMessage?.caption
            || msg.message?.extendedTextMessage?.text
            || msg.message?.documentWithCaptionMessage?.message?.documentMessage.caption
            || msg.message?.documentMessage.caption;


        if (this.quoted) {
            this.quotedStanzaId = this.quoted.contextInfo.stanzaId;
        }

        if (this.text?.startsWith(this.#prefix)) {
            const [ command, ...args ] = this.text.slice(this.#prefix.length).split(" ");
            this.command = command;
            this.arg = args.join(" ");
        }

        this.msgType = Object.keys(msg.message).filter(type => allowedMessageType.includes(type))[ 0 ];
        if (mediaMessageType.includes(this.msgType)) {
            this.handleMediaMessage();
        }

        writeFileSync(`./logs/${Date.now()}.json`, JSON.stringify(msg, null, 2));

        if (Object.keys(allowedMessageType).some(type => type === this.msgType)) {
            this.saveMessageToDatabase();
        }
    }

    private async handleMediaMessage() {
        this.mimetype = this.message.message[ this.msgType ].mimetype;

        let file = this.message.message[ this.msgType ].fileName;
        if (this.msgType == "documentWithCaptionMessage")
            file = this.message.message[ this.msgType ].message.documentMessage.fileName;

        const filename = this.generateUniqueFilename(file.split(".").pop() || "jpg");

        this.mediaPath = `./media/${filename}`;
        if (!existsSync('./media')) {
            mkdirSync('./media');
        }


        logger.info(`Receiving new media message ${this.msgType}, Saving as ${filename}`);
        try {
            const media = await downloadMediaMessage(
                this.message, 'buffer', {}, {
                logger: logger.child({ module: 'downloadMediaMessage' }) as any,
                reuploadRequest: this.socket.updateMediaMessage
            });

            // @ts-expect-error - media is a buffer
            writeFileSync(this.mediaPath, media);
        } catch (error) {
            logger.warn({ error, msg: `Failed to download media message from ${this.message.key.remoteJid}` });
        }
    }

    private generateUniqueFilename(fileFormat: string): string {
        let filename = `${crypto.randomUUID()}.${fileFormat}`;
        while (existsSync(`./media/${filename}`)) {
            filename = `${crypto.randomUUID()}.${fileFormat}`;
        }
        return filename;
    }

    private async saveMessageToDatabase() {
        try {
            const res = await database.chat.create({
                data: {
                    id: this.stanzaId,
                    senderJid: this.message.key.remoteJid,
                    type: this.msgType,
                    msgKey: JSON.stringify(this.message.key),
                    content: this.text,
                    mediaPath: this.mediaPath,
                    rawContent: JSON.stringify(this.message)
                }
            });
            if (res) {
                logger.info({ msg: "Message saved to database" });
            } else {
                logger.warn({ msg: "Failed to save message to database" });
            }
        } catch (error) {
            logger.warn({
                error: {
                    message: error.message,
                    stack: error.stack
                },
                msg: "Failed to save message to database"
            });
        }
    }

    public async reply(params: AnyMessageContent | string, options: MiscMessageGenerationOptions = {}): Promise<void> {
        this.read();
        if (typeof params === "string") params = { text: params };

        try {
            await this.socket?.sendMessage(this.message.key.remoteJid, params, {
                quoted: this.message,
                ...options
            });

            // await database.chat.create({
            //     data: {
            //         id: msg.key.id,
            //         senderJid: msg.key.remoteJid,
            //         type: Object.keys(msg.message)[ 0 ],
            //         msgKey: JSON.stringify(msg.key),
            //         content: JSON.stringify(msg.message),
            //         rawContent: JSON.stringify(msg),
            //         mediaPath: this.mediaPath
            //     }
            // });
        } catch (error) {
            logger.warn({
                error: {
                    message: error.message,
                    stack: error.stack
                },
                msg: `Failed to send reply message`
            });
        }
    }

    public async sendText(jid: string, text: string, options: MiscMessageGenerationOptions = {}): Promise<void> {
        this.read();
        try {
            await this.socket?.sendMessage(jid, { text, ...options });

            // await database.chat.create({
            //     data: {
            //         id: msg.key.id,
            //         senderJid: msg.key.remoteJid,
            //         type: Object.keys(msg.message)[ 0 ],
            //         msgKey: JSON.stringify(msg.key),
            //         content: JSON.stringify(msg.message),
            //         rawContent: JSON.stringify(msg),
            //         mediaPath: this.mediaPath
            //     }
            // });
        } catch (error) {
            logger.warn({
                error: {
                    message: error.message,
                    stack: error.stack
                },
                msg: `Failed to send message to ${jid}`
            });
        }
    }

    public async sendMedia(jid: string, media: AnyMediaMessageContent) {
        this.read();
        try {
            await this.socket?.sendMessage(jid, media);

            // await database.chat.create({
            //     data: {
            //         id: msg.key.id,
            //         senderJid: msg.key.remoteJid,
            //         type: Object.keys(msg.message)[ 0 ],
            //         msgKey: JSON.stringify(msg.key),
            //         content: JSON.stringify(msg.message),
            //         rawContent: JSON.stringify(msg),
            //         mediaPath: this.mediaPath
            //     }
            // });
        } catch (error) {
            logger.warn({
                error: {
                    message: error.message,
                    stack: error.stack
                },
                msg: `Failed to send media message to ${jid}`
            });
        }
    }

    public async read(): Promise<void> {
        this.socket?.readMessages([ this.message.key ]);
    }

    public parseTemplate(template: string, data: Record<string, any>): string {
        return Object.keys(data).reduce((result, key) => {
            const regex = new RegExp(`{${key}}`, "gi");
            return result.replace(regex, data[ key ]);
        }, template);
    }

    public async react(emote: string = "👍"): Promise<void> {
        this.read();
        try {
            await this.socket.sendMessage(this.sender, {
                react: {
                    text: emote,
                    key: this.message.key
                }
            });
        } catch (error) {
            logger.warn({ error, msg: "Failed to send reaction" });
        }
    }
}

export default Message;