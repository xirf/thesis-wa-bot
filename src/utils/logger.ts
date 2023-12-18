import pino from "pino";

const logger = pino({
    level: "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: " yy-mmm-dd HH:MM:ss ",
            hideObject: false,
        },

    }
});

export default logger;