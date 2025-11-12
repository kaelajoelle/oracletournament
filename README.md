# Oracle Tournament Character Builder

This project now includes a lightweight Node.js API that keeps shared availability, roster, and session data in sync for everyone using the builder.

## Prerequisites

* Node.js 18+
* npm

## Running the datastore API

1. Install dependencies:

   ```bash
   npm install
   ```

   > The container image used for automated checks may not have access to npm, so run this command in your own environment.

2. Start the API:

   ```bash
   npm start
   ```

   The server listens on port `8787` by default and exposes endpoints under `/api` for sessions, roster extras, availability, and build cards. The backing data file lives at `api/state.json`.

## Using the web UI

* Open `index.html` in a browser that can reach the API origin. By default the front-end will call `/api/...` on the same host that served the page.
* If the datastore is hosted somewhere else, inject a small configuration snippet before the main script:

  ```html
  <script>
    window.APP_CONFIG = { apiBaseUrl: 'https://your-host.example.com' };
  </script>
  ```

* The UI shows a banner while requests are in flight and whenever the network fails. When the API is unreachable the app falls back to the most recent cached state stored in `localStorage`.

### Offline cache

`localStorage` still keeps a read-only cache (`oracleOfflineState`) so you can review the latest shared data when you are offline. Mutations require a successful round-trip to the API and will surface an error message if the network is unavailable.

## API summary

Endpoint | Method | Description
---------|--------|------------
`/api/state` | GET | Returns all shared data (sessions, roster extras, meta, availability, build cards).
`/api/sessions/:id/join` | POST | Add a character to a session. Body: `{ name, build: { class, university } }`.
`/api/sessions/:id/leave` | POST | Remove a character from a session. Body: `{ name }`.
`/api/availability` | POST | Toggle availability for a person/date. Body: `{ name, date, available }`.
`/api/roster/extras` | POST | Add a custom roster entry. Body: `{ name, status?, notes? }`.
`/api/roster/:key` | PATCH | Update status/notes for roster entries (base or custom). Body: `{ status?, notes?, custom? }`.
`/api/roster/extras/:key` | DELETE | Remove a custom roster entry.

All routes return the full state payload on success so the client can refresh its cache.

## Deployment notes

* By default the API stores its state in `api/state.json`. Set `DATA_PATH` to point at another writable location if you want separate environments on the same host.
* To use Supabase instead of the local JSON file, create a table (default name `oracle_state`) with columns `id text primary key`, `state jsonb not null`, and an optional `updated_at timestamptz`. Then provide these environment variables when starting the server:

  | Variable | Description |
  |----------|-------------|
  | `SUPABASE_URL` | The Supabase project URL (e.g. `https://xyzcompany.supabase.co`). |
  | `SUPABASE_SERVICE_ROLE_KEY` | A service role key with read/write access to the table. Keep this secret on the server only. |
  | `SUPABASE_TABLE` (optional) | Table name to store the state (`oracle_state` by default). |
  | `SUPABASE_ROW_ID` (optional) | Row identifier that holds the JSON blob (`shared` by default). |

  The API will automatically seed the row with the default state if it does not exist yet.
* When deploying to a serverless platform or container host, expose port `8787` (or set `PORT`). Serve the static front-end from the same origin, or configure `window.APP_CONFIG.apiBaseUrl` to point at the API hostname.

### Supabase quick start

If you would rather keep the shared state in Supabase instead of the local JSON file, follow these steps:

1. In the Supabase dashboard open **SQL Editor** (or use the Supabase CLI) and execute one of the bundled schema files:

   * [`supabase/oracle_state.sql`](supabase/oracle_state.sql) — keeps everything in a single JSON row. This is the closest match to the original `state.json` workflow.
   * [`supabase/oracle_tables.sql`](supabase/oracle_tables.sql) — creates normalized tables (`sessions`, `session_players`, `roster_extras`, `roster_meta`, `availability`, and `build_cards`) and seeds the default sessions.

   Feel free to modify the SQL before running it if you want different table names or initial data. Supabase automatically stores your edits, so you do not need to run any bootstrap scripts from this repository.
