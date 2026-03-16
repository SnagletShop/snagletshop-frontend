'use strict';

function registerRouteLoggingPatch(app) {
  if (!app || app.__SNAGLET_ROUTE_LOGGING_PATCHED__) return app;

  ['get', 'post', 'put', 'delete'].forEach((method) => {
    const original = app[method] && app[method].bind(app);
    if (typeof original !== 'function') return;
    app[method] = function patchedRouteLogger(route, ...handlers) {
      if (method === 'get' && handlers.length === 0 && typeof route === 'string' && !route.startsWith('/')) {
        return original(route);
      }
      console.log(`Registering route: ${method.toUpperCase()} ${route}`);
      return original(route, ...handlers);
    };
  });

  app.__SNAGLET_ROUTE_LOGGING_PATCHED__ = true;
  return app;
}

module.exports = { registerRouteLoggingPatch };
