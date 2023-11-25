import { Boom } from '@hapi/boom'
import logger from "../utils/logger";

import makeWASocket, {
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidUser
} from '@whiskeysockets/baileys'



class Client {
    private socket: ReturnType<typeof makeWASocket> | null = null;

    constructor() {
        this.socket = null;
    }

    public async connect() {
        const socket = makeWASocket(
            {
                // auth
                browser: "firefox",
                logger: logger.child({ child: "wa" }),
            }
        );

        socket.ev.on("close", (reason) => {
            if (reason === DisconnectReason.intentional) {
                logger.info("Socket closed intentionally");
            } else {
                logger.info("Socket closed");
            }
        });

        socket.ev.on("open", () => {
            logger.info("Socket opened");
        });

        socket.ev.on("error", (error) => {
            logger.error("Socket error", error);
        });

        await socket.connect();

        this.socket = socket;
    }

    public async disconnect() {
        if (this.socket) {
            await this.socket.close();
        }
    }
}

export default new Client;
