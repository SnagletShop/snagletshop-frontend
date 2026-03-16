(function (window, document) {
  'use strict';

  const REQUIRED_REGISTRY = [
    'core.config',
    'core.storage',
    'core.api',
    'core.state',
    'state.runtime',
    'app.router',
    'screens.manager',
    'domain.basket',
    'domain.product',
    'domain.pricing',
    'service.catalog',
    'service.checkout',
    'service.orders'
  ];

  function getApp() {
    return window.__SS_APP__ || null;
  }

  function collectScriptSources() {
    try {
      return Array.from(document.querySelectorAll('script[src]')).map((node) => String(node.getAttribute('src') || '').trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  function getMissingRegistry(app) {
    const missing = [];
    for (const name of REQUIRED_REGISTRY) {
      try {
        if (!app?.resolve?.(name, null)) missing.push(name);
      } catch {
        missing.push(name);
      }
    }
    return missing;
  }

  function runDiagnostics() {
    const app = getApp();
    const scriptSources = collectScriptSources();
    const report = {
      timestamp: Date.now(),
      runtimeVersion: window.__SS_STATE__?.get?.('app')?.runtimeVersion || null,
      appStarted: !!app?.started,
      registryCount: Array.isArray(app?.inspect?.().registered) ? app.inspect().registered.length : null,
      startupTasks: Array.isArray(app?.inspect?.().startupTasks) ? app.inspect().startupTasks.slice() : [],
      teardownTasks: Array.isArray(app?.inspect?.().teardownTasks) ? app.inspect().teardownTasks.slice() : [],
      activeScreen: window.__SS_SCREENS__?.getActive?.()?.name || null,
      missingRegistry: getMissingRegistry(app),
      hasCatalogApi: !!window.__SS_CATALOG_API__,
      hasRouter: !!window.__SS_ROUTER__,
      hasScreens: !!window.__SS_SCREENS__,
      scriptSources
    };
    report.ok = report.missingRegistry.length === 0 && report.hasCatalogApi && report.hasRouter && report.hasScreens;
    try { window.__SS_STATE__?.patch?.('app', { diagnostics: { ok: report.ok, at: report.timestamp, missingRegistry: report.missingRegistry } }); } catch {}
    return report;
  }

  function warnIfNeeded(report) {
    if (!report || report.ok) return report;
    console.warn('[ss diagnostics] storefront shell is degraded', report);
    return report;
  }

  const api = { REQUIRED_REGISTRY: REQUIRED_REGISTRY.slice(), runDiagnostics, warnIfNeeded };
  window.__SS_DIAGNOSTICS__ = api;
  try { getApp()?.register?.('app.diagnostics', api); } catch {}
})(window, document);
