const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const fetch = global.fetch || require('node-fetch');

const PORT = process.env.PORT || 8787;
const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.join(__dirname, 'state.json');
const COMMENTS_DATA_PATH = process.env.COMMENTS_DATA_PATH
  ? path.resolve(process.env.COMMENTS_DATA_PATH)
  : path.join(path.dirname(DATA_PATH), 'comments.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || 'oracle_state';
const SUPABASE_ROW_ID = process.env.SUPABASE_ROW_ID || 'shared';
const SUPABASE_STORAGE_MODE = (process.env.SUPABASE_STORAGE_MODE || 'json').toLowerCase();

const ROSTER_META_HIDDEN_SENTINEL = '__hidden__::';
let supabaseMetaSupportsHidden = true;

const SUPABASE_SESSIONS_TABLE = process.env.SUPABASE_SESSIONS_TABLE || 'sessions';
const SUPABASE_SESSION_PLAYERS_TABLE = process.env.SUPABASE_SESSION_PLAYERS_TABLE || 'session_players';
const SUPABASE_ROSTER_EXTRAS_TABLE = process.env.SUPABASE_ROSTER_EXTRAS_TABLE || 'roster_extras';
const SUPABASE_ROSTER_META_TABLE = process.env.SUPABASE_ROSTER_META_TABLE || 'roster_meta';
const SUPABASE_AVAILABILITY_TABLE = process.env.SUPABASE_AVAILABILITY_TABLE || 'availability';
const SUPABASE_BUILD_CARDS_TABLE = process.env.SUPABASE_BUILD_CARDS_TABLE || 'build_cards';
const SUPABASE_COMMENTS_TABLE = process.env.SUPABASE_COMMENTS_TABLE || 'comments';

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const useSupabaseTables = hasSupabase && SUPABASE_STORAGE_MODE === 'tables';

const SUPABASE_REST_BASE = hasSupabase
  ? `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`
  : null;
const SUPABASE_REST_URL = hasSupabase
  ? `${SUPABASE_REST_BASE}/${SUPABASE_TABLE}`
  : null;

const GUEST_PLAYER_KEY = 'guest';

const AVAIL_DATES = [
  '2025-12-21','2025-12-22','2025-12-23',
  '2025-12-26','2025-12-27','2025-12-28','2025-12-29',
  '2026-01-01'
];

const DEFAULT_SESSIONS = [
  {id:'s1', date:'2025-12-21', title:'Session 01', dm:'Kaela & Tory', capacity:6, players:[]},
  {id:'s2', date:'2025-12-22', title:'Session 02', dm:'Kaela & Tory', capacity:6, players:[]},
  {id:'s3', date:'2025-12-26', title:'Session 03', dm:'Kaela & Tory', capacity:6, players:[]},
  {id:'s4', date:'2025-12-27', title:'Session 04', dm:'Kaela & Tory', capacity:6, players:[]},
  {id:'s5', date:'2025-12-28', title:'Session 05', dm:'Kaela & Tory', capacity:6, players:[]},
  {id:'s6', date:'2025-12-29', title:'Session 06', dm:'Kaela & Tory', capacity:6, players:[]},
  {id:'finale', date:'2026-01-01', title:'Grand Finale', dm:'Kaela & Tory', capacity:8, players:[], finale:true}
];

const DEFAULT_STATE = {
  sessions: DEFAULT_SESSIONS,
  rosterExtras: [],
  rosterMeta: {},
  availability: {},
  buildCards: {}
};

const app = express();
app.use(cors());
app.use(express.json());

function sanitizeName(value){
  return String(value ?? '').trim();
}

function sanitizeOptional(value){
  const trimmed = String(value ?? '').trim();
  return trimmed || '';
}

function rosterKey(name){
  return sanitizeName(name).toLowerCase();
}

function isGuestKey(value){
  return rosterKey(value) === GUEST_PLAYER_KEY;
}

function assertNotGuestKey(key){
  if(isGuestKey(key)){
    throw httpError(403, 'Guest sessions are read-only. Use your personal access code to make changes.');
  }
}

function decodeRosterMeta(status, notes, hiddenFlag){
  const cleanStatus = sanitizeOptional(status);
  let cleanNotes = sanitizeOptional(notes);
  let hidden = Boolean(hiddenFlag);
  if(!hidden && cleanNotes && cleanNotes.startsWith(ROSTER_META_HIDDEN_SENTINEL)){
    hidden = true;
    cleanNotes = cleanNotes.slice(ROSTER_META_HIDDEN_SENTINEL.length);
  }
  return { status: cleanStatus, notes: cleanNotes, hidden };
}

function encodeRosterMeta(status, notes, hiddenFlag){
  const cleanStatus = sanitizeOptional(status) || null;
  let cleanNotes = sanitizeOptional(notes) || '';
  const hidden = Boolean(hiddenFlag);
  if(!supabaseMetaSupportsHidden){
    if(cleanNotes.startsWith(ROSTER_META_HIDDEN_SENTINEL)){
      cleanNotes = cleanNotes.slice(ROSTER_META_HIDDEN_SENTINEL.length);
    }
    if(hidden){
      cleanNotes = `${ROSTER_META_HIDDEN_SENTINEL}${cleanNotes}`;
    }
    return { status: cleanStatus, notes: cleanNotes || null };
  }
  return {
    status: cleanStatus,
    notes: cleanNotes || null,
    hidden: hidden ? true : false
  };
}

function normalisePlayer(entry){
  if(!entry){
    return null;
  }
  if(typeof entry === 'string'){
    const character = sanitizeName(entry);
    if(!character){
      return null;
    }
    return { key: rosterKey(entry), character };
  }
  if(typeof entry !== 'object'){
    return null;
  }
  const character = sanitizeName(entry.character || entry.characterName || entry.name || entry.player_name || '');
  const keySource = entry.key || entry.playerKey || entry.player_key || entry.code || entry.id || character;
  const key = rosterKey(keySource);
  if(!key && !character){
    return null;
  }
  const playerName = sanitizeName(entry.playerName || entry.player_name || entry.displayName || '');
  return {
    key: key || rosterKey(character),
    character: character || playerName || key || '',
    playerName
  };
}

function normaliseSession(session){
  if(!session || typeof session !== 'object') return null;
  const id = sanitizeOptional(session.id);
  if(!id) return null;
  const base = DEFAULT_SESSIONS.find(s => s.id === id);
  const title = sanitizeOptional(session.title) || (base ? base.title : `Session ${id}`);
  const dm = sanitizeOptional(session.dm || (base && base.dm));
  const date = sanitizeOptional(session.date || (base && base.date));
  const capacity = Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : (base ? base.capacity : 0);
  const players = Array.isArray(session.players)
    ? session.players.map(normalisePlayer).filter(Boolean)
    : [];
  return {
    id,
    title,
    dm,
    date,
    capacity,
    finale: Boolean(session.finale || (base && base.finale)),
    players
  };
}

function normaliseState(state){
  const sessions = [];
  const sessionMap = new Map(DEFAULT_SESSIONS.map(s => [s.id, {...s, players: []}]));

  if(state && Array.isArray(state.sessions)){
    state.sessions.forEach((session)=>{
      const clean = normaliseSession(session);
      if(!clean) return;
      const base = sessionMap.get(clean.id) || { ...clean, players: [] };
      base.players = clean.players;
      base.capacity = clean.capacity;
      base.title = clean.title;
      base.dm = clean.dm;
      base.date = clean.date;
      base.finale = clean.finale;
      sessions.push(base);
      sessionMap.delete(clean.id);
    });
  }

  sessionMap.forEach((value)=>{
    const players = Array.isArray(value.players)
      ? value.players.map((player)=>({ ...player }))
      : [];
    sessions.push({ ...value, players });
  });

  sessions.sort((a,b)=>a.date.localeCompare(b.date));

  const rosterExtras = Array.isArray(state?.rosterExtras)
    ? state.rosterExtras.map((item)=>{
        if(!item || typeof item !== 'object') return null;
        const name = sanitizeName(item.name);
        if(!name) return null;
        const key = rosterKey(item.key || name);
        if(!key) return null;
        return {
          key,
          name,
          status: sanitizeOptional(item.status),
          notes: sanitizeOptional(item.notes),
          custom: true
        };
      }).filter(Boolean)
    : [];

  const rosterMeta = {};
  if(state && typeof state.rosterMeta === 'object'){
    Object.entries(state.rosterMeta).forEach(([rawKey, value])=>{
      const key = rosterKey(rawKey);
      if(!key || !value || typeof value !== 'object') return;
      const { status, notes, hidden } = decodeRosterMeta(value.status, value.notes, value.hidden);
      if(status || notes || hidden){
        rosterMeta[key] = { status, notes, hidden };
      }
    });
  }

  const availability = {};
  if(state && typeof state.availability === 'object'){
    Object.entries(state.availability).forEach(([rawKey, dates])=>{
      const key = rosterKey(rawKey);
      if(!key || !dates || typeof dates !== 'object') return;
      const row = {};
      Object.entries(dates).forEach(([date, value])=>{
        if(AVAIL_DATES.includes(date)){
          row[date] = Boolean(value);
        }
      });
      availability[key] = row;
    });
  }

  const buildCards = {};
  if(state && typeof state.buildCards === 'object'){
    Object.entries(state.buildCards).forEach(([rawKey, card])=>{
      const key = rosterKey(rawKey);
      if(!key || !card || typeof card !== 'object') return;
      const entry = {};
      if(card.class) entry.class = sanitizeOptional(card.class);
      if(card.university) entry.university = sanitizeOptional(card.university);
      if(card.characterName || card.character_name || card.name){
        entry.characterName = sanitizeName(card.characterName || card.character_name || card.name);
      }
      buildCards[key] = entry;
    });
  }

  return {
    sessions,
    rosterExtras,
    rosterMeta,
    availability,
    buildCards
  };
}

async function loadState(){
  if(useSupabaseTables){
    return loadStateFromSupabaseTables();
  }
  if(hasSupabase){
    return loadStateFromSupabase();
  }
  return loadStateFromFile();
}

async function saveState(state, context) {
  const normalised = normaliseState(state);

  if (useSupabaseTables) {
    return saveStateToSupabaseTables(normalised, context);
  }

  if (hasSupabase) {
    await saveStateToSupabase(normalised);
  } else {
    await fs.writeFile(DATA_PATH, JSON.stringify(normalised, null, 2));
  }

  return normalised;
}

async function loadStateFromFile(){
  try{
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return normaliseState(parsed);
  }catch(err){
    if(err && err.code === 'ENOENT'){
      const initial = normaliseState(DEFAULT_STATE);
      await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    throw err;
  }
}

function supabaseHeaders(extra){
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: 'application/json',
    ...(extra || {})
  };
}

async function supabaseQuery(path, { fallback } = {}){
  if(!SUPABASE_REST_BASE){
    return Array.isArray(fallback) ? fallback : [];
  }
  const url = `${SUPABASE_REST_BASE}/${path}`;
  const res = await fetch(url, {
    headers: supabaseHeaders()
  });
  if(res.status === 404){
    if(fallback !== undefined){
      return fallback;
    }
    return [];
  }
  if(!res.ok){
    const body = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${body}`);
  }
  const text = await res.text();
  if(!text){
    return [];
  }
  try{
    return JSON.parse(text);
  }catch(err){
    console.warn('Supabase query parse warning:', err);
    return [];
  }
}

async function supabaseMutate(path, options = {}){
  if(!SUPABASE_REST_BASE){
    return null;
  }
  const {
    method = 'POST',
    body,
    headers,
    ignoreConflict = false,
    expectJson = false
  } = options;

  const requestHeaders = supabaseHeaders(headers);
  const hasBody = body !== undefined && body !== null;
  const url = `${SUPABASE_REST_BASE}/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...requestHeaders,
      ...(hasBody && !requestHeaders['Content-Type'] ? { 'Content-Type': 'application/json' } : {})
    },
    body: hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
  });

  if(res.status === 409 && ignoreConflict){
    return null;
  }

  if(!res.ok && res.status !== 204){
    const text = await res.text();
    throw new Error(`Supabase mutation failed (${res.status}): ${text}`);
  }

  if(expectJson){
    const text = await res.text();
    if(!text){
      return null;
    }
    try{
      return JSON.parse(text);
    }catch(err){
      console.warn('Supabase mutation parse warning:', err);
      return null;
    }
  }

  return null;
}

