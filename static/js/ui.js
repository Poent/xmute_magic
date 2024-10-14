'use strict';

// Function to attach event listeners
function attachEventListeners(priceTable) {
    // Price type radio buttons
    $('input[name="priceType"]').off('change').on('change', function() {
        var selectedPriceType = $('input[name="priceType"]:checked').val();
        MyApp.table.updatePrices(selectedPriceType, priceTable);
    });

    // Material buttons using event delegation
    $('#material-buttons').off('click', '.toggle-column').on('click', '.toggle-column', function() {
        var columnIndex = parseInt($(this).attr('data-column'), 10);
        var column = priceTable.column(columnIndex);
        column.visible(!column.visible());

        // Toggle the button's active state
        $(this).toggleClass('active');
        $(this).attr('aria-pressed', $(this).hasClass('active'));
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

        // Show columns for materials in the selected group
        $('.toggle-column[data-group="' + groupName + '"]').each(function() {
            $(this).addClass('active').attr('aria-pressed', true);
            var columnIndex = parseInt($(this).attr('data-column'), 10);
            priceTable.column(columnIndex).visible(true);
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

// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.ui = {
    attachEventListeners
};