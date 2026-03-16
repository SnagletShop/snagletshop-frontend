'use strict';

const mongoose = require('mongoose');
require('../../models/analyticsEvent');
require('../../models/controlPlane');
require('../../models/emailMarketing');
require('../../models/expense');
require('../../models/growth');
require('../../models/invoiceCounter');
require('../../models/coreCommerce');
require('../../models/recoConfig');
const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { ensureDbIndexes } = require('../db/ensureDbIndexes');

function pickModel(name) {
  return (mongoose.models && mongoose.models[name]) || global[name] || null;
}

function buildDbRuntime() {
  mongoose.set('strictQuery', true);
  return {
    startup: {
      ensureDbIndexes,
    },
    db: {
      mongoose,
      connection: mongoose.connection,
      connect: typeof mongoose.connect === 'function' ? mongoose.connect.bind(mongoose) : null,
      disconnect: typeof mongoose.disconnect === 'function' ? mongoose.disconnect.bind(mongoose) : null,
    },
    models: {
      Order: pickModel('Order'),
      DraftOrder: pickModel('DraftOrder'),
      Product: pickModel('Product'),
      CatalogCategory: pickModel('CatalogCategory'),
      Expense: pickModel('Expense'),
      AnalyticsEvent: pickModel('AnalyticsEvent'),
      RecoConfig: pickModel('RecoConfig'),
      InvoiceCounter: pickModel('InvoiceCounter'),
      IncentivesConfig: pickModel('IncentivesConfig'),
      ProfitConfig: pickModel('ProfitConfig'),
      ProductProfitStats: pickModel('ProductProfitStats'),
      FeatureFlagsConfig: pickModel('FeatureFlagsConfig'),
      ConfigHistory: pickModel('ConfigHistory'),
      OpsAlert: pickModel('OpsAlert'),
      EmailMarketingConfig: pickModel('EmailMarketingConfig'),
      EmailSubscriber: pickModel('EmailSubscriber'),
      EmailJob: pickModel('EmailJob'),
      EmailSendLog: pickModel('EmailSendLog'),
      RecoStats: pickModel('RecoStats'),
      RecoGlobalStats: pickModel('RecoGlobalStats'),
      RecoExclusion: pickModel('RecoExclusion'),
      RecoEvent: pickModel('RecoEvent'),
      RecoDiscountRedemption: pickModel('RecoDiscountRedemption'),
      ProductSalesSummary: pickModel('ProductSalesSummary'),
      RecoAdminAction: pickModel('RecoAdminAction'),
      SmartRecoModel: pickModel('SmartRecoModel'),
      SmartRecoImpression: pickModel('SmartRecoImpression'),
      SmartRecoEvent: pickModel('SmartRecoEvent'),
      ABExperiment: pickModel('ABExperiment'),
    },
  };
}

function loadDbRuntime() {
  const existing = getRuntime() || {};
  return mergeRuntime(existing, buildDbRuntime());
}

module.exports = {
  buildDbRuntime,
  loadDbRuntime,
};
