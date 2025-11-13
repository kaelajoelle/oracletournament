export function ensureAppConfig(){
  const cfg = window.APP_CONFIG || {};
  const configured = typeof cfg.apiBaseUrl === 'string' ? cfg.apiBaseUrl.trim() : '';
  if(configured){
    const merged = { ...cfg, apiBaseUrl: configured };
    window.APP_CONFIG = merged;
    return merged;
  }
  const sameOrigin = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? `${window.location.origin.replace(/\/$/, '')}/api`
    : '/api';
  console.warn('[OracleTournament] window.APP_CONFIG.apiBaseUrl is not configured; defaulting to', sameOrigin);
  const merged = { ...cfg, apiBaseUrl: sameOrigin };
  window.APP_CONFIG = merged;
  return merged;
}
