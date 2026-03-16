'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { model, middleware, requireValue, mergeDomain } = require('./runtimeResolver');

function analytics() {
  return getRuntime()?.analytics || {};
}

function syncAnalyticsRuntimeFromGlobals() {
  const current = analytics();
  const growth = getRuntime()?.growth || {};
  const platform = getRuntime()?.platform || {};
  return mergeDomain('analytics', {
    authMiddleware: current.authMiddleware || middleware('authMiddleware', null),
    analyticsLimiter: current.analyticsLimiter || middleware('analyticsLimiter', null),
    Order: current.Order || model('Order', null),
    AnalyticsEvent: current.AnalyticsEvent || model('AnalyticsEvent', null),
    getAnalyticsSettings: current.getAnalyticsSettings || null,
    setAnalyticsSettings: current.setAnalyticsSettings || null,
    normalizeAnalyticsSettings: current.normalizeAnalyticsSettings || null,
    saveAnalyticsSettings: current.saveAnalyticsSettings || null,
    getFeatureFlagsRuntimeSyncBestEffort: current.getFeatureFlagsRuntimeSyncBestEffort || growth.getFeatureFlagsRuntimeSyncBestEffort || platform.getFeatureFlagsRuntimeSyncBestEffort || null,
    computeAbExperimentsForRequest: current.computeAbExperimentsForRequest || growth.computeAbExperimentsForRequest || null,
    getMetricsTimezone: current.getMetricsTimezone || platform.getMetricsTimezone || null,
  });
}

function getAnalyticsState() {
  const current = analytics();
  return {
    authMiddleware: requireValue('ANALYTICS_STATE_NOT_READY:authMiddleware', current.authMiddleware),
    analyticsLimiter: requireValue('ANALYTICS_STATE_NOT_READY:analyticsLimiter', current.analyticsLimiter),
    Order: requireValue('ANALYTICS_STATE_NOT_READY:Order', current.Order),
    AnalyticsEvent: requireValue('ANALYTICS_STATE_NOT_READY:AnalyticsEvent', current.AnalyticsEvent),
    getAnalyticsSettings: requireValue('ANALYTICS_STATE_NOT_READY:getAnalyticsSettings', current.getAnalyticsSettings),
    setAnalyticsSettings: requireValue('ANALYTICS_STATE_NOT_READY:setAnalyticsSettings', current.setAnalyticsSettings),
    normalizeAnalyticsSettings: requireValue('ANALYTICS_STATE_NOT_READY:normalizeAnalyticsSettings', current.normalizeAnalyticsSettings),
    saveAnalyticsSettings: requireValue('ANALYTICS_STATE_NOT_READY:saveAnalyticsSettings', current.saveAnalyticsSettings),
    getFeatureFlagsRuntimeSyncBestEffort: requireValue('ANALYTICS_STATE_NOT_READY:getFeatureFlagsRuntimeSyncBestEffort', current.getFeatureFlagsRuntimeSyncBestEffort),
    computeAbExperimentsForRequest: requireValue('ANALYTICS_STATE_NOT_READY:computeAbExperimentsForRequest', current.computeAbExperimentsForRequest),
    getMetricsTimezone: requireValue('ANALYTICS_STATE_NOT_READY:getMetricsTimezone', current.getMetricsTimezone),
  };
}

module.exports = { getAnalyticsState, syncAnalyticsRuntimeFromGlobals };
