'use strict';

const crypto = require('crypto');
const { publicTokenHash } = require('./security');
const { assertCheckoutObjectId, assertAuthorizedByToken } = require('./checkoutAuth');

function buildCheckoutItems(incentives, normalizedItems) {
  return (incentives && incentives.itemsEnriched) ? incentives.itemsEnriched : normalizedItems;
}

function buildPaymentIntentMetadata({ draft, origin, countryCode, tariff, fxUsedAt, metadata }) {
  const orderSummary = metadata && typeof metadata === 'object' && metadata.order_summary != null
    ? String(metadata.order_summary).slice(0, 499)
    : '';

  return (existing = {}) => ({
    ...existing,
    draftId: String(draft._id),
    websiteOrigin: origin,
    country: countryCode || '',
    tariff: String(tariff),
    fxFetchedAt: fxUsedAt ? String(fxUsedAt) : '',
    order_summary: orderSummary,
  });
}

async function loadOrCreateCheckoutDraft({
  checkoutIdIn,
  checkoutTokenIn,
  origin,
  incentives,
  normalizedItems,
  pricingPayload,
  countryCode,
  DraftOrder,
}) {
  let draft = null;
  let publicToken = null;
  const items = buildCheckoutItems(incentives, normalizedItems);

  if (checkoutIdIn) {
    assertCheckoutObjectId(checkoutIdIn);
    draft = await DraftOrder.findById(checkoutIdIn);
    if (!draft) {
      const err = new Error('CHECKOUT_NOT_FOUND');
      err.status = 404;
      err.code = 'CHECKOUT_NOT_FOUND';
      throw err;
    }

    assertAuthorizedByToken(draft, checkoutTokenIn);
    publicToken = String(checkoutTokenIn || '').trim();
    draft.status = 'CHECKOUT';
    draft.websiteOrigin = origin;
    draft.items = items;
    draft.pricing = pricingPayload;
    draft.accounting = draft.accounting || {};
    if (countryCode) draft.accounting.customerCountryCode = countryCode;
    draft.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  } else {
    publicToken = crypto.randomBytes(16).toString('hex');
    const tokenHash = publicTokenHash(publicToken);

    draft = await DraftOrder.create({
      status: 'CHECKOUT',
      public: { tokenHash, createdAt: new Date() },
      websiteOrigin: origin,
      customer: {},
      items,
      pricing: pricingPayload,
      accounting: { customerCountryCode: countryCode || '' },
      stripe: {},
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
  }

  return { draft, publicToken };
}

async function markDraftAsFreeCheckout({ draft }) {
  draft.status = 'FREE_CHECKOUT';
  draft.stripe = draft.stripe || {};
  draft.stripe.paymentIntentId = null;
  await draft.save();
}

function buildFreeCheckoutResponse({ draft, publicToken, currencyUsed }) {
  return {
    ok: true,
    free: true,
    draftId: String(draft._id),
    checkoutId: String(draft._id),
    checkoutPublicToken: publicToken || null,
    currency: currencyUsed,
  };
}

module.exports = {
  buildCheckoutItems,
  buildPaymentIntentMetadata,
  loadOrCreateCheckoutDraft,
  markDraftAsFreeCheckout,
  buildFreeCheckoutResponse,
};
