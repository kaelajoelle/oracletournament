#!/usr/bin/env node
/**
 * Script to validate .env configuration for the Oracle Tournament application.
 * Usage:
 *   node scripts/validate-env.js
 *   npm run validate:env
 * 
 * This script checks that your environment variables are properly configured
 * for either local development or Supabase deployment.
 */

const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const issues = [];
const warnings = [];
const info = [];

function checkRequired(varName, description) {
  const value = process.env[varName];
  if (!value) {
    issues.push(`❌ ${varName} is missing`);
    if (description) {
      info.push(`   ℹ️  ${description}`);
    }
    return false;
  }
  return true;
}

function checkOptional(varName, defaultValue, description) {
  const value = process.env[varName];
  if (!value) {
    warnings.push(`⚠️  ${varName} not set (will use default: ${defaultValue})`);
    if (description) {
      info.push(`   ℹ️  ${description}`);
    }
    return false;
  }
  return true;
}

function validateUrl(varName) {
  const value = process.env[varName];
  if (!value) return;
  
  try {
    new URL(value);
  } catch {
    issues.push(`❌ ${varName} is not a valid URL: ${value}`);
  }
}

function validateSupabaseUrl() {
  const url = process.env.SUPABASE_URL;
  if (!url) return;
  
  if (!url.includes('supabase.co')) {
    warnings.push(`⚠️  SUPABASE_URL doesn't appear to be a Supabase URL: ${url}`);
    info.push(`   ℹ️  Expected format: https://your-project.supabase.co`);
  }
}

function validateServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return;
  
  // JWT tokens start with eyJ
  if (!key.startsWith('eyJ')) {
    warnings.push(`⚠️  SUPABASE_SERVICE_ROLE_KEY doesn't appear to be a JWT token`);
    info.push(`   ℹ️  Expected format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`);
  }
}

function validateStorageMode() {
  const mode = (process.env.SUPABASE_STORAGE_MODE || 'json').toLowerCase();
  
  if (mode !== 'json' && mode !== 'tables') {
    issues.push(`❌ SUPABASE_STORAGE_MODE must be 'json' or 'tables', got: ${mode}`);
    return null;
  }
  
  return mode;
}

function validateTableNames(mode) {
  if (mode !== 'tables') return;
  
  // These are the table names used when SUPABASE_STORAGE_MODE=tables
  const tables = [
    { var: 'SUPABASE_SESSIONS_TABLE', default: 'sessions' },
    { var: 'SUPABASE_SESSION_PLAYERS_TABLE', default: 'session_players' },
    { var: 'SUPABASE_ROSTER_EXTRAS_TABLE', default: 'roster_extras' },
    { var: 'SUPABASE_ROSTER_META_TABLE', default: 'roster_meta' },
    { var: 'SUPABASE_AVAILABILITY_TABLE', default: 'availability' },
    { var: 'SUPABASE_BUILD_CARDS_TABLE', default: 'build_cards' },
    { var: 'SUPABASE_COMMENTS_TABLE', default: 'comments' },
    { var: 'SUPABASE_PLAYER_ACCESS_TABLE', default: 'player_access' }
  ];
  
  tables.forEach(({ var: varName, default: defaultValue }) => {
    checkOptional(varName, defaultValue, `Used for normalized storage in tables mode`);
  });
}

function validateJsonModeVars(mode) {
  if (mode !== 'json') return;
  
  checkOptional('SUPABASE_TABLE', 'oracle_state', 'Single table that stores the JSON blob');
  checkOptional('SUPABASE_ROW_ID', 'shared', 'Row ID within the table');
  checkOptional('SUPABASE_CHARACTER_DRAFTS_TABLE', 'character_drafts', 'Table for character drafts');
}

function showSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Oracle Tournament Environment Configuration Validation');
  console.log('='.repeat(80) + '\n');
  
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageMode = (process.env.SUPABASE_STORAGE_MODE || 'json').toLowerCase();
  
  console.log('Configuration Summary:');
  console.log('─'.repeat(80));
  
  if (hasSupabase) {
    console.log(`✅ Supabase Mode: Enabled`);
    console.log(`   Storage Mode: ${storageMode}`);
    console.log(`   URL: ${process.env.SUPABASE_URL}`);
  } else {
    console.log(`ℹ️  Supabase Mode: Disabled (using local JSON files)`);
    console.log(`   Data Path: ${process.env.DATA_PATH || 'api/state.json (default)'}`);
  }
  
  console.log('─'.repeat(80) + '\n');
}

function main() {
  showSummary();
  
  // Check what mode we're in
  const hasSupabase = process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (hasSupabase) {
    console.log('Validating Supabase configuration...\n');
    
    // Required for Supabase mode
    const hasUrl = checkRequired('SUPABASE_URL', 'Get this from your Supabase project settings');
    const hasKey = checkRequired('SUPABASE_SERVICE_ROLE_KEY', 'Get this from your Supabase project settings > API');
    
    if (hasUrl) {
      validateUrl('SUPABASE_URL');
      validateSupabaseUrl();
    }
    
    if (hasKey) {
      validateServiceRoleKey();
    }
    
    // Validate storage mode
    const storageMode = validateStorageMode();
    
    if (storageMode === 'tables') {
      validateTableNames(storageMode);
    } else if (storageMode === 'json') {
      validateJsonModeVars(storageMode);
    }
    
    // Optional player access token
    if (!process.env.PLAYER_ACCESS_ADMIN_TOKEN) {
      warnings.push(`⚠️  PLAYER_ACCESS_ADMIN_TOKEN not set`);
      info.push(`   ℹ️  This token is required to use the /api/admin/player-access endpoints`);
    }
  } else {
    console.log('Using local JSON file storage (no Supabase configured)\n');
    
    if (!process.env.DATA_PATH) {
      console.log(`ℹ️  DATA_PATH not set, will use default: api/state.json\n`);
    }
  }
  
  // Display results
  console.log('\nValidation Results:');
  console.log('─'.repeat(80));
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Your configuration looks good.\n');
    return 0;
  }
  
  if (issues.length > 0) {
    console.log('\n🚨 Issues Found:\n');
    issues.forEach(issue => console.log(issue));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:\n');
    warnings.forEach(warning => console.log(warning));
  }
  
  if (info.length > 0) {
    console.log('\n');
    info.forEach(i => console.log(i));
  }
  
  console.log('\n' + '─'.repeat(80));
  
  if (issues.length > 0) {
    console.log('\n❌ Configuration has issues that need to be fixed.\n');
    console.log('📚 See .env.example for reference configuration.\n');
    return 1;
  }
  
  if (warnings.length > 0) {
    console.log('\n✅ Configuration is valid but has some optional items not configured.\n');
    console.log('   This is fine for development, but review warnings for production.\n');
  }
  
  return 0;
}

const exitCode = main();
process.exit(exitCode);
