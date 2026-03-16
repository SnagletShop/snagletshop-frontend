'use strict';

const { getAnalyticsState } = require('../../lib/analyticsState');
const { parseDecimalLoose } = require('../../lib/money');

function requireAnalyticsRuntime() {
  return getAnalyticsState();
}

function parseDateMaybe(v) {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.valueOf()) ? null : d;
}

function metricsBucketExpr(interval, timezone) {
  const unit = ['hour', 'day', 'week', 'month'].includes(String(interval)) ? String(interval) : 'day';
  return {
    $dateToString: {
      date: { $dateTrunc: { date: '$createdAt', unit, timezone } },
      format: (unit === 'hour') ? '%Y-%m-%d %H:00' : (unit === 'month') ? '%Y-%m' : '%Y-%m-%d',
      timezone,
    },
  };
}

async function handleGetMetricsDimensions(req, res) {
  try {
    const runtime = getAnalyticsState();
    const dataset = String(req.query.dataset || 'orders');
    const key = String(req.query.key || '');
    const from = parseDateMaybe(req.query.from);
    const to = parseDateMaybe(req.query.to);

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) match.createdAt.$lte = to;
    }

    let values = [];
    if (dataset === 'orders') {
      if (key === 'status') values = await runtime.Order.distinct('status', match);
      else if (key === 'country') values = await runtime.Order.distinct('customer.countryCode', match);
      else return res.status(400).json({ error: 'Unsupported key' });
    } else if (dataset === 'analytics') {
      if (key === 'type') values = await runtime.AnalyticsEvent.distinct('type', match);
      else if (key === 'path') values = await runtime.AnalyticsEvent.distinct('path', match);
      else if (key === 'websiteOrigin') values = await runtime.AnalyticsEvent.distinct('websiteOrigin', match);
      else if (key === 'sessionId') values = await runtime.AnalyticsEvent.distinct('sessionId', match);
      else if (key === 'productLink') values = await runtime.AnalyticsEvent.distinct('product.productLink', match);
      else return res.status(400).json({ error: 'Unsupported key' });
    } else {
      return res.status(400).json({ error: 'Unsupported dataset' });
    }

    values = (values || []).filter((v) => v != null && String(v).trim() !== '').map((v) => String(v)).sort();
    return res.json({ ok: true, values });
  } catch (e) {
    console.error('[metrics] dimensions error', e);
    return res.status(500).json({ error: 'dimensions failed' });
  }
}

