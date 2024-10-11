'use strict';

// Function to check the token status
function checkTokenStatus() {
    return $.get('/token/status').then(response => {
        if (response.valid) {
            return Promise.resolve(response);
        } else {
            return Promise.reject('Token is invalid');
        }
    }).fail((jqXHR, textStatus, errorThrown) => {
        console.error('Error checking token:', textStatus, errorThrown);
        return Promise.reject('Error checking token');
    });
}

// Function to refresh the database
function refreshDatabase() {
    return $.get('/database/refresh').then(response => {
        if (response.success) {
            return Promise.resolve(response.message);
        } else {
            return Promise.reject(response.message);
        }
    }).fail((jqXHR, textStatus, errorThrown) => {
        console.error('Error refreshing database:', textStatus, errorThrown);
        return Promise.reject('Error refreshing database');
    });
}

// Function to fetch data and return the response
function fetchData() {
    return $.get('/database/summary').then(response => {
        return Promise.resolve(response);
    }).fail((jqXHR, textStatus, errorThrown) => {
        console.error('Error fetching data:', textStatus, errorThrown);
        return Promise.reject('Error fetching data');
    });
}

// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.api = {
    checkTokenStatus,
    refreshDatabase,
    fetchData
};
