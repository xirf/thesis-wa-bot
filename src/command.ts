import Message from "./lib/message";
import cache from "./cache/cache";
import response from "../config/response.json";
import database from "./database";
import path, { join } from "path";
import logger from "./utils/logger";
import type { Command } from "./types";
import chats from "./command/chats";
import templateParser from "./utils/templateParser";
import parseTime from "./utils/parseTime";
import packageJson from "../package.json";
import os from "node:os";

const log = logger.child({ module: "command" });

export default async (msg: Message) => {
    let isLecturer = await database.dosen.findFirst({ where: { telepon: { contains: msg.sender.split("@")[ 0 ].slice(-10) } } });
    let cachedData: any = cache.get(msg.sender);


    if (msg.quoted !== null) {
        let res = await chats(msg, isLecturer)
        if (res) return;
    }

    // This part is for the default command
    switch (msg.command) {
        case "start":
        case "help":
            cache.del(msg.sender)
            if (isLecturer) {
                msg.reply(response.start.lecturer);
                cache.set(msg.sender, { event: "lecturer.checknim" })
            } else {
                msg.reply(response.start.student);
                cache.set(msg.sender, { event: "student.checknim" })
            }
            return;

        case "ping":
            msg.reply("Pong!");
            return;

        case "dev-version":
            let msgText = templateParser(response.versionInfo, {
                version: packageJson.version,
                arch: os.arch() + " " + os.machine(),
                cpu: os.cpus()[ 0 ].model,
                host: os.hostname(),
                platform: os.platform(),
                nodeVersion: process.version,
                uptime: parseTime(process.uptime() * 1000),
                memoryUsage: JSON.stringify(process.memoryUsage()),
                cpuUsage: JSON.stringify(process.cpuUsage())
            })

            msg.reply(msgText);

            return;

        default:
            break;
    }

    // Check if there is a cached data
    if (cachedData) {
        try {
            // Get the directory
            let moduleDir = cachedData.event?.replaceAll(".", path.sep);
            let fullDir = join(__dirname, "command", moduleDir);

            // Import the command file using dynamic import
            let command: Command = await import(fullDir).then((module) => module.default);

            // Run the command
            if (command) command(msg, cache);
        } catch (error) {
            log.warn({ error, msg: "Error when running command" });
        }
    }
};

