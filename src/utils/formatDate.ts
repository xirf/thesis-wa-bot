function formatDate(inputDate: string): string {
    // Split the input date into year, month, and day components
    const [ year, month, day ] = inputDate.split('-');

    // Define arrays for day names and month names
    const dayNames = [ 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu' ];
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus',
        'September', 'Oktober', 'November', 'Desember'
    ];

    // Create a new Date object using the parsed components (months are 0-based)
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Get the day of the week, month, and year from the Date object
    const dayOfWeek = dayNames[ parsedDate.getDay() ];
    const monthName = monthNames[ parsedDate.getMonth() ];
    const yearNumber = parsedDate.getFullYear();

    // Construct the formatted date string
    const formattedDate = `${dayOfWeek}, ${parseInt(day)} ${monthName} ${yearNumber}`;

    return formattedDate;
}

export default formatDate;