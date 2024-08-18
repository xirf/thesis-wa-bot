import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import { sendReport } from "../shared/sendReport";
import database from "../../database";
import { proto } from "@whiskeysockets/baileys";

const command: Command = async (msg: Message, cache: any) => {
    try {
        let text: string | null = msg.text;

        if (text?.toLowerCase() == "batal") {
            msg.reply(response.canceled);
            cache.set(msg.sender, { data: cache.data })
            return;
        } else if (text?.toLowerCase() == "selesai") {
            if (cache.msgs == undefined || cache.msgs.length == 0)
                return await msg.reply(response.error.emptyReport);

            return await sendReport(msg, cache.msgs, cache.get(msg.sender), "student");
        } else if (text?.toLowerCase() == "hapus") {
            if (cache.msgs == undefined || cache.msgs.length == 0)
                return await msg.reply(response.error.emptyReport);

            cache.msgs = cache.msgs.filter((message: string) => message != msg.quotedStanzaId)
            await msg.react("🚫")

            let savedMessage = await database.chat.findFirst({
                where: {
                    id: msg.quotedStanzaId
                }
            })

            console.log(savedMessage);

            if (savedMessage) {
                let _msgKey: proto.IWebMessageInfo = JSON.parse(savedMessage.rawContent)
                msg.sendText(msg.sender, response.messageCanceled, { quoted: _msgKey })
            }
        } else {
            await msg.react();

            if (cache.msgs == undefined) cache.msgs = [];
            cache.msgs.push(msg.stanzaId);
        }

        return await cache.set(msg.sender, cache.get(msg.sender));
    } catch (error) {
        console.log(error);
        logger.warn({
            error: {
                message: error.message,
                stack: error.stack
            },
            msg: "Failed collecting report"
        });
        return await msg.reply(response.error.internalServerError);
    }
}

export default command;