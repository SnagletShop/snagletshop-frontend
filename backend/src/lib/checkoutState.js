'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, middleware, requireValue, mergeDomain, array, domain } = require('./runtimeResolver');

function checkout() {
  return getRuntime()?.checkout || {};
}

function syncCheckoutRuntimeFromGlobals() {
  const runtime = checkout();
  const payments = getRuntime()?.payments || {};
  const growth = getRuntime()?.growth || {};
  return mergeDomain('checkout', {
    paymentIntentLimiter: runtime.paymentIntentLimiter || middleware('paymentIntentLimiter', null),
    storeDetailsLimiter: runtime.storeDetailsLimiter || middleware('storeDetailsLimiter', null),
    fraudCheck: runtime.fraudCheck || null,
    PaymentIntentBodySchema: runtime.PaymentIntentBodySchema || null,
    zodBadRequest: runtime.zodBadRequest || null,
    initStripe: runtime.initStripe || payments.initStripe || null,
    computeAbExperimentsForRequest: runtime.computeAbExperimentsForRequest || growth.computeAbExperimentsForRequest || null,
    RecoConfig: runtime.RecoConfig || growth.RecoConfig || model('RecoConfig', null),
    RECO_WIDGET_DEFAULT: runtime.RECO_WIDGET_DEFAULT || growth.RECO_WIDGET_DEFAULT || 'product_page_recs_v1',
    RecoDiscountRedemption: runtime.RecoDiscountRedemption || model('RecoDiscountRedemption', null),
    refreshIncentivesRuntime: runtime.refreshIncentivesRuntime || growth.refreshIncentivesRuntime || null,
    computeCartIncentivesServer: runtime.computeCartIncentivesServer || null,
    getTariffPctForCountry: runtime.getTariffPctForCountry || domain('platform')?.getTariffPctForCountry || null,
    DraftOrder: runtime.DraftOrder || model('DraftOrder', null),
    Order: runtime.Order || model('Order', null),
    fxHistory: array(runtime.fxHistory, array(domain('fx')?.fxHistory, [])),
  });
}

function getCheckoutState() {
  const runtime = checkout();
  return {
    paymentIntentLimiter: requireValue('CHECKOUT_STATE_NOT_READY:paymentIntentLimiter', runtime.paymentIntentLimiter),
    storeDetailsLimiter: requireValue('CHECKOUT_STATE_NOT_READY:storeDetailsLimiter', runtime.storeDetailsLimiter),
    fraudCheck: requireValue('CHECKOUT_STATE_NOT_READY:fraudCheck', runtime.fraudCheck),
    PaymentIntentBodySchema: requireValue('CHECKOUT_STATE_NOT_READY:PaymentIntentBodySchema', runtime.PaymentIntentBodySchema),
    zodBadRequest: requireValue('CHECKOUT_STATE_NOT_READY:zodBadRequest', runtime.zodBadRequest),
    initStripe: requireValue('CHECKOUT_STATE_NOT_READY:initStripe', runtime.initStripe),
    computeAbExperimentsForRequest: requireValue('CHECKOUT_STATE_NOT_READY:computeAbExperimentsForRequest', runtime.computeAbExperimentsForRequest),
    RecoConfig: requireValue('CHECKOUT_STATE_NOT_READY:RecoConfig', runtime.RecoConfig),
    RECO_WIDGET_DEFAULT: requireValue('CHECKOUT_STATE_NOT_READY:RECO_WIDGET_DEFAULT', runtime.RECO_WIDGET_DEFAULT),
    RecoDiscountRedemption: requireValue('CHECKOUT_STATE_NOT_READY:RecoDiscountRedemption', runtime.RecoDiscountRedemption),
    refreshIncentivesRuntime: requireValue('CHECKOUT_STATE_NOT_READY:refreshIncentivesRuntime', runtime.refreshIncentivesRuntime),
    computeCartIncentivesServer: requireValue('CHECKOUT_STATE_NOT_READY:computeCartIncentivesServer', runtime.computeCartIncentivesServer),
    getTariffPctForCountry: requireValue('CHECKOUT_STATE_NOT_READY:getTariffPctForCountry', runtime.getTariffPctForCountry),
    DraftOrder: requireValue('CHECKOUT_STATE_NOT_READY:DraftOrder', runtime.DraftOrder),
    Order: requireValue('CHECKOUT_STATE_NOT_READY:Order', runtime.Order),
    fxHistory: array(runtime.fxHistory, []),
  };
}

module.exports = { getCheckoutState, syncCheckoutRuntimeFromGlobals };