async function handleGetMetricsTimeseries(req, res) {
  try {
    const runtime = getAnalyticsState();
    const dataset = String(req.query.dataset || 'orders');
    const metric = String(req.query.metric || 'orders_count');
    const interval = String(req.query.interval || 'day');
    const groupBy = String(req.query.groupBy || '');
    const topN = Math.max(1, Math.min(25, Number(req.query.topN || 5)));
    const from = parseDateMaybe(req.query.from);
    const to = parseDateMaybe(req.query.to);

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) match.createdAt.$lte = to;
    }

    const bucket = metricsBucketExpr(interval, runtime.getMetricsTimezone());

    let Model;
    if (dataset === 'orders') Model = runtime.Order;
    else if (dataset === 'analytics') Model = runtime.AnalyticsEvent;
    else return res.status(400).json({ error: 'Unsupported dataset' });

    if (dataset === 'orders') {
      const paidOnly = String(req.query.paidOnly || '').toLowerCase() === 'true';
      const status = String(req.query.status || '').trim();
      const country = String(req.query.country || '').trim();
      const minPaidEUR = Number(req.query.minPaidEUR || 0);
      if (paidOnly) {
        match.$or = [
          { paidAt: { $ne: null } },
          { status: { $in: ['PAID', 'PLACED_WITH_AGENT', 'REFUNDED'] } },
        ];
      }
      if (status) match.status = status;
      if (country) match['customer.countryCode'] = country;
      if (Number.isFinite(minPaidEUR) && minPaidEUR > 0) match['pricing.totalPaidEUR'] = { $gte: minPaidEUR };
    } else {
      const type = String(req.query.type || '').trim();
      const pathQ = String(req.query.path || '').trim();
      const websiteOrigin = String(req.query.websiteOrigin || '').trim();
      const sessionId = String(req.query.sessionId || '').trim();
      const productLink = String(req.query.productLink || '').trim();
      if (type) match.type = type;
      if (pathQ) match.path = pathQ;
      if (websiteOrigin) match.websiteOrigin = websiteOrigin;
      if (sessionId) match.sessionId = sessionId;
      if (productLink) match['product.productLink'] = productLink;
    }

    let groupKeyExpr = 'all';
    if (dataset === 'orders') {
      if (groupBy === 'status') groupKeyExpr = '$status';
      else if (groupBy === 'country') groupKeyExpr = '$customer.countryCode';
    } else {
      if (groupBy === 'type') groupKeyExpr = '$type';
      else if (groupBy === 'path') groupKeyExpr = '$path';
      else if (groupBy === 'websiteOrigin') groupKeyExpr = '$websiteOrigin';
      else if (groupBy === 'productLink') groupKeyExpr = '$product.productLink';
    }

    const needsUnwindItems = (dataset === 'orders') && (metric === 'items_qty' || metric === 'profit_eur');
    const pipeline = [{ $match: match }];
    if (needsUnwindItems) pipeline.push({ $unwind: '$items' });

    const addFields = { bucket, groupKey: (groupKeyExpr === 'all') ? 'all' : groupKeyExpr };

    if (dataset === 'orders') {
      if (metric === 'orders_count') addFields.value = 1;
      else if (metric === 'revenue_eur') addFields.value = { $ifNull: ['$pricing.totalPaidEUR', 0] };
      else if (metric === 'base_revenue_eur') addFields.value = { $ifNull: ['$pricing.baseTotalEUR', 0] };
      else if (metric === 'tariff_eur') addFields.value = {
        $multiply: [{ $ifNull: ['$pricing.baseTotalEUR', 0] }, { $ifNull: ['$pricing.tariffPct', 0] }],
      };
      else if (metric === 'items_qty') addFields.value = { $ifNull: ['$items.quantity', 0] };
      else if (metric === 'profit_eur') addFields.value = {
        $multiply: [
          { $subtract: [{ $ifNull: ['$items.unitPriceEUR', 0] }, { $ifNull: ['$items.expectedPurchase', 0] }] },
          { $ifNull: ['$items.quantity', 0] },
        ],
      };
      else return res.status(400).json({ error: 'Unsupported metric' });
    } else {
      if (metric === 'events_count') addFields.value = 1;
      else if (metric !== 'unique_sessions') return res.status(400).json({ error: 'Unsupported metric' });
    }

    pipeline.push({ $addFields: addFields });

    if (dataset === 'analytics' && metric === 'unique_sessions') {
      pipeline.push({
        $group: {
          _id: { bucket: '$bucket', groupKey: '$groupKey' },
          sessions: { $addToSet: '$sessionId' },
        },
      });
      pipeline.push({
        $project: {
          _id: 1,
          value: { $size: { $setDifference: ['$sessions', [null, '']] } },
        },
      });
    } else {
      pipeline.push({
        $group: {
          _id: { bucket: '$bucket', groupKey: '$groupKey' },
          value: { $sum: '$value' },
        },
      });
    }

    pipeline.push({ $sort: { '_id.bucket': 1 } });
    const rows = await Model.aggregate(pipeline).allowDiskUse(true);

    const byKey = new Map();
    for (const r of rows || []) {
      const gk = String(r?._id?.groupKey ?? 'all');
      const bucketStr = String(r?._id?.bucket ?? '');
      const valueNum = Number(r?.value || 0);
      if (!byKey.has(gk)) byKey.set(gk, []);
      byKey.get(gk).push({ bucket: bucketStr, value: valueNum });
    }

    let keys = Array.from(byKey.keys());
    if (groupBy) {
      keys.sort((a, b) => {
        const sa = (byKey.get(a) || []).reduce((s, p) => s + Number(p.value || 0), 0);
        const sb = (byKey.get(b) || []).reduce((s, p) => s + Number(p.value || 0), 0);
        return sb - sa;
      });
      keys = keys.slice(0, topN);
    }

    const series = keys.map((k) => ({
      key: k,
      label: (k === 'all') ? 'All' : k,
      points: byKey.get(k) || [],
    }));

    return res.json({ ok: true, series });
  } catch (e) {
    console.error('[metrics] timeseries error', e);
    return res.status(500).json({ error: 'timeseries failed' });
  }
}

