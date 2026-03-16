'use strict';

function isLegacyOrUrlDerivedProductId(id) {
  const s = String(id || '').trim();
  if (!s) return false;
  if (/^\[object\s+\w+\]_/.test(s)) return true;
  if (/^https?:\/\//i.test(s)) return true;
  if (/[\/:]/.test(s)) return true;
  if (/\.(com|net|org|sk|cz|de|fr|it|es|co|io)(\/|$)/i.test(s)) return true;
  return false;
}

function generateUniqueProductId(takenOrPrefix = 'P') {
  let prefix = 'P';
  let taken = null;
  if (takenOrPrefix instanceof Set) {
    taken = takenOrPrefix;
  } else if (typeof takenOrPrefix === 'string' && takenOrPrefix.trim()) {
    prefix = takenOrPrefix.trim();
  }
  while (true) {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 10);
    const id = `${prefix}_${ts}_${rnd}`;
    if (!taken || !taken.has(id)) return id;
  }
}

function sanitizeVariantPrices(p) {
  const toNum = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const clamp2 = (n) => Math.round(n * 100) / 100;

  try {
    if (!p || typeof p !== 'object') return p;

    const fixOptionArr = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const o of arr) {
        if (!o || typeof o !== 'object') continue;
        if ('price' in o) o.price = clamp2(toNum(o.price));
        if ('sellPrice' in o) o.sellPrice = clamp2(toNum(o.sellPrice));
        if ('purchasePrice' in o) o.purchasePrice = clamp2(toNum(o.purchasePrice));
        if ('addPrice' in o) o.addPrice = clamp2(toNum(o.addPrice));
        if ('shipping' in o) o.shipping = clamp2(toNum(o.shipping));
      }
    };

    if ('price' in p) p.price = clamp2(toNum(p.price));
    if ('sellPrice' in p) p.sellPrice = clamp2(toNum(p.sellPrice));
    if ('purchasePrice' in p) p.purchasePrice = clamp2(toNum(p.purchasePrice));
    if ('shipping' in p) p.shipping = clamp2(toNum(p.shipping));

    if (Array.isArray(p.options)) {
      fixOptionArr(p.options);
    } else if (p.options && typeof p.options === 'object') {
      for (const k of Object.keys(p.options)) fixOptionArr(p.options[k]);
    }

    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        if (!v || typeof v !== 'object') continue;
        if ('price' in v) v.price = clamp2(toNum(v.price));
        if ('sellPrice' in v) v.sellPrice = clamp2(toNum(v.sellPrice));
        if ('purchasePrice' in v) v.purchasePrice = clamp2(toNum(v.purchasePrice));
        if ('shipping' in v) v.shipping = clamp2(toNum(v.shipping));
        if ('options' in v) fixOptionArr(v.options);
      }
    }
    return p;
  } catch {
    return p;
  }
}

async function renameProductId(productsData, oldId, newId, saveCatalogToDisk) {
  oldId = String(oldId || '').trim();
  newId = String(newId || '').trim();
  if (!oldId || !newId) throw new Error('oldId/newId required');
  if (oldId === newId) return 0;

  for (const arr of Object.values(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue;
      if (String(p.productId || '').trim() === newId) {
        throw new Error('new productId already exists');
      }
    }
  }

  let renamed = 0;
  for (const arr of Object.values(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue;
      if (String(p.productId || '').trim() === oldId) {
        p.productId = newId;
        renamed++;
      }
    }
  }

  if (!renamed) throw new Error('product not found');
  await saveCatalogToDisk(productsData, `rename_${oldId}_to_${newId}`);
  return renamed;
}

module.exports = {
  isLegacyOrUrlDerivedProductId,
  generateUniqueProductId,
  sanitizeVariantPrices,
  renameProductId,
};
