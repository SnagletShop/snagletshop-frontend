'use strict';

function parseRecoScope(body = {}, defaultWidgetId = 'product_page_recs_v1') {
  const widgetId = String(body.widgetId || '').trim() || String(defaultWidgetId || 'product_page_recs_v1');
  const scope = (String(body.scope || 'global').trim().toLowerCase() === 'product') ? 'product' : 'global';
  const scopeId = scope === 'product' ? String(body.scopeId || '').trim() : null;
  if (scope === 'product' && !scopeId) {
    const err = new Error('scopeId required for product scope');
    err.status = 400;
    throw err;
  }
  return { widgetId, scope, scopeId };
}

function normalizeRecoExclusionPayload(body = {}) {
  const active = (body.isActive != null) ? !!body.isActive : (body.active !== false);
  return {
    sourceProductId: String(body.sourceProductId || '').trim(),
    targetProductId: String(body.targetProductId || body.productId || '').trim(),
    categoryKey: String(body.categoryKey || '').trim(),
    reason: String(body.reason || '').slice(0, 300),
    isActive: active,
    active,
  };
}

function normalizeRecoConfigPayload(body = {}, { recoClamp }) {
  const set = {};
  if (body.enabled != null) set.enabled = !!body.enabled;
  if (body.behavior && typeof body.behavior === 'object') {
    set.behavior = {
      maxTargets: recoClamp(body.behavior.maxTargets ?? 12, 1, 100),
      minScore: recoClamp(body.behavior.minScore ?? 0, -999999, 999999),
      allowManualOnly: !!body.behavior.allowManualOnly,
      fallbackToAuto: body.behavior.fallbackToAuto !== false,
      hideExcluded: body.behavior.hideExcluded !== false,
      minImpressionsForStable: recoClamp(body.behavior.minImpressionsForStable ?? 20, 0, 100000),
    };
  }
  if (body.weights && typeof body.weights === 'object') {
    set.weights = {
      manual: recoClamp(body.weights.manual ?? 1, -100, 100),
      auto: recoClamp(body.weights.auto ?? 1, -100, 100),
      global: recoClamp(body.weights.global ?? 1, -100, 100),
      popularity: recoClamp(body.weights.popularity ?? 0.25, -100, 100),
      ctr: recoClamp(body.weights.ctr ?? 0.2, -100, 100),
      atcRate: recoClamp(body.weights.atcRate ?? 0.35, -100, 100),
      purchaseRate: recoClamp(body.weights.purchaseRate ?? 0.2, -100, 100),
    };
  }
  if (body.candidatePoolRules && typeof body.candidatePoolRules === 'object') {
    set.candidatePoolRules = {
      sameCategoryOnly: body.candidatePoolRules.sameCategoryOnly !== false,
      excludeSelf: body.candidatePoolRules.excludeSelf !== false,
      excludeDisabled: body.candidatePoolRules.excludeDisabled !== false,
      maxPriceDeltaPct: (body.candidatePoolRules.maxPriceDeltaPct != null && Number.isFinite(Number(body.candidatePoolRules.maxPriceDeltaPct))) ? Number(body.candidatePoolRules.maxPriceDeltaPct) : null,
    };
  }
  set.exploration = {
    mode: String(body.exploration?.mode || 'thompson').toLowerCase() === 'epsilon' ? 'epsilon' : 'thompson',
    epsilon: recoClamp(body.exploration?.epsilon ?? 0.2, 0, 1),
    priorImpressions: recoClamp(body.exploration?.priorImpressions ?? 20, 0, 1000),
    priorClicks: recoClamp(body.exploration?.priorClicks ?? 1, 0, 1000),
    priorATC: recoClamp(body.exploration?.priorATC ?? 1, 0, 1000),
  };
  if (body.discount && typeof body.discount === 'object') {
    set.discount = {
      enabled: !!body.discount.enabled,
      strategy: String(body.discount.strategy || 'mixed'),
      minPct: recoClamp(body.discount.minPct ?? 2, 0, 50),
      maxPct: recoClamp(body.discount.maxPct ?? 5, 0, 80),
      randomChance: recoClamp(body.discount.randomChance ?? 0.25, 0, 1),
      maxRandomPerBatch: recoClamp(body.discount.maxRandomPerBatch ?? 1, 0, 50),
      maxItemsPerWidget: recoClamp(body.discount.maxItemsPerWidget ?? 2, 0, 20),
      onlyEvolutionSlots: body.discount.onlyEvolutionSlots !== false,
      minImpressions: recoClamp(body.discount.minImpressions ?? 80, 0, 100000),
      minCtr: recoClamp(body.discount.minCtr ?? 0.03, 0, 1),
      maxAtcPerClick: recoClamp(body.discount.maxAtcPerClick ?? 0.10, 0, 1),
      minMarginPct: recoClamp(body.discount.minMarginPct ?? 0.20, 0, 0.99),
      ttlMinutes: recoClamp(body.discount.ttlMinutes ?? 60, 1, 1440),
    };
  }
  const car = (body.ui && typeof body.ui === 'object' && body.ui.carousel && typeof body.ui.carousel === 'object') ? body.ui.carousel : {};
  set.ui = {
    carousel: {
      desktopVisible: recoClamp(car.desktopVisible ?? 3, 1, 6),
      mobileVisible: recoClamp(car.mobileVisible ?? 2, 1, 4),
      batchSizeDesktop: recoClamp(car.batchSizeDesktop ?? (car.desktopVisible ?? 3), 1, 12),
      batchSizeMobile: recoClamp(car.batchSizeMobile ?? (car.mobileVisible ?? 2), 1, 8),
      maxBatchesDesktop: recoClamp(car.maxBatchesDesktop ?? car.maxBatches ?? 10, 1, 50),
      maxBatchesMobile: recoClamp(car.maxBatchesMobile ?? car.maxBatches ?? 6, 1, 50),
      maxItemsDesktop: recoClamp(car.maxItemsDesktop ?? car.maxItems ?? 0, 0, 300),
      maxItemsMobile: recoClamp(car.maxItemsMobile ?? car.maxItems ?? 0, 0, 300),
      maxBatches: recoClamp(car.maxBatches ?? car.maxBatchesDesktop ?? 10, 1, 50),
      maxItems: recoClamp(car.maxItems ?? car.maxItemsDesktop ?? 0, 0, 300),
      prefetchThresholdDesktop: recoClamp(car.prefetchThresholdDesktop ?? 6, 0, 50),
      prefetchThresholdMobile: recoClamp(car.prefetchThresholdMobile ?? 3, 0, 50),
      appendCountDesktop: recoClamp(car.appendCountDesktop ?? (car.batchSizeDesktop ?? car.desktopVisible ?? 3), 1, 30),
      appendCountMobile: recoClamp(car.appendCountMobile ?? (car.mobileVisible ?? 2), 1, 30),
      swipeSmallPx: recoClamp(car.swipeSmallPx ?? 35, 5, 200),
      swipeBigPx: recoClamp(car.swipeBigPx ?? 120, 20, 400),
      tokenTtlMinutes: recoClamp(car.tokenTtlMinutes ?? 60, 5, 1440),
    },
  };
  return set;
}

module.exports = { parseRecoScope, normalizeRecoConfigPayload, normalizeRecoExclusionPayload };
