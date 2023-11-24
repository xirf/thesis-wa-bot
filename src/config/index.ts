import log from "../utils/logger";

let {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_DATABASE,
    TBL_SESSIONS,
    TBL_STATE,
    TBL_TEMPLATE
} = process.env


if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    log.fatal('Missing database environment variables');
    process.exit(1);
}

if (!TBL_SESSIONS || !TBL_STATE || !TBL_TEMPLATE) {
    log.error('Whatsapp table name is MISSING using default table name');
}

let config = {
    db: {
        host: DB_HOST,
        port: parseInt(DB_PORT),
        username: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE,
    },
    tables: {
        sessions: TBL_SESSIONS ?? 'wa_sessions',
        state: TBL_STATE ?? 'wa_state',
        template: TBL_TEMPLATE ?? 'wa_template'
    }
}

export default config;