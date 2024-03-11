require("dotenv").config();

import client from "./lib/client";
import database from "./database";
import logger from "./utils/logger";
import server from "./web";

logger.info("Starting Prisma client...");
database.$connect().then(() => {
    logger.info("Prisma client connected");

    logger.info("Starting WhatsApp client...");
    server();
    setTimeout(() => {
        client.connect();
    }, 2000);

}).catch((error) => {
    console.log(error)
    logger.fatal("Error when connecting to database");
    logger.fatal({ error, msg: "Error when connecting to database" });
    process.exit(1);
})
