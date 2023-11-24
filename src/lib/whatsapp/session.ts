import { Client } from 'pg';
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import type { AuthenticationCreds, SignalDataTypeMap } from '@whiskeysockets/baileys';
import type { ClientAuth } from '../../types/Client';
import log from '../../utils/logger';
import config from '../../config';
const table = config.tables.sessions;


export default async (pool: Client): Promise<ClientAuth> => {
    // define mapping from signal data type to key in keys object
    const KEY_MAP: { [ T in keyof SignalDataTypeMap ]: string } = {
        'pre-key': 'preKeys',
        session: 'sessions',
        'sender-key': 'senderKeys',
        'app-state-sync-key': 'appStateSyncKeys',
        'app-state-sync-version': 'appStateVersions',
        'sender-key-memory': 'senderKeyMemory',
    };

    let creds: AuthenticationCreds;
    let keys: unknown = {};

    // load creds from database if they exist
    const query = `SELECT * FROM ${table} WHERE sessionId = $1`;
    const queryParams = [ 'creds' ];
    const storedCreds = await pool.query(query, queryParams);

    if (storedCreds.rows.length > 0 && storedCreds.rows[ 0 ].session) {
        // if exists, load creds from database
        const parsedCreds = JSON.parse(storedCreds.rows[ 0 ].session, BufferJSON.reviver);
        creds = parsedCreds.creds as AuthenticationCreds;
        keys = parsedCreds.keys;
    } else {
        // if not, generate new creds and store them 
        const insertQuery = `INSERT INTO ${table} (sessionId, session) VALUES ($1, $2)`;
        const insertParams = [ 'creds', JSON.stringify({ creds: initAuthCreds(), keys }, BufferJSON.replacer) ];

        try {
            await pool.query(insertQuery, insertParams);
        } catch (error) {
            log.error('Error inserting session');
            log.error(error)
        }

        creds = initAuthCreds();
    }

    //  Save the current client state (credentials and keys) to the database.
    const saveState = async (): Promise<void> => {
        const updateQuery = `UPDATE ${table} SET session = $1 WHERE sessionId = $2`
        const updateParams = [ JSON.stringify({ creds, keys }, BufferJSON.replacer), 'creds' ];

        try {
            await pool.query(updateQuery, updateParams);
        } catch (error) {
            log.error('Error updating session:', error);
            log.error(error)
        }
    };

    return {
        state: {
            creds,
            keys: {
                /**
                 * Get specific keys from the client state.
                 * @param type - Type of keys to retrieve.
                 * @param ids - Array of key IDs to retrieve.
                 * @returns A dictionary of retrieved keys.
                 */
                get: (type, ids) => {
                    const key = KEY_MAP[ type ];

                    return ids.reduce((dict: any, id) => {
                        const value: unknown = keys[ key ]?.[ id ];
                        if (value) {
                            if (type === 'app-state-sync-key') dict[ id ] = proto.Message.AppStateSyncKeyData.fromObject(value);
                            dict[ id ] = value;
                        }
                        return dict;
                    }, {});
                },
                /**
                 * Set specific keys in the client state and save the updated state to the database.
                 * @param data - Key-value pairs to set in the state.
                 */
                set: async (data) => {
                    for (const _key in data) {
                        const key = KEY_MAP[ _key as keyof SignalDataTypeMap ];
                        keys[ key ] = keys[ key ] || {};
                        Object.assign(keys[ key ], data[ _key ]);
                    }
                    try {
                        await saveState();
                    } catch (error) {
                        log.error('Error saving state:', error);
                        log.error(error)
                    }
                },
            },
        },
        saveState,
        // Clear the client state from the database. 
        clearState: async (): Promise<void> => {
            const deleteQuery = `DELETE FROM ${table} WHERE sessionId = $1`;
            const deleteParams = [ 'creds' ];

            try {
                await pool.query(deleteQuery, deleteParams);
            } catch (error) {
                log.error('Error deleting session:', error);
                log.error(error)
            }
        },
    };
};