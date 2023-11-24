import { ConversationFlow } from "../../../../types/Command";
import regBPJS from "./regBPJS";


const bpjsFlow: ConversationFlow = {
    "req.bpjs": {
        handler: regBPJS.handler
    },
}

export default bpjsFlow;
