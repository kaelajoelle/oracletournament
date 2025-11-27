const assert = require('node:assert/strict');
const test = require('node:test');

const { createSupabaseTablesAdapter } = require('../supabase-tables');

const sanitizeOptional = (value) => (value == null ? '' : String(value).trim());
const sanitizeName = (value) => sanitizeOptional(value);
const rosterKey = (value) => sanitizeOptional(value).toLowerCase();
const decodeRosterMeta = (status, notes, hidden) => ({
  status: sanitizeOptional(status),
  notes: sanitizeOptional(notes),
  hidden: Boolean(hidden),
});
const encodeRosterMeta = (status, notes, hidden) => ({
  status: sanitizeOptional(status) || null,
  notes: sanitizeOptional(notes) || null,
  hidden: hidden ? true : false,
});

const defaultSessions = [
  { id: 's1', title: 'Session 1', dm: '', date: '2025-12-21', capacity: 6, finale: false, players: [] },
];

const tables = {
  sessionsTable: 'sessions',
  sessionPlayersTable: 'session_players',
  rosterExtrasTable: 'roster_extras',
  rosterMetaTable: 'roster_meta',
  buildCardsTable: 'build_cards',
};

function createAdapter(overrides = {}) {
  return createSupabaseTablesAdapter({
    defaultSessions,
    normaliseState: (state = {}) => state,
    sanitizeName,
    sanitizeOptional,
    rosterKey,
    decodeRosterMeta,
    encodeRosterMeta,
    supabaseQuery: overrides.supabaseQuery,
    supabaseMutate: overrides.supabaseMutate || (async () => {}),
    updatePlayerAccessDisplayName: overrides.updatePlayerAccessDisplayName || (async () => {}),
    tables,
    getMetaSupportsHidden: overrides.getMetaSupportsHidden || (() => true),
    setMetaSupportsHidden: overrides.setMetaSupportsHidden || (() => {}),
  });
}

test('supabase tables adapter fetchState merges tables', async () => {
  const supabaseQuery = async (path) => {
    if (path.startsWith('sessions')) {
      return [{ id: 's1', title: 'DM Session', dm: 'DM', date: '2025-12-21', capacity: 8, finale: false }];
    }
    if (path.startsWith('session_players')) {
      return [{ session_id: 's1', player_key: 'hero', player_name: 'Hero' }];
    }
    if (path.startsWith('roster_extras')) {
      return [{ player_key: 'extra1', name: 'Extra', status: 'Ready', notes: 'note' }];
    }
    if (path.startsWith('roster_meta')) {
      return [{ player_key: 'hero', status: 'Active', notes: 'memo', hidden: true }];
    }
    if (path.startsWith('build_cards')) {
      return [{ player_key: 'hero', class: 'Wizard', university: 'Arcana', character_name: 'Hero' }];
    }
    return [];
  };
  const adapter = createAdapter({ supabaseQuery });

  const state = await adapter.fetchState();
  assert.equal(state.sessions[0].players.includes('Hero'), true);
  assert.equal(state.rosterExtras[0].name, 'Extra');
  assert.equal(state.rosterMeta.hero.hidden, true);
  assert.equal(state.buildCards.hero.class, 'Wizard');
});

test('supabase tables adapter disables hidden fallback when column missing', async () => {
  let metaHiddenRequested = 0;
  let supportsHidden = true;
  const supabaseQuery = async (path, { fallback } = {}) => {
    if (path.startsWith('roster_meta')) {
      if (path.includes('hidden') && metaHiddenRequested === 0) {
        metaHiddenRequested += 1;
        throw new Error('column "hidden" does not exist');
      }
      return [{ player_key: 'hero', status: 'Active', notes: '', hidden: false }];
    }
    return [];
  };
  const adapter = createAdapter({
    supabaseQuery,
    getMetaSupportsHidden: () => supportsHidden,
    setMetaSupportsHidden: (value) => {
      supportsHidden = value;
    },
  });

  await adapter.fetchState();
  assert.equal(supportsHidden, false);
});

test('supabase tables adapter replaceState writes to all tables', async () => {
  const calls = [];
  const supabaseMutate = async (path, options = {}) => {
    calls.push({ path, options });
  };
  const adapter = createAdapter({
    supabaseQuery: async () => [],
    supabaseMutate,
  });

  await adapter.saveState({
    sessions: [
      {
        id: 's1',
        title: 'Session 1',
        dm: 'DM',
        date: '2025-12-21',
        capacity: 6,
        players: [{ key: 'hero', character: 'Hero' }],
      },
    ],
    rosterExtras: [{ key: 'extra1', name: 'Extra' }],
    rosterMeta: { hero: { status: 'Active' } },
    buildCards: { hero: { class: 'Wizard' } },
  });

  const paths = calls.map((call) => call.path.split('?')[0]).sort();
  assert.ok(paths.includes('sessions'));
  assert.ok(paths.includes('session_players'));
  assert.ok(paths.includes('roster_extras'));
  assert.ok(paths.includes('roster_meta'));
  assert.ok(paths.includes('build_cards'));
});
