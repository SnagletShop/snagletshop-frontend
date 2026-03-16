'use strict';

function buildUnavailableErrorCode(key) {
  return `RUNTIME_${String(key || 'unknown').replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}_UNAVAILABLE`;
}

function lazyRuntimeMiddleware(getRuntime, key, { status = 503 } = {}) {
  return function runtimeBackedMiddleware(req, res, next) {
    try {
      const runtime = typeof getRuntime === 'function' ? getRuntime() : null;
      const middleware = runtime && runtime[key];
      if (typeof middleware !== 'function') {
        return res.status(status).json({ error: buildUnavailableErrorCode(key) });
      }
      return middleware(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { lazyRuntimeMiddleware };
