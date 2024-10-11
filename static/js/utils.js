'use strict';

// Function to format timestamps
function formatTimestamp(timestamp) {
    var date = new Date(timestamp * 1000); // Convert to milliseconds

    var options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.utils = {
    formatTimestamp
};
