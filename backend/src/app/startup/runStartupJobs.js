'use strict';

const { registerFxRefreshLoop } = require('./registerFxRefreshLoop');
const { registerTariffsAutoRefresh } = require('./registerTariffsAutoRefresh');
const { registerCatalogBoot } = require('./registerCatalogBoot');
const { registerCatalogAutoRefresh } = require('./registerCatalogAutoRefresh');
const { registerEmailWorkers } = require('./registerEmailWorkers');
const { registerOpsMonitor } = require('./registerOpsMonitor');
const { registerDispatchControlLoop } = require('./registerDispatchControlLoop');
const { registerDriveStartup } = require('./registerDriveStartup');
const { registerSmtpVerify } = require('./registerSmtpVerify');
const { registerCanonicalCatalogReconcile } = require('./registerCanonicalCatalogReconcile');
const { registerDailyReportScheduler } = require('./registerDailyReportScheduler');
const { markExtractedStartupJobsRun } = require('../boot/bootState');

async function runStartupJobs() {
  await registerEmailWorkers();
  await registerOpsMonitor();
  await registerTariffsAutoRefresh();
  await registerFxRefreshLoop();
  await registerCatalogBoot();
  await registerCatalogAutoRefresh();
  await registerDispatchControlLoop();
  await registerDriveStartup();
  await registerSmtpVerify();
  await registerCanonicalCatalogReconcile();
  await registerDailyReportScheduler();
  markExtractedStartupJobsRun(true);
}

module.exports = { runStartupJobs };
