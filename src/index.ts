require("dotenv").config();

import client from "./lib/client";
import database from "./database";
import logger from "./utils/logger";
import server from "./web";

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
            logger.info("Starting WhatsApp client...");
            setTimeout(() => {
                client.connect();
            }, 2000);
        }
    } catch (error) {
        console.error(error);
        logger.fatal(DB_CONNECTION_ERROR);
        process.exit(1);
    }
}

startApp();