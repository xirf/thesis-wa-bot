import Message from "./lib/message";
import cache from "./cache/cache";
import Database from "./database";
import nim from "./command/trapper/nim";

export default async (msg: Message) => {
    if (cache.has(msg.sender)) {
        let cacheData = cache.get(msg.sender)!;
        switch ((cacheData as { event: string }).event) {
            case "nim.check":
                nim(msg);
                break;
            case "nim.await.confirmation":
                break;
            default:
                break;
        }
    }

    switch (msg.command) {
        case "start":
            let startTemplate = (await Database.template.findFirst({
                where: {
                    name: "start"
                }
            })).content

            msg.reply(startTemplate);
            cache.set(msg.sender, { event: "nim" })

            break;
        case "ping":
            msg.reply("Pong!");
            break;
        case "help":
            msg.reply("Help!");
            break;
        default:
            break;
    }
};