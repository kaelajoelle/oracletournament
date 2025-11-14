#!/usr/bin/env node
/*
Merged seeder: combines direct Supabase table seeding (server-side) and API-based seeding.
Usage examples:
  - Direct table seeding (requires service role key):
      SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> node db/seed.js db/seed.json
  - API-based seeding (recommended for validation):
      API_BASE=https://oracletournament.onrender.com node db/seed.js db/seed.json
  - Choose method explicitly with MODE=api or MODE=direct or MODE=auto (auto prefers direct when service role key is present)
  - If your API requires an admin header: set AUTH_HEADER_NAME and AUTH_TOKEN.

The script is idempotent and tolerant of conflicts. It will try the chosen method and report results.
*/

const fs = require('fs');
const path = require('path');

async function fileExists(p){
  try{ await fs.promises.access(p); return true; }catch{return false; }
}

function loadJsonSync(p){
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function keyFor(name){ return String(name||'').trim().toLowerCase(); }

async function runApiSeeder(seed, opts){
  const fetch = global.fetch || require('node-fetch');
  const API_BASE = (process.env.API_BASE || opts.apiBase || 'https://oracletournament.onrender.com').replace(/\/$/, '');
  const AUTH_HEADER_NAME = process.env.AUTH_HEADER_NAME || '';
  const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
  function headers(){ const h = {'Content-Type':'application/json'}; if(AUTH_HEADER_NAME && AUTH_TOKEN) h[AUTH_HEADER_NAME]=AUTH_TOKEN; return h; }
  async function post(path, body){
    const url = API_BASE + path;
    try{
      const res = await fetch(url, { method:'POST', headers: headers(), body: JSON.stringify(body) });
      const txt = await res.text();
      let json; try{ json = JSON.parse(txt); }catch{ json = txt; }
      return { ok: res.ok, status: res.status, body: json };
    }catch(err){ return { ok:false, error: err.message || String(err) } }
  }
  async function patch(path, body){
    const url = API_BASE + path;
    try{
      const res = await fetch(url, { method:'PATCH', headers: headers(), body: JSON.stringify(body) });
      const txt = await res.text();
      let json; try{ json = JSON.parse(txt); }catch{ json = txt; }
      return { ok: res.ok, status: res.status, body: json };
    }catch(err){ return { ok:false, error: err.message || String(err) } }
  }

  console.log('Seeding via API ->', API_BASE);

  // 1) roster extras
  for(const extra of seed.rosterExtras || []){
    const body = { name: extra.name, status: extra.status||'', notes: extra.notes||'' };
    const r = await post('/api/roster/extras', body);
    if(r.ok) console.log('created roster extra', extra.name);
    else console.warn('roster/extras', extra.name, r.status, r.body || r.error);
  }

  // 2) roster meta
  for(const [rawKey, meta] of Object.entries(seed.rosterMeta || {})){
    const key = keyFor(rawKey);
    const payload = { status: meta.status||'', notes: meta.notes||'', hidden: Boolean(meta.hidden), custom:false, name: rawKey };
    const r = await patch(`/api/roster/${encodeURIComponent(key)}`, payload);
    if(r.ok) console.log('patched roster meta', rawKey);
    else console.warn('PATCH roster', rawKey, r.status, r.body || r.error);
  }

  // 3) availability
  for(const [rawName, dates] of Object.entries(seed.availability || {})){
    const playerKey = keyFor(rawName);
    for(const [date, val] of Object.entries(dates||{})){
      if(!val) continue;
      const payload = { playerKey, playerName: rawName, name: rawName, date, available: true };
      const r = await post('/api/availability', payload);
      if(r.ok) console.log('availability set', rawName, date);
      else console.warn('availability', rawName, date, r.status, r.body || r.error);
    }
  }

  // 4) join sessions (and create build cards via join)
  for(const s of seed.sessions || []){
    if(!Array.isArray(s.players) || s.players.length===0) continue;
    for(const playerName of s.players){
      const playerKey = keyFor(playerName);
      const build = (seed.buildCards && seed.buildCards[playerKey]) ? seed.buildCards[playerKey] : null;
      const payload = { playerKey, playerName, name: playerName, characterName: playerName, build: build ? { class: build.class, university: build.university } : undefined };
      const r = await post(`/api/sessions/${encodeURIComponent(s.id)}/join`, payload);
      if(r.ok) console.log('joined', playerName, '->', s.id);
      else console.warn('join', s.id, playerName, r.status, r.body || r.error);
    }
  }

  console.log('API seeding complete.');
}

async function runDirectSeeder(seed){
  // Uses server.replaceSupabaseTablesState to write directly to Supabase tables.
  // Requires being run in the repo where api/server is available and env SUPABASE_* variables set.
  console.log('Seeding directly to Supabase tables using server.replaceSupabaseTablesState');
  const serverPath = path.join(__dirname, '..', 'api', 'server');
  // require server module
  let server;
  try{ server = require('../api/server'); }
  catch(err){
    console.error('Failed to require ../api/server. Ensure this script runs from repo root and that api/server exports replaceSupabaseTablesState.');
    throw err;
  }
  const { normaliseState, replaceSupabaseTablesState } = server;
  const state = normaliseState ? normaliseState(seed) : seed;
  await replaceSupabaseTablesState(state);
  console.log('Direct Supabase table seeding complete.');
}

async function main(){
  const argv = process.argv.slice(2);
  const src = argv[0] || path.join(__dirname, 'seed.json');
  if(!fs.existsSync(src)){
    console.error('Seed file not found:', src);
    process.exit(1);
  }
  const seed = loadJsonSync(src);

  const modeEnv = (process.env.MODE || 'auto').toLowerCase();
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_URL);
  let useDirect = false;
  if(modeEnv === 'direct') useDirect = true;
  else if(modeEnv === 'api') useDirect = false;
  else useDirect = hasServiceRole; // auto: prefer direct if keys present

  console.log('Seeder mode:', useDirect ? 'direct (tables)' : 'api (endpoints)');

  try{
    if(useDirect){
      await runDirectSeeder(seed);
      // After direct seed, optionally also call API seeder to ensure any derived endpoints reflect data
      console.log('Optionally run the API seeder to exercise endpoints (not required).');
    } else {
      await runApiSeeder(seed, { apiBase: process.env.API_BASE });
    }
    console.log('Seeding finished successfully.');
  }catch(err){
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

if(require.main === module) main();
