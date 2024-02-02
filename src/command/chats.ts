import Message from "../lib/message";
import response from "../../config/response.json";
import database from "../database";
import templateParser from "../utils/templateParser";

interface IsLecturer {
    id: number;
    nama: string;
    nidn: string;
    email: string;
    telepon: string;
}

interface HandleLecturer {
    msg: Message;
    conversation: string;
    isLecturer: IsLecturer;
}

export default async function handleQuotedMessage(msg: Message, isLecturer: IsLecturer): Promise<boolean> {
    const conversation = msg.quoted.contextInfo?.quotedMessage?.conversation;
    const validQuotedMessage = [
        response.reportTemplate.lecturer.substring(0, 20),
        response.reportTemplate.student.substring(0, 13),
        response.reply.substring(0, 10)
    ]


    if (conversation && validQuotedMessage.some(txt => conversation.includes(txt))) {
        const handler = isLecturer ? handleLecturer : handleStundent;
        return handler({ msg, conversation, isLecturer });
    }

    return false;
}


/**
 * Handle lecturer's quoted message
 */
async function handleLecturer({ msg, conversation, isLecturer }: HandleLecturer): Promise<boolean> {
    const { name, title, nim } = extractDetails(conversation);

    if (!name && (!title || !nim)) return false;

    const telepon = await findTelepon(name, nim, title, isLecturer);

    return handleResponse(msg, telepon, isLecturer, "lecturer");
}

/**
 * Handle student's quoted message
 */
async function handleStundent({ msg, conversation, isLecturer }: HandleLecturer): Promise<boolean> {
    const { name } = extractDetails(conversation);

    if (!name) return false;

    let telepon: any;

    if (isLecturer) {
        telepon = await database.mahasiswa.findFirst({
            where: {
                nama: name
            },
            select: {
                telepon: true,
                nama: true,
                nim: true,
                id: true
            },
        });
    } else {
        telepon = await database.dosen.findFirst({
            where: { nama: name },
            select: {
                telepon: true,
                nama: true,
            },
        });

    }

    console.log("From handleStudent", telepon)

    return handleResponse(msg, telepon, isLecturer, "student");
}





function extractDetails(conversation: string) {
    const nameMatch = conversation.match(/Nama: _([^_]*)_/);
    const titleMatch = conversation.match(/Judul skripsi: \*_(.*?)_\*/);
    const nimMatch = conversation.match(/NIM: \*_(.*?)_\*/);

    return {
        name: nameMatch ? nameMatch[ 1 ] : null,
        title: titleMatch ? titleMatch[ 1 ] : null,
        nim: nimMatch ? nimMatch[ 1 ] : null,
    };
}

async function findTelepon(name: string, nim: string, title: string, isLecturer: any) {
    if (isLecturer) {
        let whereQuery: any = {
            nama: name,
            OR: [
                { nim: nim }
            ]
        }

        if (title) {

            let ta = await database.ta.findFirst({
                where: {
                    judul: title
                },
                select: {
                    id_mhs: true
                }
            })

            whereQuery = {
                nama: name,
                OR: [
                    { id: ta?.id_mhs }
                ]
            }
        }


        let res = await database.mahasiswa.findFirst({
            where: whereQuery,
            select: {
                telepon: true,
                nama: true,
                nim: true,
                id: true
            }
        });

        return res;

    } else {
        return await database.dosen.findFirst({
            where: {
                nama: name,
            },
            select: {
                telepon: true,
                nama: true,
            },
        });
    }
}

async function handleResponse(msg: Message, telepon: any, isLecturer: IsLecturer, type: string) {
    if (!telepon) return false;

    const [ result ] = await msg.socket.onWhatsApp(telepon.telepon);

    if (result.exists) {
        if (await checkComplete(msg, result, response, isLecturer)) return true;

        let replaceParams = {
            nama: telepon?.nama,
            nidn: telepon?.nim,
            nim: telepon?.nim,
            telepon: result.jid,
            text: msg.text,
            type: type,
            ta: null,
            id: telepon?.id,
        }

        if (!isLecturer) {
            let _student = await database.mahasiswa.findFirst({
                where: {
                    telepon: {
                        contains: msg.sender.split("@")[ 0 ].slice(-8)
                    }
                },
                select: {
                    nama: true,
                    nim: true,
                    id: true,
                    ta: {
                        select: {
                            id: true
                        },
                    }
                },
            });

            replaceParams.nama = _student.nama;
            replaceParams.nim = _student.nim;
            replaceParams.ta = _student.ta[ 0 ].id
            replaceParams.id = _student.id
        }

        console.log(replaceParams)
        await sendReply(msg, replaceParams, response, isLecturer);

        return true;
    } else {
        await msg.reply(response.error.notFound);
        return true;
    }
}

async function checkComplete(msg: Message, result, response, isLecturer) {
    if (msg.text === "selesai") {
        const txt = response.reportAccepted.replace("{lecturer}", isLecturer.nama);
        await msg.sendText(result.jid, txt);
        return true;
    } else {
        return false;
    }
}

async function sendReply(msg: Message, target: any, response: any, isLecturer) {
    let responseTemplate = isLecturer ? response.reply : response.reply.replace("Nidn", "NIM")

    console.log(target)

    const answer = templateParser(responseTemplate, {
        name: isLecturer ? isLecturer.nama : target.nama,
        number: isLecturer ? target.nidn : target.nim,
        reply: target.text
    })

    await database.historyBimbingan.create({
        data: {
            mahasiswa: {
                connect: {
                    id: target.id ?? parseInt(target.nim)
                }
            },
            content: target.text,
            type: isLecturer ? "pembimbing" : "mahasiswa",
            senderName: isLecturer ? isLecturer.nama : target.nama,
            senderNumber: msg.sender.split("@")[ 0 ],
        }
    })

    await msg.sendText(target.telepon, answer);
    msg.reply(templateParser(response.reportSent, {
        lecturer: isLecturer ? target?.nama : "Dosen Pembimbing",
    }));
}