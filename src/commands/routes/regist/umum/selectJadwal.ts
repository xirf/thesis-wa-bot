import { AnyMessageContent, WAMessage } from "@whiskeysockets/baileys";
import { ResponseHandler } from "../../../../types/Command";
import extractMessage from "../../../../utils/extract";
import config from "../../../../config";
import db from "../../../../db/client";
import state from "../../../../utils/state";
import parseTemplate from "../../../../utils/parseTemplate";
import log from "../../../../utils/logger";

const TEMPLATE_NAME = "msg.reg.umum.schedules";
const QUERY = {
    query: `
SELECT
    jadwal_hari.nama_hari AS hari,
    array_agg(jadwal_jam.jam_mulai || ' - ' || jadwal_jam.jam_selesai ORDER BY jadwal_jam.jam_mulai) AS jam
FROM
    jadwal_kerja
JOIN
    jadwal_hari ON jadwal_kerja.id_hari = jadwal_hari.id_hari
JOIN
    jadwal_jam ON jadwal_kerja.id_jam = jadwal_jam.id_jam
WHERE
    jadwal_kerja.id_dokter = $1
GROUP BY
    jadwal_hari.nama_hari,
    jadwal_hari.id_hari
ORDER BY
    jadwal_hari.id_hari;`,
    paramKey: "id_dokter"
};

async function handler(msg: WAMessage): Promise<AnyMessageContent> {
    try {
        const { sender } = await extractMessage(msg);
        const userState = await state.get("data_" + sender) ?? {};

        let template = await db.query(`SELECT template FROM "public".${config.tables.template} WHERE name='${TEMPLATE_NAME}'`)
        let jadwal = await db.query(QUERY.query, [ userState.id_dokter ]);

        let formattedJadwal = formatJadwal(jadwal.rows);


        userState.jadwal = jadwal.rows;
        await state.update(`data_${sender}`, userState);


        return ({
            text: await parseTemplate(template.rows[ 0 ].template, {
                jadwal: formattedJadwal,
                dokter: userState.dokter ?? "Dokter"
            })
        })



    } catch (error) {
        log.error(error);
        return {
            text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
        };
    }
}


async function parseResponse(_msg: WAMessage): ResponseHandler {
    try {
        let { text, sender } = await extractMessage(_msg);
        // get the user state
        let userState = await state.get("data_" + sender) ?? {};

        // parse first number appearing in the text
        let index = parseInt(text.replace(/\D/g, ''));
        let allHour: string[] = [];
        let dayLength: number[] = [];

        userState.jadwal.forEach(jadwal => {
            dayLength.push(jadwal.jam.length);
            allHour.push(...jadwal.jam);
        });

        // check if the index is valid
        if (index <= 0 || index > allHour.length) {
            let errMsg = await db.query(`SELECT template from "public".${config.tables.template} WHERE name='msg.err.invalidIndex'`);

            // return an error object to restart current route
            return ({
                error: {
                    text: errMsg.rows[ 0 ].template
                }
            })
        }

        // get the hour from the index
        let hour = allHour[ index - 1 ];
        let remaining = index;
        let result = 0;

        for (let i = 0; i < dayLength.length; i++) {
            remaining -= dayLength[ i ]
            if (remaining <= 0) {
                result = i;
                break;
            }
        }


        const id_hari = await db.query(
            `SELECT id_hari from "public".jadwal_hari WHERE nama_hari=$1`,
            [ userState.jadwal[ result ].hari ]
        );

        const id_jam = await db.query(
            `SELECT id_jam from "public".jadwal_jam WHERE jam_mulai=$1 AND jam_selesai=$2`,
            hour.split(" - ")
        );



        userState.jadwal = {
            hari: userState.jadwal[ result ].hari,
            jam: hour,
            id_hari: id_hari.rows[ 0 ].id_hari,
            id_jam: id_jam.rows[ 0 ].id_jam
        }

        await state.update(`data_${sender}`, userState);

        return 1;

    } catch (error) {
        log.error(error);
        return ({
            error: {
                text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
            }
        });
    }
}


function formatJadwal(jadwalData: { hari: string; jam: string[] }[]) {
    const formattedJadwal: string[] = [];
    let index = 0;

    for (const { hari, jam } of jadwalData) {
        const jadwalText = jam
            .map((jam) => {
                index = index + 1;
                return `${index}. ${jam}`;
            })
            .join("\n");
        formattedJadwal.push(`Jadwal untuk *${hari}*:\n${jadwalText}`);
    }

    return formattedJadwal.join('\n\n');
}


export default {
    handler,
    parseResponse,
};
