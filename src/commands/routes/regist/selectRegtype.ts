import db from "../../../db/client"
import config from "../../../config";
import log from "../../../utils/logger";
import extractMessage from "../../../utils/extract";
import type { WAMessage, AnyMessageContent } from "@whiskeysockets/baileys";

async function handler(_: WAMessage): Promise<AnyMessageContent> {
    try {
        let query = `SELECT template from "public".${config.tables.template} WHERE name='msg.reg.selectRegtype'`;
        let template = await db.query(query);

        return { text: template.rows[ 0 ].template }

    } catch (error) {
        log.error(error);
        return { text: "Silahkan pilih pendaftaran anda\n\n1. Umum\n2.BPJS" }
    }
}

async function parseResponse(msg) {
    let { text } = await extractMessage(msg);
    
    return parseInt((text.match(/\d+/) ?? [])[ 0 ] ?? "0");
}

export default {
    handler,
    parseResponse
}