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

test('GET /api/state merges stored data with default sessions', async (t) => {
  const partialState = {
    sessions: [
      {
        id: 's1',
        title: 'Custom Session 1',
        players: [
          { character: 'Zia', key: 'zia' }
        ]
      }
    ]
  };

  const { filePath } = await createStateFile(partialState);
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

    const customSession = state.sessions.find(session => session.id === 's1');
    assert.ok(customSession);
    assert.equal(customSession.title, 'Custom Session 1');
    assert.ok(customSession.players.some(p => p.key === 'zia' && p.character === 'Zia'));

    const expectedSessionCount = require('../server').DEFAULT_STATE.sessions.length;
    assert.equal(state.sessions.length, expectedSessionCount);

    const fallbackSession = state.sessions.find(session => session.id === 's2');
    assert.ok(fallbackSession);
    assert.ok(Array.isArray(fallbackSession.players));
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
