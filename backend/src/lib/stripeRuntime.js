'use strict';

const { getStripeRuntimeState } = require('./stripeRuntimeState');

function getStripeRuntime() {
  return getStripeRuntimeState();
}

function getSafePublishableKey(raw) {
  const s = String(raw || '').trim();
  return (/^pk_(test|live)_/.test(s) && !s.includes('sk_') && s.length < 200) ? s : null;
}

function buildPublicStripeConfig() {
  const rt = getStripeRuntime();
  return {
    stripePublishableKey: getSafePublishableKey(rt.ACTIVE_STRIPE_PUBLISHABLE_KEY),
    applyTariffServer: rt.APPLY_TARIFF_SERVER,
    stripeMode: rt.STRIPE_TEST_MODE ? 'test' : 'live',
  };
}

module.exports = {
  getStripeRuntime,
  getSafePublishableKey,
  buildPublicStripeConfig,
};
