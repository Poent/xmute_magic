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
    
            const { market_data, material_groups, material_properties, crystalized_data } = response;

            const transmutagen_data = material_properties.transmutagen;
    
            // Convert material_properties array to an object keyed by item_name
            const materialProps = {};
            material_properties.thaumaturgy_ingredients.forEach(item => {
                materialProps[item.item_name] = item;
            });
    
            // Store data in MyApp namespace for global access
            MyApp.data = {
                market_data,
                material_groups,
                material_properties: materialProps,
                crystalized_data,
                transmutagen_data
            };
    
            // Make a deep copy of market_data to store original prices
            MyApp.data.original_market_data = JSON.parse(JSON.stringify(market_data));
    
            console.log('Market Data:', market_data);
            console.log('Material groups:', material_groups);
            console.log('Material properties:', materialProps);
            console.log('Crystalized data:', crystalized_data);
            console.log('Transmutagen data:', transmutagen_data);
    
            return MyApp.data; // Return the data for further processing
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error; // Re-throw error to be caught by the caller
        }
    };

    // Function to initialize tables
    const initializeTables = (data) => {
        const { market_data, material_groups, material_properties } = data;

        // Generate material buttons
        MyApp.table.generateMaterialButtons(market_data, material_groups);

        // Generate table headers for price and profit tables
        MyApp.table.generateTableHeaders(market_data, '#price-table-header');
        MyApp.table.generateTableHeaders(market_data, '#profit-table-header');

        // Generate price table rows and initialize DataTable
        MyApp.tables.priceTable = MyApp.table.generatePriceTableRows(market_data);

        // Generate transmutagen table rows and initialize DataTable
        MyApp.tables.transmutagenTable = MyApp.table.generateTransmutagenTableRows(MyApp.data.transmutagen_data, MyApp.data.market_data);

        // Generate crystalized data table rows and initialize DataTable
        MyApp.tables.crystalizedTable = MyApp.table.generateCrystalizedTableRows(data.crystalized_data);

        // Generate profit table rows and initialize DataTable
        MyApp.tables.profitTable = MyApp.table.generateProfitTableRows(market_data, material_properties);


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

        MyApp.state = {
            t1ToT2Enabled: false,
            includeTransmutagenValue: false
            
        };

        // Attach event listeners to the refresh button
        MyApp.ui.attachAuthStatusEventListener();

        // Check token status and fetch "data" if token is valid
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
