'use strict';

const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');

function boolEnv(name, fallback) {
  const raw = process.env[name];
  if (typeof raw === 'undefined' || raw === null || raw === '') return !!fallback;
  const s = String(raw).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

function pickFirst(...values) {
  for (const value of values) {
    const s = String(value || '').trim();
    if (s) return s;
  }
  return '';
}

function buildEnvStripeRuntime() {
  const existing = getRuntime()?.stripeRuntime || {};
  const STRIPE_TEST_MODE = boolEnv('STRIPE_TEST_MODE', boolEnv('STRIPE_TEST', !!existing.STRIPE_TEST_MODE));
  const STRIPE_SECRET_KEY = pickFirst(
    STRIPE_TEST_MODE ? process.env.STRIPE_SECRET_KEY_TEST : '',
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_API_KEY,
    existing.STRIPE_SECRET_KEY,
  );
  const ACTIVE_STRIPE_PUBLISHABLE_KEY = pickFirst(
    STRIPE_TEST_MODE ? process.env.STRIPE_PUBLISHABLE_KEY_TEST : '',
    process.env.STRIPE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    existing.ACTIVE_STRIPE_PUBLISHABLE_KEY,
  );
  const ACTIVE_STRIPE_WEBHOOK_SECRET = pickFirst(
    STRIPE_TEST_MODE ? process.env.STRIPE_WEBHOOK_SECRET_TEST : '',
    process.env.STRIPE_WEBHOOK_SECRET,
    existing.ACTIVE_STRIPE_WEBHOOK_SECRET,
  );
  const APPLY_TARIFF_SERVER = !['false', '0', 'off', 'no'].includes(String(process.env.APPLY_TARIFF || existing.APPLY_TARIFF_SERVER || 'true').trim().toLowerCase());

  let cachedStripe = existing.stripe || null;
  function initStripe() {
    if (cachedStripe) return cachedStripe;
    if (!STRIPE_SECRET_KEY) return null;
    const Stripe = require('stripe');
    cachedStripe = new Stripe(STRIPE_SECRET_KEY);
    return cachedStripe;
  }

  const stripe = initStripe();

  return {
    stripeRuntime: {
      ACTIVE_STRIPE_PUBLISHABLE_KEY,
      ACTIVE_STRIPE_WEBHOOK_SECRET,
      STRIPE_SECRET_KEY,
      STRIPE_TEST_MODE,
      APPLY_TARIFF_SERVER,
      initStripe,
      stripe,
    },
    payments: {
      initStripe,
    },
    platform: {
      initStripe,
      stripe,
    },
  };
}

function loadStripeRuntime() {
  const existing = getRuntime() || {};
  const stripeRuntime = buildEnvStripeRuntime();
  const merged = mergeRuntime(existing, stripeRuntime);
  const stripeLoaded = !!(merged?.stripeRuntime?.stripe || merged?.stripeRuntime?.initStripe);
  patchBootState({
    stripeRuntimeLoaded: stripeLoaded,
    stripeRuntimePublishableConfigured: !!(merged?.stripeRuntime?.ACTIVE_STRIPE_PUBLISHABLE_KEY),
    stripeRuntimeSecretConfigured: !!(merged?.stripeRuntime?.STRIPE_SECRET_KEY),
    stripeRuntimeWebhookConfigured: !!(merged?.stripeRuntime?.ACTIVE_STRIPE_WEBHOOK_SECRET),
  });
  return merged;
}

module.exports = {
  buildEnvStripeRuntime,
  loadStripeRuntime,
};
