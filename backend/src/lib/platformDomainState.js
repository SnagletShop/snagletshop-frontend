'use strict';

const { domain, requireValue, prefer, mergeDomain } = require('./runtimeResolver');

function platform() {
  return domain('platform') || {};
}

function getPlatformDomainState() {
  const runtime = platform();
  return {
    ProductProfitStats: requireValue('PLATFORM_DOMAIN_STATE_NOT_READY:ProductProfitStats', runtime.ProductProfitStats),
    Product: requireValue('PLATFORM_DOMAIN_STATE_NOT_READY:Product', runtime.Product),
    Order: requireValue('PLATFORM_DOMAIN_STATE_NOT_READY:Order', runtime.Order),
    getIncentivesRuntimeSync: requireValue('PLATFORM_DOMAIN_STATE_NOT_READY:getIncentivesRuntimeSync', runtime.getIncentivesRuntimeSync),
    getFeatureFlagsRuntimeSyncBestEffort: requireValue('PLATFORM_DOMAIN_STATE_NOT_READY:getFeatureFlagsRuntimeSyncBestEffort', runtime.getFeatureFlagsRuntimeSyncBestEffort),
    incentivesRuntime: prefer(runtime.incentivesRuntime, null),
    initStripe: prefer(runtime.initStripe, null),
    stripe: prefer(runtime.stripe, null),
  };
}

function syncPlatformDomainRuntimeFromGlobals() {
  const growth = domain('growth') || {};
  const stripeRuntime = domain('stripeRuntime') || {};
  mergeDomain('platform', {
    ProductProfitStats: prefer(platform().ProductProfitStats, growth.ProductProfitStats, null),
    Product: prefer(platform().Product, growth.Product, null),
    Order: prefer(platform().Order, growth.Order, null),
    getIncentivesRuntimeSync: prefer(platform().getIncentivesRuntimeSync, growth.getIncentivesRuntimeSync, null),
    getFeatureFlagsRuntimeSyncBestEffort: prefer(platform().getFeatureFlagsRuntimeSyncBestEffort, growth.getFeatureFlagsRuntimeSyncBestEffort, null),
    incentivesRuntime: prefer(platform().incentivesRuntime, growth.incentivesRuntime, null),
    initStripe: prefer(platform().initStripe, stripeRuntime.initStripe, null),
    stripe: prefer(platform().stripe, stripeRuntime.stripe, null),
  });
  return domain('platform');
}

module.exports = { getPlatformDomainState, syncPlatformDomainRuntimeFromGlobals };
