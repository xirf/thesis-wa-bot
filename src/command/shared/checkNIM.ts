import database from "../../database";
import Message from "../../lib/message";
import response from "../../../config/response.json";
import logger from "../../utils/logger";
import templateParser from "../../utils/templateParser";

export default async (msg: Message, cache: any, type: 'student' | 'lecturer' = 'student') => {
    try {
        let studentInfo = await database.mahasiswa.findFirst({
            where: {
                nim: {
                    equals: msg.text
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
            return;
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


        cache.set(msg.sender, {
            event: type == 'student' ? "student.setPembimbing" : "lecturer.giveReport",
            data: reformattedData
        })


        await msg.reply(message);
        if (type == 'student')
            await msg.sendText(msg.sender, response.nimFound.student);
        else
            await msg.sendText(msg.sender, response.nimFound.lecturer);

        return;
    } catch (error) {
        msg.reply(response.error.internalServerError);
        console.log(error)
        logger.warn({ error: error, msg: "Error when checking nim filename:" + __dirname + __filename })
        return;
    }
}
