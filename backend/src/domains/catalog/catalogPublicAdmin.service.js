'use strict';

const { domain, requireValue } = require('../../lib/runtimeResolver');

function requireCatalogPublicAdminRuntime() {
  const catalog = domain('catalog') || {};
  const runtime = {
    authMiddleware: catalog.authMiddleware,
    getProductsData: catalog.getProductsData,
    tombstoneAdd: catalog.tombstoneAdd,
    saveProducts: catalog.saveProducts,
    ZOD_ERR_MAX: catalog.ZOD_ERR_MAX,
    getCatalogBundleJsonCache: catalog.getCatalogBundleJsonCache,
    getMetricsTimezone: catalog.getMetricsTimezone,
  };
  [
    'authMiddleware',
    'getProductsData',
    'tombstoneAdd',
    'saveProducts',
    'ZOD_ERR_MAX',
    'getCatalogBundleJsonCache',
    'getMetricsTimezone',
  ].forEach((label) => requireValue(`CATALOG_PUBLIC_ADMIN_RUNTIME_NOT_READY:${label}`, runtime[label]));
  return runtime;
}

async function handleAdminDeleteProduct(req, res) {
  try {
    const runtime = requireCatalogPublicAdminRuntime();
    const id = String(req.params.productId || '').trim();
    if (!id) return res.status(400).json({ error: 'productId required' });

    const productsData = JSON.parse(JSON.stringify(runtime.getProductsData() || {}));
    let removed = 0;
    for (const [cat, arr] of Object.entries(productsData)) {
      if (!Array.isArray(arr)) continue;
      const kept = [];
      for (const p of arr) {
        if (!p || typeof p !== 'object') { kept.push(p); continue; }
        if (String(p.productId || '').trim() === id) { removed++; continue; }
        kept.push(p);
      }
      productsData[cat] = kept;
    }

    if (!removed) return res.status(404).json({ error: 'product not found' });

    try {
      await runtime.saveProducts(productsData, `admin:product_delete_${id}`);
    } catch (e) {
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }

    runtime.tombstoneAdd(id);
    return res.json({ ok: true, removed });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminMetricsCatalog(_req, res) {
  const runtime = requireCatalogPublicAdminRuntime();
  return res.json({
    ok: true,
    timezone: runtime.getMetricsTimezone(),
    metrics: [
      { dataset: 'orders', id: 'orders_count', label: 'Orders (count)' },
      { dataset: 'orders', id: 'revenue_eur', label: 'Revenue (EUR)' },
      { dataset: 'orders', id: 'base_revenue_eur', label: 'Revenue excl. tariff (EUR)' },
      { dataset: 'orders', id: 'tariff_eur', label: 'Tariff collected (EUR)' },
      { dataset: 'orders', id: 'items_qty', label: 'Items sold (qty)' },
      { dataset: 'orders', id: 'profit_eur', label: 'Gross profit (EUR)' },
      { dataset: 'analytics', id: 'events_count', label: 'Events (count)' },
      { dataset: 'analytics', id: 'unique_sessions', label: 'Unique sessions' },
    ],
    datasets: [
      { id: 'orders', groupBy: ['', 'status', 'country'], filters: ['paidOnly', 'status', 'country', 'minPaidEUR'] },
      { id: 'analytics', groupBy: ['', 'type', 'path', 'websiteOrigin', 'productLink'], filters: ['type', 'path', 'websiteOrigin', 'sessionId', 'productLink'] },
    ],
  });
}

async function handleAdminCatalog(req, res) {
  const runtime = requireCatalogPublicAdminRuntime();
  res.type('application/json').send(runtime.getCatalogBundleJsonCache());
}

module.exports = {
  requireCatalogPublicAdminRuntime,
  handleAdminDeleteProduct,
  handleAdminMetricsCatalog,
  handleAdminCatalog,
};
