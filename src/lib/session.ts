import type { PrismaClient } from "@prisma/client"
import { BufferJSON, initAuthCreds, proto } from "@whiskeysockets/baileys"
import type { AuthenticationCreds, SignalDataTypeMap } from "@whiskeysockets/baileys"
import type { ClientAuth } from "../types/index.d.ts"

export default async (Database: PrismaClient): Promise<ClientAuth> => {
    const fixFileName = (fileName: string): string => fileName.replace(/\//g, "__")?.replace(/:/g, "-")

    const writeData = async (data: unknown, fileName: string) => {
        try {
            const sessionId = fixFileName(fileName)
            const session = JSON.stringify(data, BufferJSON.replacer)
            await Database.session.upsert({
                where: {
                    sessionId
                },
                update: {
                    sessionId,
                    session
                },
                create: {
                    sessionId,
                    session
                }
            })
        } catch { }
    }

    const readData = async (fileName: string) => {
        try {
            const sessionId = fixFileName(fileName)
            const data = await Database.session.findFirst({
                where: {
                    sessionId
                }
            })
            return JSON.parse(data?.session, BufferJSON.reviver)
        } catch {
            return null
        }
    }

    const removeData = async (fileName: string): Promise<void> => {
        try {
            const sessionId = fixFileName(fileName)
            await Database.session.delete({
                where: {
                    sessionId
                }
            })
        } catch { }
    }

    const creds: AuthenticationCreds = (await readData("creds")) || initAuthCreds()

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [ _: string ]: SignalDataTypeMap[ typeof type ] } = {}
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`)
                            if (type === "app-state-sync-key" && value) value = proto.Message.AppStateSyncKeyData.fromObject(value)
                            data[ id ] = value
                        })
                    )
                    return data
                },
                set: async (data) => {
                    const tasks: Promise<void>[] = []
                    for (const category in data) {
                        for (const id in data[ category ]) {
                            const value: unknown = data[ category ][ id ]
                            const file = `${category}-${id}`
                            tasks.push(value ? writeData(value, file) : removeData(file))
                        }
                    }
                    try {
                        await Promise.all(tasks)
                    } catch { }
                }
            }
        },
        saveState: async (): Promise<void> => {
            try {
                await writeData(creds, "creds")
            } catch { }
        },
        clearState: async (): Promise<void> => {
            try {
                await Database.session.deleteMany({})
            } catch { }
        }
    }
}
