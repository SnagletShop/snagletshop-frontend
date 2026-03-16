'use strict';

const fs = require('fs');
const path = require('path');
const { getProductsData, getCatalogSource, getLocalProductsPath, getDataDir } = require('../../lib/catalogState');
const { parseProductsFromJsText } = require('../../lib/catalogCrud');

const { getCatalogAdminState } = require('../../lib/catalogOpsState');

function requireCatalogAdminRuntime() {
  return getCatalogAdminState();
}

function timestampSafe() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}



async function handleAdminProductsLiveGet(_req, res) {
  try {
    return res.json({ ok: true, catalog: getProductsData() || {}, source: getCatalogSource() || 'memory' });
  } catch (e) {
    console.error('admin live catalog failed:', e);
    return res.status(500).json({ error: 'Failed to load live catalog' });
  }
}

async function handleAdminProductsSync(req, res) {
  try {
    const runtime = getCatalogAdminState();
    const canonical = runtime.requireFresh(runtime.CANONICAL_PRODUCTS_PATH);
    const local = (getCatalogSource() === 'db')
      ? (getProductsData() || {})
      : runtime.requireFresh(getLocalProductsPath());

    let reconciled = runtime.normalizeCatalog(runtime.mergeCanonicalIntoLocal(canonical, local));

    const deletedProductIds = runtime.getDeletedProductIds();
    if (deletedProductIds && deletedProductIds.size) {
      const filtered = {};
      for (const [cat, arr] of Object.entries(reconciled || {})) {
        if (!Array.isArray(arr)) {
          filtered[cat] = arr;
          continue;
        }
        filtered[cat] = arr.filter((p) => {
          const pid = p && typeof p === 'object' ? String(p.productId || '').trim() : '';
          return !pid || !deletedProductIds.has(pid);
        });
      }
      reconciled = runtime.normalizeCatalog(filtered);
    }

    try {
      await runtime.saveProducts(reconciled, 'admin/products/sync');
    } catch (e) {
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }

    return res.json({ ok: true, message: 'Reconciled local with canonical' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminProductsLocalDownload(req, res) {
  try {
    const runtime = getCatalogAdminState();
    const localProductsPath = getLocalProductsPath();
    let js = '';
    if (fs.existsSync(localProductsPath)) {
      js = fs.readFileSync(localProductsPath, 'utf8');
    } else {
      js = 'module.exports = ' + JSON.stringify(getProductsData() || {}, null, 2) + ';\n';
    }
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ServerProducts.js"');
    return res.send(js);
  } catch (e) {
    console.error('download local products failed:', e);
    return res.status(500).json({ error: 'Failed to download ServerProducts.js' });
  }
}

async function handleAdminProductsLocalReplace(req, res) {
  try {
    const runtime = getCatalogAdminState();
    const incomingText = req.body;
    if (!incomingText || typeof incomingText !== 'string') {
      return res.status(400).json({ error: 'Missing file content (send as text/plain)' });
    }

    const localProductsPath = getLocalProductsPath();
    if (fs.existsSync(localProductsPath)) {
      try {
        const backupPath = path.join(getDataDir(), `ServerProducts.backup.${timestampSafe()}.js`);
        fs.copyFileSync(localProductsPath, backupPath);
      } catch (e) {
        console.warn('[catalog] backup failed (continuing):', e?.message || e);
      }
    }

    const catalog = parseProductsFromJsText(incomingText);
    const normalized = runtime.normalizeCatalog(catalog);

    try {
      await runtime.saveProducts(normalized, 'admin/products/local/replace');
    } catch (e) {
      console.error('replace local products persist failed:', e);
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }

    return res.json({
      ok: true,
      message: 'Local ServerProducts.js replaced',
      categories: Object.keys(getProductsData() || {}).length,
    });
  } catch (e) {
    console.error('replace local products failed:', e);
    return res.status(400).json({ error: String(e?.message || e) });
  }
}

module.exports = {
  requireCatalogAdminRuntime,
  parseProductsFromJsText,
  handleAdminProductsLiveGet,
  handleAdminProductsSync,
  handleAdminProductsLocalDownload,
  handleAdminProductsLocalReplace,
};
