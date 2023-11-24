import db from "../../../db/client";
import config from "../../../config";
import extractMessage from "../../../utils/extract";
import { AnyMessageContent } from "@whiskeysockets/baileys";
import state from "../../../utils/state";
import log from "../../../utils/logger";
import getSimilarity from "../../../lib/NLP";
import parseTemplate from "../../../utils/parseTemplate";
import { ResponseHandler } from "../../../types/Command";


async function handler(msg): Promise<AnyMessageContent> {
    try {
        let { sender, text } = await extractMessage(msg);
        let userState = await state.get(`data_${sender}`) ?? {};


        let query = `SELECT template from public.${config.tables.template} WHERE name='schedule.showDoctor'`;
        let template = await db.query(query);

        let listDokter = await db.query(`SELECT id_dokter, nama_dokter FROM public.dokter`);

        let dokter = listDokter.rows.map((dokter) => {
            return {
                name: dokter.nama_dokter,
                id: dokter.id_dokter,
            }
        });

        let similarity = getSimilarity(text, 0.1, dokter.map((dokter) => dokter.name))


        // filter dokter by similarity
        userState.dokter = similarity.map((result) => {
            return dokter.find((dokter) => dokter.name === result.name)
        }).slice(0, 10);

        await state.update(`data_${sender}`, userState);

        return ({
            text: await parseTemplate(template.rows[ 0 ].template, {
                dokter: userState.dokter.map((dokter, index) => {
                    return `${index + 1}. ${dokter.name}`
                }).join("\n")
            }),
        })

    } catch (error) {
        log.error(error);
        return ({
            text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
        });
    }
}


async function parseResponse(msg): ResponseHandler {
    try {
        let { text, sender } = await extractMessage(msg)

        let number = Number(text);

        // check if its number
        if (!number || number < 0 || !Number.isInteger(number)) {
            return "retry"
        }

        let userState = await state.get(`data_${sender}`);

        if (userState.dokter.length < (Number(text) - 1)) {
            return ({
                error: {
                    text: "Mohon maaf, pilihan anda tidak tersedia",
                }
            })
        }

        let dokter = userState.dokter[ Number(text) - 1 ];

        userState.dokter = dokter;
        await state.update(`data_${sender}`, userState);

        return "next"
    } catch (error) {
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