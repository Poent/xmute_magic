import sqlite3
import time
import requests

from requests.exceptions import HTTPError, RequestException
from bnet_auth_api import BnetAuthApi


class BnetAhApi:
    
    def __init__(self, bnet_auth: BnetAuthApi, db_path='commodities.db'):
        self.bnet_auth = bnet_auth
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        """Initialize the SQLite database and create the commodities table if it doesn't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS commodities (
                id INTEGER PRIMARY KEY,
                item_id INTEGER,
                quantity INTEGER,
                unit_price INTEGER,
                time_left TEXT,
                timestamp INTEGER
            )
        ''')
        conn.commit()
        conn.close()

    
    def get_commodities_db(self):
        """Fetch the commodities data from the WoW API."""
        print("Fetching commodities data from the WoW API... This may take a moment....")
        headers = self.bnet_auth.get_headers()
        url = 'https://us.api.blizzard.com/data/wow/auctions/commodities?namespace=dynamic-us&locale=en_US'
    
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
            print("Commodities data fetched successfully.")
            return response.json()
        except HTTPError as http_err:
            print(f"HTTP error occurred: {http_err}")
        except RequestException as req_err:
            print(f"Request error occurred: {req_err}")
        except Exception as err:
            print(f"An error occurred: {err}")
        return None

    def save_commodities_to_db(self, commodities):
        """Save the commodities data into the SQLite database, overwriting previous snapshot."""
        print("Saving commodities data to the database...")
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Clear the table to overwrite the snapshot data
        cursor.execute('DELETE FROM commodities')

        # Insert new snapshot
        timestamp = int(time.time())  # Current timestamp
        for commodity in commodities['auctions']:
            cursor.execute('''
                INSERT INTO commodities (id, item_id, quantity, unit_price, time_left, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                commodity['id'],
                commodity['item']['id'],
                commodity['quantity'],
                commodity['unit_price'],
                commodity['time_left'],
                timestamp
            ))

        conn.commit()
        conn.close()
        print("Commodities data saved successfully.")