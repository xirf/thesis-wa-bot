import Message from "./lib/message";
import cache from "./cache/cache";
import response from "./configs/response.json";
import database from "./database";
import { join } from "path";
import logger from "./utils/logger";
import type { Command } from "./types";

const log = logger.child({ module: "command" });

export default async (msg: Message) => {
    let isLecturer = database.dosen.findFirst({ where: { telepon: { contains: msg.sender.split("@")[ 0 ].slice(-10) } } });
    let cachedData: any = cache.get(msg.sender);

    // Check if there is a cached data
    if (cachedData) {
        try {
            // Get the directory
            let dir = cachedData.event.replaceAll(".", "/");

            // Import the command file using dynamic import
            let command: Command = await import(join(__dirname, "commands", dir, msg.command + ".js"))

            // Run the command
            if (command) command(msg, cache);
        } catch (error) {
            log.warn("Error when running command", { error });
        }
    }


    // This part is for the default command
    switch (msg.command) {
        case "start":
            if (isLecturer) {
                msg.reply(response.start.lecturer);
                cache.set(msg.sender, { event: "nip.check" })
            } else {
                msg.reply(response.start.student);
                cache.set(msg.sender, { event: "student.checknim" })
            }
            break;

        case "ping":
            msg.reply("Pong!");
            break;

        default:
            break;
    }
};


