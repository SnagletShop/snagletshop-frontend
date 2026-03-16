(function (window) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getScreens() { return getResolver()?.resolve?.('screens.manager', window.__SS_SCREENS__ || null) || null; }
  function getRouter() { return getResolver()?.resolve?.('app.router', window.__SS_ROUTER__ || null) || null; }

  function mount() {
    const basket = getResolver()?.resolve?.('domain.basket', window.__SS_BASKET__ || null);
    if (typeof basket?.GoToCart === 'function') basket.GoToCart();
    return function cleanupBasketScreen() {};
  }

  getScreens()?.register?.('basket', mount);
  getRouter()?.registerAction?.('GoToCart', function routeBasket(state) {
    return getScreens()?.show?.('basket', state);
  });
})(window);
