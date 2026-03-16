'use strict';

const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');

const defaultFraudCheck = async () => ({ ok: true });
const { patchBootState } = require('./bootState');
const { domain, model } = require('../../lib/runtimeResolver');
const { syncOrdersRuntimeFromGlobals } = require('../../lib/orderState');
const { syncOrderAdminRuntimeFromGlobals } = require('../../lib/orderAdminState');
const { syncWebhookRuntimeFromGlobals } = require('../../lib/webhookState');

function buildOrderRuntime() {
  const syncedOrders = syncOrdersRuntimeFromGlobals() || {};
  const syncedOrderAdmin = syncOrderAdminRuntimeFromGlobals() || {};
  const syncedWebhook = syncWebhookRuntimeFromGlobals() || {};
  const orderDomain = syncedOrders || domain('orders') || {};
  const orderAdminDomain = syncedOrderAdmin || domain('orderAdmin') || {};
  const webhookDomain = syncedWebhook || domain('webhook') || {};
  const payments = domain('payments') || {};
  const middlewareDomain = (getRuntime() || {}).middleware || {};
  const initStripe = payments.initStripe || orderDomain.initStripe || orderAdminDomain.initStripe || webhookDomain.initStripe || null;
  const authMiddleware = orderDomain.authMiddleware || orderAdminDomain.authMiddleware || middlewareDomain.authMiddleware || null;
  const agentWebhookAuth = orderDomain.agentWebhookAuth || middlewareDomain.agentWebhookAuth || null;
  const requireAdmin = orderAdminDomain.requireAdmin || middlewareDomain.requireAdmin || null;
  return {
    orders: {
      ...orderDomain,
      paymentStatusLimiter: orderDomain.paymentStatusLimiter || middlewareDomain.paymentStatusLimiter || null,
      fraudCheck: orderDomain.fraudCheck || defaultFraudCheck,
      DraftOrder: model('DraftOrder'),
      Order: model('Order'),
      initStripe,
      ensureInvoiceNumber: orderDomain.ensureInvoiceNumber || null,
      enrichStripeFeesIfMissing: orderDomain.enrichStripeFeesIfMissing || null,
      sendOrderEmailWithCooldown: orderDomain.sendOrderEmailWithCooldown || null,
      sendConfirmationEmail: orderDomain.sendConfirmationEmail || null,
      updateProductProfitStatsFromOrder: orderDomain.updateProductProfitStatsFromOrder || null,
      authMiddleware,
      agentWebhookAuth,
      buildOrderLookup: orderDomain.buildOrderLookup || null,
      agentQuote: orderDomain.agentQuote || null,
      agentPlaceOrder: orderDomain.agentPlaceOrder || null,
      agentCancel: orderDomain.agentCancel || null,
      mapAgentStatus: orderDomain.mapAgentStatus || null,
    },
    orderAdmin: {
      ...orderAdminDomain,
      Order: model('Order'),
      OrderPatchSchema: orderAdminDomain.OrderPatchSchema || null,
      buildOrderLookup: orderAdminDomain.buildOrderLookup || null,
      zodBadRequest: orderAdminDomain.zodBadRequest || null,
      PROCUREMENT_STATUSES: orderAdminDomain.PROCUREMENT_STATUSES || null,
      addNote: orderAdminDomain.addNote || null,
      addStatusHistory: orderAdminDomain.addStatusHistory || webhookDomain.addStatusHistory || null,
      ensureInvoiceNumber: orderAdminDomain.ensureInvoiceNumber || orderDomain.ensureInvoiceNumber || webhookDomain.ensureInvoiceNumber || null,
      sendOrderEmailWithCooldown: orderAdminDomain.sendOrderEmailWithCooldown || orderDomain.sendOrderEmailWithCooldown || webhookDomain.sendOrderEmailWithCooldown || null,
      sendConfirmationEmail: orderAdminDomain.sendConfirmationEmail || orderDomain.sendConfirmationEmail || webhookDomain.sendConfirmationEmail || null,
      sendShippedEmail: orderAdminDomain.sendShippedEmail || null,
      initStripe,
      updateProductProfitStatsFromOrder: orderAdminDomain.updateProductProfitStatsFromOrder || orderDomain.updateProductProfitStatsFromOrder || null,
      authMiddleware,
      requireAdmin,
    },
    webhook: {
      ...webhookDomain,
      Order: model('Order'),
      DraftOrder: model('DraftOrder'),
      initStripe,
      addStatusHistory: webhookDomain.addStatusHistory || orderAdminDomain.addStatusHistory || null,
      ensureInvoiceNumber: webhookDomain.ensureInvoiceNumber || orderAdminDomain.ensureInvoiceNumber || orderDomain.ensureInvoiceNumber || null,
      enrichStripeFeesIfMissing: webhookDomain.enrichStripeFeesIfMissing || orderDomain.enrichStripeFeesIfMissing || null,
      sendOrderEmailWithCooldown: webhookDomain.sendOrderEmailWithCooldown || orderAdminDomain.sendOrderEmailWithCooldown || orderDomain.sendOrderEmailWithCooldown || null,
      sendConfirmationEmail: webhookDomain.sendConfirmationEmail || orderAdminDomain.sendConfirmationEmail || orderDomain.sendConfirmationEmail || null,
      writeOrderToFile: webhookDomain.writeOrderToFile || null,
      writeOrderToExcel: webhookDomain.writeOrderToExcel || null,
    },
  };
}

function loadOrderRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildOrderRuntime());
  patchBootState({
    orderRuntimeLoaded: true,
    orderRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { buildOrderRuntime, loadOrderRuntime };
