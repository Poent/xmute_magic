import time
import datetime
from authlib.integrations.requests_client import OAuth2Session
import json

class BnetAuthApi:
    def __init__(self, client_id, client_secret, token_file='token.json'):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_file = token_file
        self.token = self.load_token(self.token_file)
        self.oauth = OAuth2Session(client_id)

        # Check token validity or refresh if necessary
        self.check_and_refresh_token()

    def check_and_refresh_token(self):
        if self.token:
            if self.token['expires_at'] < time.time():
                print("Token expired, refreshing...")
                self.token = self.oauth.fetch_token(
                    'https://oauth.battle.net/token',
                    grant_type='client_credentials',
                    client_id=self.client_id,
                    client_secret=self.client_secret
                )
                self.save_token(self.token, self.token_file)
            else:
                expires_at = datetime.datetime.fromtimestamp(self.token['expires_at'])
                print(f"Token is still valid, expires at {expires_at}")
        else:
            print("No token found, fetching new one...")
            self.token = self.oauth.fetch_token(
                'https://oauth.battle.net/token',
                grant_type='client_credentials',
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            self.save_token(self.token, self.token_file)

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
        self.check_and_refresh_token()  # Ensure the token is valid before returning headers
        return {
            'Authorization': f"Bearer {self.token['access_token']}"
        }
