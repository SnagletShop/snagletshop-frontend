(function (window) {
  'use strict';

  const core = window.__SS_STATE__;
  if (!core) {
    window.__SS_RUNTIME_STORE__ = {
      initialize() {},
      syncRuntimeState() {},
      setCurrency() {},
      setPricing() {},
      setBasket() {},
      setCart() {},
      setCategory() {},
      setHistory() {},
      setCheckoutRuntime() {},
      snapshot() { return {}; }
    };
    return;
  }

  function clone(value) {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map(clone);
    if (typeof value === 'object') {
      try { return JSON.parse(JSON.stringify(value)); } catch {}
      return Object.assign({}, value);
    }
    return value;
  }

  function initialize(payload = {}) {
    core.replace('catalog', {
      currentCategory: payload.currentCategory ?? null
    });
    core.replace('basket', {
      basket: clone(payload.basket || {}),
      cart: clone(payload.cart || {}),
      lastReason: 'initialize'
    });
    core.replace('pricing', {
      selectedCurrency: payload.selectedCurrency || 'EUR',
      exchangeRates: clone(payload.exchangeRates || {}),
      tariffMultipliers: clone(payload.tariffMultipliers || {}),
      lastReason: 'initialize'
    });
    core.replace('checkout', {
      clientSecret: payload.clientSecret ?? null,
      stripeReady: !!payload.stripeInstance,
      elementsReady: !!payload.elementsInstance,
      paymentElementReady: !!payload.paymentElementInstance,
      lastReason: 'initialize'
    });
    core.replace('navigation', {
      userHistoryStack: clone(payload.userHistoryStack || []),
      currentIndex: Number.isFinite(payload.currentIndex) ? payload.currentIndex : -1,
      isPageRefresh: !!payload.isPageRefresh,
      lastReason: 'initialize'
    });
  }

  function syncRuntimeState(payload = {}, reason = 'runtime-sync') {
    if ('basket' in payload || 'cart' in payload) {
      core.patch('basket', {
        ...(payload.basket !== undefined ? { basket: clone(payload.basket || {}) } : {}),
        ...(payload.cart !== undefined ? { cart: clone(payload.cart || {}) } : {}),
        lastReason: reason,
        updatedAt: Date.now()
      });
    }
    if ('selectedCurrency' in payload || 'exchangeRates' in payload || 'tariffMultipliers' in payload) {
      core.patch('pricing', {
        ...(payload.selectedCurrency !== undefined ? { selectedCurrency: payload.selectedCurrency || 'EUR' } : {}),
        ...(payload.exchangeRates !== undefined ? { exchangeRates: clone(payload.exchangeRates || {}) } : {}),
        ...(payload.tariffMultipliers !== undefined ? { tariffMultipliers: clone(payload.tariffMultipliers || {}) } : {}),
        lastReason: reason,
        updatedAt: Date.now()
      });
    }
    if ('currentCategory' in payload) {
      core.patch('catalog', {
        currentCategory: payload.currentCategory ?? null,
        lastReason: reason,
        updatedAt: Date.now()
      });
    }
    if ('userHistoryStack' in payload || 'currentIndex' in payload) {
      core.patch('navigation', {
        ...(payload.userHistoryStack !== undefined ? { userHistoryStack: clone(payload.userHistoryStack || []) } : {}),
        ...(payload.currentIndex !== undefined ? { currentIndex: Number.isFinite(payload.currentIndex) ? payload.currentIndex : -1 } : {}),
        lastReason: reason,
        updatedAt: Date.now()
      });
    }
    if ('clientSecret' in payload || 'stripeInstance' in payload || 'elementsInstance' in payload || 'paymentElementInstance' in payload) {
      core.patch('checkout', {
        ...(payload.clientSecret !== undefined ? { clientSecret: payload.clientSecret ?? null } : {}),
        ...(payload.stripeInstance !== undefined ? { stripeReady: !!payload.stripeInstance } : {}),
        ...(payload.elementsInstance !== undefined ? { elementsReady: !!payload.elementsInstance } : {}),
        ...(payload.paymentElementInstance !== undefined ? { paymentElementReady: !!payload.paymentElementInstance } : {}),
        lastReason: reason,
        updatedAt: Date.now()
      });
    }
  }

  const api = {
    initialize,
    syncRuntimeState,
    setCurrency(selectedCurrency, reason = 'set-currency') {
      core.patch('pricing', { selectedCurrency: selectedCurrency || 'EUR', lastReason: reason, updatedAt: Date.now() });
    },
    setPricing({ exchangeRates, tariffMultipliers } = {}, reason = 'set-pricing') {
      syncRuntimeState({ exchangeRates, tariffMultipliers }, reason);
    },
    setBasket(basket, reason = 'set-basket') {
      syncRuntimeState({ basket }, reason);
    },
    setCart(cart, reason = 'set-cart') {
      syncRuntimeState({ cart }, reason);
    },
    setCategory(currentCategory, reason = 'set-category') {
      syncRuntimeState({ currentCategory }, reason);
    },
    setHistory({ userHistoryStack, currentIndex } = {}, reason = 'set-history') {
      syncRuntimeState({ userHistoryStack, currentIndex }, reason);
    },
    setCheckoutRuntime({ clientSecret, stripeInstance, elementsInstance, paymentElementInstance } = {}, reason = 'set-checkout-runtime') {
      syncRuntimeState({ clientSecret, stripeInstance, elementsInstance, paymentElementInstance }, reason);
    },
    snapshot() {
      return {
        basket: core.getSlice('basket'),
        pricing: core.getSlice('pricing'),
        catalog: core.getSlice('catalog'),
        navigation: core.getSlice('navigation'),
        checkout: core.getSlice('checkout')
      };
    }
  };

  window.__SS_RUNTIME_STORE__ = api;
})(window);
