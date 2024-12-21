// Function to format a date string into an ISO string
function formatTime(s_time) {
    const [hours, minutes, seconds] = s_time.split(':').map(Number);
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
    // If the input is a JavaScript Date object, extract time as HH:mm:ss
    const shours = String(date.getUTCHours()).padStart(2, '0');
    const sminutes = String(date.getUTCMinutes()).padStart(2, '0');
    const sseconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${shours}:${sminutes}:${sseconds}`;
}

// Function to format a date string into YYYYMMDD format
function formatDate(jsonDate) {
    // Extract the numeric timestamp using a regular expression
    const timestamp = parseInt(jsonDate.match(/\/Date\((\d+)\)\//)[1], 10);

    // Create a JavaScript Date object
    const date = new Date(timestamp);

    // Use UTC methods to avoid time zone issues
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


function splitCSV(input, sep = ',') {
    let result = input.split(sep);
    for (let i = 0; i < result.length; i++) {
        let item = result[i];
        if (item.charAt(0) === '"' && item.charAt(item.length - 1) === '"') {
            result[i] = item.slice(1, item.length - 1).replace(/""/g, '"');
        }
    }
    return result;
}



module.exports = {
    formatTime,
    formatDate,
    splitCSV
};