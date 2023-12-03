import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";

const command: Command = async (msg: Message, cache) => {
    try {
        // try to get number from message
        let isNumber = msg.text?.match(/\d+/g);
        let cachedData: any = (cache.get(msg.sender)).data;

        // if there is no number, return error
        if (!isNumber && msg.text?.toLowerCase() === "semua") {
            msg.reply(response.error.invalidLecturer);
            return;
        }

        if (isNumber && msg.text.toLowerCase() !== "semua") {
            let number = parseInt(isNumber[ 0 ])
            cachedData.lecturer = [ cachedData.lecturer[ number - 1 ] ];
        }

        await msg.reply(
            response.lecturerSet[ 0 ]
                .replace("{lecturer}",
                    cachedData.lecturer
                        .map((lecturer, i) => `${i > 0 ? "dan" : ""} *${lecturer.name}*`)
                        .join(" ")
                )
        );
        await msg.sendText(msg.sender, response.lecturerSet[ 1 ]);
        await msg.sendText(msg.sender, response.lecturerSet[ 2 ]);

        // msg.reply(response.lecturerSet);
        cache.set(msg.sender, { event: "student.collect", data: cachedData })


    } catch (error) {
        logger.warn({ error, msg: "Error when when setting lecturer" })
        msg.reply(response.error.internalServerError);
        return;
    }
}


export default command;