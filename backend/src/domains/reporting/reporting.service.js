'use strict';

const fs = require('fs');
const archiver = require('archiver');
const xlsx = require('xlsx');
const { computeOrderFinancials } = require('../accounting/accounting.service');
const { buildEconomicOrdersQuery, getEconomicOrderDate, isEconomicOrderInRange } = require('../accounting/orderFinancialQuery');
const { formatSelectedOptionSummary } = require('../catalog/catalogShared');
const { getReportingState } = require('../../lib/reportingState');

function csvEscape(v) {
  const s = (v === null || v === undefined) ? '' : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function looksLikeNumberString(s) {
  return /^-?(?:\d+|\d*\.\d+)$/.test(String(s || '').trim());
}

function sanitizeSpreadsheetText(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  const trimmed = s.trim();
  if (!looksLikeNumberString(trimmed) && (/^[=+\-@]/.test(trimmed) || /^[\t\r\n]/.test(trimmed))) {
    return "'" + s;
  }
  return s;
}

function canonicalProductKeyFromItem(item) {
  const link = String(item?.productLink || '');
  const m = link.match(/\/item\/(\d+)\.html/i) || link.match(/aliexpress\.com\/item\/(\d+)/i);
  if (m) return `ae:${m[1]}`;
  if (!link) return 'unknown';
  return link.split('?')[0];
}

function parseStripeRange(query) {
  const from = query.from ? Math.floor(new Date(query.from).getTime() / 1000) : undefined;
  const to = query.to ? Math.floor(new Date(query.to).getTime() / 1000) : undefined;
  const params = {};
  if (from) params.created = { ...(params.created || {}), gte: from };
  if (to) params.created = { ...(params.created || {}), lte: to };
  return params;
}

function ensureStripeClient() {
  const rt = getReportingState();
  const client = rt.getStripeClient ? rt.getStripeClient() : (rt.initStripe ? rt.initStripe() : null);
  return client || null;
}

async function buildOrdersExportCsv({ Order, query }) {
  const { from, to, status } = query || {};
  const q = {};
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(String(from));
    if (to) q.createdAt.$lte = new Date(String(to));
  }
  if (status) q.status = { $in: String(status).split(',').map((s) => s.trim()).filter(Boolean) };

  const orders = await Order.find(q).sort({ createdAt: -1 }).limit(20000).lean();
  const header = [
    'orderId', 'createdAt', 'paidAt', 'status', 'currency',
    'grossSaleEUR', 'discountTotalEUR', 'netPaidEUR',
    'stripeFeeEUR', 'shippingCostEUR', 'cogsEUR', 'contributionEUR',
    'customerEmail', 'country', 'itemsCount', 'items'
  ];
  const lines = [header.join(',')];

  for (const o of orders) {
    const pricing = o.pricing || {};
    const costs = o.costs || {};
    const gross = Number(pricing.grossSaleEUR ?? pricing.grossEUR ?? 0) || 0;
    const net = Number(pricing.totalPaidEUR ?? o.paidEUR ?? 0) || 0;
    const disc = Number(pricing.discountTotalEUR ?? (gross - net) ?? 0) || 0;
    const stripeFee = Number(costs.stripeFeeEUR ?? o.stripeFeeEUR ?? 0) || 0;
    const ship = Number(costs.shippingCostEUR ?? o.shippingCostEUR ?? 0) || 0;
    const items = Array.isArray(o.items) ? o.items : [];
    const cogs = items.reduce((s, it) => s + (Number(it?.expectedPurchasePrice || it?.expectedPurchase || 0) || 0) * (Number(it?.quantity || 1) || 1), 0);
    const contribution = net - stripeFee - ship - cogs;
    const row = [
      o.orderId || o._id,
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
      o.paidAt ? new Date(o.paidAt).toISOString() : '',
      o.status || '',
      pricing.currency || o.currency || 'EUR',
      gross.toFixed(2),
      disc.toFixed(2),
      net.toFixed(2),
      stripeFee.toFixed(2),
      ship.toFixed(2),
      cogs.toFixed(2),
      contribution.toFixed(2),
      (o.customer && o.customer.email) || o.email || '',
      (o.customer && o.customer.country) || '',
      items.length,
      JSON.stringify(items).slice(0, 8000)
    ].map(csvEscape);
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

async function buildOrdersWorkbookBuffer({ Order, query }) {
  const { from, to, limit = 10000 } = query || {};
  const q = {};
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }
  const lim = Math.max(1, Math.min(100000, Number(limit)));
  const rows = await Order.find(q).sort({ createdAt: -1 }).limit(lim).lean();
  const fmt = formatSelectedOptionSummary;

  const data = [[
    'Order ID', 'Created', 'Status',
    'First name', 'Last name', 'Email', 'Phone',
    'Address1', 'Address2', 'City', 'Region', 'Postal', 'Country',
    'Currency', 'Total Paid EUR', 'Email sent at',
    'Items (name × qty @ unit EUR)'
  ]];

  for (const o of rows) {
    const itemsText = (o.items || []).map((it) => {
      const sel = fmt(it.selectedOptions, it.selectedOption);
      const selTxt = sel ? ` (${sel})` : '';
      return `${it.name}${selTxt} × ${it.quantity} @ ${it.unitPriceEUR}`;
    }).join(' | ');

    data.push([
      sanitizeSpreadsheetText(o.orderId),
      sanitizeSpreadsheetText(new Date(o.createdAt).toISOString()),
      sanitizeSpreadsheetText(o.status || ''),
      sanitizeSpreadsheetText(o.customer?.firstName || ''),
      sanitizeSpreadsheetText(o.customer?.lastName || ''),
      sanitizeSpreadsheetText(o.customer?.email || ''),
      sanitizeSpreadsheetText(o.customer?.phone || ''),
      sanitizeSpreadsheetText(o.customer?.address1 || ''),
      sanitizeSpreadsheetText(o.customer?.address2 || ''),
      sanitizeSpreadsheetText(o.customer?.city || ''),
      sanitizeSpreadsheetText(o.customer?.region || ''),
      sanitizeSpreadsheetText(o.customer?.postalCode || ''),
      sanitizeSpreadsheetText(o.customer?.countryCode || ''),
      sanitizeSpreadsheetText(o.pricing?.currency || 'EUR'),
      Number(o.pricing?.totalPaidEUR || 0),
      sanitizeSpreadsheetText(o.emailSentAt ? new Date(o.emailSentAt).toISOString() : ''),
      sanitizeSpreadsheetText(itemsText)
    ]);
  }

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, 'Orders');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function buildMonthlyCsv({ Order, month }) {
  if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) throw new Error('month must be YYYY-MM');
  const [y, m] = month.split('-').map((n) => Number(n));
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const rows = await Order.find({ paidAt: { $gte: start, $lt: end } }).sort({ paidAt: 1 }).lean();
  const header = [
    'orderId', 'paidAt', 'status',
    'invoiceNumber',
    'customerCountry',
    'currency', 'exchangeRate',
    'totalPaidEUR', 'tariffPct', 'baseTotalEUR', 'tariffEUR',
    'stripeFeeEUR',
    'expectedPurchaseEUR', 'actualPurchaseEUR',
    'operatorShippingEUR',
    'operatorSupplierCostEUR',
    'otherCostEUR',
    'grossMarginEUR'
  ];
  const lines = [header.join(',')];
  for (const o of rows) {
    const items = Array.isArray(o.items) ? o.items : [];
    const expectedPurchase = items.reduce((sum, it) => sum + (Number(it.expectedPurchase || 0) * Number(it.quantity || 1)), 0);
    const actualPurchase = items.reduce((sum, it) => sum + (Number(it.actualPurchaseEUR || 0) * Number(it.quantity || 1)), 0);
    const opShip = (o.operator?.shipping?.aliExpress || 0) + (o.operator?.shipping?.thirdParty1 || 0) + (o.operator?.shipping?.thirdParty2 || 0);
    const supplierCost = (o.operator?.supplierCostEUR != null) ? Number(o.operator.supplierCostEUR) : null;
    const totalPaidEUR = Number(o?.pricing?.totalPaidEUR || 0);
    const stripeFeeEUR = (o?.costs?.stripeFeeEUR != null) ? Number(o.costs.stripeFeeEUR) : null;
    const otherCostEUR = (o?.costs?.otherCostEUR != null) ? Number(o.costs.otherCostEUR) : null;
    const purchaseUsed = (actualPurchase > 0) ? actualPurchase : expectedPurchase;
    const margin = totalPaidEUR - (purchaseUsed || 0) - (opShip || 0) - (stripeFeeEUR || 0) - (supplierCost || 0) - (otherCostEUR || 0);
    lines.push([
      o.orderId,
      o.paidAt ? new Date(o.paidAt).toISOString() : '',
      o.status || '',
      o.accounting?.invoiceNumber || '',
      o.accounting?.customerCountryCode || o.customer?.countryCode || '',
      o.pricing?.currency || 'EUR',
      o.pricing?.exchangeRate || 1,
      totalPaidEUR.toFixed(2),
      o.pricing?.tariffPct != null ? Number(o.pricing.tariffPct).toFixed(4) : '',
      o.pricing?.baseTotalEUR != null ? Number(o.pricing.baseTotalEUR).toFixed(2) : '',
      o.pricing?.tariffEUR != null ? Number(o.pricing.tariffEUR).toFixed(2) : '',
      stripeFeeEUR != null ? stripeFeeEUR.toFixed(2) : '',
      expectedPurchase.toFixed(2),
      actualPurchase.toFixed(2),
      Number(opShip || 0).toFixed(2),
      supplierCost != null ? supplierCost.toFixed(2) : '',
      otherCostEUR != null ? otherCostEUR.toFixed(2) : '',
      Number(margin || 0).toFixed(2)
    ].map(sanitizeSpreadsheetText).join(','));
  }
  return lines.join('\n');
}

