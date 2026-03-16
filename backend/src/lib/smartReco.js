'use strict';

const { recoSha256, recoDetRand, recoMakeDiscountToken } = require('./growth');


function srMatIdentity(d, scale = 1) {
  const A = new Array(d * d).fill(0);
  for (let i = 0; i < d; i++) A[i * d + i] = Number(scale || 1);
  return A;
}
function srDot(a, b) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += Number(a[i] || 0) * Number(b[i] || 0);
  return s;
}
function srMatVec(A, x, d) {
  const out = new Array(d).fill(0);
  for (let i = 0; i < d; i++) {
    let s = 0;
    for (let j = 0; j < d; j++) s += Number(A[i * d + j] || 0) * Number(x[j] || 0);
    out[i] = s;
  }
  return out;
}
function srOuterAdd(A, x, d, scale = 1) {
  const sc = Number(scale || 1);
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) A[i * d + j] = Number(A[i * d + j] || 0) + sc * Number(x[i] || 0) * Number(x[j] || 0);
  }
  return A;
}
function srInv(A, d) {
  try {
    const M = [];
    for (let r = 0; r < d; r++) {
      const row = [];
      for (let c = 0; c < d; c++) row.push(Number(A[r * d + c] || 0));
      for (let c = 0; c < d; c++) row.push(r === c ? 1 : 0);
      M.push(row);
    }
    for (let i = 0; i < d; i++) {
      let pivot = i;
      for (let r = i + 1; r < d; r++) if (Math.abs(M[r][i]) > Math.abs(M[pivot][i])) pivot = r;
      if (Math.abs(M[pivot][i]) < 1e-12) return null;
      if (pivot !== i) [M[i], M[pivot]] = [M[pivot], M[i]];
      const div = M[i][i];
      for (let c = 0; c < 2 * d; c++) M[i][c] /= div;
      for (let r = 0; r < d; r++) {
        if (r === i) continue;
        const factor = M[r][i];
        if (!factor) continue;
        for (let c = 0; c < 2 * d; c++) M[r][c] -= factor * M[i][c];
      }
    }
    const out = new Array(d * d).fill(0);
    for (let r = 0; r < d; r++) for (let c = 0; c < d; c++) out[r * d + c] = M[r][d + c];
    return out;
  } catch {
    return null;
  }
}

