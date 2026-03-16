'use strict';

const { middleware, model, requireValue } = require('../../lib/runtimeResolver');

function requireCatalogBulkStateRuntime() {
  const runtime = {
    requireAdmin: middleware('requireAdmin'),
    Product: model('Product'),
  };
  ['requireAdmin', 'Product'].forEach((label) => requireValue(`CATALOG_BULK_STATE_RUNTIME_NOT_READY:${label}`, runtime[label]));
  return runtime;
}

async function handleAdminProductsBulkCost(req, res) {
  try {
    const runtime = requireCatalogBulkStateRuntime();
    const { updates } = req.body || {};
    const arr = Array.isArray(updates) ? updates : [];
    let ok = 0;
    const failed = [];
    for (const u of arr) {
      const productId = String(u?.productId || '').trim();
      if (!productId) continue;
      const val = Number(u?.expectedPurchasePrice || 0) || 0;
      try {
        const result = await runtime.Product.updateOne({ productId }, { $set: { expectedPurchasePrice: val } });
        const matched = Number(result?.matchedCount ?? result?.n ?? 0) || 0;
        if (matched > 0) ok++;
        else failed.push({ productId, error: 'not found' });
      } catch (e) {
        failed.push({ productId, error: String(e?.message || e) });
      }
    }
    return res.status(failed.length ? 207 : 200).json({ ok: failed.length === 0, updated: ok, failed });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handleAdminProductsBulkEnable(req, res) {
  try {
    const runtime = requireCatalogBulkStateRuntime();
    const { productIds, enabled } = req.body || {};
    const ids = Array.isArray(productIds) ? productIds.map(String).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ ok: false, error: 'productIds required' });
    const en = !!enabled;
    const r = await runtime.Product.updateMany({ productId: { $in: ids } }, { $set: { enabled: en } });
    return res.json({ ok: true, matched: r.matchedCount ?? r.n ?? 0, modified: r.modifiedCount ?? r.nModified ?? 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

module.exports = {
  requireCatalogBulkStateRuntime,
  handleAdminProductsBulkCost,
  handleAdminProductsBulkEnable,
};
