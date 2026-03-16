'use strict';

const path = require('path');
const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');
const { canonicalizeProductLink } = require('../../lib/catalogLinks');
const { getTariffsState, getCatalogCaches, getCachedRatesState, getSupportMailConfigState, getSupportTransportState } = require('../../lib/platformState');
const { domain, model, text } = require('../../lib/runtimeResolver');
const { syncPlatformDomainRuntimeFromGlobals } = require('../../lib/platformDomainState');

function resolveTariffsPaths(existingPlatform = {}) {
  const cwd = process.cwd();
  const localTariffsPath = text(existingPlatform.LOCAL_TARIFFS_PATH || path.join(cwd, 'tariffs.json'));
  return {
    LOCAL_TARIFFS_PATH: localTariffsPath,
    TARIFFS_DIR: text(existingPlatform.TARIFFS_DIR || path.dirname(localTariffsPath)),
  };
}

function buildPlatformRuntime() {
  const syncedDomain = syncPlatformDomainRuntimeFromGlobals() || {};
  const stripeRuntime = domain('stripeRuntime') || {};
  const existingPlatform = syncedDomain || domain('platform') || {};
  const existingCatalog = domain('catalog') || {};
  const { LOCAL_TARIFFS_PATH, TARIFFS_DIR } = resolveTariffsPaths(existingPlatform);
  const tariffsState = getTariffsState();
  const catalogCaches = getCatalogCaches();
  const ratesState = getCachedRatesState();
  const supportMail = getSupportMailConfigState();
  const supportTransport = getSupportTransportState();
  return {
    platform: {
      ...existingPlatform,
      ProductProfitStats: existingPlatform.ProductProfitStats || model('ProductProfitStats'),
      Product: existingPlatform.Product || model('Product'),
      Order: existingPlatform.Order || model('Order'),
      getIncentivesRuntimeSync: existingPlatform.getIncentivesRuntimeSync || null,
      getFeatureFlagsRuntimeSyncBestEffort: existingPlatform.getFeatureFlagsRuntimeSyncBestEffort || null,
      incentivesRuntime: typeof existingPlatform.incentivesRuntime !== 'undefined' ? existingPlatform.incentivesRuntime : null,
      initStripe: existingPlatform.initStripe || stripeRuntime.initStripe || null,
      stripe: existingPlatform.stripe || stripeRuntime.stripe || null,
      tariffsData: tariffsState.tariffsData,
      tariffsETag: tariffsState.tariffsETag,
      tariffsLocalMtimeMs: tariffsState.tariffsLocalMtimeMs,
      LOCAL_TARIFFS_PATH,
      TARIFFS_DIR,
      initialiseTariffsStore: existingPlatform.initialiseTariffsStore || null,
      setTariffsInMemory: existingPlatform.setTariffsInMemory || null,
      cachedRates: ratesState.cachedRates,
      CONTACT_SMTP_USER: text(process.env.SUPPORT_EMAIL || supportMail.CONTACT_SMTP_USER || existingPlatform.CONTACT_SMTP_USER || ''),
      CONTACT_SMTP_PASS: text(process.env.SUPPORT_EMAIL_PASSWORD || supportMail.CONTACT_SMTP_PASS || existingPlatform.CONTACT_SMTP_PASS || ''),
      CONTACT_FROM: text(process.env.CONTACT_FROM || supportMail.CONTACT_FROM || existingPlatform.CONTACT_FROM || ''),
      SUPPORT_TO_EMAIL: text(process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || supportMail.SUPPORT_TO_EMAIL || existingPlatform.SUPPORT_TO_EMAIL || ''),
      supportTransporter: supportTransport.supportTransporter,
    },
    catalog: {
      ...existingCatalog,
      productsETag: existingCatalog.productsETag || catalogCaches.productsETag,
      productsJsonCache: typeof existingCatalog.productsJsonCache === 'string' ? existingCatalog.productsJsonCache : catalogCaches.productsJsonCache,
      productsFlatETag: existingCatalog.productsFlatETag || catalogCaches.productsFlatETag,
      productsFlatJsonCache: typeof existingCatalog.productsFlatJsonCache === 'string' ? existingCatalog.productsFlatJsonCache : catalogCaches.productsFlatJsonCache,
      catalogBundleETag: existingCatalog.catalogBundleETag || catalogCaches.catalogBundleETag,
      catalogBundleJsonCache: typeof existingCatalog.catalogBundleJsonCache === 'string' ? existingCatalog.catalogBundleJsonCache : catalogCaches.catalogBundleJsonCache,
      productsByIdCache: existingCatalog.productsByIdCache || catalogCaches.productsByIdCache,
      canonicalizeProductLink: existingCatalog.canonicalizeProductLink || canonicalizeProductLink,
    },
  };
}

function loadPlatformRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildPlatformRuntime());
  patchBootState({
    platformRuntimeLoaded: true,
    platformRuntimeLoadedAt: new Date().toISOString(),
    platformRuntimeTariffsPath: merged?.platform?.LOCAL_TARIFFS_PATH || '',
  });
  return merged;
}

module.exports = { buildPlatformRuntime, loadPlatformRuntime };
