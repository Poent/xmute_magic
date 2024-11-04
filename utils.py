import json

# Load xmute_commodities.json data
def load_xmute_commodities(file_path='xmute_commodities.json'):
    """Load the xmute_commodities.json file and return the list of thaumaturgy ingredients."""
    with open(file_path, 'r') as file:
        return json.load(file)

# Lookup function for item name based on ID
def get_item_name_by_id(item_id, xmute_data):
    """Search the JSON data to find the name of an item by its ID."""
    
    # Search in thaumaturgy_ingredients
    for item in xmute_data.get("thaumaturgy_ingredients", []):
        for tier in item["tiers"]:
            if tier["item_id"] == item_id:
                return item["item_name"]
    
    # Search in crystalized
    for item in xmute_data.get("crystalized", []):
        if item["item_id"] == item_id:
            return item["item_name"]
    
    return "Item ID not found"


def group_and_print_data(xmute_data, db_handler):
    grouped_results = {}
    
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
    
    for tier, items in grouped_results.items():
        print(f"Tier: {tier}")
        for item in items:
            if item["min_unit_price"] is not None:
                print(f"  {item['item_name']}, Active auctions: {item['active_auctions']}, Minimum unit price: {item['min_unit_price'] / 10000:.2f} g")
            else:
                print(f"  {item['item_name']}, Active auctions: {item['active_auctions']}, Minimum unit price: N/A")

def print_table_stats(db_handler, table_name):
    print(f"Stats for the {table_name} table:")
    table_stats = db_handler.get_table_stats(table_name)
    
    if table_stats:
        total_auctions = table_stats.get("total_auctions")
        unique_items = table_stats.get("unique_item_ids")
        oldest_auction = table_stats.get("oldest_active_auction")
        
        print(f"    Total auctions: {total_auctions}, Unique items: {unique_items}, Oldest Auction: {oldest_auction}")
    else:
        print("    No data available")


