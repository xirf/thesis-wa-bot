import database from "../database";
import Message from "../lib/message";
import logger from "./logger";

export default async function saveReportToDatabase(msg: Message, cachedData: any, type: string, msgs: string[]) {
    const mhsid = await database.mahasiswa.findFirst({
        where: {
            nim: cachedData.data.nim
        }
    });

    const saved = await database.historybimbingan.create({
        data: {
            mahasiswa: {
                connect: {
                    id: mhsid.id
                },
            },
            type: type === 'lecturer' ? 'pembimbing' : 'mahasiswa',
            senderName: cachedData.data.name,
            senderNumber: msg.sender.split("@")[ 0 ],
            content: msgs.map((msg, i) => `${i + 1}. ${msg}`).join("\n")
        }
    });

    if (saved) {
        logger.info(`Report from ${type} ${cachedData.data.name} with nim ${cachedData.data.nim} has been saved to database`);
    } else {
        logger.warn(`Failed to save report from ${type} ${cachedData.data.name} with nim ${cachedData.data.nim} to database`);
    }
}