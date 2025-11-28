const assert = require('node:assert/strict');
const test = require('node:test');

const {
  saveOracleBuild,
  loadOracleBuild,
  loadAllOracleBuilds,
  sanitizeOptional,
  normalizePlayerKey,
  extractBuildFields,
} = require('../oracleBuilds');

// Mock Supabase client factory
function createMockSupabase(options = {}) {
  const {
    upsertError = null,
    selectData = null,
    selectError = null,
    selectAllData = [],
    selectAllError = null,
  } = options;

  return {
    from: (table) => ({
      upsert: async (data, opts) => {
        if (options.onUpsert) {
          options.onUpsert(table, data, opts);
        }
        return { error: upsertError };
      },
      select: (columns) => ({
        eq: (column, value) => ({
          limit: (count) => ({
            single: async () => {
              if (options.onSelect) {
                options.onSelect(table, columns, { column, value });
              }
              return { data: selectData, error: selectError };
            },
          }),
        }),
        order: (column, opts) => ({
          // Supabase returns errors in response object, doesn't throw
          then: (resolve) => {
            return resolve({ data: selectAllData, error: selectAllError });
          },
        }),
      }),
    }),
  };
}

// Extended mock for async operations
function createAsyncMockSupabase(options = {}) {
  const {
    upsertError = null,
    selectData = null,
    selectError = null,
    selectAllData = [],
    selectAllError = null,
  } = options;

  return {
    from: (table) => ({
      upsert: async (data, opts) => {
        if (options.onUpsert) {
          options.onUpsert(table, data, opts);
        }
        return { error: upsertError };
      },
      select: (columns) => {
        const chainable = {
          eq: (column, value) => {
            chainable._eq = { column, value };
            return chainable;
          },
          limit: (count) => {
            chainable._limit = count;
            return chainable;
          },
          single: async () => {
            if (options.onSelect) {
              options.onSelect(table, columns, chainable._eq);
            }
            return { data: selectData, error: selectError };
          },
          order: (column, opts) => {
            chainable._order = { column, opts };
            return chainable;
          },
          // Direct await resolution - Supabase returns errors in response, doesn't throw
          then: (resolve) => {
            return resolve({ data: selectAllData, error: selectAllError });
          },
        };
        return chainable;
      },
    }),
  };
}

test('sanitizeOptional handles various inputs', () => {
  assert.equal(sanitizeOptional(null), '');
  assert.equal(sanitizeOptional(undefined), '');
  assert.equal(sanitizeOptional(''), '');
  assert.equal(sanitizeOptional('  hello  '), 'hello');
  assert.equal(sanitizeOptional(123), '123');
});

test('normalizePlayerKey lowercases and trims', () => {
  assert.equal(normalizePlayerKey('PLAYER'), 'player');
  assert.equal(normalizePlayerKey('  Player  '), 'player');
  assert.equal(normalizePlayerKey(null), '');
});

test('extractBuildFields extracts class, university, characterName', () => {
  const result = extractBuildFields({
    class: 'Wizard',
    university: 'Arcana',
    characterName: 'Gandalf',
    otherField: 'ignored',
  });
  
  assert.equal(result.class, 'Wizard');
  assert.equal(result.university, 'Arcana');
  assert.equal(result.characterName, 'Gandalf');
});

test('extractBuildFields handles character_name alias', () => {
  const result = extractBuildFields({
    class: 'Rogue',
    character_name: 'Shadow',
  });
  
  assert.equal(result.class, 'Rogue');
  assert.equal(result.characterName, 'Shadow');
});

test('extractBuildFields handles null/undefined', () => {
  assert.deepEqual(extractBuildFields(null), {
    class: null,
    university: null,
    characterName: null,
  });
  
  assert.deepEqual(extractBuildFields(undefined), {
    class: null,
    university: null,
    characterName: null,
  });
});

test('extractBuildFields handles nested core object', () => {
  const result = extractBuildFields({
    core: {
      name: 'Aria',
      class: 'Mage',
    },
  });
  
  assert.equal(result.characterName, 'Aria');
  assert.equal(result.class, 'Mage');
  assert.equal(result.university, null);
});

