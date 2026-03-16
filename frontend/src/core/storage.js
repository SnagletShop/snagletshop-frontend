
(function (window) {
  const safe = {
    get(key, fallback = null) {
      try {
        const value = window.localStorage.getItem(key);
        return value == null ? fallback : value;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, String(value)); return true; } catch { return false; }
    },
    remove(key) {
      try { window.localStorage.removeItem(key); return true; } catch { return false; }
    },
    getJSON(key, fallback = null) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    setJSON(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    }
  };
  window.__SS_STORAGE__ = safe;
})(window);
