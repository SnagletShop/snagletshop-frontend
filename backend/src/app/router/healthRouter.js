'use strict';

const { getBootState } = require('../boot/bootState');

function mountHealthRoutes(app) {
  const readinessHandler = (_req, res) => {
    const boot = getBootState();
    const smtpReady = (!boot.smtpVerifyShopConfigured || !!boot.smtpVerifyShopOk) && (!boot.smtpVerifySupportConfigured || !!boot.smtpVerifySupportOk);
    const mongoReady = !boot.mongoStartupAvailable || !!boot.mongoStartupConnected || Number(boot.mongoStartupReadyState || 0) === 1;
    const ok = !!(boot.appBootstrapped && boot.runtimeBootstrapped && boot.listening && boot.startupJobsCompleted && smtpReady && mongoReady);
    res.status(ok ? 200 : 503).json({
      ok,
      service: 'snagletshop-backend',
      ts: new Date().toISOString(),
      bootMode: boot.bootMode || null,
      legacyLoaded: false,
      legacyBridgeRemoved: true,
      legacyCompatibilityFallbacksPresent: false,
      routeGroupCount: Number(app?.__SNAGLET_ROUTE_GROUP_COUNT__ || boot.routeGroupCount || 0) || 0,
      routeGroups: Array.isArray(app?.__SNAGLET_ROUTE_GROUPS__) ? app.__SNAGLET_ROUTE_GROUPS__ : (boot.routeGroups || []),
      startupJobsCompleted: !!boot.startupJobsCompleted,
      googleRuntimeLoaded: !!boot.googleRuntimeLoaded,
      googleRuntimeDriveConfigured: !!boot.googleRuntimeDriveConfigured,
      googleRuntimeSheetsConfigured: !!boot.googleRuntimeSheetsConfigured,
      googleRuntimeServiceAccountConfigured: !!boot.googleRuntimeServiceAccountConfigured,
      legacyMarketingTransportLoaded: !!boot.legacyMarketingTransportLoaded,
      stripeRuntimeLoaded: !!boot.stripeRuntimeLoaded,
      stripeRuntimePublishableConfigured: !!boot.stripeRuntimePublishableConfigured,
      stripeRuntimeSecretConfigured: !!boot.stripeRuntimeSecretConfigured,
      stripeRuntimeWebhookConfigured: !!boot.stripeRuntimeWebhookConfigured,
      limitersRuntimeLoaded: !!boot.limitersRuntimeLoaded,
      limitersRuntimeNames: Array.isArray(boot.limitersRuntimeNames) ? boot.limitersRuntimeNames.slice() : [],
      smtpVerifyStarted: !!boot.smtpVerifyStarted,
      smtpVerifyAvailable: !!boot.smtpVerifyAvailable,
      smtpVerifyShopConfigured: !!boot.smtpVerifyShopConfigured,
      smtpVerifySupportConfigured: !!boot.smtpVerifySupportConfigured,
      smtpVerifyShopOk: !!boot.smtpVerifyShopOk,
      smtpVerifySupportOk: !!boot.smtpVerifySupportOk,
      emailWorkersStarted: !!boot.emailWorkersStarted,
      emailWorkersAvailable: !!boot.emailWorkersAvailable,
      opsMonitorStarted: !!boot.opsMonitorStarted,
      opsMonitorAvailable: !!boot.opsMonitorAvailable,
      dispatchControlLoopStarted: !!boot.dispatchControlLoopStarted,
      dispatchControlLoopAvailable: !!boot.dispatchControlLoopAvailable,
      dispatchControlIntervalMs: Number(boot.dispatchControlIntervalMs || 0) || 0,
      dispatchControlFile: boot.dispatchControlFile || null,
      dispatchControlLogFile: boot.dispatchControlLogFile || null,
      tariffsAutoRefreshStarted: !!boot.tariffsAutoRefreshStarted,
      tariffsAutoRefreshPath: boot.tariffsAutoRefreshPath || null,
      catalogAutoRefreshStarted: !!boot.catalogAutoRefreshStarted,
      catalogAutoRefreshMode: boot.catalogAutoRefreshMode || null,
      catalogAutoRefreshSource: boot.catalogAutoRefreshSource || null,
      catalogAutoRefreshProductsPath: boot.catalogAutoRefreshProductsPath || null,
      catalogAutoRefreshSplitProductsPath: boot.catalogAutoRefreshSplitProductsPath || null,
      catalogAutoRefreshSplitCategoriesPath: boot.catalogAutoRefreshSplitCategoriesPath || null,
      canonicalReconcileWatcherStarted: !!boot.canonicalReconcileWatcherStarted,
      canonicalReconcileWatcherAvailable: !!boot.canonicalReconcileWatcherAvailable,
      canonicalReconcileWatcherEnabled: !!boot.canonicalReconcileWatcherEnabled,
      canonicalReconcileWatcherPath: boot.canonicalReconcileWatcherPath || null,
      dailyReportSchedulerStarted: !!boot.dailyReportSchedulerStarted,
      dailyReportSchedulerAvailable: !!boot.dailyReportSchedulerAvailable,
      dailyReportCron: boot.dailyReportCron || null,
      runtimeBootstrapStepCount: Number(boot.runtimeBootstrapStepCount || 0) || 0,
      extractedFlagCount: 0,
      extractedFlagKeys: [],
      modularRouteSurfaceReady: !!boot.modularRouteSurfaceReady,
      legacyFootprint: {
        routeGroups: [],
        routeGroupCount: 0,
        startupResponsibilities: [],
        startupResponsibilityCount: 0,
        totalLegacyConcerns: 0,
        legacyBridgeRemoved: true,
      legacyCompatibilityFallbacksPresent: false,
      },
    });
  };
  const livenessHandler = (_req, res) => {
    res.status(200).json({ ok: true, service: 'snagletshop-backend', ts: new Date().toISOString() });
  };
  app.get('/health', readinessHandler);
  app.get('/healthz', livenessHandler);
}

module.exports = { mountHealthRoutes };
