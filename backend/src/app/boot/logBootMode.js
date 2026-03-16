'use strict';

const { getBootEnvSnapshot } = require('./shouldLoadLegacy');
const { getBootState } = require('./bootState');

function logBootMode({ legacyEnabled, port }) {
  const mode = legacyEnabled ? 'legacy-bridge' : 'modular-only';
  const suffix = port ? ` port=${port}` : '';
  const env = getBootEnvSnapshot();
  const boot = getBootState();
  console.log(`[boot] mode=${mode}${suffix} modularOnly=${env.SNAGLET_MODULAR_ONLY || '-'} stripeRuntime=${boot.stripeRuntimeLoaded ? 'on' : 'off'} emailWorkers=${boot.emailWorkersStarted ? 'on' : 'off'} opsMonitor=${boot.opsMonitorStarted ? 'on' : 'off'} dispatchLoop=${boot.dispatchControlLoopStarted ? 'on' : 'off'} tariffsLoop=${boot.tariffsAutoRefreshStarted ? 'on' : 'off'} catalogLoop=${boot.catalogAutoRefreshStarted ? 'on' : 'off'} smtpVerify=${boot.smtpVerifyStarted ? 'on' : 'off'} googleRuntime=${boot.googleRuntimeLoaded ? 'on' : 'off'} canonicalReconcile=${boot.canonicalReconcileWatcherStarted ? 'on' : 'off'} dailyReport=${boot.dailyReportSchedulerStarted ? 'on' : 'off'}`);
  return mode;
}

module.exports = { logBootMode };
