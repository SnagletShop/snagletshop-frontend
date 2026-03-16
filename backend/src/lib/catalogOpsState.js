'use strict';

const { domain, text, requireValue, mergeDomain } = require('./runtimeResolver');

function catalog() {
  return domain('catalog') || {};
}

function getCatalogSource() {
  const runtime = catalog();
  return {
    requireFresh: runtime.requireFresh || null,
    CANONICAL_PRODUCTS_PATH: text(runtime.CANONICAL_PRODUCTS_PATH || ''),
    getDeletedProductIds: runtime.getDeletedProductIds || null,
    normalizeCatalog: runtime.normalizeCatalog || null,
    mergeCanonicalIntoLocal: runtime.mergeCanonicalIntoLocal || null,
    saveProducts: runtime.saveProducts || null,
    ZOD_ERR_MAX: runtime.ZOD_ERR_MAX || null,
    tombstoneRemove: runtime.tombstoneRemove || null,
    saveCatalogToDisk: runtime.saveCatalogToDisk || null,
    saveCatalogToDiskFireAndForget: runtime.saveCatalogToDiskFireAndForget || null,
    tombstoneAdd: runtime.tombstoneAdd || null,
  };
}

function requireValues(source, keys, label) {
  keys.forEach((k) => requireValue(`${label}:${k}`, source[k]));
  return source;
}

function getCatalogAdminState() {
  return requireValues(getCatalogSource(), [
    'requireFresh',
    'CANONICAL_PRODUCTS_PATH',
    'getDeletedProductIds',
    'normalizeCatalog',
    'mergeCanonicalIntoLocal',
    'saveProducts',
    'ZOD_ERR_MAX',
  ], 'CATALOG_ADMIN_STATE_NOT_READY');
}

function getCatalogPricingState() {
  return requireValues(getCatalogSource(), [
    'saveProducts',
    'saveCatalogToDisk',
    'saveCatalogToDiskFireAndForget',
    'ZOD_ERR_MAX',
  ], 'CATALOG_PRICING_STATE_NOT_READY');
}

function getCatalogCrudState() {
  return requireValues(getCatalogSource(), [
    'tombstoneRemove',
    'normalizeCatalog',
    'saveCatalogToDisk',
    'saveCatalogToDiskFireAndForget',
    'requireFresh',
    'ZOD_ERR_MAX',
  ], 'CATALOG_CRUD_STATE_NOT_READY');
}

function syncCatalogOpsRuntimeFromGlobals() {
  const runtime = catalog();
  mergeDomain('catalog', {
    requireFresh: runtime.requireFresh || null,
    CANONICAL_PRODUCTS_PATH: text(runtime.CANONICAL_PRODUCTS_PATH || ''),
    getDeletedProductIds: runtime.getDeletedProductIds || null,
    normalizeCatalog: runtime.normalizeCatalog || null,
    mergeCanonicalIntoLocal: runtime.mergeCanonicalIntoLocal || null,
    saveProducts: runtime.saveProducts || null,
    ZOD_ERR_MAX: runtime.ZOD_ERR_MAX || null,
    tombstoneRemove: runtime.tombstoneRemove || null,
    saveCatalogToDisk: runtime.saveCatalogToDisk || null,
    saveCatalogToDiskFireAndForget: runtime.saveCatalogToDiskFireAndForget || null,
    tombstoneAdd: runtime.tombstoneAdd || null,
  });
  return domain('catalog');
}

module.exports = {
  getCatalogAdminState,
  getCatalogPricingState,
  getCatalogCrudState,
  syncCatalogOpsRuntimeFromGlobals,
};
