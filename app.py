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

# Define the material to group mapping (Moved outside the function to reuse)
material_groups = {
    "Arathor's Spear": "Mercurial",
    "Blessing Blossom": "Mercurial",
    "Ironclaw Ore": "Mercurial",
    "Stormcharged Leather": "Mercurial",
    "Aqirite": "Ominous",
    "Gloom Chitin": "Ominous",
    "Luredrop": "Ominous",
    "Orbinid": "Ominous",
    "Bismuth": "Volatile",
    "Mycobloom": "Volatile",
    "Storm Dust": "Volatile",
    "Weavercloth": "Volatile",
    # Include other materials if necessary
}


def get_grouped_items():
    xmute_data = load_xmute_commodities()
    tracked_items_summary = db_handler.get_tracked_items_summary()
    item_summary_by_id = {item['item_id']: item for item in tracked_items_summary}

    grouped_items = {}
    for item in xmute_data:
        item_name = item['item_name']
        tiers = item.get('tiers', [])
        tier_data = {}
        for idx, tier in enumerate(tiers):
            tier_key = f'T{idx + 1}'
            tier_data[tier_key] = item_summary_by_id.get(tier['item_id'], None)
        grouped_items[item_name] = tier_data
    return grouped_items


@app.route('/')
def home():
    logging.info("Home route accessed")
    grouped_items = get_grouped_items()
    return render_template('index.html', grouped_items=grouped_items, material_groups=material_groups)


# Route to check the token status
@app.route('/istokenvalid')
def token():
    print("- token route accessed -")
    token_valid = bnet_auth.is_token_valid()
    return jsonify({'valid': token_valid})

# Route to refresh the token
@app.route('/refreshtoken')
def refresh():
    bnet_auth.refresh_token()
    return jsonify({'message': 'Token refreshed'})

# Route to update the database
@app.route('/refreshdatabase')
def update():
    # Fetch the commodities data from the WoW API
    commodities_data = bnet.get_commodities_db()

    # Update the database with the commodities data
    db_handler.update_ah_snapshot(commodities_data)
    db_handler.store_tracked_items(load_xmute_commodities())
    db_handler.update_tracked_items_summary()

    return jsonify({'message': 'Database updated'})

@app.route('/getupdateddata')
def get_updated_data():

    grouped_items = get_grouped_items()

    # Return both grouped_items and material_groups as a single JSON object
    return jsonify({
        'grouped_items': grouped_items,
        'material_groups': material_groups
    })

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
