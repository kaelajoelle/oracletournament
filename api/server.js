const path = require('path');

const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const fsSync = require('fs');
const { randomUUID, createHash } = require('crypto');

const { createStorageAdapter } = require('./storage');
const { saveOracleBuild, loadOracleBuild, extractBuildFields } = require('./oracleBuilds');
const { createClient } = require('@supabase/supabase-js');

const {
  PORT,
  DATA_PATH,
  COMMENTS_DATA_PATH,
  CHARACTER_DRAFTS_PATH,
  BUILDS_DATA_PATH,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
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
  PLAYER_ACCESS_ADMIN_TOKEN,
  hasSupabase,
  useSupabaseTables,
  canUsePlayerAccess,
  logConfigSummary,
} = require('./config');

const fetch = global.fetch || require('node-fetch');

const ROSTER_META_HIDDEN_SENTINEL = '__hidden__::';
let supabaseMetaSupportsHidden = true;

// Supabase client for build persistence (using oracleBuilds helpers)
const supabaseClient = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const SUPABASE_REST_BASE = hasSupabase
  ? `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`
  : null;
const SUPABASE_REST_URL = hasSupabase
  ? `${SUPABASE_REST_BASE}/${SUPABASE_TABLE}`
  : null;

const GUEST_PLAYER_KEY = 'guest';

/**
 * Loads canonical sessions from state.json at startup.
 * This is the single source of truth for session definitions.
 * Falls back to an empty array if the file is missing or malformed.
 * 
 * Note: Uses synchronous file reading intentionally - this runs once at module
 * initialization when the event loop isn't processing requests yet. The file is
 * small (typically <10KB) and this ensures DEFAULT_SESSIONS is available
 * immediately for storage adapter configuration.
 */
function loadCanonicalSessions() {
  try {
    const raw = fsSync.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sessions)) {
      return parsed.sessions.map(session => {
        if (!session || typeof session !== 'object' || !session.id) return null;
        return {
          id: String(session.id || '').trim(),
          date: String(session.date || '').trim(),
          title: String(session.title || '').trim(),
          theme: String(session.theme || '').trim(),
          focus: String(session.focus || '').trim(),
          setting: String(session.setting || '').trim(),
          premise: String(session.premise || '').trim(),
          dm: String(session.dm || '').trim(),
          capacity: Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : 0,
          finale: Boolean(session.finale),
          players: Array.isArray(session.players) ? session.players : []
        };
      }).filter(Boolean);
    }
  } catch (err) {
    console.error('Failed to load canonical sessions from state.json:', err.message);
  }
  return [];
}

// Canonical sessions loaded from state.json at startup
// This is the single source of truth - no hardcoded session definitions
const DEFAULT_SESSIONS = loadCanonicalSessions();


