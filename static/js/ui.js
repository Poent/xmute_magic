'use strict';

// Function to attach event listeners
function attachEventListeners(table) {
    // Price type radio buttons
    $('input[name="priceType"]').off('change').on('change', function() {
        var selectedPriceType = $('input[name="priceType"]:checked').val();
        MyApp.table.updatePrices(selectedPriceType, table);
    });

    // Material buttons using event delegation
    $('#material-buttons').off('click', '.toggle-column').on('click', '.toggle-column', function() {
        var columnIndex = parseInt($(this).attr('data-column'), 10);
        var column = table.column(columnIndex);
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
        table.columns().visible(false);
        table.column(0).visible(true); // Keep 'Tier' column visible

        // Show columns for materials in the selected group
        $('.toggle-column[data-group="' + groupName + '"]').each(function() {
            $(this).addClass('active').attr('aria-pressed', true);
            var columnIndex = parseInt($(this).attr('data-column'), 10);
            table.column(columnIndex).visible(true);
        });
    });

    // Reset materials button
    $('#reset-materials').off('click').on('click', function() {
        // Deactivate group buttons
        $('.toggle-group').removeClass('active').attr('aria-pressed', false);

        // Activate all material buttons
        $('.toggle-column').addClass('active').attr('aria-pressed', true);

        // Show all columns
        table.columns().visible(true);
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
            alert(message);
            // Update the table with the latest data
            MyApp.main.updateTable();

            // Reset the button text to "Refresh Database" on success
            $this.text('Refresh Database');
        }).catch((error) => {
            alert(error);
            // Reset the button text to "Retry" on failure
            $this.text('Retry');
        });
    });
}

// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.ui = {
    attachEventListeners
};
