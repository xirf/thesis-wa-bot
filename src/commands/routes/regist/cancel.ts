import db from "../../../db/client";
import state from "../../../utils/state";
import extractMessage from "../../../utils/extract";
import { AnyMessageContent, WAMessage } from "@whiskeysockets/baileys";
import config from "../../../config";

async function handler(msg: WAMessage): Promise<AnyMessageContent> {
    try {
        let { sender } = await extractMessage(msg)

        let template = await db.query(`SELECT template from "public".${config.tables.template} where name='msg.reg.cancel'`)
        let text = template.rows[ 0 ].template

        await state.clear(sender)
        return ({ text })

    } catch (error) {
        return ({
            text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
        })
    }
}

export default {handler}