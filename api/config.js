/**
 * Centralized configuration module for the Oracle Tournament API.
 *
 * This module loads environment variables once at module load time from multiple
 * legacy locations and exports commonly-used config values for the API.
 *
 * Environment files are loaded in order (later files do not override existing values):
 * 1. Project root `.env`
 * 2. `api/.env` (legacy/local overrides)
 * 3. `scripts/.env` (legacy pattern, if present)
 * 4. `script/.env` (actual file present in this repo, singular)
 */
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });
require('dotenv').config({ path: path.join(__dirname, '..', 'scripts', '.env'), override: false });
require('dotenv').config({ path: path.join(__dirname, '..', 'script', '.env'), override: false });

// ─────────────────────────────────────────────────────────────────────────────
// Core API configuration
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8787;

const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.join(__dirname, 'state.json');

const COMMENTS_DATA_PATH = process.env.COMMENTS_DATA_PATH
  ? path.resolve(process.env.COMMENTS_DATA_PATH)
  : path.join(path.dirname(DATA_PATH), 'comments.json');

const CHARACTER_DRAFTS_PATH = process.env.CHARACTER_DRAFTS_PATH
  ? path.resolve(process.env.CHARACTER_DRAFTS_PATH)
  : path.join(path.dirname(DATA_PATH), 'character_drafts.json');

const BUILDS_DATA_PATH = process.env.BUILDS_DATA_PATH
  ? path.resolve(process.env.BUILDS_DATA_PATH)
  : path.join(path.dirname(DATA_PATH), 'builds_data.json');

// ─────────────────────────────────────────────────────────────────────────────
// Supabase configuration
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Alias for compatibility
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_TABLE = process.env.SUPABASE_TABLE || 'oracle_state';
const SUPABASE_ROW_ID = process.env.SUPABASE_ROW_ID || 'shared';
const SUPABASE_STORAGE_MODE = (process.env.SUPABASE_STORAGE_MODE || 'json').toLowerCase();
const SUPABASE_CHARACTER_DRAFTS_TABLE = process.env.SUPABASE_CHARACTER_DRAFTS_TABLE || 'character_drafts';

// Normalized table names (used when SUPABASE_STORAGE_MODE=tables)
const SUPABASE_SESSIONS_TABLE = process.env.SUPABASE_SESSIONS_TABLE || 'sessions';
const SUPABASE_SESSION_PLAYERS_TABLE = process.env.SUPABASE_SESSION_PLAYERS_TABLE || 'session_players';
const SUPABASE_ROSTER_EXTRAS_TABLE = process.env.SUPABASE_ROSTER_EXTRAS_TABLE || 'roster_extras';
const SUPABASE_ROSTER_META_TABLE = process.env.SUPABASE_ROSTER_META_TABLE || 'roster_meta';
const SUPABASE_BUILD_CARDS_TABLE = process.env.SUPABASE_BUILD_CARDS_TABLE || 'build_cards';
const SUPABASE_COMMENTS_TABLE = process.env.SUPABASE_COMMENTS_TABLE || 'comments';
const SUPABASE_PLAYER_ACCESS_TABLE = process.env.SUPABASE_PLAYER_ACCESS_TABLE || 'player_access';

const SUPABASE_ACCESS_CODE_HASH_COLUMNS = (process.env.SUPABASE_ACCESS_CODE_HASH_COLUMNS || 'access_code_hash')
  .split(',')
  .map((value) => String(value || '').trim())
  .filter(Boolean);

// ─────────────────────────────────────────────────────────────────────────────
// Access control
// ─────────────────────────────────────────────────────────────────────────────
const PLAYER_ACCESS_ADMIN_TOKEN = process.env.PLAYER_ACCESS_ADMIN_TOKEN || '';

// ─────────────────────────────────────────────────────────────────────────────
// Derived flags
// ─────────────────────────────────────────────────────────────────────────────
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const useSupabaseTables = hasSupabase && SUPABASE_STORAGE_MODE === 'tables';
const canUsePlayerAccess = hasSupabase && Boolean(SUPABASE_PLAYER_ACCESS_TABLE);

// ─────────────────────────────────────────────────────────────────────────────
// Supabase REST URLs (derived from SUPABASE_URL)
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_REST_BASE = hasSupabase
  ? `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`
  : null;
const SUPABASE_REST_URL = hasSupabase
  ? `${SUPABASE_REST_BASE}/${SUPABASE_TABLE}`
  : null;

/**
 * Logs a one-line summary of the current configuration.
 * Useful for debugging at startup.
 */
function logConfigSummary() {
  const mode = useSupabaseTables ? 'supabase-tables' : hasSupabase ? 'supabase-json' : 'file';
  console.log(`[config] mode=${mode} port=${PORT} hasSupabase=${hasSupabase} useSupabaseTables=${useSupabaseTables} canUsePlayerAccess=${canUsePlayerAccess}`);
}

module.exports = {
  // Core API configuration
  PORT,
  DATA_PATH,
  COMMENTS_DATA_PATH,
  CHARACTER_DRAFTS_PATH,
  BUILDS_DATA_PATH,

  // Supabase configuration
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_KEY,
  SUPABASE_TABLE,
  SUPABASE_ROW_ID,
  SUPABASE_STORAGE_MODE,
  SUPABASE_CHARACTER_DRAFTS_TABLE,
  SUPABASE_SESSIONS_TABLE,
  SUPABASE_SESSION_PLAYERS_TABLE,
  SUPABASE_ROSTER_EXTRAS_TABLE,
  SUPABASE_ROSTER_META_TABLE,
  SUPABASE_BUILD_CARDS_TABLE,
  SUPABASE_COMMENTS_TABLE,
  SUPABASE_PLAYER_ACCESS_TABLE,
  SUPABASE_ACCESS_CODE_HASH_COLUMNS,

  // Access control
  PLAYER_ACCESS_ADMIN_TOKEN,

  // Derived flags
  hasSupabase,
  useSupabaseTables,
  canUsePlayerAccess,

  // Supabase REST URLs
  SUPABASE_REST_BASE,
  SUPABASE_REST_URL,

  // Utility functions
  logConfigSummary,
};
