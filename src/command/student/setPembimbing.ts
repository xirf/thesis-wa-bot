import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../configs/response.json";

const command: Command = async (msg: Message, cache) => {
    try {
        // try to get number from message
        let isNumber = msg.text?.match(/\d+/g);
        let cachedData: any = (cache.get(msg.sender)).data;

        // if there is no number, return error
        if (!isNumber && msg.args.toLowerCase() === "semua") {
            msg.reply(response.error.invalidLecturer);
            return;
        }

        if (isNumber && msg.args.toLowerCase() !== "semua") {   
            let number = parseInt(isNumber[ 0 ])
            cachedData.lecturer = [ cachedData.lecturer[ number - 1 ] ];
        }

        msg.reply(response.lecturerSet);
        cache.set(msg.sender, { event: "student.collect", data: cachedData })

    } catch (error) {
        msg.reply(response.error.internalServerError);
        return;
    }
}


export default command;