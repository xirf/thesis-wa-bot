import type { PrismaClient } from "@prisma/client"
import { BufferJSON, initAuthCreds, proto } from "@whiskeysockets/baileys"
import type { AuthenticationCreds, SignalDataTypeMap } from "@whiskeysockets/baileys"
import type { ClientAuth } from "../types/index.d.ts"

export default async (Database: PrismaClient): Promise<ClientAuth> => {
    const KEY_MAP: { [T in keyof SignalDataTypeMap]: string } = {
      "pre-key": "preKeys",
      session: "sessions",
      "sender-key": "senderKeys",
      "app-state-sync-key": "appStateSyncKeys",
      "app-state-sync-version": "appStateVersions",
      "sender-key-memory": "senderKeyMemory"
    }
  
    let creds: AuthenticationCreds
    let keys: unknown = {}
  
    const storedCreds = await Database.session.findFirst({
      where: {
        sessionId: "creds"
      }
    })
    if (storedCreds && storedCreds.session) {
      const parsedCreds = JSON.parse(storedCreds.session, BufferJSON.reviver)
      creds = parsedCreds.creds as AuthenticationCreds
      keys = parsedCreds.keys
    } else {
      if (!storedCreds)
        await Database.session.create({
          data: {
            sessionId: "creds"
          }
        })
      creds = initAuthCreds()
    }
  
    const saveState = async (): Promise<void> => {
      try {
        const session = JSON.stringify({ creds, keys }, BufferJSON.replacer)
        await Database.session.update({ where: { sessionId: "creds" }, data: { session } })
      } catch {}
    }
  
    return {
      state: {
        creds,
        keys: {
          get: (type, ids) => {
            const key = KEY_MAP[type]
            return ids.reduce((dict: unknown, id) => {
              const value: unknown = keys[key]?.[id]
              if (value) {
                if (type === "app-state-sync-key") dict[id] = proto.Message.AppStateSyncKeyData.fromObject(value)
                dict[id] = value
              }
              return dict
            }, {})
          },
          set: async (data) => {
            for (const _key in data) {
              const key = KEY_MAP[_key as keyof SignalDataTypeMap]
              keys[key] = keys[key] || {}
              Object.assign(keys[key], data[_key])
            }
            try {
              await saveState()
            } catch {}
          }
        }
      },
      saveState,
      clearState: async (): Promise<void> => {
        try {
          await Database.session.delete({
            where: { sessionId: "creds" }
          })
        } catch {}
      }
    }
  }