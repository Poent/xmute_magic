'use strict';

// Function to attach event listeners
function attachEventListeners(priceTable, profitTable) {
    var priceTable = MyApp.tables.priceTable;
    var profitTable = MyApp.tables.profitTable;

    // Price type radio buttons
    $('input[name="priceType"]').off('change').on('change', function() {
        var selectedPriceType = $('input[name="priceType"]:checked').val();
        MyApp.table.updatePriceTable(selectedPriceType);
        MyApp.table.updateCrystalizedTable(selectedPriceType);
        MyApp.table.updateTransmutagenTable(selectedPriceType);
        // Recalculate profits
        MyApp.table.updateProfitTable();
    });

    // ui.js
    
    // Include Transmutagen Value in Profit toggle
    $('#toggle-transmutagen-value').off('click').on('click', function() {
        const wasEnabled = MyApp.state.includeTransmutagenValue;
        MyApp.state.includeTransmutagenValue = !wasEnabled;

        // Toggle classes based on state
        if (MyApp.state.includeTransmutagenValue) {
            $(this).removeClass('btn-outline-secondary').addClass('btn-primary active');
            $(this).attr('aria-pressed', 'true').text('Exclude Transmutagen');
        } else {
            $(this).removeClass('btn-primary active').addClass('btn-outline-secondary');
            $(this).attr('aria-pressed', 'false').text('Include Transmutagen');
        }

        // Recalculate and update profit table
        MyApp.table.updateProfitTable();
    });


   // Material buttons event listener
   // This event listener is attached to the parent element of the material buttons and will toggle the table column visibility based on the data-item-name attribute
   $('#material-buttons').off('click', '.toggle-column').on('click', '.toggle-column', function() {
        var item_name = $(this).attr('data-item-name');

        // Toggle the button's active state
        $(this).toggleClass('active');
        var isActive = $(this).hasClass('active');
        $(this).attr('aria-pressed', isActive);

        // Toggle column visibility in both tables based on item_name
        toggleColumnVisibilityByItemName(item_name, isActive);
    });

    // T1->T2 transmutation toggle
    $('#toggle-t1-t2-transmutation').off('click').on('click', function() {
        const $button = $(this);
        
        // Toggle state
        MyApp.state.t1ToT2Enabled = !MyApp.state.t1ToT2Enabled;
        
        // Update button appearance - using same pattern as other toggle buttons
        $button.toggleClass('active');
        $button.attr('aria-pressed', MyApp.state.t1ToT2Enabled);
        
        // Recalculate profits with new mode
        MyApp.table.updateProfitTable();
    });
    
    // Handle 'blur', 'keydown', and 'focusout' events on price text
    // This allows the user to edit the price by clicking on it, and will commit the edit when the user clicks away or presses Enter
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
                // Update market_data with new price
                MyApp.data.market_data[itemName][tier][selectedPriceType] = newPrice * 10000; // Convert back to copper

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
                var originalPriceCopper = MyApp.data.market_data[itemName][tier][selectedPriceType];
                var originalPriceGold = (originalPriceCopper / 10000).toFixed(2);
                $priceText.text(`${originalPriceGold} g`);

                // Remove modified class and hide reset button if present
                $cell.removeClass('modified-price-cell');
                $cell.find('.reset-price-btn').hide();
            }
        }
    });

    // Handle reset button clicks
    // This button resets the price of an individual item to the original value
    $('#price-table tbody').on('click', '.reset-price-btn', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling up

        var $btn = $(this);
        var $cell = $btn.closest('td');
        var $priceText = $cell.find('.price-text');

        var itemName = $cell.attr('data-item-name');
        var tier = $cell.closest('tr').attr('data-tier');
        var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';

        // Get the original price from MyApp.data.original_market_data
        var originalPriceCopper = MyApp.data.original_market_data[itemName][tier][selectedPriceType];
        var originalPriceGold = (originalPriceCopper / 10000).toFixed(2);

        // Update the price text
        $priceText.text(`${originalPriceGold} g`);

        // Update market_data with original price
        MyApp.data.market_data[itemName][tier][selectedPriceType] = originalPriceCopper;

        // Remove modified class and hide reset button
        $cell.removeClass('modified-price-cell');
        $btn.hide();

        // Recalculate profits and update colors
        MyApp.table.updateProfitTable();
    });


    // Group buttons
    // this button will toggle the visibility of GROUPS of materials based on the data-group attribute
    // Group buttons event handler
    $('.toggle-group').off('click').on('click', function() {
        var groupName = $(this).attr('data-group');
        var priceTable = MyApp.tables.priceTable;
        var profitTable = MyApp.tables.profitTable;

        console.log('Group clicked:', groupName);
        console.log('Price table columns:', priceTable.columns().nodes().length);
        console.log('Materials in group:', $('.toggle-column[data-group="' + groupName + '"]').length);
    
        // Log each material's name in the group
        $('.toggle-column[data-group="' + groupName + '"]').each(function() {
            console.log('Material:', $(this).attr('data-item-name'));
        });

        // Deactivate other group buttons
        $('.toggle-group').removeClass('active').attr('aria-pressed', false);

        // Activate clicked button
        $(this).addClass('active').attr('aria-pressed', true);

        // Deactivate all material buttons
        $('.toggle-column').removeClass('active').attr('aria-pressed', false);

        // First, hide all columns
        for (let i = 1; i < priceTable.columns().nodes().length; i++) {
            priceTable.column(i).visible(false);
            profitTable.column(i).visible(false);
        }
        
        // Keep 'Tier' column visible (first column)
        priceTable.column(0).visible(true);
        profitTable.column(0).visible(true);

        // Show columns for materials in the selected group
        $('.toggle-column[data-group="' + groupName + '"]').each(function() {
            $(this).addClass('active').attr('aria-pressed', true);
            var itemName = $(this).attr('data-item-name');
            
            // Find and show columns by matching header text
            priceTable.columns().every(function(index) {
                var header = $(this.header()).text().trim();
                if (header === itemName) {
                    priceTable.column(index).visible(true);
                    profitTable.column(index).visible(true);
                }
            });
        });

        // Redraw tables to reflect changes
        priceTable.columns.adjust().draw(false);
        profitTable.columns.adjust().draw(false);
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

        // Reset market_data to original values
        MyApp.data.market_data = JSON.parse(JSON.stringify(MyApp.data.original_market_data));

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
            const { market_data, material_groups, material_properties } = data;

            // Convert material_properties array to an object keyed by item_name
            const materialProps = {};
            material_properties.thaumaturgy_ingredients.forEach(item => {
                materialProps[item.item_name] = item;
            });

            MyApp.data = {
                market_data,
                material_groups,
                material_properties: materialProps,
            };

            // **Add this line to update original_market_data**
            MyApp.data.original_market_data = JSON.parse(JSON.stringify(market_data));

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