import json
from bnet_auth_api import BnetAuthApi
from bnet_ah_api import BnetAhApi, AuctionDatabase

from utils import load_xmute_commodities, get_item_name_by_id

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



    # for each item in xmute_commodities.json, get the stats for the tracked_items table

    # Initialize a dictionary to group results by tier
    grouped_results = {}
    
    # Iterate through the data and group by tier
    for item in xmute_data:
        for tier in item["tiers"]:
            item_id = tier["item_id"]
            item_stats = db_handler.get_item_stats(item_id, "tracked_items")
            if item_stats:
                active_auctions, min_unit_price = item_stats
                item_name = get_item_name_by_id(item_id, xmute_data)
                tier_level = tier['tier']
                if tier_level not in grouped_results:
                    grouped_results[tier_level] = []
                grouped_results[tier_level].append({
                    "item_name": item_name,
                    "active_auctions": active_auctions,
                    "min_unit_price": min_unit_price
                })
    
    # Print the grouped results
    for tier, items in grouped_results.items():
        print(f"Tier: {tier}")
        for item in items:
            if item["min_unit_price"] is not None:
                print(f"  {item['item_name']}, Active auctions: {item['active_auctions']}, Minimum unit price: {item['min_unit_price'] / 10000:.2f} g")
            else:
                print(f"  {item['item_name']}, Active auctions: {item['active_auctions']}, Minimum unit price: N/A")

    # update the tracked items summary table
    db_handler.update_tracked_items_summary()
    print("Tracked items summary table updated.")

    #print the tracked items summary table
    print("Tracked items summary table:")
    db_handler.update_tracked_items_summary()

    # db_handler.print_tracked_items_summary()

    print(db_handler.get_tracked_items_summary())



