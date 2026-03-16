'use strict';

const { domain, model, prefer, text, requireValue, mergeDomain } = require('./runtimeResolver');

function growth() {
  return domain('growth') || {};
}

function req(name) {
  return requireValue(`[RECO_STATE] Missing ${name}`, growth()[name], model(name));
}

function getRecoDefaults() {
  return {
    RECO_WIDGET_DEFAULT: text(prefer(growth().RECO_WIDGET_DEFAULT, 'product_page_recs_v1')) || 'product_page_recs_v1',
  };
}

function getRecoModels() {
  return {
    Product: req('Product'),
    Order: req('Order'),
    RecoStats: req('RecoStats'),
    RecoConfig: req('RecoConfig'),
    RecoExclusion: req('RecoExclusion'),
    RecoGlobalStats: req('RecoGlobalStats'),
  };
}

function getSmartRecoState() {
  return {
    SmartRecoModel: req('SmartRecoModel'),
    SmartRecoImpression: req('SmartRecoImpression'),
    SmartRecoEvent: req('SmartRecoEvent'),
    ProductSalesSummary: req('ProductSalesSummary'),
    ProductProfitStats: req('ProductProfitStats'),
    Product: req('Product'),
    Order: req('Order'),
    getFeatureFlagsRuntimeSyncBestEffort: req('getFeatureFlagsRuntimeSyncBestEffort'),
  };
}

function syncRecoRuntimeFromGlobals() {
  mergeDomain('growth', {
    RECO_WIDGET_DEFAULT: text(prefer(growth().RECO_WIDGET_DEFAULT, 'product_page_recs_v1')) || 'product_page_recs_v1',
    Product: model('Product', growth().Product),
    Order: model('Order', growth().Order),
    RecoStats: model('RecoStats', growth().RecoStats),
    RecoConfig: model('RecoConfig', growth().RecoConfig),
    RecoExclusion: model('RecoExclusion', growth().RecoExclusion),
    RecoGlobalStats: model('RecoGlobalStats', growth().RecoGlobalStats),
    SmartRecoModel: model('SmartRecoModel', growth().SmartRecoModel),
    SmartRecoImpression: model('SmartRecoImpression', growth().SmartRecoImpression),
    SmartRecoEvent: model('SmartRecoEvent', growth().SmartRecoEvent),
    ProductSalesSummary: model('ProductSalesSummary', growth().ProductSalesSummary),
    ProductProfitStats: model('ProductProfitStats', growth().ProductProfitStats),
    getFeatureFlagsRuntimeSyncBestEffort: growth().getFeatureFlagsRuntimeSyncBestEffort || null,
  });
  return domain('growth');
}

module.exports = {
  getRecoDefaults,
  getRecoModels,
  getSmartRecoState,
  syncRecoRuntimeFromGlobals,
};
