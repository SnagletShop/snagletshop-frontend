'use strict';

const { computeOrderFinancials } = require('../accounting/accounting.service');
const { buildEconomicOrdersQuery, getEconomicOrderDate, isEconomicOrderInRange } = require('../accounting/orderFinancialQuery');
const { sanitizeNoCRLF, sanitizeMessage, isValidEmail } = require('../../lib/contact');
const { sendJsonWithCacheHeaders } = require('../../lib/tariffs');
const { getTariffsState, getCatalogCaches, getCachedRatesState, getSupportMailConfigState, getSupportTransportState } = require('../../lib/platformState');
const { getPlatformDomainState } = require('../../lib/platformDomainState');
const { getLiveEurRatesSafe } = require('../../lib/fx');
const { getStripeRuntime, buildPublicStripeConfig } = require('../../lib/stripeRuntime');
const { originIsAllowed, isCoolingDown, verifyTurnstile } = require('../../lib/requestSecurity');
const { readLocalTariffsJson, replaceLocalTariffs } = require('../../lib/tariffsAdmin');

function toISODate(d) {
  const dd = new Date(d);
  const y = dd.getUTCFullYear();
  const m = String(dd.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dd.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isValidDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function normalizeTimeseriesRange(fromInput, toInput) {
  const from = new Date(fromInput);
  const to = new Date(toInput);
  if (!isValidDate(from) || !isValidDate(to)) {
    const err = new Error('Invalid from/to date range. Use ISO-8601 values.');
    err.status = 400;
    throw err;
  }
  if (from > to) {
    const err = new Error('Invalid date range: from must be before or equal to to.');
    err.status = 400;
    throw err;
  }
  return { from, to };
}

function normalizeInterval(value) {
  const normalized = String(value || 'day').trim().toLowerCase();
  if (normalized === 'day' || normalized === 'daily') return 'day';
  if (normalized === 'week' || normalized === 'weekly') return 'week';
  if (normalized === 'month' || normalized === 'monthly') return 'month';
  const err = new Error('Invalid interval. Supported values: day, week, month.');
  err.status = 400;
  throw err;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date) {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const offset = (weekday + 6) % 7;
  day.setUTCDate(day.getUTCDate() - offset);
  return day;
}

function startOfUtcMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getBucketStart(date, interval) {
  if (interval === 'week') return startOfUtcWeek(date);
  if (interval === 'month') return startOfUtcMonth(date);
  return startOfUtcDay(date);
}

function addBucketStep(date, interval) {
  const next = new Date(date);
  if (interval === 'week') {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }
  if (interval === 'month') {
    return new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 1));
  }
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function createAnalyticsBucket(date) {
  return { date, orders: 0, gross: 0, refunds: 0, netRevenue: 0, fees: 0, shipping: 0, cogs: 0, otherOrderCosts: 0, profit: 0 };
}

function handleAdminTariffsDownload(req, res) {
  try {
    const json = readLocalTariffsJson();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tariffs.json"');
    return res.send(json);
  } catch (e) {
    console.error('download local tariffs failed:', e);
    const status = Number(e?.status || 500) || 500;
    return res.status(status).json({ error: status === 404 ? 'Local tariffs.json not found' : 'Failed to download local tariffs.json' });
  }
}

function handleAdminTariffsReplace(req, res) {
  try {
    return res.json(replaceLocalTariffs(req.body));
  } catch (e) {
    console.error('replace tariffs failed:', e);
    return res.status(Number(e?.status || 400) || 400).json({ error: String(e?.message || e) });
  }
}

function handleRates(req, res) {
  const { cachedRates: rates } = getCachedRatesState();
  if (!rates) return res.status(503).json({ error: 'Exchange rates not available yet.' });
  res.json(rates);
}

async function handleProxyRates(req, res) {
  try {
    const rates = await getLiveEurRatesSafe();
    if (!rates) return res.status(503).json({ error: 'Exchange rates not available yet.' });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: 'Proxy failed', details: err?.message || String(err) });
  }
}

