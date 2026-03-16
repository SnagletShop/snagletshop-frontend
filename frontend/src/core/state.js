(function (window) {
  const listeners = new Set();
  const state = {
    app: { booted: false },
    session: {},
    basket: {},
    pricing: {},
    ui: {},
    catalog: {},
    checkout: {},
    navigation: {}
  };

  function clone(value) {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map(clone);
    if (typeof value === 'object') {
      try { return JSON.parse(JSON.stringify(value)); } catch {}
      return Object.assign({}, value);
    }
    return value;
  }

  function emit(meta) {
    for (const fn of listeners) {
      try { fn(state, meta || null); } catch (err) { console.error('[ss state]', err); }
    }
  }

  function ensureSlice(slice) {
    const key = String(slice || '');
    if (!key) return null;
    if (!state[key] || typeof state[key] !== 'object') state[key] = {};
    return key;
  }

  window.__SS_STATE__ = {
    getState() { return state; },
    getSlice(slice) {
      const key = ensureSlice(slice);
      return key ? state[key] : undefined;
    },
    patch(slice, patch) {
      const key = ensureSlice(slice);
      if (!key) return undefined;
      state[key] = Object.assign({}, state[key] || {}, patch || {});
      emit({ type: 'patch', slice: key });
      return state[key];
    },
    replace(slice, nextValue) {
      const key = ensureSlice(slice);
      if (!key) return undefined;
      state[key] = clone(nextValue || {});
      emit({ type: 'replace', slice: key });
      return state[key];
    },
    mutate(slice, fn) {
      const key = ensureSlice(slice);
      if (!key || typeof fn !== 'function') return undefined;
      const current = clone(state[key] || {});
      const result = fn(current);
      state[key] = result === undefined ? current : result;
      emit({ type: 'mutate', slice: key });
      return state[key];
    },
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
})(window);
