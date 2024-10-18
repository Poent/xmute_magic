'use strict';

// Helper function to fetch JSON data with error handling
async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, options);

        // Check for HTTP errors
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMsg = errorData.message;
                }
            } catch (e) {
                // Response is not JSON
            }
            throw new Error(errorMsg);
        }

        // Parse and return JSON data
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;  // Re-throw the error for the caller to handle
    }
}

// Function to check the token status
async function checkTokenStatus() {
    const data = await fetchJSON('/token/status');
    if (data.valid) {
        return data;
    } else {
        throw new Error('Token is invalid');
    }
}

// Function to refresh the database
async function refreshDatabase() {
    const data = await fetchJSON('/database/refresh');
    if (data.success) {
        return data.message;
    } else {
        throw new Error(data.message || 'Unknown error while refreshing database');
    }
}

// Function to fetch data and return the response
async function fetchData() {
    return await fetchJSON('/database/summary');
}

// Function to refresh the token. POST request to /token/refresh
async function refreshToken() {
    const data = await fetchJSON('/token/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return data;
}

// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.api = {
    checkTokenStatus,
    refreshDatabase,
    refreshToken,
    fetchData,
};
