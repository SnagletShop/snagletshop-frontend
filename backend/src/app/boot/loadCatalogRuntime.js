'use strict';

const fs = require('fs');
const path = require('path');
const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');
const { canonicalizeProductLink } = require('../../lib/catalogLinks');
const { rebuildCatalogIndexes } = require('../../lib/catalogIndex');
const { writeSplitCatalogFiles, reloadCatalogFromDisk, reloadCatalogFromSplitDisk } = require('../../lib/catalogReload');
const { getCatalogFileMode } = require('../../lib/catalogFileMode');
const { getProductsData, getProductsFlatState, getCatalogLookupMaps } = require('../../lib/catalogState');
const { getCatalogBundleCacheState } = require('../../lib/catalogBundleState');
const { getCatalogFileModeState } = require('../../lib/catalogFileModeState');
const { getCatalogAdminState, getCatalogPricingState, getCatalogCrudState } = require('../../lib/catalogOpsState');
const { getCatalogReloadState } = require('../../lib/catalogReloadState');
const { domain, middleware, text } = require('../../lib/runtimeResolver');

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
  return p;
}

function inferCatalogPaths(existing = {}) {
  const cwd = process.cwd();
  const dataDir = text(process.env.DATA_DIR || existing.DATA_DIR || path.join(cwd, 'data'));
  const splitDir = text(existing.CATALOG_SPLIT_DIR || path.join(dataDir, 'catalog_split'));
  return {
    DATA_DIR: ensureDir(dataDir),
    LOCAL_PRODUCTS_PATH: text(existing.LOCAL_PRODUCTS_PATH || path.join(cwd, 'products.js')),
    CATALOG_FILE: text(existing.CATALOG_FILE || path.join(dataDir, 'catalog.bundle.json')),
    CATALOG_VERSIONS_DIR: ensureDir(text(existing.CATALOG_VERSIONS_DIR || path.join(dataDir, 'catalog_versions'))),
    CATALOG_SPLIT_DIR: ensureDir(splitDir),
    CATALOG_SPLIT_PRODUCTS_FILE: text(existing.CATALOG_SPLIT_PRODUCTS_FILE || path.join(splitDir, 'products.json')),
    CATALOG_SPLIT_CATEGORIES_FILE: text(existing.CATALOG_SPLIT_CATEGORIES_FILE || path.join(splitDir, 'categories.json')),
    CATALOG_FILEMODE_PATH: text(existing.CATALOG_FILEMODE_PATH || path.join(splitDir, 'filemode.json')),
    CANONICAL_PRODUCTS_PATH: text(existing.CANONICAL_PRODUCTS_PATH || path.join(dataDir, 'products.canonical.json')),
  };
}

function safeCatalogOps(existing) {
  try { return getCatalogAdminState(); } catch { return getCatalogCrudState(); }
}

