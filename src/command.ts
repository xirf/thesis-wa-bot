import cache from "./cache/cache";
import chats from "./command/chats";
import database from "./database";
import getReportHistory from "./commands/getReportHistory";
import logger from "./utils/logger";
import Message from "./lib/message";
import os from "node:os";
import packageJson from "../package.json";
import parseTime from "./utils/parseTime";
import path, { join } from "path";
import response from "../config/response.json";
import templateParser from "./utils/templateParser";
import type { Command } from "./types";
import checkStudent from "./commands/checkStudent";

const log = logger.child({ module: "command" });

export default async (msg: Message) => {
    let isLecturer = await database.dosen.findFirst({ where: { telepon: { contains: msg.sender.split("@")[ 0 ].slice(-10) } } });
    let cachedData: any = cache.get(msg.sender);


    // Check if the message is a reply and a valid reply
    if (msg.quoted !== null) {
        let res = await chats(msg, isLecturer)
        if (res) return;
    }

    // This part is for the default command
    // Keep on top to trap the message and not treated as next step
    switch (msg.command) {
        case "start":
        case "help":
            cache.del(msg.sender)
            if (isLecturer) {
                msg.reply(response.start.lecturer);
                cache.set(msg.sender, { event: "lecturer.checkNIM" })
            } else {
                // msg.reply(response.start.student);
                // cache.set(msg.sender, { event: "student.setPembibing" })
                checkStudent(msg);
            }
            return;

        case "ping":
            msg.reply("Pong!");
            return;

        case "report":
        case "laporan":
        case "history":
        case "histori":
            getReportHistory(msg, isLecturer ? true : false);
            break;

        case "dever":
        case "dev-version":
            let msgText = templateParser(response.versionInfo, {
                env: process.env.NODE_ENV || "Development",
                version: packageJson.version,
                arch: os.arch() + " " + os.machine(),
                cpu: os.cpus()[ 0 ].model,
                host: os.hostname(),
                platform: os.platform(),
                nodeVersion: process.version,
                uptime: parseTime(process.uptime() * 1000),
                memoryUsage: `${Math.round(os.freemem() / 1024 / 1024)} MB / ${Math.round(os.totalmem() / 1024 / 1024)} MB - ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB `,
                cpuUsage: `${os.loadavg().map((v) => v.toFixed(2)).join("%, ")}%`
            })

            msg.reply(msgText);

            return;

        default: // Do nothing
            break;
    }

    // Check if there is a cached data
    if (cachedData) {
        try {
            // Get the directory
            let moduleDir = cachedData.event?.replaceAll(".", path.sep);
            let fullDir = join(__dirname, "command", moduleDir);

            let commandPath = fullDir + ".ts";

            if (process.env.NODE_ENV !== "development") {
                commandPath = fullDir + ".js"
            }

            if (!commandPath) {
                log.warn({ msg: "Command file not found", fullDir });
                msg.reply("Maaf, terjadi kesalahan pada sistem. Silahkan hubungi admin.");
            }
            // Import the command file using dynamic import
            let command: Command = await import(fullDir).then((module) => module.default);


            // Run the command
            if (command) command(msg, cache);
        } catch (error) {
            log.warn({ error, msg: "Error when running command" });
        }
    }
};

