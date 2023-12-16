import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import { sendReport } from "../fragments/sendReport";

const command: Command = async (msg: Message, cache: any) => {
    try {
        let text = msg.text;
        let cachedData = cache.get(msg.sender);

        if (text.toLowerCase() == "batal") {
            msg.reply(response.canceled);
            cache.set(msg.sender, { data: cache.data })
            return;

        } else if (text.toLowerCase() == "selesai") {
            if (cachedData.msgs == undefined || cachedData.msgs.length == 0)
                return await msg.reply(response.error.emptyReport);

            return await sendReport(msg, cachedData.msgs, cachedData);
        }

        await msg.react();

        if (cachedData.msgs == undefined) cachedData.msgs = [];
        cachedData.msgs.push(msg.text);

        return await cache.set(msg.sender, cachedData);
    } catch (error) {
        logger.warn({
            error: {
                message: error.message,
                stack: error.stack
            },
            msg: "Error when running command"
        })
        return await msg.reply(response.error.internalServerError);
    }
}


export default command;