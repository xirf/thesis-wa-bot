// reportUtils.ts
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import templateParser from "../../utils/templateParser";
import database from "../../database";

export async function sendReport(msg: Message, msgs: string[], cachedData: any, type: 'lecturer' | 'student' = 'student') {
    try {
        let text = templateParser(response.reportTemplate[ type ], {
            name: cachedData.data.name,
            nim: cachedData.data.nim,
            title: cachedData.data.title,
            report: msgs.map((msg, i) => `${i + 1}. ${msg}`).join("\n")
        });



        if (type == 'lecturer') {
            cachedData.name = cachedData.lecturer.filters(({ telepon }) => {
                msg.sender.split("@")[ 0 ].slice(-8) == telepon.slice(-8)
            }).map(({ name }) => name)[ 0 ];
        }

        let mhsid = await database.mahasiswa.findFirst({
            where: {
                nim: cachedData.data.nim
            }
        })

        let saved = await database.historyBimbingan.create({
            data: {
                mahasiswa: {
                    connect: {
                        id: mhsid.id
                    },
                },
                type: type == 'lecturer' ? 'pembimbing' : 'mahasiswa',
                senderName: cachedData.data.name,
                senderNumber: msg.sender.split("@")[ 0 ],
                content: msgs.map((msg, i) => `${i + 1}. ${msg}`).join("\n")
            }
        })

        if (saved) {
            console.log(saved)
            logger.info(`Report from ${type} ${cachedData.data.name} with nim ${cachedData.data.nim} has been saved to database`);
        } else {
            console.log(saved)
            logger.warn(`Failed to save report from ${type} ${cachedData.data.name} with nim ${cachedData.data.nim} to database`);
        }


        type == 'lecturer' ? cachedData.data.lecturer = [ cachedData.data ] : cachedData.data.lecturer;


        cachedData.data.lecturer
            .forEach(async ({ telepon, name }: { telepon: string, name: string }) => {
                if (telepon.startsWith("0")) telepon = telepon.replace("0", "62");
                let [ result ] = await msg.socket.onWhatsApp(telepon);

                if (!result || result.exists == undefined) {
                    logger.warn(`${type} ${name.substring(0, 10)} with number ${telepon} don't exist in Whatsapp`);

                    await msg.reply(
                        templateParser(response.reportNotSent, {
                            lecturer: name.substring(0, 20),
                            reason: "Nomor Whatsapp tidak ditemukan"
                        })
                    );

                    return;
                }


                if (result.exists) {
                    await msg.sendText(result.jid, text);
                    await msg.reply(
                        templateParser(response.reportSent, {
                            lecturer: type == "lecturer" ? name.substring(0, 20) : "Pembimbing",
                        })
                    );

                } else {
                    logger.warn(`${type} ${name.substring(0, 10)} with number ${telepon} don't exist in Whatsapp`);
                }
            });

    } catch (error) {
        console.log(error)
        logger.warn({ error, msg: `Failed to send report to ${type}` });
        msg.reply(response.error.internalServerError);

        return;
    }
}
