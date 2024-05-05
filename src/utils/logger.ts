import pino from "pino";
import fs from "fs";

if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
}

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
},
    pino.destination("logs/app.log")
);


export default logger;