'use strict';
const mongoose = require('mongoose');

// ===== Recommendations (product-page widget) =====
// ===== Recommendations (product-page widget) =====
const RecoConfigSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: "product_page_recs_v1" },
  scope: { type: String, required: true, index: true, enum: ["global", "category", "product"], default: "global" },
  scopeId: { type: String, default: null, index: true }, // null | categoryKey | sourceProductId
  stableSlots: { type: Number, default: 2, min: 0, max: 60 },
  evolutionSlots: { type: Number, default: 6, min: 0, max: 120 },
  globalWinnerSlots: { type: Number, default: 0, min: 0, max: 10 },
  globalWinnersEnabled: { type: Boolean, default: false },
  allowCrossCategoryGlobalWinners: { type: Boolean, default: false },
  candidatePoolRules: {
    sameCategoryOnly: { type: Boolean, default: true },
    allowedCategoryKeys: { type: [String], default: [] },
    maxPriceDeltaPct: { type: Number, default: null }
  },
  exploration: {
    mode: { type: String, enum: ["epsilon", "thompson"], default: "thompson" },
    epsilon: { type: Number, default: 0.2, min: 0, max: 1 },
    priorImpressions: { type: Number, default: 20, min: 0, max: 1000 },
    priorClicks: { type: Number, default: 1, min: 0, max: 1000 },
    priorATC: { type: Number, default: 1, min: 0, max: 1000 }
  },
  // discount strategy for recommended products (optional)
  discount: {
    enabled: { type: Boolean, default: false },
    strategy: { type: String, enum: ["random", "bestSellers", "mixed"], default: "mixed" },
    minPct: { type: Number, default: 2, min: 0, max: 50 },
    maxPct: { type: Number, default: 5, min: 0, max: 80 },
    randomChance: { type: Number, default: 0.25, min: 0, max: 1 },
    maxRandomPerBatch: { type: Number, default: 1, min: 0, max: 50 },
    maxItemsPerWidget: { type: Number, default: 2, min: 0, max: 20 },
    onlyEvolutionSlots: { type: Boolean, default: true },
    minImpressions: { type: Number, default: 80, min: 0, max: 100000 },
    minCtr: { type: Number, default: 0.03, min: 0, max: 1 },
    maxAtcPerClick: { type: Number, default: 0.10, min: 0, max: 1 },
    minMarginPct: { type: Number, default: 0.20, min: 0, max: 0.99 },
    ttlMinutes: { type: Number, default: 60, min: 1, max: 1440 }
  },

  // UI hints for frontend carousel behavior (optional)
  ui: {
    carousel: {
      desktopVisible: { type: Number, default: 3, min: 1, max: 6 },
      mobileVisible: { type: Number, default: 2, min: 1, max: 4 },
      batchSizeDesktop: { type: Number, default: 3, min: 1, max: 12 },
      batchSizeMobile: { type: Number, default: 2, min: 1, max: 8 },

      // device-specific caps (preferred)
      maxBatchesDesktop: { type: Number, default: 10, min: 1, max: 50 },
      maxBatchesMobile: { type: Number, default: 6, min: 1, max: 50 },
      maxItemsDesktop: { type: Number, default: 0, min: 0, max: 300 },
      maxItemsMobile: { type: Number, default: 0, min: 0, max: 300 },

      // legacy generic caps (still supported)
      maxBatches: { type: Number, default: 6, min: 1, max: 50 },
      maxItems: { type: Number, default: 24, min: 0, max: 300 },

      // paging behavior hints
      prefetchThresholdDesktop: { type: Number, default: 6, min: 0, max: 50 },
      prefetchThresholdMobile: { type: Number, default: 3, min: 0, max: 50 },
      appendCountDesktop: { type: Number, default: 3, min: 1, max: 30 },
      appendCountMobile: { type: Number, default: 2, min: 1, max: 30 },

      swipeSmallPx: { type: Number, default: 35, min: 5, max: 200 },
      swipeBigPx: { type: Number, default: 120, min: 20, max: 400 },
      tokenTtlMinutes: { type: Number, default: 60, min: 5, max: 1440 }
    }
  },
  globalWinnerMinUnitsSold30d: { type: Number, default: 0, min: 0 },
  globalWinnerMinScore: { type: Number, default: 0, min: 0 },
  updatedBy: { type: String, default: "" }
}, { timestamps: true, minimize: false });


RecoConfigSchema.index({ widgetId: 1, scope: 1, scopeId: 1 }, { unique: true });
const RecoConfig = mongoose.models.RecoConfig || mongoose.model("RecoConfig", RecoConfigSchema);
module.exports = { RecoConfig, RecoConfigSchema };
