'use strict';

(() => {
    // Expose priceTable and profitTable in the MyApp namespace
    window.MyApp = window.MyApp || {};
    MyApp.tables = {
        priceTable: null,
        profitTable: null
    };

    // Function to fetch data
    const fetchData = async () => {
        console.log('Fetching data...');
        try {
            const response = await MyApp.api.fetchData();
            console.log('Response:', response);

            const { grouped_items, material_groups, material_properties } = response;

            // Convert material_properties array to an object keyed by item_name
            const materialProps = {};
            material_properties.forEach(item => {
                materialProps[item.item_name] = item;
            });

            // Store data in MyApp namespace for global access
            MyApp.data = {
                grouped_items,
                material_groups,
                material_properties: materialProps
            };

            console.log('Grouped items:', grouped_items);
            console.log('Material groups:', material_groups);
            console.log('Material properties:', materialProps);

            return MyApp.data; // Return the data for further processing
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error; // Re-throw error to be caught by the caller
        }
    };

    // Function to initialize tables
    const initializeTables = (data) => {
        const { grouped_items, material_groups, material_properties } = data;

        // Generate material buttons
        MyApp.table.generateMaterialButtons(grouped_items, material_groups);

        // Generate table headers for price and profit tables
        MyApp.table.generateTableHeaders(grouped_items, '#price-table-header');
        MyApp.table.generateTableHeaders(grouped_items, '#profit-table-header');

        // Generate price table rows and initialize DataTable
        MyApp.tables.priceTable = MyApp.table.generatePriceTableRows(grouped_items);

        // Generate profit table rows and initialize DataTable
        MyApp.tables.profitTable = MyApp.table.generateProfitTableRows(grouped_items, material_properties);

        // Attach event listeners
        MyApp.ui.attachEventListeners();

        // Update prices based on selected price type
        const selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
        MyApp.table.updatePriceTable(selectedPriceType);

        // Update profits based on current prices
        MyApp.table.updateProfitTable();
    };

    // Function to check token status
    const checkTokenStatus = async () => {
        console.log("Checking token status...");
        try {
            const data = await MyApp.api.checkTokenStatus();
            console.log("Token is valid.", data);
            $('#auth-status')
                .text('Token Valid')
                .removeClass('btn-secondary btn-danger')
                .addClass('btn-success');
            return true;
        } catch (error) {
            console.error("Token invalid:", error.message || error);
            $('#auth-status')
                .text('Token Invalid')
                .removeClass('btn-secondary btn-success')
                .addClass('btn-danger');
            return false;
        }
    };


    // Document ready function
    $(document).ready(async () => {
        console.log("Document ready!");

        // Attach event listeners to the refresh button
        MyApp.ui.attachAuthStatusEventListener();

        // Check token status and fetch data if token is valid
        const isValid = await checkTokenStatus();
        if (isValid) {
            try {
                const data = await fetchData();
                initializeTables(data);
            } catch (error) {
                console.error('Error fetching data:', error);
                alert('Error fetching data!');
            }
        } else {
            // Handle invalid token case
            console.error("Token is invalid, cannot fetch data.");
        }

        // Set an interval to check the token status every 30 seconds
        setInterval(async () => {
            try {
                await checkTokenStatus();
            } catch (error) {
                console.error('Error during token status check:', error);
            }
        }, 30000); // 30 seconds
    });

    // Expose functions to MyApp namespace
    MyApp.fetchData = fetchData;
    MyApp.initializeTables = initializeTables;
    MyApp.checkTokenStatus = checkTokenStatus;

})();
