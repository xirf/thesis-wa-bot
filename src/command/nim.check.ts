import type Message from "../lib/message"
import Database from "../database"

export default async (msg: Message): Promise<void> => {
    let nim = msg.text;
    let student = await Database.mahasiswa.findFirst({
        where: {
            nim: nim,
        },
        select: {
            id: true,
            nama: true,
            prodi: true,
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
                                    id: true,
                                },
                            },
                            status_pbb: true,
                        },
                    },
                },
            },
        },
    });

    if (!student) {
        msg.reply((await Database.template.findFirst({ where: { name: "nim.notfound" } })).content);
    } else {
        let template = (await Database.template.findFirst({ where: { name: "nim.found" } })).content

        let data = {
            nama: student.nama,
            prodi: student.prodi,
            judul: student.ta[ 0 ].judul,
            pembimbing: student.ta[ 0 ].pembimbing.map((v, i) => `${i + 1}. ${v.dosen.nama} (${v.status_pbb})`).join("\n"),
        }

        msg.reply(msg.parseTemplate(template, data));
    }
    return;
}