const DEFAULT_STATE = {
  sessions: DEFAULT_SESSIONS,
  rosterExtras: [],
  rosterMeta: {},
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

function hashAccessCode(value){
  const clean = sanitizeOptional(value).toLowerCase();
  if(!clean){
    return '';
  }
  return createHash('sha256').update(clean).digest('hex');
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

function normalisePlayerAccess(row){
  if(!row || typeof row !== 'object'){
    return null;
  }
  const playerKey = rosterKey(row.player_key || row.playerKey);
  const displayName = sanitizeName(row.display_name || row.displayName || row.name);
  if(!playerKey){
    return null;
  }
  return {
    playerKey,
    displayName,
    lastLoginAt: row.last_login_at || row.lastLoginAt || null,
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null
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
    buildCards
  };
}

function normaliseCharacterDraftData(input){
  if(!input || typeof input !== 'object'){
    return {};
  }
  try{
    return JSON.parse(JSON.stringify(input));
  }catch(err){
    console.warn('Failed to serialise draft payload', err);
    return {};
  }
}

async function readCharacterDraftStore(){
  try{
    const raw = await fs.readFile(CHARACTER_DRAFTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if(parsed && typeof parsed === 'object'){
      const drafts = parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {};
      return { version: 1, drafts };
    }
  }catch(err){
    if(err && err.code === 'ENOENT'){
      return { version: 1, drafts: {} };
    }
    throw err;
  }
  return { version: 1, drafts: {} };
}

async function writeCharacterDraftStore(store){
  const safe = {
    version: 1,
    drafts: store && typeof store.drafts === 'object' ? store.drafts : {}
  };
  await fs.writeFile(CHARACTER_DRAFTS_PATH, JSON.stringify(safe, null, 2));
  return safe;
}

async function getCharacterDraftFromFile(playerKey){
  const store = await readCharacterDraftStore();
  const entry = store.drafts[playerKey];
  if(!entry){
    return null;
  }
  return {
    playerKey,
    data: normaliseCharacterDraftData(entry.data),
    updatedAt: entry.updatedAt || entry.updated_at || null,
    source: 'file'
  };
}

async function saveCharacterDraftToFile(playerKey, draftData){
  const store = await readCharacterDraftStore();
  const data = normaliseCharacterDraftData(draftData);
  const updatedAt = new Date().toISOString();
  store.drafts[playerKey] = {
    data,
    updatedAt
  };
  await writeCharacterDraftStore(store);
  return {
    playerKey,
    data,
    updatedAt,
    source: 'file'
  };
}

async function getCharacterDraftFromSupabase(playerKey){
  if(!hasSupabase){
    return null;
  }
  const table = encodeURIComponent(SUPABASE_CHARACTER_DRAFTS_TABLE);
  const path = `${table}?player_key=eq.${encodeURIComponent(playerKey)}&select=data,updated_at&limit=1`;
  const rows = await supabaseQuery(path, { fallback: [] });
  const row = Array.isArray(rows) ? rows[0] : null;
  if(!row){
    return null;
  }
  return {
    playerKey,
    data: normaliseCharacterDraftData(row.data),
    updatedAt: row.updated_at || row.updatedAt || null,
    source: 'remote'
  };
}

async function saveCharacterDraftToSupabase(playerKey, draftData){
  const table = encodeURIComponent(SUPABASE_CHARACTER_DRAFTS_TABLE);
  const payload = [{ player_key: playerKey, data: normaliseCharacterDraftData(draftData) }];
  const response = await supabaseMutate(table, {
    body: payload,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    expectJson: true
  });
  const row = Array.isArray(response) ? response[0] : null;
  return {
    playerKey,
    data: row && row.data ? normaliseCharacterDraftData(row.data) : payload[0].data,
    updatedAt: (row && (row.updated_at || row.updatedAt)) || new Date().toISOString(),
    source: 'remote'
  };
}

// Reserved for future use
// eslint-disable-next-line no-unused-vars
async function getCharacterDraft(playerKey){
  if(hasSupabase){
    return getCharacterDraftFromSupabase(playerKey);
  }
  return getCharacterDraftFromFile(playerKey);
}

// eslint-disable-next-line no-unused-vars
async function saveCharacterDraft(playerKey, draftData){
  if(hasSupabase){
    return saveCharacterDraftToSupabase(playerKey, draftData);
  }
  return saveCharacterDraftToFile(playerKey, draftData);
}

// === Local Build Store Helpers (fallback when Supabase is not configured) ===

async function readLocalBuildStore(){
  try{
    const raw = await fs.readFile(BUILDS_DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if(parsed && typeof parsed === 'object'){
      const builds = parsed.builds && typeof parsed.builds === 'object' ? parsed.builds : {};
      return { version: 1, builds };
    }
    // Parsed value was not a valid object, return empty store
    return { version: 1, builds: {} };
  }catch(err){
    if(err && err.code === 'ENOENT'){
      return { version: 1, builds: {} };
    }
    throw err;
  }
}

async function writeLocalBuildStore(store){
  const safe = {
    version: 1,
    builds: store && typeof store.builds === 'object' ? store.builds : {}
  };
  await fs.mkdir(path.dirname(BUILDS_DATA_PATH), { recursive: true });
  await fs.writeFile(BUILDS_DATA_PATH, JSON.stringify(safe, null, 2));
  return safe;
}

function normaliseBuildData(build){
  if(!build || typeof build !== 'object'){
    return {};
  }
  try{
    return JSON.parse(JSON.stringify(build));
  }catch(err){
    console.warn('Failed to serialise build payload', err);
    return {};
  }
}

async function loadBuildFromFile(playerKey){
  const store = await readLocalBuildStore();
  const entry = store.builds[playerKey];
  if(!entry){
    return null;
  }
  return normaliseBuildData(entry.data);
}

async function saveBuildToFile(playerKey, buildData){
  const store = await readLocalBuildStore();
  const data = normaliseBuildData(buildData);
  const updatedAt = new Date().toISOString();
  store.builds[playerKey] = {
    data,
    updatedAt
  };
  await writeLocalBuildStore(store);
  return { ok: true };
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

async function fetchPlayerAccessByCode(code){
  if(!canUsePlayerAccess){
    throw httpError(503, 'Player login is not configured.');
  }
  const cleanCode = sanitizeOptional(code);
  const hash = hashAccessCode(cleanCode);
  if(!hash){
    throw httpError(400, 'Access code is required.');
  }
  const hashColumns = SUPABASE_ACCESS_CODE_HASH_COLUMNS.length
    ? SUPABASE_ACCESS_CODE_HASH_COLUMNS
    : ['access_code_hash'];

  let lastError = null;
  let missingColumnAttempts = 0;

  for(const column of hashColumns){
    const filters = [
      `${encodeURIComponent(column)}=eq.${encodeURIComponent(hash)}`,
      'select=player_key,display_name,last_login_at,created_at,updated_at'
    ];

    try{
      const rows = await supabaseQuery(`${encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE)}?${filters.join('&')}`, { fallback: [] });
      const record = Array.isArray(rows) ? rows[0] : null;
      if(record){
        return normalisePlayerAccess(record);
      }
    }catch(err){
      lastError = err;
      const message = String(err.message || '').toLowerCase();
      if(message.includes('does not exist') && message.includes(column.toLowerCase())){
        missingColumnAttempts += 1;
        console.warn(`Configured access code hash column is missing in Supabase: ${column}`);
        continue;
      }
      throw err;
    }
  }

  if(missingColumnAttempts === hashColumns.length && hashColumns.length > 0){
    throw httpError(503, 'Player login is misconfigured. None of the configured access code hash columns exist in Supabase.');
  }

  if(lastError){
    console.warn('Access code lookup failed using configured columns', lastError);
  }

  throw httpError(401, 'Invalid access code.');
}

async function recordPlayerAccessLogin(playerKey){
  if(!canUsePlayerAccess){
    return;
  }
  const key = rosterKey(playerKey);
  if(!key){
    return;
  }
  try{
    await supabaseMutate(`${encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: { last_login_at: new Date().toISOString() }
    });
  }catch(err){
    console.warn('recordPlayerAccessLogin failed', err.message || err);
  }
}

async function updatePlayerAccessDisplayName(playerKey, displayName){
  if(!canUsePlayerAccess){
    return;
  }
  const key = rosterKey(playerKey);
  const cleanName = sanitizeName(displayName);
  if(!key || !cleanName){
    return;
  }
  try{
    await supabaseMutate(`${encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE)}?player_key=eq.${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: { display_name: cleanName }
    });
  }catch(err){
    console.warn('updatePlayerAccessDisplayName failed', err.message || err);
  }
}

// Decide storage mode:
// - If Supabase tables are configured, use 'supabaseTables'.
// - Else if Supabase is available, use 'supabaseJson'.
// - Else fall back to legacy local file storage.
const storageMode = useSupabaseTables
  ? 'supabaseTables'
  : hasSupabase
    ? 'supabaseJson'
    : 'file';

const storage = createStorageAdapter({
  mode: storageMode,
  file: {
    dataPath: DATA_PATH,
    defaultState: DEFAULT_STATE,
    normaliseState,
  },
  supabaseJson: {
    fetchImpl: fetch,
    restUrl: SUPABASE_REST_URL,
    rowId: SUPABASE_ROW_ID,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    defaultState: DEFAULT_STATE,
    normaliseState,
  },
  supabaseTables: {
    defaultSessions: DEFAULT_SESSIONS,
    normaliseState,
    sanitizeName,
    sanitizeOptional,
    rosterKey,
    decodeRosterMeta,
    encodeRosterMeta,
    supabaseQuery,
    supabaseMutate,
    updatePlayerAccessDisplayName,
    tables: {
      sessionsTable: SUPABASE_SESSIONS_TABLE,
      sessionPlayersTable: SUPABASE_SESSION_PLAYERS_TABLE,
      rosterExtrasTable: SUPABASE_ROSTER_EXTRAS_TABLE,
      rosterMetaTable: SUPABASE_ROSTER_META_TABLE,
      buildCardsTable: SUPABASE_BUILD_CARDS_TABLE,
    },
    getMetaSupportsHidden: () => supabaseMetaSupportsHidden,
    setMetaSupportsHidden: (value) => {
      supabaseMetaSupportsHidden = Boolean(value);
    },
  },
});

async function loadState(){
  return storage.fetchState();
}

async function saveState(state, context){
  return storage.saveState(state, context);
}

async function replaceSupabaseTablesState(state){
  if(!storage || typeof storage.replaceState !== 'function'){
    throw new Error('Supabase tables storage is not configured.');
  }
  return storage.replaceState(normaliseState(state));
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

app.post('/api/login', async (req, res) => {
  try{
    if(!canUsePlayerAccess){
      throw httpError(503, 'Personal access codes are not enabled on this server.');
    }
    const accessCode = sanitizeOptional(req.body?.accessCode || req.body?.code);
    const record = await fetchPlayerAccessByCode(accessCode);
    const loginTime = new Date().toISOString();
    await recordPlayerAccessLogin(record.playerKey);
    res.json({
      playerKey: record.playerKey,
      displayName: record.displayName,
      lastLoginAt: record.lastLoginAt || loginTime,
      loginRecordedAt: loginTime
    });
  }catch(err){
    console.error('login failed', err);
    handleError(res, err);
  }
});

app.get('/api/admin/player-access', async (req, res) => {
  try{
    if(!PLAYER_ACCESS_ADMIN_TOKEN){
      throw httpError(503, 'Player directory access is disabled.');
    }
    const providedToken = sanitizeOptional(req.header('x-admin-token') || req.query.token);
    if(providedToken !== PLAYER_ACCESS_ADMIN_TOKEN){
      throw httpError(401, 'Unauthorized');
    }
    if(!canUsePlayerAccess){
      throw httpError(503, 'Player directory is unavailable.');
    }
    const rows = await supabaseQuery(`${encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE)}?select=player_key,display_name,last_login_at,created_at,updated_at&order=display_name.asc`, { fallback: [] });
    const players = rows.map(normalisePlayerAccess).filter(Boolean);
    res.json({ players });
  }catch(err){
    console.error('admin player access lookup failed', err);
    handleError(res, err);
  }
});

app.post('/api/admin/player-access', async (req, res) => {
  try{
    if(!PLAYER_ACCESS_ADMIN_TOKEN){
      throw httpError(503, 'Player directory access is disabled.');
    }
    const providedToken = sanitizeOptional(req.header('x-admin-token') || req.body?.adminToken);
    if(providedToken !== PLAYER_ACCESS_ADMIN_TOKEN){
      throw httpError(401, 'Unauthorized');
    }
    if(!canUsePlayerAccess){
      throw httpError(503, 'Player directory is unavailable.');
    }
    const displayName = sanitizeName(req.body?.displayName || req.body?.name);
    const accessCode = sanitizeOptional(req.body?.accessCode || req.body?.code);
    if(!displayName){
      throw httpError(400, 'Display name is required.');
    }
    if(!accessCode){
      throw httpError(400, 'Access code is required.');
    }
    const playerKey = rosterKey(displayName);
    const accessCodeHash = hashAccessCode(accessCode);
    const now = new Date().toISOString();
    const record = {
      player_key: playerKey,
      display_name: displayName,
      access_code_hash: accessCodeHash,
      created_at: now,
      updated_at: now
    };
    await supabaseMutate(`${encodeURIComponent(SUPABASE_PLAYER_ACCESS_TABLE)}`, {
      method: 'POST',
      body: record,
      headers: { 'Prefer': 'return=minimal' }
    });
    res.status(201).json({
      playerKey,
      displayName,
      accessCode,
      message: 'Player access created successfully'
    });
  }catch(err){
    console.error('create player access failed', err);
    handleError(res, err);
  }
});

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

/**
 * GET /api/sessions - Returns all sessions with enriched trial metadata
 * This endpoint serves the canonical session data from state.json
 */
app.get('/api/sessions', async (req, res) => {
  try {
    const state = await loadState();
    // Return a deep copy to avoid accidental mutation
    const sessions = state.sessions.map(session => ({
      ...session,
      players: Array.isArray(session.players)
        ? session.players.map(player => ({ ...player }))
        : []
    }));
    res.json({ sessions });
  } catch (err) {
    console.error('sessions fetch failed', err);
    handleError(res, err);
  }
});

/**
 * GET /api/sessions/:id - Returns a single session by id
 */
app.get('/api/sessions/:id', async (req, res) => {
  const sessionId = sanitizeOptional(req.params.id);
  if (!sessionId) {
    return handleError(res, httpError(400, 'Session id is required.'));
  }
  try {
    const state = await loadState();
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) {
      return handleError(res, httpError(404, 'Session not found.'));
    }
    // Return a deep copy to avoid accidental mutation
    const result = {
      ...session,
      players: Array.isArray(session.players)
        ? session.players.map(player => ({ ...player }))
        : []
    };
    res.json({ session: result });
  } catch (err) {
    console.error('session fetch failed', err);
    handleError(res, err);
  }
});

/**
 * POST /api/admin/reload - Hot-reload state.json (optional admin endpoint)
 * This allows re-reading the canonical session data without server restart
 * Requires admin token for authorization
 */
app.post('/api/admin/reload', async (req, res) => {
  try {
    // Require admin token for authorization
    if(!PLAYER_ACCESS_ADMIN_TOKEN){
      throw httpError(503, 'Admin reload is disabled (no admin token configured).');
    }
    const providedToken = sanitizeOptional(req.header('x-admin-token') || req.body?.adminToken);
    if(providedToken !== PLAYER_ACCESS_ADMIN_TOKEN){
      throw httpError(401, 'Unauthorized');
    }
    
    // Force reload the state from disk
    const state = await loadState();
    res.json({
      ok: true,
      message: 'State reloaded successfully.',
      sessionCount: state.sessions.length
    });
  } catch (err) {
    console.error('reload failed', err);
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
    state.rosterExtras = state.rosterExtras.filter(entry => entry.key !== key);
    if(state.rosterMeta[key]){
      delete state.rosterMeta[key];
    }
    const updated = await saveState(state, {
      action: 'removeRosterExtra',
      rosterKey: key
    });
    res.json({ state: updated });
  }catch(err){
    console.error('remove roster failed', err);
    handleError(res, err);
  }
});

// === Oracle Build Persistence API ===
// GET /api/builds - List all saved build summaries
app.get('/api/builds', async (req, res) => {
  try {
    // Use Supabase if available
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('build_cards')
        .select('player_key, character_name, class, university, updated_at')
        .order('player_key', { ascending: true });
      if (error) {
        console.error('list builds failed', error);
        throw httpError(500, error.message || 'Failed to list builds');
      }
      return res.json(data || []);
    }
    
    // Local file fallback - list all builds from builds_data.json
    const store = await readLocalBuildStore();
    const builds = Object.entries(store.builds).map(([playerKey, entry]) => {
      const data = entry.data || {};
      const fields = extractBuildFields(data);
      return {
        player_key: playerKey,
        character_name: fields.characterName,
        class: fields.class,
        university: fields.university,
        updated_at: entry.updatedAt || null
      };
    });
    builds.sort((a, b) => (a.player_key || '').localeCompare(b.player_key || ''));
    res.json(builds);
  } catch (err) {
    console.error('list builds failed', err);
    handleError(res, err);
  }
});

// GET /api/builds/:playerKey - Load a full Oracle build
app.get('/api/builds/:playerKey', async (req, res) => {
  try {
    const playerKey = rosterKey(req.params.playerKey);
    if (!playerKey) {
      return handleError(res, httpError(400, 'Player key is required.'));
    }
    assertNotGuestKey(playerKey);
    
    // Use Supabase if available, otherwise fall back to local file
    if (supabaseClient) {
      const { data, error } = await loadOracleBuild(supabaseClient, playerKey);
      if (error) {
        throw httpError(500, error.message || 'Failed to load build.');
      }
      if (!data) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(data);
    }
    
    // Local file fallback
    const build = await loadBuildFromFile(playerKey);
    if (!build) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(build);
  } catch (err) {
    console.error('load build failed', err);
    handleError(res, err);
  }
});

// POST /api/builds/:playerKey - Save a full Oracle build
app.post('/api/builds/:playerKey', async (req, res) => {
  try {
    const playerKey = rosterKey(req.params.playerKey);
    if (!playerKey) {
      return handleError(res, httpError(400, 'Player key is required.'));
    }
    assertNotGuestKey(playerKey);
    const build = req.body;
    if (!build || typeof build !== 'object') {
      return handleError(res, httpError(400, 'Build data is required.'));
    }
    
    // Use Supabase if available, otherwise fall back to local file
    if (supabaseClient) {
      const { error } = await saveOracleBuild(supabaseClient, playerKey, build);
      if (error) {
        console.error('saveOracleBuild failed', playerKey, error);
        throw httpError(500, error.message || 'Failed to save build.');
      }
      console.log('Saved build for player', playerKey);
      return res.status(201).json({ ok: true });
    }
    
    // Local file fallback
    await saveBuildToFile(playerKey, build);
    console.log('Saved build to local file for player', playerKey);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('save build failed', err);
    handleError(res, err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (require.main === module) {
  // Optional config summary on startup for easier debugging
  logConfigSummary();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oracle Tournament API listening on port ${PORT}`);
  });
}

module.exports = app;
module.exports.DEFAULT_STATE = DEFAULT_STATE;
module.exports.DEFAULT_SESSIONS = DEFAULT_SESSIONS;
module.exports.loadCanonicalSessions = loadCanonicalSessions;
module.exports.normaliseState = normaliseState;
module.exports.replaceSupabaseTablesState = replaceSupabaseTablesState;
