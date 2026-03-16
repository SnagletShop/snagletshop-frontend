'use strict';

const crypto = require('crypto');
const { domain, text, bool, object, array, requireValue, mergeDomain } = require('./runtimeResolver');

function catalog() {
  return domain('catalog') || {};
}

function getCatalogBundlePathState() {
  const runtime = catalog();
  return {
    catalogFile: text(runtime.CATALOG_FILE || ''),
    catalogVersionsDir: text(runtime.CATALOG_VERSIONS_DIR || ''),
  };
}

function getCatalogBundleRuntimeState() {
  const runtime = catalog();
  return {
    saveCatalogBundleToDisk: requireValue('catalog.saveCatalogBundleToDisk', runtime.saveCatalogBundleToDisk),
    buildLegacyCatalogFromIds: requireValue('catalog.buildLegacyCatalogFromIds', runtime.buildLegacyCatalogFromIds),
    normalizeCatalog: requireValue('catalog.normalizeCatalog', runtime.normalizeCatalog),
    saveCatalogToDisk: requireValue('catalog.saveCatalogToDisk', runtime.saveCatalogToDisk),
    buildFlatCatalog: requireValue('catalog.buildFlatCatalog', runtime.buildFlatCatalog),
    rebuildLookupMapsFromFlat: requireValue('catalog.rebuildLookupMapsFromFlat', runtime.rebuildLookupMapsFromFlat),
    syncCatalogToDb: requireValue('catalog.syncCatalogToDb', runtime.syncCatalogToDb),
    snapshotCatalog: requireValue('catalog.snapshotCatalog', runtime.snapshotCatalog),
    getCatalogFileMode: requireValue('catalog.getCatalogFileMode', runtime.getCatalogFileMode),
    catalogSource: text(runtime.CATALOG_SOURCE || ''),
    applyTariffServer: bool(typeof runtime.APPLY_TARIFF_SERVER === 'boolean' ? runtime.APPLY_TARIFF_SERVER : false, false),
  };
}

function getCatalogBundleCacheState() {
  const runtime = catalog();
  return {
    productsData: object(runtime.productsData, {}),
    productsFlatCache: array(runtime.productsFlatCache, []),
    productsFlatJsonCache: text(runtime.productsFlatJsonCache || '[]') || '[]',
    productsJsonCache: text(runtime.productsJsonCache || '{}') || '{}',
    catalogBundleJsonCache: text(runtime.catalogBundleJsonCache || '{}') || '{}',
  };
}

function setCatalogBundleProductsData(data) {
  const next = object(data, {});
  mergeDomain('catalog', { productsData: next });
  return next;
}

function setCatalogBundleCacheArtifacts(patch) {
  const runtimePatch = {};
  if (Object.prototype.hasOwnProperty.call(patch || {}, 'bundle')) {
    const bundleJson = JSON.stringify((patch || {}).bundle || {});
    const bundleEtag = `"${crypto.createHash('sha1').update(bundleJson).digest('hex')}"`;
    const productsByIdCache = object(((patch || {}).bundle || {}).productsById, {});
    const categoryIdListsCache = object(((patch || {}).bundle || {}).categories, {});
    runtimePatch.catalogBundleJsonCache = bundleJson;
    runtimePatch.catalogBundleETag = bundleEtag;
    runtimePatch.productsByIdCache = productsByIdCache;
    runtimePatch.categoryIdListsCache = categoryIdListsCache;
  }
  if (Object.prototype.hasOwnProperty.call(patch || {}, 'productsPayload')) {
    const productsJson = JSON.stringify((patch || {}).productsPayload || {});
    const productsEtag = `"${crypto.createHash('sha1').update(productsJson).digest('hex')}"`;
    runtimePatch.productsJsonCache = productsJson;
    runtimePatch.productsETag = productsEtag;
  }
  if (Object.prototype.hasOwnProperty.call(patch || {}, 'productsFlat')) {
    const productsFlatCache = array((patch || {}).productsFlat, []);
    const productsFlatJsonCache = JSON.stringify(productsFlatCache);
    const productsFlatETag = `"${crypto.createHash('sha1').update(productsFlatJsonCache).digest('hex')}"`;
    runtimePatch.productsFlatCache = productsFlatCache;
    runtimePatch.productsFlatJsonCache = productsFlatJsonCache;
    runtimePatch.productsFlatETag = productsFlatETag;
  }
  if (Object.keys(runtimePatch).length) mergeDomain('catalog', runtimePatch);
}

function syncCatalogBundleRuntimeFromGlobals() {
  const runtime = catalog();
  mergeDomain('catalog', {
    CATALOG_FILE: text(runtime.CATALOG_FILE || ''),
    CATALOG_VERSIONS_DIR: text(runtime.CATALOG_VERSIONS_DIR || ''),
    saveCatalogBundleToDisk: runtime.saveCatalogBundleToDisk || null,
    buildLegacyCatalogFromIds: runtime.buildLegacyCatalogFromIds || null,
    normalizeCatalog: runtime.normalizeCatalog || null,
    saveCatalogToDisk: runtime.saveCatalogToDisk || null,
    buildFlatCatalog: runtime.buildFlatCatalog || null,
    rebuildLookupMapsFromFlat: runtime.rebuildLookupMapsFromFlat || null,
    syncCatalogToDb: runtime.syncCatalogToDb || null,
    snapshotCatalog: runtime.snapshotCatalog || null,
    getCatalogFileMode: runtime.getCatalogFileMode || null,
    CATALOG_SOURCE: text(runtime.CATALOG_SOURCE || ''),
    APPLY_TARIFF_SERVER: typeof runtime.APPLY_TARIFF_SERVER === 'boolean' ? runtime.APPLY_TARIFF_SERVER : false,
    productsData: object(runtime.productsData, {}),
    productsFlatCache: array(runtime.productsFlatCache, []),
    productsFlatJsonCache: text(runtime.productsFlatJsonCache || '[]') || '[]',
    productsJsonCache: text(runtime.productsJsonCache || '{}') || '{}',
    catalogBundleJsonCache: text(runtime.catalogBundleJsonCache || '{}') || '{}',
    catalogBundleETag: runtime.catalogBundleETag || null,
    productsETag: runtime.productsETag || null,
    productsFlatETag: runtime.productsFlatETag || null,
    productsByIdCache: object(runtime.productsByIdCache, {}),
    categoryIdListsCache: object(runtime.categoryIdListsCache, {}),
  });
  return domain('catalog');
}

module.exports = {
  getCatalogBundlePathState,
  getCatalogBundleRuntimeState,
  getCatalogBundleCacheState,
  setCatalogBundleProductsData,
  setCatalogBundleCacheArtifacts,
  syncCatalogBundleRuntimeFromGlobals,
};
