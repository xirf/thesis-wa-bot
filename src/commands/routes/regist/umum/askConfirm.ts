import { AnyMessageContent } from "@whiskeysockets/baileys";
import db from "../../../../db/client";
import state from "../../../../utils/state";
import log from "../../../../utils/logger";
import extractMessage from "../../../../utils/extract";
import config from "../../../../config";
import parseTemplate from "../../../../utils/parseTemplate";
import { ResponseHandler } from "../../../../types/Command";
import getDateByDayOfWeek from "../../../../utils/getDateByDayOfWeek";


async function handler(msg): Promise<AnyMessageContent> {
    try {
        const { sender } = await extractMessage(msg);
        const userState = await state.get(`data_${sender}`)

        const { poli, dokter, jadwal } = userState

        let template = await db.query(`SELECT template FROM "public".${config.tables.template} WHERE name='msg.reg.confirm'`)

        let message = await parseTemplate(template.rows[ 0 ].template, {
            poli,
            dokter,
            tanggal: getDateByDayOfWeek(jadwal.hari),
            jam: jadwal.jam
        })

        return ({ text: message })

    } catch (error) {
        log.error(error);
        return {
            text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
        };
    }

}


async function parseResponse(msg): ResponseHandler {
    try {
        let { text } = await extractMessage(msg)

        let trueStatement = [ "ya", "y", "iya", "yes", "ok", "nggih", "k", 'konfirmasi', "confirm" ]

        if (trueStatement.includes(text.toLowerCase())) {
            return 1
        } else {
            return 0
        }

    } catch (error) {
        log.error(error);
        return ({
            error: {
                text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
            }
        })
    }
}




export default {
    handler,
    parseResponse
}