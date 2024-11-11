'use strict';

// Helper function to destroy DataTable if it exists
function destroyDataTableIfExists(tableSelector) {
    if ($.fn.dataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
    }
}

// Helper function to initialize DataTable with common options
function initializeDataTable(tableSelector) {
    return $(tableSelector).DataTable({
        paging: false,
        searching: false,
        ordering: true,
        colReorder: false,
        autoWidth: false,
        stateSave: false
    });
}

// function to get the value of transmutagen. There are three types of transmutagen (groups) in the game that we need to consider
// Ominous, Mercurial, and Volatile. When calculating the value of transmutagen, we need to take the value of the four possible result commodities, and then multiply them by the chance of getting that result.

// Function to calculate profit for a given item and tier
function calculateProfitForItem(itemName, tier, marketData, materialProperties, priceType) {
    // get item data for the given item and tier
    const itemData = marketData[itemName]?.[tier];
    if (!itemData) {
        console.warn(`Warning: Item data for ${itemName} (Tier ${tier}) not found.`);
        return 0;
    }

    const materialProp = materialProperties[itemName];
    if (!materialProp) {
        console.warn(`Warning: Material properties for ${itemName} not found.`);
        return 0;
    }

    const originalItemCost = parseFloat(itemData[priceType]) / 10000;
    let totalValue = 0;

    // Determine which tier to use for result materials
    const resultTier = (tier === 'T1' && MyApp.state?.t1ToT2Enabled) ? 'T2' : tier;

    materialProp.transmutations.forEach(({ material, result_chance }) => {
        const materialItemData = marketData[material]?.[resultTier];
        let marketValue = 0;

        if (materialItemData) {
            marketValue = parseFloat(materialItemData[priceType]) / 10000;
        } else {
            console.warn(`Warning: Market data for ${material} (Tier ${resultTier}) not found.`);
        }

        totalValue += marketValue * result_chance;
    });

    // Placeholder values for transmutagen
    const transmutagenValue = 0;
    const transmutagenResultChance = 0.12; // Assuming 12% chance
    totalValue += transmutagenValue * transmutagenResultChance;

    return totalValue - originalItemCost;
}

// Function to update prices based on the selected price type
function updatePriceTable(priceType) {
    const priceTable = MyApp.tables.priceTable;
    if (!priceTable) {
        console.error('priceTable is undefined in updatePriceTable');
        return;
    }

    const allRows = priceTable.rows().nodes(); 

    $(allRows).find('.price-cell').each(function() {
        const $cell = $(this);
        const $priceText = $cell.find('.price-text');
        const itemName = $cell.attr('data-item-name');
        const tier = $cell.closest('tr').attr('data-tier');
        const priceCopper = MyApp.data.market_data[itemName][tier][priceType];
        const priceFloat = priceCopper / 10000;

        if (!isNaN(priceFloat)) {
            $priceText.text(`${priceFloat.toFixed(2)} g`);
        }
    });
}



// Function to generate material buttons for toggling columns
function generateMaterialButtons(marketData, materialGroups) {
    const $materialButtons = $('#material-buttons');
    $materialButtons.empty();

    Object.keys(marketData).forEach(itemName => {
        const group = materialGroups[itemName] || '';
        const button = $('<button>')
            .addClass('toggle-column btn btn-outline-primary btn-sm active')
            .attr('data-item-name', itemName)
            .attr('data-group', group)
            .attr('aria-pressed', true)
            .text(itemName);

        $materialButtons.append(button);
    });
}

// Function to generate table headers dynamically based on marketData
function generateTableHeaders(marketData, tableHeaderSelector) {
    const $headerRow = $(tableHeaderSelector);
    $headerRow.empty();

    $headerRow.append('<th>Tier</th>');

    Object.keys(marketData).forEach(itemName => {
        $headerRow.append(`<th>${itemName}</th>`);
    });
}

