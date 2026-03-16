(function (window) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getScreens() { return getResolver()?.resolve?.('screens.manager', window.__SS_SCREENS__ || null) || null; }
  function getRouter() { return getResolver()?.resolve?.('app.router', window.__SS_ROUTER__ || null) || null; }

  function mount(payload = {}) {
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const product = getResolver()?.resolve?.('domain.product', window.__SS_PRODUCT__ || null);
    if (typeof product?.GoToProductPage === 'function') product.GoToProductPage(data[0], data[1], data[2], data[3], data[4], data[5]);
    return function cleanupProductScreen() {};
  }

  getScreens()?.register?.('product', mount);
  getRouter()?.registerAction?.('GoToProductPage', function routeProduct(state) {
    return getScreens()?.show?.('product', state);
  });
})(window);
