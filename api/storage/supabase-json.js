function createSupabaseJsonAdapter(options = {}) {
  const {
    fetchImpl,
    restUrl,
    rowId,
    serviceRoleKey,
    defaultState,
    normaliseState,
  } = options;

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetchImpl is required for the Supabase JSON adapter.');
  }
  if (!restUrl || !rowId || !serviceRoleKey) {
    throw new Error('restUrl, rowId, and serviceRoleKey are required for the Supabase JSON adapter.');
  }
  if (typeof normaliseState !== 'function') {
    throw new Error('normaliseState is required for the Supabase JSON adapter.');
  }

  async function fetchState() {
    const url = `${restUrl}?id=eq.${encodeURIComponent(rowId)}&select=state`;
    const res = await fetchImpl(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
    });

    if (res.status === 404) {
      const initial = normaliseState(defaultState);
      await insertState(initial);
      return initial;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase select failed (${res.status}): ${body}`);
    }

    const rows = await res.json();
    const record = Array.isArray(rows) ? rows[0] : null;

    if (!record || !record.state) {
      const initial = normaliseState(defaultState);
      await insertState(initial);
      return initial;
    }

    return normaliseState(record.state);
  }

  async function saveState(state) {
    const normalised = normaliseState(state);
    await insertState(normalised);
    return normalised;
  }

  async function insertState(state) {
    const payload = {
      id: rowId,
      state,
      updated_at: new Date().toISOString(),
    };

    const res = await fetchImpl(restUrl, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase insert failed (${res.status}): ${body}`);
    }
  }

  return { fetchState, saveState };
}

module.exports = { createSupabaseJsonAdapter };
