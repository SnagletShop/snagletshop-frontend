'use strict';

const fs = require('fs');
const path = require('path');
const { rebuildCatalogIndexes } = require('../../lib/catalogIndex');
const { validateCatalogBundle, loadCatalogBundleFromDisk, listCatalogVersions, getCatalogVersionsDir, extractIconMetaFromCategoryArr, applyCatalogBundle } = require('../../lib/catalogBundle');
const { domain, requireValue } = require('../../lib/runtimeResolver');

function requireCatalogFileVersioningRuntime() {
  const catalog = domain('catalog') || {};
  const runtime = {
    authMiddleware: catalog.authMiddleware,
    getProductsData: catalog.getProductsData,
    saveProducts: catalog.saveProducts,
  };
  ['authMiddleware', 'getProductsData', 'saveProducts'].forEach((label) => requireValue(`CATALOG_FILE_VERSIONING_RUNTIME_NOT_READY:${label}`, runtime[label]));
  return runtime;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value == null ? {} : value));
}

function isIconMeta(entry) {
  return entry && typeof entry === 'object' &&
    typeof entry.icon === 'string' && String(entry.icon).trim() &&
    (!entry.productLink || !String(entry.productLink).trim()) &&
    (!entry.name || !String(entry.name).trim());
}

function buildLiveCategoryLists(data) {
  const idx = rebuildCatalogIndexes(data || {});
  return idx.categoryIdLists || {};
}

function buildProductsToCategories(categories) {
  const out = {};
  for (const [cat, ids] of Object.entries(categories || {})) {
    const arr = Array.isArray(ids) ? ids : [];
    for (const rawId of arr) {
      const pid = String(rawId || '').trim();
      if (!pid) continue;
      if (!Array.isArray(out[pid])) out[pid] = [];
      if (!out[pid].includes(cat)) out[pid].push(cat);
    }
  }
  return out;
}

function handleAdminCatalogFileGet(req, res) {
  const runtime = requireCatalogFileVersioningRuntime();
  const bundle = loadCatalogBundleFromDisk();
  if (!bundle) return res.status(404).json({ error: 'catalog.json not found' });
  return res.json(bundle);
}

