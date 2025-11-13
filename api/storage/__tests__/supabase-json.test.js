const assert = require('node:assert/strict');
const test = require('node:test');

const { createSupabaseJsonAdapter } = require('../supabase-json');

const normaliseState = (state = {}) => ({ ...state, normalised: true });

class MockResponse {
  constructor({ status = 200, ok = true, jsonData = null, textData = '' } = {}) {
    this.status = status;
    this.ok = ok;
    this._jsonData = jsonData;
    this._textData = textData;
  }

  async json() {
    return this._jsonData;
  }

  async text() {
    if (this._textData !== undefined && this._textData !== null) {
      return this._textData;
    }
    if (this._jsonData === null || this._jsonData === undefined) {
      return '';
    }
    return JSON.stringify(this._jsonData);
  }
}

function createFetch(sequence) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    if (!sequence.length) {
      throw new Error('No mock response available');
    }
    const response = sequence.shift();
    calls.push({ url, options });
    return response;
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

test('supabase json adapter fetchState returns normalised state', async () => {
  const fetchImpl = createFetch([
    new MockResponse({ jsonData: [{ state: { foo: 'bar' } }] }),
  ]);
  const adapter = createSupabaseJsonAdapter({
    fetchImpl,
    restUrl: 'https://example.supabase.co/rest/v1/state',
    rowId: 'shared',
    serviceRoleKey: 'service',
    defaultState: {},
    normaliseState,
  });

  const state = await adapter.fetchState();
  assert.equal(state.foo, 'bar');
  assert.equal(state.normalised, true);
  assert.match(fetchImpl.calls[0].url, /select=state/);
});

test('supabase json adapter inserts default when missing', async () => {
  const fetchImpl = createFetch([
    new MockResponse({ status: 404, ok: false, textData: '' }),
    new MockResponse({ status: 204, ok: true }),
  ]);
  const adapter = createSupabaseJsonAdapter({
    fetchImpl,
    restUrl: 'https://example.supabase.co/rest/v1/state',
    rowId: 'shared',
    serviceRoleKey: 'service',
    defaultState: { foo: 'fallback' },
    normaliseState,
  });

  const state = await adapter.fetchState();
  assert.equal(state.foo, 'fallback');
  assert.equal(fetchImpl.calls.length, 2);
  const insertCall = fetchImpl.calls[1];
  assert.equal(insertCall.options.method, 'POST');
  const body = JSON.parse(insertCall.options.body);
  assert.equal(body.state.foo, 'fallback');
});

test('supabase json adapter saveState posts normalised payload', async () => {
  const fetchImpl = createFetch([
    new MockResponse({ status: 204, ok: true }),
  ]);
  const adapter = createSupabaseJsonAdapter({
    fetchImpl,
    restUrl: 'https://example.supabase.co/rest/v1/state',
    rowId: 'shared',
    serviceRoleKey: 'service',
    defaultState: {},
    normaliseState,
  });

  const saved = await adapter.saveState({ foo: 'baz' });
  assert.equal(saved.normalised, true);
  assert.equal(fetchImpl.calls[0].options.method, 'POST');
  const payload = JSON.parse(fetchImpl.calls[0].options.body);
  assert.equal(payload.state.foo, 'baz');
});