async function buildOssSummaryCsv({ Order, year }) {
  const y = Number(year || 0);
  if (!y || y < 2000 || y > 2100) throw new Error('year must be YYYY');
  const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0));
  const rows = await Order.find({ paidAt: { $gte: start, $lt: end } }).lean();
  const byCountry = new Map();
  for (const o of rows) {
    const cc = (o.accounting?.customerCountryCode || o.customer?.countryCode || '').toUpperCase();
    if (!cc) continue;
    const totalPaidEUR = Number(o?.pricing?.totalPaidEUR || 0);
    byCountry.set(cc, (byCountry.get(cc) || 0) + totalPaidEUR);
  }
  const lines = ['countryCode,salesEUR'];
  const entries = Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1]);
  for (const [cc, sum] of entries) lines.push([cc, sum.toFixed(2)].join(','));
  return lines.join('\n');
}

async function buildReconcilePayouts({ query }) {
  const stripeClient = ensureStripeClient();
  if (!stripeClient) {
    const err = new Error('Stripe is not configured (missing STRIPE_SECRET_KEY/STRIPE_API_KEY)');
    err.statusCode = 503;
    throw err;
  }
  const params = { limit: 20, ...parseStripeRange(query) };
  const payouts = await stripeClient.payouts.list(params);
  const out = [];
  for (const p of payouts.data) {
    let gross = 0, fees = 0, net = 0;
    let hasMore = true;
    let starting_after = undefined;
    for (let i = 0; i < 5 && hasMore; i++) {
      const bt = await stripeClient.balanceTransactions.list({ payout: p.id, limit: 100, ...(starting_after ? { starting_after } : {}) });
      for (const t of bt.data) {
        net += t.net || 0;
        fees += t.fee || 0;
        gross += t.amount || 0;
      }
      hasMore = bt.has_more;
      starting_after = bt.data?.[bt.data.length - 1]?.id;
    }
    out.push({
      id: p.id,
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      arrival_date: p.arrival_date,
      created: p.created,
      statement_descriptor: p.statement_descriptor || '',
      totalsMinor: { gross, fees, net }
    });
  }
  return { payouts: out };
}

