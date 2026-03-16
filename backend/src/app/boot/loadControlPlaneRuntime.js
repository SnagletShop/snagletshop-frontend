'use strict';

const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');
const { domain, model, middleware } = require('../../lib/runtimeResolver');
const { syncControlPlaneRuntimeFromGlobals } = require('../../lib/controlPlaneState');

function buildControlPlaneRuntime() {
  const synced = syncControlPlaneRuntimeFromGlobals() || {};
  const existing = synced || domain('controlPlane') || {};
  return {
    controlPlane: {
      ...existing,
      requireAdmin: middleware('requireAdmin', existing.requireAdmin || null),
      _getFeatureFlagsConfig: existing._getFeatureFlagsConfig || null,
      _setFeatureFlagsConfig: existing._setFeatureFlagsConfig || null,
      _saveConfigHistory: existing._saveConfigHistory || null,
      FeatureFlagsConfig: model('FeatureFlagsConfig'),
      DEFAULT_FEATURE_FLAGS: existing.DEFAULT_FEATURE_FLAGS || null,
      _resetFeatureFlagsConfig: existing._resetFeatureFlagsConfig || null,
      ConfigHistory: model('ConfigHistory'),
      OpsAlert: model('OpsAlert'),
      _getProfitConfigRuntime: existing._getProfitConfigRuntime || null,
      _getIncentivesConfigRuntime: existing._getIncentivesConfigRuntime || null,
      _getEmailMarketingConfigRuntime: existing._getEmailMarketingConfigRuntime || null,
      _setProfitConfig: existing._setProfitConfig || null,
      _setIncentivesConfig: existing._setIncentivesConfig || null,
      _setEmailMarketingConfig: existing._setEmailMarketingConfig || null,
    },
  };
}

function loadControlPlaneRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildControlPlaneRuntime());
  patchBootState({
    controlPlaneRuntimeLoaded: true,
    controlPlaneRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { buildControlPlaneRuntime, loadControlPlaneRuntime };