async function handleAdminCatalogFilePut(req, res) {
  try {
    const runtime = requireCatalogFileVersioningRuntime();
    const bundle = req.body;
    const err = validateCatalogBundle(bundle);
    if (err) return res.status(400).json({ error: err });
    await applyCatalogBundle(bundle, 'catalog_file_upload');
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

function handleAdminCatalogCategoryListsGet(req, res) {
  try {
    const runtime = requireCatalogFileVersioningRuntime();
    const data = cloneJson(runtime.getProductsData() || {});
    return res.json({ categories: buildLiveCategoryLists(data) });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminCatalogCategoryListsPut(req, res) {
  try {
    const runtime = requireCatalogFileVersioningRuntime();
    const payload = req.body || {};
    const categories = payload.categories;
    if (!categories || typeof categories !== 'object') return res.status(400).json({ error: 'categories missing' });

    const liveData = cloneJson(runtime.getProductsData() || {});
    const idx = rebuildCatalogIndexes(liveData);
    const productsById = idx.productsById || {};
    const nextCategories = {};

    for (const [cat, ids] of Object.entries(categories)) {
      if (!Array.isArray(ids)) return res.status(400).json({ error: `category '${cat}' must be an array` });
      const seen = new Set();
      nextCategories[cat] = [];
      for (const id of ids) {
        const pid = String(id || '').trim();
        if (!pid || seen.has(pid)) continue;
        if (!productsById[pid]) return res.status(400).json({ error: `unknown productId '${pid}' in category '${cat}'` });
        seen.add(pid);
        nextCategories[cat].push(pid);
      }
    }

    const productToCategories = buildProductsToCategories(nextCategories);
    const nextData = {};
    for (const [cat, ids] of Object.entries(nextCategories)) {
      const existingArr = Array.isArray(liveData[cat]) ? liveData[cat] : [];
      const metaRows = existingArr.filter(isIconMeta).map((row) => cloneJson(row));
      const products = ids.map((pid) => {
        const base = cloneJson(productsById[pid] || {});
        base.categories = Array.isArray(productToCategories[pid]) ? [...productToCategories[pid]] : [cat];
        return base;
      });
      nextData[cat] = [...metaRows, ...products];
    }

    await runtime.saveProducts(nextData, 'admin:category-lists');
    return res.json({ ok: true, categories: nextCategories });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

function handleAdminCatalogCategoriesMetaGet(req, res) {
  try {
    const runtime = requireCatalogFileVersioningRuntime();
    const data = cloneJson(runtime.getProductsData() || {});
    const idx = rebuildCatalogIndexes(data || {});
    const cats = Object.keys(idx.categoryIdLists || {}).sort((a, b) => a.localeCompare(b));
    const out = {};
    for (const c of cats) {
      const icon = extractIconMetaFromCategoryArr(data[c]);
      out[c] = { icon: icon ? String(icon) : '' };
    }
    return res.json({ ok: true, categoriesMeta: out });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminCatalogCategoryMetaPost(req, res) {
  try {
    const runtime = requireCatalogFileVersioningRuntime();
    const body = req.body || {};
    const oldName = String(body.category || body.oldName || '').trim();
    if (!oldName) return res.status(400).json({ error: 'category required' });

    const nextName = String(body.newName || '').trim();
    const wantsRename = !!nextName && nextName !== oldName;
    const hasIconFields =
      Object.prototype.hasOwnProperty.call(body, 'icon') ||
      Object.prototype.hasOwnProperty.call(body, 'iconUrl') ||
      Object.prototype.hasOwnProperty.call(body, 'iconLightUrl') ||
      Object.prototype.hasOwnProperty.call(body, 'iconDarkUrl') ||
      Object.prototype.hasOwnProperty.call(body, 'iconLight') ||
      Object.prototype.hasOwnProperty.call(body, 'iconDark');

    const iconLight = String(body.iconLightUrl || body.iconLight || '').trim();
    const iconDark = String(body.iconDarkUrl || body.iconDark || '').trim();
    let icon = '';
    if (iconLight || iconDark) {
      if (iconLight && iconDark) icon = JSON.stringify({ light: iconLight, dark: iconDark });
      else icon = iconLight || iconDark;
    } else if (Object.prototype.hasOwnProperty.call(body, 'icon') || Object.prototype.hasOwnProperty.call(body, 'iconUrl')) {
      icon = String(body.icon || body.iconUrl || '').trim();
    }

    const data = cloneJson(runtime.getProductsData() || {});
    if (!data[oldName]) return res.status(404).json({ error: 'category not found' });

    let key = oldName;
    if (wantsRename) {
      if (data[nextName]) return res.status(409).json({ error: 'target category already exists' });
      data[nextName] = data[oldName];
      delete data[oldName];
      key = nextName;
    }

    if (hasIconFields) {
      const arr = Array.isArray(data[key]) ? data[key] : [];
      const metaIdx = arr.findIndex(isIconMeta);
      const iconTrim = String(icon || '').trim();
      if (!iconTrim) {
        if (metaIdx !== -1) arr.splice(metaIdx, 1);
      } else if (metaIdx !== -1) {
        arr[metaIdx] = { ...arr[metaIdx], icon: iconTrim };
      } else {
        arr.unshift({ icon: iconTrim });
      }
      data[key] = arr;
    }

    await runtime.saveProducts(data, 'admin:category-meta');
    return res.json({ ok: true, category: key });
  } catch (e) {
    return res.status(400).json({ error: String(e?.message || e) });
  }
}

function handleAdminCatalogVersionsGet(req, res) {
  const runtime = requireCatalogFileVersioningRuntime();
  return res.json({ versions: listCatalogVersions() });
}

function handleAdminCatalogVersionJsonGet(req, res) {
  const runtime = requireCatalogFileVersioningRuntime();
  const stamp = String(req.params.stamp || '').trim();
  const file = path.join(getCatalogVersionsDir(), `catalog_${stamp}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' });
  return res.type('application/json').send(fs.readFileSync(file, 'utf-8'));
}

function handleAdminCatalogVersionDbGet(req, res) {
  const runtime = requireCatalogFileVersioningRuntime();
  const stamp = String(req.params.stamp || '').trim();
  const file = path.join(getCatalogVersionsDir(), `db_products_${stamp}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' });
  return res.type('application/json').send(fs.readFileSync(file, 'utf-8'));
}

async function handleAdminCatalogVersionRestorePost(req, res) {
  try {
    const runtime = requireCatalogFileVersioningRuntime();
    const stamp = String(req.params.stamp || '').trim();
    const file = path.join(getCatalogVersionsDir(), `catalog_${stamp}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' });
    const bundle = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const err = validateCatalogBundle(bundle);
    if (err) return res.status(400).json({ error: err });
    await applyCatalogBundle(bundle, 'restore_' + stamp);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

module.exports = {
  requireCatalogFileVersioningRuntime,
  handleAdminCatalogFileGet,
  handleAdminCatalogFilePut,
  handleAdminCatalogCategoryListsGet,
  handleAdminCatalogCategoryListsPut,
  handleAdminCatalogCategoriesMetaGet,
  handleAdminCatalogCategoryMetaPost,
  handleAdminCatalogVersionsGet,
  handleAdminCatalogVersionJsonGet,
  handleAdminCatalogVersionDbGet,
  handleAdminCatalogVersionRestorePost,
};
