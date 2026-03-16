'use strict';

const { getCatalogCrudState } = require('../../lib/catalogOpsState');
const { rebuildCatalogIndexes } = require('../../lib/catalogIndex');
const { parseDecimalLoose } = require('../../lib/money');
const { coerceOptionsFromBody, parseProductsFromJsText, validateCatalogOrThrow } = require('../../lib/catalogCrud');
const { getProductsData, getCatalogSource, getLocalProductsPath } = require('../../lib/catalogState');
const { getCatalogFileMode, setCatalogFileMode, getCatalogSplitDir, getCatalogSplitProductsFile, getCatalogSplitCategoriesFile } = require('../../lib/catalogFileMode');
const { writeSplitCatalogFiles, reloadCatalogFromSplitDisk, reloadCatalogFromDisk } = require('../../lib/catalogReload');
const { startSplitCatalogAutoRefresh, startCatalogAutoRefresh } = require('../../lib/catalogWatch');
const { canonicalizeProductLink } = require('../../lib/catalogLinks');
const { isLegacyOrUrlDerivedProductId, generateUniqueProductId, sanitizeVariantPrices } = require('../../lib/catalogMutations');

const fs = require('fs');

function requireCatalogCrudModeRuntime() {
  return getCatalogCrudState();
}

function cloneCatalogData(productsData) {
  return JSON.parse(JSON.stringify(productsData || {}));
}

