'use strict';

(
    
    
    
    function() {



    // Function to check the token status
    function checkTokenStatus() {
        $.get('/token/status', function(response) {
            // Update the text or button color based on the token validity
            console.log(response);
            if (response.valid) {
                $('#auth-status').text('Token Valid').removeClass('btn-secondary').addClass('btn-success');
            } else {
                $('#auth-status').text('Token Invalid').removeClass('btn-secondary').addClass('btn-danger');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            // In case of an error in the request
            console.error('Error checking token:', textStatus, errorThrown);
            $('#auth-status').text('Error Checking Token').removeClass('btn-secondary').addClass('btn-danger');
        });
    }

    // Function to refresh the database
    function refreshDatabase(callback) {
        $.get('/database/refresh', function(response) {
            // Call the callback function with success status
            if (response.success) {
                updateTableFromServer();
                alert(response.message);
                if (callback) {
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

    // Function to update the table with data from the server
    function updateTableFromServer() {
        console.log('Updating table with data from server...');

        // Fetch the updated data from the server
        $.get('/database/summary', function(response) {
            try {
                console.log('Data received from server:', response);

                var grouped_items = response.grouped_items;

                table.clear(); // Clear the existing data

                // Iterate over the data (each item is a column, each tier is a row)
                var items = Object.keys(grouped_items); // Get the list of item names for the columns

                // Variable to store the latest 'last_updated' value
                var lastUpdated = null;

                // Prepare data for each tier
                var tiersData = {
                    'T1': [],
                    'T2': [],
                    'T3': []
                };

                // For each item, collect data for each tier
                items.forEach(function(item_name) {
                    var tiers = grouped_items[item_name];

                    // Update the 'lastUpdated' variable if we find a newer timestamp
                    console.log('Updating item:', item_name);
                    ['T1', 'T2', 'T3'].forEach(function(tier) {
                        if (tiers[tier] && tiers[tier].last_updated) {
                            if (!lastUpdated || new Date(tiers[tier].last_updated * 1000) > new Date(lastUpdated * 1000)) {
                                lastUpdated = tiers[tier].last_updated;
                            }
                        }
                    });

                    // For each tier, push the data into the corresponding array
                    ['T1', 'T2', 'T3'].forEach(function(tier) {
                        var priceCell = 'N/A';
                        if (tiers[tier]) {
                            var marketValue = (tiers[tier].market_value / 10000).toFixed(2);
                            var minUnitPrice = (tiers[tier].min_unit_price / 10000).toFixed(2);
                            priceCell =
                                '<span class="price" data-market_value="' +
                                marketValue +
                                '" data-min_unit_price="' +
                                minUnitPrice +
                                '">' +
                                marketValue +
                                ' g</span>';
                        }
                        tiersData[tier].push(priceCell);
                    });
                });

                // Now, add each tier row to the DataTable with the necessary classes and data attributes
                // First, add the "Tier" cell at the beginning of each row
                var rowDataT1 = ['T1'].concat(tiersData['T1']);
                var rowDataT2 = ['T2'].concat(tiersData['T2']);
                var rowDataT3 = ['T3'].concat(tiersData['T3']);

                // Add rows with row-specific options
                var rowNode;

                rowNode = table.row.add(rowDataT1).node();
                $(rowNode).addClass('tier-row').attr('data-tier', 'T1');

                rowNode = table.row.add(rowDataT2).node();
                $(rowNode).addClass('tier-row').attr('data-tier', 'T2');

                rowNode = table.row.add(rowDataT3).node();
                $(rowNode).addClass('tier-row').attr('data-tier', 'T3');

                // Redraw the table
                table.draw();

                console.log('Table updated successfully!');
                console.log('Last Updated:', lastUpdated);

                // Update the 'Last Updated' field
                if (lastUpdated) {
                    var date = new Date(lastUpdated * 1000); // Convert to milliseconds

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

                // After updating the table, update the prices based on selected price type
                var selectedPriceType = $('input[name="priceType"]:checked').val() || 'market_value';
                updatePrices(selectedPriceType);

            } catch (error) {
                console.error('Error updating table:', error);
                alert('Error updating table!');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error fetching updated data:', textStatus, errorThrown);
            alert('Error fetching updated data!');
        });
    }

    // Initialize DataTable
    var table = $('#commodities-table').DataTable({
        paging: false,
        searching: false,
        ordering: true,
        colReorder: true, // Enables column resizing
        autoWidth: false // Disable automatic width calculation
    });

    // Document ready function
    $(document).ready(function() {

        console.log("Document ready!");

        // Call the token check function when the page loads
        checkTokenStatus();

        // Refresh the token status every 30 seconds
        setInterval(checkTokenStatus, 30000); // 30 seconds

        // Update the table
        updateTableFromServer();

        // Initialize the prices with market_value as the default
        updatePrices('market_value');

        // Event listener for price type radio buttons
        $('input[name="priceType"]').on('change', function() {
            var selectedPriceType = $('input[name="priceType"]:checked').val(); // Get selected value
            updatePrices(selectedPriceType); // Update prices
        });

        // Event listener for refresh database button
        $('#refresh-database').on('click', function() {
            var $this = $(this);
            // Update the button text to show the loading state
            $this.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
            // Call the refreshDatabase function with a callback
            refreshDatabase(function(success) {
                if (success) {
                    // Reset the button text to "Refresh Database" on success
                    $this.text('Refresh Database');
                } else {
                    // Reset the button text to "Retry" on failure
                    $this.text('Retry');
                }
            });
        });

        // Toggle group functionality
        $('.toggle-group').on('click', function() {
            var groupName = $(this).attr('data-group');

            // Remove 'active' class from all group buttons
            $('.toggle-group').removeClass('active').attr('aria-pressed', false);

            // Add 'active' class to the clicked button
            $(this).addClass('active').attr('aria-pressed', true);

            // Deactivate all material buttons
            $('.toggle-column').removeClass('active').attr('aria-pressed', false);

            // Hide all columns except the first one ("Tier")
            table.columns().every(function(index) {
                if (index > 0) { // Exclude the first column
                    table.column(index).visible(false);
                }
            });

            // Activate and show columns for materials in the selected group
            $('.toggle-column[data-group="' + groupName + '"]').each(function() {
                // Activate the material button
                $(this).addClass('active').attr('aria-pressed', true);

                // Get the column index
                var columnIndex = parseInt($(this).attr('data-column'), 10);

                // Show the column
                table.column(columnIndex).visible(true);
            });

            // Adjust the table layout
            table.columns.adjust().draw();
        });

        // Reset materials functionality
        $('#reset-materials').on('click', function() {
            // Deactivate all group buttons
            $('.toggle-group').removeClass('active').attr('aria-pressed', false);

            // Activate all material buttons
            $('.toggle-column').addClass('active').attr('aria-pressed', true);

            // Show all columns
            table.columns().every(function(index) {
                table.column(index).visible(true);
            });

            // Adjust the table layout
            table.columns.adjust().draw();
        });

        // Toggle column visibility (Materials)
        $('.toggle-column').on('click', function() {
            var columnIndex = parseInt($(this).attr('data-column'), 10);
            var column = table.column(columnIndex);
            column.visible(!column.visible());

            // Toggle the button's active state
            $(this).toggleClass('active');
            $(this).attr('aria-pressed', $(this).hasClass('active'));

            // Adjust table layout after toggling columns
            table.columns.adjust().draw(); // Adjust and redraw the table
        });

        // Toggle row visibility (Tiers)
        $('.toggle-row').on('click', function() {
            var tier = $(this).attr('data-tier');
            $('tr[data-tier="' + tier + '"]').toggle();

            // Toggle the button's active state
            $(this).toggleClass('active');
            $(this).attr('aria-pressed', $(this).hasClass('active'));
        });
    });
})();
