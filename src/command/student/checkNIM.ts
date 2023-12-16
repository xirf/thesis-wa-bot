import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import checkNIM from "../shared/checkNIM";

const command: Command = async (msg: Message, cache) => {
    try {
        return await checkNIM(msg, cache, "student");
    } catch (error) {
        msg.reply(response.error.internalServerError);
        logger.warn({ error, msg: "Error when checking nim" })
        return;
    }
}


export default command;