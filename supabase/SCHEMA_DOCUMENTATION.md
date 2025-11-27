# Database Schema Documentation

## Overview

The Oracle Tournament application uses a normalized relational database schema where all player-related data is properly connected through foreign key relationships. This ensures data integrity and makes the user flow clear.

## Core Concept: User Authentication & Data Ownership

All player data in the system is connected to authenticated users through the `player_access` table. This is the central authentication table that ties everything together.

## Table Relationships

### Authentication Layer

#### `player_access` (Central User Table)
- **Purpose**: Stores user authentication credentials and profile information
- **Primary Key**: `player_key` - unique identifier for each player
- **Key Columns**:
  - `display_name` - the player's display name
  - `access_code_hash` - hashed access code for authentication
  - `last_login_at` - timestamp of last login
  - `created_at` / `updated_at` - audit timestamps

**This table is referenced by all other player-related tables**, establishing clear ownership and data integrity.

### Player Data Tables

All of the following tables have foreign key constraints to `player_access.player_key`:

#### `build_cards`
- **Purpose**: Stores character build information (class, university, character name)
- **Foreign Key**: `player_key → player_access.player_key`
- **Relationship**: One player can have one build card
- **ON DELETE**: CASCADE (if player is deleted, their build card is deleted)
- **Key Columns**:
  - `player_key` (TEXT, PK) - unique player identifier
  - `class` (TEXT) - character class
  - `university` (TEXT) - character university
  - `character_name` (TEXT) - character name
  - `build_data` (JSONB) - full OracleCharacterBuild object for complete persistence
  - `updated_at` (TIMESTAMPTZ) - last update timestamp

**API Helpers**: See `api/oracleBuilds.js` for save/load utility functions.

#### `roster_extras`
- **Purpose**: Custom roster entries added by administrators
- **Foreign Key**: `player_key → player_access.player_key`
- **Relationship**: One-to-one
- **ON DELETE**: CASCADE (if player is deleted, their roster entry is deleted)

#### `roster_meta`
- **Purpose**: Status and notes metadata for roster entries
- **Foreign Key**: `player_key → player_access.player_key`
- **Relationship**: One-to-one
- **ON DELETE**: CASCADE (if player is deleted, their metadata is deleted)

#### `session_players`
- **Purpose**: Junction table tracking which players have joined which sessions
- **Foreign Keys**: 
  - `player_key → player_access.player_key`
  - `session_id → sessions.id`
- **Relationship**: Many-to-many (players can join multiple sessions, sessions can have multiple players)
- **ON DELETE**: CASCADE for both foreign keys

#### `character_drafts`
- **Purpose**: Stores draft character data (work-in-progress characters)
- **Foreign Key**: `player_key → player_access.player_key`
- **Relationship**: One player can have one character draft
- **ON DELETE**: CASCADE (if player is deleted, their draft is deleted)

### Session Management

#### `sessions`
- **Purpose**: Defines available game sessions (date, DM, capacity, etc.)
- **No Foreign Keys**: This is a standalone table that players can join
- **Referenced By**: `session_players.session_id`

### Other Tables

#### `comments`
- **Purpose**: Stores player comments and feedback
- **No Foreign Keys**: Uses `player_name` as a denormalized field for flexibility
- **Note**: Could optionally be linked to `player_access` in the future

## User Flow

### 1. Authentication
1. User visits `login.html` and enters their access code
2. System calls `POST /api/login` with the access code
3. Server hashes the code and looks up matching record in `player_access`
4. If found, returns `player_key` and stores it in localStorage
5. User is redirected to main application

### 2. Viewing & Updating Character Build
1. Application loads with the stored `player_key`
2. System fetches `build_cards` record for this `player_key`
3. User can update their class, university, and character name
4. Changes are saved back to `build_cards` table

### 3. Joining Sessions
1. User selects a session to join
2. System creates a record in `session_players` table
3. Record links `player_key` (from player_access) to `session_id` (from sessions)
4. This establishes the many-to-many relationship

### 4. Data Integrity
If a player account is deleted from `player_access`:
- Their build card is automatically removed (`build_cards`)
- They're removed from all sessions (`session_players`)
- Their roster metadata is deleted (`roster_meta`)
- Their character draft is deleted (`character_drafts`)

This CASCADE behavior ensures no orphaned data remains in the system.

## Schema Comparison: JSON vs Tables

The application supports two storage modes:

### JSON Mode (`oracle_state.sql`)
- Stores most data in a single JSON blob in `oracle_state` table
- Still uses `player_access` for authentication
- `character_drafts` links to `player_access` via foreign key

### Tables Mode (`oracle_tables.sql`)
- Fully normalized schema with separate tables
- All player data tables link to `player_access` via foreign keys
- Better for querying, reporting, and data integrity
- **Recommended for production use**

## Entity Relationship Diagram (Text)

```
player_access (Central Authentication)
    |
    |-- player_key (PK)
    |
    +-- build_cards.player_key (FK, CASCADE)
    |
    +-- roster_extras.player_key (FK, CASCADE)
    |
    +-- roster_meta.player_key (FK, CASCADE)
    |
    +-- session_players.player_key (FK, CASCADE)
    |       |
    |       +-- session_players.session_id (FK, CASCADE)
    |                   |
    |                   +-- sessions.id (PK)
    |
    +-- character_drafts.player_key (FK, CASCADE)

comments (standalone, no FK constraints)
```

## Key Takeaways

1. **All player data flows through `player_access`** - this is the single source of truth for user identity
2. **Foreign keys enforce referential integrity** - you cannot create player data without a valid player_access record
3. **CASCADE deletes prevent orphaned data** - removing a player cleanly removes all their associated data
4. **Login flow is separate from game data** - authentication (`player_access`) is distinct from game state (`sessions`, `build_cards`, etc.)
5. **Guest mode is read-only** - guest users don't have a `player_access` record, so they can't modify data

## Migration Notes

If you have existing data before these foreign key constraints were added:

1. Ensure all `player_key` values in dependent tables exist in `player_access`
2. Clean up any orphaned records before applying constraints
3. Consider adding players to `player_access` for any orphaned data you want to keep

## Deprecated Tables

The `availability` table is deprecated and no longer used by the application. New installations may omit this table. Existing installations can drop it manually:

```sql
DROP TABLE IF EXISTS public.availability;
```

## Future Enhancements

Possible improvements to strengthen the data model:

1. Add `player_key` foreign key to `comments` table
2. Create a `characters` table separate from `build_cards` for persistent character data
3. Add audit triggers to track changes to player data
4. Implement soft deletes instead of CASCADE for data retention
