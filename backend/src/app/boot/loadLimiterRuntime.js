'use strict';

const rateLimit = require('express-rate-limit');
const { mergeRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');

function loadLimiterRuntime() {
  const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
  const paymentStatusLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, standardHeaders: true, legacyHeaders: false });
  const paymentIntentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.PI_MAX_PER_15MIN || 60),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'RATE_LIMIT', message: 'Too many checkout attempts. Please try again later.' },
  });
  const analyticsLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: Number(process.env.ANALYTICS_MAX_PER_5MIN || 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'RATE_LIMIT', message: 'Too many events. Please try again later.' },
  });
  const storeDetailsLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: Number(process.env.STORE_DETAILS_MAX_PER_10MIN || 30),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'RATE_LIMIT', message: 'Too many attempts. Please try again later.' },
  });
  const orderCreatedWebhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.CONTACT_MAX_PER_15MIN || 5),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many messages. Please try again later.' },
  });

  mergeRuntime({
    middleware: {
      adminLimiter,
      paymentStatusLimiter,
      paymentIntentLimiter,
      analyticsLimiter,
      storeDetailsLimiter,
      orderCreatedWebhookLimiter,
      contactLimiter,
    },
    payments: {
      paymentStatusLimiter,
    },
    checkout: {
      paymentIntentLimiter,
      storeDetailsLimiter,
    },
    orders: {
      paymentStatusLimiter,
    },
    remaining: {
      orderCreatedWebhookLimiter,
    },
    platform: {
      contactLimiter,
    },
    analytics: {
      analyticsLimiter,
    },
  });

  patchBootState({
    limitersRuntimeLoaded: true,
    limitersRuntimeLoadedAt: new Date().toISOString(),
    limitersRuntimeNames: [
      'adminLimiter',
      'paymentStatusLimiter',
      'paymentIntentLimiter',
      'analyticsLimiter',
      'storeDetailsLimiter',
      'orderCreatedWebhookLimiter',
      'contactLimiter',
    ],
  });

  return {
    adminLimiter,
    paymentStatusLimiter,
    paymentIntentLimiter,
    analyticsLimiter,
    storeDetailsLimiter,
    orderCreatedWebhookLimiter,
    contactLimiter,
  };
}

module.exports = { loadLimiterRuntime };
