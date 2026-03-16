(function (window) {
  'use strict';

  function persistHistoryState(ctx = {}) {
    try {
      sessionStorage.setItem(ctx.HISTORY_SESSION_KEY, JSON.stringify(ctx.getStack?.() || []));
      sessionStorage.setItem(ctx.HISTORY_INDEX_SESSION_KEY, String(Number.isFinite(ctx.getIndex?.()) ? ctx.getIndex() : -1));
    } catch {}
    try { ctx.syncCentralState?.('history-persisted', { userHistoryStack: ctx.getStack?.(), currentIndex: ctx.getIndex?.() }); } catch {}
  }

  function restoreHistoryStateFromSession(ctx = {}) {
    try {
      const rawStack = sessionStorage.getItem(ctx.HISTORY_SESSION_KEY);
      const rawIndex = sessionStorage.getItem(ctx.HISTORY_INDEX_SESSION_KEY);
      const parsed = rawStack ? JSON.parse(rawStack) : null;
      if (Array.isArray(parsed) && parsed.length) {
        ctx.setStack?.(parsed);
        const idx = parseInt(rawIndex ?? String(parsed.length - 1), 10);
        ctx.setIndex?.(Number.isFinite(idx) ? Math.max(0, Math.min(idx, parsed.length - 1)) : (parsed.length - 1));
        try { ctx.syncCentralState?.('history-restored', { userHistoryStack: parsed, currentIndex: Number.isFinite(idx) ? Math.max(0, Math.min(idx, parsed.length - 1)) : (parsed.length - 1) }); } catch {}
        return true;
      }
    } catch {}
    return false;
  }

  window.__SS_HISTORY_RUNTIME__ = { persistHistoryState, restoreHistoryStateFromSession };
})(window);
