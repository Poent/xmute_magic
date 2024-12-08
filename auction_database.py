import sqlite3
import time
import datetime

from utils import load_xmute_commodities, get_item_name_by_id

xmute_data = load_xmute_commodities()

class AuctionDatabase:
    def __init__(self, db_path='commodities.db'):
        self.db_path = db_path
        self.init_db()

        #load the xmute_commodities.json file using the function in utils.py
        

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

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tracked_items_summary (
                item_id INTEGER PRIMARY KEY,
                item_name TEXT,
                total_auctions INTEGER,
                min_unit_price INTEGER,
                market_value INTEGER,
                last_updated INTEGER
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
        conn = sqlite3.connect(db_handler.db_path) #connect to the database
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
        thaumaturgy_items = xmute_data.get("thaumaturgy_ingredients")
        for item in thaumaturgy_items:
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

        # Process crystalized items
        crystalized_items = xmute_data.get("crystalized", [])
        for c_item in crystalized_items:
            item_name = c_item["item_name"]
            item_id = c_item["item_id"]

            # Fetch matching items from the commodities table
            cursor.execute('''
                SELECT auction_id, item_id, quantity, unit_price, time_left, timestamp FROM commodities 
                WHERE item_id = ?
            ''', (item_id,))
            new_items = cursor.fetchall()

            for new_item in new_items:
                auction_id, item_id, quantity, unit_price, time_left, timestamp = new_item
                if auction_id in aged_out_auctions:
                    aged_out_auctions.remove(auction_id)
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


    def update_tracked_items_summary(self):
        """Gathers summary data from tracked_items and overwrites tracked_items_summary with the latest data."""
        
        print("Updating tracked_items_summary table...")
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Step 1: Purge old summary data
            cursor.execute('DELETE FROM tracked_items_summary')
            print("Old summary data purged.")

            # Step 2: Gather aggregated data from tracked_items
            cursor.execute('''
                SELECT item_id, COUNT(*) as total_auctions, MIN(unit_price) as min_unit_price, 
                    GROUP_CONCAT(unit_price) as price_list, MAX(timestamp) as latest_timestamp
                FROM tracked_items
                WHERE time_left IS NOT NULL
                GROUP BY item_id
            ''')
            summary_data = cursor.fetchall()

            # Step 3: Insert the new summary data into tracked_items_summary
            for row in summary_data:
                item_id = row[0]
                total_auctions = row[1]
                min_unit_price = row[2]
                price_list = list(map(int, row[3].split(',')))  # Convert the comma-separated list of prices into a list of integers

                # Calculate market value based on lowest 30% prices, ignoring large jumps
                sorted_prices = sorted(price_list)
                cutoff_index = max(1, len(sorted_prices) // 6)  # Take at least one auction for small sets
                filtered_prices = sorted_prices[:cutoff_index]

                # Further filter out large price jumps
                filtered_prices = [p for i, p in enumerate(filtered_prices)
                                if i == 0 or (p <= 1.2 * filtered_prices[i - 1])]

                # Calculate the market value (average of remaining prices)
                if filtered_prices:
                    market_value = sum(filtered_prices) // len(filtered_prices)
                else:
                    market_value = None  # Handle case where no valid prices remain

                # Insert summary data into the tracked_items_summary table
                cursor.execute('''
                    INSERT INTO tracked_items_summary (item_id, item_name, total_auctions, min_unit_price, market_value, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (item_id, get_item_name_by_id(item_id, xmute_data ), total_auctions, min_unit_price, market_value, row[4]))

            conn.commit()
            print("tracked_items_summary updated successfully.")

        except sqlite3.Error as e:
            print(f"Database error: {e}")
        finally:
            conn.close()



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

    def print_tracked_items_summary(self):
        """Fetch and print the tracked_items_summary to the console."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Fetch all data from tracked_items_summary
            cursor.execute('SELECT item_id, item_name, total_auctions, min_unit_price, market_value, last_updated FROM tracked_items_summary')
            rows = cursor.fetchall()

            # Print the summary
            if rows:
                print("Tracked Items Summary:")
                for row in rows:
                    item_id, item_name, total_auctions, min_unit_price, market_value, last_updated = row
                    print(f"Item ID: {item_id}, Name: {item_name}, Total Auctions: {total_auctions}, "
                        f"Min Price: {min_unit_price/10000:.2f}g, Market Value: {market_value/10000:.2f}g, "
                        f"Last Updated: {datetime.datetime.fromtimestamp(last_updated)}")
            else:
                print("No tracked item summary data available.")
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
        finally:
            conn.close()

    # function to return tracked items summary data as an API compatible JSON response
    def get_tracked_items_summary(self):
        """Fetch and return the tracked_items_summary data as a JSON response."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Fetch all data from tracked_items_summary
            cursor.execute('SELECT item_id, item_name, total_auctions, min_unit_price, market_value, last_updated FROM tracked_items_summary')
            rows = cursor.fetchall()

            # Create a list of dictionaries for each row
            summary_data = []
            for row in rows:
                item_id, item_name, total_auctions, min_unit_price, market_value, last_updated = row
                summary_data.append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "total_auctions": total_auctions,
                    "min_unit_price": min_unit_price,
                    "market_value": market_value,
                    "last_updated": last_updated
                })

            return summary_data

        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None
        finally:
            conn.close()
