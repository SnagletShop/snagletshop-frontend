'use strict';

const { mergeRuntime } = require('../runtime/runtimeContainer');
const { authMiddleware, requireAdmin, agentWebhookAuth, verifyOrderCreatedWebhook } = require('../../lib/adminMiddleware');
const { patchBootState } = require('./bootState');
const { domain, middleware: resolveMiddleware } = require('../../lib/runtimeResolver');

function loadMiddlewareRuntime() {
  const current = domain('middleware') || {};
  const merged = mergeRuntime({
    middleware: {
      ...current,
      authMiddleware: current.authMiddleware || authMiddleware,
      requireAdmin: current.requireAdmin || requireAdmin,
      agentWebhookAuth: current.agentWebhookAuth || agentWebhookAuth,
      verifyOrderCreatedWebhook: current.verifyOrderCreatedWebhook || verifyOrderCreatedWebhook,
      paymentIntentLimiter: resolveMiddleware('paymentIntentLimiter', current.paymentIntentLimiter),
      storeDetailsLimiter: resolveMiddleware('storeDetailsLimiter', current.storeDetailsLimiter),
      paymentStatusLimiter: resolveMiddleware('paymentStatusLimiter', current.paymentStatusLimiter),
      contactLimiter: resolveMiddleware('contactLimiter', current.contactLimiter),
      orderCreatedWebhookLimiter: resolveMiddleware('orderCreatedWebhookLimiter', current.orderCreatedWebhookLimiter),
      analyticsLimiter: resolveMiddleware('analyticsLimiter', current.analyticsLimiter),
      adminLimiter: resolveMiddleware('adminLimiter', current.adminLimiter),
    },
  });
  patchBootState({
    middlewareRuntimeLoaded: true,
    middlewareRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { loadMiddlewareRuntime };
