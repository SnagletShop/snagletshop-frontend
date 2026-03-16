'use strict';

const jwt = require('jsonwebtoken');
const { getRuntime } = require('../app/runtime/runtimeContainer');
const { domain, model, text, number, requireValue, mergeDomain } = require('./runtimeResolver');

function growth() {
  return domain('growth') || {};
}

function runtime() {
  return getRuntime() || {};
}

function req(name) {
  return requireValue(`GROWTH_STATE_MISSING:${name}`, growth()[name]);
}

function getIncentivesRuntimeCache() {
  const runtimeValue = growth();
  return {
    runtime: runtimeValue.incentivesRuntime || null,
    at: number(runtimeValue.incentivesRuntimeAt, 0),
  };
}

function setIncentivesRuntimeCache(runtimeValue) {
  const next = runtimeValue || null;
  const at = Date.now();
  mergeDomain('growth', { incentivesRuntime: next, incentivesRuntimeAt: at });
  return getIncentivesRuntimeCache();
}

function getProfitRuntimeCache() {
  const runtimeValue = growth();
  return {
    cfg: typeof runtimeValue.profitRuntimeCfg === 'undefined' ? null : runtimeValue.profitRuntimeCfg,
    at: number(runtimeValue.profitRuntimeAt, 0),
  };
}

function setProfitRuntimeCache(cfg) {
  const next = cfg || null;
  const at = Date.now();
  mergeDomain('growth', { profitRuntimeCfg: next, profitRuntimeAt: at });
  return getProfitRuntimeCache();
}

function syncGrowthRuntimeFromGlobals() {
  const current = growth();
  const rt = runtime();
  const platform = rt.platform || {};
  const models = rt.models || {};
  mergeDomain('growth', {
    computeAbExperimentsForRequest: current.computeAbExperimentsForRequest || null,
    ABExperiment: current.ABExperiment || models.ABExperiment || model('ABExperiment', null),
    AB_DEFAULTS: current.AB_DEFAULTS || null,
    _abLoadConfigs: current._abLoadConfigs || null,
    _abInvalidateCache: current._abInvalidateCache || null,
    RECO_WIDGET_DEFAULT: text(current.RECO_WIDGET_DEFAULT || platform.RECO_WIDGET_DEFAULT || 'product_page_recs_v1') || 'product_page_recs_v1',
    RecoEvent: current.RecoEvent || models.RecoEvent || model('RecoEvent', null),
    RecoGlobalStats: current.RecoGlobalStats || models.RecoGlobalStats || model('RecoGlobalStats', null),
    RecoStats: current.RecoStats || models.RecoStats || model('RecoStats', null),
    RecoExclusion: current.RecoExclusion || models.RecoExclusion || model('RecoExclusion', null),
    RecoAdminAction: current.RecoAdminAction || models.RecoAdminAction || model('RecoAdminAction', null),
    RecoConfig: current.RecoConfig || models.RecoConfig || model('RecoConfig', null),
    SmartRecoModel: current.SmartRecoModel || models.SmartRecoModel || model('SmartRecoModel', null),
    SmartRecoImpression: current.SmartRecoImpression || models.SmartRecoImpression || model('SmartRecoImpression', null),
    SmartRecoEvent: current.SmartRecoEvent || models.SmartRecoEvent || model('SmartRecoEvent', null),
    refreshIncentivesRuntime: current.refreshIncentivesRuntime || platform.refreshIncentivesRuntime || null,
    IncentivesConfig: current.IncentivesConfig || models.IncentivesConfig || model('IncentivesConfig', null),
    getIncentivesRuntimeSync: current.getIncentivesRuntimeSync || platform.getIncentivesRuntimeSync || null,
    getProfitConfigRuntime: current.getProfitConfigRuntime || null,
    ProfitConfig: current.ProfitConfig || models.ProfitConfig || model('ProfitConfig', null),
    ProductProfitStats: current.ProductProfitStats || platform.ProductProfitStats || models.ProductProfitStats || model('ProductProfitStats', null),
    Product: current.Product || platform.Product || models.Product || model('Product', null),
    Order: current.Order || platform.Order || models.Order || model('Order', null),
    ProductSalesSummary: current.ProductSalesSummary || models.ProductSalesSummary || model('ProductSalesSummary', null),
    jwt: current.jwt || rt.stripeRuntime?.jwt || jwt,
    JWT_SECRET: text(process.env.JWT_SECRET || current.JWT_SECRET || rt.stripeRuntime?.JWT_SECRET || 'change_me') || 'change_me',
    ADMIN_CODE: text(process.env.ADMIN_CODE || current.ADMIN_CODE || rt.security?.ADMIN_CODE || ''),
    ADMIN_USER: text(process.env.ADMIN_USER || current.ADMIN_USER || rt.security?.ADMIN_USER || 'admin') || 'admin',
    ADMIN_PASS: text(process.env.ADMIN_PASS || current.ADMIN_PASS || rt.security?.ADMIN_PASS || 'admin') || 'admin',
    getFeatureFlagsRuntimeSyncBestEffort: current.getFeatureFlagsRuntimeSyncBestEffort || platform.getFeatureFlagsRuntimeSyncBestEffort || null,
    incentivesRuntime: typeof current.incentivesRuntime !== 'undefined' ? current.incentivesRuntime : (typeof platform.incentivesRuntime !== 'undefined' ? platform.incentivesRuntime : null),
    incentivesRuntimeAt: number(current.incentivesRuntimeAt || platform.incentivesRuntimeAt, 0),
    profitRuntimeCfg: typeof current.profitRuntimeCfg !== 'undefined' ? current.profitRuntimeCfg : null,
    profitRuntimeAt: number(current.profitRuntimeAt, 0),
  });
  return domain('growth');
}

function getGrowthState() {
  return {
    computeAbExperimentsForRequest: req('computeAbExperimentsForRequest'),
    ABExperiment: req('ABExperiment'),
    AB_DEFAULTS: req('AB_DEFAULTS'),
    _abLoadConfigs: req('_abLoadConfigs'),
    _abInvalidateCache: req('_abInvalidateCache'),
    RECO_WIDGET_DEFAULT: text(req('RECO_WIDGET_DEFAULT')) || 'product_page_recs_v1',
    RecoEvent: req('RecoEvent'),
    RecoGlobalStats: req('RecoGlobalStats'),
    RecoStats: req('RecoStats'),
    RecoExclusion: req('RecoExclusion'),
    RecoAdminAction: req('RecoAdminAction'),
    RecoConfig: req('RecoConfig'),
    SmartRecoEvent: req('SmartRecoEvent'),
    refreshIncentivesRuntime: req('refreshIncentivesRuntime'),
    IncentivesConfig: req('IncentivesConfig'),
    getIncentivesRuntimeSync: req('getIncentivesRuntimeSync'),
    getProfitConfigRuntime: req('getProfitConfigRuntime'),
    ProfitConfig: req('ProfitConfig'),
    ProductProfitStats: req('ProductProfitStats'),
    Product: req('Product'),
    jwt: req('jwt'),
    JWT_SECRET: req('JWT_SECRET'),
    ADMIN_CODE: req('ADMIN_CODE'),
    ADMIN_USER: req('ADMIN_USER'),
    ADMIN_PASS: req('ADMIN_PASS'),
    getFeatureFlagsRuntimeSyncBestEffort: req('getFeatureFlagsRuntimeSyncBestEffort'),
  };
}

module.exports = { getGrowthState, getIncentivesRuntimeCache, setIncentivesRuntimeCache, getProfitRuntimeCache, setProfitRuntimeCache, syncGrowthRuntimeFromGlobals };
