import datetime
import json
import logging
import logging.config

from flask import Flask, jsonify, render_template

from auction_database import AuctionDatabase
from bnet_ah_api import BnetAhApi
from bnet_auth_api import BnetAuthApi
from utils import get_item_name_by_id, load_xmute_commodities

logging.basicConfig(level=logging.INFO)

# Load the client_id and client_secret from the auth.json file
try:
    with open('auth.json', 'r') as file:
        auth_data = json.load(file)
        client_id = auth_data['client_id']
        client_secret = auth_data['client_secret']
except (FileNotFoundError, KeyError) as e:
    raise RuntimeError("Error loading authentication data: {}".format(e))

# Flask app
app = Flask(__name__)

# Initialize the BnetAuthApi object
bnet_auth = BnetAuthApi(client_id, client_secret, token_file='token.json')

# Initialize the database handler
db_handler = AuctionDatabase(db_path='commodities.db')

# Initialize the BnetAhApi object
bnet = BnetAhApi(bnet_auth, db_handler)

# Add the custom datetime filter for formatting timestamps
@app.template_filter('datetimeformat')
def datetimeformat(value):
    return datetime.datetime.fromtimestamp(value).strftime('%Y-%m-%d %H:%M:%S')

# function to derive material groups from xmute_data
def get_material_groups(xmute_data):
    material_groups = {}
    for item in xmute_data:  # xmute_data is a list
        item_name = item.get('item_name', '')
        transmutations = item.get('transmutations', [])
        group = None
        for transmutation in transmutations:
            material = transmutation.get('material', '')
            if "Mercurial Transmutation" in material:
                group = "Mercurial"
                break  # Found the group, no need to check further
            elif "Ominous Transmutation" in material:
                group = "Ominous"
                break
            elif "Volatile Transmutation" in material:
                group = "Volatile"
                break
        if group:
            material_groups[item_name] = group
    return material_groups

# function to group the items by material
def get_grouped_items():
    xmute_data = load_xmute_commodities()  # xmute_data is a list
    tracked_items_summary = db_handler.get_tracked_items_summary()
    item_summary_by_id = {item['item_id']: item for item in tracked_items_summary}

    grouped_items = {}
    for item in xmute_data:
        item_name = item.get('item_name', '')
        tiers = item.get('tiers', [])
        tier_data = {}
        for tier in tiers:
            tier_number = tier.get('tier')
            tier_key = f'T{tier_number}' if tier_number else 'T0'
            item_id = tier.get('item_id')
            tier_data[tier_key] = item_summary_by_id.get(item_id, None)
        grouped_items[item_name] = tier_data
    return grouped_items

# function to return just the xmute data
def get_xmute_data():
    xmute_data = load_xmute_commodities()
    logging.info(f"xmute_data type: {type(xmute_data)}")
    if isinstance(xmute_data, dict):
        logging.info(f"xmute_data keys: {list(xmute_data.keys())}")
    return xmute_data

# Default route
@app.route('/')
def home():
    logging.info("Home route accessed")
    return render_template('index.html')

# Route to check the token status
@app.route('/token/status', methods=['GET'])
def token_status():
    logging.info("Token status route accessed")
    token_valid = bnet_auth.is_token_valid()
    return jsonify({'valid': token_valid})

# Route to refresh the token
@app.route('/token/refresh', methods=['POST'])
def refresh_token():
    logging.info("Token refresh route accessed")
    if not bnet_auth.refresh_token():
        return jsonify({'message': 'Failed to refresh token'}), 500
    return jsonify({'message': 'Token refreshed'})

# Route to update the database
@app.route('/database/refresh', methods=['GET'])
def refresh_database():
    logging.info("Database refresh route accessed")
    try:
        # Fetch the commodities data from the WoW API
        commodities_data = bnet.get_commodities_db()
        # Update the database with the commodities data
        db_handler.update_ah_snapshot(commodities_data)
        db_handler.store_tracked_items(load_xmute_commodities())
        db_handler.update_tracked_items_summary()
        return jsonify({'success': True, 'message': 'Database updated'})
    except Exception as e:
        logging.error(f"Error refreshing database: {e}")
        return jsonify({'success': False, 'message': 'Error refreshing database'}), 500

# Route to get the summary data of the tracked items from the database
@app.route('/database/summary', methods=['GET'])
def database_summary():
    logging.info("Database summary route accessed")
    xmute_data = get_xmute_data()  # Retrieve xmute_data
    grouped_items = get_grouped_items()
    material_groups = get_material_groups(xmute_data)
    return jsonify({
        'grouped_items': grouped_items,
        'material_groups': material_groups
    })

# Route to get the xmute_data json
@app.route('/xmute_data', methods=['GET'])
def database_xmute_data():
    logging.info("Database xmute data route accessed")
    xmute_data = get_xmute_data()
    return jsonify(xmute_data)

# Print tracked items summary
print(db_handler.get_tracked_items_summary())

if __name__ == "__main__":
    logging.info("Starting the Flask app")
    # Fetch the commodities data from the WoW API
    commodities_data = bnet.get_commodities_db()

    # Update the database with the commodities data
    db_handler.update_ah_snapshot(commodities_data)

    # Store tracked items (extract them from the commodities data snapshot)
    db_handler.store_tracked_items(load_xmute_commodities())

    # Update the tracked items summary
    db_handler.update_tracked_items_summary()

    # Run the Flask app
    app.run(port=5001)
