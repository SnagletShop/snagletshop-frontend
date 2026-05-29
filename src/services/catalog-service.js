(function (window) {
  'use strict';

  const api = () => window.__SS_API__;
  const CATALOG_CACHE_KEY = 'ss_catalog_cache_v2';
  const CATALOG_FRESH_MS = 5 * 60 * 1000;
  const CATALOG_STALE_MS = 60 * 60 * 1000;
  const CATALOG_STALE_WAIT_MS = 1200;
  let catalogFetchPromise = null;

  function catalogPath() {
    return '/catalog';
  }

  function readCatalogCache(maxAgeMs) {
    try {
      const parsed = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || 'null');
      const at = Number(parsed?.at || 0);
      const data = parsed?.data;
      const age = Date.now() - at;
      if (!data || typeof data !== 'object' || !Number.isFinite(age) || age < 0 || age > maxAgeMs) return null;
      return { data, age };
    } catch {}
    return null;
  }

  function writeCatalogCache(data) {
    try {
      if (!data || typeof data !== 'object') return;
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
    } catch {}
  }

  function fetchCatalogFromServer() {
    if (catalogFetchPromise) return catalogFetchPromise;
    catalogFetchPromise = api().json(catalogPath(), {
      method: 'GET',
      cache: 'default',
      credentials: 'include'
    }).then((data) => {
      writeCatalogCache(data);
      return data;
    }).finally(() => {
      catalogFetchPromise = null;
    });
    return catalogFetchPromise;
  }

  async function getPublicConfig() {
    return api().json('/public-config', { method: 'GET' });
  }

  async function getAssignments() {
    return api().json('/ab/assignments', { method: 'GET', credentials: 'include' });
  }

  async function getCatalog(options = {}) {
    const forceRefresh = options?.forceRefresh === true;
    const fresh = forceRefresh ? null : readCatalogCache(CATALOG_FRESH_MS);
    if (fresh?.data) return fresh.data;

    const stale = forceRefresh ? null : readCatalogCache(CATALOG_STALE_MS);
    const fetchPromise = fetchCatalogFromServer();
    if (stale?.data) {
      const raced = await Promise.race([
        fetchPromise.then((data) => ({ type: 'fresh', data })).catch((err) => ({ type: 'error', err })),
        new Promise((resolve) => setTimeout(() => resolve({ type: 'stale', data: stale.data }), CATALOG_STALE_WAIT_MS))
      ]);
      if (raced.type === 'fresh') return raced.data;
      if (raced.type === 'error') return stale.data;
      fetchPromise.catch(() => {});
      return raced.data;
    }

    return fetchPromise;
  }

  window.__SS_CATALOG_SERVICE__ = { getPublicConfig, getAssignments, getCatalog };
})(window);
