import Message from "../../lib/message";
import getStudent from "./getStudent";
import cache from "../../cache/cache";
import response from "../../../config/response.json";
import templateParser from "../../utils/templateParser";
import logger from "../../utils/logger";

export default async (msg: Message, command: string) => {
    try {
        let { student, error } = await getStudent(msg);

        if (error) {
            msg.reply(response.error.notRegistered)
            return;
        }

        if (!student.ta[ 0 ]) {
            msg.reply(response.error.TA.notFound)
            return;
        }

        let reformattedData = {
            name: student.nama,
            nim: student.nim,
            telepon: student.telepon,
            taId: student.ta[ 0 ].id,
            title: student.ta[ 0 ].judul,
            lecturer: student.ta[ 0 ].pembimbing.map((pembimbing) => {
                return {
                    name: pembimbing.dosen.nama,
                    nidn: pembimbing.dosen.nidn,
                    telepon: pembimbing.dosen.telepon
                }
            })
        }

        cache.set(msg.sender, {
            event: "student.collectReport",
            data: reformattedData
        })

        let isNumber = command.match(/\d+/g);

        if (!isNumber && command.toLowerCase() !== "semua") {
            msg.reply(response.error.invalidLecturer);
            return;
        }

        if (isNumber && command.toLowerCase() !== "semua") {
            let number = parseInt(isNumber[ 0 ])
            reformattedData.lecturer = [ reformattedData.lecturer[ number - 1 ] ];
        }

        await msg.reply(
            templateParser(response.lecturerSet[ 0 ], {
                "lecturer": reformattedData.lecturer
                    .map((lecturer, i) => `${i > 0 ? "dan" : ""} *${lecturer.name}*`)
                    .join(" ")
            })
        );

        await msg.sendText(msg.sender, response.lecturerSet[ 1 ]);
        await msg.sendText(msg.sender, response.lecturerSet[ 2 ]);

        cache.set(msg.sender, {
            event: "student.collectReport",
            data: reformattedData
        })

        return;
    } catch (error) {
        logger.warn({ error, msg: "Error when when setting lecturer" })
        msg.reply(response.error.internalServerError);
        return
    }
}