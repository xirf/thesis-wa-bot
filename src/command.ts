import Message from "./lib/message";
import cache from "./cache/cache";
import nim from "./command/nim.check";
import Database from "./database";

export default async (msg: Message) => {
    if (cache.has(msg.sender)) {
        let cacheData = cache.get(msg.sender)!;
        switch ((cacheData as { event: string }).event) {
            case "nim.check":
                nim(msg);
                break;
            case "report.start":

                break;
            default:
                break;
        }
    }

    switch (msg.command) {
        case "start":
            let startTemplate = await msg.getTemplate("start");
            msg.reply(startTemplate);
            cache.set(msg.sender, { event: "nim.check" })

            break;

        case "ping":
            msg.reply("Pong!");
            break;

        case "help":
            let helpTemplate = await msg.getTemplate("help");
            msg.reply(helpTemplate);
            break;

        case "p1":
        case "p2":
            let startReportTemplate = await msg.getTemplate("report.start");
            let noPembimbing = await Database.pembimbing.findMany({
                where: {
                    tlp_mhs: msg.sender.split("@")[ 0 ].replace("+62", "0"),
                },
                select: {
                    id: true,
                    dosen: {
                        select: {
                            nama: true,
                            telepon: true,
                            id: true,
                        },
                    },
                    ta: {
                        select: {
                            judul: true,
                            mahasiswa: {
                                select: {
                                    nama: true,
                                    nim: true,
                                },
                            }
                        }
                    }
                },
            });

            if (noPembimbing.length === 0) {
                msg.reply("Anda tidak memiliki mahasiswa bimbingan");
                console.log(JSON.stringify(noPembimbing, null, 2))
                break;
            }

            let pIndex = msg.command === "p1" ? 0 : 1;



            msg.reply(startReportTemplate);
            cache.set(msg.sender, {
                event: "report.start", data: {
                    judul: noPembimbing[ pIndex ].ta.judul,
                    dosen: noPembimbing[ pIndex ].dosen.nama,
                    telepon: noPembimbing[ pIndex ].dosen.telepon,
                    nama: noPembimbing[ pIndex ].ta[ 0 ].mahasiswa.nama,
                    nim: noPembimbing[ pIndex ].ta[ 0 ].mahasiswa.nim,
                    template: "",
                }
            });

            break;

        default:
            break;
    }
};

