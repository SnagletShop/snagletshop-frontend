'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, legacy, mergeDomain } = require('./runtimeResolver');

function getPlatformRuntime() {
  return getRuntime()?.platform || {};
}

function getCatalogRuntime() {
  return getRuntime()?.catalog || {};
}

function getTariffsState() {
  const runtime = getPlatformRuntime();
  return {
    tariffsData: runtime.tariffsData || {},
    tariffsETag: runtime.tariffsETag || null,
    tariffsLocalMtimeMs: Number(runtime.tariffsLocalMtimeMs || 0) || 0,
  };
}

function getTariffsAdminState() {
  const runtime = getPlatformRuntime();
  return {
    LOCAL_TARIFFS_PATH: String(runtime.LOCAL_TARIFFS_PATH || '').trim(),
    TARIFFS_DIR: String(runtime.TARIFFS_DIR || '').trim(),
    initialiseTariffsStore: runtime.initialiseTariffsStore || null,
    setTariffsInMemory: runtime.setTariffsInMemory || null,
    tariffsLocalMtimeMs: Number(runtime.tariffsLocalMtimeMs || 0) || 0,
  };
}

function getCatalogCaches() {
  const runtime = getCatalogRuntime();
  return {
    productsETag: runtime.productsETag || null,
    productsJsonCache: runtime.productsJsonCache || '{}',
    productsFlatETag: runtime.productsFlatETag || null,
    productsFlatJsonCache: runtime.productsFlatJsonCache || '[]',
    catalogBundleETag: runtime.catalogBundleETag || null,
    catalogBundleJsonCache: runtime.catalogBundleJsonCache || '{}',
    productsByIdCache: runtime.productsByIdCache || {},
  };
}

function getCachedRatesState() {
  const runtime = getPlatformRuntime();
  return {
    cachedRates: typeof runtime.cachedRates === 'undefined' ? null : runtime.cachedRates,
  };
}

function getSupportMailConfigState() {
  const runtime = getPlatformRuntime();
  return {
    CONTACT_SMTP_USER: String(runtime.CONTACT_SMTP_USER || '').trim(),
    CONTACT_SMTP_PASS: String(runtime.CONTACT_SMTP_PASS || '').trim(),
    CONTACT_FROM: String(runtime.CONTACT_FROM || '').trim(),
    SUPPORT_TO_EMAIL: String(runtime.SUPPORT_TO_EMAIL || '').trim(),
  };
}

function syncPlatformStateFromGlobals() {
  const runtime = getPlatformRuntime();
  return mergeDomain('platform', {
    ProductProfitStats: runtime.ProductProfitStats || model('ProductProfitStats', null),
    Product: runtime.Product || model('Product', null),
    Order: runtime.Order || model('Order', null),
    getIncentivesRuntimeSync: runtime.getIncentivesRuntimeSync || null,
    getFeatureFlagsRuntimeSyncBestEffort: runtime.getFeatureFlagsRuntimeSyncBestEffort || null,
    incentivesRuntime: typeof runtime.incentivesRuntime !== 'undefined' ? runtime.incentivesRuntime : null,
    initStripe: runtime.initStripe || null,
    stripe: runtime.stripe || null,
    tariffsData: runtime.tariffsData || {},
    tariffsETag: runtime.tariffsETag || null,
    tariffsLocalMtimeMs: Number(runtime.tariffsLocalMtimeMs || 0) || 0,
    LOCAL_TARIFFS_PATH: String(runtime.LOCAL_TARIFFS_PATH || '').trim(),
    TARIFFS_DIR: String(runtime.TARIFFS_DIR || '').trim(),
    initialiseTariffsStore: runtime.initialiseTariffsStore || null,
    setTariffsInMemory: runtime.setTariffsInMemory || null,
    cachedRates: typeof runtime.cachedRates !== 'undefined' ? runtime.cachedRates : null,
    CONTACT_SMTP_USER: String(runtime.CONTACT_SMTP_USER || '').trim(),
    CONTACT_SMTP_PASS: String(runtime.CONTACT_SMTP_PASS || '').trim(),
    CONTACT_FROM: String(runtime.CONTACT_FROM || '').trim(),
    SUPPORT_TO_EMAIL: String(runtime.SUPPORT_TO_EMAIL || '').trim(),
    supportTransporter: runtime.supportTransporter || null,
  });
}

function syncTariffsStateFromGlobals() {
  return syncPlatformStateFromGlobals();
}

function getSupportTransportState() {
  const runtime = getPlatformRuntime();
  return {
    supportTransporter: runtime.supportTransporter || null,
  };
}

module.exports = {
  getTariffsState,
  getTariffsAdminState,
  getCatalogCaches,
  getCachedRatesState,
  getSupportMailConfigState,
  getSupportTransportState,
  syncTariffsStateFromGlobals,
  syncPlatformStateFromGlobals,
};
