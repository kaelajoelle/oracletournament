const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 8787;
const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.join(__dirname, 'state.json');

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
  return String(value ?? '').trim();
}

function rosterKey(name){
  return sanitizeName(name).toLowerCase();
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
    ? session.players.map(name => sanitizeName(name)).filter(Boolean)
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
    sessions.push({...value, players: Array.isArray(value.players) ? value.players.slice() : []});
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
      const status = sanitizeOptional(value.status);
      const notes = sanitizeOptional(value.notes);
      if(status || notes){
        rosterMeta[key] = { status, notes };
      }
    });
  }

  const availability = {};
  if(state && typeof state.availability === 'object'){
    Object.entries(state.availability).forEach(([rawName, dates])=>{
      const name = sanitizeName(rawName);
      if(!name || !dates || typeof dates !== 'object') return;
      const row = {};
      Object.entries(dates).forEach(([date, value])=>{
        if(AVAIL_DATES.includes(date)){
          row[date] = Boolean(value);
        }
      });
      availability[name] = row;
    });
  }

  const buildCards = {};
  if(state && typeof state.buildCards === 'object'){
    Object.entries(state.buildCards).forEach(([rawName, card])=>{
      const name = sanitizeName(rawName);
      if(!name || !card || typeof card !== 'object') return;
      const entry = {};
      if(card.class) entry.class = sanitizeOptional(card.class);
      if(card.university) entry.university = sanitizeOptional(card.university);
      buildCards[name] = entry;
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
  try{
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return normaliseState(parsed);
  }catch(err){
    if(err && err.code === 'ENOENT'){
      const initial = normaliseState(DEFAULT_STATE);
      await saveState(initial);
      return initial;
    }
    throw err;
  }
}

async function saveState(state){
  const normalised = normaliseState(state);
  await fs.writeFile(DATA_PATH, JSON.stringify(normalised, null, 2));
  return normalised;
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
  const name = sanitizeName(req.body?.name);
  const build = req.body?.build || {};
  const klass = sanitizeOptional(build.class);
  const university = sanitizeOptional(build.university);

  if(!sessionId){
    return handleError(res, httpError(400, 'Session id is required.'));
  }
  if(!name){
    return handleError(res, httpError(400, 'Name is required.'));
  }

  try{
    const state = await loadState();
    const session = state.sessions.find(s => s.id === sessionId);
    if(!session){
      throw httpError(404, 'Session not found.');
    }
    if(session.players.includes(name)){
      throw httpError(409, `${name} is already signed up for this session.`);
    }
    if(session.players.length >= session.capacity){
      throw httpError(409, 'This session is already at capacity.');
    }
    if(university){
      for(const player of session.players){
        const existing = state.buildCards[sanitizeName(player)];
        if(existing && existing.university && existing.university === university){
          throw httpError(409, `Another ${university} student is already in this session.`);
        }
      }
    }

    session.players = session.players.concat([name]);
    const buildKey = sanitizeName(name);
    state.buildCards[buildKey] = {
      class: klass,
      university
    };

    const updated = await saveState(state);
    res.json({ state: updated });
  }catch(err){
    console.error('join failed', err);
    handleError(res, err);
  }
});

app.post('/api/sessions/:id/leave', async (req, res) => {
  const sessionId = sanitizeOptional(req.params.id);
  const name = sanitizeName(req.body?.name);
  if(!sessionId){
    return handleError(res, httpError(400, 'Session id is required.'));
  }
  if(!name){
    return handleError(res, httpError(400, 'Name is required.'));
  }
  try{
    const state = await loadState();
    const session = state.sessions.find(s => s.id === sessionId);
    if(!session){
      throw httpError(404, 'Session not found.');
    }
    session.players = session.players.filter(player => sanitizeName(player) !== name);
    const buildKey = sanitizeName(name);
    const stillSignedUp = state.sessions.some(sess => sess.players.some(p => sanitizeName(p) === buildKey));
    if(!stillSignedUp && state.buildCards[buildKey]){
      delete state.buildCards[buildKey];
    }
    const updated = await saveState(state);
    res.json({ state: updated });
  }catch(err){
    console.error('leave failed', err);
    handleError(res, err);
  }
});

app.post('/api/availability', async (req, res) => {
  const name = sanitizeName(req.body?.name);
  const date = sanitizeOptional(req.body?.date);
  const available = Boolean(req.body?.available);

  if(!name){
    return handleError(res, httpError(400, 'Name is required.'));
  }
  if(!AVAIL_DATES.includes(date)){
    return handleError(res, httpError(400, 'Date is not in the availability schedule.'));
  }

  try{
    const state = await loadState();
    const key = sanitizeName(name);
    state.availability[key] = state.availability[key] || {};
    if(available){
      state.availability[key][date] = true;
    }else{
      delete state.availability[key][date];
      if(Object.keys(state.availability[key]).length === 0){
        delete state.availability[key];
      }
    }
    const updated = await saveState(state);
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
    const updated = await saveState(state);
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
  const custom = Boolean(req.body?.custom);
  if(!key){
    return handleError(res, httpError(400, 'Roster key is required.'));
  }
  try{
    const state = await loadState();
    if(status || notes){
      state.rosterMeta[key] = { status, notes };
    }else{
      delete state.rosterMeta[key];
    }
    if(custom){
      const idx = state.rosterExtras.findIndex(entry => entry.key === key);
      if(idx >= 0){
        state.rosterExtras[idx] = {
          ...state.rosterExtras[idx],
          status,
          notes
        };
      }
    }
    const updated = await saveState(state);
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
    delete state.availability[key];
    const updated = await saveState(state);
    res.json({ state: updated });
  }catch(err){
    console.error('remove roster failed', err);
    handleError(res, err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Oracle Tournament API listening on port ${PORT}`);
});
