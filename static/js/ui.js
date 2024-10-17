'use strict';

// Function to attach event listeners
function attachEventListeners(priceTable, profitTable) {
    // Price type radio buttons
    $('input[name="priceType"]').off('change').on('change', function() {
        var selectedPriceType = $('input[name="priceType"]:checked').val();
        MyApp.table.updatePrices(selectedPriceType, priceTable);
        // Recalculate profits
        MyApp.table.updateProfits(MyApp.data.grouped_items, MyApp.data.material_properties, profitTable);
    });

    // Material buttons using event delegation
    $('#material-buttons').off('click', '.toggle-column').on('click', '.toggle-column', function() {
        var columnIndex = parseInt($(this).attr('data-column'), 10);
        var columnInPriceTable = priceTable.column(columnIndex);
        var columnInProfitTable = profitTable.column(columnIndex);

        var isVisible = !columnInPriceTable.visible();
        columnInPriceTable.visible(isVisible);
        columnInProfitTable.visible(isVisible);

        // Toggle the button's active state
        $(this).toggleClass('active');
        $(this).attr('aria-pressed', $(this).hasClass('active'));
    });

    // In attachEventListeners function
    $('#price-table').off('blur', '.price').on('blur', '.price', function() {
        var $cell = $(this);
        var newPriceText = $cell.text().replace(' g', '').trim();
        var newPrice = parseFloat(newPriceText);

        if (!isNaN(newPrice)) {
            var row = priceTable.row($cell.closest('tr')).index();
            var column = priceTable.cell($cell).index().column;
            var tier = $cell.closest('tr').attr('data-tier');
            var itemIndex = column - 1; // Adjust for 'Tier' column
            var itemName = Object.keys(MyApp.data.grouped_items)[itemIndex];

            // Update grouped_items with new price
            var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
            MyApp.data.grouped_items[itemName][tier][selectedPriceType] = newPrice * 10000; // Convert back to copper

            // Recalculate profits and update colors
            MyApp.table.updateProfits(MyApp.data.grouped_items, MyApp.data.material_properties, profitTable);
        }
    });



    // Group buttons
    $('.toggle-group').off('click').on('click', function() {
        var groupName = $(this).attr('data-group');

        // Deactivate other group buttons
        $('.toggle-group').removeClass('active').attr('aria-pressed', false);

        // Activate clicked button
        $(this).addClass('active').attr('aria-pressed', true);

        // Deactivate all material buttons
        $('.toggle-column').removeClass('active').attr('aria-pressed', false);

        // Hide all columns except 'Tier'
        priceTable.columns().visible(false);
        priceTable.column(0).visible(true); // Keep 'Tier' column visible

        // hide all columns in profit table
        profitTable.columns().visible(false);
        profitTable.column(0).visible(true); // Keep 'Tier' column visible

        // Show columns for materials in the selected group
        $('.toggle-column[data-group="' + groupName + '"]').each(function() {
            $(this).addClass('active').attr('aria-pressed', true);
            var columnIndex = parseInt($(this).attr('data-column'), 10);
            priceTable.column(columnIndex).visible(true);
            profitTable.column(columnIndex).visible(true);
        });
    });

    // Reset materials button
    $('#reset-materials').off('click').on('click', function() {
        // Deactivate group buttons
        $('.toggle-group').removeClass('active').attr('aria-pressed', false);

        // Activate all material buttons
        $('.toggle-column').addClass('active').attr('aria-pressed', true);

        // Show all columns
        priceTable.columns().visible(true);
        profitTable.columns().visible(true);
    });

    // Tier toggle buttons
    $('.toggle-row').off('click').on('click', function() {
        var tier = $(this).attr('data-tier');
        $('tr[data-tier="' + tier + '"]').toggle();

        // Toggle the button's active state
        $(this).toggleClass('active');
        $(this).attr('aria-pressed', $(this).hasClass('active'));
    });


    // Event listener for refresh database button
    $('#refresh-database').off('click').on('click', function() {
        var $this = $(this);
        // Update the button text to show the loading state
        $this.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
        // Call the refreshDatabase function with a callback
        MyApp.api.refreshDatabase().then((message) => {
            console.log(message);
            // Update the table with the latest data
            MyApp.main.updatePriceTable();

            // Reset the button text to "Refresh Database" on success
            $this.text('Refresh Database');
        }).catch((error) => {
            alert(error);
            // Reset the button text to "Retry" on failure
            $this.text('Retry');
        });
    });

    // Event Listener for auth-status button - refersh token when pressed
    $('#auth-status').off('click').on('click', function() {
        var $this = $(this);
        // Update the button text to show the loading state
        $this.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
        // Call the refreshToken function with a callback
        MyApp.api.refreshToken().then((response) => {
            console.log(response);
            // Update the button text to "Token Valid" on success
            $this.text('Token Valid');
            $this.removeClass('btn-secondary').addClass('btn-success');
        }).catch((error) => {
            alert(error);
            // Update the button text to "Token Invalid" on failure
            $this.text('Token Invalid');
            $this.removeClass('btn-success').addClass('btn-secondary');
        });
    });

}

// we have a separate function to attach the event listener for the auth-status button
// so that we can call it from the main.js file outside of the initial fetch data function
function attachAuthStatusEventListener() {
    $('#auth-status').off('click').on('click', function() {
        var $this = $(this);
        // Update the button text to show the loading state
        $this.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
        // Call the refreshToken function with a callback
        MyApp.api.refreshToken().then((response) => {
            console.log(response);
            // Update the button text to "Token Valid" on success
            $this.text('Token Valid');
            $this.removeClass('btn-secondary btn-danger').addClass('btn-success');
        }).catch((error) => {
            alert(error);
            // Update the button text to "Token Invalid" on failure
            $this.text('Token Invalid');
            $this.removeClass('btn-success').addClass('btn-danger');
        });
    });
}

// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.ui = {
    attachEventListeners,
    attachAuthStatusEventListener 
};