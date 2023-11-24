import { ConversationFlow } from "../../../types/Command";
import getName from "./getName";
import showDoctor from "./showDoctor";
import showSchedules from "./showSchedules";



const scheduleFlow: ConversationFlow = {
    "schedule.selectSchedule": {
        handler: getName.handler,
        awaitResponse: getName.parseResponse,
        transitions: [
            {
                condition: (_) => true,
                nextRoute: "schedule.showDoctor",
            },
        ]
    },
    "schedule.showDoctor": {
        handler: showDoctor.handler,
        awaitResponse: showDoctor.parseResponse,
        transitions: [
            {
                condition: (res) => res == "retry",
                nextRoute: "schedule.showDoctor",
            },
            {
                condition: (res) => res == "next",
                nextRoute: "schedule.showSchedules",
            }
        ]
    },
    "schedule.showSchedules": {
        handler: showSchedules
    }
}


export default scheduleFlow