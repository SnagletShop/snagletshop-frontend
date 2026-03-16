'use strict';

function validateCatalogOrThrow(catalog) {
  if (catalog === null || catalog === undefined) {
    throw new Error('catalog is null/undefined');
  }
  if (Array.isArray(catalog)) return catalog;
  if (typeof catalog === 'object') {
    if (Array.isArray(catalog.products)) return catalog;
    return catalog;
  }
  throw new Error('catalog is not an object/array');
}

function parseMaybeJson(v) {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (!s) return v;
  if (!(s.startsWith('{') || s.startsWith('['))) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

function normalizeOptionGroups(raw) {
  const v = parseMaybeJson(raw);

  if (Array.isArray(v) && v.length && v[0] && typeof v[0] === 'object' && !Array.isArray(v[0])) {
    const out = [];
    for (const g of v.slice(0, 10)) {
      const label = String(g?.label ?? g?.name ?? '').trim().replace(/:$/, '');
      const opts = Array.isArray(g?.options) ? g.options : [];
      const options = opts.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 200);
      if (!label || !options.length) continue;

      const keyBase = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\-]/g, '');
      const key = String(g?.key ?? keyBase ?? `opt${out.length + 1}`).trim().slice(0, 64) || `opt${out.length + 1}`;
      const imageByOption =
        g?.imageByOption && typeof g.imageByOption === 'object' && !Array.isArray(g.imageByOption)
          ? g.imageByOption
          : undefined;

      out.push({
        key,
        label,
        options,
        ...(imageByOption ? { imageByOption } : {}),
      });
    }
    return out;
  }

  if (Array.isArray(v) && (v.length === 0 || typeof v[0] === 'string')) {
    const arr = v.map((x) => String(x ?? '').trim()).filter(Boolean);
    if (arr.length < 2) return [];
    const label = String(arr[0] || 'Option').replace(/:$/, '').trim();
    const options = arr.slice(1);
    return [{ key: label.toLowerCase().replace(/\s+/g, '_'), label, options }];
  }

  if (Array.isArray(v) && v.length && Array.isArray(v[0])) {
    const out = [];
    for (const a of v.slice(0, 10)) {
      const arr = Array.isArray(a) ? a : [];
      const [labelRaw, ...optsRaw] = arr;
      const label = String(labelRaw ?? 'Option').trim().replace(/:$/, '');
      const options = optsRaw.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 200);
      if (!label || !options.length) continue;
      out.push({ key: label.toLowerCase().replace(/\s+/g, '_'), label, options });
    }
    return out;
  }

  return [];
}

function normalizeLegacyProductOptions(raw) {
  const v = parseMaybeJson(raw);
  if (v == null) return null;
  if (!Array.isArray(v)) return null;
  return v.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 300);
}

function coerceOptionsFromBody(body) {
  const src = body || {};
  const hasOptionGroups = Object.prototype.hasOwnProperty.call(src, 'optionGroups');
  const hasProductOptions = Object.prototype.hasOwnProperty.call(src, 'productOptions');

  let optionGroups = undefined;
  let productOptions = undefined;

  if (hasOptionGroups) {
    optionGroups = src.optionGroups === null ? null : normalizeOptionGroups(src.optionGroups);
  }

  if (hasProductOptions) {
    productOptions = src.productOptions === null ? null : normalizeLegacyProductOptions(src.productOptions);
  }

  if (hasOptionGroups && !hasProductOptions && optionGroups !== null) {
    const g = Array.isArray(optionGroups) ? optionGroups[0] : null;
    if (g && typeof g === 'object') {
      const labelRaw = String(g.label ?? g.name ?? 'Option').trim().replace(/:$/, '');
      const label = labelRaw ? `${labelRaw}:` : 'Option:';
      const opts = Array.isArray(g.options) ? g.options.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
      productOptions = opts.length ? [label, ...opts] : [];
    } else {
      productOptions = [];
    }
  }

  if (hasProductOptions && !hasOptionGroups && productOptions !== null) {
    const arr = Array.isArray(productOptions) ? productOptions : [];
    if (arr.length >= 2) {
      const label = String(arr[0] || 'Option').replace(/:$/, '').trim();
      const options = arr.slice(1).map((x) => String(x ?? '').trim()).filter(Boolean);
      optionGroups = label && options.length
        ? [{ key: label.toLowerCase().replace(/\s+/g, '_'), label, options }]
        : [];
    } else {
      optionGroups = [];
    }
  }

  return { optionGroups, productOptions };
}

function parseProductsFromJsText(text) {
  const t = String(text || '').replace(/^\uFEFF/, '').trim();
  let jsonPart = t;
  const m = t.match(/module\.exports\s*=\s*([\s\S]*?)\s*;?\s*$/);
  if (m && m[1]) jsonPart = m[1].trim();
  const obj = JSON.parse(jsonPart);
  return validateCatalogOrThrow(obj);
}

module.exports = {
  validateCatalogOrThrow,
  coerceOptionsFromBody,
  parseProductsFromJsText,
};
