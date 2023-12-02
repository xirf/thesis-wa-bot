import { AnyMessageContent, proto, makeWASocket } from "@whiskeysockets/baileys";
import { writeFileSync } from "fs";
import Database from "../database";

class Message {
    readonly state: any;
    readonly message: proto.IWebMessageInfo;
    readonly socket: ReturnType<typeof makeWASocket> | null = null;
    readonly sender: string;
    readonly quoted: proto.IMessage | null = null;
    readonly text: string | null = null;
    readonly command: string | null = null;
    readonly args: string;

    constructor(msg: proto.IWebMessageInfo, socket: ReturnType<typeof makeWASocket>) {
        writeFileSync("message.json", JSON.stringify(msg, null, 2));

        this.message = msg;
        this.socket = socket;
        this.sender = msg.key.remoteJid;
        this.quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        this.text = msg.message.conversation || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || msg.message?.extendedTextMessage?.text;

        console.log(msg)

        if (this.text.startsWith(process.env.PREFIX || "/")) {
            const [ command, ...args ] = this.text.slice(process.env.PREFIX.length).split(" ");

            this.command = command;
            this.args = args.join(" ");
        }
    }

    public reply(params: AnyMessageContent | string): void {
        this.read();
        if (typeof params === "string") params = { text: params };

        this.socket?.sendMessage(this.message.key.remoteJid, params, {
            quoted: this.message,
        });
    }

    public async sendText(text: string, jid: string): Promise<void> {
        this.read();
        this.socket?.sendMessage(jid, { text: text, });
    }

    public async read(): Promise<void> {
        this.socket?.readMessages([ this.message.key ])
    }

    public parseTemplate(template: string, data: Record<string, any>): string {
        let result = template;

        for (const key in data) {
            const regex = new RegExp(`{${key}}`, "gi");
            result = result.replace(regex, data[ key ]);
        }

        return result;
    }
}

export default Message;