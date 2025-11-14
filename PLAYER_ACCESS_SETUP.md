# Player Access Setup Guide

This guide explains how to create and manage player access codes for the Oracle Tournament application.

## Overview

The application uses a personal access code system where each player has:
- A **display name** (their real name, shown in the UI)
- A **player key** (auto-generated from the display name, used internally)
- An **access code** (secret password they use to log in)

## Prerequisites

1. Ensure your Supabase database has the `player_access` table (created by `oracle_tables.sql`)
2. Set up your environment variables in `.env` or `scripts/.env`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_STORAGE_MODE=tables
   PLAYER_ACCESS_ADMIN_TOKEN=your-admin-token  # Optional but recommended
   ```

## Method 1: Command Line Script (Recommended for Setup)

### List all players
```bash
npm run player-access:list
```

### Add a new player
```bash
node scripts/manage-player-access.js add "Display Name" "access-code"
```

**Example:**
```bash
node scripts/manage-player-access.js add "Tester Account" "test123"
node scripts/manage-player-access.js add "Kaela" "kaela-secret-code"
```

The script will:
- Generate a `player_key` from the display name (lowercase, alphanumeric)
- Hash the access code for secure storage
- Create the record in Supabase
- Display the credentials for the user

### Creating the test account
```bash
node scripts/manage-player-access.js add "Tester" "test123"
```

This creates a test account that can be used to verify the login flow.

## Method 2: API Endpoint (For Programmatic Access)

If you have `PLAYER_ACCESS_ADMIN_TOKEN` configured, you can use the REST API:

**Create a player:**
```bash
curl -X POST http://localhost:8787/api/admin/player-access \
  -H "Content-Type: application/json" \
  -d '{
    "adminToken": "your-admin-token",
    "displayName": "Tester",
    "accessCode": "test123"
  }'
```

**List all players:**
```bash
curl http://localhost:8787/api/admin/player-access?token=your-admin-token
```

## How Players Log In

1. Players visit `login.html`
2. They enter their access code (e.g., `test123`)
3. The system:
   - Hashes the code they entered
   - Looks it up in the `player_access` table
   - If it matches, returns their `player_key` and `display_name`
   - Stores `player_key` in localStorage
4. Player is redirected to `index.html` where they can use the application

## Guest Mode

Players can also click "Continue as guest" on the login page. This:
- Sets `player_key` to `"guest"` in localStorage
- Allows read-only access to the application
- Perfect for testers who just want to browse

## Security Notes

- Access codes are hashed using SHA-256 before storage
- Never expose the `PLAYER_ACCESS_ADMIN_TOKEN` publicly
- The service role key should only be used server-side
- Regular users never see or use admin tokens

## Testing the Flow

1. Create a test account:
   ```bash
   node scripts/manage-player-access.js add "Tester" "test123"
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:4173/login.html`

4. Enter the access code: `test123`

5. You should be logged in as "Tester" and redirected to the main application

## Troubleshooting

**"Player directory is unavailable"**
- Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify the `player_access` table exists in Supabase

**"Invalid access code"**
- Check that the access code matches exactly (case-insensitive)
- Verify the record exists: `npm run player-access:list`

**"Player with key already exists"**
- Each display name creates a unique player_key
- Use a different display name or delete the existing record first

**"Unauthorized" when using API**
- Verify `PLAYER_ACCESS_ADMIN_TOKEN` is set in `.env`
- Make sure the token matches in your request
