'use strict';

// Function to update prices based on the selected price type (market_value or min_unit_price)
function updatePriceTable(priceType) {
    var priceTable = MyApp.tables.priceTable;
    if (!priceTable) {
        console.error('priceTable is undefined in updatePriceTable');
        return;
    }
    var allRows = priceTable.rows().nodes(); // Get all rows from the DataTable

    // Iterate over each cell with the class 'price' in all rows
    $(allRows).find('.price').each(function() {
        // Retrieve the price value based on the selected price type
        var price = $(this).attr('data-' + priceType);
        if (price !== undefined && !isNaN(price)) {
            var priceFloat = parseFloat(price);
            if (!isNaN(priceFloat)) {
                // Update the cell text with the formatted price
                $(this).text(priceFloat.toFixed(2) + ' g');
            }
        }
    });
}


// Function to generate material buttons for toggling columns
function generateMaterialButtons(grouped_items, material_groups) {
    var $materialButtons = $('#material-buttons');
    $materialButtons.empty(); // Clear existing buttons

    // Iterate over each material in grouped_items
    Object.keys(grouped_items).forEach(function(item_name) {
        var group = material_groups[item_name] || ''; // Get the group of the material

        // Create a button element for the material
        var button = $('<button>')
            .addClass('toggle-column btn btn-outline-primary btn-sm active')
            .attr('data-item-name', item_name) // Add data-item-name attribute
            .attr('data-group', group)
            .attr('aria-pressed', true)
            .text(item_name);

        // Append the button to the material buttons container
        $materialButtons.append(button);
    });
}


// Function to generate table headers dynamically based on grouped_items
function generateTableHeaders(grouped_items, tableHeaderSelector) {
    var $headerRow = $(tableHeaderSelector);
    $headerRow.empty(); // Clear existing headers

    // Add 'Tier' header as the first column
    $headerRow.append('<th>Tier</th>');

    // Add headers for each material
    Object.keys(grouped_items).forEach(function(item_name) {
        $headerRow.append('<th>' + item_name + '</th>');
    });
}

// Function to generate rows for the price table
function generatePriceTableRows(grouped_items) {
    console.log('Generating table rows...');
    var $tableBody = $('#price-table-body');
    
    // Destroy existing DataTable instance before manipulating the DOM
    if ($.fn.dataTable.isDataTable('#price-table')) {
        $('#price-table').DataTable().destroy();
    }

    // Clear existing rows from the table body
    console.log('Clearing existing rows...');
    $tableBody.empty(); 

    var lastUpdatedTimestamp = null; // Variable to track the most recent update time

    // Iterate over each tier (T1, T2, T3)
    ['T1', 'T2', 'T3'].forEach(function(tier) {
        // Create a new row for the current tier
        var $row = $('<tr>').addClass('tier-row').attr('data-tier', tier);

        // Add the 'Tier' cell to the row
        $row.append('<td>' + tier + '</td>');

        // Add price cells for each material in the current tier
        Object.keys(grouped_items).forEach(function(item_name) {
            var item_tiers = grouped_items[item_name]; // Get tier data for the material
            var itemData = item_tiers[tier]; // Get data for the specific tier
            var priceCell = '<td>N/A</td>'; // Default cell content if data is missing

            if (itemData) {
                // Calculate market value and min unit price in gold
                var marketValue = (itemData.market_value / 10000).toFixed(2);
                var minUnitPrice = (itemData.min_unit_price / 10000).toFixed(2);

                priceCell =
                    '<td contenteditable="true" class="price" data-market_value="' +
                    marketValue +
                    '" data-min_unit_price="' +
                    minUnitPrice +
                    '" data-item-name="' +
                    item_name +
                    '">' +
                    marketValue +
                    ' g</td>';

                // Update the last updated timestamp if the current item is more recent
                if (itemData.last_updated) {
                    var itemTimestamp = itemData.last_updated;
                    if (!lastUpdatedTimestamp || itemTimestamp > lastUpdatedTimestamp) {
                        lastUpdatedTimestamp = itemTimestamp;
                    }
                }
            }

            // Append the price cell to the row
            $row.append(priceCell);
        });

        // Append the completed row to the table body
        $tableBody.append($row);
    });

    // Reinitialize DataTable after DOM manipulation
    var table = $('#price-table').DataTable({
        paging: false,
        searching: false,
        ordering: true,
        colReorder: false,  // Temporarily disable column reordering if causing issues
        autoWidth: false,
        stateSave: false  // Disable state saving temporarily
    });

    // Update the 'Last Updated' field in the UI
    if (lastUpdatedTimestamp) {
        var formattedDate = MyApp.utils.formatTimestamp(lastUpdatedTimestamp);
        $('.last-updated').text('Last Updated: ' + formattedDate);
    }

    return table; // Return the initialized DataTable instance
}

