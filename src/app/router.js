(function (window) {
  'use strict';

  function getFirstRenderableCategory() {
    const db = (window.productsDatabase && typeof window.productsDatabase === 'object') ? window.productsDatabase : (window.products || {});
    return Object.keys(db || {}).find((k) => k !== 'Default_Page' && Array.isArray(db[k]) && db[k].length) || 'Default_Page';
  }

  const actionHandlers = new Map();
  let popstateBound = false;
  let popstateHandler = null;

  function getApp() {
    return window.__SS_APP__ || null;
  }

  function getRuntimeStore() {
    return window.__SS_RUNTIME_STORE__ || null;
  }

  function syncNavigationState(reason, patch) {
    try { getRuntimeStore()?.syncRuntimeState?.(reason, patch || {}); } catch {}
  }

  function getHistoryStack() {
    return Array.isArray(window.userHistoryStack) ? window.userHistoryStack : (window.userHistoryStack = []);
  }

  function getHistoryIndex() {
    return Number.isInteger(window.currentIndex) ? window.currentIndex : -1;
  }

  function setHistoryCache(stack, index, reason) {
    window.userHistoryStack = Array.isArray(stack) ? stack : [];
    window.currentIndex = Number.isInteger(index) ? index : -1;
    syncNavigationState(reason, { userHistoryStack: window.userHistoryStack, currentIndex: window.currentIndex });
    try { window.__ssPersistHistoryState?.(); } catch {}
    return window.currentIndex;
  }

  function getDefaultSort() {
    try { return localStorage.getItem('defaultSort') || 'NameFirst'; } catch {}
    return 'NameFirst';
  }

  function getDefaultSortOrder() {
    return String(window.currentSortOrder || 'asc').trim().toLowerCase() === 'desc' ? 'desc' : 'asc';
  }

  function normalizeSortOrder(value) {
    return String(value || '').trim().toLowerCase() === 'desc' ? 'desc' : 'asc';
  }

  function buildCatalogState(category, sortBy, sortOrder) {
    const fallbackCategory = getFirstRenderableCategory();
    const safeCategory = String(category || '').trim() || fallbackCategory;
    return {
      action: 'loadProducts',
      data: [
        safeCategory,
        String(sortBy || getDefaultSort()).trim() || getDefaultSort(),
        normalizeSortOrder(sortOrder || getDefaultSortOrder())
      ]
    };
  }

  function parseRoute(urlLike) {
    const url = new URL(urlLike || window.location.href, window.location.origin);
    const params = url.searchParams;
    const path = String(url.pathname || '/');
    const productFromPath = path.startsWith('/p/') ? decodeURIComponent(path.slice(3)) : '';
    const orderFromPath = path.startsWith('/order-status/') ? decodeURIComponent(path.slice('/order-status/'.length).split('/')[0] || '') : '';
    const view = String(params.get('view') || '').trim().toLowerCase();
    return {
      path,
      params,
      productId: params.get('p') || params.get('pid') || params.get('productId') || productFromPath || '',
      productName: params.get('product') || '',
      query: params.get('q') || '',
      category: params.get('category') || params.get('c') || '',
      sortBy: params.get('sort') || '',
      sortOrder: params.get('order') || params.get('dir') || '',
      view,
      orderId: orderFromPath || params.get('orderId') || '',
      token: params.get('token') || '',
      recoToken: params.get('reco') || ''
    };
  }

  function hasExplicitRoute(route) {
    return !!(
      route?.productId ||
      route?.productName ||
      route?.query ||
      route?.category ||
      route?.view === 'cart' ||
      route?.view === 'settings' ||
      route?.orderId ||
      route?.path?.startsWith('/p/') ||
      route?.path?.startsWith('/order-status/')
    );
  }

  function findProductForRoute(route) {
    try {
      if (route?.productId) {
        const pid = (typeof window.__ssIdNorm === 'function' ? window.__ssIdNorm(route.productId) : String(route.productId).trim());
        const flatById = typeof window.getAllProductsFlatSafe === 'function'
          ? window.getAllProductsFlatSafe()
          : (typeof window.__ssGetCatalogFlat === 'function' ? window.__ssGetCatalogFlat() : []);
        const eq = typeof window.__ssIdEq === 'function' ? window.__ssIdEq : ((a, b) => String(a ?? '').trim() === String(b ?? '').trim());
        return (flatById || []).find((p) => eq(p?.productId, pid)) || null;
      }
    } catch {}
    try {
      if (route?.productName && typeof window.findProductByNameParam === 'function') {
        return window.findProductByNameParam(route.productName) || null;
      }
    } catch {}
    return null;
  }

  function createProductState(product, route = {}) {
    if (!product) return null;
    const pid = String(product?.productId || product?.id || route?.productId || '').trim() || null;
    const desc = ((window.__ssABGetProductDescription?.(product) || product?.description) || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || 'No description available.');
    const price = (window.__ssResolveVariantPriceEUR?.(product, [], '') || product?.price || product?.priceEUR || product?.basePrice || product?.sellPrice || 0);
    const recoTok = String(route?.recoToken || '').trim();
    if (recoTok && pid) {
      try {
        const eq = typeof window.__ssIdEq === 'function' ? window.__ssIdEq : ((a, b) => String(a ?? '').trim() === String(b ?? '').trim());
        const ent = window.__ssRecoDiscountStoreGet?.(recoTok);
        if (ent && eq(ent.productId, pid) && Number(ent.discountPct || 0) > 0) {
          sessionStorage.setItem('ss_reco_pdp_discount_v1', JSON.stringify({
            productId: pid,
            discountToken: recoTok,
            discountPct: Number(ent.discountPct || 0),
            discountedPrice: Number(ent.discountedPrice || 0),
            ts: Date.now()
          }));
        }
      } catch {}
    }
    return {
      action: 'GoToProductPage',
      data: [
        product?.name,
        price,
        desc,
        null,
        pid,
        (recoTok ? { discountToken: recoTok } : null)
      ]
    };
  }

  function resolveStateFromRoute(route, options = {}) {
    if (!route || typeof route !== 'object') return null;
    const allowDefaultCatalog = options.allowDefaultCatalog === true;

    if (route.productId || route.productName || route.path.startsWith('/p/')) {
      return createProductState(findProductForRoute(route), route);
    }

    if (route.orderId) {
      return buildCatalogState(route.category || window.currentCategory || getFirstRenderableCategory(), route.sortBy || getDefaultSort(), route.sortOrder || getDefaultSortOrder());
    }

    if (route.query) {
      return { action: 'searchQuery', data: [String(route.query || '').trim()] };
    }

    if (route.view === 'cart') {
      return { action: 'GoToCart', data: [] };
    }

    if (route.view === 'settings') {
      return { action: 'GoToSettings', data: [] };
    }

    if (route.category) {
      return buildCatalogState(route.category, route.sortBy || getDefaultSort(), route.sortOrder || getDefaultSortOrder());
    }

    if (allowDefaultCatalog) {
      return buildCatalogState(window.currentCategory || getFirstRenderableCategory(), route.sortBy || getDefaultSort(), route.sortOrder || getDefaultSortOrder());
    }

    return null;
  }

  function buildUrlForState(state) {
    try {
      if (state?.action === 'GoToProductPage') {
        const name = state?.data?.[0];
        const idNorm = typeof window.__ssIdNorm === 'function' ? window.__ssIdNorm : (v) => String(v ?? '').trim();
        const isBadId = typeof window.__ssIsBadId === 'function' ? window.__ssIsBadId : (v) => !String(v ?? '').trim();
        const pidRaw = state?.data?.[4];
        const pid = idNorm(pidRaw);
        const disc = state?.data?.[5] && typeof state.data[5] === 'object' ? state.data[5] : null;
        const tok = idNorm(disc?.discountToken || disc?.recoToken || '');
        const pidOk = pid && !isBadId(pid);
        if (pidOk) {
          if (window.__SS_USE_PATH_ROUTES__) {
            if (tok) return `/p/${encodeURIComponent(pid)}?reco=${encodeURIComponent(tok)}`;
            return `/p/${encodeURIComponent(pid)}`;
          }
          if (tok) return `/?p=${encodeURIComponent(pid)}&reco=${encodeURIComponent(tok)}`;
          return `/?p=${encodeURIComponent(pid)}`;
        }
        if (name) return `/?product=${encodeURIComponent(name)}`;
      }

      if (state?.action === 'searchQuery') {
        const query = String(state?.data?.[0] || '').trim();
        return query ? `/?q=${encodeURIComponent(query)}` : '/';
      }

      if (state?.action === 'GoToCart') {
        return '/?view=cart';
      }

      if (state?.action === 'GoToSettings') {
        return '/?view=settings';
      }

      if (state?.action === 'loadProducts') {
        const category = String(state?.data?.[0] || '').trim() || getFirstRenderableCategory();
        const sortBy = String(state?.data?.[1] || getDefaultSort()).trim() || getDefaultSort();
        const sortOrder = normalizeSortOrder(state?.data?.[2] || getDefaultSortOrder());
        const params = new URLSearchParams();
        const firstCategory = getFirstRenderableCategory();
        if (category && category !== firstCategory && category !== 'Default_Page') params.set('category', category);
        if (sortBy && sortBy !== getDefaultSort()) params.set('sort', sortBy);
        if (sortOrder !== 'asc') params.set('order', sortOrder);
        const query = params.toString();
        return query ? `/?${query}` : '/';
      }
    } catch {}
    return '/';
  }

  function buildHistoryState(routeState, index, extra = {}) {
    const out = { index: Number.isInteger(index) ? index : -1 };
    if (routeState) out.route = routeState;
    if (extra.modalOpen === true) out.modalOpen = true;
    return out;
  }

  function replaceBrowserState(routeState, index, extra = {}, urlOverride = '') {
    try {
      const nextUrl = String(urlOverride || '').trim() || buildUrlForState(routeState);
      window.history.replaceState(buildHistoryState(routeState, index, extra), '', nextUrl);
    } catch {}
  }

  function pushBrowserState(routeState, index, extra = {}, urlOverride = '') {
    const nextUrl = String(urlOverride || '').trim() || buildUrlForState(routeState);
    window.history.pushState(buildHistoryState(routeState, index, extra), '', nextUrl);
  }

  function defaultDispatch(state) {
    switch (state?.action) {
      case 'loadProducts': {
        const [category, sort, order] = state.data || [];
        try { window.currentCategory = category; } catch {}
        try { syncNavigationState('route-category', { currentCategory: category }); } catch {}
        try { if (typeof window.loadProducts === 'function') window.loadProducts(category, sort, order); } catch {}
        try { if (typeof window.CategoryButtons === 'function') window.CategoryButtons(); } catch {}
        return;
      }
      case 'GoToProductPage':
        if (typeof window.GoToProductPage === 'function') return window.GoToProductPage(...(state.data || []));
        return;
      case 'GoToCart':
        if (typeof window.GoToCart === 'function') return window.GoToCart();
        return;
      case 'GoToSettings':
        if (typeof window.GoToSettings === 'function') return window.GoToSettings();
        return;
      case 'searchQuery':
        if (typeof window.searchQuery === 'function') return window.searchQuery(...(state.data || []));
        return;
      default:
        console.warn('[ss router] Unknown state action:', state?.action);
    }
  }

  function dispatchState(state) {
    const action = state?.action || '';
    const handler = actionHandlers.get(action);
    const app = getApp();
    try { app?.emit?.('router:before-dispatch', { state, action }); } catch {}
    try {
      const result = handler ? handler(state, { router: api, app, window }) : defaultDispatch(state);
      try { app?.emit?.('router:after-dispatch', { state, action }); } catch {}
      return result;
    } catch (err) {
      try { app?.captureError?.(err, { stage: 'router.dispatch', action }); } catch {}
      throw err;
    }
  }

  function shouldRestoreSessionHistory(route) {
    if (hasExplicitRoute(route)) return false;
    try {
      const navEntry = performance.getEntriesByType('navigation')[0];
      return navEntry?.type === 'reload' || navEntry?.type === 'back_forward';
    } catch {}
    return false;
  }

  function syncRouteIntoStack(routeState, index, reason) {
    const maxHistory = Number(window.MAX_HISTORY_LENGTH || 50);
    if (!routeState) return setHistoryCache([], -1, reason || 'history-sync-empty');
    if (!Number.isInteger(index) || index < 0 || index >= maxHistory) {
      return setHistoryCache([routeState], 0, reason || 'history-sync-reset');
    }
    const stack = getHistoryStack().slice();
    while (stack.length <= index) stack.push(null);
    stack[index] = routeState;
    return setHistoryCache(stack, index, reason || 'history-sync');
  }

  function resolvePopstateRoute(eventState) {
    if (eventState?.route?.action) return eventState.route;
    const index = eventState?.index;
    if (Number.isInteger(index) && getHistoryStack()?.[index]?.action) {
      return getHistoryStack()[index];
    }
    return resolveStateFromRoute(parseRoute(window.location.href), { allowDefaultCatalog: true });
  }

  function navigate(action, data = null, options = null) {
    if (window.isReplaying) return;

    const opts = (options && typeof options === 'object') ? options : {};
    const replaceCurrent = opts.replaceCurrent === true;
    const newState = { action, data };
    const historyStack = getHistoryStack().slice();
    let currentIndex = getHistoryIndex();
    const lastState = historyStack[currentIndex] || (window.history.state?.route || null);
    const sameAsLast = !!(lastState && JSON.stringify(lastState) === JSON.stringify(newState));

    if (sameAsLast) {
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      syncRouteIntoStack(newState, safeIndex, 'history-refresh-current');
      replaceBrowserState(newState, safeIndex);
      dispatchState(newState);
      return;
    }

    if (replaceCurrent && currentIndex >= 0 && historyStack[currentIndex]) {
      historyStack[currentIndex] = newState;
      setHistoryCache(historyStack, currentIndex, 'history-replace');
      replaceBrowserState(newState, currentIndex);
      dispatchState(newState);
      return;
    }

    if (currentIndex < historyStack.length - 1) {
      historyStack.splice(currentIndex + 1);
    }

    historyStack.push(newState);
    const maxHistory = Number(window.MAX_HISTORY_LENGTH || 50);
    if (historyStack.length > maxHistory) {
      const overflow = historyStack.length - maxHistory;
      historyStack.splice(0, overflow);
      currentIndex = historyStack.length - 1;
    } else {
      currentIndex = historyStack.length - 1;
    }

    setHistoryCache(historyStack, currentIndex, 'history-push');
    pushBrowserState(newState, currentIndex);
    dispatchState(newState);
  }

  function handlePopstate(event) {
    const modal = document.getElementById('paymentModal');
    const eventState = (event?.state && typeof event.state === 'object') ? event.state : null;
    const wantsModalOpen = eventState?.modalOpen === true;
    window.__ssHandlingPopstate = true;
    try {
      if (modal && typeof window.closeModal === 'function') {
        window.closeModal({ fromHistory: true });
      }

      const routeState = resolvePopstateRoute(eventState);
      if (routeState) {
        window.isReplaying = true;
        const nextIndex = syncRouteIntoStack(routeState, eventState?.index, 'history-pop');
        dispatchState(routeState);
        window.isReplaying = false;
        window.__ssModalHistoryPushed = wantsModalOpen;
        if (wantsModalOpen && typeof window.openModal === 'function') {
          Promise.resolve().then(() => window.openModal({ fromHistory: true })).catch(() => {});
        }
        replaceBrowserState(routeState, nextIndex, { modalOpen: wantsModalOpen }, window.location.href);
        return;
      }

      if (wantsModalOpen && typeof window.openModal === 'function') {
        window.__ssModalHistoryPushed = true;
        Promise.resolve().then(() => window.openModal({ fromHistory: true })).catch(() => {});
        return;
      }

      window.__ssModalHistoryPushed = false;
      console.warn('[ss router] Unable to resolve popstate route:', eventState);
    } finally {
      window.__ssHandlingPopstate = false;
      window.isReplaying = false;
    }
  }

  function initializeHistory() {
    const route = parseRoute(window.location.href);
    const browserState = (window.history.state && typeof window.history.state === 'object') ? window.history.state : null;

    if (route.orderId) {
      const fallbackState = resolveStateFromRoute(route, { allowDefaultCatalog: true }) || buildCatalogState(getFirstRenderableCategory(), getDefaultSort(), getDefaultSortOrder());
      setHistoryCache([fallbackState], 0, 'history-init-order-status');
      replaceBrowserState(fallbackState, 0, { modalOpen: browserState?.modalOpen === true }, window.location.href);
      dispatchState(fallbackState);
      return;
    }

    if (hasExplicitRoute(route)) {
      const explicitState = resolveStateFromRoute(route, { allowDefaultCatalog: false });
      if (explicitState) {
        setHistoryCache([explicitState], 0, 'history-init-explicit');
        replaceBrowserState(explicitState, 0);
        dispatchState(explicitState);
        return;
      }
      const fallbackState = buildCatalogState(getFirstRenderableCategory(), getDefaultSort(), getDefaultSortOrder());
      setHistoryCache([fallbackState], 0, 'history-init-explicit-fallback');
      replaceBrowserState(fallbackState, 0);
      dispatchState(fallbackState);
      return;
    }

    if (browserState?.route?.action) {
      const idx = syncRouteIntoStack(browserState.route, browserState.index, 'history-browser-state');
      replaceBrowserState(browserState.route, idx, { modalOpen: browserState.modalOpen === true });
      dispatchState(browserState.route);
      return;
    }

    if (shouldRestoreSessionHistory(route) && typeof window.__ssRestoreHistoryStateFromSession === 'function' && window.__ssRestoreHistoryStateFromSession()) {
      const idx = getHistoryIndex();
      const restoredState = getHistoryStack()?.[idx] || null;
      if (restoredState?.action) {
        const nextIndex = syncRouteIntoStack(restoredState, idx, 'history-session-restore');
        replaceBrowserState(restoredState, nextIndex);
        dispatchState(restoredState);
        return;
      }
    }

    const defaultState = buildCatalogState(getFirstRenderableCategory(), getDefaultSort(), getDefaultSortOrder());
    setHistoryCache([defaultState], 0, 'history-init-default');
    replaceBrowserState(defaultState, 0);
    dispatchState(defaultState);
  }

  function bind() {
    if (popstateBound) return api;
    popstateHandler = handlePopstate;
    window.addEventListener('popstate', popstateHandler);
    popstateBound = true;
    return api;
  }

  function unbind() {
    if (!popstateBound || !popstateHandler) return api;
    try { window.removeEventListener('popstate', popstateHandler); } catch {}
    popstateHandler = null;
    popstateBound = false;
    return api;
  }

  function registerAction(action, fn) {
    if (!action || typeof fn !== 'function') return function noop() {};
    actionHandlers.set(String(action), fn);
    return () => actionHandlers.delete(String(action));
  }

  const api = {
    parseRoute,
    buildUrlForState,
    buildHistoryState,
    dispatchState,
    navigate,
    initializeHistory,
    handlePopstate,
    resolveStateFromRoute,
    registerAction,
    bind,
    unbind,
    inspect() {
      return {
        popstateBound,
        actions: Array.from(actionHandlers.keys()),
        currentIndex: getHistoryIndex(),
        currentRoute: window.history.state?.route || null
      };
    }
  };

  window.__SS_ROUTER__ = api;
})(window);
