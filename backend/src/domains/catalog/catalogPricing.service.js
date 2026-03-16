'use strict';

const { getCatalogPricingState } = require('../../lib/catalogOpsState');
const { getProductsData } = require('../../lib/catalogState');
const { parseDecimalLoose } = require('../../lib/money');
const { canonicalizeProductLink } = require('../../lib/catalogLinks');

function requireCatalogPricingRuntime() {
  return getCatalogPricingState();
}

function findProductMutable(productsData, { productLink, name, productId }) {
  const runtime = requireCatalogPricingRuntime();
  const canonIn = canonicalizeProductLink(productLink || '');
  let found = null;
  let catName = null;
  let idx = -1;
  for (const [c, arr] of Object.entries(productsData || {})) {
    for (let i = 0; i < (arr || []).length; i++) {
      const p = arr[i];
      if (!p || typeof p !== 'object') continue;
      const match = (
        (productLink && (p.productLink === productLink || canonicalizeProductLink(p.productLink || '') === canonIn)) ||
        (productId && String(p.productId || '').trim() === String(productId).trim()) ||
        (name && p.name === name)
      );
      if (match) {
        found = p;
        catName = c;
        idx = i;
        break;
      }
    }
    if (found) break;
  }
  return { found, catName, idx };
}

async function handleAdminProductPrice(req, res) {
  try {
    const runtime = getCatalogPricingState();
    const productsData = JSON.parse(JSON.stringify(getProductsData() || {}));
    const { productLink, name, newRetailPriceEUR, purchasePriceEUR } = req.body || {};
    const productId = String(req.body?.productId || '').trim();
    if (!productLink && !name && !productId) {
      return res.status(400).json({ error: 'productId, productLink or name required' });
    }

    const { found, catName, idx } = findProductMutable(productsData, { productLink, name, productId });
    if (!found) return res.status(404).json({ error: 'Product not found' });

    if (purchasePriceEUR != null) found.expectedPurchasePrice = parseDecimalLoose(purchasePriceEUR);
    if (newRetailPriceEUR != null) found.price = Number(newRetailPriceEUR) || 0;

    try {
      await runtime.saveProducts(productsData, 'admin/product-price');
    } catch (e) {
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }

    return res.json({ ok: true, product: { category: catName, index: idx, ...found } });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminProductPricingPatch(req, res) {
  try {
    const runtime = getCatalogPricingState();
    const productsData = JSON.parse(JSON.stringify(getProductsData() || {}));
    const id = String(req.params.productId || '').trim();
    if (!id) return res.status(400).json({ error: 'productId required' });

    const selling = req.body?.sellingPriceEUR;
    const purchase = req.body?.purchasePriceEUR;
    let updated = 0;

    for (const [, arr] of Object.entries(productsData || {})) {
      if (!Array.isArray(arr)) continue;
      for (const p of arr) {
        if (!p || typeof p !== 'object') continue;
        if (String(p.productId || '').trim() !== id) continue;
        if (selling != null && selling !== '') p.price = Number(selling) || 0;
        if (purchase != null && purchase !== '') p.expectedPurchasePrice = parseDecimalLoose(purchase);
        updated++;
      }
    }

    if (!updated) return res.status(404).json({ error: 'product not found' });

    try {
      await runtime.saveCatalogToDisk(productsData, 'pricing_update');
    } catch (e) {
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }
    return res.json({ ok: true, updated });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminProductsPricingBulk(req, res) {
  try {
    const runtime = getCatalogPricingState();
    const productsData = JSON.parse(JSON.stringify(getProductsData() || {}));
    const payload = req.body;
    const updates = Array.isArray(payload) ? payload : (payload?.updates || []);
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be an array' });

    const byId = new Map();
    for (const u of updates) {
      if (!u) continue;
      const id = String(u.productId || u.id || '').trim();
      if (!id) continue;
      byId.set(id, { selling: u.sellingPriceEUR, purchase: u.purchasePriceEUR });
    }

    let updatedProducts = 0;
    const updatedIds = [];
    for (const [, arr] of Object.entries(productsData || {})) {
      if (!Array.isArray(arr)) continue;
      for (const p of arr) {
        if (!p || typeof p !== 'object') continue;
        const id = String(p.productId || '').trim();
        if (!id) continue;
        const u = byId.get(id);
        if (!u) continue;
        if (u.selling != null && u.selling !== '') p.price = Number(u.selling) || 0;
        if (u.purchase != null && u.purchase !== '') p.expectedPurchasePrice = parseDecimalLoose(u.purchase);
        updatedProducts++;
        updatedIds.push(id);
        byId.delete(id);
      }
    }

    if (updatedProducts === 0) {
      return res.status(404).json({ error: 'no matching products found', notFound: Array.from(byId.keys()) });
    }

    try {
      await runtime.saveCatalogToDisk(productsData, 'bulk_pricing_update');
    } catch (e) {
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }

    return res.json({ ok: true, updatedProducts, updatedIds, notFound: Array.from(byId.keys()) });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

module.exports = {
  requireCatalogPricingRuntime,
  handleAdminProductPrice,
  handleAdminProductPricingPatch,
  handleAdminProductsPricingBulk,
};
