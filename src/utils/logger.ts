import pino from 'pino';

const log = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            levelFirst: true,
            ignore: 'pid,hostname',
            hideObject: process.env.NODE_ENV == 'production',

        }
    }
})

export default log;