function renameProductIdInMemory(productsData, oldId, newId) {
  oldId = String(oldId || '').trim();
  newId = String(newId || '').trim();
  if (!oldId || !newId) throw new Error('oldId/newId required');
  if (oldId === newId) return 0;

  for (const arr of Object.values(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue;
      if (String(p.productId || '').trim() === newId) throw new Error('new productId already exists');
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
  return renamed;
}

function applyEditableFields(target, payload) {
  const runtime = getCatalogCrudState();
  const body = payload || {};

  const name = body.name != null ? String(body.name) : null;
  const productLink = body.productLink != null ? String(body.productLink) : null;
  const canonicalLink = productLink ? canonicalizeProductLink(productLink) : null;
  const nameB = body.nameB != null ? String(body.nameB) : null;
  const description = body.description != null ? String(body.description) : null;
  const descriptionB = body.descriptionB != null ? String(body.descriptionB) : null;
  const deliveryText = body.deliveryText != null ? String(body.deliveryText) : null;
  const deliveryTextB = body.deliveryTextB != null ? String(body.deliveryTextB) : null;

  const sellingPrice = body.price != null ? body.price : (body.sellingPriceEUR != null ? body.sellingPriceEUR : null);
  const sellingPriceB = body.priceB != null ? body.priceB : null;
  const purchasePrice = body.expectedPurchasePrice != null ? body.expectedPurchasePrice : (body.purchasePriceEUR != null ? body.purchasePriceEUR : null);

  let images = null;
  if (Array.isArray(body.images)) images = body.images.map((x) => String(x || '').trim()).filter(Boolean);
  else if (typeof body.images === 'string') images = String(body.images).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

  const hasVariantPrices = Object.prototype.hasOwnProperty.call(body, 'variantPrices');
  let variantPrices = undefined;
  if (hasVariantPrices) {
    if (body.variantPrices === null) variantPrices = null;
    else variantPrices = sanitizeVariantPrices(body.variantPrices);
    if (variantPrices === undefined) variantPrices = null;
  }

  const hasVariantPricesB = Object.prototype.hasOwnProperty.call(body, 'variantPricesB');
  let variantPricesB = undefined;
  if (hasVariantPricesB) {
    if (body.variantPricesB === null) variantPricesB = null;
    else variantPricesB = sanitizeVariantPrices(body.variantPricesB);
    if (variantPricesB === undefined) variantPricesB = null;
  }

  const hasVariantPurchasePrices = Object.prototype.hasOwnProperty.call(body, 'variantPurchasePrices');
  let variantPurchasePrices = undefined;
  if (hasVariantPurchasePrices) {
    if (body.variantPurchasePrices === null) variantPurchasePrices = null;
    else variantPurchasePrices = sanitizeVariantPrices(body.variantPurchasePrices);
    if (variantPurchasePrices === undefined) variantPurchasePrices = null;
  }

  const hasPricedOptionGroup = Object.prototype.hasOwnProperty.call(body, 'pricedOptionGroup') || Object.prototype.hasOwnProperty.call(body, 'pricedOptionCategory');
  let pricedOptionGroup = undefined;
  if (hasPricedOptionGroup) {
    const raw = Object.prototype.hasOwnProperty.call(body, 'pricedOptionGroup') ? body.pricedOptionGroup : body.pricedOptionCategory;
    if (raw === null) pricedOptionGroup = null;
    else {
      const s = String(raw ?? '').trim();
      pricedOptionGroup = s || null;
    }
  }

  let optionGroups = undefined;
  let productOptions = undefined;
  const coerced = coerceOptionsFromBody(body);
  optionGroups = coerced.optionGroups;
  productOptions = coerced.productOptions;
  const rawStr = JSON.stringify({ optionGroups, productOptions });
  if (rawStr && rawStr.length > 30000) {
    const err = new Error('options too large');
    err.code = 'OPTIONS_TOO_LARGE';
    throw err;
  }

  if (name !== null) target.name = name;
  if (nameB !== null) target.nameB = nameB;
  if (productLink !== null) target.productLink = productLink;
  if (canonicalLink !== null) target.canonicalLink = canonicalLink;
  if (description !== null) target.description = description;
  if (descriptionB !== null) target.descriptionB = descriptionB;
  if (deliveryText !== null) target.deliveryText = deliveryText;
  if (deliveryTextB !== null) target.deliveryTextB = deliveryTextB;
  if (sellingPrice !== null && sellingPrice !== '') target.price = Number(sellingPrice) || 0;
  if (sellingPriceB !== null && sellingPriceB !== '') target.priceB = Number(sellingPriceB) || 0;
  if (purchasePrice !== null && purchasePrice !== '') target.expectedPurchasePrice = parseDecimalLoose(purchasePrice);

  if (images !== null) {
    if (Array.isArray(target.images) || target.images === undefined) target.images = images;
    else if (Array.isArray(target.imageLinks) || target.imageLinks === undefined) target.imageLinks = images;
    else target.images = images;
  }

  if (variantPrices !== undefined) {
    if (variantPrices === null) delete target.variantPrices;
    else target.variantPrices = variantPrices;
  }
  if (variantPricesB !== undefined) {
    if (variantPricesB === null) delete target.variantPricesB;
    else target.variantPricesB = variantPricesB;
  }
  if (variantPurchasePrices !== undefined) {
    if (variantPurchasePrices === null) delete target.variantPurchasePrices;
    else target.variantPurchasePrices = variantPurchasePrices;
  }
  if (pricedOptionGroup !== undefined) {
    if (pricedOptionGroup === null) {
      delete target.pricedOptionGroup;
      delete target.pricedOptionCategory;
    } else {
      target.pricedOptionGroup = pricedOptionGroup;
      target.pricedOptionCategory = pricedOptionGroup;
    }
  }
  if (optionGroups !== undefined) {
    if (optionGroups === null) delete target.optionGroups;
    else target.optionGroups = optionGroups;
  }
  if (productOptions !== undefined) {
    if (productOptions === null) delete target.productOptions;
    else target.productOptions = productOptions;
  }
}

async function handleAdminProductsCreate(req, res) {
  try {
    const runtime = getCatalogCrudState();
    const body = req.body || {};
    let categories = body.categories;
    if (!Array.isArray(categories) || !categories.length) {
      const single = String(body.category || '').trim();
      categories = single ? [single] : [];
    }
    categories = categories.map((c) => String(c || '').trim()).filter(Boolean);
    if (!categories.length) return res.status(400).json({ error: 'categories required' });

    const name = String(body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    const productLink = body.productLink != null ? String(body.productLink).trim() : '';
    const canonicalLink = canonicalizeProductLink(productLink);
    const idx = rebuildCatalogIndexes(getProductsData() || {});
    const taken = new Set(Object.keys(idx.productsById || {}));
    let productId = String(body.productId || '').trim();
    const providedIsValid = productId && !isLegacyOrUrlDerivedProductId(productId, productLink, canonicalLink);
    if (providedIsValid) {
      if (taken.has(productId)) return res.status(400).json({ error: 'productId already exists' });
      taken.add(productId);
    } else {
      productId = generateUniqueProductId(taken);
    }

    const price = parseDecimalLoose(body.price);
    const priceB = parseDecimalLoose(body.priceB);
    const expectedPurchasePrice = parseDecimalLoose(body.expectedPurchasePrice);
    const variantPrices = sanitizeVariantPrices(body.variantPrices);
    const variantPricesB = sanitizeVariantPrices(body.variantPricesB);
    const variantPurchasePrices = sanitizeVariantPrices(body.variantPurchasePrices);
    const pricedOptionGroupRaw = body.pricedOptionGroup != null ? body.pricedOptionGroup : body.pricedOptionCategory;
    const pricedOptionGroup = pricedOptionGroupRaw != null ? String(pricedOptionGroupRaw).trim() : '';
    const description = body.description != null ? String(body.description) : '';
    const nameB = body.nameB != null ? String(body.nameB) : '';
    const descriptionB = body.descriptionB != null ? String(body.descriptionB) : '';
    const deliveryText = body.deliveryText != null ? String(body.deliveryText) : '';
    const deliveryTextB = body.deliveryTextB != null ? String(body.deliveryTextB) : '';

    let images = [];
    if (Array.isArray(body.images)) images = body.images.map((x) => String(x || '').trim()).filter(Boolean);
    if (typeof body.images === 'string') images = String(body.images).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (typeof body.image === 'string' && body.image.trim()) images.unshift(body.image.trim());
    let imagesB = [];
    if (Array.isArray(body.imagesB)) imagesB = body.imagesB.map((x) => String(x || '').trim()).filter(Boolean);
    if (typeof body.imagesB === 'string') imagesB = String(body.imagesB).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const imageB = body.imageB != null ? String(body.imageB || '').trim() : '';
    if (imageB) imagesB.unshift(imageB);
    images = Array.from(new Set(images));
    imagesB = Array.from(new Set(imagesB));

    let optionGroups;
    let productOptions;
    try {
      const coerced = coerceOptionsFromBody(body);
      optionGroups = coerced.optionGroups;
      productOptions = coerced.productOptions;
      if (optionGroups === null) optionGroups = undefined;
      if (productOptions === null) productOptions = undefined;
      const rawStr = JSON.stringify({ optionGroups, productOptions });
      if (rawStr && rawStr.length > 30000) return res.status(400).json({ error: 'options too large' });
    } catch (e) {
      return res.status(400).json({ error: String(e?.message || e) });
    }

    const product = runtime.normalizeCatalog({
      _tmp: [{
        name,
        productLink,
        canonicalLink,
        productId,
        price,
        ...(Number.isFinite(priceB) && priceB > 0 ? { priceB } : {}),
        expectedPurchasePrice,
        description,
        ...(nameB ? { nameB } : {}),
        ...(descriptionB ? { descriptionB } : {}),
        ...(deliveryText ? { deliveryText } : {}),
        ...(deliveryTextB ? { deliveryTextB } : {}),
        images,
        ...(imagesB && imagesB.length ? { imagesB } : {}),
        ...(imageB ? { imageB } : {}),
        ...(variantPrices !== undefined ? { variantPrices } : {}),
        ...(variantPricesB !== undefined ? { variantPricesB } : {}),
        ...(variantPurchasePrices !== undefined ? { variantPurchasePrices } : {}),
        ...(pricedOptionGroup ? { pricedOptionGroup, pricedOptionCategory: pricedOptionGroup } : {}),
        ...(productOptions !== undefined ? { productOptions } : {}),
        ...(optionGroups !== undefined ? { optionGroups } : {}),
      }],
    })._tmp[0];

    const productsData = cloneCatalogData(getProductsData() || {});
    for (const category of categories) {
      if (!productsData[category]) productsData[category] = [];
      const arr = Array.isArray(productsData[category]) ? productsData[category] : [];
      if (arr.some((x) => x && typeof x === 'object' && String(x.productId || '').trim() === productId)) continue;
      const hasIconMeta = arr.length && arr[0] && typeof arr[0] === 'object' && typeof arr[0].icon === 'string' && String(arr[0].icon).trim() && (!arr[0].productLink || !String(arr[0].productLink).trim()) && (!arr[0].name || !String(arr[0].name).trim());
      const prodCopy = { ...product };
      productsData[category] = hasIconMeta ? [arr[0], ...arr.slice(1), prodCopy] : [...arr, prodCopy];
    }

    try {
      await runtime.saveCatalogToDisk(productsData, 'product_create');
    } catch (e) {
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }
    runtime.tombstoneRemove(productId);
    return res.json({ ok: true, productId });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminProductsPatch(req, res) {
  try {
    const runtime = getCatalogCrudState();
    const id = String(req.params.productId || '').trim();
    const newProductId = req.body?.newProductId != null ? String(req.body.newProductId).trim() : null;
    if (!id) return res.status(400).json({ error: 'productId required' });
    const body = req.body || {};
    const categoriesReq = Array.isArray(body.categories) ? body.categories.map((c) => String(c || '').trim()).filter(Boolean) : null;

    const productsData = cloneCatalogData(getProductsData() || {});
    let effectiveId = id;
    if (newProductId && newProductId !== id) {
      try {
        renameProductIdInMemory(productsData, id, newProductId);
        effectiveId = newProductId;
      } catch (e) {
        return res.status(400).json({ error: String(e?.message || e) });
      }
    }

    let updated = 0;
    try {
      for (const arr of Object.values(productsData || {})) {
        if (!Array.isArray(arr)) continue;
        for (const p of arr) {
          if (!p || typeof p !== 'object') continue;
          if (String(p.productId || '').trim() !== effectiveId) continue;
          applyEditableFields(p, body);
          updated++;
        }
      }
    } catch (e) {
      return res.status(400).json({ error: String(e?.message || e) });
    }

    if (categoriesReq) {
      let templateProd = null;
      for (const [cat, arr] of Object.entries(productsData || {})) {
        if (!Array.isArray(arr)) continue;
        const kept = [];
        for (const p of arr) {
          if (!p || typeof p !== 'object') { kept.push(p); continue; }
          if (String(p.productId || '').trim() === effectiveId) {
            if (!templateProd) templateProd = JSON.parse(JSON.stringify(p));
            continue;
          }
          kept.push(p);
        }
        productsData[cat] = kept;
      }
      for (const cat of categoriesReq) {
        if (!productsData[cat]) productsData[cat] = [];
        const arr = Array.isArray(productsData[cat]) ? productsData[cat] : [];
        const hasIconMeta = arr.length && arr[0] && typeof arr[0] === 'object' && typeof arr[0].icon === 'string' && String(arr[0].icon).trim() && (!arr[0].productLink || !String(arr[0].productLink).trim()) && (!arr[0].name || !String(arr[0].name).trim());
        const prodCopy = { ...(templateProd || { productId: effectiveId, name: body.name || '' }) };
        prodCopy.productId = effectiveId;
        try { applyEditableFields(prodCopy, body); } catch (e) { return res.status(400).json({ error: String(e?.message || e) }); }
        productsData[cat] = hasIconMeta ? [arr[0], ...arr.slice(1), prodCopy] : [...arr, prodCopy];
      }
    }

    if (!updated) return res.status(404).json({ error: 'product not found' });
    try {
      await runtime.saveCatalogToDisk(productsData, 'change');
    } catch (e) {
      if (e && e.code === 'INVALID_CATALOG') {
        return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }
    return res.json({ ok: true, updated, productId: effectiveId });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

async function handleAdminCatalogFilemodeGet(_req, res) {
  const runtime = getCatalogCrudState();
  return res.json({
    ok: true,
    catalogSource: getCatalogSource(),
    mode: getCatalogFileMode(),
    modes: ['products_js', 'split_json'],
    splitFiles: {
      dir: getCatalogSplitDir(),
      products: fs.existsSync(getCatalogSplitProductsFile()),
      categories: fs.existsSync(getCatalogSplitCategoriesFile()),
    },
  });
}

async function handleAdminCatalogFilemodePost(req, res) {
  try {
    if (getCatalogSource() !== 'file') {
      return res.status(409).json({ error: 'CATALOG_SOURCE is not file; set CATALOG_SOURCE=file to use filemode switching.' });
    }
    const requestedMode = String(req.body?.mode || '').trim();
    if (!['products_js', 'split_json'].includes(requestedMode)) {
      return res.status(400).json({ error: 'mode must be one of: products_js, split_json' });
    }

    if (requestedMode === 'split_json') {
      if (!fs.existsSync(getCatalogSplitProductsFile()) || !fs.existsSync(getCatalogSplitCategoriesFile())) {
        writeSplitCatalogFiles(getProductsData() || {}, getCatalogSplitProductsFile(), getCatalogSplitCategoriesFile());
      }
      reloadCatalogFromSplitDisk(getCatalogSplitProductsFile(), getCatalogSplitCategoriesFile(), 'admin:filemode:set');
      startSplitCatalogAutoRefresh();
    } else {
      reloadCatalogFromDisk('admin:filemode:set');
      startCatalogAutoRefresh();
    }

    setCatalogFileMode(requestedMode);
    return res.json({ ok: true, mode: getCatalogFileMode() });
  } catch (e) {
    return res.status(400).json({ error: String(e?.message || e) });
  }
}

async function handleAdminCatalogConvertToSplit(_req, res) {
  try {
    const runtime = getCatalogCrudState();
    try { fs.mkdirSync(getCatalogSplitDir(), { recursive: true }); } catch (_) {}
    let data = null;
    if (fs.existsSync(getLocalProductsPath())) {
      const jsText = fs.readFileSync(getLocalProductsPath(), 'utf-8');
      try { data = parseProductsFromJsText(jsText); }
      catch (_) {
        try { data = runtime.requireFresh(getLocalProductsPath()); } catch (_) {}
      }
    }
    if (!data) data = getProductsData() || {};
    const normalized = runtime.normalizeCatalog(data);
    validateCatalogOrThrow(normalized, 'admin:convert:to-split');
    const out = writeSplitCatalogFiles(normalized, getCatalogSplitProductsFile(), getCatalogSplitCategoriesFile());
    return res.json({
      ok: true,
      mode: getCatalogFileMode(),
      products: Array.isArray(out.productsRows) ? out.productsRows.length : 0,
      categories: Object.keys(out.categoryIdLists || {}).length,
    });
  } catch (e) {
    const runtime = getCatalogCrudState();
    if (e && e.code === 'INVALID_CATALOG') {
      return res.status(400).json({ error: 'INVALID_CATALOG', issues: (e.issues || []).slice(0, runtime.ZOD_ERR_MAX) });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

module.exports = {
  requireCatalogCrudModeRuntime,
  handleAdminProductsCreate,
  handleAdminProductsPatch,
  handleAdminCatalogFilemodeGet,
  handleAdminCatalogFilemodePost,
  handleAdminCatalogConvertToSplit,
};
