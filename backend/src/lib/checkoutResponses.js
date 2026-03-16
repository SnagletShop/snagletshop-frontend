'use strict';

const { round2 } = require('./money');

function buildTotalMismatchDebugPayload({
  reqId,
  clientCents,
  amountCents,
  currencyUsed,
  countryCode,
  fxUsedAt,
  exchangeRate,
  applyTariffServer,
  applyTariff,
  tariff,
  incentives,
  totalBeforeTariffEUR,
  totalEUR,
  baseTotalBeforeAnyRounded,
  baseTotalAfterItemRounded,
  subtotalAfterRounded,
  totalDiscountRounded,
  effectivePct,
  itemsIn,
  normalizedItems,
}) {
  return {
    reqId,
    clientAmountCents: clientCents,
    serverAmountCents: amountCents,
    diffCents: (amountCents - clientCents),
    currency: currencyUsed,
    country: countryCode,
    fxFetchedAtUsed: fxUsedAt || null,
    exchangeRateUsed: exchangeRate || null,
    applyTariffServer: applyTariffServer,
    applyTariffClient: (applyTariff === true),
    applyTariff: !!applyTariffServer,
    tariffPct: Number(tariff) || 0,
    totals: {
      baseTotalEUR: baseTotalBeforeAnyRounded,
      itemsTotalAfterItemDiscountsEUR: baseTotalAfterItemRounded,
      subtotalAfterDiscountsEUR: subtotalAfterRounded,
      totalDiscountEUR: totalDiscountRounded,
      effectivePct: effectivePct,
      shippingFeeEUR: round2(Number(incentives?.shippingFeeEUR ?? 0) || 0),
      totalBeforeTariffEUR: round2(Number(totalBeforeTariffEUR) || 0),
      totalEUR: round2(totalEUR),
    },
    discounts: {
      tierPct: Number(incentives?.tierPct || 0) || 0,
      tierDiscountEUR: round2(Number(incentives?.tierDiscountEUR || 0) || 0),
      bundlePct: Number(incentives?.bundlePct || 0) || 0,
      bundleDiscountEUR: round2(Number(incentives?.bundleDiscountEUR || 0) || 0),
      freeShippingEligible: !!(incentives?.freeShippingEligible),
    },
    itemsIn: (itemsIn || []).slice(0, 10).map((p) => ({
      id: p?.id ?? null,
      productId: p?.productId ?? null,
      pid: p?.pid ?? null,
      qty: p?.quantity ?? p?.qty ?? null,
      price: p?.price ?? null,
      unitPriceEUR: p?.unitPriceEUR ?? null,
      productLink: p?.productLink ?? null,
      hasRecoToken: !!p?.recoDiscountToken,
      recoPct: p?.recoDiscountPct ?? null,
    })),
    normalizedItems: (normalizedItems || []).slice(0, 10).map((x) => ({
      productId: x?.productId ?? null,
      qty: x?.quantity ?? null,
      unitEUR: x?.unitPriceEUR ?? null,
      unitOriginalEUR: x?.unitPriceOriginalEUR ?? null,
      recoDiscountPctApplied: x?.recoDiscountPct ?? null,
      recoDiscountTokenUsed: x?.recoDiscountToken ? 'yes' : 'no',
    })),
  };
}

function buildTotalMismatchResponse({
  amountCents,
  clientCents,
  currencyUsed,
  fxUsedAt,
  applyTariffServer,
  applyTariff,
  tariff,
  experimentsServer,
}) {
  return {
    error: 'TOTAL_MISMATCH',
    message: 'Pricing changed. Please refresh and try again.',
    serverAmountCents: amountCents,
    clientAmountCents: clientCents,
    currency: currencyUsed,
    fxFetchedAtUsed: fxUsedAt,
    applyTariff: !!applyTariffServer,
    clientApplyTariff: (applyTariff === true),
    tariffPct: Number(tariff) || 0,
    experimentsServer,
  };
}

module.exports = {
  buildTotalMismatchDebugPayload,
  buildTotalMismatchResponse,
};
