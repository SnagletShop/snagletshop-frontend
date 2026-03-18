(function (window, document) {
  'use strict';

  function noop() {}

  function createEmitter() {
    const listeners = new Map();
    return {
      on(eventName, fn) {
        if (!eventName || typeof fn !== 'function') return noop;
        const set = listeners.get(eventName) || new Set();
        set.add(fn);
        listeners.set(eventName, set);
        return () => {
          try { set.delete(fn); } catch {}
          if (!set.size) listeners.delete(eventName);
        };
      },
      emit(eventName, payload) {
        const set = listeners.get(eventName);
        if (!set || !set.size) return;
        for (const fn of Array.from(set)) {
          try { fn(payload); } catch (err) { console.error('[ss app emitter]', eventName, err); }
        }
      }
    };
  }

  function createAppRuntime() {
    const registry = new Map();
    const startupTasks = [];
    const teardownTasks = [];
    const cleanupFns = new Set();
    const emitter = createEmitter();

    let startPromise = null;
    let started = false;
    let starting = false;
    let teardownPromise = null;

    function patchAppState(patch) {
      try {
        window.__SS_STATE__?.patch?.('app', patch || {});
      } catch (err) {
        console.warn('[ss app] state patch failed', err);
      }
    }

    function register(name, value) {
      if (!name) return value;
      registry.set(String(name), value);
      emitter.emit('registry:changed', { name: String(name), value });
      return value;
    }

    function resolve(name, fallback) {
      return registry.has(name) ? registry.get(name) : fallback;
    }

    function captureError(err, meta = {}) {
      const error = err instanceof Error ? err : new Error(String(err || 'Unknown app error'));
      const payload = { error, meta, timestamp: Date.now() };
      console.error('[ss app]', meta.stage || 'error', error);
      try { window.__SS_STATE__?.patch?.('app', { lastError: { message: error.message, stage: meta.stage || 'unknown', at: payload.timestamp } }); } catch {}
      emitter.emit('error', payload);
      return payload;
    }

    async function runTaskList(list, stage) {
      for (const task of list) {
        try {
          emitter.emit(stage === 'startup' ? 'before:start-task' : 'before:teardown-task', { name: task.name, stage });
          await task.run(getContext());
          emitter.emit(stage === 'startup' ? 'after:start-task' : 'after:teardown-task', { name: task.name, stage });
        } catch (err) {
          captureError(err, { stage, task: task.name });
          if (task.required !== false) throw err;
        }
      }
    }

    function addStartupTask(name, fn, options = {}) {
      if (typeof fn !== 'function') return noop;
      const task = { name: String(name || `startup:${startupTasks.length + 1}`), run: fn, required: options.required !== false };
      startupTasks.push(task);
      return () => {
        const idx = startupTasks.indexOf(task);
        if (idx >= 0) startupTasks.splice(idx, 1);
      };
    }

    function addTeardownTask(name, fn, options = {}) {
      if (typeof fn !== 'function') return noop;
      const task = { name: String(name || `teardown:${teardownTasks.length + 1}`), run: fn, required: options.required !== false };
      teardownTasks.push(task);
      return () => {
        const idx = teardownTasks.indexOf(task);
        if (idx >= 0) teardownTasks.splice(idx, 1);
      };
    }

    function addCleanup(fn) {
      if (typeof fn !== 'function') return noop;
      cleanupFns.add(fn);
      return () => cleanupFns.delete(fn);
    }

    function getContext() {
      return {
        window,
        document,
        app: runtime,
        state: resolve('core.state', window.__SS_STATE__),
        config: resolve('core.config', window.__SS_CONFIG__),
        storage: resolve('core.storage', window.__SS_STORAGE__),
        api: resolve('core.api', window.__SS_API__),
        router: resolve('app.router', window.__SS_ROUTER__),
        resolve,
        register,
        captureError,
        on: emitter.on,
        emit: emitter.emit
      };
    }

    async function start() {
      if (started) return runtime;
      if (startPromise) return startPromise;
      starting = true;
      patchAppState({ shellReady: true, starting: true, started: false, booted: false });
      emitter.emit('start:begin', getContext());
      startPromise = (async () => {
        try {
          await runTaskList(startupTasks, 'startup');
          started = true;
          patchAppState({ shellReady: true, starting: false, started: true, booted: true, startedAt: Date.now() });
          emitter.emit('start:complete', getContext());
          return runtime;
        } catch (err) {
          patchAppState({ shellReady: true, starting: false, started: false, booted: false });
          captureError(err, { stage: 'start' });
          throw err;
        } finally {
          starting = false;
        }
      })();
      return startPromise;
    }

    async function teardown() {
      if (teardownPromise) return teardownPromise;
      teardownPromise = (async () => {
        emitter.emit('teardown:begin', getContext());
        try {
          await runTaskList(teardownTasks.slice().reverse(), 'teardown');
        } finally {
          for (const fn of Array.from(cleanupFns).reverse()) {
            try { fn(); } catch (err) { console.warn('[ss app cleanup]', err); }
          }
          cleanupFns.clear();
          started = false;
          startPromise = null;
          patchAppState({ starting: false, started: false, booted: false, tornDownAt: Date.now() });
          emitter.emit('teardown:complete', getContext());
        }
      })();
      return teardownPromise;
    }

    const runtime = {
      get started() { return started; },
      get starting() { return starting; },
      register,
      resolve,
      has(name) { return registry.has(name); },
      addStartupTask,
      addTeardownTask,
      addCleanup,
      on: emitter.on,
      emit: emitter.emit,
      getContext,
      captureError,
      start,
      teardown,
      inspect() {
        return {
          started,
          starting,
          registered: Array.from(registry.keys()),
          startupTasks: startupTasks.map((task) => task.name),
          teardownTasks: teardownTasks.map((task) => task.name),
          cleanupCount: cleanupFns.size
        };
      }
    };

    register('core.config', window.__SS_CONFIG__ || null);
    register('core.storage', window.__SS_STORAGE__ || null);
    register('core.compat', window.__SS_COMPAT__ || null);
    register('core.runtimeAccess', window.__SS_RUNTIME_ACCESS__ || null);
    register('core.sessionRuntime', window.__SS_SESSION_RUNTIME__ || null);
    register('core.contracts', window.__SS_CONTRACTS_RUNTIME__ || null);
    register('core.navigationRuntime', window.__SS_NAVIGATION_RUNTIME__ || null);
    register('core.seoRuntime', window.__SS_SEO_RUNTIME__ || null);
    register('core.api', window.__SS_API__ || null);
    register('core.state', window.__SS_STATE__ || null);
  register('core.sharedData', window.__SS_SHARED_DATA__ || null);
    register('state.runtime', window.__SS_RUNTIME_STORE__ || null);
    register('service.storage', window.__SS_STORAGE_SERVICE__ || null);
    register('service.catalog', window.__SS_CATALOG_SERVICE__ || null);
    register('service.pricing', window.__SS_PRICING_SERVICE__ || null);
    register('service.checkout', window.__SS_CHECKOUT_SERVICE__ || null);
    register('service.orders', window.__SS_ORDERS_SERVICE__ || null);
    register('service.analytics', window.__SS_ANALYTICS_SERVICE__ || null);
    register('service.recommendations', window.__SS_RECOMMENDATIONS_SERVICE__ || null);
    register('app.router', window.__SS_ROUTER__ || null);
    register('app.resolve', window.__SS_RESOLVE__ || null);
    register('app.diagnostics', window.__SS_DIAGNOSTICS__ || null);
    register('domain.pricing', window.__SS_PRICING__ || null);
    register('domain.search', window.__SS_SEARCH__ || null);
    register('domain.orders', window.__SS_ORDERS__ || null);
    register('domain.contact', window.__SS_CONTACT__ || null);
    register('domain.checkoutApi', window.__SS_CHECKOUT_API__ || null);
    register('domain.checkoutHelpers', window.__SS_CHECKOUT_HELPERS__ || null);
    register('domain.checkoutRuntime', window.__SS_CHECKOUT_RUNTIME__ || null);
    register('domain.productOptions', window.__SS_PRODUCT_OPTIONS__ || null);
    register('domain.product', window.__SS_PRODUCT__ || null);
    register('domain.basket', window.__SS_BASKET__ || null);
    register('domain.checkout', window.__SS_CHECKOUT__ || null);
    register('domain.recommendations', window.__SS_RECOMMENDATIONS__ || null);
    register('domain.catalog', window.__SS_CATALOG_API__ || null);
    register('domain.catalogRuntime', window.__SS_CATALOG_RUNTIME__ || null);
    register('domain.catalogUiRuntime', window.__SS_CATALOG_UI_RUNTIME__ || null);
    register('domain.pricingRuntime', window.__SS_PRICING_RUNTIME__ || null);
    register('domain.settingsRuntime', window.__SS_SETTINGS_RUNTIME__ || null);
    register('domain.settingsCountryRuntime', window.__SS_SETTINGS_COUNTRY_RUNTIME__ || null);
    register('domain.mediaRuntime', window.__SS_MEDIA_RUNTIME__ || null);
    register('domain.checkoutUi', window.__SS_CHECKOUT_UI__ || null);
    register('domain.modalRuntime', window.__SS_MODAL_RUNTIME__ || null);
  register('domain.basketRuntime', window.__SS_BASKET_RUNTIME__ || null);
    register('domain.analytics', window.__SS_ANALYTICS__ || null);
    register('domain.analyticsHelpers', window.__SS_ANALYTICS_HELPERS__ || null);
    register('domain.cartIncentives', window.__SS_CART_INCENTIVES__ || null);
    register('domain.catalogImageRuntime', window.__SS_CATALOG_IMAGE_RUNTIME__ || null);
    register('domain.stripeConfigRuntime', window.__SS_STRIPE_CONFIG_RUNTIME__ || null);
    register('domain.turnstile', window.__SS_TURNSTILE__ || null);
    register('ui.basketToast', window.__SS_BASKET_TOAST__ || null);
    register('app.historyRuntime', window.__SS_HISTORY_RUNTIME__ || null);
    register('core.storageRuntime', window.__SS_STORAGE_RUNTIME__ || null);
    register('screens.manager', window.__SS_SCREENS__ || null);
    register('screen.orderStatus', window.__SS_ORDER_STATUS_SCREEN__ || null);

    patchAppState({ shellReady: true, starting: false, started: false, booted: false, runtimeVersion: 'step18-history-storage-runtime' });
    return runtime;
  }

  window.__SS_CREATE_APP__ = createAppRuntime;
})(window, document);

