const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');

const { createFileAdapter } = require('../file');

const normaliseState = (state = {}) => ({
  ...state,
  normalised: true,
});

function createTempPath(name) {
  return fs.mkdtemp(path.join(os.tmpdir(), `oracle-${name}-`));
}

test('file adapter fetchState writes default when missing', async () => {
  const dir = await createTempPath('file');
  const filePath = path.join(dir, 'state.json');
  const adapter = createFileAdapter({
    dataPath: filePath,
    defaultState: { foo: 'bar' },
    normaliseState,
  });

  const state = await adapter.fetchState();
  assert.equal(state.foo, 'bar');
  assert.equal(state.normalised, true);

  const raw = await fs.readFile(filePath, 'utf8');
  const written = JSON.parse(raw);
  assert.equal(written.normalised, true);
});

test('file adapter saveState normalises before writing', async () => {
  const dir = await createTempPath('file');
  const filePath = path.join(dir, 'state.json');
  const adapter = createFileAdapter({
    dataPath: filePath,
    defaultState: {},
    normaliseState,
  });

  const saved = await adapter.saveState({ foo: 'baz' });
  assert.equal(saved.normalised, true);

  const raw = await fs.readFile(filePath, 'utf8');
  const written = JSON.parse(raw);
  assert.equal(written.foo, 'baz');
  assert.equal(written.normalised, true);
});
