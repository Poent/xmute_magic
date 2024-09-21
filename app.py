import json
import sqlite3

from requests.exceptions import HTTPError, RequestException
from bnet_auth_api import BnetAuthApi
from bnet_ah_api import BnetAhApi

# Main logic
if __name__ == "__main__":
    # Load client credentials from auth.json
    with open('auth.json') as file:
        auth_data = json.load(file)

    # Initialize authentication and API objects
    bnet_auth = BnetAuthApi(auth_data['client_id'], auth_data['client_secret'])
    wow_api = BnetAhApi(bnet_auth)

    # Fetch and save commodities data
    commodities = wow_api.get_commodities_db()
    wow_api.save_commodities_to_db(commodities)

    print("Commodities data has been saved to the database.")

    # Fetch and print the first 10 rows from the database
    conn = sqlite3.connect('commodities.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM commodities LIMIT 10')
    rows = cursor.fetchall()

    # Retrieve column names from the database
    columns = [description[0] for description in cursor.description]
    conn.close()

    print("First 10 rows from the database:")
    for index, row in enumerate(rows, start=1):
        labeled_row = ", ".join(f"{col}: {val}" for col, val in zip(columns, row))
        print(f"Row {index}: {labeled_row}")