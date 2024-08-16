import database from "../database"
import Message from "../lib/message"
import response from ",./../../config/response.json"

export default async (msg: Message) => {
    let student = await database.mahasiswa.findFirst({
        where: {
            telepon: {
                // get last 10 string 081234567890 -> 1234567890
                contains:  msg.sender.split("@")[0].slice(10)
            }
        }
    })

    if (!student) {
        msg.reply(response.error.notRegistered)
        return;
    }


}       