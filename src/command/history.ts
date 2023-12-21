import Message from "../lib/message"
import logger from "../utils/logger"
import database from "../database"
import response from "../../config/response.json"


export default (msg: Message, MahasiswaID: number): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const history = await database.historyBimbingan.findMany({
            where: {
                mahasiswaId: MahasiswaID
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        if(!history) {
            msg.reply(response.error.historyNotFound)
        }

        let options = {

        }

    })
}