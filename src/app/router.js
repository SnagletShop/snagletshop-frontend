(function (window) {
  'use strict';

  function getFirstRenderableCategory() {
    const db = (window.productsDatabase && typeof window.productsDatabase === 'object') ? window.productsDatabase : (window.products || {});
    return Object.keys(db || {}).find((k) => k !== 'Default_Page' && Array.isArray(db[k]) && db[k].length) || 'Default_Page';
  }

  const actionHandlers = new Map();
  let popstateBound = false;

  function getApp() {
    return window.__SS_APP__ || null;
  }

  function getRuntimeStore() {
    return window.__SS_RUNTIME_STORE__ || null;
  }

  function syncNavigationState(reason, patch) {
    try { getRuntimeStore()?.syncRuntimeState?.(reason, patch || {}); } catch {}
  }

  function parseRoute(urlLike) {
    const url = new URL(urlLike || window.location.href, window.location.origin);
    const params = url.searchParams;
    const path = String(url.pathname || '/');
    const productFromPath = path.startsWith('/p/') ? decodeURIComponent(path.slice(3)) : '';
    const orderFromPath = path.startsWith('/order-status/') ? decodeURIComponent(path.slice('/order-status/'.length).split('/')[0] || '') : '';
    return {
      path,
      params,
      productId: params.get('p') || params.get('pid') || params.get('productId') || productFromPath || '',
      productName: params.get('product') || '',
      query: params.get('q') || '',
      orderId: orderFromPath || params.get('orderId') || '',
      token: params.get('token') || '',
      recoToken: params.get('reco') || ''
    };
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
    } catch {}
    return '/';
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

  function navigate(action, data = null, options = null) {
    if (window.isReplaying) return;

    const opts = (options && typeof options === 'object') ? options : {};
    const replaceCurrent = opts.replaceCurrent === true;
    const newState = { action, data };
    const historyStack = Array.isArray(window.userHistoryStack) ? window.userHistoryStack : (window.userHistoryStack = []);
    let currentIndex = Number.isInteger(window.currentIndex) ? window.currentIndex : -1;
    const lastState = historyStack[currentIndex] || null;
    const sameAsLast = !!(lastState && JSON.stringify(lastState) === JSON.stringify(newState));

    if (sameAsLast) {
      try { window.history.replaceState({ index: currentIndex }, '', buildUrlForState(newState)); } catch {}
      try { window.__ssPersistHistoryState?.(); } catch {}
      dispatchState(newState);
      return;
    }

    if (replaceCurrent && currentIndex >= 0 && historyStack[currentIndex]) {
      historyStack[currentIndex] = newState;
      try { window.history.replaceState({ index: currentIndex }, '', buildUrlForState(newState)); } catch {}
      window.currentIndex = currentIndex;
      syncNavigationState('history-replace', { userHistoryStack: historyStack, currentIndex });
      try { window.__ssPersistHistoryState?.(); } catch {}
      dispatchState(newState);
      return;
    }

    if (currentIndex < historyStack.length - 1) {
      window.userHistoryStack = historyStack.slice(0, currentIndex + 1);
    }

    const nextStack = Array.isArray(window.userHistoryStack) ? window.userHistoryStack : [];
    nextStack.push(newState);
    const maxHistory = Number(window.MAX_HISTORY_LENGTH || 50);
    if (nextStack.length > maxHistory) {
      const overflow = nextStack.length - maxHistory;
      window.userHistoryStack = nextStack.slice(overflow);
      currentIndex = window.userHistoryStack.length - 1;
    } else {
      window.userHistoryStack = nextStack;
      currentIndex = nextStack.length - 1;
    }

    window.currentIndex = currentIndex;
    syncNavigationState('history-push', { userHistoryStack: window.userHistoryStack, currentIndex });
    window.history.pushState({ index: currentIndex }, '', buildUrlForState(newState));
    try { window.__ssPersistHistoryState?.(); } catch {}
    dispatchState(newState);
  }

  function handlePopstate(event) {
    const modal = document.getElementById('paymentModal');
    const index = event?.state?.index;
    const wantsModalOpen = event?.state?.modalOpen === true;
    window.__ssHandlingPopstate = true;
    try {
      if (modal && typeof window.closeModal === 'function') {
        window.closeModal({ fromHistory: true });
      }

      if (typeof index === 'number' && window.userHistoryStack?.[index]) {
        window.isReplaying = true;
        window.currentIndex = index;
        syncNavigationState('history-index-update', { currentIndex: index, userHistoryStack: window.userHistoryStack });
        try { window.__ssPersistHistoryState?.(); } catch {}
        dispatchState(window.userHistoryStack[index]);
        window.isReplaying = false;
        window.__ssModalHistoryPushed = wantsModalOpen;
        if (wantsModalOpen && typeof window.openModal === 'function') {
          Promise.resolve().then(() => window.openModal({ fromHistory: true })).catch(() => {});
        }
        return;
      }

      if (wantsModalOpen && typeof window.openModal === 'function') {
        window.__ssModalHistoryPushed = true;
        Promise.resolve().then(() => window.openModal({ fromHistory: true })).catch(() => {});
        return;
      }

      window.__ssModalHistoryPushed = false;
      console.warn('[ss router] Invalid popstate index:', event?.state);
    } finally {
      window.__ssHandlingPopstate = false;
      window.isReplaying = false;
    }
  }

  function initializeHistory() {
    const route = parseRoute(window.location.href);
    const params = route.params;

    try {
      if (route.path.startsWith('/p/') && route.productId) {
        const pid = (typeof window.__ssIdNorm === 'function' ? window.__ssIdNorm(route.productId) : String(route.productId).trim());
        const recoTok = (typeof window.__ssIdNorm === 'function' ? window.__ssIdNorm(route.recoToken || '') : String(route.recoToken || '').trim());
        const flat = typeof window.getAllProductsFlatSafe === 'function' ? window.getAllProductsFlatSafe() : (typeof window.__ssGetCatalogFlat === 'function' ? window.__ssGetCatalogFlat() : []);
        const eq = typeof window.__ssIdEq === 'function' ? window.__ssIdEq : ((a, b) => String(a ?? '').trim() === String(b ?? '').trim());
        const prod = (flat || []).find((p) => eq(p?.productId, pid)) || null;
        if (prod) {
          const desc = prod.description || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || 'No description available.';
          if (recoTok) {
            try {
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
          const state = { action: 'GoToProductPage', data: [prod.name, prod.price, desc, null, pid, (recoTok ? { discountToken: recoTok } : null)] };
          window.userHistoryStack = [state];
          window.currentIndex = 0;
          syncNavigationState('history-reset', { userHistoryStack: window.userHistoryStack, currentIndex: window.currentIndex });
          try { window.__ssPersistHistoryState?.(); } catch {}
          window.history.replaceState({ index: 0 }, '', buildUrlForState(state));
          dispatchState(state);
          return;
        }
        window.history.replaceState({ index: 0 }, '', '/');
      }
    } catch {}

    if (route.productId) {
      const pid = typeof window.__ssIdNorm === 'function' ? window.__ssIdNorm(route.productId) : String(route.productId).trim();
      const bad = typeof window.__ssIsBadId === 'function' ? window.__ssIsBadId(pid) : !pid;
      if (pid && !bad) {
        const flat = typeof window.__ssGetCatalogFlat === 'function' ? window.__ssGetCatalogFlat() : [];
        const prod = (flat || []).find((p) => String(p?.productId || '').trim() === String(pid).trim());
        if (prod) {
          const desc = ((window.__ssABGetProductDescription?.(prod) || prod.description) || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || 'No description available.');
          const price = (window.__ssResolveVariantPriceEUR?.(prod, [], '') || prod.price);
          const state = { action: 'GoToProductPage', data: [prod.name, price, desc, null, pid, null] };
          window.userHistoryStack = [state];
          window.currentIndex = 0;
          syncNavigationState('history-reset', { userHistoryStack: window.userHistoryStack, currentIndex: window.currentIndex });
          try { window.__ssPersistHistoryState?.(); } catch {}
          window.history.replaceState({ index: 0 }, '', buildUrlForState(state));
          dispatchState(state);
          return;
        }
      }
    }

    if (route.productName) {
      const prod = typeof window.findProductByNameParam === 'function' ? window.findProductByNameParam(route.productName) : null;
      if (prod) {
        const desc = prod.description || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || 'No description available.';
        const state = { action: 'GoToProductPage', data: [prod.name, prod.price, desc] };
        window.userHistoryStack = [state];
        window.currentIndex = 0;
        syncNavigationState('history-init', { userHistoryStack: window.userHistoryStack, currentIndex: window.currentIndex });
        try { window.__ssPersistHistoryState?.(); } catch {}
        window.history.replaceState({ index: 0 }, '', buildUrlForState(state));
        dispatchState(state);
        return;
      }
      window.history.replaceState({ index: 0 }, '', '/');
    }

    if (typeof window.__ssRestoreHistoryStateFromSession === 'function' && window.__ssRestoreHistoryStateFromSession() && window.currentIndex >= 0 && window.userHistoryStack?.[window.currentIndex]) {
      try { window.history.replaceState({ index: window.currentIndex }, '', buildUrlForState(window.userHistoryStack[window.currentIndex])); } catch {}
      dispatchState(window.userHistoryStack[window.currentIndex]);
      return;
    }

    const firstCategory = getFirstRenderableCategory();
    navigate('loadProducts', [firstCategory, localStorage.getItem('defaultSort') || 'NameFirst', window.currentSortOrder || 'asc']);
  }

  function bind() {
    if (popstateBound) return api;
    window.addEventListener('popstate', handlePopstate);
    popstateBound = true;
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
    dispatchState,
    navigate,
    initializeHistory,
    handlePopstate,
    registerAction,
    bind,
    inspect() {
      return {
        popstateBound,
        actions: Array.from(actionHandlers.keys())
      };
    }
  };

  window.__SS_ROUTER__ = api;
})(window);