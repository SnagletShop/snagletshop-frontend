'use strict';

const { getRuntime } = require('../app/runtime/runtimeContainer');
const { mergeDomain, array, text, object } = require('./runtimeResolver');

function getCatalogRuntime() {
  return getRuntime()?.catalog || {};
}

function syncCatalogRuntimeFromGlobals() {
  const runtime = getCatalogRuntime();
  return mergeDomain('catalog', {
    productsData: object(runtime.productsData, {}),
    CATALOG_SOURCE: text(runtime.CATALOG_SOURCE || '', ''),
    LOCAL_PRODUCTS_PATH: text(runtime.LOCAL_PRODUCTS_PATH || '', ''),
    DATA_DIR: text(runtime.DATA_DIR || '', ''),
    productsFlatCache: array(runtime.productsFlatCache, []),
    productsFlatJsonCache: text(runtime.productsFlatJsonCache || '[]', '[]'),
    productsById: object(runtime.productsById, {}),
    productsByCanonLink: object(runtime.productsByCanonLink, {}),
    productsByLink: object(runtime.productsByLink, {}),
    productsByName: object(runtime.productsByName, {}),
    canonicalizeProductLink: typeof runtime.canonicalizeProductLink === 'function' ? runtime.canonicalizeProductLink : null,
  });
}

function getProductsData() {
  return getCatalogRuntime().productsData || {};
}

function getCatalogSource() {
  return text(getCatalogRuntime().CATALOG_SOURCE || '', '');
}

function getLocalProductsPath() {
  return text(getCatalogRuntime().LOCAL_PRODUCTS_PATH || '', '');
}

function getDataDir() {
  return text(getCatalogRuntime().DATA_DIR || '', '');
}

function getProductsFlatState() {
  const runtime = getCatalogRuntime();
  return {
    productsFlatCache: array(runtime.productsFlatCache, []),
    productsFlatJsonCache: text(runtime.productsFlatJsonCache || '[]', '[]'),
  };
}

function getCatalogLookupMaps() {
  const runtime = getCatalogRuntime();
  return {
    productsById: runtime.productsById || {},
    productsByCanonLink: runtime.productsByCanonLink || {},
    productsByLink: runtime.productsByLink || {},
    productsByName: runtime.productsByName || {},
    canonicalizeProductLink: runtime.canonicalizeProductLink || null,
  };
}

module.exports = {
  getProductsData,
  getCatalogSource,
  getLocalProductsPath,
  getDataDir,
  getProductsFlatState,
  getCatalogLookupMaps,
  syncCatalogRuntimeFromGlobals,
};
