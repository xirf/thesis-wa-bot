import htmlToPdfMake from "html-to-pdfmake"
import pdfmake from "pdfmake/build/pdfmake"
import pdfFonts from "pdfmake/build/vfs_fonts"
pdfmake.vfs = pdfFonts.pdfMake.vfs;
import { JSDOM } from "jsdom"
import fs, { writeFileSync } from "fs"
import logger from "./logger";
import path from "path";


export default async function genenate(html: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const { window } = new JSDOM("")

            const output = await htmlToPdfMake(html, { window })
            var docDefinition = {
                content: [
                    output
                ]
            }

            // create misc folder if nor present
            if (!fs.existsSync(path.join(__dirname, "../../temp"))) {
                fs.mkdirSync(path.join(__dirname, "../../temp"))
            }

            const name = path.join(
                __dirname, "../../temp/",
                new Date().getTime().toString() + Math.random().toString().slice(2, 5) + ".pdf"
            )

            var pdfGenerator = await pdfmake.createPdf(docDefinition)
            await pdfGenerator.getBuffer((buffer) => {
                writeFileSync(name, buffer)
                console.log("From generator", name)
                resolve(name)
            })

        } catch (error) {
            logger.error(error)
            reject("Failed to generate PDF, reason: " + error.message)
        }
    })
}
