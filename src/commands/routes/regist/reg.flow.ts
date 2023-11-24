import { ConversationFlow } from "../../../types/Command";
import selectRegtype from "./selectRegtype";
import umumFlow from "./umum/umum.flow";
import bpjsFlow from "./bpjs/bpjs.flow";
import cancelReg from "./cancel";

const regFlow: ConversationFlow = {
    "reg.selectRegtype": {
        handler: selectRegtype.handler,
        awaitResponse: selectRegtype.parseResponse,
        transitions: [
            {
                condition: (resp) => resp == 1,
                nextRoute: "req.umum",
            },
            {
                condition: (resp) => resp == 2,
                nextRoute: "req.bpjs",
            },
        ]
    },
    ...umumFlow,
    ...bpjsFlow,
    "msg.reg.cancel": {
        handler: cancelReg.handler
    },
    "end": {
        handler: async () => { return ({ text: "Terima kasih sudah selesai" }) },
    },
}

export default regFlow
