import database from "../database"
import Message from "../lib/message"
import response from ",./../../config/response.json"
import cache from "../cache/cache"
import templateParser from "../utils/templateParser"

export default async (msg: Message) => {
    let student = await database.mahasiswa.findFirst({
        where: {
            telepon: {
                contains: msg.sender.split("@")[ 0 ].slice(-10)
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
    })

    if (!student) {
        msg.reply(response.error.notRegistered)
        return;
    }

    if (!student.ta[ 0 ]) {
        msg.reply(response.error.TA.notFound)
        return;
    }

    let reformattedData = {
        name: student.nama,
        nim: student.nim,
        telepon: student.telepon,
        taId: student.ta[ 0 ].id,
        title: student.ta[ 0 ].judul,
        lecturer: student.ta[ 0 ].pembimbing.map((pembimbing) => {
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
        event: "student.setPembimbing",
        data: reformattedData
    })

    await msg.reply(message);
    await msg.sendText(msg.sender, response.nimFound.student);
}       