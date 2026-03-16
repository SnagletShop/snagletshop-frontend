'use strict';

const { domain, middleware, prefer, mergeDomain } = require('./runtimeResolver');

function pass() {
  return (_req, _res, next) => next();
}

function rt() {
  return domain('middleware') || {};
}

function mw(name, fallback) {
  return middleware(name, prefer(rt()[name], fallback));
}

function syncMiddlewareRuntimeFromGlobals() {
  const runtime = rt();
  mergeDomain('middleware', {
    paymentIntentLimiter: prefer(runtime.paymentIntentLimiter, null),
    storeDetailsLimiter: prefer(runtime.storeDetailsLimiter, null),
    paymentStatusLimiter: prefer(runtime.paymentStatusLimiter, null),
    authMiddleware: prefer(runtime.authMiddleware, null),
    requireAdmin: prefer(runtime.requireAdmin, null),
    agentWebhookAuth: prefer(runtime.agentWebhookAuth, null),
    contactLimiter: prefer(runtime.contactLimiter, null),
    orderCreatedWebhookLimiter: prefer(runtime.orderCreatedWebhookLimiter, null),
    verifyOrderCreatedWebhook: prefer(runtime.verifyOrderCreatedWebhook, null),
    analyticsLimiter: prefer(runtime.analyticsLimiter, null),
    adminLimiter: prefer(runtime.adminLimiter, null),
  });
  return rt();
}

function getCheckoutRouteState() {
  return {
    paymentIntentLimiter: mw('paymentIntentLimiter', pass()),
    storeDetailsLimiter: mw('storeDetailsLimiter', pass()),
  };
}

function getOrderRouteState() {
  return {
    paymentStatusLimiter: mw('paymentStatusLimiter', pass()),
  };
}

function getOrderAdminRouteState() {
  return {
    adminAuth: mw('authMiddleware', mw('requireAdmin', pass())),
    adminOnly: mw('requireAdmin', mw('authMiddleware', pass())),
  };
}

function getFulfillmentRouteState() {
  return {
    adminAuth: mw('authMiddleware', mw('requireAdmin', pass())),
    webhookAuth: mw('agentWebhookAuth', mw('authMiddleware', pass())),
  };
}

function getPlatformRouteState() {
  return {
    admin: mw('requireAdmin', mw('authMiddleware', pass())),
    contactLimiter: mw('contactLimiter', pass()),
  };
}

function getGrowthRouteState() {
  return {
    admin: mw('authMiddleware', mw('requireAdmin', pass())),
  };
}

function getAdminGateState() {
  return {
    adminLimiter: mw('adminLimiter', pass()),
  };
}

function getOrderCreatedWebhookRouteState() {
  return {
    limiter: mw('orderCreatedWebhookLimiter', pass()),
    verify: mw('verifyOrderCreatedWebhook', pass()),
  };
}

module.exports = {
  getCheckoutRouteState,
  getOrderRouteState,
  getOrderAdminRouteState,
  getFulfillmentRouteState,
  getPlatformRouteState,
  getGrowthRouteState,
  getAdminGateState,
  getOrderCreatedWebhookRouteState,
  syncMiddlewareRuntimeFromGlobals,
};
