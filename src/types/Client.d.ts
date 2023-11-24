import { AnyMessageContent, WAMessage, WASocket } from "@whiskeysockets/baileys"

declare type Reply = (msg: AnyMessageContent, jid: string) => Promise<void>
declare type RouteModule = (msg: WAMessage) => Promise<void>

declare type ClientAuth = {
    state: AuthenticationState
    saveState: () => Promise<void>
    clearState: () => Promise<void>
}

// declare type SocketConnection = WASocket & { sendWTyping: Reply }
interface SocketConnection extends WASocket {
    sendWTyping: Reply
}