# XMute Magic

This project provides a Flask application for tracking World of Warcraft auction house commodities used in transmutes.

## Configuration

The application requires Battle.net API credentials for authentication. Supply them securely through environment variables or a configuration file referenced by an environment variable.

### Environment variables

Set the following variables before starting the application:

- `BNET_CLIENT_ID`
- `BNET_CLIENT_SECRET`

For example:

```bash
export BNET_CLIENT_ID="your-client-id"
export BNET_CLIENT_SECRET="your-client-secret"
```

### Optional configuration file

If setting the environment variables directly is not feasible, point the `BNET_AUTH_CONFIG` environment variable to a JSON file that contains the credentials. This file should never be committed to version control.

```bash
export BNET_AUTH_CONFIG="/path/to/secure/location/auth.json"
```

The referenced JSON file must include the following keys:

```json
{
  "client_id": "your-client-id",
  "client_secret": "your-client-secret"
}
```

An example file is provided at `auth.example.json` for local development. Copy it, fill in your credentials, and set `BNET_AUTH_CONFIG` to point to the new file.

### Missing credentials

If the credentials are missing or invalid, the application will raise a descriptive error. Ensure either the environment variables or the configuration file is available before starting the Flask server.

## Running the application

After providing the credentials, install the dependencies and start the Flask app as usual. Refer to your preferred workflow (for example, using `flask run` or running `python app.py`).
