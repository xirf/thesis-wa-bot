require("dotenv").config();

import client from "./lib/client";
import database from "./database";
import logger from "./utils/logger";
import server from "./web";

const WEB_ONLY = "true";
const DB_CONNECTION_ERROR = "Error when connecting to database";

async function startApp() {
    logger.info("Starting Prisma client...");

    try {
        await database.$connect();
        logger.info("Prisma client connected");

        if(process.env.WEB_ONLY === WEB_ONLY) logger.info("Running in WEB_ONLY mode");
        logger.info("Starting Web client...");
        server();
        
        if (process.env.WEB_ONLY !== WEB_ONLY) {
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