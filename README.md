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

* Open `index.html` in a browser that can reach the API origin. When the page is loaded directly from the file system the client automatically targets `http://localhost:8787`, so you can simply run the API locally on the default port. Otherwise it will call `/api/...` on the same host that served the page.
* If the datastore is hosted somewhere else, inject a small configuration snippet before the main script:

  ```html
  <script>
    window.APP_CONFIG = { apiBaseUrl: 'https://your-host.example.com' };
  </script>
  ```

* The UI shows a banner while requests are in flight and whenever the network fails. When the API is unreachable the app falls back to the most recent cached state stored in `localStorage` and indicates that it is running in offline mode until a request succeeds.

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

* The API stores its state in `api/state.json`. Back up this file or point the `DATA_PATH` environment variable at another location if you want to keep multiple environments.
* When deploying to a serverless platform or container host, expose port `8787` (or set `PORT`). Serve the static front-end from the same origin, or configure `window.APP_CONFIG.apiBaseUrl` to point at the API hostname.
