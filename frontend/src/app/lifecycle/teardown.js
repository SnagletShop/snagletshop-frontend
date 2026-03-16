(function (window) {
  'use strict';

  const app = window.__SS_APP__;
  if (!app || typeof app.addTeardownTask !== 'function') return;

  let teardownStarted = false;

  function triggerTeardown(reason) {
    if (teardownStarted) return;
    teardownStarted = true;
    try { window.__SS_STATE__?.patch?.('app', { teardownReason: reason || 'unknown' }); } catch {}
    try { void app.teardown?.(); } catch {}
  }

  try { window.addEventListener('pagehide', () => triggerTeardown('pagehide')); } catch {}
  try { window.addEventListener('beforeunload', () => triggerTeardown('beforeunload')); } catch {}

  app.addTeardownTask('runtime.cleanup', async () => {
    try { if (typeof window.hideAppLoader === 'function') window.hideAppLoader(); } catch {}
  }, { required: false });

  app.addTeardownTask('screens.cleanup', async () => {
    try { window.__SS_SCREENS__?.cleanupActive?.('app-teardown'); } catch {}
  }, { required: false });

  app.addTeardownTask('router.cleanup', async () => {
    try { window.__SS_ROUTER__?.unbind?.(); } catch {}
  }, { required: false });
})(window);
