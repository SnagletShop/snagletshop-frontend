(function (window) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getScreens() { return getResolver()?.resolve?.('screens.manager', window.__SS_SCREENS__ || null) || null; }
  function getRouter() { return getResolver()?.resolve?.('app.router', window.__SS_ROUTER__ || null) || null; }

  function mount(payload = {}) {
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const category = data[0] ?? 'Default_Page';
    const sortBy = data[1] ?? (localStorage.getItem('defaultSort') || 'NameFirst');
    const sortOrder = data[2] ?? (window.currentSortOrder || 'asc');
    const runtime = getResolver()?.resolve?.('domain.catalogUiRuntime', window.__SS_CATALOG_UI_RUNTIME__ || null);
    if (typeof runtime?.renderCatalogProducts === 'function') runtime.renderCatalogProducts(window.__SS_CATALOG_UI_CTX__ || {}, category, sortBy, sortOrder);
    try { (runtime?.categoryButtons || runtime?.CategoryButtons)?.call(runtime, window.__SS_CATALOG_UI_CTX__ || {}); } catch {}
    return function cleanupCatalogScreen() {};
  }

  getScreens()?.register?.('catalog', mount);
  getRouter()?.registerAction?.('loadProducts', function routeCatalog(state) {
    return getScreens()?.show?.('catalog', state);
  });
})(window);
