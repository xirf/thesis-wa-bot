import Message from "../lib/message"
import cache from "../cache/cache";
import Database from "../database";

export default async (msg: Message): Promise<void> => {
    let msgText = msg.args;

    
    const data = cache.get(msg.sender) as { event: string, data: Record<string, any> };
    
    if (!data.data) {

    }

    switch (msgText.toLowerCase()) {
        case "batal":
            const cancelTemplate = await msg.getTemplate("report.canceled");
            msg.reply(cancelTemplate);
            cache.del(msg.sender);
            break;
        case "selesai":
            const doneTemplate = await Database.template.findMany({
                where: {
                    name: {
                        in: [ "report.preview", "report.formated", "report.afterpreview" ]
                    }
                },
                select: {
                    content: true,
                    name: true,
                },
            });


            const formated = msg.parseTemplate(doneTemplate[ 1 ].content, data.data);

            msg.reply(doneTemplate[ 0 ].content);
            msg.reply(formated);
            msg.reply(doneTemplate[ 2 ].content);
            break;
        case "ok":
            const msgTemplate = await msg.getTemplate("report.formated");

            msg.sendText(data.data.dosen.telepon, msg.parseTemplate(msgTemplate, data.data));
            cache.del(msg.sender);
            break;
        default:
            data.data.template += msgText + "\n";
            cache.set(msg.sender, data);
            break;
    }
}









function getSenderData(msg: Message) {
    let pembimbing = msg.command === "p1" ? 0 : 1;
    let noTelepon = msg.sender.split("@")[ 0 ];

}