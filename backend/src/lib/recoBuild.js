'use strict';

const { recoResolveConfig, recoLoadExclusions, recoComputeScoreAuto, recoComputeScoreFinal } = require('./recommendations');
const { recoClamp, recoNow } = require('./growth');


function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function recoBetaSample(alpha, beta) {
  function gammaSample(k) {
    const kk = Number(k);
    if (!(kk > 0)) return 0;
    if (kk < 1) {
      const u = Math.random();
      return gammaSample(kk + 1) * Math.pow(u, 1 / kk);
    }
    const d = kk - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x;
      let v;
      do {
        const u1 = Math.random() || 1e-12;
        const u2 = Math.random() || 1e-12;
        x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random() || 1e-12;
      if (u < 1 - 0.0331 * (x ** 4)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  const a = Math.max(1e-9, Number(alpha) || 0);
  const b = Math.max(1e-9, Number(beta) || 0);
  const x = gammaSample(a);
  const y = gammaSample(b);
  const denom = x + y;
  if (!(denom > 0)) return 0.5;
  return x / denom;
}

function recoIsEligibleProduct(p, { sourceCategories, config, exclusions }) {
  if (!p) return false;
  const pid = String(p.productId || '').trim();
  if (!pid) return false;
  if (exclusions?.bannedProductsGlobal?.has(pid)) return false;
  if (exclusions?.bannedProductsPerSource?.has(pid)) return false;

  const cats = Array.isArray(p.categories) ? p.categories.map((x) => String(x || '').trim()).filter(Boolean) : [];
  for (const c of cats) {
    if (exclusions?.bannedCategoryKeys?.has(c)) return false;
  }

  const rules = config?.candidatePoolRules || {};
  const allow = Array.isArray(rules.allowedCategoryKeys) ? rules.allowedCategoryKeys.map(String) : [];
  if (allow.length) return cats.some((c) => allow.includes(c));
  if (rules.sameCategoryOnly) {
    const src = Array.isArray(sourceCategories) ? sourceCategories : [];
    if (!src.length) return true;
    return cats.some((c) => src.includes(c));
  }
  return true;
}

async function recoFetchCandidateProducts(sourceProduct, cfg, exclusions) {
  const { RECO_WIDGET_DEFAULT } = getRecoDefaults();
  const { Product, Order, RecoStats, RecoConfig, RecoExclusion } = getRecoModels();
  const sourcePid = String(sourceProduct.productId || '').trim();
  const sourceCats = Array.isArray(sourceProduct.categories) ? sourceProduct.categories.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const rules = cfg?.candidatePoolRules || {};

  const q = { productId: { $ne: sourcePid } };
  const allow = Array.isArray(rules.allowedCategoryKeys) ? rules.allowedCategoryKeys.map((x) => String(x || '').trim()).filter(Boolean) : [];
  if (allow.length) q.categories = { $in: allow };
  else if (rules.sameCategoryOnly && sourceCats.length) q.categories = { $in: sourceCats };

  const rows = await Product.find(q)
    .select({ productId: 1, name: 1, price: 1, description: 1, images: 1, productLink: 1, categories: 1 })
    .limit(250)
    .lean();

  const eligible = rows.filter((p) => recoIsEligibleProduct(p, { sourceCategories: sourceCats, config: cfg, exclusions }));

  const maxDelta = rules.maxPriceDeltaPct;
  if (Number.isFinite(Number(maxDelta)) && Number(maxDelta) > 0) {
    const sp = Number(sourceProduct.price || 0);
    const limit = sp > 0 ? sp * (Number(maxDelta) / 100) : null;
    if (limit != null) return eligible.filter((p) => Math.abs(Number(p.price || 0) - sp) <= limit);
  }

  return eligible;
}

async function recoComputeSalesMapLast30d(candidates) {
  const { RECO_WIDGET_DEFAULT } = getRecoDefaults();
  const { Product, Order, RecoStats, RecoConfig, RecoExclusion } = getRecoModels();
  const now = recoNow();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const byName = new Map();
  const byCanon = new Map();
  for (const p of candidates) {
    const pid = String(p.productId || '').trim();
    const nm = String(p.name || '').trim().toLowerCase();
    if (nm) byName.set(nm, pid);
    const cl = String(p.canonicalLink || p.productLink || '').trim();
    if (cl) byCanon.set(cl, pid);
  }

  const orders = await Order.find({ paidAt: { $gte: start } }).select({ items: 1 }).lean();
  const sales = new Map();
  for (const o of orders) {
    const items = Array.isArray(o?.items) ? o.items : [];
    for (const it of items) {
      const q = Math.max(1, Number(it?.quantity || 1) || 1);
      const nm = String(it?.name || '').trim().toLowerCase();
      const link = String(it?.productLink || '').trim();
      const pid = (link && byCanon.get(link)) || (nm && byName.get(nm)) || null;
      if (!pid) continue;
      const revenue = q * (Number(it?.unitPriceEUR || 0) || 0);
      const cur = sales.get(pid) || { units: 0, revenue: 0 };
      cur.units += q;
      cur.revenue += revenue;
      sales.set(pid, cur);
    }
  }
  return sales;
}

async function recoBuildRecommendations(opts) {
  const { RECO_WIDGET_DEFAULT } = getRecoDefaults();
  const { Product, Order, RecoStats, RecoConfig, RecoExclusion } = getRecoModels();
  const widgetId = opts && (opts.widgetId ?? opts.wid);
  const sourceProductId = opts && (opts.sourceProductId ?? opts.sourcePid ?? opts.sourceId);

  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const sourcePid = String(sourceProductId || '').trim();
  if (!sourcePid) return { ok: false, error: 'missing sourceProductId' };

  const spidRaw = sourcePid;
  const spidPrefix = String(spidRaw).split('_')[0].trim();
  let sourceProduct = await Product.findOne({ productId: spidRaw }).lean();
  if (!sourceProduct && spidPrefix && spidPrefix !== spidRaw) {
    sourceProduct = await Product.findOne({ productId: spidPrefix }).lean();
  }
  if (!sourceProduct) sourceProduct = await Product.findOne({ name: spidRaw }).lean();
  if (!sourceProduct && spidRaw) {
    const esc = escapeRegExp(spidRaw);
    sourceProduct = await Product.findOne({ name: new RegExp(`^${esc}$`, 'i') }).lean();
  }
  if (!sourceProduct) return { ok: false, error: 'source product not found' };

  const cfg = await recoResolveConfig({ widgetId: wid, sourceProduct, RECO_WIDGET_DEFAULT: RECO_WIDGET_DEFAULT, RecoConfig: RecoConfig });
  const exclusions = await recoLoadExclusions({ widgetId: wid, sourceProductId: sourcePid, RECO_WIDGET_DEFAULT: RECO_WIDGET_DEFAULT, RecoExclusion: RecoExclusion });

  const stableSlots = Math.max(0, Math.min(20, Number(cfg?.stableSlots || 0)));
  const evolutionSlots = Math.max(0, Math.min(40, Number(cfg?.evolutionSlots || 0)));
  const globalSlots = (cfg?.globalWinnersEnabled) ? Math.max(0, Math.min(10, Number(cfg?.globalWinnerSlots || 0))) : 0;
  const totalSlots = stableSlots + evolutionSlots;

  const appendTail = (headList, scoredRows, maxTotal = 200) => {
    const head = Array.isArray(headList) ? headList : [];
    const usedIds = new Set(head.map((p) => String(p?.productId || '')));
    const tail = Array.isArray(scoredRows)
      ? scoredRows.map((x) => x && x.p).filter(Boolean).filter((p) => !usedIds.has(String(p.productId || '')))
      : [];
    const out = [...head, ...tail];
    return out.slice(0, Math.max(totalSlots, Math.min(maxTotal, out.length)));
  };

  const sourceCats = Array.isArray(sourceProduct.categories) ? sourceProduct.categories.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const candidates = await recoFetchCandidateProducts(sourceProduct, cfg, exclusions);
  const salesMap = await recoComputeSalesMapLast30d(candidates);

  const globalWinners = [];
  if (globalSlots > 0) {
    const pool = Array.from(salesMap.entries())
      .map(([pid, s]) => ({ pid, units: s.units, revenue: s.revenue }))
      .filter((x) => x.units >= Number(cfg?.globalWinnerMinUnitsSold30d || 0));
    pool.sort((a, b) => (b.units - a.units) || (b.revenue - a.revenue));

    for (const x of pool) {
      if (globalWinners.length >= globalSlots) break;
      const p = candidates.find((pp) => String(pp.productId) === String(x.pid));
      if (!p) continue;
      if (!cfg.allowCrossCategoryGlobalWinners) {
        if (!recoIsEligibleProduct(p, { sourceCategories: sourceCats, config: cfg, exclusions })) continue;
      }
      globalWinners.push(p);
    }
  }

  const stable = [];
  const stablePool = candidates
    .map((p) => {
      const s = salesMap.get(String(p.productId)) || { units: 0, revenue: 0 };
      return { p, units: s.units, revenue: s.revenue };
    })
    .sort((a, b) => (b.units - a.units) || (b.revenue - a.revenue));

  for (const row of stablePool) {
    if (stable.length >= stableSlots) break;
    if (globalWinners.some((g) => String(g.productId) === String(row.p.productId))) continue;
    stable.push(row.p);
  }

  const used = new Set([...globalWinners, ...stable].map((p) => String(p.productId)));
  const remaining = candidates.filter((p) => !used.has(String(p.productId)));

  const statsRows = await RecoStats.find({ widgetId: wid, sourceProductId: sourcePid, targetProductId: { $in: remaining.map((p) => p.productId) } }).lean();
  const statsByPid = new Map(statsRows.map((r) => [String(r.targetProductId), r]));

  const mode = String(cfg?.exploration?.mode || 'thompson').toLowerCase();
  const eps = recoClamp(cfg?.exploration?.epsilon ?? 0.2, 0, 1);

  const scored = remaining.map((p) => {
    const st = statsByPid.get(String(p.productId)) || { impressions: 0, clicks: 0, addToCarts: 0, manualBoost: 0, manualMultiplier: 0 };
    const auto = recoComputeScoreAuto(st, cfg, { recoClamp });
    const finalScore = recoComputeScoreFinal(auto, st);

    let bandit = finalScore;
    if (mode === 'thompson') {
      const priorClk = recoClamp(cfg?.exploration?.priorClicks ?? 1, 0, 1000);
      const priorAtc = recoClamp(cfg?.exploration?.priorATC ?? 1, 0, 1000);
      const alpha = Number(st.addToCarts || 0) + priorAtc;
      const beta = Math.max(0, Number(st.clicks || 0) - Number(st.addToCarts || 0)) + priorClk;
      bandit = recoBetaSample(alpha, beta) + (0.15 * finalScore);
    }

    return { p, auto, finalScore, bandit };
  });

  if (mode === 'epsilon') {
    scored.sort((a, b) => b.finalScore - a.finalScore);
    const top = scored.slice(0, Math.max(1, Math.floor(scored.length * 0.6)));
    const tail = scored.slice(top.length);

    const picked = [];
    while (picked.length < evolutionSlots && (top.length || tail.length)) {
      if (tail.length && Math.random() < eps) {
        const idx = Math.floor(Math.random() * tail.length);
        picked.push(tail.splice(idx, 1)[0]);
      } else if (top.length) {
        picked.push(top.shift());
      } else {
        picked.push(tail.shift());
      }
    }
    const evolution = picked.map((x) => x.p);
    const head = [...globalWinners, ...stable, ...evolution].slice(0, totalSlots);
    const maxTotal = Number(cfg?.ui?.carousel?.maxItems || 200) || 200;
    const items = appendTail(head, scored, maxTotal);
    return { ok: true, widgetId: wid, config: cfg, sourceProduct, items };
  }

  scored.sort((a, b) => b.bandit - a.bandit);
  const evolution = scored.slice(0, evolutionSlots).map((x) => x.p);
  const head = [...globalWinners, ...stable, ...evolution].slice(0, totalSlots);
  const maxTotal = Number(cfg?.ui?.carousel?.maxItems || 200) || 200;
  const items = appendTail(head, scored, maxTotal);
  return { ok: true, widgetId: wid, config: cfg, sourceProduct, items };
}

module.exports = {
  recoBuildRecommendations,
  recoBetaSample,
  recoIsEligibleProduct,
  recoFetchCandidateProducts,
  recoComputeSalesMapLast30d,
};
