'use strict';

const fs = require('fs');
const path = require('path');
const {
  getCatalogBundlePathState,
  getCatalogBundleRuntimeState,
  getCatalogBundleCacheState,
  setCatalogBundleProductsData,
  setCatalogBundleCacheArtifacts,
} = require('./catalogBundleState');

function validateCatalogBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') return 'bundle must be an object';
  if (!bundle.productsById || typeof bundle.productsById !== 'object') return 'productsById missing';
  if (!bundle.categories || typeof bundle.categories !== 'object') return 'categories missing';
  return null;
}

function getCatalogFile() {
  return getCatalogBundlePathState().catalogFile;
}

function getCatalogVersionsDir() {
  return getCatalogBundlePathState().catalogVersionsDir;
}

function loadCatalogBundleFromDisk() {
  const catalogFile = getCatalogFile();
  if (!catalogFile || !fs.existsSync(catalogFile)) return null;
  try {
    const raw = fs.readFileSync(catalogFile, 'utf-8');
    const parsed = JSON.parse(raw);
    const err = validateCatalogBundle(parsed);
    if (err) return null;
    return parsed;
  } catch {
    return null;
  }
}

function listCatalogVersions() {
  const versionsDir = getCatalogVersionsDir();
  if (!versionsDir || !fs.existsSync(versionsDir)) return [];
  const files = fs.readdirSync(versionsDir).filter((f) => f.startsWith('meta_') && f.endsWith('.json'));
  const items = [];
  for (const f of files) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(versionsDir, f), 'utf-8'));
      items.push(meta);
    } catch {}
  }
  items.sort((a, b) => String(b.stamp || '').localeCompare(String(a.stamp || '')));
  return items;
}

function extractIconMetaFromCategoryArr(arr) {
  const items = Array.isArray(arr) ? arr : [];
  for (const p of items) {
    const looksLikeIconMeta =
      p && typeof p === 'object' &&
      typeof p.icon === 'string' && String(p.icon).trim() &&
      (!p.productLink || !String(p.productLink).trim()) &&
      (!p.name || !String(p.name).trim());
    if (looksLikeIconMeta) return String(p.icon || '').trim();
  }
  return '';
}

async function applyCatalogBundle(bundle, reason = 'catalog_bundle_apply') {
  const err = validateCatalogBundle(bundle);
  if (err) throw new Error(err);

  const rt = getCatalogBundleRuntimeState();

  rt.saveCatalogBundleToDisk(bundle);
  const cacheState = getCatalogBundleCacheState();
  const prev = cacheState.productsData || {};
  const legacyForData = rt.buildLegacyCatalogFromIds(bundle.productsById || {}, bundle.categories || {}, prev);
  setCatalogBundleProductsData(rt.normalizeCatalog(legacyForData));

  if (rt.catalogSource === 'file' && rt.getCatalogFileMode() === 'split_json' && reason === 'category_lists_update') {
    try {
      await rt.saveCatalogToDisk(getCatalogBundleCacheState().productsData, reason);
      return;
    } catch {}
  }

  const currentProductsData = getCatalogBundleCacheState().productsData || {};
  setCatalogBundleCacheArtifacts({ bundle });

  const legacy = rt.buildLegacyCatalogFromIds(bundle.productsById || {}, bundle.categories || {}, currentProductsData);
  setCatalogBundleCacheArtifacts({
    productsPayload: {
      catalog: legacy,
      config: { applyTariff: rt.applyTariffServer },
      applyTariff: rt.applyTariffServer,
    },
  });

  const productsFlat = rt.buildFlatCatalog(currentProductsData);
  setCatalogBundleCacheArtifacts({ productsFlat });

  rt.rebuildLookupMapsFromFlat();
  await rt.syncCatalogToDb(bundle);
  await rt.snapshotCatalog(reason);
}

module.exports = {
  validateCatalogBundle,
  loadCatalogBundleFromDisk,
  listCatalogVersions,
  getCatalogVersionsDir,
  extractIconMetaFromCategoryArr,
  applyCatalogBundle,
};