test('extractBuildFields prefers top-level over core fields', () => {
  const result = extractBuildFields({
    class: 'Wizard',
    characterName: 'Gandalf',
    core: {
      name: 'CoreName',
      class: 'CoreClass',
    },
  });
  
  assert.equal(result.characterName, 'Gandalf');
  assert.equal(result.class, 'Wizard');
});

test('extractBuildFields handles nested university object', () => {
  const result = extractBuildFields({
    class: 'Bard',
    university: {
      key: 'lorehold',
      name: 'Lorehold College',
    },
  });
  
  assert.equal(result.class, 'Bard');
  assert.equal(result.university, 'lorehold');
});

test('extractBuildFields prefers university.key over university.name', () => {
  const result = extractBuildFields({
    university: {
      key: 'silverquill',
      name: 'Silverquill College',
    },
  });
  
  assert.equal(result.university, 'silverquill');
});

test('extractBuildFields falls back to university.name when key is missing', () => {
  const result = extractBuildFields({
    university: {
      name: 'Prismari College',
    },
  });
  
  assert.equal(result.university, 'Prismari College');
});

test('extractBuildFields handles legacy college field', () => {
  const result = extractBuildFields({
    class: 'Cleric',
    college: 'quandrix',
  });
  
  assert.equal(result.class, 'Cleric');
  assert.equal(result.university, 'quandrix');
});

test('extractBuildFields handles legacy school field', () => {
  const result = extractBuildFields({
    school: 'witherbloom',
  });
  
  assert.equal(result.university, 'witherbloom');
});

test('extractBuildFields prefers college over school', () => {
  const result = extractBuildFields({
    college: 'prismari',
    school: 'witherbloom',
  });
  
  assert.equal(result.university, 'prismari');
});

test('extractBuildFields full precedence: characterName > character_name > core.name', () => {
  // characterName wins
  let result = extractBuildFields({
    characterName: 'Winner',
    character_name: 'Loser1',
    core: { name: 'Loser2' },
  });
  assert.equal(result.characterName, 'Winner');
  
  // character_name wins when characterName is missing
  result = extractBuildFields({
    character_name: 'SecondPlace',
    core: { name: 'Loser' },
  });
  assert.equal(result.characterName, 'SecondPlace');
  
  // core.name used as fallback
  result = extractBuildFields({
    core: { name: 'Fallback' },
  });
  assert.equal(result.characterName, 'Fallback');
});

test('saveOracleBuild returns error for empty playerKey', async () => {
  const supabase = createMockSupabase();
  const { error } = await saveOracleBuild(supabase, '', { class: 'Wizard' });
  
  assert.ok(error);
  assert.equal(error.message, 'playerKey is required');
});

test('saveOracleBuild returns error for invalid supabase client', async () => {
  const { error } = await saveOracleBuild(null, 'player1', { class: 'Wizard' });
  
  assert.ok(error);
  assert.equal(error.message, 'Invalid supabase client');
});

test('saveOracleBuild calls upsert with correct payload', async () => {
  let capturedData = null;
  let capturedOpts = null;
  
  const supabase = createMockSupabase({
    onUpsert: (table, data, opts) => {
      capturedData = data;
      capturedOpts = opts;
    },
  });

  const build = {
    class: 'Wizard',
    university: 'Arcana',
    characterName: 'Gandalf',
    customField: 'value',
  };

  const { error } = await saveOracleBuild(supabase, 'PLAYER1', build);

  assert.equal(error, null);
  assert.equal(capturedData.player_key, 'player1'); // normalized
  assert.equal(capturedData.class, 'Wizard');
  assert.equal(capturedData.university, 'Arcana');
  assert.equal(capturedData.character_name, 'Gandalf');
  assert.deepEqual(capturedData.build_data, build);
  assert.ok(capturedData.updated_at);
  assert.deepEqual(capturedOpts, { onConflict: 'player_key' });
});

