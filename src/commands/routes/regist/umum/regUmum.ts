import { AnyMessageContent, WAMessage } from "@whiskeysockets/baileys";
import db from "../../../../db/client";
import config from "../../../../config";
import extractMessage from "../../../../utils/extract";
import { ResponseHandler } from "../../../../types/Command";
import state from "../../../../utils/state";

async function handler(_msg): Promise<AnyMessageContent> {
    try {
        let template = await db.query(`SELECT template from "public".${config.tables.template} WHERE name='msg.reg.umum' OR name='msg.reg.umum.img'`);
        let textTemplate = template.rows[ 0 ].template;
        let imgTemplate = template.rows[ 1 ].template;
        let response: AnyMessageContent = {
            text: "Silahkan masukkan nomor Rekam Medis Anda"
        }

        let isUrl = (str: string) => {
            let urlRegex = /(https?:\/\/[^\s]+)/g;
            return urlRegex.test(str);
        }

        if (isUrl(textTemplate)) {
            response = {
                image: {
                    url: textTemplate
                },
                caption: imgTemplate
            }
        } else if (isUrl(imgTemplate)) {
            response = {
                image: {
                    url: imgTemplate
                },
                caption: textTemplate
            }
        } else {
            response = {
                text: textTemplate
            }
        }

        return (response);
    } catch (error) {
        return ({
            text: "Terjadi kesalahan, silahkan hubungi admin"
        })
    }
}

async function parseResponse(msg: WAMessage): ResponseHandler {
    let { text, sender } = await extractMessage(msg)

    let query = `SELECT nama from "public".pasien WHERE no_rm=$1`;
    let result = await db.query(query, [ text ]);

    if (result.rowCount === 0) {
        let errMsg = await db.query(`SELECT template from "public".${config.tables.template} WHERE name='msg.err.RMNotFound'`);

        // return an error object to restart current route
        return ({
            error: {
                text: errMsg.rows[ 0 ].template
            }
        })
    } else {
        let userState = await state.get("data_" + sender) ?? {}

        // save the noRM and name to the state 
        // be careful when using userState, it's not a copy, it's a reference
        userState[ 'noRM' ] = text
        userState[ 'name' ] = result.rows[ 0 ].nama

        await state.update(`data_${sender}`, userState)
        return 1

    }
}


export default {
    handler,
    parseResponse
}