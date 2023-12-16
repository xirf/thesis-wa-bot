// reportUtils.ts
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";

export async function sendReport(msg: Message, msgs: string[], cachedData: any) {
    try {
        let text = response.reportTemplate.student
            .replace("{name}", cachedData.name)
            .replace("{nim}", cachedData.nim)
            .replace('{title}', cachedData.title)
            .replace("{report}", msgs.map((msg, i) => `${i + 1}. ${msg}`).join("\n"));

        cachedData.lecturer.forEach(async ({ telepon, name }: { telepon: string, name: string }) => {
            if (telepon.startsWith("0")) telepon = telepon.replace("0", "62");
            let [ result ] = await msg.socket.onWhatsApp(telepon);

            if (!result || result.exists == undefined) {
                logger.warn(`Lecturer ${name.substring(0, 10)} with number ${telepon} don't exist in Whatsapp`);
                await msg.reply(response.reportNotSent.replace("{lecturer}", name.substring(0, 20)).replace("{reason}", "Nomor Whatsapp tidak ditemukan"));
                return;
            }

            if (result.exists) {
                await msg.sendText(result.jid, text);
                await msg.reply(response.reportSent.replace("{lecturer}", name.substring(0, 20)));
            } else {
                logger.warn(`Lecturer ${name.substring(0, 10)} with number ${telepon} don't exist in Whatsapp`);
            }
        });

    } catch (error) {
        logger.warn({ error, msg: `Failed to send report to lecturer ${cachedData.lecturer.map((lecturer) => lecturer.name).join(", ")}` });
        msg.reply(response.error.internalServerError);
    }
}
