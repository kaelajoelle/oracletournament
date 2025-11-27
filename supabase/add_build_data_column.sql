-- Migration: Add build_data jsonb column to build_cards table
-- This column stores the full OracleCharacterBuild object for complete character data persistence.
--
-- IMPORTANT: player_key must exist in the player_access table before inserting into build_cards
-- due to the foreign key constraint.
--
-- Run this migration to add the build_data column to an existing build_cards table.
-- If creating a fresh database, you may add this column directly to oracle_tables.sql instead.

BEGIN;

-- Add build_data column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'build_cards'
      AND column_name = 'build_data'
  ) THEN
    ALTER TABLE public.build_cards ADD COLUMN build_data jsonb;
  END IF;
END $$;

-- Add a comment describing the column purpose
COMMENT ON COLUMN public.build_cards.build_data IS 
  'Full OracleCharacterBuild object stored as JSONB. Contains all character build fields for complete persistence.';

COMMIT;
