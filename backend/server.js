'use strict';

const { bootstrapRuntime } = require('./src/app/boot/bootstrapRuntime');
const { bootstrapApp } = require('./src/app/bootstrapApp');
const { logBootMode } = require('./src/app/boot/logBootMode');
const { patchBootState } = require('./src/app/boot/bootState');
const { isTruthy } = require('./src/app/boot/shouldLoadLegacy');

async function runStartupJobsSafely() {
  try {
    const { runStartupJobs } = require('./src/app/startup/runStartupJobs');
    await runStartupJobs();
    patchBootState({ startupJobsCompleted: true, startupJobsCompletedAt: new Date().toISOString() });
    require('./src/app/boot/refreshRuntimeAfterStartup').refreshRuntimeAfterStartup();
  } catch (err) {
    const rendered = err && err.stack ? err.stack : String(err);
    patchBootState({
      startupJobsCompleted: false,
      startupJobsFailed: true,
      startupJobsFailedAt: new Date().toISOString(),
      startupJobsFailure: rendered,
    });
    console.error('[boot] startup jobs failed:', rendered);
    if (isTruthy(process.env.SNAGLET_STARTUP_JOBS_STRICT)) {
      process.exit(1);
    }
  }
}

async function main() {
  patchBootState({ bootStartedAt: new Date().toISOString() });
  const runtimeState = bootstrapRuntime();

  const { app } = bootstrapApp();

  const { registerMongoConnection } = require('./src/app/startup/registerMongoConnection');
  await registerMongoConnection();

  const PORT = process.env.PORT || 3000;
  logBootMode({ legacyEnabled: false, port: PORT });
  patchBootState({ port: PORT, runtimeBootStateSeen: !!runtimeState });
  await runStartupJobsSafely();
  app.listen(PORT, '0.0.0.0', () => {
    patchBootState({ listening: true, listeningAt: new Date().toISOString() });
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[boot] fatal startup error:', err && err.stack ? err.stack : err);
  process.exit(1);
});
