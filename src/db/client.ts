import { Client } from 'pg';
import log from '../utils/logger';
import config from '../config';

const db = new Client(config.db);

const TABLE_SESSION = config.tables.sessions;
const TABLE_STATE = config.tables.state;
const TABLE_TEMPLATE = config.tables.template;

// test connection to database
(async () => {
    try {
        // check if table session exists
        const checkSession = `SELECT * FROM information_schema.tables WHERE table_name = '${TABLE_SESSION}'`;
        if (!(await db.query(checkSession)).rows.length) {
            log.warn(`Table ${TABLE_SESSION} does not exist. Creating...`);

            // create table if it doesn't exist
            const query = `CREATE TABLE IF NOT EXISTS ${TABLE_SESSION} (
                id SERIAL PRIMARY KEY,
                sessionId VARCHAR(255) NOT NULL,
                session TEXT
            )`;
            await db.query(query);
        }

        // check if table state exists
        const checkState = `SELECT * FROM information_schema.tables WHERE table_name = '${TABLE_STATE}'`;
        if (!(await db.query(checkState)).rows.length) {
            log.warn(`Table ${TABLE_STATE} does not exist. Creating...`);

            // create table if it doesn't exist
            const query = `CREATE TABLE IF NOT EXISTS ${TABLE_STATE} (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) NOT NULL,
                value TEXT
            )`;
            await db.query(query);
        }

        // check if table template exists
        const checkTemplate = `SELECT * FROM information_schema.tables WHERE table_name = '${TABLE_TEMPLATE}'`;
        if (!(await db.query(checkTemplate)).rows.length) {
            log.warn(`Table ${TABLE_TEMPLATE} does not exist. Creating...`);

            const query = `CREATE TABLE IF NOT EXISTS ${TABLE_TEMPLATE} (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                template TEXT NOT NULL
            )`;
            await db.query(query);
        }


    } catch (error) {
        log.fatal('Failed to connect to database');
        process.exit(1);
    }
})();

export default db;