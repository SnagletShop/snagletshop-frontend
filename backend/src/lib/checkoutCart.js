'use strict';

const { parseDecimalLoose, round2 } = require('./money');
const { recoParseDiscountToken, recoDiscountTokenHash } = require('./growth');
const { sanitizeSelectedOptions, formatSelectedOptionSummary, resolveVariantPriceEUR, requireCatalogProductRef } = require('../domains/catalog/catalogShared');

async function normalizeCheckoutItems({
  itemsIn,
  experimentsServer,
  productsById,
  productsByCanonLink,
  productsByLink,
  productsByName,
  canonicalizeProductLink,
  allowLookupByName,
  recoDiscountEnabled,
  recoDiscountMinPct,
  recoDiscountMaxPct,
  recoDiscountMinMarginPct,
  RecoDiscountRedemption,
}) {
  const normalizedItems = [];
  let itemsTotalBeforeAnyDiscountsEUR = 0;
  let itemsTotalAfterItemDiscountsEUR = 0;

  for (const p of (itemsIn || []).slice(0, 200)) {
    const qty = Math.min(50, Math.max(1, parseInt(p?.quantity ?? 1, 10) || 1));
    const legacySelectedOption = String(p?.selectedOption || '').slice(0, 120);
    const selectedOptions = sanitizeSelectedOptions(p?.selectedOptions, legacySelectedOption);
    const selectedOption = String(formatSelectedOptionSummary(selectedOptions, legacySelectedOption) || '').slice(0, 160);

    const cat = requireCatalogProductRef(p, {
      productsById,
      productsByCanonLink,
      productsByLink,
      productsByName,
      canonicalizeProductLink,
      allowLookupByName,
    });

    const unitEUR = round2(resolveVariantPriceEUR(cat, selectedOptions, legacySelectedOption, experimentsServer));
    const expectedPurchase = parseDecimalLoose(cat.expectedPurchasePrice || unitEUR);
    let unitOriginalEUR = unitEUR;
    let unitEURDiscounted = null;
    let recoDiscountPctApplied = 0;
    let recoDiscountTokenUsed = '';

    if (recoDiscountEnabled) {
      const tokenIn = String(p?.recoDiscountToken || '').trim();
      if (tokenIn) {
        const parsedTok = recoParseDiscountToken(tokenIn);
        if (parsedTok && String(parsedTok.targetProductId) === String(cat.productId)) {
          let pct = Number(parsedTok.pct || 0);
          if (Number.isFinite(pct)) {
            pct = Math.max(recoDiscountMinPct, Math.min(recoDiscountMaxPct, pct));
            if (pct > 0) {
              const discounted = round2(unitOriginalEUR * (1 - pct / 100));
              const purchase = parseDecimalLoose(cat.expectedPurchasePrice || unitOriginalEUR);
              const marginPct = (discounted - purchase) / Math.max(0.01, discounted);

              if (marginPct >= recoDiscountMinMarginPct) {
                const tokenHash = recoDiscountTokenHash(tokenIn);
                try {
                  await RecoDiscountRedemption.create({ tokenHash, usedAt: new Date(), expiresAt: new Date(parsedTok.exp) });
                  unitOriginalEUR = round2(unitOriginalEUR);
                  recoDiscountPctApplied = pct;
                  recoDiscountTokenUsed = tokenIn;
                  unitEURDiscounted = discounted;
                } catch (_e) {}
              }
            }
          }
        }
      }
    }

    const finalUnitEUR = (typeof unitEURDiscounted === 'number' && Number.isFinite(unitEURDiscounted)) ? round2(unitEURDiscounted) : round2(unitEUR);
    if (!Number.isFinite(finalUnitEUR) || finalUnitEUR <= 0) {
      const ref = String(cat.productLink || cat.name || 'unknown').slice(0, 200);
      const err = new Error(`INVALID_CATALOG_PRICE: ${ref}`);
      err.code = 'INVALID_CATALOG_PRICE';
      throw err;
    }
    itemsTotalBeforeAnyDiscountsEUR += round2(unitEUR) * qty;
    itemsTotalAfterItemDiscountsEUR += finalUnitEUR * qty;

    normalizedItems.push({
      name: String(cat.name || '').slice(0, 500),
      productId: String(cat.productId || '').slice(0, 120),
      productLink: String(cat.productLink || '').slice(0, 500),
      image: String(cat.image || '').slice(0, 1000),
      description: String(cat.description || '').slice(0, 2000),
      selectedOption,
      selectedOptions,
      quantity: qty,
      unitPriceEUR: finalUnitEUR,
      unitPriceOriginalEUR: round2(unitOriginalEUR),
      expectedPurchasePriceEUR: round2(expectedPurchase),
      recoDiscountPct: recoDiscountPctApplied || 0,
      recoDiscountToken: recoDiscountTokenUsed || '',
    });
  }

  return {
    normalizedItems,
    itemsTotalBeforeAnyDiscountsEUR,
    itemsTotalAfterItemDiscountsEUR,
  };
}

module.exports = {
  normalizeCheckoutItems,
};
