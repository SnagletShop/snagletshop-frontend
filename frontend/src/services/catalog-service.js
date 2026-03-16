(function (window) {
  'use strict';

  const api = () => window.__SS_API__;

  async function getPublicConfig() {
    return api().json('/public-config', { method: 'GET' });
  }

  async function getAssignments() {
    return api().json('/ab/assignments', { method: 'GET', credentials: 'include' });
  }

  async function getCatalog() {
    return api().json('/catalog', { method: 'GET' });
  }

  window.__SS_CATALOG_SERVICE__ = { getPublicConfig, getAssignments, getCatalog };
})(window);
