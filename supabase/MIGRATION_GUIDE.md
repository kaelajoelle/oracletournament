# Database Migration Guide

## Adding Foreign Key Constraints to Existing Deployment

If you have an existing Oracle Tournament deployment that was using the old schema (without foreign key constraints), follow this guide to safely migrate to the new schema with proper referential integrity.

## Prerequisites

- Backup your database before starting
- Access to the Supabase SQL editor or CLI
- Understanding of your current data

## Migration Steps

### Step 1: Backup Your Data

```sql
-- Create backup tables
CREATE TABLE player_access_backup AS SELECT * FROM player_access;
CREATE TABLE session_players_backup AS SELECT * FROM session_players;
CREATE TABLE roster_extras_backup AS SELECT * FROM roster_extras;
CREATE TABLE roster_meta_backup AS SELECT * FROM roster_meta;
CREATE TABLE availability_backup AS SELECT * FROM availability;
CREATE TABLE build_cards_backup AS SELECT * FROM build_cards;
CREATE TABLE character_drafts_backup AS SELECT * FROM character_drafts;
```

### Step 2: Identify Orphaned Records

Run these queries to find data that doesn't have a corresponding player_access record:

```sql
-- Find orphaned session_players
SELECT DISTINCT player_key 
FROM session_players 
WHERE player_key NOT IN (SELECT player_key FROM player_access);

-- Find orphaned roster_extras
SELECT DISTINCT player_key 
FROM roster_extras 
WHERE player_key NOT IN (SELECT player_key FROM player_access);

-- Find orphaned roster_meta
SELECT DISTINCT player_key 
FROM roster_meta 
WHERE player_key NOT IN (SELECT player_key FROM player_access);

-- Find orphaned availability
SELECT DISTINCT player_key 
FROM availability 
WHERE player_key NOT IN (SELECT player_key FROM player_access);

-- Find orphaned build_cards
SELECT DISTINCT player_key 
FROM build_cards 
WHERE player_key NOT IN (SELECT player_key FROM player_access);

-- Find orphaned character_drafts
SELECT DISTINCT player_key 
FROM character_drafts 
WHERE player_key NOT IN (SELECT player_key FROM player_access);
```

### Step 3: Create Missing Player Access Records

For each orphaned player_key, decide whether to:

**Option A: Create a player_access record**
```sql
-- Replace 'orphaned_key', 'Display Name', and 'temporary_code' with actual values
INSERT INTO player_access (player_key, display_name, access_code_hash, created_at, updated_at)
VALUES (
  'orphaned_key',
  'Display Name',
  encode(digest('temporary_code', 'sha256'), 'hex'),
  now(),
  now()
);
```

**Option B: Delete the orphaned records**
```sql
-- WARNING: This deletes data permanently
DELETE FROM session_players WHERE player_key = 'orphaned_key';
DELETE FROM roster_extras WHERE player_key = 'orphaned_key';
DELETE FROM roster_meta WHERE player_key = 'orphaned_key';
DELETE FROM availability WHERE player_key = 'orphaned_key';
DELETE FROM build_cards WHERE player_key = 'orphaned_key';
DELETE FROM character_drafts WHERE player_key = 'orphaned_key';
```

### Step 4: Add Foreign Key Constraints

Once all orphaned records are resolved, add the foreign key constraints:

```sql
BEGIN;

-- session_players
ALTER TABLE session_players 
ADD CONSTRAINT session_players_player_key_fkey 
FOREIGN KEY (player_key) 
REFERENCES player_access(player_key) 
ON DELETE CASCADE;

-- roster_extras
ALTER TABLE roster_extras 
ADD CONSTRAINT roster_extras_player_key_fkey 
FOREIGN KEY (player_key) 
REFERENCES player_access(player_key) 
ON DELETE CASCADE;

-- roster_meta
ALTER TABLE roster_meta 
ADD CONSTRAINT roster_meta_player_key_fkey 
FOREIGN KEY (player_key) 
REFERENCES player_access(player_key) 
ON DELETE CASCADE;

-- availability
ALTER TABLE availability 
ADD CONSTRAINT availability_player_key_fkey 
FOREIGN KEY (player_key) 
REFERENCES player_access(player_key) 
ON DELETE CASCADE;

-- build_cards
ALTER TABLE build_cards 
ADD CONSTRAINT build_cards_player_key_fkey 
FOREIGN KEY (player_key) 
REFERENCES player_access(player_key) 
ON DELETE CASCADE;

-- character_drafts (if it exists)
ALTER TABLE character_drafts 
ADD CONSTRAINT character_drafts_player_key_fkey 
FOREIGN KEY (player_key) 
REFERENCES player_access(player_key) 
ON DELETE CASCADE;

COMMIT;
```

