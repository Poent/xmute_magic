import json

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