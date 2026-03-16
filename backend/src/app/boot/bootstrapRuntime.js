'use strict';

const { patchBootState } = require('./bootState');

function bootstrapRuntime() {
  const { getRuntimeBootstrapSteps } = require('./getRuntimeBootstrapSteps');
  const steps = getRuntimeBootstrapSteps();
  for (const step of steps) {
    step();
  }
  return patchBootState({
    runtimeBootstrapped: true,
    runtimeBootstrappedAt: new Date().toISOString(),
    runtimeBootstrapStepCount: steps.length,
  });
}

module.exports = { bootstrapRuntime };
