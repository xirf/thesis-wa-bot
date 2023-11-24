import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import type { AuthenticationCreds, SignalDataTypeMap } from '@whiskeysockets/baileys';
import type { ClientAuth } from '../../types/Client';
import log from '../../utils/logger';
import sessionModel from '../../db/models/sessionModel';

export default async (): Promise<ClientAuth> => {
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
    const storedSession = await sessionModel.findOne({
        where: {
            sessionId: 'creds', // Use 'creds' as the session ID for credentials
        },
    });

    if (storedSession && storedSession.getDataValue('session')) {
        // if exists, load creds from database
        const parsedCreds = JSON.parse(storedSession.getDataValue('session'), BufferJSON.reviver);
        creds = parsedCreds.creds as AuthenticationCreds;
        keys = parsedCreds.keys;
    } else {
        // if not, generate new creds and store them 
        try {
            await sessionModel.create({
                sessionId: 'creds',
                session: JSON.stringify({ creds: initAuthCreds(), keys }, BufferJSON.replacer),
            });
        } catch (error) {
            log.error('Error inserting session');
            log.error(error);
        }

        creds = initAuthCreds();
    }

    //  Save the current client state (credentials and keys) to the database.
    const saveState = async (): Promise<void> => {
        try {
            await storedSession.update({
                session: JSON.stringify({ creds, keys }, BufferJSON.replacer),
            });
        } catch (error) {
            log.error('Error updating session:', error);
            log.error(error);
        }
    };

    return {
        state: {
            creds,
            keys: {
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
                        log.error(error);
                    }
                },
            },
        },
        saveState,
        clearState: async (): Promise<void> => {
            try {
                await storedSession.destroy();
            } catch (error) {
                log.error('Error deleting session:', error);
                log.error(error);
            }
        },
    };
};
