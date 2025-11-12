#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

const server = require('../api/server');
const { normaliseState, replaceSupabaseTablesState } = server;
const DEFAULT_STATE = JSON.parse(JSON.stringify(server.DEFAULT_STATE));

function ensureEnv(name){
  const value = process.env[name];
  if(!value){
    console.error(`Missing ${name} environment variable.`);
    process.exit(1);
  }
  return value;
}

async function loadStateFromSource(source){
  if(!source){
    return DEFAULT_STATE;
  }
  const resolved = path.resolve(process.cwd(), source);
  const raw = await fs.readFile(resolved, 'utf8');
  try{
    return JSON.parse(raw);
  }catch(err){
    console.error(`Failed to parse JSON from ${resolved}:`, err.message);
    process.exit(1);
  }
}

async function main(){
  ensureEnv('SUPABASE_URL');
  ensureEnv('SUPABASE_SERVICE_ROLE_KEY');

  const storageMode = (process.env.SUPABASE_STORAGE_MODE || 'tables').toLowerCase();
  if(storageMode !== 'tables'){
    console.warn(`SUPABASE_STORAGE_MODE is set to "${storageMode}". Seeding works best with "tables" mode.`);
  }

  const sourceArg = process.argv[2];
  const rawState = await loadStateFromSource(sourceArg);
  const state = normaliseState ? normaliseState(rawState) : rawState;

  await replaceSupabaseTablesState(state);

  const sessionCount = Array.isArray(state.sessions) ? state.sessions.length : 0;
  const playerCount = Array.isArray(state.sessions)
    ? state.sessions.reduce((total, session)=> total + (Array.isArray(session.players) ? session.players.length : 0), 0)
    : 0;
  const extrasCount = Array.isArray(state.rosterExtras) ? state.rosterExtras.length : 0;
  const availabilityCount = state.availability && typeof state.availability === 'object'
    ? Object.values(state.availability).reduce((total, dates)=> total + Object.values(dates || {}).filter(Boolean).length, 0)
    : 0;
  const buildCount = state.buildCards && typeof state.buildCards === 'object'
    ? Object.keys(state.buildCards).length
    : 0;

  console.log('Supabase tables seeded successfully with:');
  console.log(`  Sessions: ${sessionCount}`);
  console.log(`  Session sign-ups: ${playerCount}`);
  console.log(`  Roster extras: ${extrasCount}`);
  console.log(`  Availability entries: ${availabilityCount}`);
  console.log(`  Build cards: ${buildCount}`);
}

main().catch((err)=>{
  console.error(err);
  process.exit(1);
});
