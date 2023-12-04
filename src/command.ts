import Message from "./lib/message";
import cache from "./cache/cache";
import response from "../config/response.json";
import database from "./database";
import path, { join, resolve } from "path";
import logger from "./utils/logger";
import type { Command } from "./types";

const log = logger.child({ module: "command" });

interface IsLecturer {
    id: number;
    nama: string;
    nidn: string;
    email: string;
    telepon: string;
}

export default async (msg: Message) => {
    let isLecturer = await database.dosen.findFirst({ where: { telepon: { contains: msg.sender.split("@")[ 0 ].slice(-10) } } });
    let cachedData: any = cache.get(msg.sender);


    if (msg.quoted !== null) {
        let res = await handleQuotedMessage(msg, isLecturer)
        if (res) return;
    }

    // This part is for the default command
    switch (msg.command) {
        case "start":
            cache.del(msg.sender)
            if (isLecturer) {
                msg.reply(response.start.lecturer);
                cache.set(msg.sender, { event: "lecturer.checknim" })
            } else {
                msg.reply(response.start.student);
                cache.set(msg.sender, { event: "student.checknim" })
            }
            return;

        case "ping":
            msg.reply("Pong!");
            return;

        default:
            break;
    }

    // Check if there is a cached data
    if (cachedData) {
        try {
            // Get the directory
            let moduleDir = cachedData.event?.replaceAll(".", path.sep);
            let fullDir = join(__dirname, "command", moduleDir);

            // Import the command file using dynamic import
            let command: Command = await import(fullDir).then((module) => module.default);

            // Run the command
            if (command) command(msg, cache);
        } catch (error) {
            log.warn({ error, msg: "Error when running command" });
        }
    }
};


async function handleQuotedMessage(msg: Message, isLecturer: IsLecturer): Promise<boolean> {
    return new Promise(async (resolve, _) => {
        const conversation = msg.quoted.contextInfo?.quotedMessage?.conversation;
        const validQuotedMessage = [ "Laporan skripsi dari", "Anda mendapatkan laporan", "Balasan dari" ];

        if (conversation && validQuotedMessage.some(txt => conversation.includes(txt))) {
            if (isLecturer != null) {
                console.log("lecturer")
                let res = await handleLecturer({ msg, conversation, isLecturer });
                resolve(res);
            } else {
                console.log("student")
                let res = await handleStundent({ msg, conversation, isLecturer });
                resolve(res);
            }
        } else {
            resolve(false);
        }
    });
}


// types for handleLecturer
interface HandleLecturer {
    msg: Message;
    conversation: string;
    isLecturer: IsLecturer;
}

function handleLecturer({ msg, conversation, isLecturer }: HandleLecturer): Promise<boolean> {
    return new Promise(async (resolve, _) => {
        // Extract name templated like this "name: _name here_"
        const nameMatch = conversation.match(/Nama: _([^_]*)_/);
        const titleMatch = conversation.match(/Judul skripsi: \*_(.*?)_\*/)
        const nimMatch = conversation.match(/NIM: \*_(.*?)_\*/);

        // Extracted values
        const name = nameMatch ? nameMatch[ 1 ] : null;
        const title = titleMatch ? titleMatch[ 1 ] : null;
        const nim = nimMatch ? nimMatch[ 1 ] : null;

        if (!name && (!title || !nim)) resolve(false);


        const telepon = await database.mahasiswa.findFirst({
            where: {
                nama: name,
                OR: [
                    { nim: nim || "" },
                    { ta: { some: { judul: title || "" } } }
                ]
            },
            select: {
                telepon: true
            }
        });

        console.log(telepon)

        if (!telepon) return resolve(false);

        const [ result ] = await msg.socket.onWhatsApp(telepon.telepon);

        if (result.exists) {
            if (msg.text === "selesai") {
                const txt = response.reportAccepted.replace("{lecturer}", isLecturer.nama);
                await msg.sendText(result.jid, txt);
                resolve(true);
            }

            const answer = response.reply
                .replace("{name}", isLecturer.nama)
                .replace("{number}", isLecturer.nidn)
                .replace("{reply}", msg.text);

            await msg.sendText(result.jid, answer);
            await msg.reply(response.reportSent?.replace("{lecturer}", name.substring(0, 20)));
            resolve(true);
        } else {
            await msg.reply(response.error.notFound);
            resolve(true);
        }
    })
}

function handleStundent({ msg, conversation, isLecturer }: HandleLecturer): Promise<boolean> {
    return new Promise(async (resolve, _) => {
        const nameMatch = conversation.match(/Nama: _([^_]*)_/);

        const name = nameMatch ? nameMatch[ 1 ] : null;

        if (!name) return resolve(false);

        const telepon = await database.dosen.findFirst({
            where: {
                nama: name,
            },
            select: {
                telepon: true,
            }
        });

        const sender = await database.mahasiswa.findFirst({
            where: {
                telepon: {
                    contains: msg.sender.split("@")[ 0 ].slice(-10)
                }
            }
        })


        if (!telepon) return resolve(false);
        console.log(telepon.telepon)
        console.log(sender)
        const [ result ] = await msg.socket.onWhatsApp(telepon.telepon);

        if (result.exists) {
            const answer = response.reply
                .replace("{name}", sender.nama)
                .replace("{number}", sender.nim)
                .replace("Nidn", "NIM")
                .replace("{reply}", msg.text);

            await msg.sendText(result.jid, answer);
            await msg.reply(response.reportSent?.replace("{lecturer}", name.substring(0, 20)));
            resolve(true);
        } else {
            await msg.reply(response.error.notFound);
            resolve(true);
        }
    })
}