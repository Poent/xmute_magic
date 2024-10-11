'use strict';

(function() {
    // Initialize the DataTable variable
    var table;

    // Function to fetch data and initialize the page
    function fetchDataAndInitialize() {
        console.log('Fetching data...');

        MyApp.api.fetchData().then(response => {
            console.log('Response:', response);

            var grouped_items = response.grouped_items;
            var material_groups = response.material_groups;

            console.log('Grouped items:', grouped_items);
            console.log('Material groups:', material_groups);

            // Generate material buttons
            MyApp.table.generateMaterialButtons(grouped_items, material_groups);

            // Generate table headers
            MyApp.table.generateTableHeaders(grouped_items);

            // Generate table rows and initialize DataTable
            table = MyApp.table.generatePriceTableRows(grouped_items);

            // Attach event listeners
            MyApp.ui.attachEventListeners(table);

            // Update prices based on selected price type
            var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
            MyApp.table.updatePrices(selectedPriceType, table);
        }).catch(error => {
            console.error('Error initializing data:', error);
            alert('Error initializing data!');
        });
    }

    // Function to update the table with the latest data
    function updateTable() {
        MyApp.api.fetchData().then(response => {
            var grouped_items = response.grouped_items;
            var material_groups = response.material_groups;

            // Update table rows
            table.destroy(); // Destroy the existing DataTable
            MyApp.table.generateTableHeaders(grouped_items);
            table = MyApp.table.generatePriceTableRows(grouped_items);

            // Reattach event listeners
            MyApp.ui.attachEventListeners(table);

            // Update prices based on selected price type
            var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
            MyApp.table.updatePrices(selectedPriceType, table);
        }).catch(error => {
            console.error('Error updating table:', error);
            alert('Error updating table!');
        });
    }

    // Document ready function
    $(document).ready(function() {
        console.log("Document ready!");

        console.log("Checking token status...");
        // Call the token check function when the page loads
        MyApp.api.checkTokenStatus().then(() => {
            console.log("Token is valid, fetching data and initializing...");

            $('#auth-status').text('Token Valid').removeClass('btn-secondary').addClass('btn-success');

            // Fetch data and initialize the page
            fetchDataAndInitialize();

            // Corrected code in main.js
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
        updateTable
    };
})();
