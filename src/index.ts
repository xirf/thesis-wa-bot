require("dotenv").config();

// import client from "./lib/client";
import database from "./database";
import logger from "./utils/logger";
import server from "./web";
import removeOldChatInDb from "./utils/removeOldChatInDb";
import client from "./lib/waweb";

const DB_CONNECTION_ERROR = "Error when connecting to database";

async function startApp() {
    logger.info("Starting Prisma client...");


    try {
        await database.$connect();
        logger.info("Prisma client connected");

        logger.info("Starting Web client...");
        server();

        // Don't run the bot if had argument -w (web only) 
        if (process.argv.includes("-w")) {
            logger.warn("Using -w WhatsApp won't started")
        } else {
            logger.info("Starting WhatsApp client in 2 seconds...");
            logger.warn("Don't send message  before client started or it wouldn't be processed")
            setTimeout(() => {
                logger.info("Starting WhatsApp client...");
                client.initialize();
                
                logger.info("Starting cronjob task...");
                removeOldChatInDb();
            }, 2000);

        }
    } catch (error) {
        console.error(error);
        logger.fatal(DB_CONNECTION_ERROR);
        process.exit(1);
    }
}

startApp();