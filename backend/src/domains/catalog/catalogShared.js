'use strict';

const { parseDecimalLoose } = require('../../lib/money');

function sanitizeSelectedOptions(rawSelectedOptions, legacySelectedOption) {
  const out = [];
  const arr = Array.isArray(rawSelectedOptions) ? rawSelectedOptions : [];
  for (const o of arr.slice(0, 8)) {
    const label = (o && typeof o === 'object' && !Array.isArray(o)) ? String(o.label ?? '') : String((Array.isArray(o) ? o[0] : '') ?? '');
    const value = (o && typeof o === 'object' && !Array.isArray(o)) ? String(o.value ?? '') : String((Array.isArray(o) ? o[1] : '') ?? '');
    const l = label.trim().slice(0, 60);
    const v = value.trim().slice(0, 80);
    if (!v) continue;
    out.push({ label: l, value: v });
  }
  const legacy = String(legacySelectedOption || '').trim().slice(0, 120);
  if (!out.length && legacy) out.push({ label: '', value: legacy });
  return out;
}

function formatSelectedOptionsKey(selectedOptions, legacySelectedOption) {
  const sel = sanitizeSelectedOptions(selectedOptions, legacySelectedOption);
  return sel.map((o) => {
    const l = String(o.label || '').trim().replace(/[:=|]+/g, ' ').trim();
    const v = String(o.value || '').trim().replace(/[|]+/g, ' ').trim();
    return l ? `${l}=${v}` : v;
  }).filter(Boolean).join(' | ');
}

function formatSelectedOptionSummary(selectedOptions, legacySelectedOption) {
  const arr = Array.isArray(selectedOptions) ? selectedOptions : [];
  const parts = [];
  for (const o of arr) {
    const label = String(o?.label ?? '').trim();
    const value = String(o?.value ?? '').trim();
    if (!value) continue;
    if (!label) { parts.push(value); continue; }
    const cleanLabel = label.endsWith(':') ? label.slice(0, -1) : label;
    parts.push(`${cleanLabel}: ${value}`);
  }
  if (parts.length) return parts.join(', ');
  return String(legacySelectedOption || '').trim();
}

function resolveVariantPriceEUR(product, selectedOptions, legacySelectedOption, experiments) {
  const ex = (experiments && typeof experiments === 'object') ? experiments : null;
  const useB = ex && String(ex.pr || '').toUpperCase() === 'B';

  const baseA = parseDecimalLoose(product?.price);
  const baseB = parseDecimalLoose(product?.priceB);
  const base = (useB && Number.isFinite(baseB) && baseB > 0) ? baseB : baseA;

  const mapA = (product && typeof product === 'object') ? product.variantPrices : null;
  const mapB = (product && typeof product === 'object') ? product.variantPricesB : null;
  const map = (useB && mapB && typeof mapB === 'object' && !Array.isArray(mapB)) ? mapB : mapA;
  if (!map || typeof map !== 'object' || Array.isArray(map)) return base;

  const sel = sanitizeSelectedOptions(selectedOptions, legacySelectedOption);
  const candidates = [];
  const fullKey = sel.length ? formatSelectedOptionsKey(sel, '') : '';
  if (fullKey) candidates.push(fullKey);
  if (sel.length) {
    const vOnly = sel.map((o) => String(o.value || '').trim()).filter(Boolean).join(' | ');
    if (vOnly && vOnly !== fullKey) candidates.push(vOnly);
  }
  if (sel.length === 1) {
    const l = String(sel[0].label || '').trim();
    const v = String(sel[0].value || '').trim();
    if (l && v) candidates.push(`${l}=${v}`);
    if (v) candidates.push(v);
  }
  const legacy = String(legacySelectedOption || '').trim();
  if (legacy) candidates.push(legacy);
  for (const k of candidates) {
    const key = String(k || '').trim();
    if (!key) continue;
    const num = parseDecimalLoose(map[key]);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return base;
}

function getCatalogProductRef(clientItem, deps) {
  const productsById = deps?.productsById;
  const productsByCanonLink = deps?.productsByCanonLink;
  const productsByLink = deps?.productsByLink;
  const productsByName = deps?.productsByName;
  const canonicalizeProductLink = deps?.canonicalizeProductLink;
  const allowByName = !!deps?.allowLookupByName;

  const productId = String(clientItem?.productId || clientItem?.id || clientItem?.pid || '').trim();
  const productLink = String(clientItem?.productLink || '').trim();
  const canonicalLink = (typeof canonicalizeProductLink === 'function') ? canonicalizeProductLink(productLink) : productLink;
  const name = String(clientItem?.name || '').trim();

  if (productId && productsById?.has?.(productId)) return productsById.get(productId);
  if (canonicalLink && productsByCanonLink?.has?.(canonicalLink)) return productsByCanonLink.get(canonicalLink);
  if (productLink && productsByLink?.has?.(productLink)) return productsByLink.get(productLink);
  if (name && allowByName && productsByName?.has?.(name)) return productsByName.get(name);
  return null;
}

function requireCatalogProductRef(clientItem, deps) {
  const hit = getCatalogProductRef(clientItem, deps);
  if (hit) return hit;
  const ref = String(clientItem?.productLink || clientItem?.name || '').trim() || 'unknown';
  const err = new Error(`PRODUCT_NOT_FOUND: ${ref}`);
  err.code = 'PRODUCT_NOT_FOUND';
  err.ref = ref;
  throw err;
}

module.exports = {
  sanitizeSelectedOptions,
  formatSelectedOptionSummary,
  formatSelectedOptionsKey,
  resolveVariantPriceEUR,
  getCatalogProductRef,
  requireCatalogProductRef,
};
