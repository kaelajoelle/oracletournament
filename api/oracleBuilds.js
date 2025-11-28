/**
 * Oracle Character Build Helpers
 * ==============================
 * 
 * Provides save/load utility functions for full Oracle character builds using Supabase.
 * 
 * Schema Requirements:
 * --------------------
 * The `public.build_cards` table must have the following columns:
 *   - player_key (TEXT, PRIMARY KEY, references player_access)
 *   - class (TEXT)
 *   - university (TEXT)
 *   - character_name (TEXT)
 *   - build_data (JSONB) - Stores the full OracleCharacterBuild object
 *   - updated_at (TIMESTAMPTZ)
 * 
 * If the build_data column doesn't exist, run the migration:
 *   supabase/add_build_data_column.sql
 * 
 * Important Notes:
 * ----------------
 * - player_key MUST exist in the player_access table before inserting (FK constraint)
 * - All fields from OracleCharacterBuild are safely persisted inside the build_data jsonb column
 * - These functions are designed to work with Supabase RLS policies that allow service_role access
 * - The supabase client passed to these functions should be initialized with the service role key
 * 
 * Usage Example:
 * --------------
 *   const { createClient } = require('@supabase/supabase-js');
 *   const { saveOracleBuild, loadOracleBuild, loadAllOracleBuilds } = require('./oracleBuilds');
 *   
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 *   
 *   // Save a build
 *   const error = await saveOracleBuild(supabase, 'player123', myBuild);
 *   
 *   // Load a build
 *   const { data, error } = await loadOracleBuild(supabase, 'player123');
 *   
 *   // Admin: load all builds
 *   const { data, error } = await loadAllOracleBuilds(supabase);
 * 
 * TypeScript Signatures (for reference):
 * ---------------------------------------
 * 
 * interface OracleCharacterBuild {
 *   class?: string;
 *   university?: string;
 *   characterName?: string;
 *   [key: string]: unknown;  // Additional build fields stored in build_data
 * }
 * 
 * interface FlattenedBuild {
 *   player_key: string;
 *   class: string | null;
 *   university: string | null;
 *   character_name: string | null;
 *   build_data: OracleCharacterBuild | null;
 *   updated_at: string | null;
 * }
 * 
 * async function saveOracleBuild(
 *   supabase: SupabaseClient,
 *   playerKey: string,
 *   build: OracleCharacterBuild
 * ): Promise<{ error: Error | null }>
 * 
 * async function loadOracleBuild(
 *   supabase: SupabaseClient,
 *   playerKey: string
 * ): Promise<{ data: OracleCharacterBuild | null; error: Error | null }>
 * 
 * async function loadAllOracleBuilds(
 *   supabase: SupabaseClient
 * ): Promise<{ data: FlattenedBuild[]; error: Error | null }>
 */

'use strict';

const BUILD_CARDS_TABLE = 'build_cards';

/**
 * Sanitize a string value, returning empty string for null/undefined
 * @param {unknown} value - Value to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeOptional(value) {
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

/**
 * Normalize a player key to lowercase for consistent lookups
 * @param {unknown} value - Value to normalize
 * @returns {string} Normalized player key
 */
function normalizePlayerKey(value) {
  return sanitizeOptional(value).toLowerCase();
}

/**
 * Extract standard build fields from an OracleCharacterBuild-like object.
 *
 * Tailored to the Oracle Builder shape:
 * - Core fields may live under build.core (e.g., core.name, core.class)
 * - University may be a plain string (build.university = 'lorehold')
 *   or an object (build.university.key / build.university.name)
 * - Legacy/alternate fields: build.college, build.school
 *
 * Field precedence:
 * - characterName > character_name > core.name
 * - class (top-level) > core.class
 * - university (string) > university.key > university.name > college > school
 *
 * @param {object} build - The build object
 * @returns {{ class: string|null, university: string|null, characterName: string|null }}
 */
function extractBuildFields(build) {
  if (!build || typeof build !== 'object') {
    return { class: null, university: null, characterName: null };
  }

  const core = (build.core && typeof build.core === 'object') ? build.core : {};
  const uniObj = (build.university && typeof build.university === 'object') ? build.university : {};

  // Character name precedence
  const rawCharacterName =
    (build.characterName !== undefined ? build.characterName : undefined) ??
    (build.character_name !== undefined ? build.character_name : undefined) ??
    core.name;

  // Class precedence
  const rawClass =
    (build.class !== undefined ? build.class : undefined) ??
    core.class;

  // University precedence
  let rawUniversity;
  if (typeof build.university === 'string') {
    rawUniversity = build.university;
  } else {
    rawUniversity =
      (uniObj.key !== undefined ? uniObj.key : undefined) ??
      (uniObj.name !== undefined ? uniObj.name : undefined) ??
      (build.college !== undefined ? build.college : undefined) ??
      (build.school !== undefined ? build.school : undefined);
  }

  return {
    class: sanitizeOptional(rawClass) || null,
    university: sanitizeOptional(rawUniversity) || null,
    characterName: sanitizeOptional(rawCharacterName) || null,
  };
}
/**
 * Save a full Oracle character build to Supabase (upsert by player_key).
 * 
 * This function stores both the denormalized top-level fields (class, university, 
 * character_name) for quick queries AND the complete build object in the build_data
 * JSONB column for full persistence.
 * 
 * @param {object} supabase - Supabase client instance (must be initialized with service role key)
 * @param {string} playerKey - Unique player identifier (must exist in player_access table)
 * @param {object} build - Full OracleCharacterBuild object to persist
 * @returns {Promise<{error: Error|null}>} Error object if operation failed, null if successful
 * 
 * @example
 * const error = await saveOracleBuild(supabase, 'player123', {
 *   class: 'Wizard',
 *   university: 'Arcana',
 *   characterName: 'Gandalf',
 *   // ... other build properties
 * });
 * if (error) {
 *   console.error('Failed to save build:', error.message);
 * }
 */
