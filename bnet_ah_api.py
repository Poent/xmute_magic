import sqlite3
import time
import requests
import json

from auction_database import AuctionDatabase


import time
import requests

class BnetAhApi:
    def __init__(self, bnet_auth, db_handler: AuctionDatabase):
        self.bnet_auth = bnet_auth
        self.db_handler = db_handler

    def get_commodities_db(self):
        """Fetch the commodities data from the WoW API."""
        headers = self.bnet_auth.get_headers()
        url = 'https://us.api.blizzard.com/data/wow/auctions/commodities?namespace=dynamic-us&locale=en_US'
        
        for attempt in range(10):
            response = requests.get(url, headers=headers)
            if response.status_code == 429:
                time.sleep(2)  # Wait for 1 second before retrying
                continue
            response.raise_for_status()
            return response.json()
        
        raise Exception("Failed to fetch commodities data after 10 attempts")
