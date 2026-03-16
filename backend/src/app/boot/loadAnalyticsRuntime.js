'use strict';

const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');
const { model, middleware, domain } = require('../../lib/runtimeResolver');
const { syncAnalyticsRuntimeFromGlobals } = require('../../lib/analyticsState');

const defaultAnalyticsSettings = Object.freeze({ collectionEnabled: true });
function normalizeAnalyticsSettings(input) {
  const body = (input && typeof input === 'object' && !Array.isArray(input)) ? input : {};
  return { collectionEnabled: body.collectionEnabled !== false };
}
function getMetricsTimezoneDefault() {
  return process.env.METRICS_TIMEZONE || 'UTC';
}
const defaultComputeAbExperimentsForRequest = async () => ({ experiments: {} });
const defaultFeatureFlags = () => ({ analyticsIngest: { enabled: true } });


function buildAnalyticsRuntime() {
  const synced = syncAnalyticsRuntimeFromGlobals() || {};
  const existing = synced || domain('analytics') || {};
  const runtime = getRuntime() || {};
  const growth = runtime.growth || domain('growth') || {};
  const platform = runtime.platform || domain('platform') || {};
  let analyticsSettings = normalizeAnalyticsSettings(existing.analyticsSettings || defaultAnalyticsSettings);
  const getAnalyticsSettings = existing.getAnalyticsSettings || (() => analyticsSettings);
  const setAnalyticsSettings = existing.setAnalyticsSettings || ((next) => { analyticsSettings = normalizeAnalyticsSettings(next); return analyticsSettings; });
  const normalizeSettings = existing.normalizeAnalyticsSettings || normalizeAnalyticsSettings;
  const saveAnalyticsSettings = existing.saveAnalyticsSettings || ((next) => normalizeAnalyticsSettings(next || analyticsSettings));
  return {
    analytics: {
      ...existing,
      authMiddleware: middleware('authMiddleware', existing.authMiddleware),
      analyticsLimiter: middleware('analyticsLimiter', existing.analyticsLimiter),
      Order: model('Order', existing.Order),
      AnalyticsEvent: model('AnalyticsEvent', existing.AnalyticsEvent),
      getAnalyticsSettings,
      setAnalyticsSettings,
      normalizeAnalyticsSettings: normalizeSettings,
      saveAnalyticsSettings,
      getFeatureFlagsRuntimeSyncBestEffort: existing.getFeatureFlagsRuntimeSyncBestEffort || growth.getFeatureFlagsRuntimeSyncBestEffort || platform.getFeatureFlagsRuntimeSyncBestEffort || defaultFeatureFlags,
      computeAbExperimentsForRequest: existing.computeAbExperimentsForRequest || growth.computeAbExperimentsForRequest || defaultComputeAbExperimentsForRequest,
      getMetricsTimezone: existing.getMetricsTimezone || platform.getMetricsTimezone || getMetricsTimezoneDefault,
    },
  };
}

function loadAnalyticsRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildAnalyticsRuntime());
  patchBootState({
    analyticsRuntimeLoaded: true,
    analyticsRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { buildAnalyticsRuntime, loadAnalyticsRuntime };