function srMakeToken(payload) {
  const base = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = require('crypto').createHmac('sha256', String(process.env.SMART_RECO_SECRET || process.env.JWT_SECRET || 'smart_reco_secret').trim()).update(base).digest('base64url');
  return `${base}.${sig}`;
}
function srCartSignature(cartNames) {
  const arr = (cartNames || []).map(x => String(x || '').trim()).filter(Boolean).sort();
  return recoSha256(arr.join('|')).slice(0, 24);
}
async function srGetOrCreateModel(placement) {
  const rt = getSmartRecoState();
  const p = String(placement || '').trim() || 'cart_topup_v1';
  let doc = await rt.SmartRecoModel.findOne({ placement: p }).lean();
  if (doc && Array.isArray(doc.A) && Array.isArray(doc.b) && doc.A.length && doc.b.length) return doc;
  const d = 8;
  const A = srMatIdentity(d, 1);
  const b = new Array(d).fill(0);
  doc = await rt.SmartRecoModel.findOneAndUpdate(
    { placement: p },
    { $setOnInsert: { placement: p, d, A, b, alpha: 1.0, updatedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return doc;
}
async function srUpdateModelFromEvent({ placement, tokenHash, itemKey, reward }) {
  const rt = getSmartRecoState();
  if (!placement || !tokenHash || !itemKey) return;
  const imp = await rt.SmartRecoImpression.findOne({ placement, tokenHash }).lean();
  if (!imp || !Array.isArray(imp.items)) return;
  const it = imp.items.find(x => String(x.key) === String(itemKey));
  if (!it || !Array.isArray(it.features) || !it.features.length) return;
  const model = await srGetOrCreateModel(placement);
  const d = Math.max(1, Number(model.d || 8) || 8);
  let A = Array.isArray(model.A) && model.A.length === d * d ? model.A.slice() : srMatIdentity(d, 1);
  let b = Array.isArray(model.b) && model.b.length === d ? model.b.slice() : new Array(d).fill(0);
  const x = it.features.slice(0, d).map(n => Number(n || 0));
  const r = Number(reward || 0);
  srOuterAdd(A, x, d, 1);
  for (let i = 0; i < d; i++) b[i] = Number(b[i] || 0) + r * Number(x[i] || 0);
  await rt.SmartRecoModel.updateOne({ placement }, { $set: { A, b, updatedAt: new Date() } });
}
async function srCooccurrenceCounts(cartNames, lookbackDays = 60, limit = 80) {
  const rt = getSmartRecoState();
  const names = (cartNames || []).map(x => String(x || '').trim()).filter(Boolean);
  if (!names.length) return new Map();
  const since = new Date(Date.now() - Math.max(1, lookbackDays) * 24 * 60 * 60 * 1000);
  const pipeline = [
    { $match: { createdAt: { $gte: since }, 'items.name': { $in: names } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.name', cnt: { $sum: '$items.quantity' } } },
    { $sort: { cnt: -1 } },
    { $limit: Math.max(10, Math.min(500, limit * 5)) }
  ];
  let rows = [];
  try { rows = await rt.Order.aggregate(pipeline); } catch { rows = []; }
  const out = new Map();
  for (const r of rows) {
    const nm = String(r?._id || '').trim();
    if (!nm || names.includes(nm)) continue;
    out.set(nm, Number(r?.cnt || 0));
  }
  return out;
}
function srFeatureVector({ coScore = 0, topup = 0, price = 0, pop = 0, catMatch = 0, marginPct = 0, refundRisk = 0 }) {
  const lp = Math.log1p(Math.max(0, Number(price || 0)));
  const p = Math.log1p(Math.max(0, Number(pop || 0)));
  const m = Math.max(0, Math.min(1, Number(marginPct || 0)));
  const rr = Math.max(0, Math.min(1, Number(refundRisk || 0)));
  return [1, Math.max(0, Math.min(1, Number(coScore || 0))), Math.max(0, Math.min(1, Number(topup || 0))), Math.max(0, Math.min(5, lp)) / 5, Math.max(0, Math.min(5, p)) / 5, Number(catMatch ? 1 : 0), m, 1 - rr];
}
async function srBuildSmartRecommendations({ placement, sessionId, cartNames, desiredEUR, limit = 6, context = null }) {
  const rt = getSmartRecoState();
  const pl = String(placement || '').trim() || 'cart_topup_v1';
  const cartSet = new Set((cartNames || []).map(x => String(x || '').trim()).filter(Boolean));
  const cartArr = Array.from(cartSet);
  const model = await srGetOrCreateModel(pl);
  const d = Math.max(1, Number(model.d || 8) || 8);
  const A = Array.isArray(model.A) && model.A.length === d * d ? model.A.slice() : srMatIdentity(d, 1);
  const b = Array.isArray(model.b) && model.b.length === d ? model.b.slice() : new Array(d).fill(0);
  const alpha = Math.max(0, Number(model.alpha || 1.0) || 1.0);
  const Ainv = srInv(A, d) || srMatIdentity(d, 1);
  const theta = srMatVec(Ainv, b, d);
  const coMap = await srCooccurrenceCounts(cartArr, 60, 120);
  const maxCo = Math.max(1, ...Array.from(coMap.values()).map(n => Number(n || 0)));
  const popDocs = await rt.ProductSalesSummary.find({}).sort({ unitsSold30d: -1 }).limit(500).lean();
  const popByName = new Map((popDocs || []).map(d => [String(d.productId || ''), Number(d.unitsSold30d || 0)]));
  const products = await rt.Product.find({}).select({ productId: 1, name: 1, price: 1, expectedPurchasePrice: 1, images: 1, categories: 1, productLink: 1 }).lean();
  const refundRateByPid = new Map();
  try {
    const pids = products.map(p => String(p.productId || '').trim()).filter(Boolean);
    if (pids.length) {
      const stats = await rt.ProductProfitStats.find({ productId: { $in: pids } }).select({ productId: 1, soldQty: 1, refundedQty: 1 }).lean();
      for (const s of (stats || [])) {
        const sold = Math.max(0, Number(s.soldQty || 0) || 0);
        const ref = Math.max(0, Number(s.refundedQty || 0) || 0);
        const rate = sold > 0 ? Math.max(0, Math.min(1, ref / sold)) : 0;
        refundRateByPid.set(String(s.productId || ''), rate);
      }
    }
  } catch {}
  const cartCats = new Set();
  for (const p of products) if (cartSet.has(String(p.name || '').trim())) (p.categories || []).forEach(c => cartCats.add(String(c || '').trim()));
  const desired = Math.max(0, Number(desiredEUR || 0) || 0);
  const strictMax = !!(context && typeof context === 'object' && context.strictMaxPrice);
  const maxPrice = desired > 0 ? (strictMax ? desired : Math.max(30, desired * 1.35)) : Infinity;
  const optMode = String((context && typeof context === 'object' && context.optimization) ? context.optimization : '').trim();
  const profitTieEUR = Math.max(0, Number((context && typeof context === 'object' && context.profitTieEUR) ? context.profitTieEUR : 0.05) || 0.05);
  const candidates = [];
  for (const p of (products || [])) {
    const name = String(p?.name || '').trim();
    if (!name || cartSet.has(name)) continue;
    const price = Number(p?.price || 0) || 0;
    if (!(price > 0) || price > maxPrice) continue;
    const co = Number(coMap.get(name) || 0);
    const coScore = co / maxCo;
    const topupCloseness = desired > 0 ? (1 - (Math.min(Math.abs(price - desired), desired) / Math.max(1e-6, desired))) : 0;
    let pop = 0;
    const pid = String(p.productId || '');
    if (pid && popByName.has(pid)) pop = popByName.get(pid);
    if (!pop) pop = co;
    let catMatch = 0;
    const cats = Array.isArray(p.categories) ? p.categories.map(x => String(x || '').trim()) : [];
    for (const c of cats) { if (cartCats.has(c)) { catMatch = 1; break; } }
    const cost = Math.max(0, Number(p.expectedPurchasePrice || 0) || 0);
    const marginPct = price > 0 ? Math.max(0, Math.min(1, (price - cost) / price)) : 0;
    const refundRisk = refundRateByPid.get(String(pid || '')) || 0;
    const x = srFeatureVector({ coScore, topup: topupCloseness, price, pop, catMatch, marginPct, refundRisk });
    const mean = srDot(theta, x);
    const tmp = srMatVec(Ainv, x, d);
    const varTerm = Math.max(0, srDot(x, tmp));
    const ucb = mean + alpha * Math.sqrt(varTerm);
    candidates.push({ key: pid || name, name, productId: pid || null, price, image: Array.isArray(p.images) && p.images.length ? p.images[0] : null, productLink: p.productLink || '', score: ucb, profitEUR: (Number.isFinite(cost) ? (price - cost) : 0), popUnits: (Number.isFinite(pop) ? pop : 0), closeness: (desired > 0 ? Math.abs(desired - price) : 0), features: x });
  }
  if (optMode === 'profit_popular') {
    candidates.sort((a, b) => {
      const ca = Number(a?.closeness || 0), cb = Number(b?.closeness || 0);
      if (ca !== cb) return ca - cb;
      const pa = Number(a?.profitEUR || 0), pb = Number(b?.profitEUR || 0);
      const pd = pb - pa;
      if (Math.abs(pd) >= profitTieEUR) return pd;
      const ua = Number(a?.popUnits || 0), ub = Number(b?.popUnits || 0);
      if (ub !== ua) return ub - ua;
      return (Number(b?.score || 0) - Number(a?.score || 0));
    });
  } else {
    candidates.sort((a, b) => (b.score - a.score));
  }
  const chosen = candidates.slice(0, Math.max(1, Math.min(12, Number(limit || 6) || 6)));
  const tokenHash = recoSha256(`${pl}|${sessionId || ''}|${Date.now()}|${Math.random()}`);
  const token = srMakeToken({ placement: pl, tokenHash, ts: Date.now() });
  const cartSig = srCartSignature(cartArr);
  await rt.SmartRecoImpression.create({ placement: pl, tokenHash, sessionId: String(sessionId || '').slice(0, 120), cartSig, desiredEUR: desired, context: context || null, items: chosen.map((it, idx) => ({ key: String(it.key), name: it.name, price: it.price, position: idx + 1, features: it.features })), createdAt: new Date() });
  await rt.SmartRecoEvent.create({ placement: pl, tokenHash, type: 'impression', sessionId: String(sessionId || '').slice(0, 120), itemKey: '', createdAt: new Date() });
  const ffNow = rt.getFeatureFlagsRuntimeSyncBestEffort();
  const discCfg = (ffNow && ffNow.smartReco && typeof ffNow.smartReco === 'object') ? (ffNow.smartReco.discount || {}) : {};
  const enableRecoDiscounts = !!(discCfg && discCfg.enabled) && !!(context && typeof context === 'object' && context.enableRecoDiscounts);
  const minPct = Math.max(0, Number(discCfg.minPct || 0) || 0);
  const maxPct = Math.max(minPct, Number(discCfg.maxPct || 0) || 0);
  const ttlMinutes = Math.max(5, Number(discCfg.ttlMinutes || 120) || 120);
  const minMarginPct = Math.max(0, Math.min(0.95, Number(discCfg.minMarginPct || 0.15) || 0.15));
  const itemsOut = chosen.map((it, idx) => {
    const base = { key: it.key, productId: it.productId, name: it.name, price: it.price, image: it.image, productLink: it.productLink, position: idx + 1 };
    if (!enableRecoDiscounts) return base;
    const pid = String(it.productId || '').trim();
    const sell = Number(it.price || 0) || 0;
    const cost = Math.max(0, sell - (Number(it.profitEUR || 0) || 0));
    if (!pid || !(sell > 0) || !(maxPct > 0)) return base;
    const r = recoDetRand(`${pl}|${sessionId || ''}|${tokenHash}|${pid}`);
    const pct = Math.min(maxPct, Math.max(minPct, Math.round((minPct + (maxPct - minPct) * r) * 100) / 100));
    if (!(pct > 0)) return base;
    const discounted = Math.round((sell * (1 - pct / 100)) * 100) / 100;
    if (!(discounted > 0) || discounted >= sell) return base;
    if (cost > 0) {
      const marginPct = (discounted - cost) / Math.max(0.01, discounted);
      if (marginPct < minMarginPct) return base;
    }
    return { ...base, discountPct: pct, discountedPrice: discounted, discountToken: recoMakeDiscountToken({ widgetId: `smart_${pl}`, sourceProductId: 'cart', targetProductId: pid, pct, ttlMinutes }) };
  });
  return { ok: true, placement: pl, token, items: itemsOut };
}

module.exports = { srBuildSmartRecommendations, srUpdateModelFromEvent };
