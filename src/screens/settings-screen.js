(function (window) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getScreens() { return getResolver()?.resolve?.('screens.manager', window.__SS_SCREENS__ || null) || null; }
  function getRouter() { return getResolver()?.resolve?.('app.router', window.__SS_ROUTER__ || null) || null; }
  function getApp() { return getResolver()?.getApp?.() || window.__SS_APP__ || null; }

  function mount() {
    try {
      const run = typeof window.renderSettingsScreen === 'function' ? window.renderSettingsScreen : null;
      if (run) Promise.resolve(run()).catch((err) => {
        try { getApp()?.captureError?.(err, { stage: 'screen.settings.mount' }); } catch {}
      });
    } catch (err) {
      try { getApp()?.captureError?.(err, { stage: 'screen.settings.mount' }); } catch {}
    }
    return function cleanupSettingsScreen() {};
  }

  getScreens()?.register?.('settings', mount);
  getRouter()?.registerAction?.('GoToSettings', function routeSettings(state) {
    return getScreens()?.show?.('settings', state);
  });
})(window);
