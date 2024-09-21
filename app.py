import json
from bnet_auth_api import BnetAuthApi
from bnet_ah_api import BnetAhApi, AuctionDatabase

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