function handleTariffs(req, res) {
  const { tariffsData, tariffsETag, tariffsLocalMtimeMs } = getTariffsState();
  if (tariffsETag && req.headers['if-none-match'] === tariffsETag) return res.status(304).end();
  const jsonText = JSON.stringify(tariffsData || {}) + '\n';
  const lastModifiedUtc = tariffsLocalMtimeMs ? new Date(tariffsLocalMtimeMs).toUTCString() : undefined;
  return sendJsonWithCacheHeaders(res, jsonText, { etag: tariffsETag, lastModifiedUtc });
}

function handleCountries(req, res) {
  const { tariffsData } = getTariffsState();
  const codes = Object.keys(tariffsData || {}).sort();
  res.json(codes.map((code) => ({ code, tariff: tariffsData[code] })));
}

function handleProducts(req, res) {
  const { productsETag, productsJsonCache } = getCatalogCaches();
  if (productsETag) res.set('ETag', productsETag);
  res.set('Cache-Control', 'public, max-age=300');
  const inm = String(req.headers['if-none-match'] || '');
  if (productsETag && inm === productsETag) return res.status(304).end();
  res.type('application/json').send(productsJsonCache);
}

function handleProductsFlat(req, res) {
  const { productsFlatETag, productsFlatJsonCache } = getCatalogCaches();
  if (productsFlatETag) res.set('ETag', productsFlatETag);
  res.set('Cache-Control', 'public, max-age=300');
  const inm = String(req.headers['if-none-match'] || '');
  if (productsFlatETag && inm === productsFlatETag) return res.status(304).end();
  res.type('application/json').send(productsFlatJsonCache);
}

