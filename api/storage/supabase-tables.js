function createSupabaseTablesAdapter(options = {}) {
  const {
    defaultSessions = [],
    normaliseState,
    sanitizeName,
    sanitizeOptional,
    rosterKey,
    decodeRosterMeta,
    encodeRosterMeta,
    AVAIL_DATES = [],
    supabaseQuery,
    supabaseMutate,
    updatePlayerAccessDisplayName,
    tables = {},
    getMetaSupportsHidden = () => true,
    setMetaSupportsHidden = () => {},
  } = options;

  if (typeof normaliseState !== 'function') {
    throw new Error('normaliseState is required for the Supabase tables adapter.');
  }
  if (typeof supabaseQuery !== 'function' || typeof supabaseMutate !== 'function') {
    throw new Error('supabaseQuery and supabaseMutate are required for the Supabase tables adapter.');
  }

  const {
    sessionsTable,
    sessionPlayersTable,
    rosterExtrasTable,
    rosterMetaTable,
    availabilityTable,
    buildCardsTable,
  } = tables;

  async function fetchState() {
    const supportsHidden = getMetaSupportsHidden();
    const metaPromise = supportsHidden
      ? supabaseQuery(`${encodeURIComponent(rosterMetaTable)}?select=player_key,status,notes,hidden`, { fallback: [] })
          .catch(async (err) => {
            const message = String(err && err.message ? err.message : err || '').toLowerCase();
            if (message.includes('column') && message.includes('hidden')) {
              setMetaSupportsHidden(false);
              return supabaseQuery(`${encodeURIComponent(rosterMetaTable)}?select=player_key,status,notes`, { fallback: [] });
            }
            throw err;
          })
      : supabaseQuery(`${encodeURIComponent(rosterMetaTable)}?select=player_key,status,notes`, { fallback: [] });

    const [sessionRows, playerRows, extrasRows, metaRows, availabilityRows, buildRows] = await Promise.all([
      supabaseQuery(`${encodeURIComponent(sessionsTable)}?select=id,title,dm,date,capacity,finale`),
      supabaseQuery(`${encodeURIComponent(sessionPlayersTable)}?select=session_id,player_key,player_name&order=player_name.asc`),
      supabaseQuery(`${encodeURIComponent(rosterExtrasTable)}?select=player_key,name,status,notes&order=name.asc`),
      metaPromise,
      supabaseQuery(`${encodeURIComponent(availabilityTable)}?select=player_key,player_name,date,available`),
      supabaseQuery(`${encodeURIComponent(buildCardsTable)}?select=player_key,class,university,character_name`),
    ]);

    const sessionMap = new Map(
      defaultSessions.map((session) => [
        session.id,
        { ...session, players: Array.isArray(session.players) ? session.players.slice() : [] },
      ]),
    );

    sessionRows.forEach((row) => {
      const id = sanitizeOptional(row.id);
      if (!id) {
        return;
      }
      const base = sessionMap.get(id) || {
        id,
        title: sanitizeOptional(row.title) || `Session ${id}`,
        dm: sanitizeOptional(row.dm),
        date: sanitizeOptional(row.date),
        capacity: Number(row.capacity) || 0,
        finale: Boolean(row.finale),
        players: [],
      };
      base.title = sanitizeOptional(row.title) || base.title;
      base.dm = sanitizeOptional(row.dm) || base.dm;
      base.date = sanitizeOptional(row.date) || base.date;
      base.capacity = Number.isFinite(Number(row.capacity)) ? Number(row.capacity) : base.capacity;
      base.finale = row.finale != null ? Boolean(row.finale) : base.finale;
      base.players = Array.isArray(base.players) ? base.players : [];
      sessionMap.set(id, base);
    });

    playerRows.forEach((row) => {
      const sessionId = sanitizeOptional(row.session_id);
      const name = sanitizeName(row.player_name || row.player_key);
      if (!sessionId || !name) {
        return;
      }
      const session = sessionMap.get(sessionId) || {
        id: sessionId,
        title: `Session ${sessionId}`,
        dm: '',
        date: '',
        capacity: 0,
        finale: false,
        players: [],
      };
      session.players = Array.isArray(session.players) ? session.players : [];
      if (!session.players.includes(name)) {
        session.players.push(name);
      }
      sessionMap.set(sessionId, session);
    });

    const sessions = Array.from(sessionMap.values());
    sessions.sort((a, b) => {
      const dateCompare = sanitizeOptional(a.date).localeCompare(sanitizeOptional(b.date));
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return sanitizeOptional(a.id).localeCompare(sanitizeOptional(b.id));
    });

    const rosterExtras = extrasRows
      .map((row) => {
        const name = sanitizeName(row.name || row.player_key);
        const key = rosterKey(row.player_key || name);
        if (!name || !key) {
          return null;
        }
        return {
          key,
          name,
          status: sanitizeOptional(row.status),
          notes: sanitizeOptional(row.notes),
          custom: true,
        };
      })
      .filter(Boolean);

    const rosterMeta = {};
    metaRows.forEach((row) => {
      const key = rosterKey(row.player_key || row.name || '');
      if (!key) {
        return;
      }
      const { status, notes, hidden } = decodeRosterMeta(row.status, row.notes, row.hidden);
      if (status || notes || hidden) {
        rosterMeta[key] = { status, notes, hidden };
      }
    });

    const availability = {};
    availabilityRows.forEach((row) => {
      if (row.available === false) {
        return;
      }
      const key = rosterKey(row.player_key || row.player_name);
      const date = sanitizeOptional(row.date);
      if (!key || !AVAIL_DATES.includes(date)) {
        return;
      }
      availability[key] = availability[key] || {};
      availability[key][date] = true;
    });

    const buildCards = {};
    buildRows.forEach((row) => {
      const key = rosterKey(row.player_key);
      if (!key) {
        return;
      }
      const entry = {};
      const klass = sanitizeOptional(row.class);
      const university = sanitizeOptional(row.university);
      const characterName = sanitizeName(row.character_name || '');
      if (klass) {
        entry.class = klass;
      }
      if (university) {
        entry.university = university;
      }
      if (characterName) {
        entry.characterName = characterName;
      }
      if (Object.keys(entry).length > 0) {
        buildCards[key] = entry;
      }
    });

    return normaliseState({
      sessions,
      rosterExtras,
      rosterMeta,
      availability,
      buildCards,
    });
  }

  async function saveState(state, context = {}) {
    const normalised = normaliseState(state);
    const action = context && context.action;
    if (!action) {
      await replaceState(normalised);
      return fetchState();
    }

    switch (action) {
      case 'joinSession': {
        const sessionId = sanitizeOptional(context.sessionId);
        const key = rosterKey(context.playerKey || context.buildKey || context.playerName);
        if (!sessionId || !key) {
          await replaceState(normalised);
          break;
        }
        await updatePlayerAccessDisplayName(key, context.playerName || context.characterName);
        const session = normalised.sessions.find((s) => sanitizeOptional(s.id) === sessionId);
        if (session) {
          await supabaseMutate(`${encodeURIComponent(sessionsTable)}?id=eq.${encodeURIComponent(sessionId)}`, {
            method: 'PATCH',
            body: {
              title: sanitizeOptional(session.title) || null,
              dm: sanitizeOptional(session.dm) || null,
              date: sanitizeOptional(session.date) || null,
              capacity: Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : null,
              finale: session.finale != null ? Boolean(session.finale) : null,
            },
          });
        }
        await supabaseMutate(`${encodeURIComponent(sessionPlayersTable)}`, {
          body: [
            {
              session_id: sessionId,
              player_key: key,
              player_name: sanitizeName(context.characterName || context.playerName),
            },
          ],
          headers: { Prefer: 'resolution=ignore-duplicates' },
        });
        await supabaseMutate(`${encodeURIComponent(buildCardsTable)}`, {
          body: [
            {
              player_key: key,
              class: context.build?.class ? sanitizeOptional(context.build.class) : null,
              university: context.build?.university ? sanitizeOptional(context.build.university) : null,
              character_name: context.characterName ? sanitizeName(context.characterName) : null,
            },
          ],
          headers: { Prefer: 'resolution=merge-duplicates' },
        });
        break;
      }
      case 'leaveSession': {
        const sessionId = sanitizeOptional(context.sessionId);
        const key = rosterKey(context.playerKey || context.buildKey || context.playerName);
        if (sessionId && key) {
          const filters = [`session_id=eq.${encodeURIComponent(sessionId)}`, `player_key=eq.${encodeURIComponent(key)}`].join('&');
          await supabaseMutate(`${encodeURIComponent(sessionPlayersTable)}?${filters}`, {
            method: 'DELETE',
          });
        } else {
          await replaceState(normalised);
        }
        break;
      }
      case 'updateSession': {
        const sessionId = sanitizeOptional(context.sessionId);
        if (!sessionId) {
          await replaceState(normalised);
          break;
        }
        const session = normalised.sessions.find((s) => sanitizeOptional(s.id) === sessionId);
        if (!session) {
          await replaceState(normalised);
          break;
        }
        await supabaseMutate(`${encodeURIComponent(sessionsTable)}?id=eq.${encodeURIComponent(sessionId)}`, {
          method: 'PATCH',
          body: {
            title: sanitizeOptional(session.title) || null,
            dm: sanitizeOptional(session.dm) || null,
            date: sanitizeOptional(session.date) || null,
            capacity: Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : null,
            finale: session.finale != null ? Boolean(session.finale) : null,
          },
        });
        break;
      }
      case 'updateAvailability': {
        const key = rosterKey(context.playerKey || context.availabilityKey || context.name);
        if (!key) {
          await replaceState(normalised);
          break;
        }
        const dates = Array.isArray(context.dates) ? context.dates : AVAIL_DATES;
        await supabaseMutate(`${encodeURIComponent(availabilityTable)}?player_key=eq.${encodeURIComponent(key)}`, {
          method: 'DELETE',
        });
        const payload = [];
        dates.forEach((date) => {
          if (context.availability && context.availability[date]) {
            payload.push({
              player_key: key,
              player_name: sanitizeName(context.playerName || context.name),
              date,
              available: true,
            });
          }
        });
        if (payload.length) {
          await supabaseMutate(`${encodeURIComponent(availabilityTable)}`, {
            body: payload,
          });
        }
        break;
      }
      case 'updateBuildCard': {
        const key = rosterKey(context.buildKey || context.playerKey || context.name);
        if (!key) {
          await replaceState(normalised);
          break;
        }
        await supabaseMutate(`${encodeURIComponent(buildCardsTable)}`, {
          body: [
            {
              player_key: key,
              class: context.build?.class ? sanitizeOptional(context.build.class) : null,
              university: context.build?.university ? sanitizeOptional(context.build.university) : null,
              character_name: context.characterName ? sanitizeName(context.characterName) : null,
            },
          ],
          headers: { Prefer: 'resolution=merge-duplicates' },
        });
        break;
      }
      case 'addRosterExtra': {
        const key = rosterKey(context.rosterKey || context.name);
        if (!key) {
          await replaceState(normalised);
          break;
        }
        await updatePlayerAccessDisplayName(key, context.name);
        await supabaseMutate(`${encodeURIComponent(rosterExtrasTable)}`, {
          body: [
            {
              player_key: key,
              name: sanitizeName(context.name),
              status: sanitizeOptional(context.status) || null,
              notes: sanitizeOptional(context.notes) || null,
            },
          ],
          headers: { Prefer: 'resolution=merge-duplicates' },
        });
        if (context.status || context.notes || context.hidden) {
          const metaPayload = encodeRosterMeta(context.status, context.notes, context.hidden);
          await supabaseMutate(`${encodeURIComponent(rosterMetaTable)}`, {
            body: [
              {
                player_key: key,
                ...metaPayload,
              },
            ],
            headers: { Prefer: 'resolution=merge-duplicates' },
          });
        }
        break;
      }
      case 'updateRoster': {
        const key = rosterKey(context.rosterKey || context.name);
        if (!key) {
          await replaceState(normalised);
          break;
        }
        const metaPayload = encodeRosterMeta(context.status, context.notes, context.hidden);
        if (context.status || context.notes) {
          await supabaseMutate(`${encodeURIComponent(rosterMetaTable)}`, {
            body: [
              {
                player_key: key,
                ...metaPayload,
              },
            ],
            headers: { Prefer: 'resolution=merge-duplicates' },
          });
        } else {
          await supabaseMutate(`${encodeURIComponent(rosterMetaTable)}?player_key=eq.${encodeURIComponent(key)}`, {
            method: 'DELETE',
          });
        }

        if (context.custom) {
          await supabaseMutate(`${encodeURIComponent(rosterExtrasTable)}?player_key=eq.${encodeURIComponent(key)}`, {
            method: 'PATCH',
            body: {
              status: sanitizeOptional(context.status) || null,
              notes: sanitizeOptional(context.notes) || null,
            },
          });
        }
        if (context.hidden) {
          await supabaseMutate(`${encodeURIComponent(availabilityTable)}?player_key=eq.${encodeURIComponent(key)}`, {
            method: 'DELETE',
          });
        }
        break;
      }
      case 'removeRosterExtra': {
        const key = rosterKey(context.rosterKey || context.name);
        if (!key) {
          await replaceState(normalised);
          break;
        }
        await supabaseMutate(`${encodeURIComponent(rosterExtrasTable)}?player_key=eq.${encodeURIComponent(key)}`, {
          method: 'DELETE',
        });
        await supabaseMutate(`${encodeURIComponent(rosterMetaTable)}?player_key=eq.${encodeURIComponent(key)}`, {
          method: 'DELETE',
        });
        await supabaseMutate(`${encodeURIComponent(availabilityTable)}?player_key=eq.${encodeURIComponent(key)}`, {
          method: 'DELETE',
        });
        if (context.availabilityKey && context.availabilityKey !== key) {
          await supabaseMutate(`${encodeURIComponent(availabilityTable)}?player_key=eq.${encodeURIComponent(context.availabilityKey)}`, {
            method: 'DELETE',
          });
        }
        break;
      }
      default: {
        await replaceState(normalised);
        break;
      }
    }

    return normalised;
  }

  async function replaceState(state) {
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];
    const rosterExtras = Array.isArray(state.rosterExtras) ? state.rosterExtras : [];
    const rosterMeta = state.rosterMeta && typeof state.rosterMeta === 'object' ? state.rosterMeta : {};
    const availability = state.availability && typeof state.availability === 'object' ? state.availability : {};
    const buildCards = state.buildCards && typeof state.buildCards === 'object' ? state.buildCards : {};

    await supabaseMutate(`${encodeURIComponent(sessionPlayersTable)}?session_id=not.is.null`, {
      method: 'DELETE',
    });
    await supabaseMutate(`${encodeURIComponent(sessionsTable)}?id=not.is.null`, {
      method: 'DELETE',
    });
    const sessionRows = sessions.map((session) => ({
      id: sanitizeOptional(session.id),
      title: sanitizeOptional(session.title) || null,
      dm: sanitizeOptional(session.dm) || null,
      date: sanitizeOptional(session.date) || null,
      capacity: Number.isFinite(Number(session.capacity)) ? Number(session.capacity) : null,
      finale: session.finale != null ? Boolean(session.finale) : null,
    }));
    if (sessionRows.length) {
      await supabaseMutate(`${encodeURIComponent(sessionsTable)}`, {
        body: sessionRows,
        headers: { Prefer: 'resolution=merge-duplicates' },
      });
    }

    const playerRows = [];
    sessions.forEach((session) => {
      const sessionId = sanitizeOptional(session.id);
      if (!sessionId) {
        return;
      }
      const players = Array.isArray(session.players) ? session.players : [];
      players.forEach((player) => {
        playerRows.push({
          session_id: sessionId,
          player_key: rosterKey(player && (player.key || player.character || player.name)),
          player_name: sanitizeName(player && (player.character || player.name || player.playerName || '')),
        });
      });
    });
    if (playerRows.length) {
      await supabaseMutate(`${encodeURIComponent(sessionPlayersTable)}`, {
        body: playerRows,
        headers: { Prefer: 'resolution=merge-duplicates' },
      });
    }

    await supabaseMutate(`${encodeURIComponent(rosterExtrasTable)}?player_key=not.is.null`, {
      method: 'DELETE',
    });
    if (rosterExtras.length) {
      const payload = rosterExtras.map((extra) => ({
        player_key: rosterKey(extra && (extra.key || extra.name)),
        name: sanitizeName(extra && (extra.name || extra.key)),
        status: sanitizeOptional(extra && extra.status) || null,
        notes: sanitizeOptional(extra && extra.notes) || null,
      }));
      await supabaseMutate(`${encodeURIComponent(rosterExtrasTable)}`, {
        body: payload,
        headers: { Prefer: 'resolution=merge-duplicates' },
      });
    }

    await supabaseMutate(`${encodeURIComponent(rosterMetaTable)}?player_key=not.is.null`, {
      method: 'DELETE',
    });
    const metaRows = Object.entries(rosterMeta).map(([key, value]) => ({
      player_key: rosterKey(key),
      ...encodeRosterMeta(value && value.status, value && value.notes, value && value.hidden),
    }));
    if (metaRows.length) {
      await supabaseMutate(`${encodeURIComponent(rosterMetaTable)}`, {
        body: metaRows,
        headers: { Prefer: 'resolution=merge-duplicates' },
      });
    }

    await supabaseMutate(`${encodeURIComponent(availabilityTable)}?player_key=not.is.null`, {
      method: 'DELETE',
    });
    const availabilityRows = [];
    Object.entries(availability).forEach(([playerKey, dates]) => {
      const cleanKey = rosterKey(playerKey);
      if (!cleanKey) {
        return;
      }
      AVAIL_DATES.forEach((date) => {
        if (dates && dates[date]) {
          availabilityRows.push({
            player_key: cleanKey,
            player_name: sanitizeName(playerKey),
            date,
            available: true,
          });
        }
      });
    });
    if (availabilityRows.length) {
      await supabaseMutate(`${encodeURIComponent(availabilityTable)}`, {
        body: availabilityRows,
      });
    }

    await supabaseMutate(`${encodeURIComponent(buildCardsTable)}?player_key=not.is.null`, {
      method: 'DELETE',
    });
    const buildRows = Object.entries(buildCards).map(([rawKey, card]) => ({
      player_key: rosterKey(rawKey),
      class: card && card.class ? sanitizeOptional(card.class) : null,
      university: card && card.university ? sanitizeOptional(card.university) : null,
      character_name: card && card.characterName ? sanitizeName(card.characterName) : null,
    }));
    if (buildRows.length) {
      await supabaseMutate(`${encodeURIComponent(buildCardsTable)}`, {
        body: buildRows,
        headers: { Prefer: 'resolution=merge-duplicates' },
      });
    }
  }

  return { fetchState, saveState, replaceState };
}

module.exports = { createSupabaseTablesAdapter };
