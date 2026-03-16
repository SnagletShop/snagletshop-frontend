'use strict';

const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');
const { domain, model, middleware, text } = require('../../lib/runtimeResolver');
const { syncEmailMarketingRuntimeFromGlobals } = require('../../lib/emailMarketingState');

function buildEmailMarketingRuntime() {
  const synced = syncEmailMarketingRuntimeFromGlobals() || {};
  const existing = synced || domain('emailMarketing') || {};
  return {
    emailMarketing: {
      ...existing,
      requireAdmin: middleware('requireAdmin', existing.requireAdmin || null),
      _getEmailMarketingConfig: existing._getEmailMarketingConfig || null,
      EmailMarketingConfig: model('EmailMarketingConfig'),
      EmailJob: model('EmailJob'),
      EmailSubscriber: model('EmailSubscriber'),
      Order: model('Order'),
      DraftOrder: model('DraftOrder'),
      _verifyHmacToken: existing._verifyHmacToken || null,
      _normEmail: existing._normEmail || null,
      _upsertSubscriberFromCustomer: existing._upsertSubscriberFromCustomer || null,
      _buildUnsubUrl: existing._buildUnsubUrl || null,
      _renderEmailShell: existing._renderEmailShell || null,
      _enqueueEmail: existing._enqueueEmail || null,
      _saveConfigHistory: existing._saveConfigHistory || null,
      STORE_PUBLIC_ORIGIN: text(process.env.STORE_PUBLIC_ORIGIN || existing.STORE_PUBLIC_ORIGIN || ''),
    },
  };
}

function loadEmailMarketingRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildEmailMarketingRuntime());
  patchBootState({
    emailMarketingRuntimeLoaded: true,
    emailMarketingRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { buildEmailMarketingRuntime, loadEmailMarketingRuntime };
