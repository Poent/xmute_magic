import json
from bnet_auth_api import BnetAuthApi
from bnet_ah_api import BnetAhApi, AuctionDatabase


# TODO: Implement proper functions for calculating item stats and table stats
# TODO: fix auction_database.py so that it tracks duplicate snapshot data somehow, 
#       since the timestamp changes based on the pull time, and not the time the 
#       snapshot was taken...
# TODO: Implement Current Price function to accurately calcualte the current price of an item. Will use "market value" calculation (bottom 15% of prices). 
# TODO: Implement equation for calculating xmute profit based on tracked items and current prices


def load_xmute_commodities(file_path='xmute_commodities.json'):
    """Load the xmute_commodities.json file."""
    with open(file_path, 'r') as file:
        return json.load(file)['thaumaturgy_ingredients']

# Main logic
if __name__ == "__main__":
    # Load client credentials from auth.json
    with open('auth.json') as file:
        auth_data = json.load(file)

    # Initialize the database handler
    db_handler = AuctionDatabase(db_path='commodities.db')

    # Initialize authentication and API objects
    bnet_auth = BnetAuthApi(auth_data['client_id'], auth_data['client_secret'])
    wow_api = BnetAhApi(bnet_auth, db_handler)

    # Fetch and save commodities data to the database
    try:
        commodities = wow_api.get_commodities_db()
        db_handler.insert_commodities(commodities)
        print("Commodities data has been saved to the database.")
    except Exception as e:
        print(f"Error fetching commodities data: {e}")

    # Fetch and print the first 10 rows from the commodities table using the db handler
    columns, rows = db_handler.fetch_first_n_commodities(10)

    if rows:
        print("First 10 rows from the database:")
        for index, row in enumerate(rows, start=1):
            labeled_row = ", ".join(f"{col}: {val}" for col, val in zip(columns, row))
            print(f"Row {index}: {labeled_row}")
    else:
        print("No data available.")

    # save tracked items
    xmute_items = load_xmute_commodities()
    db_handler.track_items(xmute_items)
    print("Tracked items have been updated.")

    db_handler.get_item_stats(210796, "tracked_items")
    db_handler.get_table_stats("tracked_items")