function buildCatalogRuntime() {
  const existing = domain('catalog') || {};
  const paths = inferCatalogPaths(existing);
  const bundleCache = getCatalogBundleCacheState();
  const flatState = getProductsFlatState();
  const lookupMaps = getCatalogLookupMaps();
  const reloadState = (() => { try { return getCatalogReloadState(); } catch { return {}; } })();
  const pricingState = (() => { try { return getCatalogPricingState(); } catch { return {}; } })();
  const opsState = safeCatalogOps(existing);
  const fileModeState = getCatalogFileModeState();
  const productsData = existing.productsData || getProductsData() || {};
  const catalogIndex = rebuildCatalogIndexes(productsData || {});
  const mode = text(existing.CATALOG_FILE_MODE || fileModeState.mode || 'products_js', 'products_js') || 'products_js';
  return {
    catalog: {
      ...existing,
      ...paths,
      CATALOG_SOURCE: text(existing.CATALOG_SOURCE || 'file', 'file') || 'file',
      productsData,
      productsFlatCache: Array.isArray(existing.productsFlatCache) ? existing.productsFlatCache : flatState.productsFlatCache,
      productsFlatJsonCache: typeof existing.productsFlatJsonCache === 'string' ? existing.productsFlatJsonCache : bundleCache.productsFlatJsonCache,
      productsJsonCache: typeof existing.productsJsonCache === 'string' ? existing.productsJsonCache : bundleCache.productsJsonCache,
      catalogBundleJsonCache: typeof existing.catalogBundleJsonCache === 'string' ? existing.catalogBundleJsonCache : bundleCache.catalogBundleJsonCache,
      catalogBundleETag: existing.catalogBundleETag || null,
      productsETag: existing.productsETag || null,
      productsFlatETag: existing.productsFlatETag || null,
      productsByIdCache: existing.productsByIdCache || catalogIndex.productsById || {},
      categoryIdListsCache: existing.categoryIdListsCache || catalogIndex.categoryIdLists || {},
      catalogIndexCache: existing.catalogIndexCache || catalogIndex,
      catalogIndexCacheAt: Number(existing.catalogIndexCacheAt || Date.now()) || Date.now(),
      productsById: existing.productsById || lookupMaps.productsById || catalogIndex.productsById || {},
      productsByCanonLink: existing.productsByCanonLink || lookupMaps.productsByCanonLink || {},
      productsByLink: existing.productsByLink || lookupMaps.productsByLink || {},
      productsByName: existing.productsByName || lookupMaps.productsByName || {},
      canonicalizeProductLink: existing.canonicalizeProductLink || lookupMaps.canonicalizeProductLink || canonicalizeProductLink,
      saveCatalogBundleToDisk: existing.saveCatalogBundleToDisk || null,
      buildLegacyCatalogFromIds: existing.buildLegacyCatalogFromIds || reloadState.buildLegacyCatalogFromIds || null,
      normalizeCatalog: existing.normalizeCatalog || opsState.normalizeCatalog || reloadState.normalizeCatalog || null,
      saveCatalogToDisk: existing.saveCatalogToDisk || pricingState.saveCatalogToDisk || opsState.saveCatalogToDisk || null,
      buildFlatCatalog: existing.buildFlatCatalog || null,
      rebuildLookupMapsFromFlat: existing.rebuildLookupMapsFromFlat || (() => rebuildCatalogIndexes((domain('catalog') || {}).productsData || productsData || {})),
      syncCatalogToDb: existing.syncCatalogToDb || null,
      snapshotCatalog: existing.snapshotCatalog || null,
      getCatalogFileMode: existing.getCatalogFileMode || getCatalogFileMode,
      APPLY_TARIFF_SERVER: typeof existing.APPLY_TARIFF_SERVER === 'boolean' ? existing.APPLY_TARIFF_SERVER : false,
      setCatalogInMemory: existing.setCatalogInMemory || reloadState.setCatalogInMemory || null,
      saveCatalogToDiskFireAndForget: existing.saveCatalogToDiskFireAndForget || pricingState.saveCatalogToDiskFireAndForget || opsState.saveCatalogToDiskFireAndForget || reloadState.saveCatalogToDiskFireAndForget || null,
      loadProducts: existing.loadProducts || reloadState.loadProducts || null,
      requireFresh: existing.requireFresh || opsState.requireFresh || null,
      getDeletedProductIds: existing.getDeletedProductIds || opsState.getDeletedProductIds || null,
      mergeCanonicalIntoLocal: existing.mergeCanonicalIntoLocal || opsState.mergeCanonicalIntoLocal || null,
      saveProducts: existing.saveProducts || pricingState.saveProducts || opsState.saveProducts || null,
      ZOD_ERR_MAX: existing.ZOD_ERR_MAX || opsState.ZOD_ERR_MAX || pricingState.ZOD_ERR_MAX || null,
      tombstoneRemove: existing.tombstoneRemove || opsState.tombstoneRemove || null,
      tombstoneAdd: existing.tombstoneAdd || opsState.tombstoneAdd || null,
      getProductsData: existing.getProductsData || (() => ((domain('catalog') || {}).productsData || productsData || {})),
      getCatalogBundleJsonCache: existing.getCatalogBundleJsonCache || (() => (domain('catalog') || {}).catalogBundleJsonCache || '{}'),
      getMetricsTimezone: existing.getMetricsTimezone || null,
      authMiddleware: middleware('authMiddleware', existing.authMiddleware || null),
      CATALOG_FILE_MODE: mode,
      initialiseProductsStore: existing.initialiseProductsStore || null,
      reloadCatalogFromDisk: existing.reloadCatalogFromDisk || reloadCatalogFromDisk,
      reloadCatalogFromSplitDisk: existing.reloadCatalogFromSplitDisk || reloadCatalogFromSplitDisk,
      writeSplitCatalogFilesFromLegacy: existing.writeSplitCatalogFilesFromLegacy || writeSplitCatalogFiles,
      bootCatalogLegacy: existing.bootCatalogLegacy || null,
    },
  };
}

function loadCatalogRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildCatalogRuntime());
  patchBootState({
    catalogRuntimeLoaded: true,
    catalogRuntimeLoadedAt: new Date().toISOString(),
    catalogRuntimeMode: merged?.catalog?.CATALOG_FILE_MODE || 'products_js',
  });
  return merged;
}

module.exports = { buildCatalogRuntime, loadCatalogRuntime };
