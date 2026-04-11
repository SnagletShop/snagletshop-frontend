(function (window) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getScreens() { return getResolver()?.resolve?.('screens.manager', window.__SS_SCREENS__ || null) || null; }
  function getRouter() { return getResolver()?.resolve?.('app.router', window.__SS_ROUTER__ || null) || null; }
  function reviews() { return window.__SS_PRODUCT_REVIEWS__ || null; }

  function mount(payload = {}) {
    return reviews()?.mountReviewPage?.(payload) || function cleanupReviewScreen() {};
  }

  getScreens()?.register?.('product-review', mount);
  getRouter()?.registerAction?.('GoToReviewProduct', function routeReview(state) {
    return getScreens()?.show?.('product-review', state);
  });
})(window);