### Step 5: Verify Constraints

```sql
-- Check all foreign keys were created
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'player_access'
ORDER BY tc.table_name;
```

Expected output should show:
- `session_players.player_key → player_access.player_key`
- `roster_extras.player_key → player_access.player_key`
- `roster_meta.player_key → player_access.player_key`
- `availability.player_key → player_access.player_key`
- `build_cards.player_key → player_access.player_key`
- `character_drafts.player_key → player_access.player_key`

### Step 6: Test the Constraints

Try to insert invalid data to verify constraints are working:

```sql
-- This should fail with a foreign key violation
INSERT INTO build_cards (player_key, class, university)
VALUES ('nonexistent_player', 'Wizard', 'Strixhaven');
```

Expected error: `ERROR: insert or update on table "build_cards" violates foreign key constraint`

### Step 7: Drop Backup Tables (Optional)

Once you've verified everything works:

```sql
-- Only do this if you're confident the migration succeeded
DROP TABLE player_access_backup;
DROP TABLE session_players_backup;
DROP TABLE roster_extras_backup;
DROP TABLE roster_meta_backup;
DROP TABLE availability_backup;
DROP TABLE build_cards_backup;
DROP TABLE character_drafts_backup;
```

## Fresh Installation

For new deployments, simply run the updated schema file:

```bash
# For normalized tables mode
cat supabase/oracle_tables.sql | psql <connection_string>

# Or in Supabase SQL Editor, paste and run the contents of:
# supabase/oracle_tables.sql
```

The foreign keys will be created as part of the initial table creation.

## Common Issues

### Issue: Foreign key constraint violation during migration

**Cause**: Orphaned records exist in the database

**Solution**: Follow Step 2 and Step 3 above to identify and resolve orphaned records

### Issue: Cannot add foreign key because player_access doesn't exist

**Cause**: Tables were created in wrong order

**Solution**: 
1. Drop all tables
2. Run the new schema from scratch (it creates player_access first)

### Issue: Constraint already exists error

**Cause**: Attempting to add constraint that already exists

**Solution**: Check existing constraints:
```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'session_players' 
  AND constraint_type = 'FOREIGN KEY';
```

## Rollback Procedure

If you need to rollback the migration:

```sql
BEGIN;

-- Drop all foreign key constraints
ALTER TABLE session_players DROP CONSTRAINT IF EXISTS session_players_player_key_fkey;
ALTER TABLE roster_extras DROP CONSTRAINT IF EXISTS roster_extras_player_key_fkey;
ALTER TABLE roster_meta DROP CONSTRAINT IF EXISTS roster_meta_player_key_fkey;
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_player_key_fkey;
ALTER TABLE build_cards DROP CONSTRAINT IF EXISTS build_cards_player_key_fkey;
ALTER TABLE character_drafts DROP CONSTRAINT IF EXISTS character_drafts_player_key_fkey;

COMMIT;
```

Then restore from backups if needed:
```sql
-- Restore data from backups
TRUNCATE session_players;
INSERT INTO session_players SELECT * FROM session_players_backup;
-- Repeat for other tables as needed
```

## Testing After Migration

1. **Test login**: Verify users can still log in with their access codes
2. **Test data access**: Verify users can see their build cards, availability, etc.
3. **Test data modification**: Try updating a build card or availability
4. **Test session joining**: Join and leave a session
5. **Test cascade delete**: Create a test player and delete them, verify all related data is removed

## Support

If you encounter issues during migration, refer to:
- `supabase/SCHEMA_DOCUMENTATION.md` for schema overview
- Supabase documentation: https://supabase.com/docs
- PostgreSQL foreign key documentation: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK
