'use strict';

const fs = require('fs');
const { getCatalogFileMode, getCatalogSplitDir, getCatalogSplitProductsFile, getCatalogSplitCategoriesFile } = require('./catalogFileMode');
const { getLocalProductsPath } = require('./catalogState');
const { reloadCatalogFromSplitDisk, reloadCatalogFromDisk } = require('./catalogReload');

let catalogWatchStarted = false;
let catalogReloadTimer = null;
let splitWatchStarted = false;
let splitReloadTimer = null;

function startCatalogAutoRefresh() {
  if (catalogWatchStarted) return;
  catalogWatchStarted = true;

  const localProductsPath = getLocalProductsPath();
  try {
    fs.watchFile(localProductsPath, { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      if (getCatalogFileMode() !== 'products_js') return;

      if (catalogReloadTimer) clearTimeout(catalogReloadTimer);
      catalogReloadTimer = setTimeout(() => {
        try {
          reloadCatalogFromDisk('watchFile change');
        } catch (e) {
          console.warn('[catalog] reload after change failed:', e?.message || e);
        }
      }, 250);
    });

    console.log(`[catalog] auto-refresh enabled (watching ${localProductsPath})`);
  } catch (e) {
    console.warn('[catalog] failed to start auto-refresh:', e?.message || e);
  }
}

function startSplitCatalogAutoRefresh() {
  if (splitWatchStarted) return;
  splitWatchStarted = true;

  try { fs.mkdirSync(getCatalogSplitDir(), { recursive: true }); } catch (_) {}

  const onChange = () => {
    if (getCatalogFileMode() !== 'split_json') return;
    if (splitReloadTimer) clearTimeout(splitReloadTimer);
    splitReloadTimer = setTimeout(() => {
      try {
        reloadCatalogFromSplitDisk(getCatalogSplitProductsFile(), getCatalogSplitCategoriesFile(), 'watch:split');
        console.log('[catalog] reloaded from split files (watch)');
      } catch (e) {
        console.warn('[catalog] split watch reload failed:', e?.message || e);
      }
    }, 150);
  };

  try {
    fs.watchFile(getCatalogSplitProductsFile(), { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      onChange();
    });
  } catch (_) {}

  try {
    fs.watchFile(getCatalogSplitCategoriesFile(), { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      onChange();
    });
  } catch (_) {}
}

module.exports = {
  startCatalogAutoRefresh,
  startSplitCatalogAutoRefresh,
};
