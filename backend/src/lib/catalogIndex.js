'use strict';

const { getCatalogIndexRuntimeState, setCatalogLookupCaches, setCatalogIndexCache } = require('./catalogIndexState');

function repairProductId(id) {
  const s = String(id || '').trim();
  if (!s) return '';
  const m = s.match(/^\[object\s+\w+\]_(.+)$/);
  if (m && m[1]) return String(m[1]).trim();
  return s;
}

function rebuildCatalogIndexes(data) {
  const productsById = {};
  const categoryIdLists = {};
  const idToCategory = {};

  for (const [cat, arr] of Object.entries(data || {})) {
    const list = [];
    const items = Array.isArray(arr) ? arr : [];
    for (const p of items) {
      const looksLikeIconMeta =
        p && typeof p === 'object' &&
        typeof p.icon === 'string' && String(p.icon).trim() &&
        (!p.productLink || !String(p.productLink).trim()) &&
        (!p.name || !String(p.name).trim());
      if (looksLikeIconMeta) continue;
      if (!p || typeof p !== 'object') continue;
      const pid = repairProductId(p.productId);
      if (pid && String(p.productId || '').trim() !== pid) p.productId = pid;
      if (!pid) continue;
      productsById[pid] = p;
      if (!idToCategory[pid]) idToCategory[pid] = String(cat);
      if (!Array.isArray(p.categories) || !p.categories.length) p.categories = [String(cat)];
      list.push(pid);
    }
    categoryIdLists[cat] = list;
  }

  setCatalogLookupCaches(productsById, categoryIdLists);

  return { productsById, categoryIdLists, idToCategory };
}

function getCatalogIndexState() {
  return getCatalogIndexRuntimeState();
}

function setCatalogIndexState(idx) {
  return setCatalogIndexCache(idx);
}

module.exports = {
  repairProductId,
  rebuildCatalogIndexes,
  getCatalogIndexState,
  setCatalogIndexState,
};
