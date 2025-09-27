# Xmute Magic

## Overview
Xmute Magic is a Flask-based dashboard for monitoring World of Warcraft auction house commodities relevant to The War Within transmutation workflows. The application authenticates against the Battle.net API, downloads the latest commodity snapshot, stores it in SQLite, and exposes both HTML and JSON endpoints so you can review item availability and pricing trends for tracked materials.

### Architecture
- **Flask application (`app.py`)** – Serves the HTML dashboard, exposes JSON endpoints, and orchestrates authentication, data refreshes, and database summarization on startup and via `/database/*` routes.【F:app.py†L7-L119】【F:app.py†L164-L198】
- **Battle.net API clients** – `BnetAuthApi` handles OAuth client-credential flows and token persistence, while `BnetAhApi` performs authenticated commodity snapshot requests with retry handling.【F:bnet_auth_api.py†L1-L51】【F:bnet_ah_api.py†L1-L25】
- **SQLite data layer (`auction_database.py`)** – Creates and maintains the commodity snapshot, tracked item, and summary tables; ingests API results; and computes pricing statistics that power the dashboard views.【F:auction_database.py†L1-L209】
- **Utility helpers (`utils.py`)** – Load the tracked transmutation manifest (`xmute_commodities.json`) and translate item IDs to human-readable names.【F:utils.py†L1-L38】

### Key Features
- OAuth-backed Battle.net token management with on-demand refreshes.【F:bnet_auth_api.py†L7-L44】
- Automated commodity snapshot ingestion and summarization for tracked reagents and crystallized outputs.【F:app.py†L91-L134】【F:auction_database.py†L41-L209】
- REST endpoints for refreshing data, exporting summaries, and delivering the raw transmutation manifest to the frontend.【F:app.py†L98-L152】
- Lightweight frontend assets in `static/` and `templates/` for visualizing the aggregated auction information.

## Prerequisites
- **Python**: 3.10 or newer recommended.
- **Python packages**: `Flask`, `requests`, `authlib`, and `sqlite3` (bundled with Python). Install via:
  ```bash
  pip install Flask requests authlib
  ```
- **SQLite**: Included with standard Python builds; no separate service is required.
- **Battle.net OAuth credentials**: Client ID and client secret with access to the WoW Game Data API.

### Environment Variables
Set the following environment variables to make credential management reproducible (used in the examples below):

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

`app.py` reads this file at launch and feeds the credentials into the token management flow.【F:app.py†L14-L31】

## Database Initialization
The `AuctionDatabase` class automatically creates the required tables the first time it runs, so simply invoking the app will build the schema.【F:auction_database.py†L8-L40】 If you want to pre-create the database without launching the server, run:

```bash
python - <<'PY'
from auction_database import AuctionDatabase
AuctionDatabase()
print("SQLite schema initialized at commodities.db")
PY
```

## Running the Application
1. **Activate your virtual environment (optional but recommended).**
2. **Ensure `auth.json` exists** with your Battle.net credentials.
3. **Start the Flask server**:
   ```bash
   python app.py
   ```
   On startup the app will authenticate, download the latest commodity snapshot, populate the SQLite database, and begin serving on `http://localhost:5001`.【F:app.py†L180-L198】

### Refreshing Auction Data
- **HTTP endpoint**: Send a GET request to `http://localhost:5001/database/refresh` to trigger a manual commodity fetch and database refresh cycle. A JSON payload indicates success or failure.【F:app.py†L104-L131】
- **Automated workflow**: The home page loads market data via `/database/summary`, which reflects the most recently refreshed snapshot.【F:app.py†L133-L152】

### Optional Developer Workflows
- **Regenerate tracked-item summaries**: Call `python - <<'PY'` with `AuctionDatabase().update_tracked_items_summary()` to recompute aggregates if you manipulate the database manually.【F:auction_database.py†L121-L170】
- **Inspect database state**: Use the helper methods in `AuctionDatabase` and `utils` to print stats or item groupings during development.【F:auction_database.py†L172-L209】【F:utils.py†L22-L50】
- **Frontend tweaks**: Static assets live under `static/` and require no build tooling, but you can optionally use a Node.js toolchain to lint or bundle them if you choose (not required by the project).

## Updating Commodity Definitions
The tracked materials and crystallized outputs are defined in `xmute_commodities.json`. Update this file to monitor additional items; the next database refresh will incorporate your changes automatically.【F:utils.py†L1-L22】【F:app.py†L63-L108】

## Troubleshooting
- **Token refresh issues**: Delete `token.json` if refresh failures persist; the app will fetch a new token on the next run.【F:bnet_auth_api.py†L7-L44】
- **Stale data**: Re-run the refresh endpoint or restart the server to fetch a fresh commodity snapshot.