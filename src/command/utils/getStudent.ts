import { Message } from "whatsapp-web.js"
import database from "../../database"

export default async (msg: Message): Promise<{ student: any, error: boolean }> => {
    let student = await database.mahasiswa.findFirst({
        where: {
            telepon: {
                contains: msg.from.split("@")[ 0 ].slice(-10)
            }
        },
        select: {
            nama: true,
            nim: true,
            telepon: true,
            ta: {
                select: {
                    id: true,
                    judul: true,
                    pembimbing: {
                        select: {
                            dosen: {
                                select: {
                                    nama: true,
                                    telepon: true,
                                    nidn: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    let result = { student: student, error: false }
    if (!student) {
        result.error = true
    }
    return result
}