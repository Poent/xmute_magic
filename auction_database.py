import sqlite3
import time
import json

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

        
    def track_items(db_handler, xmute_items):
        """Track items that match the xmute_commodities in the database if they have a newer timestamp."""
        conn = sqlite3.connect(db_handler.db_path)
        cursor = conn.cursor()

        for item in xmute_items:
            for tier, item_id in item['item_id'].items():  # Loop through the tiers of item IDs
                # Fetch the latest timestamp for the item from the tracked_items table
                cursor.execute('''
                    SELECT MAX(timestamp) FROM tracked_items WHERE item_id = ?
                ''', (item_id,))
                result = cursor.fetchone()
                tracked_timestamp = result[0] if result[0] else 0

                # Fetch matching items from the commodities table with a newer timestamp
                cursor.execute('''
                    SELECT item_id, quantity, unit_price, timestamp FROM commodities 
                    WHERE item_id = ? AND timestamp > ?
                ''', (item_id, tracked_timestamp))
                new_items = cursor.fetchall()

                # Insert the new items into the tracked_items table
                for new_item in new_items:
                    cursor.execute('''
                        INSERT INTO tracked_items (item_id, quantity, unit_price, timestamp)
                        VALUES (?, ?, ?, ?)
                    ''', new_item)

        conn.commit()
        conn.close()

    #function to get item stats by ID from the specified table in the database
    # stats should include the cumulative quantity of the item and the average unit price
    def get_item_stats(self, item_id, table):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'SELECT SUM(quantity), AVG(unit_price) FROM {table} WHERE item_id = {item_id}')
            stats = cursor.fetchone()
            print(f"Item ID [{item_id}] - total quantity: {stats[0]}, average unit price: {stats[1]/10000:.2f} g")
            return stats
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None
        finally:
            conn.close()
    
    # function to get table stats by table name
    # stats should include the number of rows in the table, the number of unique item IDs, and the number of unique timestamps
    def get_table_stats(self, table):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'SELECT COUNT(*), COUNT(DISTINCT item_id), COUNT(DISTINCT timestamp) FROM {table}')
            stats = cursor.fetchone()
            print(f"Table [{table}] - rows: {stats[0]}, unique item IDs: {stats[1]}, unique timestamps: {stats[2]}")
            return stats
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None
        finally:
            conn.close()

