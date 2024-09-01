export default function separateMediaAndTextReports(allReports: any[]) {
    const media = [];
    const report = allReports.filter(({ type }) => type === "chat");
    const reportText = report.map(({ content }) => content).join("\n");
    return { media, reportText };
}