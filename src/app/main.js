(function (window, document) {
  'use strict';

  function ensureApp() {
    if (window.__SS_APP__) return window.__SS_APP__;
    const factory = window.__SS_CREATE_APP__;
    if (typeof factory !== 'function') {
      console.error('[ss app] createApp factory missing');
      return null;
    }
    const app = factory();
    window.__SS_APP__ = app;
    return app;
  }

  const app = ensureApp();
  if (!app) return;

  const registrations = {
    'document.readyState': document.readyState,
    'app.router': window.__SS_ROUTER__ || null,
    'app.resolve': window.__SS_RESOLVE__ || null,
    'app.diagnostics': window.__SS_DIAGNOSTICS__ || null,
    'app.loader': window.__SS_APP_LOADER__ || null,
    'app.bootRuntime': window.__SS_BOOT_RUNTIME__ || null,
    'app.historyRuntime': window.__SS_HISTORY_RUNTIME__ || null,
    'state.runtime': window.__SS_RUNTIME_STORE__ || null,
    'service.storage': window.__SS_STORAGE_SERVICE__ || null,
    'service.catalog': window.__SS_CATALOG_SERVICE__ || null,
    'service.pricing': window.__SS_PRICING_SERVICE__ || null,
    'service.checkout': window.__SS_CHECKOUT_SERVICE__ || null,
    'service.orders': window.__SS_ORDERS_SERVICE__ || null,
    'service.analytics': window.__SS_ANALYTICS_SERVICE__ || null,
    'service.recommendations': window.__SS_RECOMMENDATIONS_SERVICE__ || null,
    'core.utilsRuntime': window.__SS_UTILS_RUNTIME__ || null,
    'core.storageRuntime': window.__SS_STORAGE_RUNTIME__ || null,
    'domain.catalogRuntime': window.__SS_CATALOG_RUNTIME__ || null,
    'domain.catalogUiRuntime': window.__SS_CATALOG_UI_RUNTIME__ || null,
    'domain.catalogImageRuntime': window.__SS_CATALOG_IMAGE_RUNTIME__ || null,
    'domain.pricingRuntime': window.__SS_PRICING_RUNTIME__ || null,
    'domain.settingsRuntime': window.__SS_SETTINGS_RUNTIME__ || null,
    'domain.settingsCountryRuntime': window.__SS_SETTINGS_COUNTRY_RUNTIME__ || null,
    'domain.productRuntime': window.__SS_PRODUCT_RUNTIME__ || null,
    'domain.productIdRuntime': window.__SS_PRODUCT_ID_RUNTIME__ || null,
    'domain.ordersRuntime': window.__SS_ORDERS_RUNTIME__ || null,
    'domain.mediaRuntime': window.__SS_MEDIA_RUNTIME__ || null,
    'domain.checkoutRuntime': window.__SS_CHECKOUT_RUNTIME__ || null,
    'domain.checkoutUi': window.__SS_CHECKOUT_UI__ || null,
    'domain.modalRuntime': window.__SS_MODAL_RUNTIME__ || null,
    'domain.basketRuntime': window.__SS_BASKET_RUNTIME__ || null,
    'domain.cartRuntime': window.__SS_CART_RUNTIME__ || null,
    'domain.stripeConfigRuntime': window.__SS_STRIPE_CONFIG_RUNTIME__ || null,
    'screens.manager': window.__SS_SCREENS__ || null,
    'screen.orderStatus': window.__SS_ORDER_STATUS_SCREEN__ || null,
    'component.quantityControls': window.__SS_QUANTITY_CONTROLS__ || null,
    'component.productCard': window.__SS_PRODUCT_CARD__ || null,
    'component.basketRow': window.__SS_BASKET_ROW__ || null
  };

  for (const [name, value] of Object.entries(registrations)) app.register(name, value);

  app.on('error', ({ error, meta }) => {
    console.warn('[ss app error event]', meta?.stage || 'unknown', error?.message || error);
  });

  try {
    document.addEventListener('visibilitychange', () => {
      app.register('document.visibilityState', document.visibilityState);
    });
  } catch {}

  try {
    window.addEventListener('beforeunload', () => {
      try { app.emit('app:beforeunload', app.getContext()); } catch {}
    });
  } catch {}
})(window, document);
