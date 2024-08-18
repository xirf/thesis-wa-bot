import CronJob from "node-cron"
import database from "../database"
// @ts-expect-error - types not installed
import cronstrue from 'cronstrue';
import logger from "./logger";

/**
 * 
 * @param age age of chat in days, default 1
 * @param timing cron timing default every day at 00:00
 */
export default function removeOldChatInDb(age: number = 1, timing: string = "0 0 * * *") {
    // translate timing to human readable
    let time = cronstrue.toString(timing);
    logger.info(`Remove old chat in database ${time}`);
    

    CronJob.schedule(timing, async () => {
        try {
            let allReports = await database.chat.findMany({
                where: {
                    createdAt: {
                        lte: new Date(new Date().getTime() - age * 24 * 60 * 60 * 1000)
                    }
                }
            });

            let deleted = await database.chat.deleteMany({
                where: {
                    id: {
                        in: allReports.map(({ id }) => id)
                    }
                }
            });

            if (deleted.count > 0) {
                console.log(`Deleted ${deleted.count} old chat in database`);
            }
        } catch (error) {
            console.log(error);
        }
    })

}