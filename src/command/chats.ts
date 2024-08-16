import Message from "../lib/message";
import response from "../../config/response.json";
import database from "../database";
import templateParser from "../utils/templateParser";


/**
 * Handles a quoted message and determines if it should be processed by a lecturer or student handler.
 * 
 * @param msg - The message object.
 * @param isLecturer - The lecturer information.
 * @returns A promise that resolves to a boolean indicating if the message was handled.
 */
export default async function handleQuotedMessage(msg: Message, isLecturer: IsLecturer): Promise<boolean> {
    const conversation = msg.quoted?.contextInfo?.quotedMessage?.conversation;
    const validQuotedMessage = [
        response.reportTemplate.lecturer.substring(0, 20),
        response.reportTemplate.student.substring(0, 13),
        response.reply.substring(0, 10)
    ];

    if (conversation && validQuotedMessage.some(txt => conversation.includes(txt))) {
        const handler = isLecturer ? handleLecturer : handleStundent;
        return handler({ msg, conversation, isLecturer });
    }

    return false;
}

/**
 * Handles a lecturer's quoted message.
 * 
 * @param params - The parameters for handling the lecturer's message.
 * @returns A promise that resolves to a boolean indicating if the message was handled.
 */
async function handleLecturer({ msg, conversation, isLecturer }: HandleLecturer): Promise<boolean> {
    const { name, title, nim } = extractDetails(conversation);

    if (!name && (!title || !nim)) return false;

    const telepon = await findTelepon(name, nim, title, isLecturer);

    return handleResponse(msg, telepon, isLecturer, "lecturer");
}

/**
 * Handles a student's quoted message.
 * 
 * @param params - The parameters for handling the student's message.
 * @returns A promise that resolves to a boolean indicating if the message was handled.
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

    return handleResponse(msg, telepon, isLecturer, "student");
}

/**
 * Extracts details such as name, title, and NIM from the conversation string.
 * 
 * @param conversation - The conversation string.
 * @returns An object containing the extracted details.
 */
function extractDetails(conversation: string) {
    const nameMatch = conversation.match(/Nama: _([^_]*)_/);
    const titleMatch = conversation.match(/Judul skripsi: \*_(.*?)_\*/);
    const nimMatch = conversation.match(/NIM: \*_(.*?)_\*/);

    return {
        name: nameMatch ? nameMatch[1] : null,
        title: titleMatch ? titleMatch[1] : null,
        nim: nimMatch ? nimMatch[1] : null,
    };
}

/**
 * Finds the telephone number based on the provided details.
 * 
 * @param name - The name of the person.
 * @param nim - The NIM of the person.
 * @param title - The title of the thesis.
 * @param isLecturer - Indicates if the person is a lecturer.
 * @returns A promise that resolves to the telephone information.
 */
async function findTelepon(name: string, nim: string, title: string, isLecturer: any) {
    if (isLecturer) {
        let whereQuery: any = {
            nama: name,
            OR: [
                { nim: nim }
            ]
        };

        if (title) {
            let ta = await database.ta.findFirst({
                where: {
                    judul: title
                },
                select: {
                    id_mhs: true
                }
            });

            whereQuery = {
                nama: name,
                OR: [
                    { id: ta?.id_mhs }
                ]
            };
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

/**
 * Handles the response to the message.
 * 
 * @param msg - The message object.
 * @param telepon - The telephone information.
 * @param isLecturer - The lecturer information.
 * @param type - The type of the message (lecturer or student).
 * @returns A promise that resolves to a boolean indicating if the response was handled.
 */
async function handleResponse(msg: Message, telepon: any, isLecturer: IsLecturer, type: string) {
    if (!telepon) return false;
    if (telepon?.telepon.startsWith("08")) telepon.telepon = telepon.telepon.replace("0", "62");

    const [result] = await msg.socket.onWhatsApp(telepon.telepon);

    if (result?.exists != undefined && result.exists) {
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
        };

        if (!isLecturer) {
            let _student = await database.mahasiswa.findFirst({
                where: {
                    telepon: {
                        contains: msg.sender.split("@")[0].slice(-8)
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
            replaceParams.ta = _student.ta[0].id;
            replaceParams.id = _student.id;
        }

        await sendReply(msg, replaceParams, response, isLecturer);

        return true;
    } else {
        await msg.reply(response.error.numberInvalid);
        return true;
    }
}

/**
 * Checks if the message indicates the completion of a report.
 * 
 * @param msg - The message object.
 * @param result - The result from the WhatsApp API.
 * @param response - The response configuration.
 * @param isLecturer - The lecturer information.
 * @returns A promise that resolves to a boolean indicating if the report is complete.
 */
async function checkComplete(msg: Message, result, response, isLecturer) {
    if (msg.text?.toLowerCase() === "selesai") {
        const txt = response.reportAccepted.replace("{lecturer}", isLecturer.nama);
        await msg.sendText(result.jid, txt);
        return true;
    } else {
        return false;
    }
}

/**
 * Sends a reply to the message.
 * 
 * @param msg - The message object.
 * @param target - The target information.
 * @param response - The response configuration.
 * @param isLecturer - Indicates if the sender is a lecturer.
 */
async function sendReply(msg: Message, target: any, response: any, isLecturer) {
    let responseTemplate = isLecturer ? response.reply : response.reply.replace("Nidn", "NIM");

    const answer = templateParser(responseTemplate, {
        name: isLecturer ? isLecturer.nama : target.nama,
        number: isLecturer ? target.nidn : target.nim,
        reply: target.text
    });

    await database.historybimbingan.create({
        data: {
            mahasiswa: {
                connect: {
                    id: target.id ?? parseInt(target.nim)
                }
            },
            content: target.text,
            type: isLecturer ? "pembimbing" : "mahasiswa",
            senderName: isLecturer ? isLecturer.nama : target.nama,
            senderNumber: msg.sender.split("@")[0],
        }
    });

    await msg.sendText(target.telepon, answer);
    msg.reply(templateParser(response.reportSent, {
        lecturer: isLecturer ? target?.nama : "Dosen Pembimbing",
    }));
}