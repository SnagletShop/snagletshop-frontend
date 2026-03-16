'use strict';

const { getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('../boot/bootState');
const { syncStartupRuntimeFromGlobals, getStartupState } = require('../../lib/startupState');

let dispatchControlLoopStarted = false;
let dispatchControlInterval = null;

function getDispatchLoopState() {
  syncStartupRuntimeFromGlobals();
  const runtime = getRuntime() || {};
  const platform = runtime.platform || {};
  const startup = getStartupState();
  return {
    processDispatchControlFile: startup.processDispatchControlFile,
    intervalMs: Number(startup.dispatchControlIntervalMs || 0) || (10 * 60 * 1000),
    dispatchFile: startup.dispatchControlFile || null,
    dispatchLog: startup.dispatchLogFile || null,
    supportToEmail: platform.SUPPORT_TO_EMAIL || null,
  };
}

async function registerDispatchControlLoop() {
  const state = getDispatchLoopState();
  patchBootState({
    dispatchControlLoopAvailable: typeof state.processDispatchControlFile === 'function',
    dispatchControlLoopStarted,
    dispatchControlIntervalMs: Number(state.intervalMs || 0) || 0,
    dispatchControlFile: state.dispatchFile || null,
    dispatchControlLogFile: state.dispatchLog || null,
  });

  if (dispatchControlLoopStarted) return { started: true, alreadyStarted: true };
  if (typeof state.processDispatchControlFile !== 'function') return { started: false, reason: 'missing-process-dispatch' };

  dispatchControlInterval = setInterval(() => {
    const freshState = getDispatchLoopState();
    Promise.resolve(typeof freshState.processDispatchControlFile === 'function' ? freshState.processDispatchControlFile() : null).catch((e) => {
      console.warn('⚠ dispatch interval error:', e?.message || e);
    });
  }, state.intervalMs);

  dispatchControlLoopStarted = true;
  patchBootState({
    dispatchControlLoopStarted: true,
    dispatchControlLoopStartedAt: new Date().toISOString(),
    dispatchControlIntervalMs: Number(state.intervalMs || 0) || 0,
    dispatchControlFile: state.dispatchFile || null,
    dispatchControlLogFile: state.dispatchLog || null,
  });

  return { started: true, intervalMs: state.intervalMs, interval: dispatchControlInterval };
}

module.exports = { registerDispatchControlLoop };
