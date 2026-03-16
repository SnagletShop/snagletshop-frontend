(function (window) {
  'use strict';

  const base = () => window.__SS_STORAGE__ || null;

  function get(key, fallback = null) {
    return base()?.get?.(key, fallback) ?? fallback;
  }

  function set(key, value) {
    return !!base()?.set?.(key, value);
  }

  function remove(key) {
    return !!base()?.remove?.(key);
  }

  function getJSON(key, fallback = null) {
    return base()?.getJSON?.(key, fallback) ?? fallback;
  }

  function setJSON(key, value) {
    return !!base()?.setJSON?.(key, value);
  }

  function getSession(key, fallback = null) {
    try {
      const value = window.sessionStorage.getItem(key);
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function setSession(key, value) {
    try { window.sessionStorage.setItem(key, String(value)); return true; } catch { return false; }
  }

  function removeSession(key) {
    try { window.sessionStorage.removeItem(key); return true; } catch { return false; }
  }

  function createDeviceScopedKeys(keys = {}) {
    const out = {};
    for (const [name, key] of Object.entries(keys || {})) {
      out[name] = String(key || '').trim();
    }
    return out;
  }

  window.__SS_STORAGE_SERVICE__ = {
    get,
    set,
    remove,
    getJSON,
    setJSON,
    getSession,
    setSession,
    removeSession,
    createDeviceScopedKeys
  };
})(window);
