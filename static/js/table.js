'use strict';

// Function to update prices based on the selected price type
function updatePrices(priceType, table) {
    var allRows = table.rows().nodes();

    $(allRows).find('.price').each(function() {
        var price = $(this).attr('data-' + priceType);
        if (price !== undefined && !isNaN(price)) {
            var priceFloat = parseFloat(price);
            if (!isNaN(priceFloat)) {
                $(this).text(priceFloat.toFixed(2) + ' g');
            }
        }
    });
}

// Function to generate material buttons
function generateMaterialButtons(grouped_items, material_groups) {
    var $materialButtons = $('#material-buttons');
    $materialButtons.empty(); // Clear existing buttons

    var index = 1; // Start from 1 because the first column is 'Tier'

    Object.keys(grouped_items).forEach(function(item_name) {
        var group = material_groups[item_name] || '';
        var button = $('<button>')
            .addClass('toggle-column btn btn-outline-primary btn-sm active') // Added 'toggle-column'
            .attr('data-column', index)
            .attr('data-group', group)
            .attr('aria-pressed', true)
            .text(item_name);

        $materialButtons.append(button);

        index++;
    });
}

// Function to generate table headers
function generateTableHeaders(grouped_items) {
    var $headerRow = $('#commodities-table-header');
    $headerRow.empty(); // Clear existing headers

    // Add 'Tier' header
    $headerRow.append('<th>Tier</th>');

    // Add headers for each item
    Object.keys(grouped_items).forEach(function(item_name) {
        $headerRow.append('<th>' + item_name + '</th>');
    });
}

// Function to generate price table rows
function generatePriceTableRows(grouped_items) {
    console.log('Generating table rows...');
    var $tableBody = $('#commodities-table-body');
    
    // Destroy DataTable before manipulating the DOM
    if ($.fn.dataTable.isDataTable('#commodities-table')) {
        $('#commodities-table').DataTable().destroy();
    }

    // Clear existing rows
    console.log('Clearing existing rows...');
    $tableBody.empty(); 

    var lastUpdatedTimestamp = null;

    ['T1', 'T2', 'T3'].forEach(function(tier) {
        var $row = $('<tr>').addClass('tier-row').attr('data-tier', tier);

        // Add 'Tier' cell
        $row.append('<td>' + tier + '</td>');

        // Add price cells
        Object.keys(grouped_items).forEach(function(item_name) {
            var item_tiers = grouped_items[item_name];
            var itemData = item_tiers[tier];
            var priceCell = '<td>N/A</td>';

            if (itemData) {
                var marketValue = (itemData.market_value / 10000).toFixed(2);
                var minUnitPrice = (itemData.min_unit_price / 10000).toFixed(2);
                priceCell =
                    '<td contenteditable="true" class="price" data-market_value="' +
                    marketValue +
                    '" data-min_unit_price="' +
                    minUnitPrice +
                    '">' +
                    marketValue +
                    ' g</td>';

                // Update last updated timestamp
                if (itemData.last_updated) {
                    var itemTimestamp = itemData.last_updated;
                    if (!lastUpdatedTimestamp || itemTimestamp > lastUpdatedTimestamp) {
                        lastUpdatedTimestamp = itemTimestamp;
                    }
                }
            }

            $row.append(priceCell);
        });

        $tableBody.append($row);
    });

    // Reinitialize DataTable after the DOM manipulation
    var table = $('#commodities-table').DataTable({
        paging: false,
        searching: false,
        ordering: true,
        colReorder: false,  // Temporarily disable colReorder if causing issues
        autoWidth: false,
        stateSave: false  // Disable state save temporarily
    });

    // Update the 'Last Updated' field
    if (lastUpdatedTimestamp) {
        var formattedDate = MyApp.utils.formatTimestamp(lastUpdatedTimestamp);

        $('.last-updated').text('Last Updated: ' + formattedDate);
    }

    return table;
}

// Exporting functions
window.MyApp = window.MyApp || {};
window.MyApp.table = {
    updatePrices,
    generateMaterialButtons,
    generateTableHeaders,
    generatePriceTableRows
};
