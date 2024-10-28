'use strict';

// Function to attach event listeners
function attachEventListeners(priceTable, profitTable) {
    var priceTable = MyApp.tables.priceTable;
    var profitTable = MyApp.tables.profitTable;

    // Price type radio buttons
    $('input[name="priceType"]').off('change').on('change', function() {
        var selectedPriceType = $('input[name="priceType"]:checked').val();
        MyApp.table.updatePriceTable(selectedPriceType);
        // Recalculate profits
        MyApp.table.updateProfitTable();
    });

   // Material buttons event listener
   $('#material-buttons').off('click', '.toggle-column').on('click', '.toggle-column', function() {
        var item_name = $(this).attr('data-item-name');

        // Toggle the button's active state
        $(this).toggleClass('active');
        var isActive = $(this).hasClass('active');
        $(this).attr('aria-pressed', isActive);

        // Toggle column visibility in both tables based on item_name
        toggleColumnVisibilityByItemName(item_name, isActive);
    });
    
    // Handle 'blur', 'keydown', and 'focusout' events on price text
    $('#price-table tbody').off('blur keydown focusout', '.price-text').on('blur keydown focusout', '.price-text', function(e) {
        var $priceText = $(this);
        var $cell = $priceText.closest('td');

        if (e.type === 'keydown' && e.key === 'Enter') {
            e.preventDefault();
            $priceText.blur(); // Trigger blur event to commit the edit
            return;
        }

        if (e.type === 'blur' || e.type === 'focusout') {
            var newPriceText = $priceText.text().replace(' g', '').trim();
            var newPrice = parseFloat(newPriceText);

            var tier = $cell.closest('tr').attr('data-tier');
            var itemName = $cell.attr('data-item-name');

            var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';

            if (!isNaN(newPrice)) {
                // Update grouped_items with new price
                MyApp.data.grouped_items[itemName][tier][selectedPriceType] = newPrice * 10000; // Convert back to copper

                // Recalculate profits and update colors
                MyApp.table.updateProfitTable();

                // Update the price text to include "g"
                $priceText.text(`${newPrice.toFixed(2)} g`);

                // Add a CSS class to indicate the cell has been modified
                $cell.addClass('modified-price-cell');

                // Show the reset button
                $cell.find('.reset-price-btn').show();
            } else {
                // If the input is not a valid number, reset the price text to the previous value
                var originalPriceCopper = MyApp.data.grouped_items[itemName][tier][selectedPriceType];
                var originalPriceGold = (originalPriceCopper / 10000).toFixed(2);
                $priceText.text(`${originalPriceGold} g`);

                // Remove modified class and hide reset button if present
                $cell.removeClass('modified-price-cell');
                $cell.find('.reset-price-btn').hide();
            }
        }
    });

    // Handle reset button clicks
    $('#price-table tbody').on('click', '.reset-price-btn', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling up

        var $btn = $(this);
        var $cell = $btn.closest('td');
        var $priceText = $cell.find('.price-text');

        var itemName = $cell.attr('data-item-name');
        var tier = $cell.closest('tr').attr('data-tier');
        var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';

        // Get the original price from MyApp.data.original_grouped_items
        var originalPriceCopper = MyApp.data.original_grouped_items[itemName][tier][selectedPriceType];
        var originalPriceGold = (originalPriceCopper / 10000).toFixed(2);

        // Update the price text
        $priceText.text(`${originalPriceGold} g`);

        // Update grouped_items with original price
        MyApp.data.grouped_items[itemName][tier][selectedPriceType] = originalPriceCopper;

        // Remove modified class and hide reset button
        $cell.removeClass('modified-price-cell');
        $btn.hide();

        // Recalculate profits and update colors
        MyApp.table.updateProfitTable();
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
        profitTable.columns().visible(false);
        profitTable.column(0).visible(true); // Keep 'Tier' column visible
    
        // Show columns for materials in the selected group
        $('.toggle-column[data-group="' + groupName + '"]').each(function() {
            $(this).addClass('active').attr('aria-pressed', true);
            var item_name = $(this).attr('data-item-name');
    
            // Show columns by item name
            toggleColumnVisibilityByItemName(item_name, true);
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

    // Handle reset all prices button
    $('#reset-all-prices').off('click').on('click', function() {
        // Confirm with the user
        if (!confirm('Are you sure you want to reset all prices to default values?')) {
            return;
        }

        const selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';

        // Reset grouped_items to original values
        MyApp.data.grouped_items = JSON.parse(JSON.stringify(MyApp.data.original_grouped_items));

        // Update the price table
        MyApp.table.updatePriceTable(selectedPriceType);

        // Remove modified class and hide reset buttons in all cells
        $('#price-table tbody').find('td.price-cell').each(function() {
            const $cell = $(this);
            $cell.removeClass('modified-price-cell');
            $cell.find('.reset-price-btn').hide();
        });

        // Recalculate profits and update colors
        MyApp.table.updateProfitTable();
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
        
        // Call the refreshDatabase function
        MyApp.api.refreshDatabase().then((message) => {
            console.log(message);

            // Fetch the updated data
            return MyApp.api.fetchData();
        }).then((data) => {
            // Update MyApp.data with the new data
            const { grouped_items, material_groups, material_properties } = data;

            // Convert material_properties array to an object keyed by item_name
            const materialProps = {};
            material_properties.forEach(item => {
                materialProps[item.item_name] = item;
            });

            MyApp.data = {
                grouped_items,
                material_groups,
                material_properties: materialProps,
            };

            // **Add this line to update original_grouped_items**
            MyApp.data.original_grouped_items = JSON.parse(JSON.stringify(grouped_items));

            // Re-initialize the tables with the new data
            MyApp.initializeTables(MyApp.data);

            // Reset the button text to "Refresh Database" on success
            $this.text('Refresh Database');
        }).catch((error) => {
            console.error(error);
            alert('Error refreshing database!');
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
    
// Modify toggleColumnVisibilityByItemName to access priceTable and profitTable from MyApp.tables
function toggleColumnVisibilityByItemName(item_name, isVisible) {
    var priceTable = MyApp.tables.priceTable;
    var profitTable = MyApp.tables.profitTable;

    // Find the column in the price table
    var priceColumn = priceTable.column(function(idx, data, node) {
        var header = $(priceTable.column(idx).header());
        return header.text() === item_name;
    });

    // Find the column in the profit table
    var profitColumn = profitTable.column(function(idx, data, node) {
        var header = $(profitTable.column(idx).header());
        return header.text() === item_name;
    });

    // Toggle visibility
    priceColumn.visible(isVisible);
    profitColumn.visible(isVisible);
}


// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.ui = {
    attachEventListeners,
    attachAuthStatusEventListener ,
    toggleColumnVisibilityByItemName
};