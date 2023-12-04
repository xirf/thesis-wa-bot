import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";

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

            let lecturerName = cachedData.data.lecturer
                .filter((lecturer) =>
                    lecturer.telepon.slice(-10) == msg.sender.split("@")[ 0 ].slice(-10)
                );

            let msgs = cachedData.msgs.map((msg, i) => `${i + 1}. ${msg}`).join("\n");
            let report = response.reportTemplate.lecturer
                .replace("{lecturer}", lecturerName[ 0 ].name)
                .replace("{report}", msgs)


            let [ result ] = await msg.socket.onWhatsApp(cachedData.data.telepon)
            if (result.exists) {
                console.log(result.jid)
                await msg.sendText(result.jid, report);
                await msg.reply(response.reportSent?.replace("{lecturer}", cachedData.data.name.substring(0, 20)))
            }

            return;
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