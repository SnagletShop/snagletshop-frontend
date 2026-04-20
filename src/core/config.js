
(function (window, document) {
  const DEFAULT_BACKEND_PORT = 5500;
  const existing = window.__SS_CONFIG__ || {};
  const injected = existing.API_BASE || (window.__API_BASE__ ? String(window.__API_BASE__) : '');
  const meta = String(document.querySelector('meta[name="api-base"]')?.getAttribute('content') || '');
  const chosen = String(injected || meta).trim();
  const host = window.location.hostname || '';
  const isProd = host === 'snagletshop.com' || host === 'www.snagletshop.com' || host === 'api.snagletshop.com' || host.endsWith('.snagletshop.com');
  const apiBase = (chosen || (isProd ? 'https://api.snagletshop.com' : `${window.location.protocol || 'http:'}//${host}:${DEFAULT_BACKEND_PORT}`)).replace(/\/+$/, '');
  window.__SS_CONFIG__ = Object.assign({}, existing, {
    DEFAULT_BACKEND_PORT,
    API_BASE: apiBase,
    USE_PATH_ROUTES: existing.USE_PATH_ROUTES ?? true,
    AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE: existing.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE ?? true,
  });
})(window, document);
