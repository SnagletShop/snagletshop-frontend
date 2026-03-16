'use strict';

const { domain, text, number, mergeDomain } = require('./runtimeResolver');

function startup() {
  return domain('startup') || {};
}

function syncStartupRuntimeFromGlobals() {
  const current = startup();
  mergeDomain('startup', {
    sendAdminEmail: current.sendAdminEmail || null,
    buildDbSnapshotZip: current.buildDbSnapshotZip || null,
    processDispatchControlFile: current.processDispatchControlFile || null,
    dispatchControlIntervalMs: number(current.dispatchControlIntervalMs, number(process.env.DISPATCH_CONTROL_INTERVAL_MS, 10 * 60 * 1000)),
    dispatchControlFile: text(current.dispatchControlFile || process.env.DISPATCH_FILE || '') || null,
    dispatchLogFile: text(current.dispatchLogFile || process.env.DISPATCH_LOG || '') || null,
    projectRoot: text(current.projectRoot || process.env.SNAGLET_PROJECT_ROOT || process.cwd()) || process.cwd(),
  });
  return startup();
}

function getStartupState() {
  const current = startup();
  return {
    sendAdminEmail: current.sendAdminEmail || null,
    buildDbSnapshotZip: current.buildDbSnapshotZip || null,
    processDispatchControlFile: current.processDispatchControlFile || null,
    dispatchControlIntervalMs: number(current.dispatchControlIntervalMs, 10 * 60 * 1000),
    dispatchControlFile: text(current.dispatchControlFile || '') || null,
    dispatchLogFile: text(current.dispatchLogFile || '') || null,
    projectRoot: text(current.projectRoot || process.cwd()) || process.cwd(),
  };
}

module.exports = {
  startup,
  syncStartupRuntimeFromGlobals,
  getStartupState,
};