// Function to generate rows for the profit table
function generateProfitTableRows(grouped_items, material_properties) {
    console.log('Generating profit table rows...');
    var $tableBody = $('#transmutations-table-body');

    // Destroy DataTable before manipulating the DOM
    if ($.fn.dataTable.isDataTable('#transmutation-profit-table')) {
        $('#transmutation-profit-table').DataTable().destroy();
    }

    // Clear existing rows
    $tableBody.empty();

    ['T1', 'T2', 'T3'].forEach(function(tier) {
        var $row = $('<tr>').addClass('tier-row').attr('data-tier', tier);

        // Add 'Tier' cell
        $row.append('<td>' + tier + '</td>');

        // Add profit cells
        Object.keys(grouped_items).forEach(function(item_name) {
            var itemData = grouped_items[item_name][tier];
            var profit = 0;

            console.log(`\nProcessing Item: ${item_name}, Tier: ${tier}`);

            if (itemData) {
                var materialProp = material_properties[item_name];
                if (materialProp) {
                    var transmutations = materialProp.transmutations;

                    var totalValue = 0;
                    console.log(`Original Item Cost (${item_name}):`);
                    var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
                    var originalItemCost = parseFloat(itemData[selectedPriceType]) / 10000;
                    console.log(`- ${selectedPriceType}: ${originalItemCost} g`);

                    // Iterate over each possible transmutation result
                    transmutations.forEach(function(transmutation) {
                        var materialName = transmutation.material;
                        var resultChance = transmutation.result_chance;

                        // Get the market value of the material
                        var materialItemData = grouped_items[materialName] && grouped_items[materialName][tier];
                        var marketValue = 0;

                        if (materialItemData) {
                            marketValue = parseFloat(materialItemData[selectedPriceType]) / 10000;
                        } else {
                            marketValue = 0;
                            console.warn(`Warning: Market data for ${materialName} (Tier ${tier}) not found.`);
                        }

                        var expectedValue = marketValue * resultChance;
                        totalValue += expectedValue;

                        console.log(`Transmutation Result: ${materialName}`);
                        console.log(`- Result Chance: ${resultChance}`);
                        console.log(`- Market Value: ${marketValue} g`);
                        console.log(`- Expected Value: ${expectedValue} g`);
                    });

                    // Transmutagen value and result chance
                    var transmutagenValue = 0; // Placeholder value in gold
                    var transmutagenResultChance = 0.12; // Assuming 16% chance
                    var transmutagenExpectedValue = transmutagenValue * transmutagenResultChance;
                    totalValue += transmutagenExpectedValue;

                    console.log(`Transmutagen:`);
                    console.log(`- Value: ${transmutagenValue} g`);
                    console.log(`- Result Chance: ${transmutagenResultChance}`);
                    console.log(`- Expected Value: ${transmutagenExpectedValue} g`);

                    // Profit calculation
                    profit = totalValue - originalItemCost;

                    console.log(`Total Expected Value: ${totalValue} g`);
                    console.log(`Profit: ${profit} g`);
                } else {
                    console.warn(`Warning: Material properties for ${item_name} not found.`);
                }
            } else {
                console.warn(`Warning: Item data for ${item_name} (Tier ${tier}) not found.`);
            }

            var profitCell =
                '<td class="profit" data-item-name="' +
                item_name +
                '">' +
                profit.toFixed(2) +
                ' g</td>';

            $row.append(profitCell);
        });

        $tableBody.append($row);
    });

    // Reinitialize DataTable after the DOM manipulation
    var table = $('#transmutation-profit-table').DataTable({
        paging: false,
        searching: false,
        ordering: true,
        colReorder: false,
        autoWidth: false,
        stateSave: false
    });

    return table;
}

