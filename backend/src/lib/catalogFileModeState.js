'use strict';

const { domain, text, mergeDomain } = require('./runtimeResolver');

function catalog() {
  return domain('catalog') || {};
}

function getCatalogFileModeState() {
  const runtime = catalog();
  return {
    mode: text(runtime.CATALOG_FILE_MODE || 'products_js') || 'products_js',
    splitDir: text(runtime.CATALOG_SPLIT_DIR || ''),
    splitProductsFile: text(runtime.CATALOG_SPLIT_PRODUCTS_FILE || ''),
    splitCategoriesFile: text(runtime.CATALOG_SPLIT_CATEGORIES_FILE || ''),
    filemodePath: text(runtime.CATALOG_FILEMODE_PATH || ''),
  };
}

function setCatalogFileModeState(mode) {
  const m = text(mode);
  mergeDomain('catalog', { CATALOG_FILE_MODE: m });
  return m;
}

function syncCatalogFileModeRuntimeFromGlobals() {
  const runtime = catalog();
  mergeDomain('catalog', {
    CATALOG_FILE_MODE: text(runtime.CATALOG_FILE_MODE || 'products_js') || 'products_js',
    CATALOG_SPLIT_DIR: text(runtime.CATALOG_SPLIT_DIR || ''),
    CATALOG_SPLIT_PRODUCTS_FILE: text(runtime.CATALOG_SPLIT_PRODUCTS_FILE || ''),
    CATALOG_SPLIT_CATEGORIES_FILE: text(runtime.CATALOG_SPLIT_CATEGORIES_FILE || ''),
    CATALOG_FILEMODE_PATH: text(runtime.CATALOG_FILEMODE_PATH || ''),
  });
  return domain('catalog');
}

module.exports = {
  getCatalogFileModeState,
  setCatalogFileModeState,
  syncCatalogFileModeRuntimeFromGlobals,
};
