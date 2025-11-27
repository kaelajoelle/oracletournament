import { ensureAppConfig } from '../services/config.js';

  /* =======================
     CONSTANTS & STORES
  ======================= */

  const APP_CONFIG = ensureAppConfig();



  const API_BASE = APP_CONFIG.apiBaseUrl;

  const PlayerIdentity = (()=>{
    const STORAGE_KEY = 'player_key';
    const GUEST_KEY = 'guest';
    function read(){
      try{
        return (localStorage.getItem(STORAGE_KEY) || '').trim().toLowerCase();
      }catch(err){
        console.warn('Failed to read player key from storage', err);
        return '';
      }
    }
    function requireKey(){
      const key = read();
      if(!key){
        window.location.href = './login.html';
        throw new Error('Player key is required.');
      }
      return key;
    }
    function clear(){
      try{ localStorage.removeItem(STORAGE_KEY); }catch{}
    }
    function getRosterEntry(){
      const key = read();
      if(!key) return null;
      const roster = getRosterList({ includeHidden: true });
      return roster.find(entry => entry.key === key) || null;
    }
    function isGuest(){
      return read() === GUEST_KEY;
    }
    return { getKey: read, requireKey, clear, getRosterEntry, isGuest, getGuestKey: () => GUEST_KEY };
  })();

  const CURRENT_PLAYER_KEY = PlayerIdentity.requireKey();
  const IS_GUEST_SESSION = PlayerIdentity.isGuest();
  const READ_ONLY_NOTICE = 'Guest accounts can browse but cannot change shared data. Use your personal access code to keep editing.';
  function requireWritable(action='perform this action'){
    if(IS_GUEST_SESSION){
      throw new Error(`Guest accounts cannot ${action}. ${READ_ONLY_NOTICE}`);
    }
  }

  const DEFAULT_SHARED_STATE = {
    sessions: [],
    rosterExtras: [],
    rosterMeta: {},
    buildCards: {}
  };

  function normalisePlayer(entry){
    if(!entry) return null;
    if(typeof entry === 'string'){
      const character = sanitizeName(entry);
      if(!character) return null;
      return { key: rosterKey(entry), character };
    }
    if(typeof entry !== 'object') return null;
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
    const id = String(session.id || '').trim();
    const title = sanitizeOptional(session.title) || (id ? `Session ${id}` : 'Session');
    const dm = sanitizeOptional(session.dm);
    const date = String(session.date || '').trim();
    const capacity = Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : 0;
    const players = Array.isArray(session.players)
      ? session.players.map(normalisePlayer).filter(Boolean)
      : [];
    return {
      id,
      title,
      dm,
      date,
      capacity,
      finale: Boolean(session.finale),
      players
    };
  }

  function normaliseSharedState(input){
    const safe = {
      sessions: [],
      rosterExtras: [],
      rosterMeta: {},
      buildCards: {}
    };

    if(!input || typeof input !== 'object'){
      return safe;
    }

    if(Array.isArray(input.sessions)){
      input.sessions.forEach((session)=>{
        const clean = normaliseSession(session);
        if(clean && clean.id){
          clean.players = Array.isArray(session.players)
            ? session.players.map(normalisePlayer).filter(Boolean)
            : [];
          safe.sessions.push(clean);
        }
      });
    }

    if(Array.isArray(input.rosterExtras)){
      input.rosterExtras.forEach((item)=>{
        if(!item || typeof item !== 'object') return;
        const name = sanitizeName(item.name);
        if(!name) return;
        const key = rosterKey(item.key || name);
        if(!key) return;
        safe.rosterExtras.push({
          key,
          name,
          status: sanitizeOptional(item.status),
          notes: sanitizeOptional(item.notes),
          custom: true
        });
      });
    }

    if(input.rosterMeta && typeof input.rosterMeta === 'object'){
      Object.entries(input.rosterMeta).forEach(([rawKey, value])=>{
        const key = rosterKey(rawKey);
        if(!key || !value || typeof value !== 'object') return;
        const status = sanitizeOptional(value.status);
        const notes = sanitizeOptional(value.notes);
        const hidden = Boolean(value.hidden);
        if(status || notes || hidden){
          safe.rosterMeta[key] = { status, notes, hidden };
        }
      });
    }

    if(input.buildCards && typeof input.buildCards === 'object'){
      Object.entries(input.buildCards).forEach(([rawKey, card])=>{
        const key = rosterKey(rawKey);
        if(!key || !card || typeof card !== 'object') return;
        const entry = {};
        if(card.class) entry.class = sanitizeOptional(card.class);
        if(card.university) entry.university = sanitizeOptional(card.university);
        if(card.characterName || card.character_name || card.name){
          entry.characterName = sanitizeName(card.characterName || card.character_name || card.name);
        }
        safe.buildCards[key] = entry;
      });
    }

    return safe;
  }

  const OfflineStateStore = {
    key: 'oracleOfflineState',
    read(){
      try{
        const raw = localStorage.getItem(this.key);
        if(!raw) return null;
        const parsed = JSON.parse(raw);
        if(parsed && typeof parsed === 'object' && parsed.version === 1 && parsed.state){
          return normaliseSharedState(parsed.state);
        }
      }catch(err){
        console.warn('Offline cache read failed', err);
      }
      return null;
    },
    write(state){
      try{
        localStorage.setItem(this.key, JSON.stringify({version:1, state}));
      }catch(err){
        console.warn('Offline cache write failed', err);
      }
    },
    clear(){
      try{ localStorage.removeItem(this.key); }catch{}
    }
  };

  const NetworkStatus = (function(){
    const banner = document.getElementById('networkBanner');
    let pending = 0;
    let lastError = '';

    function update(){
      if(!banner) return;
      if(lastError){
        banner.textContent = `⚠️ ${lastError}`;
        banner.classList.add('error');
        banner.classList.remove('loading');
        banner.hidden = false;
        return;
      }
      if(pending > 0){
        banner.textContent = 'Syncing with the Oracle Archives…';
        banner.classList.add('loading');
        banner.classList.remove('error');
        banner.hidden = false;
      } else {
        banner.hidden = true;
        banner.classList.remove('error');
        banner.classList.remove('loading');
      }
    }

    return {
      begin(){ pending++; update(); },
      end(){ pending = Math.max(0, pending - 1); update(); },
      setError(message){ lastError = message || 'Network request failed.'; update(); },
      clearError(){ lastError = ''; update(); }
    };
  })();

  const DraftStatus = (function(){
    const el = document.getElementById('draftStatus');
    function set(message, tone='info'){
      if(!el) return;
      el.textContent = message;
      el.dataset.tone = tone;
    }
    return {
      info(message){ set(message, 'info'); },
      success(message){ set(message, 'success'); },
      error(message){ set(message, 'error'); }
    };
  })();

  function withApiBase(path){
    if(!API_BASE) return path;
    if(/^https?:/i.test(path)) return path;
    try{
      return new URL(path, API_BASE).toString();
    }catch{
      return API_BASE.replace(/\/$/, '') + path;
    }
  }

  async function apiFetch(path, options={}){
    const url = withApiBase(path);
    const opts = {...options};
    opts.headers = {...(options.headers||{})};
    if(opts.body && !(opts.body instanceof FormData) && !opts.headers['Content-Type']){
      opts.headers['Content-Type'] = 'application/json';
    }

    NetworkStatus.begin();
    try{
      const response = await fetch(url, opts);
      if(!response.ok){
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
      }
      const contentType = response.headers.get('content-type') || '';
      let payload = null;
      if(contentType.includes('application/json')){
        payload = await response.json();
      } else {
        payload = await response.text();
      }
      NetworkStatus.clearError();
      return payload;
    }catch(err){
      NetworkStatus.setError(err && err.message ? err.message : 'Network request failed.');
      throw err;
    }finally{
      NetworkStatus.end();
    }
  }

  window.APP_UTILS = window.APP_UTILS || {};
  window.APP_UTILS.testApiConnection = async function testApiConnection(){
    const response = await apiFetch('/api/state', { headers:{ Accept:'application/json' } });
    console.info('[OracleTournament] /api/state responded with:', response);
    return response;
  };

  const SharedState = {
    data: normaliseSharedState(DEFAULT_SHARED_STATE),
    offline: true,
    fallback: normaliseSharedState(DEFAULT_SHARED_STATE),
    listeners: new Set(),
    apply(state, source='remote'){
      const normalised = normaliseSharedState(state);
      this.data = normalised;
      if(source === 'remote'){
        OfflineStateStore.write(normalised);
        this.offline = false;
      } else {
        this.offline = true;
        if(source === 'offline-cache'){
          OfflineStateStore.write(normalised);
        }
      }
      this.notify();
      return normalised;
    },
    useFallbackSessions(list){
      if(Array.isArray(list)){
        this.fallback.sessions = list.map((session)=>{
          const clean = normaliseSession(session);
          return clean ? {
            ...clean,
            players: Array.isArray(clean.players)
              ? clean.players.map(player => ({ ...player }))
              : []
          } : null;
        }).filter(Boolean);
      }
    },
    useDefaultFallback(){
      this.apply(this.fallback, 'offline-default');
    },
    loadFallbackFromCache(){
      const cached = OfflineStateStore.read();
      if(cached){
        this.apply(cached, 'offline-cache');
        return true;
      }
      return false;
    },
    async refresh(){
      try{
        const payload = await apiFetch('/api/state', { headers:{'Accept':'application/json'} });
        if(!payload || typeof payload !== 'object' || !payload.state){
          throw new Error('Invalid response from datastore.');
        }
        this.apply(payload.state, 'remote');
        return this.data;
      }catch(err){
        const hadCache = this.loadFallbackFromCache();
        if(!hadCache){
          this.useDefaultFallback();
        }
        throw err;
      }
    },
    subscribe(fn){
      if(typeof fn === 'function'){
        this.listeners.add(fn);
        try{ fn(this.data); }catch(err){ console.error(err); }
      }
      return ()=>this.listeners.delete(fn);
    },
    notify(){
      this.listeners.forEach((fn)=>{
        try{ fn(this.data); }catch(err){ console.error(err); }
      });
    },
    getSessionsCopy(){
      return this.data.sessions.map((session)=>({
        ...session,
        players: Array.isArray(session.players)
          ? session.players.map(player => ({ ...player }))
          : []
      }));
    }
  };

  const Backend = {
    async joinSession(sessionId, payload){
      requireWritable('join sessions');
      const rosterEntry = PlayerIdentity.getRosterEntry();
      const body = {
        ...payload,
        playerKey: payload?.playerKey || CURRENT_PLAYER_KEY,
        playerName: payload?.playerName || rosterEntry?.name || '',
        characterName: payload?.characterName || payload?.name
      };
      const res = await apiFetch(`/api/sessions/${encodeURIComponent(sessionId)}/join`, {
        method:'POST',
        body: JSON.stringify(body)
      });
      if(res && res.state){
        SharedState.apply(res.state, 'remote');
      }
      return res;
    },
    async leaveSession(sessionId, payload){
      requireWritable('leave sessions');
      const body = {
        ...payload,
        playerKey: payload?.playerKey || CURRENT_PLAYER_KEY
      };
      const res = await apiFetch(`/api/sessions/${encodeURIComponent(sessionId)}/leave`, {
        method:'POST',
        body: JSON.stringify(body)
      });
      if(res && res.state){
        SharedState.apply(res.state, 'remote');
      }
      return res;
    },
    async addRosterExtra(payload){
      requireWritable('add roster entries');
      const res = await apiFetch('/api/roster/extras', {
        method:'POST',
        body: JSON.stringify(payload)
      });
      if(res && res.state){
        SharedState.apply(res.state, 'remote');
      }
      return res;
    },
    async updateRosterEntry(key, payload){
      requireWritable('edit the roster');
      const res = await apiFetch(`/api/roster/${encodeURIComponent(key)}`, {
        method:'PATCH',
        body: JSON.stringify(payload)
      });
      if(res && res.state){
        SharedState.apply(res.state, 'remote');
      }
      return res;
    },
    async removeRosterExtra(key){
      requireWritable('remove roster entries');
      const res = await apiFetch(`/api/roster/extras/${encodeURIComponent(key)}`, {
        method:'DELETE'
      });
      if(res && res.state){
        SharedState.apply(res.state, 'remote');
      }
      return res;
    }
  };

  const RosterExtrasStore = {
    read(){
      return SharedState.data.rosterExtras;
    }
  };

  const RosterMetaStore = {
    read(){
      return SharedState.data.rosterMeta;
    }
  };

  const HTML_ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

  function sanitizeName(value){
    return String(value ?? '').trim();
  }

  function sanitizeOptional(value){
    return String(value ?? '').trim();
  }

  function rosterKey(name){
    return sanitizeName(name).toLowerCase();
  }

  function escapeHTML(value){
    return String(value ?? '').replace(/[&<>"']/g, (ch)=>HTML_ESCAPE[ch]||ch);
  }

  function escapeAttr(value){
    return escapeHTML(value);
  }

  let BASE_ROSTER_KEYS = new Set();

  function rosterHasKey(key){
    const normalised = rosterKey(key);
    if(!normalised) return false;
    if(BASE_ROSTER_KEYS.has(normalised)) return true;
    return RosterExtrasStore.read().some(entry => entry.key === normalised);
  }

  async function addRosterExtra(name, status='', notes=''){
    if(IS_GUEST_SESSION){
      return {ok:false, msg: READ_ONLY_NOTICE};
    }
    const cleanName = sanitizeName(name);
    if(!cleanName) return {ok:false, msg:'Name is required.'};
    const key = rosterKey(cleanName);
    if(rosterHasKey(key)) return {ok:false, msg:`${cleanName} is already on the roster.`};
    const cleanStatus = sanitizeOptional(status);
    const cleanNotes = sanitizeOptional(notes);
    try{
      await Backend.addRosterExtra({ name: cleanName, status: cleanStatus, notes: cleanNotes });
      return {ok:true, key, name: cleanName};
    }catch(err){
      return {ok:false, msg: err && err.message ? err.message : 'Failed to add roster entry.'};
    }
  }

  async function updateRosterDetails(key, entry, status, notes, hiddenOverride){
    if(IS_GUEST_SESSION){
      throw new Error(READ_ONLY_NOTICE);
    }
    const cleanKey = rosterKey(key);
    if(!cleanKey) return;
    const cleanStatus = sanitizeOptional(status);
    const cleanNotes = sanitizeOptional(notes);
    const hidden = hiddenOverride == null ? Boolean(entry && entry.hidden) : Boolean(hiddenOverride);
    await Backend.updateRosterEntry(cleanKey, {
      status: cleanStatus,
      notes: cleanNotes,
      custom: Boolean(entry && entry.custom),
      name: entry && entry.name ? sanitizeName(entry.name) : '',
      hidden
    });
  }

  async function setRosterHidden(entry, hidden){
    if(IS_GUEST_SESSION){
      throw new Error(READ_ONLY_NOTICE);
    }
    if(!entry || !entry.key) return;
    await updateRosterDetails(entry.key, entry, entry.status, entry.notes, hidden);
  }

  async function removeRosterExtra(key){
    if(IS_GUEST_SESSION){
      throw new Error(READ_ONLY_NOTICE);
    }
    const cleanKey = rosterKey(key);
    if(!cleanKey) return;
    await Backend.removeRosterExtra(cleanKey);
  }

  function getRosterList(opts={}){
    const includeHidden = Boolean(opts.includeHidden);
    const extras = RosterExtrasStore.read();
    const meta = RosterMetaStore.read();
    const list = [];

    DATA.roster.forEach((r)=>{
      const key = rosterKey(r.key || r.name);
      const override = meta[key] || {};
      const entry = {
        name: r.name,
        key,
        status: override.status || sanitizeOptional(r.status),
        notes: override.notes || sanitizeOptional(r.notes),
        custom: false,
        hidden: Boolean(override.hidden)
      };
      if(entry.hidden && !includeHidden){
        return;
      }
      list.push(entry);
    });

    extras.forEach((item)=>{
      const key = rosterKey(item.key || item.name);
      const override = meta[key] || {};
      const entry = {
        name: item.name,
        key,
        status: override.status || sanitizeOptional(item.status),
        notes: override.notes || sanitizeOptional(item.notes),
        custom: true,
        hidden: Boolean(override.hidden)
      };
      if(entry.hidden && !includeHidden){
        return;
      }
      list.push(entry);
    });

    return list.sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
  }

  function getHiddenRosterEntries(){
    return getRosterList({ includeHidden: true }).filter(entry => entry.hidden);
  }

  function labelDate(iso){
    try{
      const dt = new Date(iso + 'T00:00:00');
      return dt.toLocaleDateString('en-CA',{month:'short', day:'2-digit'}); // e.g., Dec 21
    }catch{ return iso; }
  }

  function toLocalICS(dt){
    const pad = n => String(n).padStart(2,'0');
    return dt.getFullYear()+pad(dt.getMonth()+1)+pad(dt.getDate())+'T'+pad(dt.getHours())+pad(dt.getMinutes())+pad(dt.getSeconds());
  }

  function downloadICS(session){
    const tz = 'America/Edmonton';
    // default 7–9pm local
    const start = new Date(session.date + 'T19:00:00');
    const end   = new Date(session.date + 'T21:00:00');
    const uid = `${session.id}@oracletrials`;
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//OracleTrials//Scheduler//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
      `UID:${uid}`,
      `SUMMARY:${session.title}`,
      `DESCRIPTION:DM: ${session.dm} | Capacity: ${session.capacity}`,
      `DTSTART;TZID=${tz}:${toLocalICS(start)}`,
      `DTEND;TZID=${tz}:${toLocalICS(end)}`,
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], {type:'text/calendar'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${session.title.replace(/\s+/g,'-')}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* =======================
     DATA
  ======================= */
  const DATA = {
    levels:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    abilityArrays:{ standard:[15,14,13,12,10,8] },
    universities:[
      { key:'lorehold', name:'Lorehold', theme:'History & Spirits', colours:'Red/White', focus:'Archaeomancy', playstyle:'Scholar / Explorer', spells:{
          1:['Comprehend Languages','Identify'],
          2:['Borrowed Knowledge','Locate Object'],
          3:['Speak with Dead','Spirit Guardians'],
          4:['Arcane Eye','Stone Shape'],
          5:['Flame Strike','Legend Lore']
      }},
      { key:'prismari', name:'Prismari', theme:'Elemental Arts', colours:'Blue/Red', focus:'Performance & Elements', playstyle:'Passion / Spectacle', spells:{
          1:['Chromatic Orb','Thunderwave'],
          2:['Flaming Sphere','Kinetic Jaunt'],
          3:['Haste','Water Walk'],
          4:['Freedom of Movement','Wall of Fire'],
          5:['Cone of Cold','Conjure Elemental']
      }},
      { key:'quandrix', name:'Quandrix', theme:'Math & Nature', colours:'Blue/Green', focus:'Fractals / Growth', playstyle:'Logical / Curious', spells:{
          1:['Entangle','Guiding Bolt'],
          2:['Enlarge/Reduce','Vortex Warp'],
          3:['Aura of Vitality','Haste'],
          4:['Control Water','Freedom of Movement'],
          5:['Circle of Power','Passwall']
      }},
      { key:'silverquill', name:'Silverquill', theme:'Eloquence & Ink', colours:'White/Black', focus:'Radiance & Shadow', playstyle:'Charisma / Wit', spells:{
          1:['Dissonant Whispers','Silvery Barbs'],
          2:['Calm Emotions','Darkness'],
          3:['Beacon of Hope','Daylight'],
          4:['Compulsion','Confusion'],
          5:['Dominate Person','Rary’s Telepathic Bond']
      }},
      { key:'witherbloom', name:'Witherbloom', theme:'Life & Decay', colours:'Green/Black', focus:'Alchemy / Essence', playstyle:'Healer / Witch', spells:{
          1:['Cure Wounds','Inflict Wounds'],
          2:['Lesser Restoration','Wither and Bloom'],
          3:['Revivify','Vampiric Touch'],
          4:['Blight','Death Ward'],
          5:['Antilife Shell','Greater Restoration']
      }}
    ],
    backgrounds:[
      {key:'lorehold-student', name:'Lorehold Student', skills:['History','Religion'], tools:[], languages:'2 of choice', gear:['Ink/pen','Hammer','Lantern','History tome','Uniform'], feat:'Strixhaven Initiate (Lorehold)'},
      {key:'prismari-student', name:'Prismari Student', skills:['Acrobatics','Performance'], tools:['+1 instrument/tool'], languages:'1', gear:['Ink/pen','Artisan tools or Instrument','Uniform'], feat:'Strixhaven Initiate (Prismari)'},
      {key:'quandrix-student', name:'Quandrix Student', skills:['Arcana','Nature'], tools:['+1 artisan tool'], languages:'1', gear:['Ink/pen','Abacus','Arcane theory book','Uniform'], feat:'Strixhaven Initiite (Silverquill)'},
      {key:'silverquill-student', name:'Silverquill Student', skills:['Intimidation','Persuasion'], tools:[], languages:'2', gear:['Ink/pen','Poetry book','Uniform'], feat:'Strixhaven Initiite (Silverquill)'},
      {key:'witherbloom-student', name:'Witherbloom Student', skills:['Nature','Survival'], tools:['Herbalism Kit'], languages:'1', gear:['Plant ID book','Iron pot','Herbalism kit','Uniform'], feat:'Strixhaven Initiate (Witherbloom)'}
    ],
    feats:{
      strixhavenInitiate:{
        name:'Strixhaven Initiate',
        text:'Choose your college; learn 2 cantrips from its list + one 1st-level spell. Cast the 1st-level spell once per long rest without a slot; also with slots. Choose Int/Wis/Cha as spellcasting ability for these.'
      }
    },
    extracurriculars:[
      {key:'dead-languages', name:'Dead Languages Society', skills:['Athletics','History']},
      {key:'fine-artists', name:'Distinguished Society of Fine Artists', skills:['Performance','Sleight of Hand']},
      {key:'dragonchess', name:'Dragonchess Club', skills:['Deception','Investigation']},
      {key:'historical-soc', name:'Dragonsguard Historical Society', skills:['Arcana','History']},
      {key:'horticulture', name:'Fantastical Horticulture Club', skills:['Nature','Survival']},
      {key:'entrepreneurs', name:'Future Entrepreneurs of Strixhaven', skills:['Insight','Persuasion']},
      {key:'gymnastics', name:'Intramural Gymnastics', skills:['Acrobatics','Performance']},
      {key:'silkball', name:'Silkball Club', skills:['Athletics','Intimidation']},
      {key:'water-dance', name:'Water-Dancing Club', skills:['Athletics','Performance']},
      {key:'larp', name:'LARP Guild', skills:['Animal Handling','Performance']},
      {key:'cheer', name:'Mage Tower Cheer', skills:['Perception','Persuasion']},
      {key:'drama', name:'Playactors Drama Guild', skills:['Arcana','Deception']},
      {key:'iron-lifters', name:'Iron-Lifters', skills:['Athletics','Medicine']},
      {key:'show-band', name:'Show Band', skills:['Sleight of Hand','Performance']},
      {key:'newspaper', name:'Strixhaven Star (Newspaper)', skills:['Investigation','Insight']},
      {key:'faith', name:'Student-Mages of Faith', skills:['Insight','Religion']}
    ],
    jobs:[
      {key:'biblioplex', name:'Biblioplex', skills:['Arcana','History']},
      {key:'firejolt', name:'Firejolt Café', skills:['Insight','Persuasion']},
      {key:'bowsend', name:"Bow's End Tavern", skills:['Performance','Deception']},
      {key:'stadium', name:'Stadium', skills:['Athletics','Intimidation']},
      {key:'performing-arts', name:'Performing Arts Society', skills:['Performance','Deception']},
      {key:'dorms', name:'Dormitories', skills:['Persuasion','Perception']},
      {key:'grounds', name:'Campus Grounds', skills:['Nature','Survival']},
      {key:'labs', name:'Magic Labs', skills:['Arcana','Investigation']},
      {key:'intramural', name:'Intramural Fields', skills:['Athletics','Acrobatics']}
    ],
    roster:[
       { name: 'Kaela',        status: 'Yes', key: 'kaela123' },

  { name: 'Tory DM',      status: 'Yes', key: 'torydm123' },
  { name: 'Mike',         status: 'Pending', key: 'mike2025' },
  { name: 'Megan',        status: 'Pending', key: 'megan2025' },
  { name: 'Jocelyn',      status: 'Pending', key: 'joss2025' },
  { name: 'Emory',        status: 'Pending', key: 'emory2025' },
  { name: 'Snack Erin',   status: 'Yes', key: 'snacks' },
  { name: 'Erin',         status: 'Yes', key: 'erin2627' },
  { name: 'Trevor',       status: 'Yes', key: 'trev2227' },
  { name: 'Amy',          status: 'Yes', key: 'amyoracle' },
  { name: 'Nicole',       status: 'Yes', key: 'nicole2627' },
  { name: 'Spencer',      status: 'Yes', key: 'spence2627' },
  { name: 'Marvin',       status: 'Pending', key: 'marv2025' },
  { name: 'Megan E',      status: 'Pending', key: 'megane2025' },
  { name: 'Jordan',       status: 'Pending', key: 'jordan2025' },
  { name: 'Becca',        status: 'Yes', key: 'becca2728' },
  { name: 'Evan',         status: 'Yes', key: 'evan2728' },
  { name: 'Lyric',        status: 'Pending', key: 'lyric2025' },
  { name: 'Lazarus',      status: 'Yes', key: 'laz_kids' },
  { name: 'Aramis',       status: 'Pending', key: 'aramis2025' },
  { name: 'James',        status: 'Pending', key: 'james2025' },
  { name: 'David',        status: 'Pending', key: 'david2025' },
  { name: 'Nova',         status: 'Yes', key: 'nova_any' },
  { name: 'Melissa',      status: 'Yes', key: 'melissa_not28' },
  { name: 'Josh',         status: 'Yes', key: 'josh222729' },
  { name: 'Marilyn',      status: 'Pending', key: 'marilyn2025' },
    ],
    sessions:[
    
      {id:'s2', date:'2025-12-22', title:'Oracle Trials I', dm:'Kaela & Tory', capacity:5, players:[]},
      {id:'s4', date:'2025-12-27', title:'Oracle Trials II', dm:'Kaela & Tory', capacity:5, players:[]},
      {id:'s6', date:'2025-12-29', title:'Oracle Trials II', dm:'Kaela & Tory', capacity:5, players:[]},
      {id:'finale', date:'2026-01-01', title:'Oracle Trials: Grand Finale', dm:'Kaela & Tory', capacity:8, players:[], finale:true}
    ]
  };

  // Always render roster A→Z without risk to source order
  DATA.roster = [...DATA.roster].sort((a,b)=>a.name.localeCompare(b.name,'en'));
  BASE_ROSTER_KEYS = new Set(DATA.roster.map(r=>rosterKey(r.key || r.name)));

  SharedState.useFallbackSessions(DATA.sessions);
  SharedState.useDefaultFallback();

  // Optional quick rule examples
  const ELIGIBILITY = {
    hardNo: [ 'Link' ],
    blockedDates: { 'Melissa': ['2025-12-28'] }
  };

  /* =======================
     VALIDATION & ERROR HANDLING
  ======================= */
  function validateConfig(){
    const errors=[];

    try{
      if(!Array.isArray(DATA.sessions)) errors.push('DATA.sessions is missing or not an array.');
      else{
        const ids=new Set();
        DATA.sessions.forEach((s,idx)=>{
          if(!s || typeof s!=='object'){ errors.push(`sessions[${idx}] is not an object`); return; }
          if(!s.id) errors.push(`sessions[${idx}] is missing an id`);
          if(s.id){ if(ids.has(s.id)) errors.push(`Duplicate session id: ${s.id}`); else ids.add(s.id); }
          if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s.date||''))) errors.push(`${s.title||s.id||('session#'+idx)} has non-ISO date "${s.date}"`);
          if(typeof s.capacity !== 'number') errors.push(`${s.title||s.id||('session#'+idx)} capacity must be a number`);
        });
      }
    }catch{ errors.push('DATA.sessions could not be validated.'); }

    try{ if(!Array.isArray(DATA.roster)) errors.push('DATA.roster is missing or not an array.'); }
    catch{ errors.push('DATA.roster could not be validated.'); }

    return errors;
  }

  function showErrors(errors){
    if(!errors || !errors.length) return;
    const main=document.querySelector('main');
    const box=document.createElement('div');
    box.className='panel';
    box.style.border='1px solid #f14a3b';
    box.style.background='#1d1111';
    box.innerHTML = `
      <h2>Configuration issues</h2>
      <p>Fix the items below, then refresh. If you changed dates/IDs recently, hit <strong>Clear Local Data</strong> in the sidebar.</p>
      <ul>${errors.map(e=>`<li>${e.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</li>`).join('')}</ul>
    `;
    main.prepend(box);
  }

  window.addEventListener('error', (e)=>{
    const main=document.querySelector('main');
    if(!main) return;
    const box=document.createElement('div');
    box.className='panel';
    box.style.border='1px solid #f14a3b';
    box.style.background='#1d1111';
    box.innerHTML=`<strong>Runtime error:</strong> ${String(e.message||'Unknown error')}`;
    main.prepend(box);
  });

  /* =======================
     STATE
  ======================= */
  const LocalDraftStore = {
    key: 'oracleTrialsSave',
    read(){
      try{
        const raw = localStorage.getItem(this.key);
        if(!raw) return null;
        return JSON.parse(raw);
      }catch(err){
        console.warn('Local draft read failed', err);
        return null;
      }
    },
    write(data){
      try{
        localStorage.setItem(this.key, JSON.stringify(data));
      }catch(err){
        console.warn('Local draft write failed', err);
      }
    },
    clear(){
      try{ localStorage.removeItem(this.key); }catch(err){ console.warn('Local draft clear failed', err); }
    }
  };

  function cloneDraftData(data){
    try{
      return JSON.parse(JSON.stringify(data || {}));
    }catch(err){
      console.warn('Draft clone failed', err);
      return {};
    }
  }

  const CharacterDraftsApi = {
    async saveDraft(data){
      const encoded = encodeURIComponent(CURRENT_PLAYER_KEY);
      const response = await apiFetch(`/api/characters/${encoded}`, {
        method: 'PUT',
        body: JSON.stringify({ data })
      });
      return response && response.draft ? response.draft : null;
    },
    async loadDraft(){
      const encoded = encodeURIComponent(CURRENT_PLAYER_KEY);
      const response = await apiFetch(`/api/characters/${encoded}`, {
        headers: { Accept: 'application/json' }
      });
      return response && response.draft ? response.draft : null;
    }
  };

  const State = {
    data:{
      meta:{version:'0.5-stable'},
      core:{ playerName:'', name:'', race:'', class:'', background:'', level:4, abilityMethod:'standard', abilities:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8}, equipment:'class'},
      university:{ key:'', spellAbility:'INT' },
      feats:[],
      extras:{ job:null, clubs:[], studentDice:[] },
      personality:{ traits:'', ideal:'', bond:'', rival:'', goal:'', prompt:'' },
      exams:{ notes:'', studyRerolls:0, results:[] }
    },
    sessions: [],
    async save(){
      const snapshot = cloneDraftData(this.data);
      LocalDraftStore.write(snapshot);
      let remoteDraft = null;
      let remoteError = null;
      if(!IS_GUEST_SESSION){
        try{
          remoteDraft = await CharacterDraftsApi.saveDraft(snapshot);
        }catch(err){
          remoteError = err;
          console.warn('Remote draft save failed', err);
        }
      }
      if(remoteDraft){
        DraftStatus.success('Draft synced to the Oracle Archives and backed up in this browser.');
        return true;
      }
      if(remoteError){
        DraftStatus.error('Online save failed; your draft is stored in this browser only.');
      }else if(IS_GUEST_SESSION){
        DraftStatus.info('Guest saves stay in this browser. Enter your access code to sync online.');
      }else{
        DraftStatus.info('Saved locally. Reconnect to sync with the Oracle Archives.');
      }
      return false;
    },
    async load(){
      let remoteError = null;
      if(!IS_GUEST_SESSION){
        try{
          const remoteDraft = await CharacterDraftsApi.loadDraft();
          if(remoteDraft && remoteDraft.data){
            this.data = cloneDraftData(remoteDraft.data);
            LocalDraftStore.write(this.data);
            renderAll();
            DraftStatus.success('Draft loaded from the Oracle Archives.');
            return true;
          }
        }catch(err){
          remoteError = err;
          console.warn('Remote draft load failed', err);
        }
      }
      const localDraft = LocalDraftStore.read();
      if(localDraft){
        this.data = cloneDraftData(localDraft);
        renderAll();
        if(remoteError){
          DraftStatus.error('Loaded browser backup after the Oracle Archives could not be reached.');
        }else{
          DraftStatus.info('Loaded the draft stored in this browser.');
        }
        return true;
      }
      DraftStatus.error(remoteError ? 'No drafts found online or offline. Save your character first.' : 'No saved drafts yet.');
      const alertMessage = remoteError
        ? 'Could not load any drafts from the Oracle Archives or this browser. Save a character once you are back online.'
        : 'No saved draft found. Create and save a character first.';
      alert(alertMessage);
      return false;
    },
    export(){ const blob=new Blob([JSON.stringify({character:this.data, sessions:this.sessions},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`oracle-trials-${(this.data.core.name||'character').toLowerCase().replace(/[^a-z0-9-]/g,'-')}.json`; a.click(); URL.revokeObjectURL(url); }
  };

  SharedState.subscribe(()=>{
    State.sessions = SharedState.getSessionsCopy();
    if(State?.data?.core){
      const rosterEntry = PlayerIdentity.getRosterEntry();
      if(rosterEntry && !State.data.core.playerName){
        State.data.core.playerName = rosterEntry.name;
      }
    }
  });

  /* =======================
     HELPERS
  ======================= */
    
function buildReady() {
  const c = State.data.core || {};
  const uni = State.data.university || {};
  return Boolean(
    (c.name && c.name.trim().length >= 2) &&
    (c.class && c.class.trim()) &&
    (c.level && Number.isFinite(+c.level)) &&
    (uni.key && uni.key.trim())
  );
}


// Reusable card list
function renderSessionCards(container, opts={readOnly:false}){
  const {readOnly=false} = opts;
  container.innerHTML = '';
  const builds = SharedState.data.buildCards || {};

  State.sessions
    .slice()
    .sort((a,b)=>a.date.localeCompare(b.date))
    .forEach(s=>{
      const filled = (s.players||[]).length;
      const full = filled>=s.capacity;
      const roster = filled
        ? (Array.isArray(s.players) ? s.players : []).map(player=>{
            const b = player && player.key ? builds[player.key] : null;
            let extra = '';
            if(b){
              const classLabel = escapeHTML(b.class || '?');
              const uniLabel = escapeHTML(b.university || '?');
              extra = ` — <span class="muted">${classLabel} • ${uniLabel}</span>`;
            }
            const label = escapeHTML(player && (player.character || player.name || player.playerName || 'Player'));
            return `<div class="pill"><span>${label}</span>${extra}</div>`;
          }).join('')
        : '<span class="muted">No players yet</span>';

      const joinDisabled = (!buildReady() || full) ? 'disabled' : '';
      const joinBtn = readOnly ? '' : `<button data-id="${s.id}" class="primary" ${joinDisabled}>Add my character</button>`;

      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `
        <div class="flex" style="justify-content:space-between">
          <div>
            <strong>${s.title}</strong>
            <div class="muted">${s.date} • DM: ${s.dm} • Capacity: ${filled}/${s.capacity}</div>
            <div class="muted" style="margin-top:4px">No duplicate universities allowed in the same session.</div>
            ${(!readOnly && !buildReady()) ? `<div class="muted" style="margin-top:6px">Finish <em>Core 5e</em> + choose a <em>University</em> to join.</div>` : ''}
            ${(!readOnly && full) ? `<div class="muted" style="margin-top:6px">This session is full.</div>` : ''}
          </div>
          <div class="flex">
            ${joinBtn}
            <button data-ics="${s.id}">.ics</button>
          </div>
        </div>
        <div style="margin-top:8px" class="flex">${roster}</div>
      `;
      container.appendChild(card);
    });
}

function setupCommentBoard(root){
  const form = root.querySelector('#commentForm');
  const textarea = root.querySelector('#commentText');
  const playerInput = root.querySelector('#commentPlayer');
  const characterInput = root.querySelector('#commentCharacter');
  const sessionInput = root.querySelector('#commentSession');
  const list = root.querySelector('#commentList');
  const refreshBtn = root.querySelector('#refreshComments');
  const status = root.querySelector('#commentStatus');
  if(!form || !textarea || !list) return;

  let statusTimer = 0;
  const submitButton = form.querySelector('button[type="submit"]');
  const commentsReadOnly = IS_GUEST_SESSION;

  const announce = (message, tone='success')=>{
    if(!status) return;
    try{ window.clearTimeout(statusTimer); }catch{}
    status.textContent = message;
    status.dataset.tone = tone;
    status.hidden = false;
    statusTimer = window.setTimeout(()=>{ status.hidden = true; }, 3600);
  };

  if(status){
    status.hidden = true;
  }

  if(commentsReadOnly){
    [textarea, playerInput, characterInput, sessionInput].forEach((inputEl)=>{
      if(inputEl){
        inputEl.disabled = true;
        inputEl.setAttribute('aria-disabled', 'true');
      }
    });
    if(submitButton){
      submitButton.disabled = true;
      submitButton.title = READ_ONLY_NOTICE;
      submitButton.textContent = 'Comments disabled for guests';
    }
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = READ_ONLY_NOTICE;
    form.appendChild(note);
  }

  const formatStamp = (iso)=>{
    try{
      const date = new Date(iso);
      return date.toLocaleString(undefined, {
        month:'short', day:'numeric',
        hour:'numeric', minute:'2-digit'
      });
    }catch{
      return iso;
    }
  };

  const sortComments = (entries)=> entries.slice().sort((a, b)=>{
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const normaliseComment = (input)=>{
    if(!input || typeof input !== 'object') return null;
    const baseId = (input.id ?? input.comment_id ?? '').toString().trim();
    const textValue = (input.comment ?? input.text ?? '').toString().trim();
    if(!textValue){
      return null;
    }
    const playerName = sanitizeOptional(input.playerName ?? input.player_name);
    const characterName = sanitizeOptional(input.characterName ?? input.character_name);
    const sessionId = sanitizeOptional(input.sessionId ?? input.session_id);
    let createdAt = input.createdAt || input.created_at || input.stamp;
    if(createdAt){
      const stamp = new Date(createdAt);
      createdAt = Number.isNaN(stamp.getTime()) ? new Date().toISOString() : stamp.toISOString();
    }else{
      createdAt = new Date().toISOString();
    }
    const id = baseId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      playerName,
      characterName,
      sessionId,
      comment: textValue,
      createdAt
    };
  };

  const state = {
    comments: [],
    loading: false
  };

  const setComments = (entries)=>{
    const seen = new Set();
    const cleaned = [];
    (entries || []).forEach((entry)=>{
      const normalised = entry && entry.comment ? entry : normaliseComment(entry);
      if(!normalised || !normalised.comment){
        return;
      }
      if(seen.has(normalised.id)){
        return;
      }
      seen.add(normalised.id);
      cleaned.push(normalised);
    });
    state.comments = sortComments(cleaned);
    return state.comments;
  };

  const renderList = ()=>{
    if(state.loading){
      list.innerHTML = '<p class="comment-empty">Loading comments…</p>';
      return;
    }
    if(!state.comments.length){
      list.innerHTML = '<p class="comment-empty">No comments yet. Add the first note above.</p>';
      return;
    }
    list.innerHTML = '';
    state.comments.forEach((entry)=>{
      if(!entry || !entry.comment) return;
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.dataset.pending = entry.pending ? 'true' : 'false';

      const copy = document.createElement('p');
      copy.textContent = entry.comment;
      item.appendChild(copy);

      if(entry.playerName || entry.characterName || entry.sessionId){
        const meta = document.createElement('div');
        meta.className = 'comment-meta';
        if(entry.playerName){
          const span = document.createElement('span');
          span.textContent = `Player: ${entry.playerName}`;
          meta.appendChild(span);
        }
        if(entry.characterName){
          const span = document.createElement('span');
          span.textContent = `Character: ${entry.characterName}`;
          meta.appendChild(span);
        }
        if(entry.sessionId){
          const span = document.createElement('span');
          span.textContent = `Session: ${entry.sessionId}`;
          meta.appendChild(span);
        }
        item.appendChild(meta);
      }

      const stamp = document.createElement('time');
      stamp.dateTime = entry.createdAt;
      stamp.textContent = formatStamp(entry.createdAt);
      item.appendChild(stamp);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger';
      if(entry.pending){
        remove.textContent = 'Posting…';
        remove.disabled = true;
      }else if(commentsReadOnly){
        remove.textContent = 'Delete';
        remove.disabled = true;
        remove.title = READ_ONLY_NOTICE;
      }else{
        remove.textContent = 'Delete';
        remove.addEventListener('click', ()=>{
          void handleDelete(entry);
        });
      }
      item.appendChild(remove);

      list.appendChild(item);
    });
  };

  const fetchComments = async ({ silent = false } = {})=>{
    state.loading = true;
    renderList();
    try{
      const payload = await apiFetch('/api/comments', { headers:{ Accept:'application/json' } });
      const rows = Array.isArray(payload?.comments) ? payload.comments : [];
      setComments(rows.map(normaliseComment).filter(Boolean));
      if(!silent){
        announce('Comments updated.', 'info');
      }
    }catch(err){
      if(!silent){
        announce(err && err.message ? err.message : 'Failed to load comments.', 'error');
      }
      throw err;
    }finally{
      state.loading = false;
      renderList();
    }
  };

  const handleDelete = async (entry)=>{
    if(commentsReadOnly){
      announce(READ_ONLY_NOTICE, 'error');
      return;
    }
    if(!entry || !entry.id) return;
    const ok = (typeof confirm === 'function') ? confirm('Delete this comment?') : true;
    if(!ok) return;
    const previous = state.comments.slice();
    setComments(previous.filter((item)=> item.id !== entry.id));
    renderList();
    announce('Removing comment…', 'info');
    try{
      await apiFetch(`/api/comments/${encodeURIComponent(entry.id)}`, { method:'DELETE' });
      announce('Comment deleted.', 'info');
    }catch(err){
      setComments(previous);
      renderList();
      announce(err && err.message ? err.message : 'Failed to delete comment.', 'error');
    }
  };

  form.addEventListener('submit', async (event)=>{
    event.preventDefault();
    if(commentsReadOnly){
      announce(READ_ONLY_NOTICE, 'error');
      return;
    }
    const textValue = (textarea.value || '').trim();
    if(!textValue){
      announce('Comment text is required.', 'error');
      return;
    }

    const playerName = playerInput ? sanitizeOptional(playerInput.value) : '';
    const characterName = characterInput ? sanitizeOptional(characterInput.value) : '';
    const sessionId = sessionInput ? sanitizeOptional(sessionInput.value) : '';

    const previous = state.comments.slice();
    const optimistic = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerName,
      characterName,
      sessionId,
      comment: textValue,
      createdAt: new Date().toISOString(),
      pending: true
    };

    setComments([optimistic, ...previous]);
    renderList();
    announce('Posting comment…', 'info');
    if(submitButton){
      submitButton.disabled = true;
    }

    try{
      const response = await apiFetch('/api/comments', {
        method:'POST',
        body: JSON.stringify({
          playerName,
          characterName,
          sessionId,
          comment: textValue
        })
      });
      const saved = normaliseComment(response && response.comment);
      if(!saved){
        throw new Error('Invalid response from datastore.');
      }
      setComments([saved, ...previous]);
      renderList();
      if(textarea){ textarea.value = ''; }
      if(playerInput){ playerInput.value = ''; }
      if(characterInput){ characterInput.value = ''; }
      if(sessionInput){ sessionInput.value = ''; }
      announce('Comment posted!', 'success');
    }catch(err){
      setComments(previous);
      renderList();
      if(err && err.message){
        announce(err.message, 'error');
      }else{
        announce('Failed to post comment.', 'error');
      }
    }finally{
      if(submitButton){
        submitButton.disabled = false;
      }
    }
  });

  if(refreshBtn){
    refreshBtn.addEventListener('click', (event)=>{
      event.preventDefault();
      fetchComments().catch((err)=>{
        if(err && err.message){
          announce(err.message, 'error');
        }else{
          announce('Failed to refresh comments.', 'error');
        }
      });
    });
  }

  renderList();
  fetchComments({ silent: true }).catch((err)=>{
    if(err && err.message){
      announce(err.message, 'error');
    }else{
      announce('Unable to load comments.', 'error');
    }
  });
}

async function hydrateQuestBoard(root=document){
  const container = root?.querySelector?.('#questList');
  if(!container) return;

  container.innerHTML = '<p class="muted">Loading quests…</p>';

  try{
    const response = await fetch('./site/data/quests.json', {cache:'no-store'});
    if(!response.ok) throw new Error(`Request failed: ${response.status}`);

    const quests = await response.json();
    if(!Array.isArray(quests) || !quests.length){
      container.innerHTML = '<p class="muted">No quests are published yet. Check back soon.</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    quests.forEach((quest)=>{
      if(!quest || typeof quest !== 'object') return;
      const card = document.createElement('article');
      card.className = 'quest-card';

      const title = document.createElement('h4');
      title.textContent = quest.title || `Quest #${quest.id ?? '?'}`;
      card.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'quest-meta';

      if(typeof quest.id !== 'undefined'){
        const idSpan = document.createElement('span');
        idSpan.textContent = `ID ${quest.id}`;
        meta.appendChild(idSpan);
      }

      if(quest.status){
        const statusSpan = document.createElement('span');
        statusSpan.textContent = `Status: ${quest.status}`;
        meta.appendChild(statusSpan);
      }

      if(meta.childNodes.length){
        card.appendChild(meta);
      }

      if(quest.notes){
        const notes = document.createElement('p');
        notes.className = 'quest-notes';
        notes.textContent = quest.notes;
        card.appendChild(notes);
      }

      frag.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(frag);
  }catch(err){
    console.error('Quest board failed', err);
    container.innerHTML = '<p class="muted">Unable to load quests right now. Try refreshing later.</p>';
  }
}

  function getBuildCards(){
    return SharedState.data.buildCards || {};
  }

  function getCurrentCharacterName(){
    const fromState = (State.data?.core?.name||'').trim();
    if(fromState) return fromState;
    const input = document.querySelector('#core_name');
    return (input?.value||'').trim();
  }

  function canJoinSession(session, name){
    const thisUni = (DATA.universities.find(u=>u.key===State.data?.university?.key)?.name) || '';
    if(!thisUni) return {ok:false, msg:'Pick a University in step 4 first.'};
    const players = Array.isArray(session.players) ? session.players : [];
    const cards = getBuildCards();
    for(const entry of players){
      const b = entry && entry.key ? cards[entry.key] : null;
      if(b && b.university && b.university === thisUni){
        return {ok:false, msg:`Another ${thisUni} student is already in this session. Choose a different session or college.`};
      }
    }
    return {ok:true};
  }


  /* =======================
     STEPS
  ======================= */
const STEPS = [
  {key:'intro',     title:'Welcome',          hint:'Overview & updates'},
  {key:'builder',   title:'Character Builder',hint:'Core, college, flavour'},
  {key:'join',      title:'Join a Session',   hint:'Reserve a seat'},
  {key:'summary',   title:'Summary & Export', hint:'Share or download'}
];



  let currentStep = 0;

  function focusCurrentTab(){
    const nav = document.getElementById('stepNav');
    if(!nav) return;
    const active = nav.querySelector('button[aria-selected="true"]');
    if(active){
      active.focus();
    }
  }

  function activateStep(idx, focusTab = false){
    if(Number.isNaN(idx) || idx < 0 || idx >= STEPS.length){
      return;
    }
    currentStep = idx;
    renderPanels();
    renderNav();
    if(focusTab){
      focusCurrentTab();
    }
  }

  function onStepRailKeydown(event){
    const target = event.target;
    if(!target || target.getAttribute('role') !== 'tab'){ return; }
    const key = event.key;
    const currentIndex = Number(target.dataset.index || '0');
    let nextIndex = null;
    if(key === 'ArrowRight' || key === 'ArrowDown'){
      nextIndex = (currentIndex + 1) % STEPS.length;
    } else if(key === 'ArrowLeft' || key === 'ArrowUp'){
      nextIndex = (currentIndex - 1 + STEPS.length) % STEPS.length;
    } else if(key === 'Home'){
      nextIndex = 0;
    } else if(key === 'End'){
      nextIndex = STEPS.length - 1;
    }
    if(nextIndex !== null){
      event.preventDefault();
      activateStep(nextIndex, true);
    }
  }

  function renderNav(){
    const nav = document.getElementById('stepNav');
    if(!nav) return;

    const previousScroll = nav.scrollLeft;
    nav.innerHTML = '';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Character builder steps');

    const fragments = document.createDocumentFragment();
    STEPS.forEach((s, idx)=>{
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `step-tab-${s.key}`;
      button.className = 'step-pill';
      button.dataset.step = s.key;
      button.dataset.index = String(idx);
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `panel-${s.key}`);
      const selected = idx === currentStep;
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.setAttribute('tabindex', selected ? '0' : '-1');
      const hint = s.hint ? `<small>${escapeHTML(s.hint)}</small>` : '';
      button.innerHTML = `
        <span class="step-number">${idx + 1}</span>
        <span class="step-label"><span>${escapeHTML(s.title)}</span>${hint}</span>
      `;
      button.addEventListener('click', ()=>{
        activateStep(idx, true);
      });
      fragments.appendChild(button);
    });
    nav.appendChild(fragments);

    if(!nav.dataset.keysBound){
      nav.addEventListener('keydown', onStepRailKeydown);
      nav.dataset.keysBound = 'true';
    }

    if(nav.scrollWidth > nav.clientWidth + 8){
      const active = nav.querySelector('button[aria-selected="true"]');
      if(active){
        try{
          active.scrollIntoView({block:'nearest', inline:'center'});
        }catch{
          /* ignore */
        }
      }
    }else{
      nav.scrollLeft = previousScroll;
    }

    const badge=document.getElementById('cfgBadge');
    const errs=validateConfig();
    badge.textContent = errs.length? `⚠️ ${errs.length} config issue${errs.length>1?'s':''}` : '✅ config OK';
  }

  function renderPanels(){
    const el = document.getElementById('panels');
    if(!el) return;
    el.innerHTML='';
    const step = STEPS[currentStep].key;
    let panelEl = null;
    if(step==='builder') panelEl = panelBuilder();
    if(step==='summary') panelEl = panelSummary();
    if(step==='intro') panelEl = panelIntro();
    if(step==='join') panelEl = panelJoin();
    if(panelEl){
      panelEl.id = `panel-${step}`;
      panelEl.setAttribute('role','tabpanel');
      panelEl.setAttribute('aria-labelledby', `step-tab-${step}`);
      panelEl.setAttribute('tabindex','0');
      el.appendChild(panelEl);
    }

  }

  /* =======================
     PANELS
  ======================= */
function panelIntro(){
  const p = document.createElement('div');
  p.className = 'panel';
  p.innerHTML = `
<details class="scroll-letter" open>
  <summary>
    <span class="seal">✶</span>
    Official Correspondence: The Oracle Qualification Trials
    <span class="chev">▶</span>
  </summary>

  <div class="scroll-content">
    <div style="text-align:center; font-style:italic; color:var(--muted); margin-bottom:1rem;">
      From the Office of the Dean of Arcane Affairs<br>
      Strixhaven University — The Premier Institution of Magical Learning in the World<br>
      <small>Founded by the Five Dragons — Velomachus, Galazeth, Tanazir, Shadrix, and Beledros</small>
    </div>

    <hr style="border:none;border-top:1px dotted var(--border);margin:1rem 0;">

    <p><strong>Winter Term • Year 739 of Archavios</strong></p>
    <p><em>An Invitation to the Learned and the Brave,</em></p>

    <p>In preparation for this century’s selection of the Oracle Apprentice, the University will conduct a series of sanctioned field examinations. Each Trial is designed to assess essential qualities of leadership, wisdom, and magical aptitude expected of one who may one day inherit the Oracle’s mantle. <br><br>

    Participants will represent their chosen college and be evaluated by a panel of distinguished faculty and arcane observers. Though each Trial varies in format, all share a single purpose — to illuminate the heart, mind, and will of every contender.<br>

    <p>Strixhaven is honoured to welcome distinguished students and faculty from magical academies across the planes for this year’s Oracle Trials. Each institution brings its own traditions, theories, and flavour of chaos to the proceedings — ensuring that no two duels, debates, or dissertations are ever the same.</p>

    <div class="table-scroll letter-table">
      <table class="table">
        <thead><tr><th>College</th><th>Field of Study</th><th>Founder Dragon</th></tr></thead>
        <tbody>
          <tr><td><strong>Lorehold</strong></td><td>History & Archaeomancy</td><td>Velomachus Lorehold</td></tr>
          <tr><td><strong>Prismari</strong></td><td>Elemental Arts & Expression</td><td>Galazeth Prismari</td></tr>
          <tr><td><strong>Quandrix</strong></td><td>Numeromancy & Natural Mathematics</td><td>Tanazir Quandrix</td></tr>
          <tr><td><strong>Silverquill</strong></td><td>Eloquence, Rhetoric, & Word Magic</td><td>Shadrix Silverquill</td></tr>
          <tr><td><strong>Witherbloom</strong></td><td>Essence Studies: Life & Death</td><td>Beledros Witherbloom</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Student Expectations</strong><br>
      Arrive prepared for adventure, study, and a modest amount of chaos.<br>
      Dice, imagination, and one’s best festive attire recommended.<br>
      Non-finalists may appear as professors, spirits, or helpful onlookers via “Supporter Cards.”<br>
      Cooperation, roleplay, and good humour will be rewarded; detentions will be minimal.
    </p>
    
    <section class="news-board" id="newsBoard">
  <h3>Games & Trials</h3>
  <p class="muted">All scholars will compete in select Trials, contributing their unique philosophies to the greater pursuit of magical mastery. Some seek prestige, others enlightenment — a few, simply the catering.</p>
<p>Dates (Happening in the Mortal World)</p>
<p><strong>3 Preliminary College Quests: December 21–29<br>
Grand Oracle Trial: January 1</strong></p>
<p>(Trials hosted in the mortal realm by Professors Kaela and Tory. Potluck encouraged.)</p>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Trial I: The Bog Expedition (Date TBD)</span>
      <span class="chev" aria-hidden="true">▶</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Theme:</strong> Resilience & Compassion</li>
        <li><strong>Focus:</strong> Problem-solving, teamwork, and moral decisions under pressure.</li>
        <li><strong>Setting:</strong> Witherbloom’s Detention Bog.</li>
        <li><strong>Premise:</strong> Participants are sent to assist Witherbloom faculty in recovering lost alchemical crates.</li>
      </ul>
    </div>
  </details>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Trial II: The Masquerade of Mirrors (Date TBD)</span>
      <span class="chev" aria-hidden="true">▶</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Theme:</strong> Wisdom & Integrity</li>
        <li><strong>Focus:</strong> Deception, charm, and truth-seeking.</li>
        <li><strong>Setting:</strong> The Winter Masquerade Ball, hosted by Silverquill and Prismari.</li>
        <li><strong>Premise:</strong> Contestants attend an extravagant gala where faculty and students vie for influence.</li>
      </ul>
    </div>
  </details>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Trial III: The Trial of the Ruins (Date TBD)</span>
      <span class="chev" aria-hidden="true">▶</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Theme:</strong> Courage & Judgement.</li>
        <li><strong>Focus:</strong> Exploration, strategy, and moral courage.</li>
        <li><strong>Setting:</strong> The Fortress Badlands.</li>
        <li><strong>Premise:</strong> This test appears to be a straightforward recovery mission. Retrieve relics from ancient battlefields.</li>
      </ul>
    </div>
  </details>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Finale: The Oracle’s Convergence (January 1, 2026)</span>
      <span class="chev" aria-hidden="true">▶</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Focus:</strong> Everyone together — chaos, redemption, and a vote for destiny.</li>
        <li><strong>Format:</strong> Hybrid roleplay + short “tournament” style mini-games.</li>
        <li><strong>Structure:</strong> Reunion Scene: All characters (kids & adults) witness the Oracle’s unstable spirit forming.</li>
        <li><strong>Challenges:</strong> 
          <li>Puzzle of Insight (Wisdom)</li>
          <li>Duel of Flames (Power)
          <li>Debate of Hearts (Charisma)
          <li><strong>Audience votes or donates coins/tokens to alter results.</strong></li>
      </ul>
      <p><strong>Final Choice:</strong> Whoever wins or earns the group’s vote becomes the Oracle Apprentice.</p>
    </div>
  </details>
</section>

    <p>Should you accept, please confirm attendance and college preference. Positions are limited, and the Founders favour the punctual.</p>

    <p style="margin-top:1.1rem;">
      <strong>With warm regards and arcane esteem,</strong><br><br>
      <em>Professor Kaela of House Glissandiants</em><br>
      <em>Contact kaelacaron@gmail.com</em><br>
      <em>Department of Druidic Studies</em><br><br>
      <em>Professor Tory of House Wittatude</em><br>
      <em>School of Bardic Applications</em><br><br>
      <strong>Strixhaven University of Magic and Mystery</strong>
    </p>

    <p style="text-align:center; font-style:italic; margin-top:1rem;">“To discover, preserve, and share the boundless wonders of magic.”</p>
  </div>
</details>

<section class="quest-board" id="questBoard">
  <h3>Quest Board</h3>
  <p class="muted">Live adventures pulled from the Oracle Trials database snapshot.</p>
  <div id="questList" class="quest-list" role="list">
    <p class="muted">Loading quests…</p>
  </div>
</section>

<section class="news-board" id="newsBoard">
  <h3>Announcements &amp; Updates</h3>
  <p class="muted">Drop in quick notes for the group. Duplicate the sample dropdown below to add more updates.</p>
  <details class="news-item" open>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Sample Update — Replace Me</span>
      <span class="chev" aria-hidden="true">▶</span>
    </summary>
    <div class="news-body">
      <p>Share schedule changes, supply lists, or links here. Copy this entire <code>&lt;details class="news-item"&gt;</code> block to post another note.</p>
      <ul>
        <li><strong>When:</strong> Example date and time</li>
        <li><strong>Where:</strong> Library of the Biblioplex</li>
        <li><strong>Bring:</strong> Dice, pencils, favourite snack</li>
      </ul>
    </div>
  </details>
</section>

<section class="comment-board" id="commentBoard">
  <h3>Comments &amp; Notes</h3>
  <p class="muted">Jot reminders or questions for the group. Comments sync through the Oracle Archives so everyone stays in the loop.</p>
  <form id="commentForm" class="comment-form">
    <div class="comment-form-grid">
      <div class="form-field">
        <label for="commentPlayer">Player name (optional)</label>
        <input id="commentPlayer" name="commentPlayer" autocomplete="off" placeholder="e.g., Tamsin Rowe" />
      </div>
      <div class="form-field">
        <label for="commentCharacter">Character name (optional)</label>
        <input id="commentCharacter" name="commentCharacter" autocomplete="off" placeholder="e.g., Althea the Clever" />
      </div>
      <div class="form-field">
        <label for="commentSession">Session ID (optional)</label>
        <input id="commentSession" name="commentSession" autocomplete="off" placeholder="e.g., s3 or finale" />
      </div>
    </div>
    <label for="commentText">Add a comment</label>
    <textarea id="commentText" name="commentText" placeholder="Thanks for the invite! I'll bring cocoa." aria-label="Comment text"></textarea>
    <div class="comment-actions">
      <button type="button" id="refreshComments" class="secondary">Refresh</button>
      <button type="submit" class="primary">Post Comment</button>
    </div>
    <p id="commentStatus" class="comment-status" aria-live="polite" role="status" hidden></p>
  </form>
  <div id="commentList" class="comment-list" aria-live="polite"></div>
</section>

  `;
  setupCommentBoard(p);
  hydrateQuestBoard(p);
  return p;
}





  function panelBuilder(){
    const p = document.createElement('div');
    p.className = 'panel';
    p.innerHTML = `
      <h2>Character Builder</h2>
      <div class="card">
        <p>Complete each accordion below. Save a section once you’ve filled the fields — you can revisit and update any time.</p>
      </div>
      <details class="builder-section" open>
        <summary>
          <span>Core 5e Setup</span>
          <small class="muted">Stats, species, class</small>
        </summary>
        <div class="section-body">
          <div class="callout" aria-label="Character creation instructions">
            <strong>Quick build checklist:</strong>
            <ul>
              <li>Enter your <strong>player name</strong> and <strong>character name</strong>.</li>
              <li>Pick a race, class, background, level, and ability score method.</li>
              <li>Select starting equipment — class kit or 50 gp.</li>
              <li>Need a refresher? Try the <a href="https://dnd.wizards.com/resources/character-sheets" target="_blank" rel="noreferrer">official D&D 5e character sheets</a>.</li>
            </ul>
          </div>
          <div class="grid cols-2">
            <div><label>Player Name</label><input id="core_player" placeholder="e.g., Kaela" /></div>
            <div><label>Character Name</label><input id="core_name" placeholder="e.g., Aria Winterborn" /></div>
            <div><label>Level</label><select id="core_level"></select></div>
            <div><label>Race</label><input id="core_race" placeholder="Any 5e race" /></div>
            <div><label>Class</label><input id="core_class" placeholder="Any 5e class" /></div>
            <div><label>Background</label><input id="core_background" placeholder="PHB/Custom" /></div>
            <div>
              <label>Ability Scores</label>
              <div class="row">
                <select id="ability_method">
                  <option value="standard">Standard Array (15,14,13,12,10,8)</option>
                  <option value="manual">Manual Entry</option>
                </select>
                <select id="equipment">
                  <option value="class">Class Starting Equipment</option>
                  <option value="50gp">50 gp</option>
                </select>
              </div>
            </div>
          </div>
          <div id="ability_box" class="two" style="margin-top:10px"></div>
          <div class="section-actions">
            <button class="primary" id="save_core">Save Core Setup</button>
            <span class="muted" data-save-note="core"></span>
          </div>
        </div>
      </details>
      <details class="builder-section">
        <summary>
          <span>University & Feat</span>
          <small class="muted">Select your college</small>
        </summary>
        <div class="section-body">
          <div class="grid cols-2">
            <div>
              <label>Choose University</label>
              <select id="uni"></select>
            </div>
            <div>
              <label>Strixhaven Initiate — Spellcasting Ability</label>
              <select id="spell_ability"><option>INT</option><option>WIS</option><option>CHA</option></select>
            </div>
          </div>
          <div id="uni_info" class="card" style="margin-top:10px"></div>
          <div class="section-actions">
            <button class="primary" id="save_university">Save University</button>
            <span class="muted" data-save-note="university"></span>
          </div>
        </div>
      </details>
      <details class="builder-section">
        <summary>
          <span>Job & Extracurriculars</span>
          <small class="muted">Schedule & flavour</small>
        </summary>
        <div class="section-body">
          <div class="grid cols-2">
            <div>
              <label>Job (optional, 5 gp/week)</label>
              <select id="job"><option value="">— None —</option>${DATA.jobs.map(j=>`<option value="${j.key}">${j.name}</option>`).join('')}</select>
            </div>
            <div>
              <label>Extracurriculars (pick up to 2; 1 if you also take a job)</label>
              <div id="clublist" class="grid cols-2" style="max-height:240px;overflow:auto"></div>
            </div>
          </div>
          <div id="bonus_readout" class="callout" style="margin-top:10px"></div>
          <div class="section-actions">
            <button class="primary" id="save_extras">Save Job & Clubs</button>
            <span class="muted" data-save-note="extras"></span>
          </div>
        </div>
      </details>
      <details class="builder-section">
        <summary>
          <span>Personality & Prompt</span>
          <small class="muted">Backstory beats</small>
        </summary>
        <div class="section-body">
          <div class="grid cols-2">
            <div><label>Traits (1–2)</label><textarea id="traits" rows="3" placeholder="e.g., Curious, dry humour"></textarea></div>
            <div><label>Ideal</label><textarea id="ideal" rows="3" placeholder="e.g., Knowledge must be shared."></textarea></div>
            <div><label>Bond / Friend / Rival</label><textarea id="bond" rows="3" placeholder="Name someone you’re tied to (or opposed to)"></textarea></div>
            <div><label>Goal</label><textarea id="goal" rows="3" placeholder="What do you want from the Oracle Trials?"></textarea></div>
          </div>
          <div class="card" style="margin-top:10px">
            <div class="kicker">Quick-Start Character Prompt</div>
            <div id="prompt_box" class="flex" style="margin-top:6px"></div>
          </div>
          <div class="section-actions">
            <button class="primary" id="save_personality">Save Personality</button>
            <span class="muted" data-save-note="personality"></span>
          </div>
        </div>
      </details>
      <div class="controls">
        <div class="left"><button id="back_builder">← Back</button></div>
        <div class="right"><button class="primary" id="next_builder">Next →</button></div>
      </div>
    `;

    function markSaved(section, msg){
      const target = p.querySelector(`[data-save-note="${section}"]`);
      if(target){
        target.textContent = msg;
      }
    }

    // Core setup
    const levelSel = p.querySelector('#core_level');
    DATA.levels.forEach(l=>{ const o=document.createElement('option'); o.value=l; o.textContent=l; levelSel.appendChild(o); });

    const box = p.querySelector('#ability_box');
    function drawAbilityInputs(){
      box.innerHTML='';
      const m = p.querySelector('#ability_method').value;
      const abilities = ['STR','DEX','CON','INT','WIS','CHA'];
      if(m==='standard'){
        const arr = DATA.abilityArrays.standard.slice();
        abilities.forEach((ab)=>{
          const d=document.createElement('div'); d.className='card';
          d.innerHTML=`<label>${ab}</label><select data-ab="${ab}">${arr.map(v=>`<option value="${v}">${v}</option>`).join('')}</select>`;
          box.appendChild(d);
        });
      } else {
        abilities.forEach(ab=>{
          const d=document.createElement('div'); d.className='card';
          d.innerHTML=`<label>${ab}</label><input type="number" min="3" max="18" value="10" data-ab="${ab}" />`;
          box.appendChild(d);
        });
      }
    }
    p.querySelector('#ability_method').addEventListener('change', drawAbilityInputs);
    drawAbilityInputs();

    const s = State.data.core;
    p.querySelector('#core_player').value = s.playerName || '';
    p.querySelector('#core_name').value = s.name;
    p.querySelector('#core_race').value = s.race;
    p.querySelector('#core_class').value = s.class;
    p.querySelector('#core_background').value = s.background;
    p.querySelector('#core_level').value = s.level;
    p.querySelector('#ability_method').value = s.abilityMethod;
    p.querySelector('#equipment').value = s.equipment;
    drawAbilityInputs();
    const abilities = ['STR','DEX','CON','INT','WIS','CHA'];
    abilities.forEach(ab=>{
      const el = box.querySelector(`[data-ab="${ab}"]`);
      if(el){ el.value = s.abilities?.[ab] ?? el.value; }
    });

    p.querySelector('#save_core').onclick = ()=>{
      const abObj = {};
      abilities.forEach(ab=>{
        const el = box.querySelector(`[data-ab="${ab}"]`);
        abObj[ab] = parseInt(el.value,10);
      });
      State.data.core = {
        playerName: p.querySelector('#core_player').value.trim(),
        name: p.querySelector('#core_name').value.trim(),
        race: p.querySelector('#core_race').value.trim(),
        class: p.querySelector('#core_class').value.trim(),
        background: p.querySelector('#core_background').value.trim(),
        level: parseInt(p.querySelector('#core_level').value,10),
        abilityMethod: p.querySelector('#ability_method').value,
        abilities: abObj,
        equipment: p.querySelector('#equipment').value
      };
      markSaved('core','Core details saved.');
    };

    // University
    const sel=p.querySelector('#uni');
    sel.innerHTML = `<option value="">— Select —</option>`+DATA.universities.map(u=>`<option value="${u.key}">${u.name}</option>`).join('');
    function drawInfo(){
      const key = sel.value; const out=p.querySelector('#uni_info');
      if(!key){ out.innerHTML='<span class="muted">Select a university to view theme & bonus spells.</span>'; return; }
      const u = DATA.universities.find(x=>x.key===key);
      const spellRows = Object.entries(u.spells).map(([lvl,list])=>`<tr><td>${lvl}</td><td>${list.join(', ')}</td></tr>`).join('');
      out.innerHTML = `
        <div class="two">
          <div>
            <div class="kicker">Theme</div><div>${u.theme}</div>
            <div class="kicker" style="margin-top:6px">Focus</div><div>${u.focus}</div>
            <div class="kicker" style="margin-top:6px">Colours</div><div>${u.colours}</div>
            <div class="kicker" style="margin-top:6px">Playstyle</div><div>${u.playstyle}</div>
          </div>
          <div>
            <div class="kicker">Bonus Spells</div>
            <table class="table"><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>${spellRows}</tbody></table>
          </div>
        </div>
        <div class="callout" style="margin-top:8px"><strong>Feat:</strong> ${DATA.feats.strixhavenInitiate.name} — ${DATA.feats.strixhavenInitiate.text}</div>
      `;
    }
    sel.addEventListener('change', drawInfo);
    sel.value = State.data.university.key || '';
    p.querySelector('#spell_ability').value = State.data.university.spellAbility || 'INT';
    drawInfo();
    p.querySelector('#save_university').onclick = ()=>{
      State.data.university={ key: sel.value, spellAbility: p.querySelector('#spell_ability').value };
      if(!State.data.university.key){ alert('Pick a university to continue.'); return; }
      if(!State.data.feats.find(f=>f.name==='Strixhaven Initiate')){
        State.data.feats.push({name:'Strixhaven Initiate', ability: State.data.university.spellAbility });
      } else {
        State.data.feats = State.data.feats.map(f=> f.name==='Strixhaven Initiate'? {...f, ability: State.data.university.spellAbility }: f);
      }
      markSaved('university','University saved.');
    };

    // Extras
    const clubWrap = p.querySelector('#clublist');
    function drawClubs(){
      clubWrap.innerHTML='';
      DATA.extracurriculars.forEach(c=>{
        const id=`club_${c.key}`;
        const d=document.createElement('label'); d.className='card'; d.style.cursor='pointer';
        d.innerHTML=`<div class="flex"><input type="checkbox" id="${id}" data-key="${c.key}" /> <div><strong>${c.name}</strong><div class="muted">Student Die (d4): ${c.skills.join(' / ')}</div></div></div>`;
        clubWrap.appendChild(d);
      });
    }
    drawClubs();

    const jobSel = p.querySelector('#job');
    jobSel.value = State.data.extras.job || '';
    (State.data.extras.clubs||[]).forEach(k=>{ const el = clubWrap.querySelector(`[data-key="${k}"]`); if(el) el.checked=true; });

    function readExtras(){
      const jobKey = jobSel.value || null;
      const pickedClubs = [...clubWrap.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.dataset.key);
      const maxClubs = jobKey?1:2;
      if(pickedClubs.length>maxClubs){
        const last = pickedClubs.pop();
        clubWrap.querySelector(`[data-key="${last}"]`).checked=false;
      }
      const job = DATA.jobs.find(j=>j.key===jobKey);
      const clubs = DATA.extracurriculars.filter(c=>pickedClubs.includes(c.key));
      const parts=[];
      if(job) parts.push(`<span class="tag">Job: ${job.name} — d4: ${job.skills.join(' / ')}</span>`);
      clubs.forEach(c=>parts.push(`<span class="tag">Club: ${c.name} — d4: ${c.skills.join(' / ')}</span>`));
      p.querySelector('#bonus_readout').innerHTML = parts.length? parts.join(' '): '<span class="muted">Pick a job and/or clubs to see Student Dice bonuses.</span>';
      return { job: jobKey, clubs: pickedClubs };
    }

    jobSel.addEventListener('change', readExtras);
    clubWrap.addEventListener('change', readExtras);
    readExtras();

    p.querySelector('#save_extras').onclick = ()=>{
      const {job, clubs} = readExtras();
      State.data.extras.job = job;
      State.data.extras.clubs = clubs;
      markSaved('extras','Schedule saved.');
    };

    // Personality
    const quickPrompts = [
      {u:'Lorehold', text:'A cheerful necro-historian who argues with ghosts about footnotes.'},
      {u:'Prismari', text:'A kinetic dancer who keeps leaving frost footprints after cantrips.'},
      {u:'Quandrix', text:'A fractal botanist who names houseplants after famous equations.'},
      {u:'Silverquill', text:'A sunny orator who spotlights corruption with literal light.'},
      {u:'Witherbloom', text:'A swamp witch medic who collects bones “for research.”'}
    ];
    const boxPrompts=p.querySelector('#prompt_box');
    quickPrompts.forEach(q=>{
      const b=document.createElement('button'); b.className='pill'; b.type='button';
      b.innerHTML = `<span>${q.u}</span><span>•</span><span>${q.text}</span>`;
      b.onclick=()=>{ State.data.personality.prompt = q.text; Array.from(boxPrompts.children).forEach(x=>x.classList.remove('success')); b.classList.add('success'); };
      boxPrompts.appendChild(b);
      if(State.data.personality.prompt===q.text) b.classList.add('success');
    });

    p.querySelector('#traits').value = State.data.personality.traits||'';
    p.querySelector('#ideal').value = State.data.personality.ideal||'';
    p.querySelector('#bond').value = State.data.personality.bond||'';
    p.querySelector('#goal').value = State.data.personality.goal||'';

    p.querySelector('#save_personality').onclick=()=>{
      State.data.personality={
        traits: p.querySelector('#traits').value.trim(),
        ideal: p.querySelector('#ideal').value.trim(),
        bond: p.querySelector('#bond').value.trim(),
        goal: p.querySelector('#goal').value.trim(),
        prompt: State.data.personality.prompt||''
      };
      markSaved('personality','Personality saved.');
    };

    p.querySelector('#back_builder').onclick = ()=>{ activateStep(STEPS.findIndex(s=>s.key==='intro')); };
    p.querySelector('#next_builder').onclick = ()=>{ activateStep(STEPS.findIndex(s=>s.key==='join')); };

    return p;
  }
    function panelJoin(){
  const p=document.createElement('div'); p.className='panel';
  p.innerHTML = `
    <h2>Join a Session</h2>
    <div class="card">
      <p>Pick a table for your finished character. You’ll need a <strong>Name</strong>, <strong>Class</strong>, <strong>Level</strong>, and a chosen <strong>University</strong>.</p>
    </div>
    ${IS_GUEST_SESSION ? '<div class="card" role="note"><p class="muted">Guest mode is read-only. Use your personal access code to reserve a seat.</p></div>' : ''}
    <div id="join_list" class="grid"></div>
    <div class="controls">
      <div class="left"><button id="back_join">← Back</button></div>
      <div class="right"><button class="primary" id="to_summary">Next →</button></div>
    </div>
  `;

  const wrap = p.querySelector('#join_list');
  renderSessionCards(wrap, {readOnly: IS_GUEST_SESSION}); // hides the join button when read-only

  // click handlers for join + ics
  wrap.addEventListener('click', (ev)=>{
    const addBtn = ev.target.closest('button.primary[data-id]');
    if(addBtn){
      if(IS_GUEST_SESSION){
        alert(READ_ONLY_NOTICE);
        return;
      }
      const id = addBtn.getAttribute('data-id');
      const s = (State.sessions||[]).find(x=>x.id===id);
      const name = (State.data.core.name||'').trim();
      if(!name){ alert('Give your character a name (Core 5e).'); return; }
      if (ELIGIBILITY.hardNo.includes(name)) { alert(`${name} is marked as not playing.`); return; }
      if ((ELIGIBILITY.blockedDates[name]||[]).includes(s.date)) { alert(`${name} isn't available for ${s.date}.`); return; }
      const players = Array.isArray(s.players) ? s.players : [];
      if(players.some(player => sanitizeName(player && player.character) === sanitizeName(name))){
        alert('This character is already in that session.');
        return;
      }
      if(players.some(player => rosterKey(player && player.key) === CURRENT_PLAYER_KEY)){
        alert('Your access code already has a seat in this session.');
        return;
      }
      if(players.length>=s.capacity){ alert('That session is full.'); return; }
      // enforce unique university
      const uniName = (DATA.universities.find(u=>u.key===State.data.university.key)?.name)||'';
      const builds = getBuildCards();
      if(uniName){
        for(const player of players){
          const b = player && player.key ? builds[player.key] : null;
          if(b && b.university === uniName){
            alert(`Another ${uniName} student is already in this session. Choose a different session or college.`);
            return;
          }
        }
      }
      const klass = State.data.core.class || '';
      const rosterEntry = PlayerIdentity.getRosterEntry();
      Backend.joinSession(id, {
        name,
        characterName: name,
        playerKey: CURRENT_PLAYER_KEY,
        playerName: rosterEntry?.name,
        build:{ class: klass, university: uniName }
      })
        .then(()=>{
          renderSessionCards(wrap, {readOnly: IS_GUEST_SESSION});
          alert(`Added ${name} to ${s.title}.`);
        })
        .catch((err)=>{
          alert(`Unable to join ${s.title}: ${err && err.message ? err.message : 'Request failed.'}`);
        });
      return;
    }
    const icsBtn = ev.target.closest('button[data-ics]');
    if(icsBtn){
      const id = icsBtn.getAttribute('data-ics');
      const s = State.sessions.find(x=>x.id===id);
      downloadICS(s);
    }
  });

  p.querySelector('#back_join').onclick = ()=>{ activateStep(STEPS.findIndex(s=>s.key==='builder')); };
  p.querySelector('#to_summary').onclick= ()=>{ activateStep(STEPS.findIndex(s=>s.key==='summary')); };
  return p;
}


  function panelSummary(){
    const p=document.createElement('div'); p.className='panel';
    const s=State.data;
    const uni = DATA.universities.find(u=>u.key===s.university.key);
    const abilityList = Object.entries(s.core.abilities||{}).map(([k,v])=>`<span class="tag">${k}: ${v}</span>`).join(' ');
    const clubs = (s.extras.clubs||[]).map(k=> DATA.extracurriculars.find(c=>c.key===k)?.name).filter(Boolean);
    const jobName = DATA.jobs.find(j=>j.key===s.extras.job)?.name || '—';

    p.innerHTML = `
      <h2>Summary</h2>
      <div class="grid cols-2">
        <div class="card">
          <div class="kicker">Character</div>
          <div><strong>${s.core.name||'Unnamed'}</strong></div>
          <div class="muted">Player: ${s.core.playerName || '—'}</div>
          <div class="muted">${s.core.race||'Race?'} • ${s.core.class||'Class?'} • Level ${s.core.level||3}</div>
          <div style="margin-top:8px">${abilityList}</div>
          <div style="margin-top:8px" class="muted">Background: ${s.core.background||'—'} • Equipment: ${s.core.equipment==='50gp'?'50 gp':'Class kit'}</div>
        </div>
        <div class="card">
          <div class="kicker">University & Feat</div>
          <div><strong>${uni?uni.name:'—'}</strong> <span class="muted">(${uni?uni.colours:'—'})</span></div>
          <div class="muted">Spellcasting Ability for Initiate: ${s.university.spellAbility||'INT'}</div>
        </div>
        <div class="card">
          <div class="kicker">Job & Clubs</div>
          <div>Job: <strong>${jobName}</strong></div>
          <div>Clubs: ${clubs.length? clubs.join(', '): '—'}</div>
        </div>
        <div class="card">
          <div class="kicker">Personality</div>
          <div>${s.personality.traits||''}</div>
          <div class="muted">Ideal: ${s.personality.ideal||''}</div>
          <div class="muted">Bond/Rival/Friend: ${s.personality.bond||''}</div>
          <div class="muted">Goal: ${s.personality.goal||''}</div>
          <div class="muted" style="margin-top:6px">Prompt: ${s.personality.prompt||'—'}</div>
        </div>
      </div>
      <div class="controls">
        <div class="left"><button id="back_s">← Back</button></div>
        <div class="right">
          <button id="publish_roster">Add to Availability Roster</button>
          <button id="save_s">Save Draft</button>
          <button id="export_s" class="primary">Export JSON</button>
          <button id="pdf_s" class="success">Print / PDF</button>
        </div>
      </div>
    `;
    p.querySelector('#back_s').onclick=()=>{activateStep(STEPS.findIndex(s=>s.key==='builder'));};
    p.querySelector('#save_s').onclick=()=>State.save();
    p.querySelector('#export_s').onclick=()=>State.export();
    p.querySelector('#pdf_s').onclick=()=>window.print();
    const publishBtn = p.querySelector('#publish_roster');
    if(publishBtn){
      if(IS_GUEST_SESSION){
        publishBtn.disabled = true;
        publishBtn.title = READ_ONLY_NOTICE;
        publishBtn.textContent = 'Roster editing disabled for guests';
      }else{
        publishBtn.onclick = async ()=>{
          const name = sanitizeName(State.data?.core?.name);
          if(!name){ alert('Give your character a name in Core Setup first.'); return; }
          const key = rosterKey(name);
          const noteParts = [];
          if(State.data?.core?.class) noteParts.push(State.data.core.class);
          const uniName = uni ? uni.name : (DATA.universities.find(u=>u.key===State.data?.university?.key)?.name || '');
          if(uniName) noteParts.push(uniName);
          const notes = noteParts.join(' • ');
          const status = 'Interested';
          if(rosterHasKey(key)){
            const roster = getRosterList();
            const entry = roster.find(r=>r.key===key) || {name, custom:false};
            try{
              await updateRosterDetails(key, entry, status, notes);
              alert(`${name} is already on the roster. Updated their status and notes.`);
            }catch(err){
              alert(`Failed to update roster entry: ${err && err.message ? err.message : 'Request failed.'}`);
            }
          } else {
            const result = await addRosterExtra(name, status, notes);
            if(!result.ok){ alert(result.msg); return; }
            alert(`${name} added to the roster.`);
          }
        };
      }
    }
    return p;
  }

  /* =======================
     BOOT
  ======================= */
  function renderAll(){
    try{
      renderNav();
      renderPanels();
      bindHeaderActions();
    } catch(err){
      showErrors([`Render failed: ${String(err && err.message || err)}`]);
      console.error(err);
    }
  }
  function bindHeaderActions(){
    const s = document.getElementById('btnSave'); if(s) s.onclick=()=>State.save();
    const l = document.getElementById('btnLoad'); if(l) l.onclick=()=>State.load();
    const e = document.getElementById('btnExport'); if(e) e.onclick=()=>State.export();
    const clr=document.getElementById('btnClear');
    if(clr){ clr.onclick=()=>{
      if(confirm('Clear all local data for this app?')){
        LocalDraftStore.clear();
        localStorage.removeItem('oracleOfflineState');
        alert('Local data cleared. Reloading…');
        location.reload();
      }
    }}
  }

  (async function(){
    const errs = validateConfig();
    if(errs.length){ showErrors(errs); bindHeaderActions(); return; }
    try{
      await SharedState.refresh();
    }catch(err){
      console.warn('Initial sync failed', err);
      NetworkStatus.setError('Unable to reach the shared datastore. Showing cached data if available.');
    }
    renderAll();
  })();
