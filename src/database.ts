import { PrismaClient } from "@prisma/client";

const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [ 'error' ] : [ 'warn', 'error' ],
    errorFormat: 'pretty',
});

export default client;