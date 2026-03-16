'use strict';

const { round2, round2Strict } = require('./money');

function createToCents() {
  return (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round(x * 100);
  };
}

function normalizeCountryCode(v) {
  return v ? String(v).trim().toUpperCase() : '';
}

function pickFxAmount({
  currencyUsed,
  totalEUR,
  clientCents,
  fxFetchedAt,
  latestFx,
  history,
}) {
  const toCents = createToCents();
  const computeAmountCentsForRate = (rate) => {
    const totalInCurrency = (currencyUsed === 'EUR') ? totalEUR : (totalEUR * Number(rate || 1));
    return toCents(totalInCurrency);
  };

  if (currencyUsed === 'EUR') {
    return { exchangeRate: 1, fxUsedAt: null, amountCents: computeAmountCentsForRate(1) };
  }

  let candidates = [];
  if (fxFetchedAt != null) {
    const tsNum = Number(fxFetchedAt);
    const snap = history.find((s) => Number(s?.fetchedAt) === tsNum);
    if (!snap) {
      const err = new Error('FX_SNAPSHOT_NOT_FOUND');
      err.code = 'FX_SNAPSHOT_NOT_FOUND';
      err.fxFetchedAt = tsNum;
      throw err;
    }
    candidates = [snap];
  } else {
    const sorted = history.slice().sort((a, b) => Number(b?.fetchedAt || 0) - Number(a?.fetchedAt || 0));
    candidates.push(latestFx);
    const newest = sorted[0];
    const prev = sorted[1];
    const newestAt = Number(newest?.fetchedAt || latestFx?.fetchedAt || 0);
    if (prev && Number(prev?.fetchedAt) && Number(prev.fetchedAt) !== newestAt) {
      candidates.push(prev);
    }
  }

  const trySnapshot = (snap) => {
    const rate = snap?.rates?.[currencyUsed];
    if (!rate || !Number.isFinite(rate)) return null;
    const cents = computeAmountCentsForRate(rate);
    return { rate: Number(rate), cents, fetchedAt: snap?.fetchedAt || null };
  };

  let picked = null;
  if (!clientCents) {
    picked = trySnapshot(candidates[0]);
  } else {
    for (const c of candidates) {
      const r = trySnapshot(c);
      if (!r) continue;
      if (Math.abs(r.cents - clientCents) <= 2) {
        picked = r;
        break;
      }
    }
    if (!picked) picked = trySnapshot(candidates[0]);
  }

  if (!picked) {
    const err = new Error(`FX rate missing for ${currencyUsed}`);
    err.code = 'FX_RATE_MISSING';
    throw err;
  }

  return {
    exchangeRate: picked.rate,
    fxUsedAt: picked.fetchedAt,
    amountCents: computeAmountCentsForRate(picked.rate),
  };
}

function summarizeDiscounts({ baseTotalBeforeAnyDiscountsEUR, baseTotalEUR, incentives, totalBeforeTariffEUR, totalEUR }) {
  const baseTotalBeforeAnyRounded = round2(baseTotalBeforeAnyDiscountsEUR);
  const baseTotalAfterItemRounded = round2(baseTotalEUR);
  const subtotalAfterRounded = round2(Number(incentives?.subtotalAfterDiscountsEUR ?? baseTotalEUR) || baseTotalEUR);
  const totalDiscountRounded = round2(Math.max(0, baseTotalBeforeAnyRounded - subtotalAfterRounded));
  const effectivePct = (baseTotalBeforeAnyRounded > 0)
    ? round2((totalDiscountRounded / baseTotalBeforeAnyRounded) * 100)
    : 0;

  return {
    baseTotalBeforeAnyRounded,
    baseTotalAfterItemRounded,
    subtotalAfterRounded,
    totalDiscountRounded,
    effectivePct,
    totalBeforeTariffRounded: round2(Number(totalBeforeTariffEUR) || 0),
    totalEURRounded: round2(totalEUR),
    shippingFeeEUR: round2(Number(incentives?.shippingFeeEUR ?? 0) || 0),
  };
}

