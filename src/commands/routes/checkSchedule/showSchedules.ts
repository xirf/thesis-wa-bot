import { AnyMessageContent, WAMessage } from "@whiskeysockets/baileys";
import extractMessage from "../../../utils/extract";
import state from "../../../utils/state";
import db from "../../../db/client";
import config from "../../../config";
import parseTemplate from "../../../utils/parseTemplate";
import log from "../../../utils/logger";

async function handler(msg: WAMessage): Promise<AnyMessageContent> {
    try {
        let { sender } = await extractMessage(msg);
        let userState = await state.get(`data_${sender}`);

        let query = `
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
            jadwal_hari.id_hari;`;

        let template = await db.query(`SELECT template FROM "public".${config.tables.template} WHERE name='schedule'`)
        let jadwal = await db.query(query, [ userState.dokter.id ]);
        let formattedJadwal = formatJadwal(jadwal.rows);

        return ({
            text: await parseTemplate(template.rows[ 0 ].template, {
                dokter: userState.dokter.name ?? "Dokter",
                jadwal: formattedJadwal
            })
        })


    } catch (error) {
        log.error(error);
        return {
            text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
        };
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


export default handler;