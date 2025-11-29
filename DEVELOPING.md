# Developing the Oracle Tournament Manager

This document explains how to run the backend and frontend locally, how Supabase fits in, and how to add new players with access codes.

It assumes you are comfortable with `npm`, but you don't need to be a backend expert.

---

## 1. Prerequisites

- Node.js (LTS recommended)  
- npm (comes with Node)  
- A Supabase project if you want database-backed storage  

Clone the repo and install dependencies:

```bash
git clone <YOUR-REPO-URL>
cd <YOUR-REPO-FOLDER>
npm install
```

---

## 2. Running the backend locally

The backend lives under the `api` directory and is a Node/Express server.

### 2.1 Configure your environment

If you have an `.env.example`, copy it:

```bash
cp .env.example .env
```

Then edit `.env` and set any necessary variables:

- `PORT` — defaults to 8787  
- `DATA_PATH` — optional path to a local JSON state file (used in file-storage mode)

If **you do NOT configure Supabase**, the API runs in **local JSON mode**, using:

- `api/state.json`  
- `comments.json`  
- `character_drafts.json`  
- `builds_data.json`  

If you **do** configure Supabase (recommended), add:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_MODE=json   # or 'tables'
```

Validate your setup:

```bash
npm run validate:env
```

### 2.2 Start the API

```bash
npm start
```

The server will run at:

```
http://localhost:8787
```

Useful endpoints:

- `GET /api/state`  
- `GET /api/sessions`  
- `POST /api/sessions/:id/join`  
- `POST /api/sessions/:id/leave`  
- `GET /api/builds/:playerKey`  
- `POST /api/builds/:playerKey`

---

## 3. Running / building the frontend

The frontend lives under the `site` directory.

### 3.1 Source vs build

- **Source scripts:** `site/scripts`  
- **Build output:** `site/dist`  

`site/dist` is treated as generated build output — do not manually edit files in there.

HTML entry points:

- `index.html`  
- `login.html`

These already reference the correct `<script src="...">` paths.  
**Do not change those URLs** unless the HTML is also updated.

### 3.2 Simple local usage

1. Start the backend:

   ```bash
   npm start
   ```

2. Open `index.html` in your browser.

If you use a static dev server, ensure it serves the repo root (or the `site` directory) so that `/api` requests reach the running backend.

### 3.3 Using a bundler (optional)

If using Vite, Webpack, or Rollup:

- Input/source: `site/scripts/`
- Output/build: `site/dist/`
- Keep the public script URLs used in `index.html` / `login.html` stable

The idea is:

- You write code in `site/scripts/`
- The bundler emits bundled/minified files into `site/dist/`
- The HTML continues to reference those files with consistent URLs

---

## 4. Supabase schema overview

Supabase SQL and documentation live under the `supabase` directory.

Key tables:

- `oracle_state` (JSON mode)
- Normalized tables (tables mode), defined in `supabase/oracle_tables.sql`:
  - `sessions`
  - `session_players`
  - `roster_extras`
  - `roster_meta`
  - `build_cards`
  - `comments`
  - `player_access`

See also:

- `supabase/SCHEMA_DOCUMENTATION.md`  
- `supabase/CHANGES_SUMMARY.md`  
- `supabase/RLS_FIX_README.md`

---

## 5. Adding a new player and access code

Players log in with an **access code**, stored as a **SHA-256 hash** in the `player_access` table.

### 5.1 Using the admin API (recommended)

Set a token in `.env`:

```dotenv
PLAYER_ACCESS_ADMIN_TOKEN=your-secret
```

Start the backend:

```bash
npm start
```

Create a player:

```bash
curl -X POST http://localhost:8787/api/admin/player-access \
  -H "Content-Type: application/json" \
  -d '{
    "adminToken": "your-secret",
    "displayName": "Alice the Wise",
    "accessCode": "ALICE-1234"
  }'
```

The API will:

- Hash the access code  
- Insert it into the `player_access` table  
- Return the player key + metadata  

Share the **raw** code (`ALICE-1234`) with the player.

### 5.2 Using Supabase UI directly

If you prefer manual entry:

In the **Supabase Table Editor**, insert a row into `player_access` with:

- `player_key`  
- `display_name`  
- `access_code_hash` (SHA-256 hash of the raw access code)

Using the admin API is easier because it handles hashing.

---

## 6. Storage modes

The backend supports three storage modes for the main tournament state:

### 1. Local JSON mode (legacy/dev)

- No Supabase env vars set  
- Uses `api/state.json` and local sidecar JSON files  
- Best for simple offline testing

### 2. Supabase JSON mode

- `SUPABASE_STORAGE_MODE=json`  
- Uses a single JSONB row in the `oracle_state` table  
- Matches the structure of `state.json`, but stored in the database

### 3. Supabase tables mode

- `SUPABASE_STORAGE_MODE=tables`  
- Uses normalized tables (`sessions`, `session_players`, `roster_meta`, `build_cards`, etc.)  
- Best for large-scale use, analytics, and robust querying

Switch modes by editing `.env` and restarting the server.

Public API routes and JSON shapes remain the same in all storage modes — only the backend persistence changes.
