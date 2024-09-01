import response from "../../../config/response.json";
import logger from "../../utils/logger";
import templateParser from "../../utils/templateParser";
import database from "../../database";
import cache from "../../cache/cache";
import saveReportToDatabase from "../../utils/saveReportToDatabase";
import separateMediaAndTextReports from "../../utils/separateMediaAndText";
import { Message, MessageMedia } from "whatsapp-web.js";
import client from "../../lib/waweb";

export async function sendReport(msg: Message, msgs: string[], cachedData: any, type: 'lecturer' | 'student' = 'student') {
    try {
        const allReports = await fetchReports(msgs);
        console.log("allReports", allReports);
        if (allReports.length === 0) {
            handleEmptyReport(msg, cachedData, type);
            return;
        }

        const { media, reportText } = separateMediaAndTextReports(allReports);
        const text = generateReportText(cachedData, type, reportText);

        await saveReportToDatabase(msg, cachedData, type, msgs);

        await sendReportToLecturers(msg, cachedData, type, text, media);
    } catch (error) {
        handleError(msg, error, type);
    } finally {
        cache.del(msg.from);
    }
}

async function fetchReports(msgs: string[]) {
    console.log("passed", msgs);
    return await database.chat.findMany({
        where: {
            id: {
                in: msgs
            }
        }
    });
}

function handleEmptyReport(msg: Message, cachedData: any, type: string) {
    logger.warn(`Failed to send report to ${type} ${cachedData.data.name} with nim ${cachedData.data.nim} because report is empty`);
    msg.reply(response.error.emptyReport);
}

function generateReportText(cachedData: any, type: string, reportText: string) {
    return templateParser(response.reportTemplate[ type ], {
        name: cachedData.data.name,
        nim: cachedData.data.nim,
        title: cachedData.data.title,
        report: reportText
    });
}

async function sendMediaMessages(msg: Message, media: any[], target: string) {
    if (media.length < 1) return;
    logger.info(JSON.stringify(media))
    for (const { mediaPath, type, content } of media) {
        // await msg.sen(target, mediaContent);
        let mediaMessage = MessageMedia.fromFilePath(mediaPath)
        client.sendMessage(target, mediaMessage, {
            caption: content ?? "Lampiran",
            quotedMessageId: msg.id.id
        });
    }
}

async function sendReportToLecturers(msg: Message, cachedData: any, type: string, text: string, media: any[]) {
    if (type === 'lecturer') {
        cachedData.name = cachedData.lecturer.filter(({ telepon }) => {
            return msg.from.split("@")[ 0 ].slice(-8) === telepon.slice(-8);
        }).map(({ name }) => name)[ 0 ];
    }

    const lecturers = type === 'lecturer' ? [ cachedData.data ] : cachedData.data.lecturer;

    for (const { telepon, name } of lecturers) {
        let phoneNumber = telepon.startsWith("0") ? telepon.replace("0", "62") : telepon;

        const result = await client.isRegisteredUser(phoneNumber);
        logger.info(JSON.stringify(result))
        
        if (!result) {
            logger.warn(`${type} ${name.substring(0, 10)} with number ${phoneNumber} doesn't exist on WhatsApp`);
            await msg.reply(templateParser(response.reportNotSent, {
                lecturer: name.substring(0, 20),
                reason: "Nomor Whatsapp tidak ditemukan"
            }));
            continue;
        }
        
        if (result) {
            let number = await client.getNumberId(phoneNumber)
            await client.sendMessage(number._serialized, text);
            await sendMediaMessages(msg, media, number._serialized);

            await msg.reply(templateParser(response.reportSent, {
                lecturer: type === "lecturer" ? name.substring(0, 20) : "Pembimbing",
            }));
        } else {
            logger.warn(`${type} ${name.substring(0, 10)} with number ${phoneNumber} doesn't exist on WhatsApp`);
        }
    }
}

function handleError(msg: Message, error: any, type: string) {
    console.log(error);
    logger.error({ error, msg: `Failed to send report to ${type}` });
    msg.reply(response.error.internalServerError);
}