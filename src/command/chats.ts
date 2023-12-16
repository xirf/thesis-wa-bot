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
        response.reportTemplate.student.substring(0, 20),
        response.reply.substring(0, 20)
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

    const telepon = await findTelepon(name, nim, title);

    return handleResponse(msg, telepon, isLecturer, "lecturer");
}

/**
 * Handle student's quoted message
 */
async function handleStundent({ msg, conversation, isLecturer }: HandleLecturer): Promise<boolean> {
    const { name } = extractDetails(conversation);

    if (!name) return false;

    const telepon = await database.dosen.findFirst({
        where: { nama: name },
        select: { telepon: true },
    });

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

async function findTelepon(name: string, nim: string, title: string) {
    return await database.mahasiswa.findFirst({
        where: {
            nama: name,
            OR: [
                { nim: nim || "" },
                { ta: { some: { judul: title || "" } } }
            ]
        },
        select: { telepon: true }
    });
}

async function handleResponse(msg: Message, telepon: any, isLecturer: IsLecturer, type: string) {
    if (!telepon) return false;

    const [ result ] = await msg.socket.onWhatsApp(telepon.telepon);

    if (result.exists) {
        if (await checkComplete(msg, result, response, isLecturer)) return true;

        await sendReply(msg, {
            nama: isLecturer.nama,
            nidn: isLecturer.nidn,
            text: msg.text,
            type: type
        }, response);

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

async function sendReply(msg: Message, target: any, response: any) {
    const answer = templateParser(response.reply, {
        name: target.nama,
        number: target.nidn,
        reply: target.text
    })

    await msg.sendText(target, answer);
    msg.reply(templateParser(response.reportSent, {
        lecturer: target.nama.substring(0, 20),
    }));
}