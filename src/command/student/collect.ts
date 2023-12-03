import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../configs/response.json";

const command: Command = async (msg: Message, cache: any) => {
    try {
        let text = msg.text;

        if (text.toLowerCase() == "batal") {
            msg.reply(response.canceled);
            cache.set(msg.sender, { data: cache.data })
        }


    } catch (error) {
        msg.reply(response.error.internalServerError);
        return;
    }
}


export default command;