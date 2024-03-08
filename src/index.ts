require("dotenv").config();

import client from "./lib/client";
import database from "./database";
import logger from "./utils/logger";
import webServer from "./web/webserver";


logger.info("Starting Prisma client...");
database.$connect().then(() => {
    logger.info("Prisma client connected");
    // client.connect();
    webServer();

}).catch((error) => {
    console.log(error)
    logger.fatal("Error when connecting to database");
    logger.fatal({ error, msg: "Error when connecting to database" });
    process.exit(1);
})
