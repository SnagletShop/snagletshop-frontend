'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, requireValue, mergeDomain } = require('./runtimeResolver');

function webhook() {
  return getRuntime()?.webhook || {};
}

function syncWebhookRuntimeFromGlobals() {
  const current = webhook();
  const orders = getRuntime()?.orders || {};
  const orderAdmin = getRuntime()?.orderAdmin || {};
  const payments = getRuntime()?.payments || {};
  return mergeDomain('webhook', {
    Order: current.Order || orders.Order || orderAdmin.Order || model('Order', null),
    DraftOrder: current.DraftOrder || orders.DraftOrder || model('DraftOrder', null),
    initStripe: current.initStripe || payments.initStripe || orders.initStripe || orderAdmin.initStripe || null,
    addStatusHistory: current.addStatusHistory || orderAdmin.addStatusHistory || null,
    ensureInvoiceNumber: current.ensureInvoiceNumber || orderAdmin.ensureInvoiceNumber || orders.ensureInvoiceNumber || null,
    enrichStripeFeesIfMissing: current.enrichStripeFeesIfMissing || orders.enrichStripeFeesIfMissing || null,
    sendOrderEmailWithCooldown: current.sendOrderEmailWithCooldown || orderAdmin.sendOrderEmailWithCooldown || orders.sendOrderEmailWithCooldown || null,
    sendConfirmationEmail: current.sendConfirmationEmail || orderAdmin.sendConfirmationEmail || orders.sendConfirmationEmail || null,
    writeOrderToFile: current.writeOrderToFile || null,
    writeOrderToExcel: current.writeOrderToExcel || null,
  });
}

function getWebhookState() {
  const current = webhook();
  return {
    Order: requireValue('WEBHOOK_STATE_NOT_READY:Order', current.Order),
    DraftOrder: requireValue('WEBHOOK_STATE_NOT_READY:DraftOrder', current.DraftOrder),
    initStripe: requireValue('WEBHOOK_STATE_NOT_READY:initStripe', current.initStripe),
    addStatusHistory: requireValue('WEBHOOK_STATE_NOT_READY:addStatusHistory', current.addStatusHistory),
    ensureInvoiceNumber: requireValue('WEBHOOK_STATE_NOT_READY:ensureInvoiceNumber', current.ensureInvoiceNumber),
    enrichStripeFeesIfMissing: requireValue('WEBHOOK_STATE_NOT_READY:enrichStripeFeesIfMissing', current.enrichStripeFeesIfMissing),
    sendOrderEmailWithCooldown: requireValue('WEBHOOK_STATE_NOT_READY:sendOrderEmailWithCooldown', current.sendOrderEmailWithCooldown),
    sendConfirmationEmail: requireValue('WEBHOOK_STATE_NOT_READY:sendConfirmationEmail', current.sendConfirmationEmail),
    writeOrderToFile: requireValue('WEBHOOK_STATE_NOT_READY:writeOrderToFile', current.writeOrderToFile),
    writeOrderToExcel: requireValue('WEBHOOK_STATE_NOT_READY:writeOrderToExcel', current.writeOrderToExcel),
  };
}

module.exports = { getWebhookState, syncWebhookRuntimeFromGlobals };
