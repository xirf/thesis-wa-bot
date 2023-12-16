import { Command } from "../../types";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";

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

            return await sendToLecturer({ msg, msgs: cache.msgs, cachedData: (cache.get(msg.sender)).data })
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

async function sendToLecturer({ msg, msgs, cachedData }: { msg: Message, msgs: string[], cachedData: any }) {
    try {
        let text = response.reportTemplate.student
            .replace("{name}", cachedData.name)
            .replace("{nim}", cachedData.nim)
            .replace('{title}', cachedData.title)
            .replace("{report}", msgs.map((msg, i) => `${i + 1}. ${msg}`).join("\n"))


        cachedData.lecturer.forEach(async ({ telepon, name }: { telepon: string, name: string }) => {
            if (telepon.startsWith("0")) telepon = telepon.replace("0", "62");
            let [ result ] = await msg.socket.onWhatsApp(telepon)

            if (!result || result.exists == undefined) {
                logger.warn(`Lecturer ${name.substring(0, 10)} with number ${telepon} don't exist in Whatsapp`)
                await msg.reply(response.reportNotSent.replace("{lecturer}", name.substring(0, 20)).replace("{reason}", "Nomor Whatsapp tidak ditemukan"))
                return;
            }

            if (result.exists) {
                await msg.sendText(result.jid, text);
                await msg.reply(response.reportSent.replace("{lecturer}", name.substring(0, 20)))
            } else {
                logger.warn(`Lecturer ${name.substring(0, 10)} with number ${telepon} don't exist in Whatsapp`)
            }
        });

    } catch (error) {
        logger.warn({ error, msg: `Failed to send report to lecturer ${cachedData.lecturer.map((lecturer) => lecturer.name).join(", ")}` })
        msg.reply(response.error.internalServerError);
    }
}

export default command;