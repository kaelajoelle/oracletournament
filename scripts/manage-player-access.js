#!/usr/bin/env node
/**
 * Script to manage player access codes.
 * Usage:
 *   node scripts/manage-player-access.js add "Display Name" "access-code"
 *   node scripts/manage-player-access.js list
 * 
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and optionally PLAYER_ACCESS_ADMIN_TOKEN
 * to be set in .env or scripts/.env
 */

const path = require('path');
const { createHash } = require('crypto');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const fetch = global.fetch || require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PLAYER_ACCESS_TABLE = process.env.SUPABASE_PLAYER_ACCESS_TABLE || 'player_access';

function sanitizeName(value) {
  return String(value ?? '').trim();
}

function sanitizeOptional(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || '';
}

function rosterKey(name) {
  return sanitizeName(name).toLowerCase();
}

function hashAccessCode(value) {
  const clean = sanitizeOptional(value).toLowerCase();
  if (!clean) {
    return '';
  }
  return createHash('sha256').update(clean).digest('hex');
}

function supabaseHeaders(extra = {}) {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

async function supabaseQuery(tablePath) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${tablePath}`;
  const res = await fetch(url, {
    headers: supabaseHeaders()
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${body}`);
  }
  const text = await res.text();
  if (!text) {
    return [];
  }
  return JSON.parse(text);
}

async function supabaseMutate(tablePath, options = {}) {
  const { method = 'POST', body, headers = {} } = options;
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${tablePath}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...supabaseHeaders(headers),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Supabase mutation failed (${res.status}): ${text}`);
  }
  
  return res;
}

async function listPlayers() {
  console.log('\nFetching player access records...\n');
  const rows = await supabaseQuery(
    `${encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE)}?select=player_key,display_name,last_login_at,created_at&order=display_name.asc`
  );
  
  if (rows.length === 0) {
    console.log('No player access records found.');
    return;
  }
  
  console.log('Player Access Records:');
  console.log('─'.repeat(80));
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.display_name} (${row.player_key})`);
    console.log(`   Created: ${row.created_at || 'N/A'}`);
    console.log(`   Last Login: ${row.last_login_at || 'Never'}`);
  });
  console.log('─'.repeat(80));
  console.log(`Total: ${rows.length} player(s)\n`);
}

async function addPlayer(displayName, accessCode) {
  const cleanName = sanitizeName(displayName);
  const cleanCode = sanitizeOptional(accessCode);
  
  if (!cleanName) {
    console.error('Error: Display name is required.');
    process.exit(1);
  }
  
  if (!cleanCode) {
    console.error('Error: Access code is required.');
    process.exit(1);
  }
  
  const playerKey = rosterKey(cleanName);
  const accessCodeHash = hashAccessCode(cleanCode);
  const now = new Date().toISOString();
  
  console.log(`\nCreating player access for "${cleanName}"...`);
  console.log(`Player Key: ${playerKey}`);
  console.log(`Access Code: ${cleanCode}`);
  
  // Check if player already exists
  const existing = await supabaseQuery(
    `${encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE)}?player_key=eq.${encodeURIComponent(playerKey)}`
  );
  
  if (existing.length > 0) {
    console.error(`\nError: Player with key "${playerKey}" already exists.`);
    console.log('Use a different display name or delete the existing record first.');
    process.exit(1);
  }
  
  const record = {
    player_key: playerKey,
    display_name: cleanName,
    access_code_hash: accessCodeHash,
    created_at: now,
    updated_at: now
  };
  
  try {
    await supabaseMutate(
      encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE),
      {
        method: 'POST',
        body: record,
        headers: { 'Prefer': 'return=minimal' }
      }
    );
    console.log('\n✓ Player access created successfully!\n');
    console.log('The user can now log in at login.html with:');
    console.log(`  Access Code: ${cleanCode}`);
    console.log(`  Display Name: ${cleanName}`);
    console.log(`  Player Key: ${playerKey}\n`);
  } catch (err) {
    console.error('\n✗ Failed to create player access:', err.message);
    process.exit(1);
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    console.error('Set them in .env or scripts/.env');
    process.exit(1);
  }
  
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    console.log(`
Player Access Management Script

Usage:
  node scripts/manage-player-access.js list
  node scripts/manage-player-access.js add "Display Name" "access-code"

Examples:
  node scripts/manage-player-access.js list
  node scripts/manage-player-access.js add "Kaela" "kaela123"
  node scripts/manage-player-access.js add "Tester Account" "test123"

Environment Variables (required):
  SUPABASE_URL              - Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY - Service role key with table access
  SUPABASE_PLAYER_ACCESS_TABLE - Table name (default: player_access)
`);
    process.exit(0);
  }
  
  if (command === 'list') {
    await listPlayers();
  } else if (command === 'add') {
    const displayName = process.argv[3];
    const accessCode = process.argv[4];
    if (!displayName || !accessCode) {
      console.error('Error: Both display name and access code are required.');
      console.error('Usage: node scripts/manage-player-access.js add "Display Name" "access-code"');
      process.exit(1);
    }
    await addPlayer(displayName, accessCode);
  } else {
    console.error(`Error: Unknown command "${command}"`);
    console.error('Run "node scripts/manage-player-access.js help" for usage information.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
