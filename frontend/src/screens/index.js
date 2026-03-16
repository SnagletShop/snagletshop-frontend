(function (window) {
  'use strict';

  let active = null;
  const screens = new Map();

  function getResolver() {
    return window.__SS_RESOLVE__ || null;
  }

  function getApp() {
    return getResolver()?.getApp?.() || window.__SS_APP__ || null;
  }

  function getRuntimeStore() {
    return getResolver()?.resolve?.('state.runtime', window.__SS_RUNTIME_STORE__ || null) || null;
  }

  function register(name, mount) {
    if (!name || typeof mount !== 'function') return function noop() {};
    const key = String(name);
    screens.set(key, mount);
    try { getApp()?.register?.(`screen.${key}`, { name: key, mount }); } catch {}
    return () => screens.delete(key);
  }

  function cleanupActive(reason) {
    if (!active) return;
    try { active.cleanup?.({ reason: reason || 'screen-switch', previous: active.name }); } catch (err) {
      try { getApp()?.captureError?.(err, { stage: 'screen.cleanup', screen: active.name }); } catch {}
    }
    active = null;
  }

  function show(name, payload = {}) {
    const key = String(name || '').trim();
    const mount = screens.get(key);
    if (!mount) {
      console.warn('[ss screens] missing screen:', key);
      return null;
    }

    if (active?.name === key) {
      try {
        const nextCleanup = mount(payload, { active: true, remount: true, previous: active.name });
        if (typeof nextCleanup === 'function') active.cleanup = nextCleanup;
      } catch (err) {
        try { getApp()?.captureError?.(err, { stage: 'screen.remount', screen: key }); } catch {}
        throw err;
      }
      try { getRuntimeStore()?.syncRuntimeState?.('screen-remount', { activeScreen: key, activeScreenAt: Date.now() }); } catch {}
      return key;
    }

    cleanupActive('screen-change');
    let cleanup = null;
    try {
      cleanup = mount(payload, { active: false, previous: active?.name || null });
    } catch (err) {
      try { getApp()?.captureError?.(err, { stage: 'screen.mount', screen: key }); } catch {}
      throw err;
    }
    active = { name: key, cleanup: (typeof cleanup === 'function' ? cleanup : null), mountedAt: Date.now() };
    try { getRuntimeStore()?.syncRuntimeState?.('screen-mount', { activeScreen: key, activeScreenAt: active.mountedAt }); } catch {}
    try { getApp()?.emit?.('screen:changed', { screen: key, payload }); } catch {}
    return key;
  }

  const api = {
    register,
    show,
    cleanupActive,
    getActive() {
      return active ? { ...active } : null;
    },
    list() {
      return Array.from(screens.keys());
    }
  };

  try { getResolver()?.expose?.('screens.manager', api, ['__SS_SCREENS__']); } catch { window.__SS_SCREENS__ = api; }
})(window);