function _bucketKey(d, bucket) {
  const dt = new Date(d);
  if (bucket === 'month') return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
  if (bucket === 'week') {
    const tmp = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

async function _loadEngagementWindow(runtime, from, to) {
  const q = { createdAt: {} };
  if (from) q.createdAt.$gte = new Date(from);
  if (to) q.createdAt.$lte = new Date(to);
  q.type = { $in: ['product_click', 'product_open', 'product_time', 'add_to_cart'] };
  const rows = await runtime.AnalyticsEvent.find(q).sort({ createdAt: 1 }).lean();
  return rows || [];
}

function _deriveEngagement(runtime, rows) {
  const settings = runtime.getAnalyticsSettings();
  const minMs = Number(settings.minEngagedMs || 0);
  const maxMs = Number(settings.maxEngagedMs || 0);
  const timeByView = new Map();
  for (const ev of rows) {
    if (ev.type !== 'product_time') continue;
    const vt = ev?.extra?.viewToken;
    if (!vt) continue;
    const dur = Number(ev?.extra?.durationMs ?? 0);
    if (!Number.isFinite(dur) || dur <= 0) continue;
    let faulty = false;
    let reason = '';
    if (minMs > 0 && dur < minMs) { faulty = true; reason = 'too_short'; }
    if (maxMs > 0 && dur > maxMs) { faulty = true; reason = 'too_long'; }
    timeByView.set(String(vt), { durationMs: dur, faulty, reason });
  }
  const engagedViews = new Set();
  const faultyViews = new Set();
  for (const [vt, info] of timeByView.entries()) {
    if (info.faulty) faultyViews.add(vt);
    else engagedViews.add(vt);
  }
  const clickToEngaged = new Map();
  for (const ev of rows) {
    if (ev.type !== 'product_open') continue;
    const vt = String(ev?.extra?.viewToken || '');
    const ct = String(ev?.extra?.clickToken || '');
    if (!ct || !vt) continue;
    clickToEngaged.set(ct, engagedViews.has(vt));
  }
  return { timeByView, engagedViews, faultyViews, clickToEngaged };
}

function _eventDerivedQuality(runtime, ev, derived) {
  const settings = runtime.getAnalyticsSettings();
  const vt = String(ev?.extra?.viewToken || '');
  const ct = String(ev?.extra?.clickToken || '');
  if (vt && derived.timeByView.has(vt)) {
    const info = derived.timeByView.get(vt);
    return { isFaulty: !!info.faulty, faultyReason: info.faulty ? info.reason : '', durationMs: info.durationMs || 0 };
  }
  if (ev.type === 'product_click' && settings.linkClicksToEngagement && ct) {
    if (derived.clickToEngaged.has(ct)) {
      const ok = !!derived.clickToEngaged.get(ct);
      return { isFaulty: !ok, faultyReason: ok ? '' : 'unengaged_click', durationMs: 0 };
    }
  }
  return { isFaulty: true, faultyReason: 'no_duration', durationMs: 0 };
}

async function handleGetAnalyticsSettings(_req, res) {
  try {
    const runtime = getAnalyticsState();
    return res.json({ ok: true, settings: runtime.getAnalyticsSettings() });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handlePostAnalyticsSettings(req, res) {
  try {
    const runtime = getAnalyticsState();
    const next = runtime.normalizeAnalyticsSettings(req.body || {});
    runtime.setAnalyticsSettings(next);
    runtime.saveAnalyticsSettings(next);
    return res.json({ ok: true, settings: runtime.getAnalyticsSettings() });
  } catch (e) {
    console.error('[analytics] settings save error', e);
    return res.status(500).json({ error: 'settings save failed' });
  }
}

async function handleGetAnalyticsEvents(req, res) {
  try {
    const runtime = getAnalyticsState();
    const { from, to, limit = 200, skip = 0 } = req.query;
    const q = {};
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }
    for (const k of ['type', 'path', 'websiteOrigin', 'sessionId']) {
      if (req.query[k]) q[k] = String(req.query[k]).trim();
    }
    if (req.query.productLink) q['product.productLink'] = String(req.query.productLink).trim();
    const lim = Math.max(1, Math.min(5000, Number(limit)));
    const sk = Math.max(0, Number(skip) || 0);
    const rows = await runtime.AnalyticsEvent.find(q).sort({ createdAt: -1 }).skip(sk).limit(lim).lean();
    return res.json({ ok: true, events: rows });
  } catch (e) {
    console.error('[analytics] list error', e);
    return res.status(500).json({ error: 'list failed' });
  }
}

async function handleGetAnalyticsEngagementSummary(req, res) {
  try {
    const runtime = getAnalyticsState();
    const { from, to } = req.query;
    const bucket = String(req.query.bucket || 'day').toLowerCase();
    const includeFaulty = String(req.query.includeFaulty || '0') === '1';
    const rows = await _loadEngagementWindow(runtime, from, to);
    const derived = _deriveEngagement(runtime, rows);
    const byBucket = new Map();
    function ensure(k) {
      if (!byBucket.has(k)) byBucket.set(k, { views: 0, clicks: 0, addToCart: 0, avgTimeSum: 0, avgTimeN: 0, faultyViews: 0 });
      return byBucket.get(k);
    }
    for (const ev of rows) {
      const k = _bucketKey(ev.createdAt || ev.ts || Date.now(), bucket);
      const agg = ensure(k);
      const q = _eventDerivedQuality(runtime, ev, derived);
      const countable = includeFaulty ? true : !q.isFaulty;
      if (ev.type === 'product_open') {
        if (countable) agg.views += 1;
        else agg.faultyViews += 1;
      } else if (ev.type === 'product_click') {
        if (countable) agg.clicks += 1;
      } else if (ev.type === 'add_to_cart') {
        if (countable) agg.addToCart += 1;
      } else if (ev.type === 'product_time') {
        if (!q.isFaulty && q.durationMs > 0) {
          agg.avgTimeSum += q.durationMs;
          agg.avgTimeN += 1;
        } else if (includeFaulty && q.durationMs > 0) {
          agg.avgTimeSum += q.durationMs;
          agg.avgTimeN += 1;
        }
      }
    }
    const keys = Array.from(byBucket.keys()).sort();
    const series = keys.map((k) => {
      const a = byBucket.get(k);
      const avgTimeMs = a.avgTimeN ? Math.round(a.avgTimeSum / a.avgTimeN) : 0;
      return { bucket: k, views: a.views, clicks: a.clicks, addToCart: a.addToCart, avgTimeMs, faultyViews: a.faultyViews };
    });
    const totals = series.reduce((acc, p) => {
      acc.views += p.views; acc.clicks += p.clicks; acc.addToCart += p.addToCart; acc.faultyViews += p.faultyViews; return acc;
    }, { views: 0, clicks: 0, addToCart: 0, faultyViews: 0 });
    return res.json({ ok: true, settings: runtime.getAnalyticsSettings(), totals, series });
  } catch (e) {
    console.error('[analytics] engagement summary error', e);
    return res.status(500).json({ error: 'engagement summary failed' });
  }
}

async function handleGetAnalyticsEngagementTopProducts(req, res) {
  try {
    const runtime = getAnalyticsState();
    const { from, to } = req.query;
    const metric = String(req.query.metric || 'views').toLowerCase();
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 30)));
    const includeFaulty = String(req.query.includeFaulty || '0') === '1';
    const rows = await _loadEngagementWindow(runtime, from, to);
    const derived = _deriveEngagement(runtime, rows);
    const byPid = new Map();
    function keyFor(ev) {
      const p = ev.product || {};
      return String(p.productLink || p.name || ev?.extra?.productId || '').trim() || 'unknown';
    }
    function ensure(k, ev) {
      if (!byPid.has(k)) byPid.set(k, { key: k, name: ev?.product?.name || '', productLink: ev?.product?.productLink || '', views: 0, clicks: 0, addToCart: 0, avgTimeSum: 0, avgTimeN: 0, faultyViews: 0 });
      return byPid.get(k);
    }
    for (const ev of rows) {
      const k = keyFor(ev);
      const s = ensure(k, ev);
      const q = _eventDerivedQuality(runtime, ev, derived);
      const countable = includeFaulty ? true : !q.isFaulty;
      if (ev.type === 'product_open') {
        if (countable) s.views += 1; else s.faultyViews += 1;
      } else if (ev.type === 'product_click') {
        if (countable) s.clicks += 1;
      } else if (ev.type === 'add_to_cart') {
        if (countable) s.addToCart += 1;
      } else if (ev.type === 'product_time') {
        if ((!q.isFaulty || includeFaulty) && q.durationMs > 0) { s.avgTimeSum += q.durationMs; s.avgTimeN += 1; }
      }
    }
    const rowsOut = Array.from(byPid.values()).map((r) => ({ ...r, avgTimeMs: r.avgTimeN ? Math.round(r.avgTimeSum / r.avgTimeN) : 0 }));
    const sortKey = (metric === 'clicks') ? 'clicks' : ((metric === 'addtocart' || metric === 'add_to_cart') ? 'addToCart' : ((metric === 'time') ? 'avgTimeMs' : 'views'));
    rowsOut.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
    return res.json({ ok: true, settings: runtime.getAnalyticsSettings(), products: rowsOut.slice(0, limit) });
  } catch (e) {
    console.error('[analytics] top products error', e);
    return res.status(500).json({ error: 'top products failed' });
  }
}

