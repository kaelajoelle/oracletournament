#!/usr/bin/env node

const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const server = require('../api/server');
const { normaliseState } = server;

function ensureEnv(name){
  const value = process.env[name];
  if(!value){
    console.error(`Missing ${name} environment variable.`);
    process.exit(1);
  }
  return value;
}

function summariseState(state){
  const safe = normaliseState ? normaliseState(state) : state;
  const sessions = Array.isArray(safe.sessions) ? safe.sessions : [];
  const rosterExtras = Array.isArray(safe.rosterExtras) ? safe.rosterExtras : [];
  const availabilityEntries = safe.availability && typeof safe.availability === 'object'
    ? Object.values(safe.availability).reduce((total, dates)=> total + Object.values(dates || {}).filter(Boolean).length, 0)
    : 0;
  const buildCardCount = safe.buildCards && typeof safe.buildCards === 'object'
    ? Object.keys(safe.buildCards).length
    : 0;

  return {
    sessions: sessions.length,
    sessionSummaries: sessions.map((session)=>({
      id: session.id,
      title: session.title,
      dm: session.dm,
      date: session.date,
      capacity: session.capacity,
      players: Array.isArray(session.players) ? session.players.length : 0
    })),
    rosterExtras: rosterExtras.length,
    availabilityEntries,
    buildCards: buildCardCount
  };
}

async function main(){
  ensureEnv('SUPABASE_URL');
  ensureEnv('SUPABASE_SERVICE_ROLE_KEY');

  const storageMode = (process.env.SUPABASE_STORAGE_MODE || 'json').toLowerCase();
  const outputJson = process.argv.includes('--json');

  let state;
  if(storageMode === 'tables'){
    if(typeof server.loadStateFromSupabaseTables !== 'function'){
      console.error('Supabase table loader is unavailable.');
      process.exit(1);
    }
    state = await server.loadStateFromSupabaseTables();
  }else{
    if(typeof server.loadStateFromSupabase !== 'function'){
      console.error('Supabase JSON loader is unavailable.');
      process.exit(1);
    }
    state = await server.loadStateFromSupabase();
  }

  const summary = summariseState(state);

  console.log(`Supabase storage mode: ${storageMode}`);
  console.log('Sessions:');
  summary.sessionSummaries.forEach((session)=>{
    console.log(`  - ${session.id} (${session.date}) ${session.title} — DM: ${session.dm} — capacity ${session.capacity} — players: ${session.players}`);
  });
  console.log(`Roster extras: ${summary.rosterExtras}`);
  console.log(`Availability entries: ${summary.availabilityEntries}`);
  console.log(`Build cards: ${summary.buildCards}`);

  if(outputJson){
    console.log('\nFull state:');
    console.log(JSON.stringify(state, null, 2));
  }
}

main().catch((err)=>{
  console.error(err);
  process.exit(1);
});
