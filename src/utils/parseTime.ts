export default (time: number) => {
    let hours = Math.floor(time / 3600000);
    let minutes = Math.floor((time - (hours * 3600000)) / 60000);
    let seconds = Math.floor((time - (hours * 3600000) - (minutes * 60000)) / 1000);

    return `${hours} jam ${minutes} menit ${seconds} detik`;
}