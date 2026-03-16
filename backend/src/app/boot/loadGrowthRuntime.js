'use strict';

const jwt = require('jsonwebtoken');
const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');

const defaultComputeAbExperimentsForRequest = async () => ({ experiments: {} });
const defaultAbLoadConfigs = async () => [];
const defaultNoop = () => {};
const defaultAsyncNoop = async () => null;
const defaultFeatureFlags = () => ({});
const { patchBootState } = require('./bootState');
const { domain, model, text, number } = require('../../lib/runtimeResolver');
const { syncGrowthRuntimeFromGlobals } = require('../../lib/growthState');

function buildGrowthRuntime() {
  const synced = syncGrowthRuntimeFromGlobals() || {};
  const existing = synced || domain('growth') || {};
  return {
    growth: {
      ...existing,
      computeAbExperimentsForRequest: existing.computeAbExperimentsForRequest || defaultComputeAbExperimentsForRequest,
      ABExperiment: existing.ABExperiment || model('ABExperiment'),
      AB_DEFAULTS: existing.AB_DEFAULTS || null,
      _abLoadConfigs: existing._abLoadConfigs || defaultAbLoadConfigs,
      _abInvalidateCache: existing._abInvalidateCache || defaultNoop,
      RECO_WIDGET_DEFAULT: text(existing.RECO_WIDGET_DEFAULT || 'product_page_recs_v1', 'product_page_recs_v1') || 'product_page_recs_v1',
      RecoEvent: existing.RecoEvent || model('RecoEvent'),
      RecoGlobalStats: existing.RecoGlobalStats || model('RecoGlobalStats'),
      RecoStats: existing.RecoStats || model('RecoStats'),
      RecoExclusion: existing.RecoExclusion || model('RecoExclusion'),
      RecoAdminAction: existing.RecoAdminAction || model('RecoAdminAction'),
      RecoConfig: existing.RecoConfig || model('RecoConfig'),
      SmartRecoModel: existing.SmartRecoModel || model('SmartRecoModel'),
      SmartRecoImpression: existing.SmartRecoImpression || model('SmartRecoImpression'),
      SmartRecoEvent: existing.SmartRecoEvent || model('SmartRecoEvent'),
      refreshIncentivesRuntime: existing.refreshIncentivesRuntime || defaultAsyncNoop,
      IncentivesConfig: existing.IncentivesConfig || model('IncentivesConfig'),
      getIncentivesRuntimeSync: existing.getIncentivesRuntimeSync || (() => null),
      getProfitConfigRuntime: existing.getProfitConfigRuntime || defaultAsyncNoop,
      ProfitConfig: existing.ProfitConfig || model('ProfitConfig'),
      ProductProfitStats: existing.ProductProfitStats || model('ProductProfitStats'),
      Product: existing.Product || model('Product'),
      Order: existing.Order || model('Order'),
      ProductSalesSummary: existing.ProductSalesSummary || model('ProductSalesSummary'),
      jwt: existing.jwt || jwt,
      JWT_SECRET: text(process.env.JWT_SECRET || existing.JWT_SECRET || 'change_me', 'change_me') || 'change_me',
      ADMIN_CODE: text(process.env.ADMIN_CODE || existing.ADMIN_CODE || ''),
      ADMIN_USER: text(process.env.ADMIN_USER || existing.ADMIN_USER || 'admin', 'admin') || 'admin',
      ADMIN_PASS: text(process.env.ADMIN_PASS || existing.ADMIN_PASS || 'admin', 'admin') || 'admin',
      getFeatureFlagsRuntimeSyncBestEffort: existing.getFeatureFlagsRuntimeSyncBestEffort || defaultFeatureFlags,
      incentivesRuntime: typeof existing.incentivesRuntime !== 'undefined' ? existing.incentivesRuntime : null,
      incentivesRuntimeAt: number(existing.incentivesRuntimeAt || 0, 0),
      profitRuntimeCfg: typeof existing.profitRuntimeCfg !== 'undefined' ? existing.profitRuntimeCfg : null,
      profitRuntimeAt: number(existing.profitRuntimeAt || 0, 0),
    },
  };
}

function loadGrowthRuntime() {
  const merged = mergeRuntime(getRuntime() || {}, buildGrowthRuntime());
  patchBootState({
    growthRuntimeLoaded: true,
    growthRuntimeLoadedAt: new Date().toISOString(),
  });
  return merged;
}

module.exports = { buildGrowthRuntime, loadGrowthRuntime };
