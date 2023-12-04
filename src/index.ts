import client from "./lib/client";
import database from "./database";
import logger from "./utils/logger";

logger.info("Starting Prisma client...");
database.$connect().then(() => {
    logger.info("Prisma client connected");
    client.connect();
}).catch((error) => {
    logger.fatal("Error when connecting to database");
    logger.info(error);
    process.exit(1);
})