async function saveOracleBuild(supabase, playerKey, build) {
  const normalizedKey = normalizePlayerKey(playerKey);
  
  if (!normalizedKey) {
    return { error: new Error('playerKey is required') };
  }

  if (!supabase || typeof supabase.from !== 'function') {
    return { error: new Error('Invalid supabase client') };
  }

  const fields = extractBuildFields(build);
  
  const { error } = await supabase
    .from(BUILD_CARDS_TABLE)
    .upsert({
      player_key: normalizedKey,
      class: fields.class,
      university: fields.university,
      character_name: fields.characterName,
      build_data: build,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'player_key' });

  return { error: error || null };
}

/**
 * Load a full Oracle character build by player_key.
 * 
 * Returns the complete build object from the build_data JSONB column.
 * If build_data is null but other fields exist, constructs a minimal build
 * object from the denormalized columns.
 * 
 * @param {object} supabase - Supabase client instance (must be initialized with service role key)
 * @param {string} playerKey - Unique player identifier
 * @returns {Promise<{data: object|null, error: Error|null}>} Build data and error status
 * 
 * @example
 * const { data, error } = await loadOracleBuild(supabase, 'player123');
 * if (error) {
 *   console.error('Failed to load build:', error.message);
 * } else if (data) {
 *   console.log('Character class:', data.class);
 * }
 */
async function loadOracleBuild(supabase, playerKey) {
  const normalizedKey = normalizePlayerKey(playerKey);

  if (!normalizedKey) {
    return { data: null, error: new Error('playerKey is required') };
  }

  if (!supabase || typeof supabase.from !== 'function') {
    return { data: null, error: new Error('Invalid supabase client') };
  }

  const { data, error } = await supabase
    .from(BUILD_CARDS_TABLE)
    .select('player_key, class, university, character_name, build_data, updated_at')
    .eq('player_key', normalizedKey)
    .limit(1)
    .single();

  if (error) {
    // PGRST116 is "no rows returned" - not an error, just no data
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  // Prefer build_data if available, otherwise construct from columns
  if (data.build_data && typeof data.build_data === 'object') {
    return { data: data.build_data, error: null };
  }

  // Fallback: construct minimal build from denormalized columns
  const fallbackBuild = {};
  if (data.class) {
    fallbackBuild.class = data.class;
  }
  if (data.university) {
    fallbackBuild.university = data.university;
  }
  if (data.character_name) {
    fallbackBuild.characterName = data.character_name;
  }

  return { 
    data: Object.keys(fallbackBuild).length > 0 ? fallbackBuild : null, 
    error: null 
  };
}

/**
 * Load all Oracle character builds (admin function).
 * 
 * Returns a flattened array of all build records including the full build_data
 * JSONB objects. Useful for admin dashboards, exports, or bulk operations.
 * 
 * @param {object} supabase - Supabase client instance (must be initialized with service role key)
 * @returns {Promise<{data: Array<object>, error: Error|null}>} Array of flattened builds and error status
 * 
 * @example
 * const { data, error } = await loadAllOracleBuilds(supabase);
 * if (error) {
 *   console.error('Failed to load builds:', error.message);
 * } else {
 *   console.log(`Loaded ${data.length} builds`);
 *   data.forEach(build => {
 *     console.log(`Player: ${build.player_key}, Class: ${build.class}`);
 *   });
 * }
 */
async function loadAllOracleBuilds(supabase) {
  if (!supabase || typeof supabase.from !== 'function') {
    return { data: [], error: new Error('Invalid supabase client') };
  }

  const { data, error } = await supabase
    .from(BUILD_CARDS_TABLE)
    .select('player_key, class, university, character_name, build_data, updated_at')
    .order('player_key', { ascending: true });

  if (error) {
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

module.exports = {
  saveOracleBuild,
  loadOracleBuild,
  loadAllOracleBuilds,
  // Export internal utilities for testing
  sanitizeOptional,
  normalizePlayerKey,
  extractBuildFields,
  BUILD_CARDS_TABLE,
};
