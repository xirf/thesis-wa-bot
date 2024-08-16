import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import { sendReport } from "../shared/sendReport";

const command: Command = async (msg: Message, cache: any) => {
    try {
        let text = msg.text;

        if (text.toLowerCase() == "batal") {
            msg.reply(response.canceled);
            cache.set(msg.sender, { data: cache.data })
            return;
        } else if (text.toLowerCase() == "selesai") {
            if (cache.msgs == undefined || cache.msgs.length == 0)
                return await msg.reply(response.error.emptyReport);

            return await sendReport(msg, cache.msgs, cache.get(msg.sender), "student");
        }

        await msg.react();

        if (cache.msgs == undefined) cache.msgs = [];
        cache.msgs.push(msg.text);

        return await cache.set(msg.sender, cache.get(msg.sender));
    } catch (error) {
        logger.warn({ error, msg: "Error when running command" })
        return await msg.reply(response.error.internalServerError);
    }
}

export default command;