async function buildReconcileUnmatched({ Order, query }) {
  const stripeClient = ensureStripeClient();
  if (!stripeClient) {
    const err = new Error('Stripe is not configured (missing STRIPE_SECRET_KEY/STRIPE_API_KEY)');
    err.statusCode = 503;
    throw err;
  }
  const params = { limit: 100, ...parseStripeRange(query) };
  const pis = await stripeClient.paymentIntents.list(params);
  const succeeded = pis.data.filter((pi) => pi.status === 'succeeded');
  const ids = succeeded.map((pi) => pi.id);
  const existing = await Order.find({ 'stripe.paymentIntentId': { $in: ids } }, { 'stripe.paymentIntentId': 1, orderId: 1 }).lean();
  const set = new Set(existing.map((o) => o.stripe?.paymentIntentId).filter(Boolean));
  const unmatched = succeeded.filter((pi) => !set.has(pi.id)).map((pi) => ({
    id: pi.id,
    amount: pi.amount,
    currency: pi.currency,
    created: pi.created,
    description: pi.description || '',
    receipt_email: pi.receipt_email || '',
    customer: pi.customer || null
  }));
  return { unmatched, matchedCount: succeeded.length - unmatched.length, checked: succeeded.length };
}

async function streamBackupZip({ res, Order, Expense, includeAttachments }) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="snagletshop_backup_${stamp}.zip"`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    try { res.status(500).end(String(err?.message || err)); } catch {}
  });
  archive.pipe(res);
  const orders = await Order.find({}).lean();
  archive.append(JSON.stringify({ exportedAt: now.toISOString(), count: orders.length, orders }, null, 2), { name: 'orders.json' });
  const expenses = await Expense.find({}).lean();
  archive.append(JSON.stringify({ exportedAt: now.toISOString(), count: expenses.length, expenses }, null, 2), { name: 'expenses.json' });
  archive.append(JSON.stringify({ exportedAt: now.toISOString(), settings: {} }, null, 2), { name: 'settings.json' });
  if (includeAttachments) {
    for (const e of expenses) {
      for (const a of (e.attachments || [])) {
        if (a.storagePath && fs.existsSync(a.storagePath)) archive.file(a.storagePath, { name: `expense_attachments/${e._id}/${a.filename}` });
      }
    }
  }
  await archive.finalize();
}

async function buildProfitAnalytics({ Order, query }) {
  const from = new Date(query.from);
  const to = new Date(query.to);
  const group = String(query.group || 'product');
  const orders = (await Order.find(buildEconomicOrdersQuery({ from, to })).lean())
    .filter((order) => isEconomicOrderInRange(order, from, to));
  if (group === 'country') {
    const map = new Map();
    for (const o of orders) {
      const country = (o?.accounting?.customerCountryCode || o?.customer?.countryCode || o?.customer?.country || '').toUpperCase() || 'UNKNOWN';
      const f = computeOrderFinancials(o);
      const prev = map.get(country) || { key: country, orders: 0, netRevenue: 0, fees: 0, shipping: 0, cogs: 0, otherOrderCosts: 0, profit: 0 };
      prev.orders += 1;
      prev.netRevenue += f.netRevenue;
      prev.fees += f.fees;
      prev.shipping += f.shipping;
      prev.cogs += f.cogs;
      prev.otherOrderCosts += f.other;
      prev.profit += f.net;
      map.set(country, prev);
    }
    return { group: 'country', rows: Array.from(map.values()).sort((a, b) => b.profit - a.profit) };
  }

  const map = new Map();
  for (const o of orders) {
    const f = computeOrderFinancials(o);
    const items = o.items || [];
    const itemRevenue = items.map((it) => Number(it.unitPriceEUR || 0) * Number(it.quantity || 0));
    const orderItemsRevenue = itemRevenue.reduce((a, b) => a + b, 0) || 1;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const share = (itemRevenue[i] || 0) / orderItemsRevenue;
      const key = canonicalProductKeyFromItem(it);
      const qty = Number(it.quantity || 0) || 0;
      const revenue = itemRevenue[i] || 0;
      const cogs = (Number(it.expectedPurchase || 0) || 0) * qty;
      const refunds = f.refunds * share;
      const fees = f.fees * share;
      const ship = f.shipping * share;
      const other = f.other * share;
      const netRevenue = revenue - refunds;
      const profit = netRevenue - fees - ship - cogs - other;
      const prev = map.get(key) || { key, name: it.name || '', qty: 0, revenue: 0, refunds: 0, netRevenue: 0, fees: 0, shipping: 0, cogs: 0, otherOrderCosts: 0, profit: 0 };
      prev.qty += qty;
      prev.revenue += revenue;
      prev.refunds += refunds;
      prev.netRevenue += netRevenue;
      prev.fees += fees;
      prev.shipping += ship;
      prev.cogs += cogs;
      prev.otherOrderCosts += other;
      prev.profit += profit;
      if (!prev.name && it.name) prev.name = it.name;
      map.set(key, prev);
    }
  }
  return { group: 'product', rows: Array.from(map.values()).sort((a, b) => b.profit - a.profit) };
}

module.exports = {
  buildOrdersExportCsv,
  buildOrdersWorkbookBuffer,
  buildMonthlyCsv,
  buildOssSummaryCsv,
  buildReconcilePayouts,
  buildReconcileUnmatched,
  streamBackupZip,
  buildProfitAnalytics,
};
