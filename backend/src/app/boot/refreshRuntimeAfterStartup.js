'use strict';

const { clearRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');
const { getRuntimeBootstrapSteps } = require('./getRuntimeBootstrapSteps');

function refreshRuntimeAfterStartup() {
  clearRuntime();
  const steps = getRuntimeBootstrapSteps();
  for (const step of steps) {
    step();
  }
  const runtime = getRuntime() || {};
  patchBootState({
    runtimeRefreshedAfterStartup: true,
    runtimeRefreshedAfterStartupAt: new Date().toISOString(),
    runtimeRefreshedAfterStartupKeys: Object.keys(runtime || {}).length,
    runtimeRefreshStepCount: steps.length,
    legacyBridgeRemoved: true,
    legacyCompatibilityFallbacksPresent: false,
  });
  return runtime;
}

module.exports = { refreshRuntimeAfterStartup };
