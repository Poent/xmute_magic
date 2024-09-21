import sqlite3
import time
import requests
import json

from auction_database import AuctionDatabase


class BnetAhApi:
    def __init__(self, bnet_auth, db_handler: AuctionDatabase):
        self.bnet_auth = bnet_auth
        self.db_handler = db_handler

    def get_commodities_db(self):
        """Fetch the commodities data from the WoW API."""
        headers = self.bnet_auth.get_headers()
        url = 'https://us.api.blizzard.com/data/wow/auctions/commodities?namespace=dynamic-us&locale=en_US'
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    


