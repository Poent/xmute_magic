import json
from bnet_auth_api import BnetAuthApi
from bnet_ah_api import BnetAhApi, AuctionDatabase

from utils import load_xmute_commodities, get_item_name_by_id, group_and_print_data, print_table_stats

DEBUG = False

# Main logic
if __name__ == "__main__":
    # Load the xmute commodities data once and pass it around as needed
    xmute_data = load_xmute_commodities()

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
        commodities = wow_api.get_commodities_db() # Fetch commodities data
        db_handler.update_ah_snapshot(commodities) # Save commodities data to the database
        print("Commodities data has been saved to the database.")
    except Exception as e:
        print(f"Error fetching commodities data: {e}")

    # pull the tracked items from the database and store them in the tracked_items table
    db_handler.store_tracked_items(xmute_data)
    db_handler.update_tracked_items_summary()

    # some debug output
    if DEBUG:
        print_table_stats(db_handler, "tracked_items")
        group_and_print_data(xmute_data, db_handler)

    # db_handler.print_tracked_items_summary()

    print(db_handler.get_tracked_items_summary())
    db_handler.print_tracked_items_summary()