async function handleGetAnalyticsEngagementEvents(req, res) {
  try {
    const runtime = getAnalyticsState();
    const { from, to, limit = 500, skip = 0 } = req.query;
    const includeFaulty = String(req.query.includeFaulty || '0') === '1';
    const rows = await _loadEngagementWindow(runtime, from, to);
    const derived = _deriveEngagement(runtime, rows);
    const sk = Math.max(0, Number(skip) || 0);
    const lim = Math.max(1, Math.min(5000, Number(limit)));
    const slice = rows.slice(Math.max(0, rows.length - (sk + lim)), rows.length - sk);
    const enriched = slice.map((ev) => ({ ...ev, derived: _eventDerivedQuality(runtime, ev, derived) }))
      .filter((ev) => includeFaulty ? true : !ev.derived.isFaulty);
    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ ok: true, settings: runtime.getAnalyticsSettings(), events: enriched });
  } catch (e) {
    console.error('[analytics] engagement events error', e);
    return res.status(500).json({ error: 'events failed' });
  }
}

function sanitizeMixed(v, depth = 0) {
  if (v == null) return undefined;
  if (depth > 4) return undefined;
  const t = typeof v;
  if (t === 'string') return v.slice(0, 800);
  if (t === 'number') return Number.isFinite(v) ? v : undefined;
  if (t === 'boolean') return v;
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => sanitizeMixed(x, depth + 1)).filter((x) => x !== undefined);
  if (t === 'object') {
    const out = {};
    const keys = Object.keys(v).slice(0, 50);
    for (const k of keys) {
      const kk = String(k).slice(0, 60);
      const vv = sanitizeMixed(v[k], depth + 1);
      if (vv !== undefined) out[kk] = vv;
    }
    return out;
  }
  return undefined;
}

