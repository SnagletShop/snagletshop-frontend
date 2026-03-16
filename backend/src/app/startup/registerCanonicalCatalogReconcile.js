'use strict';

const fs = require('fs');
const path = require('path');
const { patchBootState } = require('../boot/bootState');
const { getRuntime } = require('../runtime/runtimeContainer');
const { syncCatalogRuntimeFromGlobals } = require('../../lib/catalogState');
const { syncCatalogBundleRuntimeFromGlobals } = require('../../lib/catalogBundleState');
const { syncCatalogFileModeRuntimeFromGlobals } = require('../../lib/catalogFileModeState');
const { syncCatalogIndexRuntimeFromGlobals } = require('../../lib/catalogIndexState');
const { syncCatalogOpsRuntimeFromGlobals } = require('../../lib/catalogOpsState');
const { syncCatalogReloadRuntimeFromGlobals } = require('../../lib/catalogReloadState');

let started = false;

function getCatalogRuntime() {
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

function registerCanonicalCatalogReconcile() {
  const runtime = getCatalogRuntime();
  const canonicalPath = String(runtime.CANONICAL_PRODUCTS_PATH || '').trim();
  const catalogSource = String(runtime.CATALOG_SOURCE || '').trim();
  const enabledByEnv = String(process.env.ENABLE_CANONICAL_RECONCILE || '').toLowerCase() === 'true';
  const enabled = !!canonicalPath && (catalogSource === 'file' || enabledByEnv);

  patchBootState({
    canonicalReconcileWatcherAvailable: enabled,
    canonicalReconcileWatcherPath: canonicalPath || null,
    canonicalReconcileWatcherEnabled: enabled,
  });

  if (!enabled) return false;
  if (started) {
    patchBootState({ canonicalReconcileWatcherStarted: true, canonicalReconcileWatcherAlreadyStarted: true });
    return true;
  }

  const requireFresh = typeof runtime.requireFresh === 'function' ? runtime.requireFresh : null;
  const mergeCanonicalIntoLocal = typeof runtime.mergeCanonicalIntoLocal === 'function' ? runtime.mergeCanonicalIntoLocal : null;
  const saveProducts = typeof runtime.saveProducts === 'function' ? runtime.saveProducts : null;
  const getProductsData = typeof runtime.getProductsData === 'function' ? runtime.getProductsData : null;
  const localProductsPath = String(runtime.LOCAL_PRODUCTS_PATH || '').trim();

  if (!requireFresh || !mergeCanonicalIntoLocal || !saveProducts) {
    patchBootState({ canonicalReconcileWatcherAvailable: false, canonicalReconcileWatcherMissingDeps: true });
    return false;
  }

  const watcherPath = path.resolve(canonicalPath);
  started = true;
  patchBootState({
    canonicalReconcileWatcherStarted: true,
    canonicalReconcileWatcherAlreadyStarted: false,
    canonicalReconcileWatcherAt: new Date().toISOString(),
    canonicalReconcileWatcherPath: watcherPath,
  });

  try {
    fs.watch(watcherPath, { persistent: false }, (evt) => {
      if (evt !== 'change') return;
      (async () => {
        try {
          const canonical = requireFresh(watcherPath);
          const local = (catalogSource === 'db')
            ? (typeof getProductsData === 'function' ? (getProductsData() || {}) : {})
            : requireFresh(localProductsPath);
          const reconciled = mergeCanonicalIntoLocal(canonical, local);
          await saveProducts(reconciled, 'catalog canonical change');
          syncCatalogSlices();
          patchBootState({ canonicalReconcileWatcherLastSuccessAt: new Date().toISOString() });
          console.log('[catalog] Reconciled catalog after canonical change');
        } catch (e) {
          patchBootState({ canonicalReconcileWatcherLastError: String(e?.message || e), canonicalReconcileWatcherLastErrorAt: new Date().toISOString() });
          console.warn('[catalog] live reconcile failed:', e?.message || e);
        }
      })();
    });
    return true;
  } catch (e) {
    started = false;
    patchBootState({ canonicalReconcileWatcherStarted: false, canonicalReconcileWatcherLastError: String(e?.message || e), canonicalReconcileWatcherLastErrorAt: new Date().toISOString() });
    console.warn('[catalog] failed to start canonical reconcile watcher:', e?.message || e);
    return false;
  }
}

module.exports = { registerCanonicalCatalogReconcile };