// Function to generate rows for the price table
function generatePriceTableRows(marketData) {
    const $tableBody = $('#price-table-body');

    destroyDataTableIfExists('#price-table');
    $tableBody.empty();

    let lastUpdatedTimestamp = null;

    ['T1', 'T2', 'T3'].forEach(tier => {
        const $row = $('<tr>').addClass('tier-row').attr('data-tier', tier);
        $row.append(`<td>${tier}</td>`);

        Object.keys(marketData).forEach(itemName => {
            const itemData = marketData[itemName]?.[tier];
            let priceCell = '<td>N/A</td>';

            if (itemData) {
                const marketValue = (itemData.market_value / 10000).toFixed(2);
                const minUnitPrice = (itemData.min_unit_price / 10000).toFixed(2);

                // Price cell with data attributes for sorting and a hidden reset button
                priceCell = `
                <td tabindex="0" class="price-cell" data-market_value="${marketValue}" data-min_unit_price="${minUnitPrice}" data-item-name="${itemName}">
                    <span contenteditable="true" class="price-text">${marketValue} g</span>
                    <button class="reset-price-btn btn btn-sm btn-link" type="button" style="display: none;">Reset</button>
                </td>`;


                if (itemData.last_updated) {
                    const itemTimestamp = itemData.last_updated;
                    if (!lastUpdatedTimestamp || itemTimestamp > lastUpdatedTimestamp) {
                        lastUpdatedTimestamp = itemTimestamp;
                    }
                }
            }

            $row.append(priceCell);
        });

        $tableBody.append($row);
    });

    const table = initializeDataTable('#price-table');

    if (lastUpdatedTimestamp) {
        const formattedDate = MyApp.utils.formatTimestamp(lastUpdatedTimestamp);
        $('.last-updated').text(`Last Updated: ${formattedDate}`);
    }

    return table;
}


// Function to generate rows for the profit table
function generateProfitTableRows(marketData, materialProperties) {
    const $tableBody = $('#transmutations-table-body');

    destroyDataTableIfExists('#transmutation-profit-table');
    $tableBody.empty();

    const selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
    const profits = [];

    ['T1', 'T2', 'T3'].forEach(tier => {
        const $row = $('<tr>').addClass('tier-row').attr('data-tier', tier);
        $row.append(`<td>${tier}</td>`);

        Object.keys(marketData).forEach(itemName => {
            const profit = calculateProfitForItem(itemName, tier, marketData, materialProperties, selectedPriceType);
            profits.push(profit);

            const profitCell = `<td class="profit" data-item-name="${itemName}">${profit.toFixed(2)} g</td>`;
            $row.append(profitCell);
        });

        $tableBody.append($row);
    });

    const table = initializeDataTable('#transmutation-profit-table');

    // Apply color coding based on profit values
    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);
    const profitRange = maxProfit - minProfit || 1;
    const allRows = table.rows().nodes();

    $(allRows).each(function() {
        $(this).find('td').each(function() {
            const $cell = $(this);
            const profit = parseFloat($cell.text());

            if (!isNaN(profit)) {
                const color = getColorForProfit(profit, minProfit, maxProfit, profitRange);
                $cell.css('background-color', color);
            }
        });
    });

    return table;
}

// Function to update profits based on the grouped items and material properties
function updateProfitTable() {
    const profitTable = MyApp.tables.profitTable;
    const marketData = MyApp.data.market_data;
    const materialProperties = MyApp.data.material_properties;

    if (!profitTable) {
        console.error('profitTable is undefined in updateProfitTable');
        return;
    }

    const selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
    const allRows = profitTable.rows().nodes();
    const profits = [];

    $(allRows).each(function() {
        const $row = $(this);
        const tier = $row.attr('data-tier');

        $row.find('td').each(function() {
            const $cell = $(this);
            const itemName = $cell.attr('data-item-name');

            if (!itemName) return;

            const profit = calculateProfitForItem(itemName, tier, marketData, materialProperties, selectedPriceType);
            profits.push(profit);

            $cell.text(`${profit.toFixed(2)} g`);
            $cell.data('profit', profit);
        });
    });

    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);
    const profitRange = maxProfit - minProfit || 1;

    $(allRows).each(function() {
        $(this).find('td').each(function() {
            const $cell = $(this);
            const profit = $cell.data('profit');

            if (profit !== undefined) {
                const color = getColorForProfit(profit, minProfit, maxProfit, profitRange);
                $cell.css('background-color', color);
            }
        });
    });
}

// Function to get color based on profit value using HSL color model
function getColorForProfit(profit, minProfit, maxProfit, profitRange) {
    let hue;
    if (profit >= -1) {
        hue = 120; // Green
    } else {
        const ratio = (profit - minProfit) / (-1 - minProfit || 1);
        hue = ratio * 60; // Red to Yellow gradient
    }
    return `hsl(${hue}, 100%, 75%)`;
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