async function handleProductsContribution(req, res) {
  try {
    const rt = getPlatformDomainState();
    const limit = Math.max(1, Math.min(60, Number(req.query.limit || 20) || 20));
    const minSold = Math.max(0, Number(req.query.minSold || 3) || 3);
    const stats = await rt.ProductProfitStats.find({ soldQty: { $gte: minSold } }).lean().catch(() => []);
    stats.sort((a, b) => (Number(b.contributionEUR || 0) - Number(a.contributionEUR || 0)));
    const top = stats.slice(0, limit);
    const ids = top.map((x) => x.productId).filter(Boolean);
    const prods = await rt.Product.find({ productId: { $in: ids }, enabled: { $ne: false } }).lean().catch(() => []);
    const byId = new Map(prods.map((p) => [p.productId, p]));
    const items = top.map((s) => {
      const p = byId.get(s.productId);
      if (!p) return null;
      return {
        productId: p.productId,
        name: p.name,
        price: p.price,
        images: Array.isArray(p.images) ? p.images : [],
        productLink: p.productLink,
        contributionEUR: Number(s.contributionEUR || 0) || 0,
        soldQty: Number(s.soldQty || 0) || 0,
        refundRate: Number(s.refundRate || 0) || 0,
      };
    }).filter(Boolean);
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

function handleCatalog(req, res) {
  const { catalogBundleETag, catalogBundleJsonCache } = getCatalogCaches();
  if (catalogBundleETag) res.set('ETag', catalogBundleETag);
  res.set('Cache-Control', 'public, max-age=300');
  const inm = String(req.headers['if-none-match'] || '');
  if (catalogBundleETag && inm === catalogBundleETag) return res.status(304).end();
  res.type('application/json').send(catalogBundleJsonCache);
}

function handleProductById(req, res) {
  const { productsByIdCache } = getCatalogCaches();
  const id = String(req.params.productId || '').trim();
  const p = (productsByIdCache || {})[id];
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json({ product: p });
}

function handleConfig(req, res) {
  const { APPLY_TARIFF_SERVER } = getStripeRuntime();
  res.type('application/json').send(JSON.stringify({ applyTariff: APPLY_TARIFF_SERVER }));
}

function handleStorefrontConfig(req, res) {
  try { if (!originIsAllowed(req)) return res.status(403).json({ error: 'FORBIDDEN' }); } catch {}
  const rt = getPlatformDomainState();
  const cfg = rt.getIncentivesRuntimeSync();
  const ff = rt.getFeatureFlagsRuntimeSyncBestEffort();
  const incentivesEnabled = (rt.incentivesRuntime?.enabled !== false) && (ff?.incentives?.enabled !== false);
  const { APPLY_TARIFF_SERVER } = getStripeRuntime();
  const payload = {
    featureFlags: ff || null,
    cartIncentives: {
      enabled: incentivesEnabled,
      freeShipping: cfg.freeShipping,
      tierDiscount: cfg.tierDiscount,
      bundles: cfg.bundles,
      topup: cfg.topup,
    },
    config: { applyTariff: APPLY_TARIFF_SERVER },
  };
  res.set('Cache-Control', 'public, max-age=300');
  res.type('application/json').send(JSON.stringify(payload));
}

function handlePublicConfig(req, res) {
  res.json(buildPublicStripeConfig());
}

async function handleSendMessage(req, res) {
  if (!originIsAllowed(req)) return res.status(403).json({ message: 'Forbidden.' });
  const ip = String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  const { email, message, turnstileToken, website } = req.body || {};
  const cleanEmail = sanitizeNoCRLF(email, 200);
  const cleanMsg = sanitizeMessage(message, 4000);
  const websiteVal = String(website || '').trim();
  if (websiteVal) {
    console.warn('[contact] honeypot hit:', { ip, email: cleanEmail, website: websiteVal.slice(0, 80) });
    return res.json({ message: 'Your message has been sent successfully!' });
  }
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if ((cleanMsg || '').length < 5) return res.status(400).json({ message: 'Please enter a message (at least 5 characters).' });
  if (isCoolingDown(ip, cleanEmail)) return res.status(429).json({ message: 'Please wait a moment before sending another message.' });
  const captcha = await verifyTurnstile(String(turnstileToken || ''), ip);
  if (!captcha.ok) {
    console.warn('[contact] blocked by captcha:', captcha.reason);
    return res.status(400).json({ error: 'TURNSTILE_FAILED', message: 'Turnstile verification failed. Please refresh and try again.' });
  }
  const mailCfg = getSupportMailConfigState();
  const { supportTransporter } = getSupportTransportState();
  if (!mailCfg.CONTACT_SMTP_USER || !mailCfg.CONTACT_SMTP_PASS) {
    console.error('[contact] SUPPORT_EMAIL / SUPPORT_EMAIL_PASSWORD not set; cannot send contact email');
    return res.status(503).json({ message: 'Support email is not configured.' });
  }
  try {
    if (!supportTransporter || typeof supportTransporter.sendMail !== 'function') {
      console.error('[contact] support transporter not configured');
      return res.status(503).json({ message: 'Support email is not configured.' });
    }
    const info = await supportTransporter.sendMail({
      from: mailCfg.CONTACT_FROM,
      to: mailCfg.SUPPORT_TO_EMAIL,
      replyTo: cleanEmail,
      subject: 'New Contact Form Message',
      text: `From: ${cleanEmail}\nIP: ${ip || 'unknown'}\n${cleanMsg}`,
    });
    console.log('[contact] email queued:', { messageId: info?.messageId, accepted: info?.accepted, rejected: info?.rejected });
    if (Array.isArray(info?.rejected) && info.rejected.length) return res.status(502).json({ message: 'Email rejected by provider. Please email us directly.' });
    return res.json({ message: 'Your message has been sent successfully!' });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return res.status(500).json({ message: 'Failed to send message.' });
  }
}

async function handleAdminAnalyticsTimeseries(req, res) {
  try {
    const rt = getPlatformDomainState();
    const { from, to } = normalizeTimeseriesRange(req.query.from, req.query.to);
    const interval = normalizeInterval(req.query.interval);
    const orders = (await rt.Order.find(buildEconomicOrdersQuery({ from, to })).lean())
      .filter((order) => isEconomicOrderInRange(order, from, to));
    const buckets = new Map();
    for (const o of orders) {
      const bucketDate = getBucketStart(getEconomicOrderDate(o) || new Date(o.createdAt), interval);
      const key = toISODate(bucketDate);
      const f = computeOrderFinancials(o);
      const prev = buckets.get(key) || createAnalyticsBucket(key);
      prev.orders += 1;
      prev.gross += f.gross;
      prev.refunds += f.refunds;
      prev.netRevenue += f.netRevenue;
      prev.fees += f.fees;
      prev.shipping += f.shipping;
      prev.cogs += f.cogs;
      prev.otherOrderCosts += f.other;
      prev.profit += f.net;
      buckets.set(key, prev);
    }
    const out = [];
    const start = getBucketStart(from, interval);
    const end = getBucketStart(to, interval);
    for (let cursor = new Date(start); cursor <= end; cursor = addBucketStep(cursor, interval)) {
      const key = toISODate(cursor);
      out.push(buckets.get(key) || createAnalyticsBucket(key));
    }
    return res.json({ interval, from: from.toISOString(), to: to.toISOString(), rows: out });
  } catch (error) {
    const status = Number(error?.status || 500) || 500;
    return res.status(status).json({ error: String(error?.message || error || 'Failed to build analytics timeseries') });
  }
}

async function handleAdminStripeSelftest(req, res) {
  const rt = getStripeRuntime();
  const out = {
    ok: true,
    nodeEnv: process.env.NODE_ENV || null,
    stripeMode: rt.STRIPE_TEST_MODE ? 'test' : 'live',
    hasStripeSecretKey: !!rt.STRIPE_SECRET_KEY,
    hasStripePublishableKey: !!rt.ACTIVE_STRIPE_PUBLISHABLE_KEY,
    hasStripeWebhookSecret: !!rt.ACTIVE_STRIPE_WEBHOOK_SECRET,
    canRunActiveTest: (process.env.STRIPE_SELFTEST_ALLOW === '1') && (String(req.query.run || '') === '1'),
    activeTest: null,
    notes: [],
  };
  if (!out.hasStripeSecretKey) { out.ok = false; out.notes.push('Missing active STRIPE_SECRET_KEY (live) or STRIPE_SECRET_KEY_TEST (test)'); }
  if (!out.hasStripePublishableKey) out.notes.push('Missing active Stripe publishable key (STRIPE_PUBLISHABLE_KEY or STRIPE_PUBLISHABLE_KEY_TEST) (storefront Stripe init will fail)');
  if (!out.hasStripeWebhookSecret) out.notes.push('Missing active Stripe webhook secret (STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET_TEST) (orders may not finalize)');
  if (out.canRunActiveTest) {
    try {
      const stripeClient = (rt.stripe || (getPlatformDomainState().initStripe ? getPlatformDomainState().initStripe() : null));
      if (!stripeClient) throw new Error('Stripe not configured');
      const pi = await stripeClient.paymentIntents.create({ amount: 100, currency: 'eur', metadata: { selftest: '1', createdAt: new Date().toISOString() } });
      out.activeTest = { paymentIntentId: pi.id, status: pi.status };
    } catch (e) {
      out.ok = false;
      out.activeTest = { error: String(e?.message || e) };
    }
  } else {
    out.notes.push('Active test disabled. Set STRIPE_SELFTEST_ALLOW=1 and call with ?run=1 to create a 1 EUR PaymentIntent.');
  }
  res.json(out);
}

module.exports = {
  handleAdminTariffsDownload,
  handleAdminTariffsReplace,
  handleRates,
  handleProxyRates,
  handleTariffs,
  handleCountries,
  handleProducts,
  handleProductsFlat,
  handleProductsContribution,
  handleCatalog,
  handleProductById,
  handleConfig,
  handleStorefrontConfig,
  handlePublicConfig,
  handleSendMessage,
  handleAdminAnalyticsTimeseries,
  handleAdminStripeSelftest,
};
