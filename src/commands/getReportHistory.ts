import Message from "../lib/message";
import response from "../../config/response.json"
import database from "../database"
import parseHistory from "./parseHistory";

export default async (msg: Message, isLecturer: boolean = false) => {
    let whereQuery: any = {
        where: {
            telepon: {
                contains: msg.sender.split("@")[ 0 ].slice(-10)
            }
        }
    };

    // Check if it's from lecturer
    if (isLecturer) {
        let mshid = msg.arg
        if (!mshid) {
            msg.reply(response.error.notFound);
            return;
        }
        whereQuery.where = {
            nim: mshid
        }
    }

    let mhsid = await database.mahasiswa.findFirst({
        ...whereQuery,
        select: {
            id: true
        },
    });

    if (!mhsid || !mhsid.id) {
        msg.reply(response.error.notRegistered);
        return;
    }

    parseHistory(msg, mhsid.id);
}