import sqlite3
import time
import datetime

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
                auction_id INTEGER PRIMARY KEY,
                item_id INTEGER,
                quantity INTEGER,
                unit_price INTEGER,
                time_left TEXT,
                timestamp INTEGER
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tracked_items (
                auction_id INTEGER PRIMARY KEY,
                item_id INTEGER,
                quantity INTEGER,
                unit_price INTEGER,
                time_left TEXT,
                timestamp INTEGER  -- First time it was pulled
            )
        ''')
        conn.commit()
        conn.close()



    def update_ah_snapshot(self, commodities):
        """Update the auction house snapshot by purging old data and inserting new commodities data."""
        print("Updating auction house snapshot...")
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Purge the old data
            cursor.execute('DELETE FROM commodities')
            print("Old auction house data purged.")

            timestamp = int(time.time())

            # Insert new data from the current snapshot
            for commodity in commodities['auctions']:
                cursor.execute('''
                    INSERT INTO commodities (auction_id, item_id, quantity, unit_price, time_left, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    commodity['id'],                # auction_id (unique to the auction)
                    commodity['item']['id'],         # item_id (unique identifier for the item)
                    commodity['quantity'],           # quantity of the item being auctioned
                    commodity['unit_price'],         # unit price of the item in copper
                    commodity['time_left'],          # remaining auction time
                    timestamp                        # timestamp of the snapshot
                ))

            conn.commit()
            print("New auction house snapshot inserted successfully.")

        except sqlite3.Error as e:
            print(f"Database error during snapshot update: {e}")
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

        
    def store_tracked_items(db_handler, xmute_items):
        """Store or update tracked items in the database based on auction_id using the new JSON structure."""
        print("Storing or updating tracked items...")
        conn = sqlite3.connect(db_handler.db_path)
        cursor = conn.cursor()

        # Step 1: Set time_left to NULL for all tracked items and collect auction_ids of those aged out.
        print("Aging out old items...")
        cursor.execute('''
            UPDATE tracked_items 
            SET time_left = NULL
        ''')

        # Fetch all auction_ids where time_left was aged out (set to NULL)
        cursor.execute('''
            SELECT auction_id FROM tracked_items WHERE time_left IS NULL
        ''')
        aged_out_auctions = set([row[0] for row in cursor.fetchall()])

        # Track how many new auctions are added/updated
        new_auctions_count = 0

        # Step 2: Iterate over the xmute_items list and fetch matching items from the commodities table (last AH snapshot)
        print("Fetching new items...")
        for item in xmute_items:
            print(f"Processing item: {item['item_name']}")
            item_name = item["item_name"]
            tiers = item["tiers"]  # Access the tiers list

            for tier in tiers:  # Loop through the tiers list
                item_id = tier["item_id"]  # Get item_id for this tier

                # Fetch matching items from the commodities table for this item_id
                cursor.execute('''
                    SELECT auction_id, item_id, quantity, unit_price, time_left, timestamp FROM commodities 
                    WHERE item_id = ?
                ''', (item_id,))
                new_items = cursor.fetchall()

                # Step 3: Insert or update the items in the tracked_items table
                for new_item in new_items:
                    auction_id, item_id, quantity, unit_price, time_left, timestamp = new_item

                    # If this auction_id was aged out (in our aged_out_auctions set), remove it from the set
                    if auction_id in aged_out_auctions:
                        aged_out_auctions.remove(auction_id)

                    # Insert or replace if auction_id exists (primary key conflict)
                    cursor.execute('''
                        INSERT OR REPLACE INTO tracked_items (auction_id, item_id, quantity, unit_price, time_left, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (auction_id, item_id, quantity, unit_price, time_left, timestamp))

                    new_auctions_count += 1

        # Step 4: Calculate the number of aged-out auctions that did not get updated (those still in aged_out_auctions)
        aged_out_count = len(aged_out_auctions)

        conn.commit()
        conn.close()

        # Print the debug info
        print(f"Number of auctions aged out (no match in latest snapshot): {aged_out_count}")
        print(f"Number of new auctions processed: {new_auctions_count}")




    def get_item_stats(self, item_id, table):
        """Retrieve the stats for a specific item, including the number of active auctions and the minimum unit price."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Count active auctions and find the minimum unit price
            cursor.execute(f'''
                SELECT COUNT(*), MIN(unit_price) 
                FROM {table} 
                WHERE item_id = ? AND time_left IS NOT NULL
            ''', (item_id,))
            stats = cursor.fetchone()
            return stats
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None
        finally:
            conn.close()

    
    def get_table_stats(self, table):
        """Retrieve general stats for the auction table, including total auctions, unique item IDs, and oldest active auction."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Total number of auctions
            cursor.execute(f'SELECT COUNT(*) FROM {table}')
            total_auctions = cursor.fetchone()[0]

            # Total active auctions
            cursor.execute(f'''
                SELECT COUNT(*) 
                FROM {table} 
                WHERE time_left IS NOT NULL
            ''')
            active_auctions = cursor.fetchone()[0]

            # Total number of unique item IDs
            cursor.execute(f'SELECT COUNT(DISTINCT item_id) FROM {table}')
            unique_item_ids = cursor.fetchone()[0]

            # Oldest active auction based on timestamp (where time_left is not NULL)
            cursor.execute(f'''
                SELECT MIN(timestamp) 
                FROM {table} 
                WHERE time_left IS NOT NULL
            ''')
            oldest_active_timestamp = cursor.fetchone()[0]
            if oldest_active_timestamp:
                oldest_active_timestamp = datetime.datetime.fromtimestamp(oldest_active_timestamp)

            return {
                "total_auctions": total_auctions,
                "active_auctions": active_auctions,
                "unique_item_ids": unique_item_ids,
                "oldest_active_auction": oldest_active_timestamp
            }
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None
        finally:
            conn.close()