async function handlePostAnalyticsEvent(req, res) {
  try {
    const runtime = getAnalyticsState();
    const ff = runtime.getFeatureFlagsRuntimeSyncBestEffort();
    if (!ff?.analyticsIngest?.enabled || !runtime.getAnalyticsSettings().collectionEnabled) {
      return res.json({ ok: true, disabled: true });
    }
    const { type, sessionId, path, websiteOrigin, product, extra } = req.body || {};
    const cleanStr = (v, max = 500) => String(v == null ? '' : v).trim().slice(0, max);
    const safeType = cleanStr(type, 80);
    const safeSessionId = cleanStr(sessionId, 120) || null;
    const safePath = cleanStr(path || req.path, 300);
    const safeOrigin = cleanStr(websiteOrigin, 200) || null;
    const safeProduct = (product && typeof product === 'object') ? {
      name: cleanStr(product.name, 200),
      category: cleanStr(product.category, 120),
      productLink: cleanStr(product.productLink, 500),
      priceEUR: (product.priceEUR == null) ? undefined : (parseDecimalLoose(product.priceEUR) || 0),
    } : undefined;
    let safeExtraFinal = sanitizeMixed(extra, 0);
    try {
      const ab = await runtime.computeAbExperimentsForRequest(req, res);
      const ex = (ab && ab.experiments && typeof ab.experiments === 'object') ? ab.experiments : {};
      if (safeExtraFinal && typeof safeExtraFinal === 'object' && !Array.isArray(safeExtraFinal)) {
        const prev = (safeExtraFinal.experiments && typeof safeExtraFinal.experiments === 'object') ? safeExtraFinal.experiments : {};
        safeExtraFinal.experiments = { ...prev, ...ex };
      } else {
        safeExtraFinal = { experiments: ex };
      }
    } catch {}
    if (!type) return res.status(400).json({ error: 'type is required' });
    await runtime.AnalyticsEvent.create({
      type: safeType,
      sessionId: safeSessionId,
      path: safePath,
      websiteOrigin: safeOrigin,
      product: safeProduct,
      userAgent: req.get('user-agent') || '',
      referrer: req.get('referer') || '',
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '',
      extra: safeExtraFinal,
    });
    return res.json({ ok: true });
  } catch (e) {
    console.error('[analytics] create error', e);
    return res.status(500).json({ error: 'analytics failed' });
  }
}

module.exports = {
  requireAnalyticsRuntime,
  handleGetMetricsDimensions,
  handleGetMetricsTimeseries,
  handleGetAnalyticsSettings,
  handlePostAnalyticsSettings,
  handleGetAnalyticsEvents,
  handleGetAnalyticsEngagementSummary,
  handleGetAnalyticsEngagementTopProducts,
  handleGetAnalyticsEngagementEvents,
  handlePostAnalyticsEvent,
};
