import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || "warn",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
            hideObject: false,
        },

    }
});

export default logger;