// Function to update profits based on the grouped items and material properties
function updateProfitTable(grouped_items, material_properties, profitTable) {
    var profitTable = MyApp.tables.profitTable;
    var grouped_items = MyApp.data.grouped_items;
    var material_properties = MyApp.data.material_properties;

    if (!profitTable) {
        console.error('profitTable is undefined in updateProfitTable');
        return;
    }

    var allRows = profitTable.rows().nodes();
    var profits = []; // Array to store all profit values

    $(allRows).each(function() {
        var $row = $(this);
        var tier = $row.attr('data-tier');

        // For each cell in the row
        $row.find('td').each(function() {
            var $cell = $(this);
            var item_name = $cell.attr('data-item-name');

            // Skip if item_name is not defined (e.g., 'Tier' cell)
            if (!item_name) return;

            var itemData = grouped_items[item_name][tier];
            var profit = 0;

            console.log(`\nUpdating Profit for Item: ${item_name}, Tier: ${tier}`);

            if (itemData) {
                var materialProp = material_properties[item_name];
                if (materialProp) {
                    var transmutations = materialProp.transmutations;

                    var totalValue = 0;
                    console.log(`Original Item Cost (${item_name}):`);
                    var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
                    var originalItemCost = parseFloat(itemData[selectedPriceType]) / 10000;
                    console.log(`- ${selectedPriceType}: ${originalItemCost} g`);

                    // Iterate over each possible transmutation result
                    transmutations.forEach(function(transmutation) {
                        var materialName = transmutation.material;
                        var resultChance = transmutation.result_chance;

                        // Get the market value of the material
                        var materialItemData = grouped_items[materialName] && grouped_items[materialName][tier];
                        var marketValue = 0;

                        if (materialItemData) {
                            marketValue = parseFloat(materialItemData[selectedPriceType]) / 10000;
                        } else {
                            marketValue = 0;
                            console.warn(`Warning: Market data for ${materialName} (Tier ${tier}) not found.`);
                        }

                        var expectedValue = marketValue * resultChance;
                        totalValue += expectedValue;

                        console.log(`Transmutation Result: ${materialName}`);
                        console.log(`- Result Chance: ${resultChance}`);
                        console.log(`- Market Value: ${marketValue} g`);
                        console.log(`- Expected Value: ${expectedValue} g`);
                    });

                    // Transmutagen value and result chance
                    var transmutagenValue = 0; // Placeholder value in gold
                    var transmutagenResultChance = 0.12; // Assuming 16% chance
                    var transmutagenExpectedValue = transmutagenValue * transmutagenResultChance;
                    totalValue += transmutagenExpectedValue;

                    console.log(`Transmutagen:`);
                    console.log(`- Value: ${transmutagenValue} g`);
                    console.log(`- Result Chance: ${transmutagenResultChance}`);
                    console.log(`- Expected Value: ${transmutagenExpectedValue} g`);

                    // Profit calculation
                    profit = totalValue - originalItemCost;

                    console.log(`Total Expected Value: ${totalValue} g`);
                    console.log(`Profit: ${profit} g`);
                } else {
                    console.warn(`Warning: Material properties for ${item_name} not found.`);
                }
            } else {
                console.warn(`Warning: Item data for ${item_name} (Tier ${tier}) not found.`);
            }

            // Store the profit value
            profits.push(profit);

            // Update the profit cell
            $cell.text(profit.toFixed(2) + ' g');
            $cell.data('profit', profit); // Store profit value in cell data for later use
        });
    });

    // After calculating all profits, determine the min and max values
    var minProfit = Math.min(...profits);
    var maxProfit = Math.max(...profits);

    // Avoid division by zero
    var profitRange = maxProfit - minProfit || 1;

    // Now apply color coding based on the profit values
    $(allRows).each(function() {
        var $row = $(this);

        $row.find('td').each(function() {
            var $cell = $(this);
            var profit = $cell.data('profit');

            // Skip if profit is undefined
            if (profit === undefined) return;

            // Calculate color based on profit
            var color = getColorForProfit(profit, minProfit, maxProfit, profitRange);
            $cell.css('background-color', color);
        });
    });
}



// Function to get color based on profit value using HSL color model
function getColorForProfit(profit, minProfit, maxProfit, profitRange) {
    var hue;
    if (profit >= -1) {
        // Profits greater than or equal to -1 are green
        hue = 120; // Green hue in HSL
    } else {
        // Profits less than -1: red to yellow gradient
        // Map profits from minProfit to -1
        var ratio = (profit - minProfit) / (-1 - minProfit || 1); // Avoid division by zero
        hue = ratio * 60; // 0 = red, 60 = yellow
    }

    // Return the HSL color string with full saturation and 75% lightness
    return 'hsl(' + hue + ', 100%, 75%)';
}

// Exporting functions to make them accessible in other modules
window.MyApp = window.MyApp || {};
window.MyApp.table = {
    updatePriceTable,
    generateMaterialButtons,
    generateTableHeaders,
    generatePriceTableRows,
    generateProfitTableRows,
    updateProfitTable,
    getColorForProfit
};
