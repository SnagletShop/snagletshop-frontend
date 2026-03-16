'use strict';

const { domain, prefer, hasValue } = require('./runtimeResolver');
const { mergeRuntime } = require('../app/runtime/runtimeContainer');

function syncFxRuntimeFromGlobals() {
  const runtime = domain('fx') || {};
  const normalized = {
    cachedRates: hasValue(runtime.cachedRates) ? runtime.cachedRates : null,
    lastFetched: Number(prefer(runtime.lastFetched, 0) || 0) || 0,
    fxRefreshPromise: hasValue(runtime.fxRefreshPromise) ? runtime.fxRefreshPromise : null,
    refreshMs: Number(prefer(runtime.refreshMs, 0) || 0) || 0,
    updateExchangeRates: typeof runtime.updateExchangeRates === 'function' ? runtime.updateExchangeRates : null,
  };
  mergeRuntime({ fx: normalized });
  return domain('fx');
}

function getFxState() {
  const runtime = domain('fx');
  return {
    cachedRates: hasValue(runtime?.cachedRates) ? runtime.cachedRates : null,
    lastFetched: Number(prefer(runtime?.lastFetched, 0) || 0) || 0,
    fxRefreshPromise: hasValue(runtime?.fxRefreshPromise) ? runtime.fxRefreshPromise : null,
    refreshMs: Number(prefer(runtime?.refreshMs, 0) || 0) || 0,
    updateExchangeRates: typeof runtime?.updateExchangeRates === 'function' ? runtime.updateExchangeRates : null,
  };
}

function setFxState(patch) {
  if (!patch || typeof patch !== 'object') return;
  const runtimePatch = {};
  if (Object.prototype.hasOwnProperty.call(patch, 'cachedRates')) {
    runtimePatch.cachedRates = patch.cachedRates || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'lastFetched')) {
    runtimePatch.lastFetched = Number(patch.lastFetched || 0) || 0;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'fxRefreshPromise')) {
    runtimePatch.fxRefreshPromise = patch.fxRefreshPromise || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'refreshMs')) {
    runtimePatch.refreshMs = Number(patch.refreshMs || 0) || 0;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'updateExchangeRates')) {
    runtimePatch.updateExchangeRates = typeof patch.updateExchangeRates === 'function' ? patch.updateExchangeRates : null;
  }
  if (Object.keys(runtimePatch).length) mergeRuntime({ fx: runtimePatch });
}

module.exports = { getFxState, setFxState, syncFxRuntimeFromGlobals };
