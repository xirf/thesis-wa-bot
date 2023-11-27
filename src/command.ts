import Message from "./lib/message";
import cache from "./cache/cache";
import Database from "./database";

export default async (msg: Message) => {
    if (cache.has(msg.sender)) {
        let cacheData = cache.get(msg.sender)!;
        if ((cacheData as { event: string }).event === "nim") {
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
                msg.reply("NIM tidak ditemukan, silahkan coba lagi.");
                return;
            }

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

        }
    }

    switch (msg.command) {
        case "start":
            let startTemplate = (await Database.template.findFirst({
                where: {
                    name: "start"
                }
            })).content

            msg.reply(startTemplate);
            cache.set(msg.sender, { event: "nim" })

            break;
        case "ping":
            msg.reply("Pong!");
            break;
        case "help":
            msg.reply("Help!");
            break;
        default:
            break;
    }
};