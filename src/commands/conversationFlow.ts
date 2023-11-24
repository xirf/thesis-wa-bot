import welcomeMessage from "./welcome.js";
import type { ConversationFlow } from "../types/Command.d.ts";

const conversationFlow: ConversationFlow = {
    "msg.welcome": {
        handler: welcomeMessage.handler,
        awaitResponse: welcomeMessage.parseResponse,
        transitions: [
            {
                condition: (num) => num == 1,
                nextRoute: "reg.selectRegtype",
            },
            {
                condition: (num) => num == 2,
                nextRoute: "schedule.selectSchedule",
            }
        ]
    },
    "end": {
        handler: async () => { return ({ text: "Terima kasih sudah selesai" }) },
    },


};

export default conversationFlow