1. Run the bundled bootstrap script once to create and seed the table:

   ```bash
   SUPABASE_URL="https://your-project.supabase.co" \\
   SUPABASE_SERVICE_ROLE_KEY="service-role-key" \\
   npm run supabase:bootstrap
   ```

   The script uses [`supabase/oracle_state.sql`](supabase/oracle_state.sql) under the hood, so you can also copy/paste that file into the Supabase **SQL Editor** or push it with the Supabase CLI (`supabase db push supabase/oracle_state.sql`) if you would rather run it manually. The SQL will:
1. Open the Supabase dashboard for your project and launch the **SQL Editor**. Paste the contents of [`supabase/oracle_state.sql`](supabase/oracle_state.sql) and run it once. The script will:
   * create the `oracle_state` table (if needed),
   * seed the default `shared` row the API expects, and
   * enable row level security with a policy that lets the service role manage the table.

   You can run the same script with the Supabase CLI if you prefer: `supabase db push supabase/oracle_state.sql`.

2. In **Project Settings → API**, copy your project URL and the **service role** key. Supply them as environment variables when you start the Node server:

   | Variable | Description |
   |----------|-------------|
   | `SUPABASE_URL` | The Supabase project URL (for example `https://xyzcompany.supabase.co`). |
   | `SUPABASE_SERVICE_ROLE_KEY` | The service role key with read/write access. Keep this secret on the server only. |
   | `SUPABASE_TABLE` (optional) | Table name to store the state (`oracle_state` by default). |
   | `SUPABASE_ROW_ID` (optional) | Row identifier that holds the JSON blob (`shared` by default). |
   | `SUPABASE_STORAGE_MODE` (optional) | `json` (default) for the single-row table, or `tables` for the normalized schema. |

3. Deploy the API (Render, Railway, Fly.io, etc.) and set the environment variables above. The server will automatically connect to Supabase, seed the datastore if it ever disappears, and persist every update there.

   * Leave `SUPABASE_STORAGE_MODE` unset (or `json`) to keep the original single-row JSON workflow. You can override `SUPABASE_TABLE` and `SUPABASE_ROW_ID` if you renamed them.
   * Set `SUPABASE_STORAGE_MODE=tables` to use the normalized schema. You can override the table names individually:

     | Variable | Default | Purpose |
     |----------|---------|---------|
     | `SUPABASE_SESSIONS_TABLE` | `sessions` | Session definitions (id, date, DM, capacity, finale). |
     | `SUPABASE_SESSION_PLAYERS_TABLE` | `session_players` | Junction table that records who joined each session. |
     | `SUPABASE_ROSTER_EXTRAS_TABLE` | `roster_extras` | Custom roster entries. |
     | `SUPABASE_ROSTER_META_TABLE` | `roster_meta` | Status/notes overrides keyed by `rosterKey(name)`. |
     | `SUPABASE_AVAILABILITY_TABLE` | `availability` | Availability checkmarks keyed by `sanitizeName(name)`. |
     | `SUPABASE_BUILD_CARDS_TABLE` | `build_cards` | Stored build cards keyed by `sanitizeName(name)`. |

3. Deploy the API (Render, Railway, Fly.io, etc.) and set the environment variables above. The server will automatically connect to Supabase, seed the row if it ever disappears, and persist every update there.

Once the backend is live, point the web app at it with the `window.APP_CONFIG.apiBaseUrl` snippet described earlier so that everyone hits the same Supabase-backed datastore.

### Configure the frontend API base URL

1. Edit `site/app-config.js` so `apiBaseUrl` matches your deployed Express server (include the `/api` suffix). The HTML page loads this file before any application logic so every fetch request goes through your backend, never directly to Supabase.
2. `site/app-config.js` now lives in version control with a sensible default (`https://oracletournament.onrender.com/api`); override it locally if you run the backend somewhere else and commit the value you expect your production frontend to use.
3. When the page boots it verifies the value and, if you forget to provide one, falls back to the same-origin `/api` endpoint and logs a console warning. Update the config instead of relying on the warning when you deploy to Render.

### Quick connectivity check from the browser

Open your browser dev tools and run:

```js
window.APP_UTILS.testApiConnection();
```

You should see the `{ state: … }` payload from `/api/state` printed to the console. If you get a network or CORS error, double-check the configured `apiBaseUrl` and that your Express server is running with the `cors()` middleware enabled (it is by default).
