import datetime
import json

from flask import Flask, render_template
from utils import load_xmute_commodities, get_item_name_by_id

from bnet_auth_api import BnetAuthApi
from auction_database import AuctionDatabase

# Flask app
app = Flask(__name__)

# Add the custom datetime filter for formatting timestamps
@app.template_filter('datetimeformat')
def datetimeformat(value):
    return datetime.datetime.fromtimestamp(value).strftime('%Y-%m-%d %H:%M:%S')

# Load the client_id and client_secret from the auth.json file
try:
    with open('auth.json', 'r') as file:
        auth_data = json.load(file)
        client_id = auth_data['client_id']
        client_secret = auth_data['client_secret']
except (FileNotFoundError, KeyError) as e:
    raise RuntimeError("Error loading authentication data: {}".format(e))

# Initialize the BnetAuthApi object
bnet_auth = BnetAuthApi(client_id, client_secret, token_file='token.json')

# Initialize the database handler
db_handler = AuctionDatabase(db_path='commodities.db')

@app.route('/')
def home():
    print("- home route accessed -")

    # Load xmute_commodities data from JSON
    xmute_data = load_xmute_commodities()

    # Fetch the tracked items summary from the database
    tracked_items_summary = db_handler.get_tracked_items_summary()

    # Map item_id to summary data for easy lookup
    item_summary_by_id = {item['item_id']: item for item in tracked_items_summary}

    # Organize the data into a dictionary with tiers and matched auction house data
    grouped_items = {}

    for item in xmute_data:
        item_name = item['item_name']
        tiers = item.get('tiers', [])
        
        # Find corresponding auction house data for each tier using item_id
        grouped_items[item_name] = {
            'T1': item_summary_by_id.get(tiers[0]['item_id'], None) if len(tiers) > 0 else None,
            'T2': item_summary_by_id.get(tiers[1]['item_id'], None) if len(tiers) > 1 else None,
            'T3': item_summary_by_id.get(tiers[2]['item_id'], None) if len(tiers) > 2 else None,
        }

    return render_template('index.html', grouped_items=grouped_items)

# Route to check the token status
@app.route('/token')
def token():
    return bnet_auth.is_token_valid()

# Route to refresh the token
@app.route('/refresh')
def refresh():
    bnet_auth.refresh_token()
    return "Token refreshed"

# Route to update the database
@app.route('/update')
def update():
    # Fetch the commodities data from the WoW API
    commodities_data = bnet_auth.get_commodities_db()

    # Update the database with the commodities data
    db_handler.update_commodities_db(commodities_data)

    return "Database updated"


if __name__ == "__main__":
    # Run the Flask app
    app.run(debug=True)
