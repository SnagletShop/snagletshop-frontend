(function (window) {
  'use strict';

  function getApp() {
    return window.__SS_APP__ || null;
  }

  function resolve(name, fallback = null) {
    try {
      const app = getApp();
      if (app?.resolve) {
        const resolved = app.resolve(String(name || ''), fallback);
        if (resolved != null) return resolved;
      }
    } catch {}
    return fallback;
  }

  function call(name, method, args = [], fallback = null) {
    const target = resolve(name, fallback);
    const fn = target && typeof target[method] === 'function' ? target[method] : null;
    if (!fn) return undefined;
    return fn.apply(target, Array.isArray(args) ? args : []);
  }

  function expose(name, value, aliases = []) {
    if (!name) return value;
    try { getApp()?.register?.(String(name), value); } catch {}
    for (const alias of Array.isArray(aliases) ? aliases : []) {
      try { if (alias) window[alias] = value; } catch {}
    }
    return value;
  }

  window.__SS_RESOLVE__ = {
    getApp,
    resolve,
    call,
    expose
  };
  try { getApp()?.register?.('app.resolve', window.__SS_RESOLVE__); } catch {}
})(window);
