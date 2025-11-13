const fs = require('fs/promises');
const path = require('path');

function createFileAdapter(options = {}) {
  const { dataPath, defaultState, normaliseState } = options;
  if (!dataPath) {
    throw new Error('dataPath is required for the file storage adapter.');
  }
  if (typeof normaliseState !== 'function') {
    throw new Error('normaliseState is required for the file storage adapter.');
  }

  async function ensureDirectory() {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
  }

  async function fetchState() {
    try {
      const raw = await fs.readFile(dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      return normaliseState(parsed);
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        const initial = normaliseState(defaultState);
        await ensureDirectory();
        await fs.writeFile(dataPath, JSON.stringify(initial, null, 2));
        return initial;
      }
      throw err;
    }
  }

  async function saveState(state) {
    const normalised = normaliseState(state);
    await ensureDirectory();
    await fs.writeFile(dataPath, JSON.stringify(normalised, null, 2));
    return normalised;
  }

  return { fetchState, saveState };
}

module.exports = { createFileAdapter };
