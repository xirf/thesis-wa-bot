import response from ",./../../config/response.json"
import { Message } from "whatsapp-web.js"
import cache from "../../cache/cache"
import templateParser from "../../utils/templateParser"
import getStudent from "./getStudent"
import client from "../../lib/waweb"

export default async (msg: Message) => {
    let { student, error } = await getStudent(msg);

    if (error) {
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


    cache.set(msg.from, {
        event: "student.setPembimbing",
        data: reformattedData
    })

    await msg.reply(message);
    await client.sendMessage(msg.from, response.nimFound.student)
}       