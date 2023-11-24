import db from "../db/client";
import { Reply } from "../types/Client";
import log from "../utils/logger";
import config from "../config";
import makeWASocket from "@whiskeysockets/baileys";


export default async function birthday(sock: ReturnType<typeof makeWASocket>, reply: Reply): Promise<void> {
    return new Promise(async (resolve) => {

        try {
            const today = new Date();
            const todayMonth = today.getMonth() + 1;
            const todayDate = today.getDate();


            const pasiens = await db.query(
                `SELECT telepon, nama FROM "public"."pasien" WHERE EXTRACT(MONTH FROM tgl_lahir) = $1 AND EXTRACT(DAY FROM tgl_lahir) = $2`,
                [ todayMonth, todayDate ]
            );

            const template = await db.query(`SELECT template from public.${config.tables.template} where name='birthday'`)
            const image = await db.query(`SELECT template from public.${config.tables.template} where name='birthday.image'`)

            log.info("Sending birthday card to " + pasiens.rows.length + " receipient")
            pasiens.rows.forEach(async (p) => {
                if (p.telepon && p.telepon.length > 8) {
                    let [ result ] = await sock.onWhatsApp(p.telepon)
                    if (result.exists) {
                        let tel = result.jid

                        // Another trycatch to prevent the bot from crashing when sending birthday card
                        try {
                            if (image.rows.length > 0 && image.rows[ 0 ].template.startsWith("http")) {
                                await reply({
                                    image: {
                                        url: image.rows[ 0 ].template,
                                    },
                                    caption: template.rows[ 0 ].template
                                }, tel)
                            } else {
                                await reply({
                                    text: template.rows[ 0 ].template ?? "Selamat ulang tahun yang penuh berkah! 🎂🎉\n\nHari ini adalah hari spesial yang mengingatkan kita untuk merayakan hidup dan kesehatan. 💪🫶\n\nKami di tim kesehatan selalu mendukungmu dalam menjaga kesehatan. 💯\n\nSemoga kamu memiliki hari yang menyenangkan dan sehat selalu! 😊"
                                }, tel)
                            }

                            log.info("Succesfully Send Birthday message to " + p.nama)
                        } catch (error) {
                            log.error("Failed to send birthday card to " + p.nama)
                            log.error(error)
                        }
                    } else {
                        log.warn(`User ${p.nama} don't have whatsapp account`)
                    }
                }
            });

            resolve();
        } catch (error) {
            log.error(error)
        }
    });
}