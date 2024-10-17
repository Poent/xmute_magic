'use strict';

(function() {
    // Initialize the priceTable variable
    var priceTable;
    var profitTable;

    function fetchDataAndInitialize() {
        console.log('Fetching data...');
    
        MyApp.api.fetchData().then(response => {
            console.log('Response:', response);
    
            var grouped_items = response.grouped_items;
            var material_groups = response.material_groups;
            var material_properties_array = response.material_properties; // This is the array
    
            // Convert material_properties array to an object keyed by item_name
            var material_properties = {};
            material_properties_array.forEach(function(item) {
                material_properties[item.item_name] = item;
            });
    
            // Store data in MyApp namespace for global access
            MyApp.data = {
                grouped_items: grouped_items,
                material_groups: material_groups,
                material_properties: material_properties // Now an object
            };
    
            console.log('Grouped items:', grouped_items);
            console.log('Material groups:', material_groups);
            console.log('Material properties:', material_properties);
    
            // Generate material buttons
            MyApp.table.generateMaterialButtons(grouped_items, material_groups);
    
            // Generate table headers for price table
            MyApp.table.generateTableHeaders(grouped_items, '#price-table-header');
    
            // Generate table headers for profit table
            MyApp.table.generateTableHeaders(grouped_items, '#profit-table-header');
    
            // Generate price table rows and initialize DataTable
            priceTable = MyApp.table.generatePriceTableRows(grouped_items);
    
            // Generate profit table rows and initialize DataTable
            profitTable = MyApp.table.generateProfitTableRows(grouped_items, material_properties);
    
            // Attach event listeners
            MyApp.ui.attachEventListeners(priceTable, profitTable);
    
            // Update prices based on selected price type
            var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
            MyApp.table.updatePrices(selectedPriceType, priceTable);
    
            // Update profits based on current prices
            MyApp.table.updateProfits(grouped_items, material_properties, profitTable);
    
        }).catch(error => {
            console.error('Error initializing data:', error);
            alert('Error initializing data!');
        });
    }
    
    
    
    

    // Function to update the price table with the latest data
    function updatePriceTable() {
        MyApp.api.fetchData().then(response => {
            var grouped_items = response.grouped_items;
            var material_groups = response.material_groups;

            // Update table rows
            priceTable.destroy(); // Destroy the existing DataTable
            MyApp.table.generateTableHeaders(grouped_items);
            priceTable = MyApp.table.generatePriceTableRows(grouped_items);

            // Reattach event listeners
            MyApp.ui.attachEventListeners(priceTable);

            // Update prices based on selected price type
            var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
            MyApp.table.updatePrices(selectedPriceType, priceTable);
        }).catch(error => {
            console.error('Error updating table:', error);
            alert('Error updating table!');
        });
    }

    // Document ready function
    $(document).ready(function() {
        console.log("Document ready!");

        // attach event listeners to the refresh button
        MyApp.ui.attachAuthStatusEventListener();
         
        console.log("Checking token status...");
        // Call the token check function when the page loads
        MyApp.api.checkTokenStatus().then(() => {
            console.log("Token is valid, fetching data and initializing...");

            $('#auth-status').text('Token Valid').removeClass('btn-secondary').addClass('btn-success');

            // Fetch data and initialize the page
            fetchDataAndInitialize();

            // Set an interval to check the token status every 30 seconds
            // if the token is valid, update the status button to green otherwise red
            setInterval(function(){
                MyApp.api.checkTokenStatus().then(() => {
                    $('#auth-status').text('Token Valid').removeClass('btn-secondary btn-danger').addClass('btn-success');
                }).catch((error) => {
                    $('#auth-status').text('Token Invalid').removeClass('btn-secondary btn-success').addClass('btn-danger');
                });
            }, 30000); // 30 seconds

        }).catch((error) => {
            console.error(error);
            $('#auth-status').text('Token Invalid').removeClass('btn-secondary').addClass('btn-danger');
        });
    });

    // Expose functions if needed
    window.MyApp = window.MyApp || {};
    window.MyApp.main = {
        updatePriceTable
    };
})();