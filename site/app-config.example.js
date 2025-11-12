/*
 * Copy this file to `site/app-config.js` and update `apiBaseUrl` to match
 * your deployed Express backend. The frontend loads `site/app-config.js`
 * (if present) before bootstrapping so every fetch call targets the same API.
 */
window.APP_CONFIG = {
  /**
   * Base URL for the Oracle Tournament API. Include the `/api` suffix.
   *   - Local dev:  'http://localhost:8787/api'
   *   - Render:     'https://your-render-service.onrender.com/api'
   */
  apiBaseUrl: 'http://localhost:8787/api'
};
