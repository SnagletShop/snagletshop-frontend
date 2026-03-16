(function (window) {
  'use strict';

  function isSettingsCacheValid(timestamp, ttlHours = 12) {
    if (!timestamp) return false;
    const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    return ageInHours < ttlHours;
  }

  function safeJsonParse(str, fallback = null) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function lsGet(key, fallback = null) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  }

  window.__SS_STORAGE_RUNTIME__ = { isSettingsCacheValid, safeJsonParse, lsGet, lsSet };
})(window);
