import NodeCache from 'node-cache';
import log from './logger';

class GlobalState {
    private cache: NodeCache;

    constructor() {
        this.cache = new NodeCache();
    }

    async get(key: string): Promise<any | null> {
        return new Promise((resolve, _) => {
            const cachedData = this.cache.get(key);

            if (cachedData) {
                resolve(cachedData);
            } else {
                log.info(`State requested for key ${key} not found in cache`);
                resolve(null);
            }
        });
    }

    async update(key: string, value: any): Promise<void> {
        return new Promise((resolve, _) => {
            this.cache.set(key, value);
            resolve();
        });
    }


    async clear(key: string): Promise<void> {
        log.warn(`Clearing state for key ${key}`);
        this.cache.del(key); // Delete from cache
    }
}

const state = new GlobalState();
export default state;