function normaliseComment(row){
  if(!row || typeof row !== 'object'){
    return null;
  }

  const commentText = sanitizeOptional(row.comment ?? row.text);
  if(!commentText){
    return null;
  }

  const createdAtSource = row.created_at || row.createdAt || row.stamp;
  let createdAt = sanitizeOptional(createdAtSource);
  if(createdAt){
    const date = new Date(createdAt);
    createdAt = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }else{
    createdAt = new Date().toISOString();
  }

  const mapped = {
    id: sanitizeOptional(row.id) || sanitizeOptional(row.comment_id) || randomUUID(),
    playerName: sanitizeOptional(row.player_name ?? row.playerName),
    characterName: sanitizeOptional(row.character_name ?? row.characterName),
    sessionId: sanitizeOptional(row.session_id ?? row.sessionId),
    comment: commentText,
    createdAt
  };

  return mapped;
}

async function loadCommentsFromFile(){
  try{
    const raw = await fs.readFile(COMMENTS_DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map(normaliseComment).filter(Boolean);
  }catch(err){
    if(err && err.code === 'ENOENT'){
      return [];
    }
    throw err;
  }
}

async function writeCommentsToFile(list){
  const safeList = Array.isArray(list) ? list : [];
  try{
    await fs.mkdir(path.dirname(COMMENTS_DATA_PATH), { recursive: true });
  }catch{}
  await fs.writeFile(COMMENTS_DATA_PATH, JSON.stringify(safeList, null, 2));
  return safeList;
}

function sortCommentsDesc(list){
  return list.slice().sort((a, b)=>{
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

async function getComments(){
  if(useSupabaseTables){
    const rows = await supabaseQuery(`${encodeURIComponent(SUPABASE_COMMENTS_TABLE)}?select=id,player_name,character_name,session_id,comment,created_at&order=created_at.desc`, { fallback: [] });
    return sortCommentsDesc(rows.map(normaliseComment).filter(Boolean));
  }

  const list = await loadCommentsFromFile();
  return sortCommentsDesc(list);
}

async function addComment(input){
  const comment = sanitizeOptional(input?.comment);
  if(!comment){
    throw httpError(400, 'Comment text is required.');
  }

  const playerName = sanitizeOptional(input?.playerName);
  const characterName = sanitizeOptional(input?.characterName);
  const sessionId = sanitizeOptional(input?.sessionId);

  if(useSupabaseTables){
    const payload = {
      player_name: playerName || null,
      character_name: characterName || null,
      session_id: sessionId || null,
      comment
    };

    const result = await supabaseMutate(`${encodeURIComponent(SUPABASE_COMMENTS_TABLE)}`, {
      body: payload,
      headers: { Prefer: 'return=representation' },
      expectJson: true
    });

    const rows = Array.isArray(result) ? result : (result ? [result] : []);
    const record = rows[0];
    if(!record){
      throw httpError(500, 'Failed to save comment.');
    }
    return normaliseComment(record);
  }

  const existing = await loadCommentsFromFile();
  const created = {
    id: randomUUID(),
    playerName,
    characterName,
    sessionId,
    comment,
    createdAt: new Date().toISOString()
  };
  existing.push(created);
  await writeCommentsToFile(existing);
  return created;
}

async function removeComment(id){
  const cleanId = sanitizeOptional(id);
  if(!cleanId){
    throw httpError(400, 'Comment id is required.');
  }

  if(useSupabaseTables){
    await supabaseMutate(`${encodeURIComponent(SUPABASE_COMMENTS_TABLE)}?id=eq.${encodeURIComponent(cleanId)}`, {
      method: 'DELETE'
    });
    return true;
  }

  const existing = await loadCommentsFromFile();
  const filtered = existing.filter((entry)=> sanitizeOptional(entry.id) !== cleanId);
  await writeCommentsToFile(filtered);
  return true;
}

async function loadStateFromSupabaseTables(){
  const metaPromise = supabaseMetaSupportsHidden
    ? supabaseQuery(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}?select=player_key,status,notes,hidden`, { fallback: [] })
        .catch(async (err)=>{
          const message = String(err && err.message ? err.message : err || '').toLowerCase();
          if(message.includes('column') && message.includes('hidden')){
            supabaseMetaSupportsHidden = false;
            return supabaseQuery(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}?select=player_key,status,notes`, { fallback: [] });
          }
          throw err;
        })
    : supabaseQuery(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}?select=player_key,status,notes`, { fallback: [] });

  const [sessionRows, playerRows, extrasRows, metaRows, availabilityRows, buildRows] = await Promise.all([
    supabaseQuery(`${encodeURIComponent(SUPABASE_SESSIONS_TABLE)}?select=id,title,dm,date,capacity,finale`),
    supabaseQuery(`${encodeURIComponent(SUPABASE_SESSION_PLAYERS_TABLE)}?select=session_id,player_key,player_name&order=player_name.asc`),
    supabaseQuery(`${encodeURIComponent(SUPABASE_ROSTER_EXTRAS_TABLE)}?select=player_key,name,status,notes&order=name.asc`),
    metaPromise,
    supabaseQuery(`${encodeURIComponent(SUPABASE_AVAILABILITY_TABLE)}?select=player_key,player_name,date,available`),
    supabaseQuery(`${encodeURIComponent(SUPABASE_BUILD_CARDS_TABLE)}?select=player_key,class,university`)
  ]);

  const sessionMap = new Map(DEFAULT_SESSIONS.map((session)=>[
    session.id,
    { ...session, players: Array.isArray(session.players) ? session.players.slice() : [] }
  ]));

  sessionRows.forEach((row)=>{
    const id = sanitizeOptional(row.id);
    if(!id){
      return;
    }
    const base = sessionMap.get(id) || {
      id,
      title: sanitizeOptional(row.title) || `Session ${id}`,
      dm: sanitizeOptional(row.dm),
      date: sanitizeOptional(row.date),
      capacity: Number(row.capacity) || 0,
      finale: Boolean(row.finale),
      players: []
    };
    base.title = sanitizeOptional(row.title) || base.title;
    base.dm = sanitizeOptional(row.dm) || base.dm;
    base.date = sanitizeOptional(row.date) || base.date;
    base.capacity = Number.isFinite(Number(row.capacity)) ? Number(row.capacity) : base.capacity;
    base.finale = row.finale != null ? Boolean(row.finale) : base.finale;
    base.players = Array.isArray(base.players) ? base.players : [];
    sessionMap.set(id, base);
  });

  playerRows.forEach((row)=>{
    const sessionId = sanitizeOptional(row.session_id);
    const name = sanitizeName(row.player_name || row.player_key);
    if(!sessionId || !name){
      return;
    }
    const session = sessionMap.get(sessionId) || {
      id: sessionId,
      title: `Session ${sessionId}`,
      dm: '',
      date: '',
      capacity: 0,
      finale: false,
      players: []
    };
    session.players = Array.isArray(session.players) ? session.players : [];
    if(!session.players.includes(name)){
      session.players.push(name);
    }
    sessionMap.set(sessionId, session);
  });

  const sessions = Array.from(sessionMap.values());
  sessions.sort((a, b) => {
    const dateCompare = sanitizeOptional(a.date).localeCompare(sanitizeOptional(b.date));
    if(dateCompare !== 0){
      return dateCompare;
    }
    return sanitizeOptional(a.id).localeCompare(sanitizeOptional(b.id));
  });

  const rosterExtras = extrasRows.map((row)=>{
    const name = sanitizeName(row.name || row.player_key);
    const key = rosterKey(row.player_key || name);
    if(!name || !key){
      return null;
    }
    return {
      key,
      name,
      status: sanitizeOptional(row.status),
      notes: sanitizeOptional(row.notes),
      custom: true
    };
  }).filter(Boolean);

  const rosterMeta = {};
  metaRows.forEach((row)=>{
    const key = rosterKey(row.player_key || row.name || '');
    if(!key){
      return;
    }
    const { status, notes, hidden } = decodeRosterMeta(row.status, row.notes, row.hidden);
    if(status || notes || hidden){
      rosterMeta[key] = { status, notes, hidden };
    }
  });

  const availability = {};
  availabilityRows.forEach((row)=>{
    if(row.available === false){
      return;
    }
    const key = rosterKey(row.player_key || row.player_name);
    const date = sanitizeOptional(row.date);
    if(!key || !AVAIL_DATES.includes(date)){
      return;
    }
    availability[key] = availability[key] || {};
    availability[key][date] = true;
  });

  const buildCards = {};
  buildRows.forEach((row)=>{
    const key = rosterKey(row.player_key);
    if(!key){
      return;
    }
    const entry = {};
    const klass = sanitizeOptional(row.class);
    const university = sanitizeOptional(row.university);
    const characterName = sanitizeName(row.character_name || '');
    if(klass){
      entry.class = klass;
    }
    if(university){
      entry.university = university;
    }
    if(characterName){
      entry.characterName = characterName;
    }
    if(Object.keys(entry).length > 0){
      buildCards[key] = entry;
    }
  });

  return normaliseState({
    sessions,
    rosterExtras,
    rosterMeta,
    availability,
    buildCards
  });
}

async function saveStateToSupabaseTables(state, context = {}){
  const action = context && context.action;
  if(!action){
    await replaceSupabaseTablesState(state);
    return loadStateFromSupabaseTables();
  }

  try{
    switch(action){
      case 'joinSession': {
        const sessionId = sanitizeOptional(context.sessionId);
        const key = rosterKey(context.playerKey || context.buildKey || context.playerName);
        if(!sessionId || !key){
          await replaceSupabaseTablesState(state);
          break;
        }
        const session = state.sessions.find(s => sanitizeOptional(s.id) === sessionId);
        if(session){
          await supabaseMutate(`${encodeURIComponent(SUPABASE_SESSIONS_TABLE)}?id=eq.${encodeURIComponent(sessionId)}`, {
            method: 'PATCH',
            body: {
              title: sanitizeOptional(session.title) || null,
              dm: sanitizeOptional(session.dm) || null,
              date: sanitizeOptional(session.date) || null,
              capacity: Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : null,
              finale: session.finale != null ? Boolean(session.finale) : null
            }
          });
        }
        await supabaseMutate(`${encodeURIComponent(SUPABASE_SESSION_PLAYERS_TABLE)}`, {
          body: [{
            session_id: sessionId,
            player_key: key,
            player_name: sanitizeName(context.characterName || context.playerName)
          }],
          headers: { Prefer: 'resolution=ignore-duplicates' }
        });
        await supabaseMutate(`${encodeURIComponent(SUPABASE_BUILD_CARDS_TABLE)}`, {
          body: [{
            player_key: key,
            class: context.build?.class ? sanitizeOptional(context.build.class) : null,
            university: context.build?.university ? sanitizeOptional(context.build.university) : null,
            character_name: context.characterName ? sanitizeName(context.characterName) : null
          }],
          headers: { Prefer: 'resolution=merge-duplicates' }
        });
        break;
      }
      case 'leaveSession': {
        const sessionId = sanitizeOptional(context.sessionId);
        const key = rosterKey(context.playerKey || context.buildKey || context.playerName);
        if(sessionId && key){
          const filters = [`session_id=eq.${encodeURIComponent(sessionId)}`, `player_key=eq.${encodeURIComponent(key)}`].join('&');
          await supabaseMutate(`${encodeURIComponent(SUPABASE_SESSION_PLAYERS_TABLE)}?${filters}`, {
            method: 'DELETE'
          });
          if(context.removeBuildCard){
            await supabaseMutate(`${encodeURIComponent(SUPABASE_BUILD_CARDS_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
              method: 'DELETE'
            });
          }
        } else {
          await replaceSupabaseTablesState(state);
        }
        break;
      }
      case 'setAvailability': {
        const key = rosterKey(context.availabilityKey || context.playerKey || context.playerName);
        if(!key){
          await replaceSupabaseTablesState(state);
          break;
        }
        if(context.available){
          await supabaseMutate(`${encodeURIComponent(SUPABASE_AVAILABILITY_TABLE)}`, {
            body: [{
              player_key: key,
              player_name: sanitizeName(context.playerName),
              date: sanitizeOptional(context.date),
              available: true
            }],
            headers: { Prefer: 'resolution=merge-duplicates' }
          });
        }else{
          const filters = [`player_key=eq.${encodeURIComponent(key)}`, `date=eq.${encodeURIComponent(sanitizeOptional(context.date))}`].join('&');
          await supabaseMutate(`${encodeURIComponent(SUPABASE_AVAILABILITY_TABLE)}?${filters}`, {
            method: 'DELETE'
          });
        }
        break;
      }
      case 'addRosterExtra': {
        const key = rosterKey(context.rosterKey || context.name);
        if(!key){
          await replaceSupabaseTablesState(state);
          break;
        }
        await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_EXTRAS_TABLE)}`, {
          body: [{
            player_key: key,
            name: sanitizeName(context.name),
            status: sanitizeOptional(context.status) || null,
            notes: sanitizeOptional(context.notes) || null
          }],
          headers: { Prefer: 'resolution=merge-duplicates' }
        });
        if(context.status || context.notes || context.hidden){
          const metaPayload = encodeRosterMeta(context.status, context.notes, context.hidden);
          await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}`, {
            body: [{
              player_key: key,
              ...metaPayload
            }],
            headers: { Prefer: 'resolution=merge-duplicates' }
          });
        }
        break;
      }
      case 'updateRoster': {
        const key = rosterKey(context.rosterKey || context.name);
        if(!key){
          await replaceSupabaseTablesState(state);
          break;
        }
        const metaPayload = encodeRosterMeta(context.status, context.notes, context.hidden);
        if(context.status || context.notes){
          await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}`, {
            body: [{
              player_key: key,
              ...metaPayload
            }],
            headers: { Prefer: 'resolution=merge-duplicates' }
          });
        }else{
          await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
            method: 'DELETE'
          });
        }

        if(context.custom){
          await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_EXTRAS_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
            method: 'PATCH',
            body: {
              status: sanitizeOptional(context.status) || null,
              notes: sanitizeOptional(context.notes) || null
            }
          });
        }
        if(context.hidden){
          await supabaseMutate(`${encodeURIComponent(SUPABASE_AVAILABILITY_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
            method: 'DELETE'
          });
        }
        break;
      }
      case 'removeRosterExtra': {
        const key = rosterKey(context.rosterKey || context.name);
        if(!key){
          await replaceSupabaseTablesState(state);
          break;
        }
        await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_EXTRAS_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
          method: 'DELETE'
        });
        await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
          method: 'DELETE'
        });
        const availabilityKey = sanitizeName(context.availabilityKey || context.name || context.rosterKey || '');
        if(availabilityKey){
          await supabaseMutate(`${encodeURIComponent(SUPABASE_AVAILABILITY_TABLE)}?player_key=eq.${encodeURIComponent(availabilityKey)}`, {
            method: 'DELETE'
          });
        }
        break;
      }
      default:
        await replaceSupabaseTablesState(state);
    }
  }catch(err){
    console.error('Supabase tables update failed', err);
    throw err;
  }

  return loadStateFromSupabaseTables();
}

