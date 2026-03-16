'use strict';

const { domain, model, middleware, mergeDomain, requireValue } = require('./runtimeResolver');

function controlPlane() {
  return domain('controlPlane') || {};
}

function syncControlPlaneRuntimeFromGlobals() {
  const runtime = controlPlane();
  const growth = domain('growth') || {};
  const emailMarketing = domain('emailMarketing') || {};
  return mergeDomain('controlPlane', {
    requireAdmin: runtime.requireAdmin || middleware('requireAdmin', null),
    _getFeatureFlagsConfig: runtime._getFeatureFlagsConfig || null,
    _setFeatureFlagsConfig: runtime._setFeatureFlagsConfig || null,
    _saveConfigHistory: runtime._saveConfigHistory || emailMarketing._saveConfigHistory || null,
    FeatureFlagsConfig: runtime.FeatureFlagsConfig || model('FeatureFlagsConfig', null),
    DEFAULT_FEATURE_FLAGS: runtime.DEFAULT_FEATURE_FLAGS || {},
    _resetFeatureFlagsConfig: runtime._resetFeatureFlagsConfig || null,
    ConfigHistory: runtime.ConfigHistory || model('ConfigHistory', null),
    OpsAlert: runtime.OpsAlert || model('OpsAlert', null),
    _getProfitConfigRuntime: runtime._getProfitConfigRuntime || growth.getProfitConfigRuntime || null,
    _getIncentivesConfigRuntime: runtime._getIncentivesConfigRuntime || growth.getIncentivesRuntimeSync || null,
    _getEmailMarketingConfigRuntime: runtime._getEmailMarketingConfigRuntime || emailMarketing._getEmailMarketingConfig || null,
    _setProfitConfig: runtime._setProfitConfig || null,
    _setIncentivesConfig: runtime._setIncentivesConfig || null,
    _setEmailMarketingConfig: runtime._setEmailMarketingConfig || null,
  });
}

function getControlPlaneState() {
  const runtime = controlPlane();
  return {
    requireAdmin: requireValue('CONTROLPLANE_STATE_NOT_READY:requireAdmin', runtime.requireAdmin),
    _getFeatureFlagsConfig: requireValue('CONTROLPLANE_STATE_NOT_READY:_getFeatureFlagsConfig', runtime._getFeatureFlagsConfig),
    _setFeatureFlagsConfig: requireValue('CONTROLPLANE_STATE_NOT_READY:_setFeatureFlagsConfig', runtime._setFeatureFlagsConfig),
    _saveConfigHistory: requireValue('CONTROLPLANE_STATE_NOT_READY:_saveConfigHistory', runtime._saveConfigHistory),
    FeatureFlagsConfig: requireValue('CONTROLPLANE_STATE_NOT_READY:FeatureFlagsConfig', runtime.FeatureFlagsConfig),
    DEFAULT_FEATURE_FLAGS: requireValue('CONTROLPLANE_STATE_NOT_READY:DEFAULT_FEATURE_FLAGS', runtime.DEFAULT_FEATURE_FLAGS),
    _resetFeatureFlagsConfig: requireValue('CONTROLPLANE_STATE_NOT_READY:_resetFeatureFlagsConfig', runtime._resetFeatureFlagsConfig),
    ConfigHistory: requireValue('CONTROLPLANE_STATE_NOT_READY:ConfigHistory', runtime.ConfigHistory),
    OpsAlert: requireValue('CONTROLPLANE_STATE_NOT_READY:OpsAlert', runtime.OpsAlert),
    _getProfitConfigRuntime: requireValue('CONTROLPLANE_STATE_NOT_READY:_getProfitConfigRuntime', runtime._getProfitConfigRuntime),
    _getIncentivesConfigRuntime: requireValue('CONTROLPLANE_STATE_NOT_READY:_getIncentivesConfigRuntime', runtime._getIncentivesConfigRuntime),
    _getEmailMarketingConfigRuntime: requireValue('CONTROLPLANE_STATE_NOT_READY:_getEmailMarketingConfigRuntime', runtime._getEmailMarketingConfigRuntime),
    _setProfitConfig: requireValue('CONTROLPLANE_STATE_NOT_READY:_setProfitConfig', runtime._setProfitConfig),
    _setIncentivesConfig: requireValue('CONTROLPLANE_STATE_NOT_READY:_setIncentivesConfig', runtime._setIncentivesConfig),
    _setEmailMarketingConfig: requireValue('CONTROLPLANE_STATE_NOT_READY:_setEmailMarketingConfig', runtime._setEmailMarketingConfig),
  };
}

module.exports = { syncControlPlaneRuntimeFromGlobals, getControlPlaneState };
