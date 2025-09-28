# Xmute Magic

## Overview
Xmute Magic is a Flask-based dashboard for monitoring World of Warcraft auction house commodities relevant to The War Within transmutation workflows. The application authenticates against the Battle.net API, downloads the latest commodity snapshot, stores it in SQLite, and exposes HTML and JSON endpoints so you can review item availability and pricing trends for tracked materials.

> **Note**
> The tool is no longer profitable; it remains here as a historical archive of the project.

![Dashboard screenshot](https://github.com/user-attachments/assets/92b046ad-05b1-4945-8714-564cfb3da524)

## Architecture
- **Flask application (`app.py`)** – Serves the HTML dashboard, exposes JSON endpoints, and orchestrates authentication, data refreshes, and database summarization on startup and via `/database/*` routes.
- **Battle.net API clients** – `BnetAuthApi` handles OAuth client-credential flows and token persistence, while `BnetAhApi` performs authenticated commodity snapshot requests with retry handling.
- **SQLite data layer (`auction_database.py`)** – Creates and maintains the commodity snapshot, tracked item, and summary tables; ingests API results; and computes pricing statistics that power the dashboard views.
- **Utility helpers (`utils.py`)** – Load the tracked transmutation manifest (`xmute_commodities.json`) and translate item IDs to human-readable names.

## Key Features
- OAuth-backed Battle.net token management with on-demand refreshes.
- Automated commodity snapshot ingestion and summarization for tracked reagents and crystallized outputs.
- REST endpoints for refreshing data, exporting summaries, and delivering the raw transmutation manifest to the frontend.
- Lightweight frontend assets in `static/` and `templates/` for visualizing the aggregated auction information.

## Prerequisites
- **Python**: 3.10 or newer recommended.
- **Python packages**: `Flask`, `requests`, and `authlib`. Install via:
  ```bash
  pip install Flask requests authlib
  ```
- **SQLite**: Included with standard Python builds; no separate service is required.
- **Battle.net OAuth credentials**: Client ID and client secret with access to the WoW Game Data API.

## Configuration
Set the following environment variables to make credential management reproducible:

```bash
export BNET_CLIENT_ID="your-client-id"
export BNET_CLIENT_SECRET="your-client-secret"
```

Create an `auth.json` file in the project root before starting the server. You can generate it from the environment variables with:

```bash
python - <<'PY'
import json, os
config = {
    "client_id": os.environ["BNET_CLIENT_ID"],
    "client_secret": os.environ["BNET_CLIENT_SECRET"],
}
with open("auth.json", "w") as fh:
    json.dump(config, fh)
print("auth.json written")
PY
```

`app.py` reads this file at launch and feeds the credentials into the token management flow.

## Database Initialization
The `AuctionDatabase` class automatically creates the required tables the first time it runs, so invoking the app will build the schema. If you want to pre-create the database without launching the server, run:

```bash
python - <<'PY'
from auction_database import AuctionDatabase
AuctionDatabase()
print("SQLite schema initialized at commodities.db")
PY
```

## Running the Application
1. (Optional) Activate your virtual environment.
2. Ensure `auth.json` exists with your Battle.net credentials.
3. Start the Flask server:
   ```bash
   python app.py
   ```
   On startup the app authenticates, downloads the latest commodity snapshot, populates the SQLite database, and begins serving on `http://localhost:5001`.

### Refreshing Auction Data
- **HTTP endpoint**: Send a GET request to `http://localhost:5001/database/refresh` to trigger a manual commodity fetch and database refresh cycle. A JSON payload indicates success or failure.
- **Automated workflow**: The home page loads market data via `/database/summary`, which reflects the most recently refreshed snapshot.

### Optional Developer Workflows
- **Regenerate tracked-item summaries**: Call `AuctionDatabase().update_tracked_items_summary()` to recompute aggregates if you manipulate the database manually.
- **Inspect database state**: Use the helper methods in `AuctionDatabase` and `utils` to print stats or item groupings during development.
- **Frontend tweaks**: Static assets live under `static/` and require no build tooling, but you can optionally use a Node.js toolchain to lint or bundle them if you choose (not required by the project).

## Updating Commodity Definitions
The tracked materials and crystallized outputs are defined in `xmute_commodities.json`. Update this file to monitor additional items; the next database refresh will incorporate your changes automatically.

## Troubleshooting
- **Token refresh issues**: Delete `token.json` if refresh failures persist; the app will fetch a new token on the next run.
- **Stale data**: Re-run the refresh endpoint or restart the server to fetch a fresh commodity snapshot.

