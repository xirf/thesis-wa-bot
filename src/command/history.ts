import Message from "../lib/message"
import logger from "../utils/logger"
import database from "../database"
import response from "../../config/response.json"
import generatePDF from "../utils/generatePDF"
import { readFileSync, unlinkSync } from "fs"
import path from "path"


export default (msg: Message, MahasiswaID: number): Promise<void> => {
    return new Promise(async () => {
        try {
            const history = await database.historybimbingan.findMany({
                where: {
                    mahasiswaId: MahasiswaID
                },
                orderBy: {
                    createdAt: "asc"
                }
            })

            if (!history || history.length == 0) {
                msg.reply(response.error.historyNotFound);
            }


            let HTML = readFileSync(path.join(__dirname, "../../misc/history.html"), "utf-8")
            let chats = ""

            history.forEach(async ({ content, createdAt, type }) => {
                let chat = ""

                if (type == "mahasiswa") {
                    chat = readFileSync(path.join(__dirname, "../../misc/student.html"), "utf-8")

                } else {
                    chat = readFileSync(path.join(__dirname, "../../misc/lecturer.html"), "utf-8")
                }


                content = content.replace(/(?:\r\n|\r|\n)/g, "<br>")

                chats += chat.replace("{{message}}", content)
                    .replace("{{time}}", createdAt.toLocaleString())
            })

            const pdf = await generatePDF(HTML.
                replace("{{messages}}", chats)
                .replace("{{name}}", history.filter(({ type }) => type == "mahasiswa")[ 0 ].senderName))

            console.log("From history", pdf)
            
            if (pdf.includes("Failed to generate PDF, reason:")) {
                msg.reply(response.error.failedToGeneratePDF)
                return;
            }

            const pdfBuffer = await readFileSync(pdf)

            console.log(pdf)

            await msg.reply({
                fileName: `history-bimbingan-${(new Date).toLocaleString()}.pdf`,
                document: pdfBuffer,
                mimetype: "application/pdf",
                caption: response.history,
            })

            unlinkSync(pdf)

        } catch (error) {
            logger.error(error)
            msg.reply(response.error.internalServerError)
        }
    })
}