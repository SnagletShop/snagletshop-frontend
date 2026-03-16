'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, middleware, requireValue, mergeDomain } = require('./runtimeResolver');

function payments() {
  return getRuntime()?.payments || {};
}

function syncPaymentsRuntimeFromGlobals() {
  const current = payments();
  const orders = getRuntime()?.orders || {};
  return mergeDomain('payments', {
    Order: current.Order || orders.Order || model('Order', null),
    DraftOrder: current.DraftOrder || orders.DraftOrder || model('DraftOrder', null),
    initStripe: current.initStripe || orders.initStripe || null,
    paymentStatusLimiter: current.paymentStatusLimiter || orders.paymentStatusLimiter || middleware('paymentStatusLimiter', null),
  });
}

function getPaymentsState() {
  const current = payments();
  return {
    Order: requireValue('PAYMENTS_STATE_NOT_READY:Order', current.Order),
    DraftOrder: requireValue('PAYMENTS_STATE_NOT_READY:DraftOrder', current.DraftOrder),
    initStripe: requireValue('PAYMENTS_STATE_NOT_READY:initStripe', current.initStripe),
    paymentStatusLimiter: requireValue('PAYMENTS_STATE_NOT_READY:paymentStatusLimiter', current.paymentStatusLimiter),
  };
}

module.exports = { getPaymentsState, syncPaymentsRuntimeFromGlobals };
