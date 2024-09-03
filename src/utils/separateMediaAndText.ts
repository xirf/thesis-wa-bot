export default function separateMediaAndTextReports(allReports: any[]) {
    const media = allReports.filter(({ type }) => [ "video", "image", "document" ].includes(type));
    const report = allReports.filter(({ type }) => type === "chat");
    const reportText = report.map(({ content }) => content).join("\n");
    return { media, reportText };
}