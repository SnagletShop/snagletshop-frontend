(function (window) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getScreens() { return getResolver()?.resolve?.('screens.manager', window.__SS_SCREENS__ || null) || null; }
  function getRouter() { return getResolver()?.resolve?.('app.router', window.__SS_ROUTER__ || null) || null; }

  function mount(payload = {}) {
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const query = data[0] ?? '';
    const search = getResolver()?.resolve?.('domain.search', window.__SS_SEARCH__ || null);
    if (typeof search?.searchQuery === 'function') search.searchQuery(query);
    return function cleanupSearchScreen() {};
  }

  getScreens()?.register?.('search', mount);
  getRouter()?.registerAction?.('searchQuery', function routeSearch(state) {
    return getScreens()?.show?.('search', state);
  });
})(window);
