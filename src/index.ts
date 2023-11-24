require("dotenv").config();
import log from "./utils/logger";
import db from "./db/client";
import startSock from "./lib/whatsapp/waclient";
import handler from "./commands/handler";
import extractMessage from "./utils/extract";
import cron from "node-cron";
import fs from "fs";
import config from "./config";

// Just to make sure that the environment variables are loaded
log.info("Loading environment variables...");
log.info("Running in " + process.env.NODE_ENV || "Development" + " mode");


(async () => {
    log.info("Connecting to database...");
    await db.connect();

    log.info("Starting sock...");

    const { sock, sendMessageWTyping } = await startSock();

    sock.ev.on("messages.upsert", async (m) => {
        try {

            let msg = m.messages[0]

            if (msg.key.fromMe) return;

            // get the text from the message
            let { text } = await extractMessage(msg);

            // You can simply catch the message like this
            let thanks = ["terima kasih", "makasih", "thanks", "thank you", "terimakasih", "terima kasih banyak", "ty", "thx", "tq", "tks", "makasi", "makasih banyak", "makasih ya",]

            if (thanks.includes(text.toLowerCase())) {
                let template = await db.query(`SELECT template FROM "public".${config.tables.template} WHERE name='thanks'`);
                sendMessageWTyping({
                    text: template.rows[0].template ?? "Sama-sama 😇"
                }, msg.key.remoteJid)
                return;
            }


            // or handling it with handler
            // this will make the code more readable yet you can decide 
            // how conversation will be flow 
            await handler(msg, sendMessageWTyping)
        } catch (error) {
            log.error(error);
        }
    })



    // Every second, every minute, between 06:00 and 06:59, every day
    cron.schedule("* * 6 * * *", async () => {
        log.info("Running CronJob Tasks");

        // read the job directory and get all the jobs
        let jobs = fs.readdirSync("./src/job").map((file) => file.split(".")[0]);
        const jobMap = new Map();

        for (let job of jobs) {
            jobMap.set(job, job)
        }

        // run the job
        for (let job of jobMap.values()) {
            try {
                log.info("Running job " + job);
                let jobModule = await import(`./job/${job}`);
                await jobModule.default(sock, sendMessageWTyping);
            } catch (error) {
                log.error("Failed to run job " + job);
                log.error(error)
            }
        }
    });


    // make sock global
    globalThis.sock = sock;
})()
