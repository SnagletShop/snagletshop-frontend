'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, middleware, requireValue, mergeDomain } = require('./runtimeResolver');

function syncReportingRuntimeFromGlobals() {
  const runtime = getRuntime() || {};
  return mergeDomain('reporting', {
    requireAdmin: middleware('requireAdmin', null),
    Order: model('Order', null),
    Expense: model('Expense', null),
    getStripeClient: runtime.reporting?.getStripeClient || runtime.stripeRuntime?.initStripe || null,
    initStripe: runtime.reporting?.initStripe || runtime.stripeRuntime?.initStripe || null,
  });
}

function getReportingState() {
  const runtime = getRuntime() || {};
  const reporting = runtime.reporting || {};
  const stripeRuntime = runtime.stripeRuntime || {};
  const initStripe = reporting.initStripe || stripeRuntime.initStripe || null;
  return {
    requireAdmin: reporting.requireAdmin || middleware('requireAdmin', null),
    Order: requireValue('REPORTING_STATE_NOT_READY:Order', reporting.Order, model('Order')),
    Expense: reporting.Expense || model('Expense', null),
    getStripeClient: reporting.getStripeClient || (typeof initStripe === 'function' ? initStripe : null),
    initStripe,
  };
}

module.exports = { getReportingState, syncReportingRuntimeFromGlobals };
