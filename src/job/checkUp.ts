import db from "../db/client";
import { Reply } from "../types/Client";
import log from "../utils/logger";
import config from "../config";
import makeWASocket from "@whiskeysockets/baileys";
import parseTemplate from "../utils/parseTemplate";


export default async function checkup(sock: ReturnType<typeof makeWASocket>, reply: Reply): Promise<void> {
    return new Promise(async (resolve) => {

        const pasiens = await db.query(`SELECT b.tgl_kontrol, jj.jam_mulai, u.nama_unit, p.nama, p.telepon FROM "public"."booking" AS b INNER JOIN "public"."jadwal_jam" AS jj ON b.id_jam = jj.id_jam INNER JOIN "public"."unit" AS u ON b.id_unit = u.id_unit INNER JOIN "public"."pasien" AS p ON b.no_rm = p.no_rm WHERE b.tgl_kontrol = CURRENT_DATE + INTERVAL '1 day'`);

        let template = await db.query(`SELECT template from public.${config.tables.template} where name='checkup'`)

        log.info("Sending checkup reminder to " + pasiens.rows.length + " receipient")

        pasiens.rows.forEach(async (p) => {
            if (p.telepon && p.telepon.length > 8) {
                let [ result ] = await sock.onWhatsApp(p.telepon)

                if (result.exists) {
                    let tel = result.jid

                    try {
                        await reply({
                            text: parseTemplate(template.rows[ 0 ].template, {
                                name: p.nama,
                                date: formatDate(p.tgl_kontrol),
                                time: p.jam_mulai,
                                location: p.nama_unit,
                            })
                        }, tel);

                        log.info("Succesfully Send Checkup reminder to " + p.nama)
                    }
                    catch (error) {
                        log.error("Failed to send checkup reminder to " + p.nama, error)
                    }
                } else {
                    log.warn(`User ${p.nama} don't have whatsapp account`)
                }
            }
        });

        resolve();
    });
}


function formatDate(date: Date): string {
    const days = [ 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu' ];
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
        'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayOfWeek = days[ date.getDay() ];
    const dayOfMonth = date.getDate();
    const month = months[ date.getMonth() ];

    return `${dayOfWeek}, ${dayOfMonth} ${month}`;
}
