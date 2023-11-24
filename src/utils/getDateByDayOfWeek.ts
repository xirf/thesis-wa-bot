import formatDate from "./formatDate";

export default function getDateByDayOfWeek(day: string): string {
    let days = [ "minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu" ];
    let dayIndex = days.indexOf(day.toLowerCase());

    let date = new Date();
    let currentDay = date.getDay();
    let distance = dayIndex - currentDay;
    return formatDate((new Date(date.setDate(date.getDate() + distance))).toISOString().split('T')[ 0 ]);
}
