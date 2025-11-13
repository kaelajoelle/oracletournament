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

describe('GET /api/state', () => {
  afterEach(() => {
    delete process.env.DATA_PATH;
    jest.resetModules();
  });

  it('merges stored data with default sessions', async () => {
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
    process.env.DATA_PATH = filePath;

    const app = require('../server');
    const response = await request(app).get('/api/state');

    expect(response.status).toBe(200);
    const { state } = response.body;
    expect(state.sessions).toBeDefined();

    const customSession = state.sessions.find(session => session.id === 's1');
    expect(customSession).toBeDefined();
    expect(customSession.title).toBe('Custom Session 1');
    expect(customSession.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'zia', character: 'Zia' })
      ])
    );

    const expectedSessionCount = require('../server').DEFAULT_STATE.sessions.length;
    expect(state.sessions).toHaveLength(expectedSessionCount);

    const fallbackSession = state.sessions.find(session => session.id === 's2');
    expect(fallbackSession).toBeDefined();
    expect(Array.isArray(fallbackSession.players)).toBe(true);
  });
});
