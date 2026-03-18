
(function (window, document) {
  const boot = {
    started: false,
    starting: false,
    queue: [],
    onReady(fn) {
      if (typeof fn !== 'function') return;
      if (this.started) {
        try { fn(); } catch (err) { console.error('[ss boot] ready callback failed', err); }
        return;
      }
      this.queue.push(fn);
    },
    start() {
      if (this.started || this.starting) return;
      this.starting = true;
      const queue = this.queue.slice();
      this.queue.length = 0;
      for (const fn of queue) {
        try { fn(); } catch (err) { console.error('[ss boot] queued callback failed', err); }
      }
      this.started = true;
      this.starting = false;
      try {
        document.dispatchEvent(new CustomEvent('snagletshop:boot-ready'));
      } catch {}
    }
  };
  window.__SS_BOOT__ = boot;
  if (document.readyState === 'complete') {
    Promise.resolve().then(() => boot.start());
  } else {
    document.addEventListener('DOMContentLoaded', () => boot.start(), { once: true });
  }
})(window, document);
