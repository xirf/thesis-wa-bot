import { WAMessage } from "@whiskeysockets/baileys";
import type { Reply } from "../types/Client.d.ts";
import state from "../utils/state";
import extractMessage from "../utils/extract.js";
import conversationFlow from "./conversationFlow";
import { ConversationRoute } from "../types/Command.js";
import log from "../utils/logger.js";
import db from "../db/client.js";
import config from "../config/index.js";


export default async function handler(msg: WAMessage, reply: Reply): Promise<void> {
    try {
        const { sender } = await extractMessage(msg);
        let lastState = await state.get(sender);

        // check if empty object
        if (!lastState || Object.keys(lastState).length === 0) {
            log.warn(`No state found for ${sender}, setting the state to default`);
            lastState = {
                lastRoutes: "msg.welcome",
                awaitingResponse: false,
            }
        }

        // Get the current route from the state
        const routes: ConversationRoute = conversationFlow[ lastState.lastRoutes ];

        // if awaitResponse is true, then we need to process the response
        if (lastState.awaitingResponse) {
            let response = await routes.awaitResponse(msg);


            // handle cancel
            if (response.toString().toLowerCase() === "batal") {
                reply({ text: "Terima kasih sudah menggunakan layanan kami" }, sender);
                await state.clear(sender);
                return;

            } else if (typeof response === "object" && "error" in response) {

                reply({ ...response.error }, sender);
                return;
            }


            // If there's a transition, update the state with the next route
            if (routes.transitions) {
                let match = false;

                for (const transition of routes.transitions) {
                    if (transition.condition(response)) {
                        // run the handler for the next route

                        let respondMessage = await conversationFlow[ transition.nextRoute ].handler(msg)
                        // check if the respond is an array
                        if (Array.isArray(respondMessage)) {
                            // loop through the array and set 500ms delay
                            respondMessage.forEach((message, index) => {
                                setTimeout(() => {
                                    reply(message, sender)
                                }, 500 * index)
                            });

                        } else {
                            reply(respondMessage, sender)
                        }

                        // update the state with the next route if present
                        if (conversationFlow[ transition.nextRoute ].transitions) {
                            lastState.awaitingResponse = true
                            lastState.lastRoutes = transition.nextRoute

                            await state.update(sender, lastState);
                        } else {
                            // clear the state
                            await state.clear(sender);
                        }

                        match = true;
                        break;
                    }
                }

                // if there's no match, then send invalid input
                if (!match) {
                    let query = `SELECT template from "public".${config.tables.template} where name='msg.err.invalidInput'`
                    let template = await db.query(query)
                    let text = template.rows[ 0 ].template;


                    reply({ text }, sender)
                    return;
                }

            }

        } else {
            // handle if the handler is not available 
            if (!routes.handler) {
                let templateMsg = await db.query(`SELECT template from "public".${config.tables.template} where name='msg.err.endOfRoute'`)
                await state.clear(sender)
                return reply({ text: templateMsg.rows[ 0 ].template }, sender)
            }

            let respondMessage = await routes.handler(msg)
            if (Array.isArray(respondMessage)) {
                for (const message of respondMessage) {
                    reply(message, sender)
                }
            } else {
                reply(respondMessage, sender)
            }

            if (routes.transitions) {
                lastState.awaitingResponse = true
                lastState.lastRoutes = lastState.lastRoutes
                await state.update(sender, lastState);
            } else {
                await state.clear(sender);
            }
        }

        return;
    } catch (error) {
        log.error(error);
    }
}
