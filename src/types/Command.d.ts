import { AnyMessageContent, WAMessage } from "@whiskeysockets/baileys";

interface ConversationRoute {
    handler: (msg: WAMessage) => Promise<AnyMessageContent | AnyMessageContent[]>;
    // add object called error in awaitResponse to return error message
    awaitResponse?: (msg: WAMessage) => Promise<string | number | "batal" | "invalid" | { error: AnyMessageContent }>;
    transitions?: {
        condition: (resp: string | number | any) => boolean;
        nextRoute: string;
    }[];
}

type ResponseHandler = Promise<string | number | "batal" | "invalid" | { error: AnyMessageContent }>;
type ConversationFlow = Record<string, ConversationRoute>;