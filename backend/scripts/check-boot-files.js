'use strict';

const fs = require('fs');

const required = [
  'src/app/boot/bootstrapRuntime.js',
  'src/app/boot/bootState.js',
  'src/app/bootstrapApp.js',
  'scripts/check-modular-only-boot.js',
  'scripts/check-route-manifest.js',
  'src/app/router/routeManifest.js',
  'src/app/boot/loadLimiterRuntime.js',
  'src/app/startup/registerCatalogBoot.js',
  'src/app/startup/registerCatalogAutoRefresh.js',
  'src/app/startup/registerEmailWorkers.js',
  'src/app/startup/registerOpsMonitor.js',
  'src/app/startup/registerDispatchControlLoop.js',
  'src/app/startup/registerSmtpVerify.js',
  'src/app/startup/registerCanonicalCatalogReconcile.js',
  'src/app/startup/registerDailyReportScheduler.js',
  'scripts/check-no-legacy-artifacts.js',
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing boot helper: ${file}`);
}

console.log('Boot helper files verified.');
