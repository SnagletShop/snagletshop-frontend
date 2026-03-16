'use strict';

function recoResolveConfig({ widgetId, sourceProduct, RECO_WIDGET_DEFAULT, RecoConfig }) {
  return (async () => {
    const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const sourcePid = String(sourceProduct?.productId || '').trim();
    const cat = Array.isArray(sourceProduct?.categories) && sourceProduct.categories.length ? String(sourceProduct.categories[0] || '').trim() : '';

    const productCfg = sourcePid ? await RecoConfig.findOne({ widgetId: wid, scope: 'product', scopeId: sourcePid }).lean() : null;
    if (productCfg) return productCfg;

    const catCfg = cat ? await RecoConfig.findOne({ widgetId: wid, scope: 'category', scopeId: cat }).lean() : null;
    if (catCfg) return catCfg;

    const globalCfg = await RecoConfig.findOne({ widgetId: wid, scope: 'global', scopeId: null }).lean();
    if (globalCfg) return globalCfg;

    return {
      widgetId: wid,
      scope: 'global',
      scopeId: null,
      stableSlots: 2,
      evolutionSlots: 6,
      globalWinnerSlots: 0,
      globalWinnersEnabled: false,
      allowCrossCategoryGlobalWinners: false,
      candidatePoolRules: { sameCategoryOnly: true, allowedCategoryKeys: [], maxPriceDeltaPct: null },
      exploration: { mode: 'thompson', epsilon: 0.2, priorImpressions: 20, priorClicks: 1, priorATC: 1 },
      globalWinnerMinUnitsSold30d: 0,
      globalWinnerMinScore: 0,
      ui: {
        carousel: {
          desktopVisible: 3,
          mobileVisible: 2,
          batchSizeDesktop: 3,
          batchSizeMobile: 2,
          maxBatches: 6,
          maxItems: 24,
          swipeSmallPx: 35,
          swipeBigPx: 120,
          tokenTtlMinutes: 60,
        },
      },
    };
  })();
}

async function recoLoadExclusions({ widgetId, sourceProductId, RECO_WIDGET_DEFAULT, RecoExclusion }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const q = {
    widgetId: wid,
    isActive: true,
    $or: [
      { type: 'global_product_ban' },
      { type: 'category_ban' },
      { type: 'per_source_ban', sourceProductId: String(sourceProductId || '').trim() },
    ],
  };
  const rows = await RecoExclusion.find(q).lean();
  const bannedProductsGlobal = new Set(rows.filter((r) => r.type === 'global_product_ban' && r.productId).map((r) => String(r.productId)));
  const bannedProductsPerSource = new Set(rows.filter((r) => r.type === 'per_source_ban' && r.productId).map((r) => String(r.productId)));
  const bannedCategoryKeys = new Set(rows.filter((r) => r.type === 'category_ban' && r.categoryKey).map((r) => String(r.categoryKey)));
  return { bannedProductsGlobal, bannedProductsPerSource, bannedCategoryKeys, raw: rows };
}

function recoComputeScoreAuto(stats, cfg, { recoClamp }) {
  const priorImp = recoClamp(cfg?.exploration?.priorImpressions ?? 20, 0, 1000);
  const priorClk = recoClamp(cfg?.exploration?.priorClicks ?? 1, 0, 1000);
  const priorAtc = recoClamp(cfg?.exploration?.priorATC ?? 1, 0, 1000);

  const imp = Number(stats?.impressions || 0);
  const clk = Number(stats?.clicks || 0);
  const atc = Number(stats?.addToCarts || 0);

  const ctr = (clk + priorClk) / Math.max(1, imp + priorImp);
  const atcPerImp = (atc + priorAtc) / Math.max(1, imp + priorImp);
  return (0.6 * ctr) + (0.4 * atcPerImp);
}

function recoComputeScoreFinal(scoreAuto, stats) {
  const mm = Number(stats?.manualMultiplier || 0);
  const mb = Number(stats?.manualBoost || 0);
  return (Number(scoreAuto) || 0) * (1 + mm) + mb;
}

async function recoUpsertStatsAndRecompute({ widgetId, sourceProductId, targetProductId, delta, deps }) {
  const { RECO_WIDGET_DEFAULT, RecoStats, Product, recoResolveConfig, recoComputeScoreAuto, recoComputeScoreFinal } = deps;
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const sourcePid = String(sourceProductId || '').trim();
  const targetPid = String(targetProductId || '').trim();
  if (!sourcePid || !targetPid) return null;
  await RecoStats.updateOne(
    { widgetId: wid, sourceProductId: sourcePid, targetProductId: targetPid },
    {
      $inc: {
        impressions: Number(delta?.impressions || 0) || 0,
        clicks: Number(delta?.clicks || 0) || 0,
        addToCarts: Number(delta?.addToCarts || 0) || 0,
        purchases: Number(delta?.purchases || 0) || 0,
      },
      $setOnInsert: { widgetId: wid, sourceProductId: sourcePid, targetProductId: targetPid },
    },
    { upsert: true },
  );
  const doc = await RecoStats.findOne({ widgetId: wid, sourceProductId: sourcePid, targetProductId: targetPid }).lean();
  const sourceProduct = await Product.findOne({ productId: sourcePid }).lean();
  const cfg = sourceProduct ? await recoResolveConfig({ widgetId: wid, sourceProduct }) : null;
  const auto = recoComputeScoreAuto(doc, cfg);
  const finalScore = recoComputeScoreFinal(auto, doc);
  await RecoStats.updateOne({ widgetId: wid, sourceProductId: sourcePid, targetProductId: targetPid }, { $set: { scoreAuto: auto, scoreFinal: finalScore } });
  return { ...doc, scoreAuto: auto, scoreFinal: finalScore };
}

async function recoUpsertGlobalStatsAndRecompute({ widgetId, targetProductId, delta, deps }) {
  const { RECO_WIDGET_DEFAULT, RecoGlobalStats, recoComputeScoreAuto, recoComputeScoreFinal } = deps;
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const targetPid = String(targetProductId || '').trim();
  if (!targetPid) return null;
  await RecoGlobalStats.updateOne(
    { widgetId: wid, targetProductId: targetPid },
    {
      $inc: {
        impressions: Number(delta?.impressions || 0) || 0,
        clicks: Number(delta?.clicks || 0) || 0,
        addToCarts: Number(delta?.addToCarts || 0) || 0,
        purchases: Number(delta?.purchases || 0) || 0,
      },
      $setOnInsert: { widgetId: wid, targetProductId: targetPid },
    },
    { upsert: true },
  );
  const doc = await RecoGlobalStats.findOne({ widgetId: wid, targetProductId: targetPid }).lean();
  const cfg = {
    exploration: { priorImpressions: 20, priorClicks: 1, priorATC: 1 },
  };
  const auto = recoComputeScoreAuto(doc, cfg);
  const finalScore = recoComputeScoreFinal(auto, doc);
  await RecoGlobalStats.updateOne({ widgetId: wid, targetProductId: targetPid }, { $set: { scoreAuto: auto, scoreFinal: finalScore } });
  return { ...doc, scoreAuto: auto, scoreFinal: finalScore };
}

module.exports = {
  recoResolveConfig,
  recoLoadExclusions,
  recoComputeScoreAuto,
  recoComputeScoreFinal,
  recoUpsertStatsAndRecompute,
  recoUpsertGlobalStatsAndRecompute,
};
