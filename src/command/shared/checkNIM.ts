import database from "../../database";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import templateParser from "../../utils/templateParser";
import { Message } from "whatsapp-web.js";
import client from "../../lib/waweb";

export default async (msg: Message, cache: any, type: 'student' | 'lecturer' = 'student') => {
    try {
        let studentInfo = await database.mahasiswa.findFirst({
            where: {
                nim: {
                    equals: msg.body
                }
            },
            select: {
                nama: true,
                nim: true,
                telepon: true,
                ta: {
                    select: {
                        id: true,
                        judul: true,
                        pembimbing: {
                            select: {
                                dosen: {
                                    select: {
                                        nama: true,
                                        telepon: true,
                                        nidn: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!studentInfo) {
            msg.reply(response.error.notFound)
            return;
        }

        if (!studentInfo.ta[ 0 ]) {
            msg.reply(response.error.TA.notFound)
            try {
                cache.del(msg.from)
            } catch (e) {
                logger.warn("User not found and cant clear cache. file: src/command/shared/checknim.ts")
            } finally {
                return;
            }
        }

        let reformattedData = {
            name: studentInfo.nama,
            nim: studentInfo.nim,
            telepon: studentInfo.telepon,
            taId: studentInfo.ta[ 0 ].id,
            title: studentInfo.ta[ 0 ].judul,
            lecturer: studentInfo.ta[ 0 ].pembimbing.map((pembimbing) => {
                return {
                    name: pembimbing.dosen.nama,
                    nidn: pembimbing.dosen.nidn,
                    telepon: pembimbing.dosen.telepon
                }
            })
        }

        let message = templateParser(response.nimFound.default, {
            name: reformattedData.name,
            nim: reformattedData.nim,
            title: reformattedData.title,
            lecturer: reformattedData.lecturer.map((lecturer, i) => `Pembimbing ${i + 1}: *${lecturer.name}* (${lecturer.nidn})`).join("\n")
        });


        cache.set(msg.from, {
            event: type == 'student' ? "student.setPembimbing" : "lecturer.giveReport",
            data: reformattedData
        })


        await msg.reply(message);
        if (type == 'student')
            client.sendMessage(msg.from, response.nimFound.student)
        else
            client.sendMessage(msg.from, response.nimFound.lecturer)

        return;
    } catch (error) {
        msg.reply(response.error.internalServerError);
        logger.warn({ error: error, msg: "Error when checking nim filename:" + __dirname + __filename })
        return;
    }
}
