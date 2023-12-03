import { Command } from "../../types";
import database from "../../database";
import Message from "../../lib/message";
import response from "../../configs/response.json";

const command: Command = async (msg: Message, cache) => {
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
                ta: {
                    select: {
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

        let reformattedData = {
            name: studentInfo.nama,
            nim: studentInfo.nim,
            title: studentInfo.ta[ 0 ].judul,
            lecturer: studentInfo.ta[ 0 ].pembimbing.map((pembimbing) => {
                return {
                    name: pembimbing.dosen.nama,
                    nidn: pembimbing.dosen.nidn,
                    telepon: pembimbing.dosen.telepon
                }
            })
        }

        let message = response.nimFound[ 0 ]
            .replace("{name}", reformattedData.name)
            .replace("{nim}", reformattedData.nim)
            .replace("{title}", reformattedData.title)
            .replace("{lecturer}", reformattedData.lecturer.map((lecturer, i) => `Pembimbing ${i + 1}: *${lecturer.name}* (${lecturer.nidn})`).join("\n"))



        cache.set(msg.sender, { event: "student.setPembimbing", data: reformattedData })

        await msg.reply(message);
        await msg.sendText(msg.sender, response.nimFound[ 1 ])
        return;
    } catch (error) {
        msg.reply(response.error.internalServerError);
        return;
    }
}


export default command;