'use strict';

const { domain, requireValue, mergeDomain } = require('./runtimeResolver');

function catalog() {
  return domain('catalog') || {};
}

function getCatalogReloadState() {
  const runtime = catalog();
  return {
    buildLegacyCatalogFromIds: requireValue('catalog.buildLegacyCatalogFromIds', runtime.buildLegacyCatalogFromIds),
    normalizeCatalog: requireValue('catalog.normalizeCatalog', runtime.normalizeCatalog),
    setCatalogInMemory: requireValue('catalog.setCatalogInMemory', runtime.setCatalogInMemory),
    saveCatalogToDiskFireAndForget: runtime.saveCatalogToDiskFireAndForget || null,
    loadProducts: requireValue('catalog.loadProducts', runtime.loadProducts),
  };
}

function syncCatalogReloadRuntimeFromGlobals() {
  const runtime = catalog();
  mergeDomain('catalog', {
    buildLegacyCatalogFromIds: runtime.buildLegacyCatalogFromIds || null,
    normalizeCatalog: runtime.normalizeCatalog || null,
    setCatalogInMemory: runtime.setCatalogInMemory || null,
    saveCatalogToDiskFireAndForget: runtime.saveCatalogToDiskFireAndForget || null,
    loadProducts: runtime.loadProducts || null,
  });
  return domain('catalog');
}

module.exports = {
  getCatalogReloadState,
  syncCatalogReloadRuntimeFromGlobals,
};
