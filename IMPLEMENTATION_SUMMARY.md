# Player Access Implementation Summary

## What Was Done

This PR implements a complete player authentication system for the Oracle Tournament application. Players can now log in with personal access codes and the system properly integrates with the existing Supabase `player_access` table.

## Key Changes

### 1. New API Endpoint
**POST `/api/admin/player-access`**
- Creates new player access records in Supabase
- Requires admin token for authentication
- Hashes access codes securely before storage
- Auto-generates player keys from display names

**Response Example:**
```json
{
  "playerKey": "tester",
  "displayName": "Tester",
  "accessCode": "test123",
  "message": "Player access created successfully"
}
```

### 2. Management Script
**`scripts/manage-player-access.js`**
- Command-line tool for creating and listing player accounts
- Integrates with Supabase REST API
- Validates input and provides clear error messages

**Usage:**
```bash
# List all players
npm run player-access:list

# Add new player
node scripts/manage-player-access.js add "Display Name" "access-code"
```

### 3. NPM Scripts
Added convenience scripts to `package.json`:
- `npm run player-access:list` - List all player accounts
- `npm run player-access:add` - Create new player (requires args)

### 4. Comprehensive Documentation

Created three new documentation files:

**PLAYER_ACCESS_SETUP.md**
- Technical reference for the player access system
- Explains authentication flow
- Details both CLI and API methods
- Security best practices

**QUICKSTART_TESTING.md**
- Step-by-step guide for testing
- Shows how to create a test account
- Verifies login flow works
- Troubleshooting tips

**EXAMPLE_SETUP.md**
- Real-world tournament scenario
- Complete example with 6 players + tester
- Email templates for sharing codes
- Production security tips

## How It Works

### Authentication Flow

1. **Admin creates account** (using script or API):
   ```bash
   node scripts/manage-player-access.js add "Tester" "test123"
   ```
   - Display name: "Tester"
   - Access code: "test123"
   - Generated player key: "tester"
   - Stored hash: SHA-256 of "test123"

2. **Player logs in** at `login.html`:
   - Enters access code: "test123"
   - Frontend calls `POST /api/login`
   - Server hashes input and looks up in `player_access` table
   - Returns player info if match found
   - Stores `player_key` in localStorage

3. **Player uses app**:
   - All API calls include their `player_key`
   - Foreign key constraints ensure data integrity
   - Player can join sessions, set availability, etc.

### Security Features

- **SHA-256 hashing**: Access codes never stored in plain text
- **Admin token**: Endpoint requires `PLAYER_ACCESS_ADMIN_TOKEN`
- **Case-insensitive**: Codes work regardless of case
- **Unique player keys**: Generated from display name (lowercase)

## Testing the Implementation

### Quick Test (5 minutes)

1. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

2. **Create test account**:
   ```bash
   node scripts/manage-player-access.js add "Tester" "test123"
   ```

3. **Verify it was created**:
   ```bash
   npm run player-access:list
   ```

4. **Test login**:
   - Start server: `npm start`
   - Open: `http://localhost:8787/login.html`
   - Enter: `test123`
   - Should redirect to main app as "Tester"

### Production Setup

Follow [EXAMPLE_SETUP.md](EXAMPLE_SETUP.md) for a complete tournament setup with multiple players.

## Files Changed

- **api/server.js**: Added POST `/api/admin/player-access` endpoint
- **scripts/manage-player-access.js**: New CLI tool for player management
- **package.json**: Added npm scripts for convenience
- **README.md**: Updated with quick start links and API documentation
- **PLAYER_ACCESS_SETUP.md**: Technical documentation
- **QUICKSTART_TESTING.md**: Testing guide
- **EXAMPLE_SETUP.md**: Production example

## Database Schema

Uses existing `player_access` table from `oracle_tables.sql`:

```sql
create table public.player_access (
  player_key text primary key,
  display_name text not null,
  access_code_hash text not null,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

All player data tables (`build_cards`, `availability`, `session_players`, etc.) have foreign keys to `player_access.player_key`, ensuring referential integrity.

## Next Steps

1. **Configure Supabase**:
   - Ensure `oracle_tables.sql` has been run
   - Set up `.env` with credentials
   - Set `PLAYER_ACCESS_ADMIN_TOKEN`

2. **Create test account** (as shown above)

3. **Test the flow** to verify everything works

4. **Create real player accounts**:
   ```bash
   node scripts/manage-player-access.js add "Player Name" "secret-code"
   ```

5. **Share codes** with your players

6. **Monitor logins**:
   ```bash
   npm run player-access:list
   ```

## API Reference

### Create Player Access
```http
POST /api/admin/player-access
Content-Type: application/json

{
  "adminToken": "your-admin-token",
  "displayName": "Player Name",
  "accessCode": "secret-code"
}
```

### List Player Access
```http
GET /api/admin/player-access?token=your-admin-token
```

### Player Login
```http
POST /api/login
Content-Type: application/json

{
  "accessCode": "secret-code"
}
```

## Validation

All changes have been validated:
- ✓ Linting passes (`npm run lint:api`)
- ✓ Tests pass (`npm test`)
- ✓ Script runs without Supabase (shows proper error)
- ✓ Documentation is comprehensive
- ✓ Code follows project conventions

## Questions?

See the documentation files for more details:
- [QUICKSTART_TESTING.md](QUICKSTART_TESTING.md) - Get started quickly
- [EXAMPLE_SETUP.md](EXAMPLE_SETUP.md) - Real-world example
- [PLAYER_ACCESS_SETUP.md](PLAYER_ACCESS_SETUP.md) - Full technical reference
