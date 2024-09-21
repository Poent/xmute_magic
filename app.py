import json
from bnet_auth_api import BnetAuthApi
from bnet_ah_api import BnetAhApi, AuctionDatabase

# Load xmute_commodities.json data
def load_xmute_commodities(file_path='xmute_commodities.json'):
    """Load the xmute_commodities.json file and return the list of thaumaturgy ingredients."""
    with open(file_path, 'r') as file:
        return json.load(file)['thaumaturgy_ingredients']

# Lookup function for item name based on ID
def get_item_name_by_id(item_id, items):
    """Search the list of thaumaturgy ingredients to find the name of an item by its ID."""
    for item in items:
        for tier in item["tiers"]:
            if tier["item_id"] == item_id:
                return item["item_name"]
    return "Item ID not found"

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
        commodities = wow_api.get_commodities_db()
        db_handler.update_ah_snapshot(commodities)
        print("Commodities data has been saved to the database.")
    except Exception as e:
        print(f"Error fetching commodities data: {e}")

    # Store tracked items using the loaded xmute data
    db_handler.store_tracked_items(xmute_data)

    # Call the get_item_stats() function for a specific item_id and print the result
    item_id = 210933  # Replace with the item_id you want to check
    item_stats = db_handler.get_item_stats(item_id, "tracked_items")
    if item_stats:
        active_auctions, min_unit_price = item_stats
        # print the mapped name of the item_id
        print(f"DEBUG EXAMPLE USAGE >> Stats for Item: {get_item_name_by_id(item_id, xmute_data)}")
        if min_unit_price is not None:
            print(f"    Active auctions: {active_auctions}, Minimum unit price: {min_unit_price / 10000:.2f} g")
        else:
            print(f"    Active auctions: {active_auctions}, Minimum unit price: N/A")

    # Get table stats for the commodities table (last AH snapshot)
    print("Stats for the commodities table:")
    table_stats = db_handler.get_table_stats("commodities")
    
    if table_stats:
        total_auctions = table_stats.get("total_auctions")
        unique_items = table_stats.get("unique_item_ids")
        oldest_auction = table_stats.get("oldest_active_auction")
        
        print(f"    Total auctions: {total_auctions}, Unique items: {unique_items}, Last Snapshot Timestamp: {oldest_auction}")
    else:
        print("    No data available")


    #get stats for the tracked_items table
    print("Stats for the tracked_items table:")
    table_stats = db_handler.get_table_stats("tracked_items")

    if table_stats:
        total_auctions = table_stats.get("total_auctions")
        unique_items = table_stats.get("unique_item_ids")
        oldest_auction = table_stats.get("oldest_active_auction")

        print(f"    Total auctions: {total_auctions}, Unique items: {unique_items}, Oldest Auction: {oldest_auction}")
    else:
        print("    No data available")