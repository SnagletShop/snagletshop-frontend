'use strict';

const { rebuildCatalogIndexes, getCatalogIndexState, setCatalogIndexState } = require('./catalogIndex');
const { round2 } = require('./money');
const { recoDetRand, recoMakeDiscountToken } = require('./growth');
const { recoMakeTrackingToken, recoMakeListToken, recoParseListToken } = require('./recoTokens');
const { recoBuildRecommendations } = require('./recoBuild');
const { recoResolveConfig } = require('./recommendations');
const { getRecoDefaults, getRecoModels } = require('./recoState');
const { originIsAllowed } = require('./requestSecurity');

function normRecoId(v) {
  if (v == null) return '';
  let s = String(v).trim();
  if (s.startsWith('[object Set]_')) s = s.slice('[object Set]_'.length);
  if (s === '[object Set]') return '';
  if (s.startsWith('[object Array]_')) s = s.slice('[object Array]_'.length);
  if (s === '[object Array]') return '';
  return s;
}


async function handlePublicRecs(req, res) {
  try {
    const { RECO_WIDGET_DEFAULT } = getRecoDefaults();
    const { Product, RecoStats, RecoConfig } = getRecoModels();
    if (!originIsAllowed(req)) return res.status(403).json({ error: 'FORBIDDEN' });

    const widgetId = String(req.query.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const sourceProductId = normRecoId(req.query.sourceProductId || '');
    const device = (String(req.query.device || '').trim().toLowerCase() === 'mobile') ? 'mobile' : 'desktop';
    const offset = Math.max(0, Number(req.query.offset || 0) || 0);
    const limitReq = (req.query.limit != null && String(req.query.limit).trim() !== '') ? Math.max(1, Number(req.query.limit || 0) || 0) : null;
    const listTokenIn = String(req.query.listToken || '').trim();
    let listTok = listTokenIn ? recoParseListToken(listTokenIn, { defaultWidgetId: RECO_WIDGET_DEFAULT }) : null;

    if (!sourceProductId) return res.status(400).json({ error: 'missing sourceProductId' });

    const excludeCsv = String(req.query.exclude || req.query.excludeProductId || '').trim();
    const excludeIds = new Set(excludeCsv ? excludeCsv.split(',').map(normRecoId).filter(Boolean) : []);
    excludeIds.add(normRecoId(sourceProductId));
    if (req.query.currentProductId) excludeIds.add(normRecoId(req.query.currentProductId));

    let orderedIds = [];
    let cfg = null;
    let sourceProduct = await Product.findOne({ productId: sourceProductId }).lean();
    let sourceFromCatalog = null;
    const state = getCatalogIndexState();
    if (!sourceProduct) {
      let idx = state.catalogIndexCache;
      if (!idx) idx = setCatalogIndexState(rebuildCatalogIndexes(state.productsData || {}));
      sourceFromCatalog = idx && idx.productsById ? idx.productsById[sourceProductId] : null;
      if (sourceFromCatalog) {
        const cat = (idx.idToCategory && idx.idToCategory[sourceProductId]) ? String(idx.idToCategory[sourceProductId]) : '';
        sourceProduct = {
          productId: String(sourceProductId),
          name: sourceFromCatalog.name,
          price: sourceFromCatalog.price,
          description: sourceFromCatalog.description,
          images: sourceFromCatalog.images,
          productLink: sourceFromCatalog.productLink,
          expectedPurchasePrice: sourceFromCatalog.expectedPurchasePrice,
          categories: cat ? [cat] : (Array.isArray(sourceFromCatalog.categories) ? sourceFromCatalog.categories : []),
        };
      }
    }
    if (!sourceProduct) return res.status(404).json({ error: 'source product not found', sourceProductId });

    cfg = await recoResolveConfig({ widgetId, sourceProduct, RECO_WIDGET_DEFAULT, RecoConfig });
    if (listTok && (String(listTok.widgetId) !== String(widgetId) || String(listTok.sourceProductId) !== String(sourceProductId))) listTok = null;

    if (listTok && Array.isArray(listTok.itemIds) && listTok.itemIds.length) {
      orderedIds = listTok.itemIds.slice(0, 300);
    } else {
      if (sourceFromCatalog) {
        let idx = getCatalogIndexState().catalogIndexCache;
        if (!idx) idx = setCatalogIndexState(rebuildCatalogIndexes(getCatalogIndexState().productsData || {}));
        const cat = (idx.idToCategory && idx.idToCategory[sourceProductId]) ? String(idx.idToCategory[sourceProductId]) : '';
        const pool = (cat && idx.categoryIdLists && Array.isArray(idx.categoryIdLists[cat])) ? idx.categoryIdLists[cat] : Object.keys(idx.productsById || {});
        orderedIds = (pool || []).map(normRecoId).filter(Boolean).slice(0, 300);
        const ttl = Number(cfg?.ui?.carousel?.tokenTtlMinutes || 60) || 60;
        listTok = recoParseListToken(recoMakeListToken({ widgetId, sourceProductId, itemIds: orderedIds, ttlMinutes: ttl, defaultWidgetId: RECO_WIDGET_DEFAULT }), { defaultWidgetId: RECO_WIDGET_DEFAULT });
      } else {
        const out = await recoBuildRecommendations({ widgetId, sourceProductId });
        if (!out.ok) return res.status(400).json(out);
        cfg = out.config || cfg;
        orderedIds = (out.items || []).map(p => String(p.productId || '').trim()).filter(Boolean).slice(0, 300);
        const ttl = Number(cfg?.ui?.carousel?.tokenTtlMinutes || 60) || 60;
        listTok = recoParseListToken(recoMakeListToken({ widgetId, sourceProductId, itemIds: orderedIds, ttlMinutes: ttl, defaultWidgetId: RECO_WIDGET_DEFAULT }), { defaultWidgetId: RECO_WIDGET_DEFAULT });
      }
    }

    const seen = new Set();
    orderedIds = (orderedIds || []).map(normRecoId).filter(Boolean).filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
    if (listTok) listTok.itemIds = orderedIds.slice(0, 300);

    let bestPerformerIds = [];
    try {
      const bestCount = (cfg && cfg.globalWinnersEnabled ? Number(cfg.globalWinnerSlots || 0) : 0) + Number(cfg && cfg.stableSlots || 0);
      bestPerformerIds = (orderedIds || []).slice(0, Math.max(0, bestCount | 0)).filter(id => !excludeIds.has(normRecoId(id)));
    } catch {}
    orderedIds = orderedIds.filter(id => !excludeIds.has(normRecoId(id)));

    const car = (cfg && cfg.ui && cfg.ui.carousel && typeof cfg.ui.carousel === 'object') ? cfg.ui.carousel : {};
    const visible = device === 'mobile' ? Number(car.mobileVisible || 2) : Number(car.desktopVisible || 3);
    const batchSize = device === 'mobile' ? Number(car.batchSizeMobile || visible) : Number(car.batchSizeDesktop || visible);
    const maxItemsCfg = device === 'mobile' ? (Number(car.maxItemsMobile ?? car.maxItems ?? 0) || 0) : (Number(car.maxItemsDesktop ?? car.maxItems ?? 0) || 0);
    const prefetchThresholdItems = device === 'mobile' ? Number(car.prefetchThresholdMobile || 3) : Number(car.prefetchThresholdDesktop || 6);
    const appendCountDefault = device === 'mobile' ? Number(car.appendCountMobile || visible) : Number(car.appendCountDesktop || batchSize);
    const prefetch = (String(req.query.prefetch || '').trim() === '1');
    const remainingItems = Math.max(0, Number(req.query.remainingItems || 0) || 0);
    let limitBase = (limitReq != null ? limitReq : batchSize);
    if (prefetch && (limitReq == null) && remainingItems <= Math.max(0, prefetchThresholdItems)) limitBase = appendCountDefault;
    const limit = Math.max(1, Math.min(30, limitBase));
    const totalAllowed = Math.min(orderedIds.length, (maxItemsCfg > 0 ? maxItemsCfg : orderedIds.length));
    const idsAllowed = orderedIds.slice(0, totalAllowed);

    const prods = await Product.find({ productId: { $in: idsAllowed } }).select({ productId:1, name:1, price:1, description:1, images:1, productLink:1, expectedPurchasePrice:1 }).lean();
    const byId = new Map((prods || []).map(p => [String(p.productId), p]));
    const idxState = getCatalogIndexState();
    if ((!prods || !prods.length) && idxState.catalogIndexCache && idxState.catalogIndexCache.productsById) {
      for (const pid of (idsAllowed || [])) {
        const pp = idxState.catalogIndexCache.productsById[String(pid)];
        if (!pp || byId.has(String(pid))) continue;
        byId.set(String(pid), {
          productId: String(pid), name: pp.name, price: pp.price, description: pp.description,
          images: pp.images, productLink: pp.productLink, expectedPurchasePrice: pp.expectedPurchasePrice,
        });
      }
    }

    let itemsFull = idsAllowed.map((pid, idx) => {
      const p = byId.get(String(pid));
      if (!p) return null;
      return {
        productId: normRecoId(p.productId),
        name: p.name,
        price: p.price,
        description: p.description,
        image: Array.isArray(p.images) && p.images.length ? p.images[0] : null,
        productLink: p.productLink || '',
        expectedPurchasePrice: (p.expectedPurchasePrice != null ? Number(p.expectedPurchasePrice) : null),
        position: idx + 1,
      };
    }).filter(Boolean);
    if (excludeIds.size) itemsFull = itemsFull.filter(it => !excludeIds.has(normRecoId(it.productId)));

    const discountCfg = (cfg && cfg.discount && typeof cfg.discount === 'object') ? cfg.discount : {};
    const discountEnabled = !!discountCfg.enabled;
    const minClicks = Math.max(0, Number(discountCfg.minImpressions || 0) || 0);
    const minPct = Math.max(0, Number(discountCfg.minPct || 0) || 0);
    const maxPct = Math.max(minPct, Number(discountCfg.maxPct || 0) || 0);
    const maxAtcPerClick = Math.max(0, Math.min(1, Number(discountCfg.maxAtcPerClick || 0.10) || 0.10));
    const minMarginPct = Math.max(0, Math.min(0.99, Number(discountCfg.minMarginPct || 0.20) || 0.20));
    const ttlMinutes = Math.max(1, Math.min(1440, Number(discountCfg.ttlMinutes || 60) || 60));
    const maxItemsPerWidget = Math.max(0, Math.min(20, Number(discountCfg.maxItemsPerWidget || 0) || 0));

    if (discountEnabled && itemsFull.length && maxItemsPerWidget > 0) {
      const stableSlots = Number(cfg?.stableSlots || 0) || 0;
      const globalSlots = Number(cfg?.globalWinnerSlots || 0) || 0;
      const onlyEvolution = (discountCfg.onlyEvolutionSlots !== false);
      const eligible = itemsFull.filter(it => {
        if (onlyEvolution) {
          const evoStart = globalSlots + stableSlots + 1;
          if (Number(it.position || 0) < evoStart) return false;
        }
        return true;
      });
      const ids = eligible.map(x => String(x.productId));
      const stats = await RecoStats.find({ widgetId, sourceProductId, targetProductId: { $in: ids } }).lean();
      const byStatId = new Map((stats || []).map(s => [String(s.targetProductId), s]));
      const scored = eligible.map(it => {
        const st = byStatId.get(String(it.productId)) || {};
        const clicks = Number(st.clicks || 0);
        const atc = Number(st.addToCarts || 0);
        const atcPerClick = atc / Math.max(1, clicks);
        return { it, clicks, atcPerClick };
      }).filter(x => x.clicks >= minClicks && x.atcPerClick <= maxAtcPerClick);
      scored.sort((a,b)=> (a.atcPerClick - b.atcPerClick) || (b.clicks - a.clicks));
      for (const c of scored.slice(0, maxItemsPerWidget)) {
        const frac = (maxAtcPerClick > 0) ? (1 - (c.atcPerClick / maxAtcPerClick)) : 0;
        const pct = Math.min(maxPct, Math.max(minPct, round2(minPct + (maxPct - minPct) * frac)));
        if (!pct || pct <= 0) continue;
        const sell = Number(c.it.price || 0);
        const purchase = Number(c.it.expectedPurchasePrice || 0);
        if (sell > 0 && purchase > 0) {
          const discounted = sell * (1 - pct / 100);
          const marginPct = (discounted - purchase) / Math.max(0.01, discounted);
          if (marginPct < minMarginPct) continue;
        }
        const discountedPrice = round2(sell * (1 - pct / 100));
        if (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice >= sell) continue;
        c.it.discountPct = pct;
        c.it.discountedPrice = discountedPrice;
        c.it.discountToken = recoMakeDiscountToken({ widgetId, sourceProductId, targetProductId: String(c.it.productId), pct, ttlMinutes });
      }
    }

    itemsFull = itemsFull.map(({ expectedPurchasePrice, ...rest }) => rest);
    let slice = itemsFull.slice(offset, offset + limit).map((it, idx) => ({ ...it, position: offset + idx + 1 }));

    if (discountEnabled && slice.length) {
      const strategy = String(discountCfg.strategy || 'bestSellers').toLowerCase();
      const randomChance = Math.max(0, Math.min(1, Number(discountCfg.randomChance || 0) || 0));
      const maxRandomPerBatch = Math.max(0, Math.min(10, Number(discountCfg.maxRandomPerBatch || 0) || 0));
      if ((strategy === 'random' || strategy === 'mixed') && randomChance > 0 && maxRandomPerBatch > 0) {
        const seedBase = String(listTokenIn || recoMakeListToken({ widgetId, sourceProductId, itemIds: idsAllowed, ttlMinutes: Number(car.tokenTtlMinutes || 60) || 60, defaultWidgetId: RECO_WIDGET_DEFAULT })) + '|' + String(offset);
        let applied = 0;
        for (const it of slice) {
          if (applied >= maxRandomPerBatch) break;
          if (it.discountPct) continue;
          const r = recoDetRand(seedBase + '|' + String(it.productId));
          if (r >= randomChance) continue;
          const pct = Math.min(maxPct, Math.max(minPct, round2(minPct + (maxPct - minPct) * r)));
          if (!pct || pct <= 0) continue;
          const sell = Number(it.price || 0);
          const purchase = Number(byId.get(String(it.productId))?.expectedPurchasePrice || 0);
          if (sell > 0 && purchase > 0) {
            const discounted = sell * (1 - pct / 100);
            const marginPct = (discounted - purchase) / Math.max(0.01, discounted);
            if (marginPct < minMarginPct) continue;
          }
          const discountedPrice = round2(sell * (1 - pct / 100));
          if (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice >= sell) continue;
          it.discountPct = pct;
          it.discountedPrice = discountedPrice;
          it.discountToken = recoMakeDiscountToken({ widgetId, sourceProductId, targetProductId: String(it.productId), pct, ttlMinutes });
          applied += 1;
        }
      }
    }

    return res.json({
      ok: true,
      widgetId,
      sourceProductId,
      token: recoMakeTrackingToken({ widgetId, sourceProductId, itemIds: idsAllowed, ts: Date.now(), defaultWidgetId: RECO_WIDGET_DEFAULT }),
      listToken: recoMakeListToken({ widgetId, sourceProductId, itemIds: idsAllowed, ttlMinutes: Number(car.tokenTtlMinutes || 60) || 60, defaultWidgetId: RECO_WIDGET_DEFAULT }),
      bestPerformerIds,
      ui: {
        device,
        visibleCount: Math.max(1, visible),
        batchSize: Math.max(1, (limitReq != null ? limitReq : batchSize)),
        maxBatches: Math.max(1, Number(car.maxBatches || 6) || 6),
        maxItems: Math.max(0, Number(car.maxItems || 0) || 0),
        swipeSmallPx: Math.max(5, Number(car.swipeSmallPx || 35) || 35),
        swipeBigPx: Math.max(20, Number(car.swipeBigPx || 120) || 120),
      },
      config: {
        stableSlots: cfg?.stableSlots,
        evolutionSlots: cfg?.evolutionSlots,
        globalWinnerSlots: cfg?.globalWinnerSlots,
        globalWinnersEnabled: cfg?.globalWinnersEnabled,
      },
      total: itemsFull.length,
      offset,
      limit,
      hasMore: (offset + limit) < itemsFull.length,
      appendCount: Math.max(1, Number(appendCountDefault || 1) || 1),
      items: slice,
    });
  } catch (e) {
    console.error('[recs] fetch error', e);
    return res.status(500).json({ error: 'recs failed' });
  }
}

module.exports = { handlePublicRecs, normRecoId };
