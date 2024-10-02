import datetime

from flask import Flask, render_template
from utils import load_xmute_commodities, get_item_name_by_id
from auction_database import AuctionDatabase

# Flask app
app = Flask(__name__)

# Add the custom datetime filter for formatting timestamps
@app.template_filter('datetimeformat')
def datetimeformat(value):
    return datetime.datetime.fromtimestamp(value).strftime('%Y-%m-%d %H:%M:%S')

# Initialize the database handler
db_handler = AuctionDatabase(db_path='commodities.db')

@app.route('/')
def home():
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

if __name__ == "__main__":
    # Run the Flask app
    app.run(debug=True)
