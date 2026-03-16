'use strict';

const { getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('../boot/bootState');

let fxLoopHandle = null;

async function registerFxRefreshLoop() {
  if (fxLoopHandle) return fxLoopHandle;

  const runtime = getRuntime() || {};
  const fx = runtime.fx || {};
  const updateExchangeRates = typeof fx.updateExchangeRates === 'function' ? fx.updateExchangeRates : null;
  const refreshMs = Number(fx.refreshMs || 0) || 0;

  if (!updateExchangeRates || refreshMs <= 0) {
    patchBootState({ fxRefreshLoopStarted: false, fxRefreshLoopAvailable: false, fxRefreshLoopRefreshMs: refreshMs || 0 });
    return null;
  }

  try {
    await updateExchangeRates();
  } catch (e) {
    console.warn('⚠️ initial FX refresh failed:', e?.message || e);
  }

  fxLoopHandle = setInterval(() => {
    Promise.resolve(updateExchangeRates()).catch((e) => {
      console.warn('⚠️ periodic FX refresh failed:', e?.message || e);
    });
  }, refreshMs);

  patchBootState({
    fxRefreshLoopStarted: true,
    fxRefreshLoopAvailable: true,
    fxRefreshLoopRefreshMs: refreshMs,
    fxRefreshLoopStartedAt: new Date().toISOString(),
  });

  return fxLoopHandle;
}

module.exports = { registerFxRefreshLoop };