function buildPricingPayload({
  currencyUsed,
  totalEUR,
  countryCode,
  applyTariffServer,
  tariff,
  incentives,
  exchangeRate,
  fxUsedAt,
  amountCents,
  experimentsServer,
  totals,
}) {
  return {
    currency: currencyUsed,
    totalPaidEUR: round2Strict(totalEUR, 'totalPaidEUR'),
    baseTotalEUR: totals.baseTotalBeforeAnyRounded,
    itemsTotalBeforeAnyDiscountsEUR: totals.baseTotalBeforeAnyRounded,
    itemsTotalAfterItemDiscountsEUR: totals.baseTotalAfterItemRounded,
    subtotalAfterDiscountsEUR: totals.subtotalAfterRounded,
    totalDiscountEUR: totals.totalDiscountRounded,
    effectivePct: totals.effectivePct,
    shippingFeeEUR: totals.shippingFeeEUR,
    totalBeforeTariffEUR: totals.totalBeforeTariffRounded,
    customerCountryCode: countryCode || '',
    applyTariff: !!applyTariffServer,
    tariffPct: Number(tariff) || 0,
    discounts: {
      applyToDiscountedItems: (incentives?.applyToDiscountedItems !== false),
      tierPct: Number(incentives?.tierPct || 0) || 0,
      tierDiscountEUR: round2(Number(incentives?.tierDiscountEUR || 0) || 0),
      tierEligibleSubtotalEUR: round2(Number(incentives?.tierEligibleSubtotalEUR ?? 0) || 0),
      tierBaseEUR: round2(Number(incentives?.tierBaseEUR ?? 0) || 0),
      bundlePct: Number(incentives?.bundlePct || 0) || 0,
      bundleDiscountEUR: round2(Number(incentives?.bundleDiscountEUR || 0) || 0)
    },
    freeShippingEligible: !!(incentives?.freeShippingEligible),
    exchangeRate: Number(exchangeRate) || 1,
    fxFetchedAt: fxUsedAt,
    amountCents,
    experimentsServer
  };
}

function validateAndNormalizeUserDetails(userDetails, existingCustomer = {}) {
  const clean = (v, max = 200) => String(v == null ? '' : v).trim().slice(0, max);

  const emailRaw = clean(userDetails.email, 200).toLowerCase();
  const email = (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw)) ? emailRaw : '';

  const phoneRaw = clean(userDetails.phone, 40);
  const phone = phoneRaw.replace(/[^0-9+()\-\s]/g, '').slice(0, 40);

  const cc = clean(userDetails.countryCode || userDetails.country, 3).toUpperCase();
  const countryCode = (/^[A-Z]{2}$/.test(cc)) ? cc : '';

  const marketingOptIn = !!(userDetails.marketingOptIn === true || userDetails.marketingConsent === true);

  return {
    customer: {
      firstName: clean(userDetails.firstName ?? userDetails.name, 80),
      lastName: clean(userDetails.lastName ?? userDetails.surname, 80),
      email,
      phone,
      address1: clean(userDetails.address1 ?? userDetails.street, 120),
      address2: clean(userDetails.address2, 120),
      city: clean(userDetails.city, 80),
      region: clean(userDetails.region ?? userDetails.state, 80),
      postalCode: clean(userDetails.postalCode ?? userDetails.zip, 30),
      countryCode,
      marketingOptIn: marketingOptIn ? true : !!(existingCustomer?.marketingOptIn),
      marketingOptInAt: marketingOptIn ? new Date() : (existingCustomer?.marketingOptInAt || null),
      marketingUnsubscribedAt: existingCustomer?.marketingUnsubscribedAt || null
    },
    countryCode,
  };
}

module.exports = {
  createToCents,
  normalizeCountryCode,
  pickFxAmount,
  summarizeDiscounts,
  buildPricingPayload,
  validateAndNormalizeUserDetails,
};
