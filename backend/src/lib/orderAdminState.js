'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, middleware, requireValue, mergeDomain } = require('./runtimeResolver');

function orderAdmin() {
  return getRuntime()?.orderAdmin || {};
}

function getOrderAdminState() {
  const runtime = orderAdmin();
  return {
    Order: requireValue('ORDER_ADMIN_STATE_NOT_READY:Order', runtime.Order),
    OrderPatchSchema: requireValue('ORDER_ADMIN_STATE_NOT_READY:OrderPatchSchema', runtime.OrderPatchSchema),
    buildOrderLookup: requireValue('ORDER_ADMIN_STATE_NOT_READY:buildOrderLookup', runtime.buildOrderLookup),
    zodBadRequest: requireValue('ORDER_ADMIN_STATE_NOT_READY:zodBadRequest', runtime.zodBadRequest),
    PROCUREMENT_STATUSES: requireValue('ORDER_ADMIN_STATE_NOT_READY:PROCUREMENT_STATUSES', runtime.PROCUREMENT_STATUSES),
    addNote: requireValue('ORDER_ADMIN_STATE_NOT_READY:addNote', runtime.addNote),
    addStatusHistory: requireValue('ORDER_ADMIN_STATE_NOT_READY:addStatusHistory', runtime.addStatusHistory),
    ensureInvoiceNumber: requireValue('ORDER_ADMIN_STATE_NOT_READY:ensureInvoiceNumber', runtime.ensureInvoiceNumber),
    sendOrderEmailWithCooldown: requireValue('ORDER_ADMIN_STATE_NOT_READY:sendOrderEmailWithCooldown', runtime.sendOrderEmailWithCooldown),
    sendConfirmationEmail: requireValue('ORDER_ADMIN_STATE_NOT_READY:sendConfirmationEmail', runtime.sendConfirmationEmail),
    sendShippedEmail: requireValue('ORDER_ADMIN_STATE_NOT_READY:sendShippedEmail', runtime.sendShippedEmail),
    initStripe: requireValue('ORDER_ADMIN_STATE_NOT_READY:initStripe', runtime.initStripe),
    updateProductProfitStatsFromOrder: requireValue('ORDER_ADMIN_STATE_NOT_READY:updateProductProfitStatsFromOrder', runtime.updateProductProfitStatsFromOrder),
    authMiddleware: runtime.authMiddleware || null,
    requireAdmin: runtime.requireAdmin || null,
  };
}

function syncOrderAdminRuntimeFromGlobals() {
  const runtime = orderAdmin();
  const orders = getRuntime()?.orders || {};
  const payments = getRuntime()?.payments || {};
  return mergeDomain('orderAdmin', {
    Order: runtime.Order || orders.Order || model('Order', null),
    OrderPatchSchema: runtime.OrderPatchSchema || null,
    buildOrderLookup: runtime.buildOrderLookup || orders.buildOrderLookup || null,
    zodBadRequest: runtime.zodBadRequest || null,
    PROCUREMENT_STATUSES: runtime.PROCUREMENT_STATUSES || null,
    addNote: runtime.addNote || null,
    addStatusHistory: runtime.addStatusHistory || null,
    ensureInvoiceNumber: runtime.ensureInvoiceNumber || orders.ensureInvoiceNumber || null,
    sendOrderEmailWithCooldown: runtime.sendOrderEmailWithCooldown || orders.sendOrderEmailWithCooldown || null,
    sendConfirmationEmail: runtime.sendConfirmationEmail || orders.sendConfirmationEmail || null,
    sendShippedEmail: runtime.sendShippedEmail || null,
    initStripe: runtime.initStripe || payments.initStripe || orders.initStripe || null,
    updateProductProfitStatsFromOrder: runtime.updateProductProfitStatsFromOrder || orders.updateProductProfitStatsFromOrder || null,
    authMiddleware: runtime.authMiddleware || middleware('authMiddleware', null),
    requireAdmin: runtime.requireAdmin || middleware('requireAdmin', null),
  });
}

module.exports = { getOrderAdminState, syncOrderAdminRuntimeFromGlobals };
