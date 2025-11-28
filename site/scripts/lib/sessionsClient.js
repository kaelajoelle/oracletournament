/**
 * Sessions Client
 * Lightweight helper for fetching session data from the /sessions endpoint.
 * This is the single source of truth for session data in the frontend.
 */

/**
 * Fetch all sessions from the API
 * @param {string} apiBaseUrl - Base URL for the API (e.g., '/api' or 'https://api.example.com')
 * @returns {Promise<{sessions: Array, error: string|null}>}
 */
export async function fetchSessions(apiBaseUrl = '/api') {
  try {
    const url = `${apiBaseUrl.replace(/\/$/, '')}/sessions`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    
    if (!response.ok) {
      const text = await response.text();
      return { sessions: [], error: text || `Request failed (${response.status})` };
    }
    
    const data = await response.json();
    const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
    return { sessions, error: null };
  } catch (err) {
    return { sessions: [], error: err?.message || 'Failed to fetch sessions' };
  }
}

/**
 * Fetch a single session by ID
 * @param {string} sessionId - The session ID to fetch
 * @param {string} apiBaseUrl - Base URL for the API
 * @returns {Promise<{session: object|null, error: string|null}>}
 */
export async function fetchSessionById(sessionId, apiBaseUrl = '/api') {
  if (!sessionId) {
    return { session: null, error: 'Session ID is required' };
  }
  
  try {
    const url = `${apiBaseUrl.replace(/\/$/, '')}/sessions/${encodeURIComponent(sessionId)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    
    if (response.status === 404) {
      return { session: null, error: 'Session not found' };
    }
    
    if (!response.ok) {
      const text = await response.text();
      return { session: null, error: text || `Request failed (${response.status})` };
    }
    
    const data = await response.json();
    return { session: data?.session || null, error: null };
  } catch (err) {
    return { session: null, error: err?.message || 'Failed to fetch session' };
  }
}

/**
 * Check if a player is already in a session
 * @param {object} session - The session object with players array
 * @param {string} playerKey - The player key to check
 * @returns {boolean}
 */
export function sessionHasPlayer(session, playerKey) {
  if (!session || !playerKey) return false;
  const normalizedKey = String(playerKey).trim().toLowerCase();
  if (!normalizedKey) return false;
  
  const players = Array.isArray(session.players) ? session.players : [];
  return players.some(player => {
    const key = String(player?.key || player?.playerKey || '').trim().toLowerCase();
    return key === normalizedKey;
  });
}

/**
 * Get a deep copy of sessions to avoid accidental mutation
 * @param {Array} sessions - Array of session objects
 * @returns {Array}
 */
export function cloneSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  return sessions.map(session => ({
    ...session,
    players: Array.isArray(session.players)
      ? session.players.map(player => ({ ...player }))
      : []
  }));
}
