'use strict';

const { mergeRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');
const { getFxState, setFxState } = require('../../lib/fxState');
const { domain } = require('../../lib/runtimeResolver');

function buildFxRuntime() {
  const existing = domain('fx') || {};
  const platform = domain('platform') || {};
  const current = getFxState();
  const cachedRates = current.cachedRates !== null ? current.cachedRates : (typeof platform.cachedRates !== 'undefined' ? platform.cachedRates : null);
  const lastFetched = Number(current.lastFetched || existing.lastFetched || 0) || 0;
  const fxRefreshPromise = current.fxRefreshPromise || existing.fxRefreshPromise || null;
  const refreshMs = Number(current.refreshMs || existing.refreshMs || 0) || 0;
  return {
    fx: {
      ...existing,
      cachedRates,
      lastFetched,
      fxRefreshPromise,
      refreshMs,
      updateExchangeRates: current.updateExchangeRates || existing.updateExchangeRates || null,
    },
    platform: {
      cachedRates,
    },
  };
}

function loadFxRuntime() {
  const merged = mergeRuntime(buildFxRuntime());
  setFxState({
    cachedRates: merged?.fx?.cachedRates,
    lastFetched: merged?.fx?.lastFetched,
    fxRefreshPromise: merged?.fx?.fxRefreshPromise,
    refreshMs: merged?.fx?.refreshMs,
    updateExchangeRates: merged?.fx?.updateExchangeRates,
  });
  patchBootState({
    fxRuntimeLoaded: true,
    fxRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { buildFxRuntime, loadFxRuntime };
