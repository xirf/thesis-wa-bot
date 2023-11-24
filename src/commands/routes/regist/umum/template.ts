/*
* Just for DRY (Don't Repeat Yourself) purpose
* The routes had same properties, so we can just use this template
*/

import { AnyMessageContent, WAMessage } from "@whiskeysockets/baileys";
import { ResponseHandler } from "../../../../types/Command";
import config from "../../../../config";
import db from "../../../../db/client";
import state from "../../../../utils/state";
import extractMessage from "../../../../utils/extract";
import parseTemplate from "../../../../utils/parseTemplate";
import log from "../../../../utils/logger";

async function generateMessage(
    msg: WAMessage,
    templateName: string,
    query: { query: string, paramKey?: string },
    propertyKey: string,
    objKey?: Record<string, string>
): Promise<AnyMessageContent> {
    try {
        const { sender } = await extractMessage(msg);
        const userState = await state.get("data_" + sender) ?? {};


        let result = await db.query(query.query, query.paramKey ? [ userState[ query.paramKey ] ] : null);

        // get the template and parse it
        const template = await db.query(`SELECT template FROM "public".${config.tables.template} WHERE name='${templateName}'`);
        const formattedItems = result.rows.map((item, index) => `${index + 1}. ${item[ propertyKey ]}`);


        let objToSend = {
            nama: userState.name,
        };

        // add the formatted items to the object to send it will be used in the template
        objToSend[ propertyKey ] = formattedItems.join("\n");

        if (objKey) {
            Object.keys(objKey).map(el => {
                try {
                    objToSend = userState[objKey[ el ]]
                } catch (error) {
                    log.warn(`Failed to set object keys for ${sender}`, error)
                }
            })
        }

        // update the state
        userState[ propertyKey ] = result.rows;
        await state.update(`data_${sender}`, userState);

        return ({
            text: parseTemplate(template.rows[ 0 ].template, objToSend),
        });


    } catch (error) {
        log.error(error);
        return {
            text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
        };
    }
}

async function parse(msg: WAMessage, propertyKey: string): Promise<ResponseHandler> {
    try {
        const { text, sender } = await extractMessage(msg);

        let falseStatement = [ "tidak", "tdk", "no", "batal", "salah" ]
        
        if (falseStatement.includes(text.toLocaleLowerCase())) {
            return "cancel" 
        }


        const userState = await state.get('data_' + sender) ?? {};

        const items = userState[ propertyKey ];
        const index = parseInt(text) - 1;

        if (isNaN(index)) {
            return {
                error: {
                    text: "Mohon maaf, silakan masukkan angka yang sesuai dengan pilihan",
                },
            };
        }

        const item = items[ index ];

        userState[ `id_${propertyKey}` ] = item[ `id_${propertyKey}` ];
        userState[ propertyKey ] = item[ propertyKey ];

        await state.update("data_" + sender, userState);
        return 1;
    } catch (error) {
        log.error(error);
        return {
            error: {
                text: "Ups😢 ada masalah nih, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
            },
        };
    }
}

export { generateMessage, parse };
