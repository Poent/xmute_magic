import logging
import time
import datetime
from authlib.integrations.requests_client import OAuth2Session
import json


logger = logging.getLogger(__name__)

class BnetAuthApi:
    def __init__(self, client_id, client_secret, token_file='token.json'):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_file = token_file
        self.token = self.load_token(self.token_file)
        self.oauth = OAuth2Session(client_id)

        # Check token validity or refresh if necessary
        if not self.is_token_valid():
            self.refresh_token()

    def is_token_valid(self):
        """Check if the token is still valid."""
        if self.token:
            if self.token['expires_at'] < time.time():
                logger.info("Token expired.")
                return False
            else:
                expires_at = datetime.datetime.fromtimestamp(self.token['expires_at'])
                logger.info("Token is still valid, expires at %s", expires_at)
                return True
        else:
            logger.warning("No token found.")
            return False

    def refresh_token(self):
        """Refresh the token."""
        logger.info("Refreshing token...")
        try:
            self.token = self.oauth.fetch_token(
                'https://oauth.battle.net/token',
                grant_type='client_credentials',
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            self.save_token(self.token, self.token_file)
            return True
        except Exception as e:
            logger.error("Failed to refresh token: %s", e)
            return False

    @staticmethod
    def load_token(filename):
        try:
            with open(filename, 'r') as file:
                return json.load(file)
        except FileNotFoundError:
            return None

    @staticmethod
    def save_token(token, filename):
        with open(filename, 'w') as file:
            json.dump(token, file)

    def get_headers(self):
        if not self.is_token_valid():
            self.refresh_token()
        return {
            'Authorization': f"Bearer {self.token['access_token']}"
        }
