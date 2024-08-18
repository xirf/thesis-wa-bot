export default function separateMediaAndTextReports(allReports: any[]) {
    const media = allReports.filter(({ type }) => type !== "conversation" && type !== "extendedTextMessage");
    const report = allReports.filter(({ type }) => type === "conversation" || type === "extendedTextMessage");
    const reportText = report.map(({ content }) => content).join("\n");
    return { media, reportText };
}