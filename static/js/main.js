'use strict';

(function() {
    // Initialize the DataTable variable
    var table;

    // Function to check the token status
    function checkTokenStatus() {
        var deferred = $.Deferred();

        $.get('/token/status', function(response) {
            // Update the text or button color based on the token validity
            console.log(response);
            if (response.valid) {
                $('#auth-status').text('Token Valid').removeClass('btn-secondary').addClass('btn-success');
                console.log('Token is valid!');
                deferred.resolve();
            } else {
                $('#auth-status').text('Token Invalid').removeClass('btn-secondary').addClass('btn-danger');
                console.log('Token is invalid!');
                deferred.reject('Token is invalid');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            // In case of an error in the request
            console.error('Error checking token:', textStatus, errorThrown);
            $('#auth-status').text('Error Checking Token').removeClass('btn-secondary').addClass('btn-danger');
            deferred.reject('Error checking token');
        });

        return deferred.promise();
    }

    // Function to refresh the database
    function refreshDatabase(callback) {
        $.get('/database/refresh', function(response) {
            // Call the callback function with success status
            if (response.success) {
                // update the table
                
                alert(response.message);
                if (callback) {
                    console.log('Database refreshed successfully:', response.message);
                    callback(true);
                }
            } else {
                console.error('Error refreshing database:', response.message);
                alert('Error refreshing database!');
                if (callback) {
                    callback(false);
                }
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error refreshing database:', textStatus, errorThrown);
            alert('Error refreshing database!');
            // Call the callback function with failure status
            if (callback) {
                callback(false);
            }
        });
    }

    // Function to update prices based on the selected price type
    function updatePrices(priceType) {
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

    // Function to fetch data and initialize the page
    function fetchDataAndInitialize() {

        console.log('Fetching data...');

        $.get('/database/summary', function(response) {
            try {

                console.log('Response:', response);

                var grouped_items = response.grouped_items;
                var material_groups = response.material_groups;

                console.log('Grouped items:', grouped_items);
                console.log('Material groups:', material_groups);

                // Generate material buttons
                console.log('Generating material buttons...');
                generateMaterialButtons(grouped_items, material_groups);

                // Generate table headers
                console.log('Generating table headers...');
                generateTableHeaders(grouped_items);

                // Generate table rows
                console.log('Generating table rows...');
                generateTableRows(grouped_items);

                // Attach event listeners
                console.log('Attaching event listeners...');
                attachEventListeners();

                // Update prices based on selected price type
                var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
                updatePrices(selectedPriceType);

            } catch (error) {
                console.error('Error initializing data:', error);
                alert('Error initializing data!');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error fetching data:', textStatus, errorThrown);
            alert('Error fetching data!');
        });
    }

    // function to update the table with the latest data
    function updateTable() {
        $.get('/database/summary', function(response) {
            try {
                var grouped_items = response.grouped_items;
                var material_groups = response.material_groups;

                // Update table rows
                generateTableRows(grouped_items);

                // Update prices based on selected price type
                var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
                updatePrices(selectedPriceType);

            } catch (error) {
                console.error('Error updating table:', error);
                alert('Error updating table!');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error updating table:', textStatus, errorThrown);
            alert('Error updating table!');
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
                .addClass('btn btn-outline-primary btn-sm active')
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

    // Function to generate table rows
    function generateTableRows(grouped_items) {
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
        table = $('#commodities-table').DataTable({
            paging: false,
            searching: false,
            ordering: true,
            colReorder: false,  // Temporarily disable colReorder if causing issues
            autoWidth: false,
            stateSave: false  // Disable state save temporarily
        });
    
        // Update the 'Last Updated' field
        if (lastUpdatedTimestamp) {
            var date = new Date(lastUpdatedTimestamp * 1000); // Convert to milliseconds
    
            var options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short'
            };
    
            var formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    
            $('.last-updated').text('Last Updated: ' + formattedDate);
        }
    }
    

    // Function to attach event listeners
    function attachEventListeners() {
        // Price type radio buttons
        $('input[name="priceType"]').off('change').on('change', function() {
            var selectedPriceType = $('input[name="priceType"]:checked').val();
            updatePrices(selectedPriceType);
        });

        // Material buttons
        $('.toggle-column').off('click').on('click', function() {
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
            refreshDatabase(function(success) {
                if (success) {
                    // Update the table with the latest data
                    updateTable();
                    
                    // Reset the button text to "Refresh Database" on success
                    $this.text('Refresh Database');
                } else {
                    // Reset the button text to "Retry" on failure
                    $this.text('Retry');
                }
            });
        });
    }

    // Document ready function
    $(document).ready(function() {
        console.log("Document ready!");

        console.log("checking token status...");
        // Call the token check function when the page loads
        checkTokenStatus()
            .then(() => {
                console.log("Token is valid, fetching data and initializing...");
                // Fetch data and initialize the page
                fetchDataAndInitialize();

                // Refresh the token status every 30 seconds
                setInterval(checkTokenStatus, 30000); // 30 seconds
            })
            .catch((error) => {
                console.error(error);
            });
    });
})();
