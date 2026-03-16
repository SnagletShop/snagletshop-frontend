'use strict';

const fs = require('fs');
const path = require('path');
const { getCatalogReloadState } = require('./catalogReloadState');

function writeSplitCatalogFiles(productsData, productsFile, categoriesFile) {
  const productsRows = [];
  const categoryIdLists = {};

  for (const [cat, arr] of Object.entries(productsData || {})) {
    const items = Array.isArray(arr) ? arr : [];
    const ids = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const clone = { ...item };
      const pid = String(clone.productId || '').trim();
      if (!pid) continue;
      ids.push(pid);
      productsRows.push(clone);
    }
    categoryIdLists[cat] = ids;
  }

  fs.mkdirSync(path.dirname(productsFile), { recursive: true });
  fs.writeFileSync(productsFile, JSON.stringify(productsRows, null, 2), 'utf8');
  fs.writeFileSync(categoriesFile, JSON.stringify(categoryIdLists, null, 2), 'utf8');

  return { productsRows, categoryIdLists };
}

function loadSplitCatalogFromDisk(productsFile, categoriesFile) {
  const productsRows = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
  const categoryIdLists = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
  const byId = {};
  for (const row of Array.isArray(productsRows) ? productsRows : []) {
    if (!row || typeof row !== 'object') continue;
    const pid = String(row.productId || '').trim();
    if (!pid) continue;
    byId[pid] = { ...row };
  }
  return {
    productsById: byId,
    categoryIdLists: categoryIdLists && typeof categoryIdLists === 'object' ? categoryIdLists : {},
    originalForIcons: {},
  };
}

function reloadCatalogFromSplitDisk(productsFile, categoriesFile, source = 'split_reload') {
  const state = getCatalogReloadState();
  const parsed = loadSplitCatalogFromDisk(productsFile, categoriesFile);
  const legacy = state.buildLegacyCatalogFromIds(
    parsed.productsById || {},
    parsed.categoryIdLists || {},
    parsed.originalForIcons || {}
  );
  const normalized = state.normalizeCatalog(legacy);
  state.setCatalogInMemory(normalized, source);
  try {
    if (source) {
      state.saveCatalogToDiskFireAndForget && state.saveCatalogToDiskFireAndForget(normalized, `id_migration:${source}`);
    }
  } catch {}
  return normalized;
}

function reloadCatalogFromDisk(source = 'products_js_reload') {
  const state = getCatalogReloadState();
  const raw = state.loadProducts();
  const normalized = state.normalizeCatalog(raw);
  try {
    state.setCatalogInMemory(normalized, source);
  } catch {}
  return normalized;
}

module.exports = {
  writeSplitCatalogFiles,
  loadSplitCatalogFromDisk,
  reloadCatalogFromSplitDisk,
  reloadCatalogFromDisk,
};
