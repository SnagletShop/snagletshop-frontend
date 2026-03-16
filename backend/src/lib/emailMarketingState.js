'use strict';

const { domain, model, middleware, mergeDomain, requireValue, text } = require('./runtimeResolver');

function emailMarketing() {
  return domain('emailMarketing') || {};
}

function syncEmailMarketingRuntimeFromGlobals() {
  const runtime = emailMarketing();
  const orders = domain('orders') || {};
  return mergeDomain('emailMarketing', {
    requireAdmin: runtime.requireAdmin || middleware('requireAdmin', null),
    _getEmailMarketingConfig: runtime._getEmailMarketingConfig || null,
    EmailMarketingConfig: runtime.EmailMarketingConfig || model('EmailMarketingConfig', null),
    EmailJob: runtime.EmailJob || model('EmailJob', null),
    EmailSubscriber: runtime.EmailSubscriber || model('EmailSubscriber', null),
    Order: runtime.Order || orders.Order || model('Order', null),
    DraftOrder: runtime.DraftOrder || orders.DraftOrder || model('DraftOrder', null),
    _verifyHmacToken: runtime._verifyHmacToken || null,
    _normEmail: runtime._normEmail || null,
    _upsertSubscriberFromCustomer: runtime._upsertSubscriberFromCustomer || null,
    _buildUnsubUrl: runtime._buildUnsubUrl || null,
    _renderEmailShell: runtime._renderEmailShell || null,
    _enqueueEmail: runtime._enqueueEmail || null,
    _saveConfigHistory: runtime._saveConfigHistory || null,
    STORE_PUBLIC_ORIGIN: text(process.env.STORE_PUBLIC_ORIGIN || runtime.STORE_PUBLIC_ORIGIN || ''),
  });
}

function getEmailMarketingState() {
  const runtime = emailMarketing();
  return {
    requireAdmin: requireValue('EMAIL_MARKETING_STATE_NOT_READY:requireAdmin', runtime.requireAdmin),
    _getEmailMarketingConfig: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_getEmailMarketingConfig', runtime._getEmailMarketingConfig),
    EmailMarketingConfig: requireValue('EMAIL_MARKETING_STATE_NOT_READY:EmailMarketingConfig', runtime.EmailMarketingConfig),
    EmailJob: requireValue('EMAIL_MARKETING_STATE_NOT_READY:EmailJob', runtime.EmailJob),
    EmailSubscriber: requireValue('EMAIL_MARKETING_STATE_NOT_READY:EmailSubscriber', runtime.EmailSubscriber),
    Order: requireValue('EMAIL_MARKETING_STATE_NOT_READY:Order', runtime.Order),
    DraftOrder: requireValue('EMAIL_MARKETING_STATE_NOT_READY:DraftOrder', runtime.DraftOrder),
    _verifyHmacToken: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_verifyHmacToken', runtime._verifyHmacToken),
    _normEmail: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_normEmail', runtime._normEmail),
    _upsertSubscriberFromCustomer: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_upsertSubscriberFromCustomer', runtime._upsertSubscriberFromCustomer),
    _buildUnsubUrl: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_buildUnsubUrl', runtime._buildUnsubUrl),
    _renderEmailShell: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_renderEmailShell', runtime._renderEmailShell),
    _enqueueEmail: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_enqueueEmail', runtime._enqueueEmail),
    _saveConfigHistory: requireValue('EMAIL_MARKETING_STATE_NOT_READY:_saveConfigHistory', runtime._saveConfigHistory),
    STORE_PUBLIC_ORIGIN: text(runtime.STORE_PUBLIC_ORIGIN || ''),
  };
}

module.exports = { syncEmailMarketingRuntimeFromGlobals, getEmailMarketingState };
