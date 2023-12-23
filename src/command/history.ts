import Message from "../lib/message"
import logger from "../utils/logger"
import database from "../database"
import response from "../../config/response.json"
import generatePDF from "../utils/generatePDF"
import { readFileSync } from "fs"

export default (msg: Message, MahasiswaID: number): Promise<void> => {
    return new Promise(async () => {
        try {
            const history = await database.historyBimbingan.findMany({
                where: {
                    mahasiswaId: MahasiswaID
                },
                orderBy: {
                    createdAt: "desc"
                }
            })

            if (!history || history.length == 0) {
                msg.reply(response.error.historyNotFound);
            }

            let HTML = readFileSync("../../misc/history.html", "utf-8")


            history.forEach(async ({ content, createdAt, type }) => {
                let chat = ""

                if (type == "mahasiswa") {
                    chat = readFileSync("../../misc/sender.html", "utf-8")

                } else {
                    chat = readFileSync("../../misc/lecturer.html", "utf-8")
                }

                HTML += chat.replace("{{message}}", content)
                    .replace("{{time}}", createdAt.toString())
            })

            const pdf = await generatePDF(HTML)
            msg.reply({
                fileName: `history-bimbingan-${(new Date).toString()}.pdf`,
                document: pdf,
                mimetype: "application/pdf",
                caption: response.history,
            })

        } catch (error) {
            logger.error(error)
            msg.reply(response.error.internalServerError)
        }
    })
}