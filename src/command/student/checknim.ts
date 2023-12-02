import { Command } from "../../types";
import database from "../../database";
import Message from "../../lib/message";
import response from "../../configs/response.json";

const command: Command = async (msg: Message, cache) => {
    try {
        let studentInfo = await database.mahasiswa.findFirst({
            where: {
                nim: {
                    equals: msg.sender.split("@")[ 0 ].slice(-10)
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
                    nidn: pembimbing.dosen.nidn
                }
            })
        }

        let message = response.nimFound
            .replace("{name}", reformattedData.name)
            .replace("{nim}", reformattedData.nim)
            .replace("{title}", reformattedData.title)

        reformattedData.lecturer.forEach((lecturer, index) => {
            message.replace(`{lecturer${index + 1}}`, `${lecturer.name} (${lecturer.nidn})`)
        })

        cache.set(msg.sender, { event: "student.setPembimbing", data: reformattedData })
        msg.reply(message);
        return;
    } catch (error) {
        msg.reply(response.error.internalServerError);
        return;
    }
}


export default command;