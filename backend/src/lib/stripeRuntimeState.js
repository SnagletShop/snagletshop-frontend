'use strict';

const { domain, text, bool, prefer, mergeDomain } = require('./runtimeResolver');

function syncStripeRuntimeFromGlobals() {
  const runtime = domain('stripeRuntime') || {};
  mergeDomain('stripeRuntime', {
    ACTIVE_STRIPE_PUBLISHABLE_KEY: text(prefer(runtime.ACTIVE_STRIPE_PUBLISHABLE_KEY, process.env.ACTIVE_STRIPE_PUBLISHABLE_KEY, '')),
    ACTIVE_STRIPE_WEBHOOK_SECRET: text(prefer(runtime.ACTIVE_STRIPE_WEBHOOK_SECRET, process.env.ACTIVE_STRIPE_WEBHOOK_SECRET, '')),
    STRIPE_SECRET_KEY: text(prefer(runtime.STRIPE_SECRET_KEY, process.env.STRIPE_SECRET_KEY, '')),
    STRIPE_TEST_MODE: bool(prefer(runtime.STRIPE_TEST_MODE, process.env.STRIPE_TEST_MODE), false),
    APPLY_TARIFF_SERVER: bool(prefer(runtime.APPLY_TARIFF_SERVER, process.env.APPLY_TARIFF_SERVER), false),
    initStripe: prefer(runtime.initStripe, null),
    stripe: prefer(runtime.stripe, null),
  });
  return domain('stripeRuntime');
}

function getStripeRuntimeState() {
  const runtime = domain('stripeRuntime') || {};
  return {
    ACTIVE_STRIPE_PUBLISHABLE_KEY: text(runtime.ACTIVE_STRIPE_PUBLISHABLE_KEY || process.env.ACTIVE_STRIPE_PUBLISHABLE_KEY || ''),
    ACTIVE_STRIPE_WEBHOOK_SECRET: text(runtime.ACTIVE_STRIPE_WEBHOOK_SECRET || process.env.ACTIVE_STRIPE_WEBHOOK_SECRET || ''),
    STRIPE_SECRET_KEY: text(runtime.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''),
    STRIPE_TEST_MODE: bool(prefer(runtime.STRIPE_TEST_MODE, process.env.STRIPE_TEST_MODE), false),
    APPLY_TARIFF_SERVER: bool(prefer(runtime.APPLY_TARIFF_SERVER, process.env.APPLY_TARIFF_SERVER), false),
    initStripe: runtime.initStripe || null,
    stripe: runtime.stripe || null,
  };
}

module.exports = { getStripeRuntimeState, syncStripeRuntimeFromGlobals };
