import { PrismaClient } from "@prisma/client";

console.log("Starting Prisma client...");
const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
    errorFormat: 'pretty',

});

export default client;