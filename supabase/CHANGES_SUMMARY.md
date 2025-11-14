# Database Schema Changes Summary

## What Was The Problem?

The original database schema had tables for player data (availability, build_cards, session_players, etc.) that used `player_key` to identify players, but there was **no database-level relationship** between these tables and the `player_access` authentication table.

### Before: Disconnected Tables

```
player_access               sessions
├── player_key (PK)        ├── id (PK)
├── display_name           ├── title
├── access_code_hash       ├── dm
└── ...                    └── ...

session_players             availability
├── session_id (FK) ────→ sessions.id
├── player_key (❌ NO FK)
└── player_name            

build_cards                roster_extras
├── player_key (❌ NO FK)   ├── player_key (❌ NO FK)
├── class                  ├── name
└── university             └── status

roster_meta                character_drafts
├── player_key (❌ NO FK)   ├── player_key (❌ NO FK)
└── status                 └── draft_data
```

**Issues:**
- ❌ No referential integrity between player authentication and player data
- ❌ Could create player data for non-existent players
- ❌ Deleting a player left orphaned data in other tables
- ❌ Unclear relationship between login system and game data
- ❌ No automatic cleanup when removing players

### After: Connected Tables with Foreign Keys

```
                    player_access (AUTHENTICATION)
                    ├── player_key (PK)
                    ├── display_name
                    ├── access_code_hash
                    └── ...
                         │
        ┌────────────────┼────────────────┬────────────────┬────────────────┬────────────────┐
        │                │                │                │                │                │
        ▼                ▼                ▼                ▼                ▼                ▼
  session_players    availability    build_cards    roster_extras    roster_meta    character_drafts
  ├── player_key ✅  ├── player_key ✅ ├── player_key ✅ ├── player_key ✅ ├── player_key ✅ ├── player_key ✅
  │   (FK CASCADE)    │   (FK CASCADE)  │   (FK CASCADE)  │   (FK CASCADE)  │   (FK CASCADE)  │   (FK CASCADE)
  ├── session_id ───→ sessions.id
  └── player_name    
```

**Benefits:**
- ✅ Referential integrity enforced by database
- ✅ Cannot create player data without a valid player_access record
- ✅ Deleting a player automatically cleans up all related data (CASCADE)
- ✅ Clear relationship: all player data flows from authentication
- ✅ Database prevents orphaned records

## Changes Made

### 1. Schema File: `supabase/oracle_tables.sql`

**Changes:**
1. **Moved `player_access` table to top** - Must be created before tables that reference it
2. **Added foreign key constraints:**
   ```sql
   -- Example for session_players
   player_key text not null references public.player_access(player_key) on delete cascade
   ```
3. **Added missing `character_drafts` table** with proper foreign key
4. **Added RLS policies** for new table

### 2. Schema File: `supabase/oracle_state.sql`

**Changes:**
1. **Added `player_access` table** (was missing from JSON mode)
2. **Added foreign key** from `character_drafts` to `player_access`
3. **Added RLS policies** for both tables

### 3. New Documentation Files

- **`SCHEMA_DOCUMENTATION.md`** - Complete explanation of table relationships
- **`MIGRATION_GUIDE.md`** - Step-by-step guide for existing deployments
- **Updated `README.md`** - Links to new documentation

## Impact on User Flow

### Login Flow (Now Clear)
```
1. User enters access code in login.html
   ↓
2. Server hashes code and queries player_access table
   ↓
3. If match found, returns player_key to client
   ↓
4. Client stores player_key in localStorage
   ↓
5. All subsequent requests use player_key to fetch/update data
```

### Data Access Flow (Now Enforced)
```
To join a session:
1. User clicks "Join Session" button
   ↓
2. Client sends player_key to /api/sessions/:id/join
   ↓
3. Server validates player_key exists in player_access
   ↓
4. Server creates session_players record
   ↓
5. Foreign key constraint ensures player_key is valid ✅
```

### Data Cleanup Flow (Now Automatic)
```
To remove a player:
1. Admin deletes player from player_access table
   ↓
2. Database CASCADE deletes from:
   - session_players (removed from all sessions)
   - availability (all availability cleared)
   - build_cards (character build removed)
   - roster_extras (custom roster entry removed)
   - roster_meta (status/notes removed)
   - character_drafts (draft deleted)
   ↓
3. No orphaned data remains ✅
```

## Backward Compatibility

✅ **Zero breaking changes to application code**
- API endpoints work exactly the same
- No changes to request/response formats
- All existing functionality preserved
- Only database structure improved

⚠️ **Migration required for existing deployments**
- See `MIGRATION_GUIDE.md` for step-by-step instructions
- Must resolve orphaned records before adding constraints
- Fresh installations can use updated schema directly

## Testing

All existing tests pass:
```
✔ GET /api/state merges stored data with default sessions
✔ file adapter fetchState writes default when missing
✔ file adapter saveState normalises before writing
✔ supabase json adapter fetchState returns normalised state
✔ supabase json adapter inserts default when missing
✔ supabase json adapter saveState posts normalised payload
✔ supabase tables adapter fetchState merges tables
✔ supabase tables adapter disables hidden fallback when column missing
✔ supabase tables adapter replaceState writes to all tables
```

## Next Steps for Deployment

### For Fresh Installations
Simply run the updated schema file - foreign keys are created automatically.

### For Existing Deployments
1. Backup your database
2. Follow `MIGRATION_GUIDE.md` step by step
3. Identify and resolve any orphaned records
4. Add foreign key constraints
5. Test thoroughly before going to production

## Summary

This change transforms the database from a collection of disconnected tables into a properly structured relational database with enforced referential integrity. The user flow is now crystal clear: everything starts with authentication in `player_access`, and all player data is properly linked through foreign keys with automatic cleanup on deletion.
