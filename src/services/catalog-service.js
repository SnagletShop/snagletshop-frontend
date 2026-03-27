(function (window) {
  'use strict';

  const api = () => window.__SS_API__;
  function catalogPath() {
    const nonce = String(window.__SS_CATALOG_REQUEST_NONCE__ || (window.__SS_CATALOG_REQUEST_NONCE__ = Date.now().toString(36)));
    return `/catalog?ssv=${encodeURIComponent(nonce)}`;
  }

  async function getPublicConfig() {
    return api().json('/public-config', { method: 'GET' });
  }

  async function getAssignments() {
    return api().json('/ab/assignments', { method: 'GET', credentials: 'include' });
  }

  async function getCatalog() {
    return api().json(catalogPath(), { method: 'GET', cache: 'no-store', credentials: 'include' });
  }

  window.__SS_CATALOG_SERVICE__ = { getPublicConfig, getAssignments, getCatalog };
})(window);
