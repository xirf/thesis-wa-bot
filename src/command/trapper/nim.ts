import type Message from "../../lib/message"
import Database from "../../database"
import cache from "../../cache/cache";

export default async (msg: Message): Promise<void> => {
    let nim = msg.text;
    let student = await Database.mahasiswa.findFirst({
        where: {
            nim: nim,
        },
        select: {
            nama: true,
            prodi: true,
            ta: {
                select: {
                    judul: true,
                    pembimbing: {
                        select: {
                            dosen: {
                                select: {
                                    nama: true,
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

        let template = (await Database.template.findFirst({
            where: {
                name: "nim.confirmation"
            }
        })).content

        let data = {
            nama: student.nama,
            prodi: student.prodi,
            judul: student.ta[ 0 ].judul,
            pembimbing: [ ...student.ta[ 0 ].pembimbing.map(v => v.dosen.nama) ].join(", "),
        }

        msg.reply(msg.parseTemplate(template, data));
        cache.set(msg.sender, { event: "nim.await.confirmation" })
    }
    return;
}