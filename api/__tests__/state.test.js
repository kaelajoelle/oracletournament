const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const request = require('supertest');

async function createStateFile(initialState){
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oracle-state-'));
  const filePath = path.join(dir, 'state.json');
  await fs.writeFile(filePath, JSON.stringify(initialState), 'utf8');
  return { dir, filePath };
}

test('GET /api/state returns sessions from state.json', async (t) => {
  const testSessions = [
    {
      id: 'test-trial1',
      title: 'Test Trial I',
      date: '2025-12-22',
      theme: 'Test Theme',
      focus: 'Test Focus',
      setting: 'Test Setting',
      premise: 'Test Premise',
      dm: 'Test DM',
      capacity: 6,
      players: [
        { key: 'player1', character: 'Character 1' }
      ]
    },
    {
      id: 'test-trial2',
      title: 'Test Trial II',
      date: '2025-12-27',
      capacity: 6,
      players: []
    }
  ];

  const testState = {
    sessions: testSessions,
    rosterExtras: [],
    rosterMeta: {},
    buildCards: {}
  };

  const { filePath } = await createStateFile(testState);
  const originalDataPath = process.env.DATA_PATH;
  
  try {
    process.env.DATA_PATH = filePath;
    
    // Clear the require cache for server module to pick up new DATA_PATH
    delete require.cache[require.resolve('../server')];
    
    const app = require('../server');
    const response = await request(app).get('/api/state');

    assert.equal(response.status, 200);
    const { state } = response.body;
    assert.ok(state.sessions);
    assert.equal(state.sessions.length, 2);

    const trial1 = state.sessions.find(session => session.id === 'test-trial1');
    assert.ok(trial1);
    assert.equal(trial1.title, 'Test Trial I');
    assert.equal(trial1.theme, 'Test Theme');
    assert.ok(trial1.players.some(p => p.key === 'player1' && p.character === 'Character 1'));

    const trial2 = state.sessions.find(session => session.id === 'test-trial2');
    assert.ok(trial2);
    assert.equal(trial2.title, 'Test Trial II');
    assert.ok(Array.isArray(trial2.players));
  } finally {
    // Restore original DATA_PATH
    if (originalDataPath !== undefined) {
      process.env.DATA_PATH = originalDataPath;
    } else {
      delete process.env.DATA_PATH;
    }
    // Clear the require cache again to ensure clean state
    delete require.cache[require.resolve('../server')];
  }
});

test('GET /api/sessions returns all sessions', async (t) => {
  const testSessions = [
    {
      id: 'trial1',
      title: 'Trial I: Test',
      date: '2025-12-22',
      theme: 'Test Theme',
      focus: 'Test Focus',
      dm: 'Test DM',
      capacity: 6,
      players: []
    },
    {
      id: 'finale',
      title: 'Finale: Test',
      date: '2026-01-01',
      capacity: 12,
      finale: true,
      players: []
    }
  ];

  const testState = {
    sessions: testSessions,
    rosterExtras: [],
    rosterMeta: {},
    buildCards: {}
  };

  const { filePath } = await createStateFile(testState);
  const originalDataPath = process.env.DATA_PATH;
  
  try {
    process.env.DATA_PATH = filePath;
    delete require.cache[require.resolve('../server')];
    
    const app = require('../server');
    const response = await request(app).get('/api/sessions');

    assert.equal(response.status, 200);
    const { sessions } = response.body;
    assert.ok(Array.isArray(sessions));
    assert.equal(sessions.length, 2);
    
    const finale = sessions.find(s => s.id === 'finale');
    assert.ok(finale);
    assert.equal(finale.finale, true);
    assert.equal(finale.capacity, 12);
  } finally {
    if (originalDataPath !== undefined) {
      process.env.DATA_PATH = originalDataPath;
    } else {
      delete process.env.DATA_PATH;
    }
    delete require.cache[require.resolve('../server')];
  }
});

test('GET /api/sessions/:id returns single session', async (t) => {
  const testSessions = [
    {
      id: 'trial1',
      title: 'Trial I: Test',
      date: '2025-12-22',
      theme: 'Test Theme',
      focus: 'Test Focus',
      dm: 'Test DM',
      capacity: 6,
      players: [{ key: 'player1', character: 'Char1' }]
    }
  ];

  const testState = {
    sessions: testSessions,
    rosterExtras: [],
    rosterMeta: {},
    buildCards: {}
  };

  const { filePath } = await createStateFile(testState);
  const originalDataPath = process.env.DATA_PATH;
  
  try {
    process.env.DATA_PATH = filePath;
    delete require.cache[require.resolve('../server')];
    
    const app = require('../server');
    
    // Test existing session
    const response = await request(app).get('/api/sessions/trial1');
    assert.equal(response.status, 200);
    const { session } = response.body;
    assert.ok(session);
    assert.equal(session.id, 'trial1');
    assert.equal(session.title, 'Trial I: Test');
    assert.equal(session.theme, 'Test Theme');
    
    // Test non-existent session
    const notFoundResponse = await request(app).get('/api/sessions/nonexistent');
    assert.equal(notFoundResponse.status, 404);
  } finally {
    if (originalDataPath !== undefined) {
      process.env.DATA_PATH = originalDataPath;
    } else {
      delete process.env.DATA_PATH;
    }
    delete require.cache[require.resolve('../server')];
  }
});