async function replaceSupabaseTablesState(state){
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  await supabaseMutate(`${encodeURIComponent(SUPABASE_SESSIONS_TABLE)}?id=not.is.null`, {
    method: 'DELETE'
  });
  if(sessions.length > 0){
    const sessionRows = sessions.map((session)=>({
      id: sanitizeOptional(session.id),
      title: sanitizeOptional(session.title) || null,
      dm: sanitizeOptional(session.dm) || null,
      date: sanitizeOptional(session.date) || null,
      capacity: Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : null,
      finale: session.finale != null ? Boolean(session.finale) : null
    }));
    await supabaseMutate(`${encodeURIComponent(SUPABASE_SESSIONS_TABLE)}`, {
      body: sessionRows,
      headers: { Prefer: 'resolution=merge-duplicates' }
    });
  }

  for(const session of sessions){
    const sessionId = sanitizeOptional(session.id);
    if(!sessionId){
      continue;
    }
    await supabaseMutate(`${encodeURIComponent(SUPABASE_SESSION_PLAYERS_TABLE)}?session_id=eq.${encodeURIComponent(sessionId)}`, {
      method: 'DELETE'
    });
    if(Array.isArray(session.players) && session.players.length){
      const rows = session.players.map((player)=>({
        session_id: sessionId,
        player_key: rosterKey(player && (player.key || player.character || player.name)),
        player_name: sanitizeName(player && (player.character || player.name || player.playerName || ''))
      })).filter(row => row.player_key);
      await supabaseMutate(`${encodeURIComponent(SUPABASE_SESSION_PLAYERS_TABLE)}`, {
        body: rows,
        headers: { Prefer: 'resolution=ignore-duplicates' }
      });
    }
  }

  await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_EXTRAS_TABLE)}?player_key=not.is.null`, {
    method: 'DELETE'
  });
  const extrasRows = Array.isArray(state.rosterExtras)
    ? state.rosterExtras.map((item)=>({
        player_key: rosterKey(item.key || item.name),
        name: sanitizeName(item.name),
        status: sanitizeOptional(item.status) || null,
        notes: sanitizeOptional(item.notes) || null
      }))
    : [];
  if(extrasRows.length){
    await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_EXTRAS_TABLE)}`, {
      body: extrasRows,
      headers: { Prefer: 'resolution=merge-duplicates' }
    });
  }

  await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}?player_key=not.is.null`, {
    method: 'DELETE'
  });
  const metaRows = state.rosterMeta && typeof state.rosterMeta === 'object'
    ? Object.entries(state.rosterMeta).map(([rawKey, value])=>({
        player_key: rosterKey(rawKey),
        ...encodeRosterMeta(value && value.status, value && value.notes, value && value.hidden)
      }))
    : [];
  if(metaRows.length){
    await supabaseMutate(`${encodeURIComponent(SUPABASE_ROSTER_META_TABLE)}`, {
      body: metaRows,
      headers: { Prefer: 'resolution=merge-duplicates' }
    });
  }

  await supabaseMutate(`${encodeURIComponent(SUPABASE_AVAILABILITY_TABLE)}?player_key=not.is.null`, {
    method: 'DELETE'
  });
  const availabilityRows = [];
  if(state.availability && typeof state.availability === 'object'){
    Object.entries(state.availability).forEach(([rawKey, dates])=>{
      const key = rosterKey(rawKey);
      if(!key || !dates || typeof dates !== 'object'){
        return;
      }
      Object.entries(dates).forEach(([date, value])=>{
        if(value && AVAIL_DATES.includes(date)){
          availabilityRows.push({
            player_key: key,
            player_name: sanitizeName(rawKey),
            date: sanitizeOptional(date),
            available: true
          });
        }
      });
    });
  }
  if(availabilityRows.length){
    await supabaseMutate(`${encodeURIComponent(SUPABASE_AVAILABILITY_TABLE)}`, {
      body: availabilityRows,
      headers: { Prefer: 'resolution=merge-duplicates' }
    });
  }

  await supabaseMutate(`${encodeURIComponent(SUPABASE_BUILD_CARDS_TABLE)}?player_key=not.is.null`, {
    method: 'DELETE'
  });
  const buildRows = state.buildCards && typeof state.buildCards === 'object'
    ? Object.entries(state.buildCards).map(([rawKey, card])=>({
        player_key: rosterKey(rawKey),
        class: card && card.class ? sanitizeOptional(card.class) : null,
        university: card && card.university ? sanitizeOptional(card.university) : null,
        character_name: card && card.characterName ? sanitizeName(card.characterName) : null
      }))
    : [];
  if(buildRows.length){
    await supabaseMutate(`${encodeURIComponent(SUPABASE_BUILD_CARDS_TABLE)}`, {
      body: buildRows,
      headers: { Prefer: 'resolution=merge-duplicates' }
    });
  }
}

async function loadStateFromSupabase(){
  const url = `${SUPABASE_REST_URL}?id=eq.${encodeURIComponent(SUPABASE_ROW_ID)}&select=state`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json'
    }
  });

  if(res.status === 404){
    const initial = normaliseState(DEFAULT_STATE);
    await insertStateToSupabase(initial);
    return initial;
  }

  if(!res.ok){
    const body = await res.text();
    throw new Error(`Supabase select failed (${res.status}): ${body}`);
  }

  const rows = await res.json();
  const record = Array.isArray(rows) ? rows[0] : null;

  if(!record || !record.state){
    const initial = normaliseState(DEFAULT_STATE);
    await insertStateToSupabase(initial);
    return initial;
  }

  return normaliseState(record.state);
}

async function saveStateToSupabase(state){
  await insertStateToSupabase(state);
}

async function insertStateToSupabase(state){
  if(!SUPABASE_REST_URL){
    return;
  }

  const payload = {
    id: SUPABASE_ROW_ID,
    state,
    updated_at: new Date().toISOString()
  };

  const res = await fetch(SUPABASE_REST_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });

  if(!res.ok){
    const body = await res.text();
    throw new Error(`Supabase insert failed (${res.status}): ${body}`);
  }
}

function httpError(status, message){
  const err = new Error(message);
  err.status = status;
  return err;
}

function handleError(res, err){
  const status = err.status || 500;
  const message = err.message || 'Unexpected error';
  res.status(status).json({ error: message });
}

app.get('/api/comments', async (req, res) => {
  try{
    const comments = await getComments();
    res.json({ comments });
  }catch(err){
    console.error('fetch comments failed', err);
    handleError(res, err);
  }
});

app.post('/api/comments', async (req, res) => {
  try{
    const created = await addComment(req.body || {});
    res.status(201).json({ comment: created });
  }catch(err){
    console.error('create comment failed', err);
    handleError(res, err);
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try{
    await removeComment(req.params.id);
    res.status(204).end();
  }catch(err){
    console.error('delete comment failed', err);
    handleError(res, err);
  }
});

app.get('/api/state', async (req, res) => {
  try{
    const state = await loadState();
    res.json({ state });
  }catch(err){
    console.error('state fetch failed', err);
    handleError(res, err);
  }
});

app.post('/api/sessions/:id/join', async (req, res) => {
  const sessionId = sanitizeOptional(req.params.id);
  const characterName = sanitizeName(req.body?.characterName || req.body?.name);
  const playerKey = rosterKey(req.body?.playerKey || req.body?.player_key || characterName);
  const playerName = sanitizeName(req.body?.playerName);
  const build = req.body?.build || {};
  const klass = sanitizeOptional(build.class);
  const university = sanitizeOptional(build.university);

  if(!sessionId){
    return handleError(res, httpError(400, 'Session id is required.'));
  }
  if(!characterName){
    return handleError(res, httpError(400, 'Character name is required.'));
  }
  if(!playerKey){
    return handleError(res, httpError(400, 'Access code is required.'));
  }
  assertNotGuestKey(playerKey);

  try{
    const state = await loadState();
    const session = state.sessions.find(s => s.id === sessionId);
    if(!session){
      throw httpError(404, 'Session not found.');
    }
    session.players = Array.isArray(session.players) ? session.players : [];
    const existingPlayer = Array.isArray(session.players)
      ? session.players.find(player => rosterKey(player && player.key) === playerKey)
      : null;
    if(existingPlayer){
      throw httpError(409, `${characterName} is already signed up for this session.`);
    }
    if(session.players.length >= session.capacity){
      throw httpError(409, 'This session is already at capacity.');
    }
    if(university){
      for(const player of session.players){
        const key = rosterKey(player && (player.key || player.character));
        const existing = key ? state.buildCards[key] : null;
        if(existing && existing.university && existing.university === university){
          throw httpError(409, `Another ${university} student is already in this session.`);
        }
      }
    }

    session.players = session.players.concat([{ key: playerKey, character: characterName, playerName }]);
    state.buildCards[playerKey] = {
      class: klass,
      university,
      characterName
    };

    const updated = await saveState(state, {
      action: 'joinSession',
      sessionId,
      playerName: playerName || characterName,
      playerKey,
      buildKey: playerKey,
      characterName,
      build: { class: klass, university }
    });
    res.json({ state: updated });
  }catch(err){
    console.error('join failed', err);
    handleError(res, err);
  }
});

app.post('/api/sessions/:id/leave', async (req, res) => {
  const sessionId = sanitizeOptional(req.params.id);
  const characterName = sanitizeName(req.body?.characterName || req.body?.name);
  const playerKey = rosterKey(req.body?.playerKey || req.body?.player_key || req.body?.name);
  if(!sessionId){
    return handleError(res, httpError(400, 'Session id is required.'));
  }
  if(!playerKey){
    return handleError(res, httpError(400, 'Access code is required.'));
  }
  assertNotGuestKey(playerKey);
  try{
    const state = await loadState();
    const session = state.sessions.find(s => s.id === sessionId);
    if(!session){
      throw httpError(404, 'Session not found.');
    }
    session.players = session.players.filter(player => rosterKey(player && player.key) !== playerKey);
    const stillSignedUp = state.sessions.some((sess)=>{
      return Array.isArray(sess.players) && sess.players.some(p => rosterKey(p && p.key) === playerKey);
    });
    const removeBuildCard = !stillSignedUp && Boolean(state.buildCards[playerKey]);
    if(removeBuildCard){
      delete state.buildCards[playerKey];
    }
    const updated = await saveState(state, {
      action: 'leaveSession',
      sessionId,
      playerName: characterName || playerKey,
      playerKey,
      buildKey: playerKey,
      removeBuildCard
    });
    res.json({ state: updated });
  }catch(err){
    console.error('leave failed', err);
    handleError(res, err);
  }
});

app.post('/api/availability', async (req, res) => {
  const playerKey = rosterKey(req.body?.playerKey || req.body?.key || req.body?.name);
  const playerName = sanitizeName(req.body?.playerName || req.body?.name);
  const date = sanitizeOptional(req.body?.date);
  const available = Boolean(req.body?.available);

  if(!playerKey){
    return handleError(res, httpError(400, 'Access code is required.'));
  }
  assertNotGuestKey(playerKey);
  if(!AVAIL_DATES.includes(date)){
    return handleError(res, httpError(400, 'Date is not in the availability schedule.'));
  }

  try{
    const state = await loadState();
    const key = playerKey;
    state.availability[key] = state.availability[key] || {};
    if(available){
      state.availability[key][date] = true;
    }else{
      delete state.availability[key][date];
      if(Object.keys(state.availability[key]).length === 0){
        delete state.availability[key];
      }
    }
    const updated = await saveState(state, {
      action: 'setAvailability',
      playerName,
      playerKey,
      availabilityKey: key,
      date,
      available
    });
    res.json({ state: updated });
  }catch(err){
    console.error('availability failed', err);
    handleError(res, err);
  }
});

app.post('/api/roster/extras', async (req, res) => {
  const name = sanitizeName(req.body?.name);
  const status = sanitizeOptional(req.body?.status);
  const notes = sanitizeOptional(req.body?.notes);
  if(!name){
    return handleError(res, httpError(400, 'Name is required.'));
  }
  const key = rosterKey(name);
  try{
    const state = await loadState();
    if(state.rosterExtras.some(entry => entry.key === key)){
      throw httpError(409, `${name} is already listed as a roster extra.`);
    }
    state.rosterExtras.push({ key, name, status, notes, custom: true });
    if(status || notes){
      state.rosterMeta[key] = { status, notes };
    }
    const updated = await saveState(state, {
      action: 'addRosterExtra',
      rosterKey: key,
      name,
      status,
      notes
    });
    res.json({ state: updated });
  }catch(err){
    console.error('add roster extra failed', err);
    handleError(res, err);
  }
});

app.patch('/api/roster/:key', async (req, res) => {
  const key = rosterKey(req.params.key);
  const status = sanitizeOptional(req.body?.status);
  const notes = sanitizeOptional(req.body?.notes);
  const hidden = Boolean(req.body?.hidden);
  const custom = Boolean(req.body?.custom);
  if(!key){
    return handleError(res, httpError(400, 'Roster key is required.'));
  }
  try{
    const state = await loadState();
    if(status || notes || hidden){
      state.rosterMeta[key] = { status, notes, hidden };
    }else{
      delete state.rosterMeta[key];
    }
    let extraName;
    if(custom){
      const idx = state.rosterExtras.findIndex(entry => entry.key === key);
      if(idx >= 0){
        extraName = state.rosterExtras[idx].name;
        state.rosterExtras[idx] = {
          ...state.rosterExtras[idx],
          status,
          notes,
          hidden
        };
      }
    }
    if(hidden){
      delete state.availability[key];
    }
    const updated = await saveState(state, {
      action: 'updateRoster',
      rosterKey: key,
      status,
      notes,
      hidden,
      custom,
      name: extraName
    });
    res.json({ state: updated });
  }catch(err){
    console.error('update roster failed', err);
    handleError(res, err);
  }
});

app.delete('/api/roster/extras/:key', async (req, res) => {
  const key = rosterKey(req.params.key);
  if(!key){
    return handleError(res, httpError(400, 'Roster key is required.'));
  }
  try{
    const state = await loadState();
    const existing = state.rosterExtras.find(entry => entry.key === key);
    const availabilityKey = existing ? existing.key : key;
    state.rosterExtras = state.rosterExtras.filter(entry => entry.key !== key);
    if(state.rosterMeta[key]){
      delete state.rosterMeta[key];
    }
    delete state.availability[key];
    if(availabilityKey && availabilityKey !== key){
      delete state.availability[availabilityKey];
    }
    const updated = await saveState(state, {
      action: 'removeRosterExtra',
      rosterKey: key,
      availabilityKey
    });
    res.json({ state: updated });
  }catch(err){
    console.error('remove roster failed', err);
    handleError(res, err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if(require.main === module){
  app.listen(PORT, () => {
    console.log(`Oracle Tournament API listening on port ${PORT}`);
  });
}

module.exports = app;
module.exports.DEFAULT_STATE = DEFAULT_STATE;
module.exports.normaliseState = normaliseState;
module.exports.replaceSupabaseTablesState = replaceSupabaseTablesState;
