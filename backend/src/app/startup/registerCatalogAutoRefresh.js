'use strict';

const fs = require('fs');
const { getRuntime, mergeRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('../boot/bootState');
const { getCatalogFileMode } = require('../../lib/catalogFileMode');
const { syncCatalogRuntimeFromGlobals } = require('../../lib/catalogState');
const { syncCatalogBundleRuntimeFromGlobals } = require('../../lib/catalogBundleState');
const { syncCatalogFileModeRuntimeFromGlobals } = require('../../lib/catalogFileModeState');
const { syncCatalogIndexRuntimeFromGlobals } = require('../../lib/catalogIndexState');
const { syncCatalogOpsRuntimeFromGlobals } = require('../../lib/catalogOpsState');
const { syncCatalogReloadRuntimeFromGlobals } = require('../../lib/catalogReloadState');

let productsWatchStarted = false;
let splitWatchStarted = false;
let productsReloadTimer = null;
let splitReloadTimer = null;
let productsKnownMtime = 0;
let splitProductsKnownMtime = 0;
let splitCategoriesKnownMtime = 0;

function runtimeCatalog() {
  return getRuntime()?.catalog || {};
}

function syncCatalogSlices() {
  syncCatalogRuntimeFromGlobals();
  syncCatalogBundleRuntimeFromGlobals();
  syncCatalogFileModeRuntimeFromGlobals();
  syncCatalogIndexRuntimeFromGlobals();
  syncCatalogOpsRuntimeFromGlobals();
  syncCatalogReloadRuntimeFromGlobals();
}

function markCatalogSync() {
  const catalog = runtimeCatalog();
  mergeRuntime({
    catalog: {
      productsData: catalog.productsData || {},
      productsFlatCache: Array.isArray(catalog.productsFlatCache) ? catalog.productsFlatCache : [],
      productsFlatJsonCache: typeof catalog.productsFlatJsonCache === 'string' ? catalog.productsFlatJsonCache : '[]',
      productsJsonCache: typeof catalog.productsJsonCache === 'string' ? catalog.productsJsonCache : '{}',
      catalogBundleJsonCache: typeof catalog.catalogBundleJsonCache === 'string' ? catalog.catalogBundleJsonCache : '{}',
      productsETag: catalog.productsETag || null,
      productsFlatETag: catalog.productsFlatETag || null,
      catalogBundleETag: catalog.catalogBundleETag || null,
    },
  });
  syncCatalogSlices();
}

function getCatalogPaths() {
  const catalog = runtimeCatalog();
  return {
    source: String(catalog.CATALOG_SOURCE || '').trim(),
    localProductsPath: String(catalog.LOCAL_PRODUCTS_PATH || '').trim(),
    splitProductsFile: String(catalog.CATALOG_SPLIT_PRODUCTS_FILE || '').trim(),
    splitCategoriesFile: String(catalog.CATALOG_SPLIT_CATEGORIES_FILE || '').trim(),
  };
}

function getCatalogStartupFns() {
  const catalog = runtimeCatalog();
  return {
    initialiseProductsStore: typeof catalog.initialiseProductsStore === 'function' ? catalog.initialiseProductsStore : null,
    reloadCatalogFromDisk: typeof catalog.reloadCatalogFromDisk === 'function' ? catalog.reloadCatalogFromDisk : null,
    reloadCatalogFromSplitDisk: typeof catalog.reloadCatalogFromSplitDisk === 'function' ? catalog.reloadCatalogFromSplitDisk : null,
    writeSplitCatalogFilesFromLegacy: typeof catalog.writeSplitCatalogFilesFromLegacy === 'function' ? catalog.writeSplitCatalogFilesFromLegacy : null,
  };
}

function getMtimeMs(filePath) {
  try { return Number(fs.statSync(filePath).mtimeMs || 0) || 0; } catch { return 0; }
}

function updateBootState(extra) {
  const paths = getCatalogPaths();
  patchBootState({
    catalogAutoRefreshStarted: productsWatchStarted || splitWatchStarted,
    catalogAutoRefreshMode: getCatalogFileMode(),
    catalogAutoRefreshSource: paths.source || null,
    catalogAutoRefreshProductsPath: paths.localProductsPath || null,
    catalogAutoRefreshSplitProductsPath: paths.splitProductsFile || null,
    catalogAutoRefreshSplitCategoriesPath: paths.splitCategoriesFile || null,
    ...extra,
  });
}

function startProductsWatcher(localProductsPath, reloadCatalogFromDisk) {
  if (productsWatchStarted || !localProductsPath || typeof reloadCatalogFromDisk !== 'function') return null;
  productsWatchStarted = true;
  productsKnownMtime = getMtimeMs(localProductsPath);

  try {
    fs.watchFile(localProductsPath, { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      if (getCatalogFileMode() !== 'products_js') return;
      if (productsReloadTimer) clearTimeout(productsReloadTimer);
      productsReloadTimer = setTimeout(() => {
        try {
          const mtime = getMtimeMs(localProductsPath);
          if (mtime && productsKnownMtime && mtime === productsKnownMtime) return;
          reloadCatalogFromDisk('modular watchFile change');
          productsKnownMtime = getMtimeMs(localProductsPath);
          syncCatalogSlices();
        } catch (e) {
          console.warn('[catalog] modular reload after change failed:', e?.message || e);
        }
      }, 250);
    });
    console.log(`[catalog] modular auto-refresh enabled (watching ${localProductsPath})`);
    updateBootState({ catalogAutoRefreshStarted: true });
    return true;
  } catch (e) {
    console.warn('[catalog] failed to start modular auto-refresh:', e?.message || e);
    updateBootState({ catalogAutoRefreshStarted: false });
    return null;
  }
}

function startSplitWatcher(splitProductsFile, splitCategoriesFile, reloadCatalogFromSplitDisk) {
  if (splitWatchStarted || typeof reloadCatalogFromSplitDisk !== 'function') return null;
  splitWatchStarted = true;
  splitProductsKnownMtime = getMtimeMs(splitProductsFile);
  splitCategoriesKnownMtime = getMtimeMs(splitCategoriesFile);

  const onChange = () => {
    if (getCatalogFileMode() !== 'split_json') return;
    if (splitReloadTimer) clearTimeout(splitReloadTimer);
    splitReloadTimer = setTimeout(() => {
      try {
        reloadCatalogFromSplitDisk(splitProductsFile, splitCategoriesFile, 'modular watch:split');
        splitProductsKnownMtime = getMtimeMs(splitProductsFile);
        splitCategoriesKnownMtime = getMtimeMs(splitCategoriesFile);
        syncCatalogSlices();
        console.log('[catalog] reloaded from split files (modular watch)');
      } catch (e) {
        console.warn('[catalog] modular split watch reload failed:', e?.message || e);
      }
    }, 150);
  };

  try {
    if (splitProductsFile) {
      fs.watchFile(splitProductsFile, { interval: 1000 }, (curr, prev) => {
        if (!curr || !prev) return;
        if (curr.mtimeMs === prev.mtimeMs || curr.mtimeMs === splitProductsKnownMtime) return;
        onChange();
      });
    }
    if (splitCategoriesFile) {
      fs.watchFile(splitCategoriesFile, { interval: 1000 }, (curr, prev) => {
        if (!curr || !prev) return;
        if (curr.mtimeMs === prev.mtimeMs || curr.mtimeMs === splitCategoriesKnownMtime) return;
        onChange();
      });
    }
    updateBootState({ catalogAutoRefreshStarted: true });
    return true;
  } catch (e) {
    console.warn('[catalog] failed to start modular split auto-refresh:', e?.message || e);
    updateBootState({ catalogAutoRefreshStarted: false });
    return null;
  }
}

async function registerCatalogAutoRefresh() {
  const paths = getCatalogPaths();
  const { initialiseProductsStore, reloadCatalogFromDisk, reloadCatalogFromSplitDisk, writeSplitCatalogFilesFromLegacy } = getCatalogStartupFns();

  updateBootState();
  if (paths.source !== 'file') {
    updateBootState({ catalogAutoRefreshStarted: false });
    return null;
  }

  try {
    if (typeof initialiseProductsStore === 'function') initialiseProductsStore();
  } catch (e) {
    console.warn('[catalog] modular init failed:', e?.message || e);
  }

  try {
    if (getCatalogFileMode() === 'split_json') {
      try {
        if (typeof writeSplitCatalogFilesFromLegacy === 'function' && paths.splitProductsFile && paths.splitCategoriesFile) {
          if (!fs.existsSync(paths.splitProductsFile) || !fs.existsSync(paths.splitCategoriesFile)) {
            writeSplitCatalogFilesFromLegacy(runtimeCatalog().productsData || {});
          }
        }
      } catch {}
      return startSplitWatcher(paths.splitProductsFile, paths.splitCategoriesFile, reloadCatalogFromSplitDisk);
    }
    return startProductsWatcher(paths.localProductsPath, reloadCatalogFromDisk);
  } finally {
    markCatalogSync();
  }
}

module.exports = { registerCatalogAutoRefresh };
