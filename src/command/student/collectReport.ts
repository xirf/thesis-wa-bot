import { Command } from "../../types";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import { sendReport } from "../shared/sendReport";
import database from "../../database";
import { Message } from "whatsapp-web.js";
import client from "../../lib/waweb";

const command: Command = async (msg: Message, cache: any) => {
    try {
        let text: string | null = msg.body;

        if (text?.toLowerCase() == "batal") {
            msg.reply(response.canceled);
            cache.set(msg.from, { data: cache.data })
            return;
        } else if (text?.toLowerCase() == "selesai") {
            if (cache.msgs == undefined || cache.msgs.length == 0)
                return await msg.reply(response.error.emptyReport);

            return await sendReport(msg, cache.msgs, cache.get(msg.from), "student");
        } else if (text?.toLowerCase() == "hapus") {
            if (cache.msgs == undefined || cache.msgs.length == 0)
                return await msg.reply(response.error.emptyReport);

            cache.msgs = cache.msgs.filter((message: any) => message != msg.mentionedIds[ 0 ]);
            await msg.react("🚫")

            let savedMessage = await database.chat.findFirst({
                where: {
                    id: msg.id.id
                }
            })

            if (savedMessage) {
                try {
                    client.sendMessage(msg.from, response.messageCanceled)
                } catch (error) {
                    logger.error({error}, "Failed to send reply message")
                }
            }
        } else {
            await msg.react("📝");

            if (cache.msgs == undefined) cache.msgs = [];
            cache.msgs.push(msg.id.id);
        }

        return await cache.set(msg.from, cache.get(msg.from));
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