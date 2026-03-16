'use strict';

const { domain, object, number, mergeDomain } = require('./runtimeResolver');

function catalog() {
  return domain('catalog') || {};
}

function getCatalogIndexRuntimeState() {
  const runtime = catalog();
  return {
    productsByIdCache: object(runtime.productsByIdCache, {}),
    categoryIdListsCache: object(runtime.categoryIdListsCache, {}),
    catalogIndexCache: runtime.catalogIndexCache || null,
    catalogIndexCacheAt: number(runtime.catalogIndexCacheAt, 0),
    productsData: object(runtime.productsData, {}),
  };
}

function setCatalogLookupCaches(productsById, categoryIdLists) {
  const nextProductsById = object(productsById, {});
  const nextCategoryIdLists = object(categoryIdLists, {});
  mergeDomain('catalog', { productsByIdCache: nextProductsById, categoryIdListsCache: nextCategoryIdLists });
  return { productsById: nextProductsById, categoryIdLists: nextCategoryIdLists };
}

function setCatalogIndexCache(idx) {
  const next = idx || null;
  const at = Date.now();
  mergeDomain('catalog', { catalogIndexCache: next, catalogIndexCacheAt: at });
  return next;
}

function setProductsData(data) {
  const next = object(data, {});
  mergeDomain('catalog', { productsData: next });
  return next;
}

function syncCatalogIndexRuntimeFromGlobals() {
  const runtime = catalog();
  mergeDomain('catalog', {
    productsByIdCache: object(runtime.productsByIdCache, {}),
    categoryIdListsCache: object(runtime.categoryIdListsCache, {}),
    catalogIndexCache: runtime.catalogIndexCache || null,
    catalogIndexCacheAt: number(runtime.catalogIndexCacheAt, 0),
    productsData: object(runtime.productsData, {}),
  });
  return domain('catalog');
}

module.exports = {
  getCatalogIndexRuntimeState,
  setCatalogLookupCaches,
  setCatalogIndexCache,
  setProductsData,
  syncCatalogIndexRuntimeFromGlobals,
};
