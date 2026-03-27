(function (window) {
  'use strict';

  function catalogService() { return window.__SS_CATALOG_SERVICE__ || null; }
  function api() { return window.__SS_API__ || null; }
  function catalogPath() {
    const nonce = String(window.__SS_CATALOG_REQUEST_NONCE__ || (window.__SS_CATALOG_REQUEST_NONCE__ = Date.now().toString(36)));
    return `/catalog?ssv=${encodeURIComponent(nonce)}`;
  }

  async function getPublicConfig() {
    const svc = catalogService();
    if (svc && typeof svc.getPublicConfig === 'function') return svc.getPublicConfig();
    if (api() && typeof api().json === 'function') return api().json('/public-config', { method: 'GET' });
    throw new Error('Catalog public-config transport is unavailable.');
  }

  async function getAssignments() {
    const svc = catalogService();
    if (svc && typeof svc.getAssignments === 'function') return svc.getAssignments();
    if (api() && typeof api().json === 'function') return api().json('/ab/assignments', { method: 'GET', credentials: 'include' });
    throw new Error('Catalog assignments transport is unavailable.');
  }

  async function getCatalog() {
    const svc = catalogService();
    if (svc && typeof svc.getCatalog === 'function') return svc.getCatalog();
    if (api() && typeof api().json === 'function') return api().json(catalogPath(), { method: 'GET', cache: 'no-store', credentials: 'include' });
    throw new Error('Catalog transport is unavailable.');
  }

  window.__SS_CATALOG_API__ = { getPublicConfig, getAssignments, getCatalog };
})(window);
