
(function (window) {
  window.__SS_BOOT__?.onReady(function () {
    try {
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('portrait').catch(function (err) {
          console.warn('Orientation lock failed:', err);
        });
      }
    } catch {}
  });
})(window);
