import { Sequelize } from 'sequelize';
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import type { AuthenticationCreds, SignalDataTypeMap } from '@whiskeysockets/baileys';
import type { ClientAuth } from '../types/index';
import { Session as SessionModel } from '../../models/index';
import logger from '../utils/logger';

const log = logger.child({ module: 'session' });

export default async (): Promise<ClientAuth> => {
    // Define mapping from signal data type to key in keys object
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

    // Load creds from the database if they exist
    const storedCreds = await SessionModel.findOne({ where: { sessionId: 'creds' } });

    if (storedCreds && storedCreds.session) {
        // If exists, load creds from the database
        const parsedCreds = JSON.parse(storedCreds.session, BufferJSON.reviver);
        creds = parsedCreds.creds as AuthenticationCreds;
        keys = parsedCreds.keys;
    } else {
        // If not, generate new creds and store them
        try {
            await SessionModel.create({
                sessionId: 'creds',
                session: JSON.stringify({ creds: initAuthCreds(), keys }, BufferJSON.replacer),
            });
        } catch (error) {
            log.error('Error inserting session');
            log.error(error);
        }

        creds = initAuthCreds();
    }

    // Save the current client state (credentials and keys) to the database.
    const saveState = async (): Promise<void> => {
        try {
            await SessionModel.update(
                { session: JSON.stringify({ creds, keys }, BufferJSON.replacer) },
                { where: { sessionId: 'creds' } }
            );
        } catch (error) {
            log.error('Error updating session:', error);
            log.error(error);
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
                        // @ts-ignore
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
                        // @ts-ignore
                        keys[ key ] = keys[ key ] || {};
                        // @ts-ignore
                        Object.assign(keys[ key ], data[ _key ]);
                    }
                    try {
                        await saveState();
                    } catch (error) {
                        log.error('Error saving state:', error);
                        log.error(error);
                    }
                },
            },
        },
        saveState,
        // Clear the client state from the database.
        clearState: async (): Promise<void> => {
            try {
                await SessionModel.destroy({ where: { sessionId: 'creds' } });
            } catch (error) {
                log.error('Error deleting session:', error);
                log.error(error);
            }
        },
    };
};
