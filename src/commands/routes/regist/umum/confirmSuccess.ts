import db from "../../../../db/client";
import config from "../../../../config";
import extractMessage from "../../../../utils/extract";
import { AnyMessageContent } from "@whiskeysockets/baileys";
import state from "../../../../utils/state";
import parseTemplate from "../../../../utils/parseTemplate";
import getDateByDayOfWeek from "../../../../utils/getDateByDayOfWeek";
import log from "../../../../utils/logger";


async function handler(msg): Promise<AnyMessageContent> {
    try {
        let { sender } = await extractMessage(msg);
        let userState = await state.get(`data_${sender}`)
        const { id_poli, poli, dokter, jadwal, noRM } = userState

        let template = await db.query(`SELECT template from "public".${config.tables.template} WHERE name='reg.success'`);

        let nextDate = getNextDate(jadwal.hari);
        let query = `
        SELECT * FROM "public".booking
        WHERE 
            tgl_booking =$1
            AND id_hari=$2 
            AND id_jam=$3 
            AND id_unit=$4 
            AND id_dokter=$5
        ORDER BY antrian DESC
        `;
        let result = await db.query(query, [
            nextDate,
            jadwal.id_hari,
            jadwal.id_jam,
            id_poli,
            dokter.id_dokter
        ]);

        let queue = (result.rows[ 0 ]?.antrian ?? 0) + 1;


        let query2 = `
        INSERT INTO "public".booking (
            no_rm,
            tgl_booking,
            id_booking,
            id_hari,
            id_jam,
            id_unit,
            id_dokter,
            tgl_daftar,
            antrian,
            status_check_in
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
        `;

        let id_booking = (result.rows[ 0 ]?.id_booking ?? 0).toString().padStart(4, "0");
        let saveBooking = await db.query(query2, [
            userState.noRM,
            nextDate,
            id_booking,
            jadwal.id_hari,
            jadwal.id_jam,
            userState.id_poli,
            userState.id_dokter,
            new Date(),
            queue,
            0
        ]);

        let retry = 0;
        if (saveBooking.rowCount === 0) {
            log.error(`failed to save booking`, saveBooking);
            for (let i = 0; i < 3; i++) {
                saveBooking = await db.query(query2, [
                    noRM,
                    nextDate,
                    id_booking,
                    jadwal.id_hari,
                    jadwal.id_jam,
                    id_poli,
                    dokter.id_dokter,
                    new Date(),
                    queue,
                    0
                ]);

                if (saveBooking.rowCount > 0) break;
                retry++;
                log.error(`retrying save booking ${retry}`);
            }
        }



        return ({
            text: await parseTemplate(template.rows[ 0 ].template, {
                kode: id_booking,
                poli,
                dokter,
                tanggal: getDateByDayOfWeek(jadwal.hari),
                jam: jadwal.jam
            })
        })

    } catch (error) {
        log.error(error);
        return ({
            text: "Terjadi kesalahan, \n\nJangan Khawatir kami sudah melaporkan masalah ini ke admin",
        });
    }
}


function getNextDate(day) {
    let days = [ "minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu" ];
    let dayIndex = days.indexOf(day.toLowerCase());

    let date = new Date();
    let today = date.getDay();
    let distance = dayIndex - today;
    if (distance <= 0) distance += 7;

    date.setDate(date.getDate() + distance);
    return date
}

export default {
    handler
}