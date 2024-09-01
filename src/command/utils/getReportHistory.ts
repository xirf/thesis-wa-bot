import { Message } from "whatsapp-web.js";
import response from "../../../config/response.json"
import database from "../../database"
import parseHistory from "./parseHistory";

export default async (msg: Message
    , isLecturer: boolean = false) => {
    let whereQuery: any = {
        where: {
            telepon: {
                contains: msg.from.split("@")[ 0 ].slice(-10)
            }
        }
    };

    // Check if it's from lecturer
    if (isLecturer) {
        let mshid = msg.body.split(" ")[ 1 ];
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