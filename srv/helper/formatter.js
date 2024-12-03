// Function to format a date string into an ISO string
function formatTime(s_date) {
    const l_str = s_date.substring(6);
    const l_parsedate = parseInt(l_str, 10);
    const d = new Date(l_parsedate);
    return d.toISOString();
}

// Function to format a date string into YYYYMMDD format
function formatDate(s_date) {
    const l_str = s_date.substring(6);
    const l_parsedate = parseInt(l_str, 10);
    const d = new Date(l_parsedate);
    return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
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