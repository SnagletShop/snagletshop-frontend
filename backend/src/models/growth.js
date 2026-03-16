'use strict';
const mongoose = require('mongoose');

const IncentivesConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'global', index: true },
  enabled: { type: Boolean, default: false },
  config: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });
const IncentivesConfig = mongoose.models.IncentivesConfig || mongoose.model('IncentivesConfig', IncentivesConfigSchema);

const ProfitConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true, default: 'global' },
  enabled: { type: Boolean, default: true },
  fees: {
    pct: { type: Number, default: 0.029, min: 0, max: 0.2 },
    fixedEUR: { type: Number, default: 0.30, min: 0, max: 10 }
  },
  avgShippingCostEUR: { type: Number, default: 3.50, min: 0, max: 200 },
  minOrderMarginPct: { type: Number, default: 0.18, min: 0, max: 0.9 },
  minOrderContributionEUR: { type: Number, default: 2.00, min: -1000, max: 10000 },
  refundPenaltyWeight: { type: Number, default: 0.8, min: 0, max: 10 },
  fraud: {
    enabled: { type: Boolean, default: true },
    maxPaymentIntentsPerIPPerHour: { type: Number, default: 20, min: 1, max: 5000 },
    maxFinalizePerIPPerHour: { type: Number, default: 30, min: 1, max: 5000 }
  }
}, { minimize: false });
const ProfitConfig = mongoose.models.ProfitConfig || mongoose.model('ProfitConfig', ProfitConfigSchema);

const ProductProfitStatsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  productId: { type: String, default: '' },
  name: { type: String, default: '' },
  productLink: { type: String, default: '' },
  soldQty: { type: Number, default: 0 },
  soldRevenueEUR: { type: Number, default: 0 },
  soldCostEUR: { type: Number, default: 0 },
  refundedQty: { type: Number, default: 0 },
  refundedRevenueEUR: { type: Number, default: 0 },
  lastSoldAt: { type: Date, default: null },
  lastRefundAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });
const ProductProfitStats = mongoose.models.ProductProfitStats || mongoose.model('ProductProfitStats', ProductProfitStatsSchema);

const RecoStatsSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: 'product_page_recs_v1' },
  sourceProductId: { type: String, required: true, index: true },
  targetProductId: { type: String, required: true, index: true },
  impressions: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
  addToCarts: { type: Number, default: 0, min: 0 },
  purchases: { type: Number, default: 0, min: 0 },
  alpha: { type: Number, default: 1, min: 0 },
  beta: { type: Number, default: 1, min: 0 },
  scoreAuto: { type: Number, default: 0 },
  manualBoost: { type: Number, default: 0 },
  manualMultiplier: { type: Number, default: 0 },
  scoreFinal: { type: Number, default: 0, index: true },
  lastEventAt: { type: Date, default: null, index: true }
}, { timestamps: true, minimize: false });
RecoStatsSchema.index({ widgetId: 1, sourceProductId: 1, targetProductId: 1 }, { unique: true });
RecoStatsSchema.index({ widgetId: 1, sourceProductId: 1, scoreFinal: -1 });
const RecoStats = mongoose.models.RecoStats || mongoose.model('RecoStats', RecoStatsSchema);

const RecoGlobalStatsSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: 'product_page_recs_v1' },
  targetProductId: { type: String, required: true, index: true, unique: true },
  impressions: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
  addToCarts: { type: Number, default: 0, min: 0 },
  purchases: { type: Number, default: 0, min: 0 },
  alpha: { type: Number, default: 1, min: 0 },
  beta: { type: Number, default: 1, min: 0 },
  scoreAuto: { type: Number, default: 0 },
  manualBoost: { type: Number, default: 0 },
  manualMultiplier: { type: Number, default: 0 },
  scoreFinal: { type: Number, default: 0, index: true },
  lastEventAt: { type: Date, default: null, index: true }
}, { timestamps: true, minimize: false });
RecoGlobalStatsSchema.index({ widgetId: 1, scoreFinal: -1 });
const RecoGlobalStats = mongoose.models.RecoGlobalStats || mongoose.model('RecoGlobalStats', RecoGlobalStatsSchema);

const RecoExclusionSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: 'product_page_recs_v1' },
  type: { type: String, required: true, index: true, enum: ['global_product_ban', 'per_source_ban', 'category_ban'] },
  sourceProductId: { type: String, default: null, index: true },
  productId: { type: String, default: null, index: true },
  categoryKey: { type: String, default: null, index: true },
  reason: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },
  updatedBy: { type: String, default: '' }
}, { timestamps: true, minimize: false });
RecoExclusionSchema.index({ widgetId: 1, type: 1, sourceProductId: 1, productId: 1, categoryKey: 1 }, { unique: true, sparse: true });
const RecoExclusion = mongoose.models.RecoExclusion || mongoose.model('RecoExclusion', RecoExclusionSchema);

const RecoEventSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: 'product_page_recs_v1' },
  type: { type: String, required: true, index: true, enum: ['impression', 'click', 'add_to_cart', 'purchase'] },
  sessionId: { type: String, default: '', index: true },
  userId: { type: String, default: '' },
  sourceProductId: { type: String, default: '', index: true },
  targetProductId: { type: String, default: '', index: true },
  position: { type: Number, default: null },
  tokenHash: { type: String, default: '', index: true },
  extra: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });
RecoEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
RecoEventSchema.index({ widgetId: 1, tokenHash: 1, type: 1 }, { unique: true, sparse: true });
const RecoEvent = mongoose.models.RecoEvent || mongoose.model('RecoEvent', RecoEventSchema);

const RecoDiscountRedemptionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  usedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { minimize: false });
RecoDiscountRedemptionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const RecoDiscountRedemption = mongoose.models.RecoDiscountRedemption || mongoose.model('RecoDiscountRedemption', RecoDiscountRedemptionSchema);

const ProductSalesSummarySchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  unitsSold30d: { type: Number, default: 0, min: 0, index: true },
  revenueEUR30d: { type: Number, default: 0, min: 0 },
  purchases30d: { type: Number, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });
ProductSalesSummarySchema.index({ unitsSold30d: -1 });
const ProductSalesSummary = mongoose.models.ProductSalesSummary || mongoose.model('ProductSalesSummary', ProductSalesSummarySchema);

const RecoAdminActionSchema = new mongoose.Schema({
  widgetId: { type: String, default: 'product_page_recs_v1', index: true },
  action: { type: String, required: true, index: true },
  actor: { type: String, default: '' },
  sourceProductId: { type: String, default: null, index: true },
  targetProductId: { type: String, default: null, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });
const RecoAdminAction = mongoose.models.RecoAdminAction || mongoose.model('RecoAdminAction', RecoAdminActionSchema);

const SmartRecoModelSchema = new mongoose.Schema({
  placement: { type: String, required: true, unique: true, index: true },
  d: { type: Number, default: 8 },
  A: { type: [Number], default: [] },
  b: { type: [Number], default: [] },
  alpha: { type: Number, default: 1.0 },
  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });
const SmartRecoModel = mongoose.models.SmartRecoModel || mongoose.model('SmartRecoModel', SmartRecoModelSchema);

const SmartRecoImpressionSchema = new mongoose.Schema({
  placement: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, default: '', index: true },
  cartSig: { type: String, default: '', index: true },
  desiredEUR: { type: Number, default: 0 },
  context: { type: mongoose.Schema.Types.Mixed, default: null },
  items: [{
    key: { type: String, required: true },
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    features: { type: [Number], default: [] }
  }],
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });
SmartRecoImpressionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });
const SmartRecoImpression = mongoose.models.SmartRecoImpression || mongoose.model('SmartRecoImpression', SmartRecoImpressionSchema);

const SmartRecoEventSchema = new mongoose.Schema({
  placement: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['impression', 'click', 'add_to_cart', 'purchase'] },
  sessionId: { type: String, default: '', index: true },
  itemKey: { type: String, default: '', index: true },
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });
SmartRecoEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
const SmartRecoEvent = mongoose.models.SmartRecoEvent || mongoose.model('SmartRecoEvent', SmartRecoEventSchema);

const ABExperimentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  enabled: { type: Boolean, default: false },
  bWeight: { type: Number, default: 0.5 },
  updatedBy: { type: String, default: '' }
}, { timestamps: true });
const ABExperiment = mongoose.models.ABExperiment || mongoose.model('ABExperiment', ABExperimentSchema);

module.exports = {
  IncentivesConfig, IncentivesConfigSchema,
  ProfitConfig, ProfitConfigSchema,
  ProductProfitStats, ProductProfitStatsSchema,
  RecoStats, RecoStatsSchema,
  RecoGlobalStats, RecoGlobalStatsSchema,
  RecoExclusion, RecoExclusionSchema,
  RecoEvent, RecoEventSchema,
  RecoDiscountRedemption, RecoDiscountRedemptionSchema,
  ProductSalesSummary, ProductSalesSummarySchema,
  RecoAdminAction, RecoAdminActionSchema,
  SmartRecoModel, SmartRecoModelSchema,
  SmartRecoImpression, SmartRecoImpressionSchema,
  SmartRecoEvent, SmartRecoEventSchema,
  ABExperiment, ABExperimentSchema,
};
