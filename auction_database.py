import sqlite3
import time

class AuctionDatabase:
    def __init__(self, db_path='commodities.db'):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        """Initialize the SQLite database and create necessary tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create commodities and tracked_items tables
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

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tracked_items (
                id INTEGER PRIMARY KEY,
                item_id INTEGER,
                quantity INTEGER,
                unit_price INTEGER,
                timestamp INTEGER
            )
        ''')
        conn.commit()
        conn.close()

    def insert_commodities(self, commodities):
        """Insert commodities data into the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM commodities')
            timestamp = int(time.time())
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
        except sqlite3.Error as e:
            print(f"Database error: {e}")
        finally:
            conn.close()

    def fetch_first_n_commodities(self, n=10):
        """Fetch the first n rows from the commodities table."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'SELECT * FROM commodities LIMIT {n}')
            rows = cursor.fetchall()

            # Retrieve column names
            columns = [description[0] for description in cursor.description]
            return columns, rows

        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None, None
        finally:
            conn.close()