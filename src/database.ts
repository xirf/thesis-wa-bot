import { PrismaClient } from "@prisma/client";
import logger from "./utils/logger";

const log = logger.child({ module: 'database' }) as any;

const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',

});

export default client;