'use strict';

const { getFxState, setFxState } = require('./fxState');

function getFxRuntimeState() {
  const s = getFxState();
  return {
    cachedRates: s.cachedRates,
    lastFetched: s.lastFetched,
    fxRefreshPromise: s.fxRefreshPromise,
    FX_REFRESH_MS: s.refreshMs,
    updateExchangeRates: s.updateExchangeRates,
  };
}

function setFxRuntimeState(patch) {
  setFxState(patch);
}

async function getLiveEurRatesSafe() {
  const { cachedRates, lastFetched, FX_REFRESH_MS, updateExchangeRates } = getFxRuntimeState();
  const now = Date.now();
  const isFresh = cachedRates && (now - lastFetched) < FX_REFRESH_MS;
  if (isFresh) return cachedRates;

  let promise = getFxState().fxRefreshPromise || null;
  if (!promise) {
    if (typeof updateExchangeRates !== 'function') {
      if (cachedRates) return cachedRates;
      throw new Error('Exchange rates not available');
    }
    promise = (async () => {
      await updateExchangeRates();
    })().finally(() => {
      setFxState({ fxRefreshPromise: null });
    });
    setFxState({ fxRefreshPromise: promise });
  }

  try { await promise; } catch (_) { }
  const latest = getFxState().cachedRates;
  if (latest) return latest;
  throw new Error('Exchange rates not available');
}

module.exports = {
  getFxRuntimeState,
  setFxRuntimeState,
  getLiveEurRatesSafe,
};
