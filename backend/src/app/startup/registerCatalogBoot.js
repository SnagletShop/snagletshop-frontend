'use strict';

const { getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('../boot/bootState');
const { syncCatalogRuntimeFromGlobals } = require('../../lib/catalogState');
const { syncCatalogBundleRuntimeFromGlobals } = require('../../lib/catalogBundleState');
const { syncCatalogFileModeRuntimeFromGlobals } = require('../../lib/catalogFileModeState');
const { syncCatalogIndexRuntimeFromGlobals } = require('../../lib/catalogIndexState');
const { syncCatalogOpsRuntimeFromGlobals } = require('../../lib/catalogOpsState');
const { syncCatalogReloadRuntimeFromGlobals } = require('../../lib/catalogReloadState');

let catalogBootStarted = false;

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

async function registerCatalogBoot() {
  if (catalogBootStarted) {
    patchBootState({ catalogBootStarted: true, catalogBootAvailable: true });
    return true;
  }
  const catalog = runtimeCatalog();
  const bootCatalogLegacy = typeof catalog.bootCatalogLegacy === 'function' ? catalog.bootCatalogLegacy : null;
  const available = typeof bootCatalogLegacy === 'function';
  patchBootState({
    catalogBootAvailable: available,
    catalogBootStarted,
    catalogBootMode: String(catalog.CATALOG_SOURCE || '').trim() || null,
  });
  if (!available) return null;
  catalogBootStarted = true;
  try {
    await bootCatalogLegacy();
    syncCatalogSlices();
    patchBootState({ catalogBootStarted: true, catalogBootAvailable: true });
    return true;
  } catch (e) {
    catalogBootStarted = false;
    patchBootState({ catalogBootStarted: false, catalogBootAvailable: true, catalogBootError: String(e?.message || e) });
    throw e;
  }
}

module.exports = { registerCatalogBoot };
