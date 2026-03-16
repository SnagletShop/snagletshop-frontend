'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, middleware, requireValue, mergeDomain } = require('./runtimeResolver');

function syncAccountingRuntimeFromGlobals() {
  return mergeDomain('accounting', {
    requireAdmin: middleware('requireAdmin', null),
    Order: model('Order', null),
    Expense: model('Expense', null),
  });
}

function getAccountingState() {
  const runtime = getRuntime()?.accounting || {};
  return {
    requireAdmin: requireValue('ACCOUNTING_STATE_NOT_READY:requireAdmin', runtime.requireAdmin, middleware('requireAdmin')),
    Order: requireValue('ACCOUNTING_STATE_NOT_READY:Order', runtime.Order, model('Order')),
    Expense: requireValue('ACCOUNTING_STATE_NOT_READY:Expense', runtime.Expense, model('Expense')),
  };
}

module.exports = { getAccountingState, syncAccountingRuntimeFromGlobals };
