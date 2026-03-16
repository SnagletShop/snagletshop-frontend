'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, middleware, requireValue, mergeDomain } = require('./runtimeResolver');

function rt() { return getRuntime()?.orders || {}; }

function syncOrdersRuntimeFromGlobals() {
  const runtime = rt();
  const payments = getRuntime()?.payments || {};
  const orderAdmin = getRuntime()?.orderAdmin || {};
  return mergeDomain('orders', {
    paymentStatusLimiter: runtime.paymentStatusLimiter || payments.paymentStatusLimiter || middleware('paymentStatusLimiter', null),
    fraudCheck: runtime.fraudCheck || null,
    DraftOrder: runtime.DraftOrder || model('DraftOrder', null),
    Order: runtime.Order || model('Order', null),
    initStripe: runtime.initStripe || payments.initStripe || null,
    ensureInvoiceNumber: runtime.ensureInvoiceNumber || orderAdmin.ensureInvoiceNumber || null,
    enrichStripeFeesIfMissing: runtime.enrichStripeFeesIfMissing || null,
    sendOrderEmailWithCooldown: runtime.sendOrderEmailWithCooldown || orderAdmin.sendOrderEmailWithCooldown || null,
    sendConfirmationEmail: runtime.sendConfirmationEmail || orderAdmin.sendConfirmationEmail || null,
    updateProductProfitStatsFromOrder: runtime.updateProductProfitStatsFromOrder || orderAdmin.updateProductProfitStatsFromOrder || null,
    authMiddleware: runtime.authMiddleware || middleware('authMiddleware', null),
    agentWebhookAuth: runtime.agentWebhookAuth || middleware('agentWebhookAuth', null),
    buildOrderLookup: runtime.buildOrderLookup || orderAdmin.buildOrderLookup || null,
    agentQuote: runtime.agentQuote || null,
    agentPlaceOrder: runtime.agentPlaceOrder || null,
    agentCancel: runtime.agentCancel || null,
    mapAgentStatus: runtime.mapAgentStatus || null,
  });
}

function getOrdersState() {
  const runtime = rt();
  return {
    paymentStatusLimiter: requireValue('ORDER_STATE_NOT_READY:paymentStatusLimiter', runtime.paymentStatusLimiter),
    fraudCheck: requireValue('ORDER_STATE_NOT_READY:fraudCheck', runtime.fraudCheck),
    DraftOrder: requireValue('ORDER_STATE_NOT_READY:DraftOrder', runtime.DraftOrder),
    Order: requireValue('ORDER_STATE_NOT_READY:Order', runtime.Order),
    initStripe: requireValue('ORDER_STATE_NOT_READY:initStripe', runtime.initStripe),
    ensureInvoiceNumber: requireValue('ORDER_STATE_NOT_READY:ensureInvoiceNumber', runtime.ensureInvoiceNumber),
    enrichStripeFeesIfMissing: requireValue('ORDER_STATE_NOT_READY:enrichStripeFeesIfMissing', runtime.enrichStripeFeesIfMissing),
    sendOrderEmailWithCooldown: requireValue('ORDER_STATE_NOT_READY:sendOrderEmailWithCooldown', runtime.sendOrderEmailWithCooldown),
    sendConfirmationEmail: requireValue('ORDER_STATE_NOT_READY:sendConfirmationEmail', runtime.sendConfirmationEmail),
    updateProductProfitStatsFromOrder: requireValue('ORDER_STATE_NOT_READY:updateProductProfitStatsFromOrder', runtime.updateProductProfitStatsFromOrder),
  };
}

function getFulfillmentState() {
  const runtime = rt();
  return {
    authMiddleware: requireValue('ORDER_STATE_NOT_READY:authMiddleware', runtime.authMiddleware),
    agentWebhookAuth: requireValue('ORDER_STATE_NOT_READY:agentWebhookAuth', runtime.agentWebhookAuth),
    Order: requireValue('ORDER_STATE_NOT_READY:Order', runtime.Order),
    buildOrderLookup: requireValue('ORDER_STATE_NOT_READY:buildOrderLookup', runtime.buildOrderLookup),
    agentQuote: requireValue('ORDER_STATE_NOT_READY:agentQuote', runtime.agentQuote),
    agentPlaceOrder: requireValue('ORDER_STATE_NOT_READY:agentPlaceOrder', runtime.agentPlaceOrder),
    agentCancel: requireValue('ORDER_STATE_NOT_READY:agentCancel', runtime.agentCancel),
    mapAgentStatus: requireValue('ORDER_STATE_NOT_READY:mapAgentStatus', runtime.mapAgentStatus),
  };
}

module.exports = {
  getOrdersState,
  getFulfillmentState,
  syncOrdersRuntimeFromGlobals,
};
