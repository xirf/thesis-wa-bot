import { AuthenticationState } from '@whiskeysockets/baileys'

declare type ClientAuth = {
    state: AuthenticationState
    saveState: () => Promise<void>
    clearState: () => Promise<void>
}

declare type Command = (message: Message, cache: any) => Promise<void>