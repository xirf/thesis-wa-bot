import client from "./lib/client";
import database from "./database";
import logger from "./utils/logger";
require("dotenv").config();

logger.info("Starting Prisma client...");
database.$connect().then(() => {
    logger.info("Prisma client connected");
    client.connect();
}).catch((error) => {
    logger.fatal("Error when connecting to database");
    logger.fatal({ error, msg: "Error when connecting to database"});
    process.exit(1);
})
