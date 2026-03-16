'use strict';

const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');

const defaultFraudCheck = async () => ({ ok: true });
const defaultComputeAbExperimentsForRequest = async () => ({ experiments: {} });
const defaultComputeCartIncentivesServer = () => ({ discountEUR: 0, token: null, lines: [] });
const defaultGetTariffPctForCountry = () => 0;
const { patchBootState } = require('./bootState');
const { domain, model, middleware, text, array } = require('../../lib/runtimeResolver');
const { syncCheckoutRuntimeFromGlobals } = require('../../lib/checkoutState');

function buildCheckoutRuntime() {
  const synced = syncCheckoutRuntimeFromGlobals() || {};
  const payments = domain('payments') || {};
  const growth = domain('growth') || {};
  const existing = synced || domain('checkout') || {};
  const platform = domain('platform') || {};
  return {
    checkout: {
      ...existing,
      paymentIntentLimiter: middleware('paymentIntentLimiter', existing.paymentIntentLimiter),
      storeDetailsLimiter: middleware('storeDetailsLimiter', existing.storeDetailsLimiter),
      fraudCheck: existing.fraudCheck || defaultFraudCheck,
      PaymentIntentBodySchema: existing.PaymentIntentBodySchema || null,
      zodBadRequest: existing.zodBadRequest || null,
      initStripe: existing.initStripe || payments.initStripe || null,
      computeAbExperimentsForRequest: existing.computeAbExperimentsForRequest || growth.computeAbExperimentsForRequest || defaultComputeAbExperimentsForRequest,
      RecoConfig: existing.RecoConfig || growth.RecoConfig || model('RecoConfig'),
      RECO_WIDGET_DEFAULT: text(existing.RECO_WIDGET_DEFAULT || growth.RECO_WIDGET_DEFAULT || 'product_page_recs_v1') || 'product_page_recs_v1',
      RecoDiscountRedemption: existing.RecoDiscountRedemption || model('RecoDiscountRedemption'),
      refreshIncentivesRuntime: existing.refreshIncentivesRuntime || growth.refreshIncentivesRuntime || null,
      computeCartIncentivesServer: existing.computeCartIncentivesServer || defaultComputeCartIncentivesServer,
      getTariffPctForCountry: existing.getTariffPctForCountry || platform.getTariffPctForCountry || defaultGetTariffPctForCountry,
      DraftOrder: existing.DraftOrder || model('DraftOrder'),
      Order: existing.Order || model('Order'),
      fxHistory: array(platform.fxHistory, array(existing.fxHistory, [])),
    },
  };
}

function loadCheckoutRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildCheckoutRuntime());
  patchBootState({
    checkoutRuntimeLoaded: true,
    checkoutRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { buildCheckoutRuntime, loadCheckoutRuntime };
