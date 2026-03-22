(function (window, document) {
  function onReady(fn) {
    try { window.__SS_BOOT__?.onReady(fn); } catch (err) { console.error('[ss startup] register failed', err); }
  }

  function initTurnstile() {
    try { if (typeof window.__snagletInitTurnstileOnce === 'function') window.__snagletInitTurnstileOnce(); } catch {}
  }

  function runBootApp() {
    try {
      const app = window.__SS_APP__;
      if (typeof window.bootApp === 'function') return Promise.resolve(window.bootApp());
    } catch (err) {
      console.warn('[ss startup] bootApp failed', err);
    }
  }

  function initSearch() {
    try { if (typeof window.setupSearchInputs === 'function') window.setupSearchInputs(); } catch {}
  }

  function primeInitialPriceCache() {
    try {
      if (typeof window.__ssPrimePriceCacheFromDom === 'function') {
        window.__ssPrimePriceCacheFromDom(document);
        return;
      }
    } catch {}
    try { if (typeof window.initializePrices === 'function') window.initializePrices(document); } catch {}
  }

  async function warmStripeConfig() {
    try { if (typeof window.ensureStripePublishableKey === 'function') await window.ensureStripePublishableKey(); } catch {}
  }

  async function initRouteStatusAndReturn() {
    try { if (typeof window.installApiHealthIndicator === 'function') window.installApiHealthIndicator(); } catch {}
    try { if (typeof window.installOrderTrackingButton === 'function') window.installOrderTrackingButton(); } catch {}
    try { window.__SS_RESOLVE__?.resolve?.('screen.orderStatus', window.__SS_ORDER_STATUS_SCREEN__ || null)?.openFromLocation?.(); } catch {}
    try {
      if (typeof window.handleStripeRedirectReturnOnLoad === 'function') {
        await window.handleStripeRedirectReturnOnLoad();
      }
    } catch (err) {
      try { console.warn('handleStripeRedirectReturnOnLoad failed:', err); } catch {}
    } finally {
      try { if (typeof window.checkAndShowPaymentSuccess === 'function') window.checkAndShowPaymentSuccess(); } catch {}
      try { if (typeof window.checkAndHandlePendingPaymentOnLoad === 'function') window.checkAndHandlePendingPaymentOnLoad(); } catch {}
    }
  }

  function normalizeRefreshHistory() {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0];
      const isPageRefresh = navEntry?.type === 'reload';
      const params = new URLSearchParams(window.location.search);
      const path = String(window.location.pathname || '/');
      const isProductDeepLink = path.startsWith('/p/') || params.has('product') || params.has('p') || params.has('pid') || params.has('productId');
      const isOrderStatusDeepLink = path.startsWith('/order-status/') || (params.has('orderId') && params.has('token'));
      if (isPageRefresh && !isProductDeepLink && !isOrderStatusDeepLink && typeof currentIndex !== 'undefined' && currentIndex >= 0 && typeof buildUrlForState === 'function') {
        const fallbackState = {
          action: 'loadProducts',
          data: [(typeof currentCategory !== 'undefined' ? currentCategory : null) || (typeof lastCategory !== 'undefined' ? lastCategory : null) || Object.keys(window.productsDatabase || window.products || {}).find(k => k !== 'Default_Page' && Array.isArray((window.productsDatabase || window.products || {})[k]) && (window.productsDatabase || window.products || {})[k].length) || 'Default_Page', localStorage.getItem('defaultSort') || 'NameFirst', (typeof currentSortOrder !== 'undefined' ? currentSortOrder : null) || 'asc']
        };
        const historyStack = (typeof userHistoryStack !== 'undefined' && Array.isArray(userHistoryStack)) ? userHistoryStack : [];
        const state = historyStack[currentIndex] || fallbackState;
        history.replaceState({ index: currentIndex }, '', buildUrlForState(state));
      }
    } catch {}
  }

  async function initPricingAndCurrency() {
    try {
      const currencySelect = document.getElementById('currency-select');
      if (typeof window.fetchTariffs === 'function') await window.fetchTariffs();
      if (!currencySelect) {
        console.warn('currency-select element not found. Skipping price initialization.');
        return;
      }
      try { currencySelect.value = (typeof selectedCurrency !== 'undefined' ? selectedCurrency : (window.selectedCurrency || 'EUR')); } catch {}
      try { if (typeof window.detectUserCurrency === 'function') window.detectUserCurrency(); } catch {}
      try { if (typeof window.initializePrices === 'function') window.initializePrices(); } catch {}
      try { if (typeof window.observeNewProducts === 'function') window.observeNewProducts(); } catch {}
      try { if (typeof window.fetchExchangeRatesFromServer === 'function') await window.fetchExchangeRatesFromServer(); } catch {}
      try { window.__SS_CATALOG_RUNTIME__?.reconcileRememberedPrices?.(); } catch {}
      try { if (typeof window.updateAllPrices === 'function') window.updateAllPrices(); } catch {}
    } catch (err) {
      console.warn('[ss startup] pricing init failed', err);
    }
  }

  function initThemeAndCatalogSync() {
    try {
      const savedTheme = localStorage.getItem('themeMode');
      const isDarkMode = savedTheme === 'dark';
      if (savedTheme) {
        document.documentElement.classList.toggle('dark-mode', isDarkMode);
        document.documentElement.classList.toggle('light-mode', !isDarkMode);
      } else {
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('themeMode', 'light');
      }
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) themeToggle.checked = isDarkMode;
    } catch {}
    try { if (typeof window.syncCurrencySelects === 'function') syncCurrencySelects(typeof selectedCurrency !== 'undefined' ? selectedCurrency : window.selectedCurrency); } catch {}

    try {
      const checkProductsLoaded = setInterval(() => {
        try {
          const hasWindowProducts = typeof window.products !== 'undefined' && Object.keys(window.products || {}).length > 0;
          const hasDatabase = typeof window.productsDatabase !== 'undefined' && window.productsDatabase && Object.keys(window.productsDatabase || {}).length > 0;
          if (hasWindowProducts || hasDatabase) {
            clearInterval(checkProductsLoaded);
            if (!hasDatabase && hasWindowProducts) {
              window.__ssSetProductsDatabase ? window.__ssSetProductsDatabase(window.products) : (window.productsDatabase = window.products);
            } else if (hasDatabase && !hasWindowProducts) {
              window.products = window.productsDatabase || window.products || {};
            }
            try { if (typeof window.CategoryButtons === 'function') window.CategoryButtons(); } catch {}
          }
        } catch {}
      }, 100);

      try { window.__SS_APP__?.addCleanup?.(() => clearInterval(checkProductsLoaded)); } catch {}
    } catch {}
  }

  function handleStripeSuccessQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('redirect_status') === 'succeeded') {
        try { if (typeof window.clearBasketCompletely === 'function') window.clearBasketCompletely(); } catch {}
        try { if (typeof window.clearCheckoutDraft === 'function') window.clearCheckoutDraft(); } catch {}
        try { if (typeof window.setPaymentSuccessFlag === 'function') window.setPaymentSuccessFlag({ reloadOnOk: true }); } catch {}
        params.delete('redirect_status');
        params.delete('payment_intent');
        params.delete('payment_intent_client_secret');
        const newQuery = params.toString();
        const cleanUrl = window.location.pathname + (newQuery ? '?' + newQuery : '') + window.location.hash;
        history.replaceState({ index: (typeof currentIndex !== 'undefined' ? currentIndex : -1) }, '', cleanUrl);
        try { if (typeof window.checkAndShowPaymentSuccess === 'function') window.checkAndShowPaymentSuccess(); } catch {}
      }
    } catch {}
  }

  function bindRouterLifecycle() {
    try { window.__SS_ROUTER__?.bind?.(); } catch {}
  }

  function runDiagnostics() {
    try { window.__SS_DIAGNOSTICS__?.warnIfNeeded?.(window.__SS_DIAGNOSTICS__?.runDiagnostics?.()); } catch {}
  }

  function registerStartupTasks(app) {
    if (!app || typeof app.addStartupTask !== 'function') return false;
    app.addStartupTask('startup.bindRouterLifecycle', async () => { bindRouterLifecycle(); }, { required: false });
    app.addStartupTask('startup.initTurnstile', async () => { initTurnstile(); }, { required: false });
    app.addStartupTask('startup.primeInitialPriceCache', async () => { primeInitialPriceCache(); }, { required: false });
    app.addStartupTask('startup.boot', async () => { await runBootApp(); });
    app.addStartupTask('startup.initSearch', async () => { initSearch(); }, { required: false });
    app.addStartupTask('startup.routeStatusAndReturn', async () => { initRouteStatusAndReturn(); }, { required: false });
    app.addStartupTask('startup.normalizeRefreshHistory', async () => { normalizeRefreshHistory(); }, { required: false });
    app.addStartupTask('startup.pricingAndCurrency', async () => { await initPricingAndCurrency(); }, { required: false });
    app.addStartupTask('startup.themeAndCatalogSync', async () => { initThemeAndCatalogSync(); }, { required: false });
    app.addStartupTask('startup.stripeSuccessQuery', async () => { handleStripeSuccessQuery(); }, { required: false });
    app.addStartupTask('startup.diagnostics', async () => { runDiagnostics(); }, { required: false });
    return true;
  }

  const app = window.__SS_APP__;
  const hasApp = registerStartupTasks(app);

  if (hasApp) {
    onReady(() => { void app.start(); });
  } else {
    onReady(bindRouterLifecycle);
    onReady(initTurnstile);
    onReady(primeInitialPriceCache);
    onReady(runBootApp);
    onReady(initSearch);
    onReady(initRouteStatusAndReturn);
    onReady(normalizeRefreshHistory);
    onReady(() => { void initPricingAndCurrency(); });
    onReady(initThemeAndCatalogSync);
    onReady(handleStripeSuccessQuery);
    onReady(runDiagnostics);
  }
})(window, document);
