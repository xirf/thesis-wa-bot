import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            ignore: "pid,hostname",
            messageFormat: "{levelLabel} [{child}] {msg}",
            translateTime: "SYS:standard",
            hideObject: process.env.NODE_ENV === "production",

        },

    }
});

export default logger;