test('saveOracleBuild returns error from supabase', async () => {
  const supabase = createMockSupabase({
    upsertError: new Error('Database error'),
  });

  const { error } = await saveOracleBuild(supabase, 'player1', { class: 'Wizard' });

  assert.ok(error);
  assert.equal(error.message, 'Database error');
});

test('loadOracleBuild returns error for empty playerKey', async () => {
  const supabase = createAsyncMockSupabase();
  const { data, error } = await loadOracleBuild(supabase, '');

  assert.equal(data, null);
  assert.ok(error);
  assert.equal(error.message, 'playerKey is required');
});

test('loadOracleBuild returns error for invalid supabase client', async () => {
  const { data, error } = await loadOracleBuild(null, 'player1');

  assert.equal(data, null);
  assert.ok(error);
  assert.equal(error.message, 'Invalid supabase client');
});

test('loadOracleBuild returns build_data when available', async () => {
  const expectedBuild = {
    class: 'Wizard',
    university: 'Arcana',
    characterName: 'Gandalf',
    customField: 'value',
  };

  const supabase = createAsyncMockSupabase({
    selectData: {
      player_key: 'player1',
      class: 'Wizard',
      university: 'Arcana',
      character_name: 'Gandalf',
      build_data: expectedBuild,
      updated_at: '2025-01-01T00:00:00Z',
    },
  });

  const { data, error } = await loadOracleBuild(supabase, 'player1');

  assert.equal(error, null);
  assert.deepEqual(data, expectedBuild);
});

test('loadOracleBuild falls back to columns when build_data is null', async () => {
  const supabase = createAsyncMockSupabase({
    selectData: {
      player_key: 'player1',
      class: 'Rogue',
      university: 'Shadow',
      character_name: 'Thief',
      build_data: null,
      updated_at: '2025-01-01T00:00:00Z',
    },
  });

  const { data, error } = await loadOracleBuild(supabase, 'player1');

  assert.equal(error, null);
  assert.deepEqual(data, {
    class: 'Rogue',
    university: 'Shadow',
    characterName: 'Thief',
  });
});

test('loadOracleBuild returns null for non-existent player (PGRST116)', async () => {
  const supabase = createAsyncMockSupabase({
    selectError: { code: 'PGRST116', message: 'No rows returned' },
  });

  const { data, error } = await loadOracleBuild(supabase, 'nonexistent');

  assert.equal(data, null);
  assert.equal(error, null);
});

test('loadOracleBuild returns error for database errors', async () => {
  const supabase = createAsyncMockSupabase({
    selectError: { code: 'PGRST500', message: 'Server error' },
  });

  const { data, error } = await loadOracleBuild(supabase, 'player1');

  assert.equal(data, null);
  assert.ok(error);
  assert.equal(error.code, 'PGRST500');
});

test('loadAllOracleBuilds returns error for invalid supabase client', async () => {
  const { data, error } = await loadAllOracleBuilds(null);

  assert.deepEqual(data, []);
  assert.ok(error);
  assert.equal(error.message, 'Invalid supabase client');
});

test('loadAllOracleBuilds returns all builds', async () => {
  const expectedBuilds = [
    {
      player_key: 'player1',
      class: 'Wizard',
      university: 'Arcana',
      character_name: 'Gandalf',
      build_data: { class: 'Wizard', university: 'Arcana', characterName: 'Gandalf' },
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      player_key: 'player2',
      class: 'Rogue',
      university: 'Shadow',
      character_name: 'Thief',
      build_data: { class: 'Rogue', university: 'Shadow', characterName: 'Thief' },
      updated_at: '2025-01-02T00:00:00Z',
    },
  ];

  const supabase = createAsyncMockSupabase({
    selectAllData: expectedBuilds,
  });

  const { data, error } = await loadAllOracleBuilds(supabase);

  assert.equal(error, null);
  assert.deepEqual(data, expectedBuilds);
});

test('loadAllOracleBuilds returns empty array on error', async () => {
  const supabase = createAsyncMockSupabase({
    selectAllError: new Error('Database error'),
  });

  const { data, error } = await loadAllOracleBuilds(supabase);

  assert.deepEqual(data, []);
  assert.ok(error);
});
