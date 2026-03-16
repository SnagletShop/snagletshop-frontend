'use strict';

const DEFAULT_BOOT_STATE = Object.freeze({
  runtimeBootstrapped: false,
  runtimeBootstrapStepCount: 0,
  appBootstrapped: false,
  startupJobsCompleted: false,
  stripeRuntimeLoaded: false,
  stripeRuntimePublishableConfigured: false,
  stripeRuntimeSecretConfigured: false,
  stripeRuntimeWebhookConfigured: false,
  limitersRuntimeLoaded: false,
  limitersRuntimeLoadedAt: null,
  limitersRuntimeNames: [],
  googleRuntimeLoaded: false,
  googleRuntimeDriveConfigured: false,
  googleRuntimeSheetsConfigured: false,
  googleRuntimeServiceAccountConfigured: false,
  legacyMarketingTransportLoaded: false,
  smtpVerifyStarted: false,
  smtpVerifyAvailable: false,
  smtpVerifyAlreadyStarted: false,
  smtpVerifyShopConfigured: false,
  smtpVerifySupportConfigured: false,
  smtpVerifyShopOk: false,
  smtpVerifySupportOk: false,
  mailRuntimeLoaded: false,
  mailRuntimeLoadedAt: null,
  mailRuntimeShopConfigured: false,
  mailRuntimeSupportConfigured: false,
  smtpVerifyAt: null,
  driveStartupStarted: false,
  driveStartupAvailable: false,
  driveStartupFileIdConfigured: false,
  driveStartupShareEmailConfigured: false,
  emailWorkersStarted: false,
  emailWorkersAvailable: false,
  opsMonitorStarted: false,
  opsMonitorAvailable: false,
  dispatchControlLoopStarted: false,
  dispatchControlLoopAvailable: false,
  dispatchControlIntervalMs: 0,
  dispatchControlFile: null,
  dispatchControlLogFile: null,
  mongoStartupStarted: false,
  mongoStartupAlreadyStarted: false,
  mongoStartupAvailable: false,
  mongoStartupUriConfigured: false,
  mongoStartupConnected: false,
  mongoStartupConnecting: false,
  mongoStartupReadyState: 0,
  mongoStartupAt: null,
  tariffsAutoRefreshStarted: false,
  tariffsAutoRefreshPath: null,
  catalogAutoRefreshStarted: false,
  catalogBootStarted: false,
  catalogBootMode: null,
  catalogBootAvailable: false,
  catalogAutoRefreshMode: null,
  catalogAutoRefreshSource: null,
  catalogAutoRefreshProductsPath: null,
  catalogAutoRefreshSplitProductsPath: null,
  catalogAutoRefreshSplitCategoriesPath: null,
  canonicalReconcileWatcherStarted: false,
  canonicalReconcileWatcherAvailable: false,
  canonicalReconcileWatcherEnabled: false,
  canonicalReconcileWatcherAlreadyStarted: false,
  canonicalReconcileWatcherPath: null,
  canonicalReconcileWatcherAt: null,
  canonicalReconcileWatcherLastSuccessAt: null,
  canonicalReconcileWatcherLastError: null,
  canonicalReconcileWatcherLastErrorAt: null,
  dailyReportSchedulerStarted: false,
  dailyReportSchedulerAvailable: false,
  dailyReportCron: null,
  legacyStandaloneStartupAvailable: false,
  legacyStandaloneStartupStarted: false,
  legacyStandaloneStartupPort: null,
  legacyStandaloneStartupOk: null,
  legacyStandaloneStartupError: null,
  dailyReportSchedulerAt: null,
  dailyReportLastSuccessAt: null,
  dailyReportLastError: null,
  dailyReportLastErrorAt: null,
  fxRefreshLoopStarted: false,
  fxRefreshLoopAvailable: false,
  fxRefreshLoopRefreshMs: 0,
  postLegacyRuntimeSyncApplied: false,
  postLegacyRuntimeSyncAt: null,
  postLegacyRuntimeSyncCount: 0,
  legacyLoaded: false,
  listening: false,
  bootMode: null,
  routeGroups: [],
  extractedFlagCount: 0,
  extractedFlagKeys: [],
  modularRouteSurfaceReady: false,
  appBootstrapStepCount: 0,
  legacyFootprint: null,
  extractedStartupJobsRun: false,
  updatedAt: null,
});

let bootState = { ...DEFAULT_BOOT_STATE };

function ensureBootState() {
  return bootState;
}

function patchBootState(patch) {
  bootState = { ...bootState, ...(patch || {}), updatedAt: new Date().toISOString() };
  return bootState;
}

function getBootState() {
  return { ...bootState };
}

function setBootMode(mode) {
  return patchBootState({ bootMode: mode || null });
}

function getBootMode() {
  return bootState.bootMode || null;
}

function setLegacyLoaded(value) {
  return patchBootState({ legacyLoaded: !!value });
}

function isLegacyLoaded() {
  return !!bootState.legacyLoaded;
}

function markExtractedStartupJobsRun(value = true) {
  return patchBootState({ extractedStartupJobsRun: !!value });
}

function hasExtractedStartupJobsRun() {
  return !!bootState.extractedStartupJobsRun;
}

module.exports = {
  ensureBootState,
  patchBootState,
  getBootState,
  setBootMode,
  getBootMode,
  setLegacyLoaded,
  isLegacyLoaded,
  markExtractedStartupJobsRun,
  hasExtractedStartupJobsRun,
};
