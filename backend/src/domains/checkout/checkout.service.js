'use strict';

const { getCheckoutState } = require('../../lib/checkoutState');
const { parseDecimalLoose, round2, round2Strict } = require('../../lib/money');
const { createToCents, normalizeCountryCode, pickFxAmount, summarizeDiscounts, buildPricingPayload } = require('../../lib/checkout');
const { normalizeCheckoutItems } = require('../../lib/checkoutCart');
const { buildPaymentIntentMetadata, loadOrCreateCheckoutDraft, markDraftAsFreeCheckout, buildFreeCheckoutResponse } = require('../../lib/checkoutDrafts');
const { buildTotalMismatchDebugPayload, buildTotalMismatchResponse } = require('../../lib/checkoutResponses');
const { resolveCheckoutTarget, applyUserDetailsToTarget, buildStoreUserDetailsMetadataPatch, buildStoreUserDetailsResponse } = require('../../lib/checkoutPersist');
const { buildRequestId, logCreatePaymentIntentRequest, assertOriginAllowed, assertFraudAndTurnstile, parsePaymentIntentPayload } = require('../../lib/checkoutPreflight');
const { originIsAllowed, verifyTurnstile } = require('../../lib/requestSecurity');
const { getStripeRuntime } = require('../../lib/stripeRuntime');
const { getLiveEurRatesSafe } = require('../../lib/fx');
const { getProductsFlatState, getCatalogLookupMaps } = require('../../lib/catalogState');

function requireCheckoutRuntime() {
  return getCheckoutState();
}

async function mergePaymentIntentMetadata(paymentIntentId, patch) {
  try {
    const stripeClient = getCheckoutState().initStripe();
    if (!stripeClient) return;

    const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    const cur = (pi && pi.metadata && typeof pi.metadata === 'object') ? pi.metadata : {};
    const next = { ...cur };

    for (const [k, v] of Object.entries(patch || {})) {
      if (!k) continue;
      next[String(k).slice(0, 40)] = (v == null) ? '' : String(v).slice(0, 500);
    }

    await stripeClient.paymentIntents.update(paymentIntentId, { metadata: next });
  } catch (e) {
    console.warn('⚠ mergePaymentIntentMetadata failed:', e?.message || e);
  }
}

async function handleCreatePaymentIntent(req, res) {
  try {
    const runtime = getCheckoutState();

    const reqId = buildRequestId();
    logCreatePaymentIntentRequest(req, reqId);

    try {
      assertOriginAllowed(req, originIsAllowed);
      await assertFraudAndTurnstile(req, {
        fraudCheck: runtime.fraudCheck,
        verifyTurnstile,
      });
    } catch (e) {
      return res.status(Number(e?.status || 400)).json({ error: e?.code || 'CHECKOUT_PREFLIGHT_FAILED', ...(e?.details ? { details: e.details } : {}) });
    }

    const parsedBody = parsePaymentIntentPayload(req, {
      PaymentIntentBodySchema: runtime.PaymentIntentBodySchema,
      zodBadRequest: runtime.zodBadRequest,
    }, res);
    if (!parsedBody) return;

    const stripeClient = runtime.initStripe();
    if (!stripeClient) {
      return res.status(503).json({ error: 'STRIPE_NOT_CONFIGURED' });
    }

    const {
      websiteOrigin,
      currency,
      country,
      products,
      productsFull,
      applyTariff,
      metadata,
      fxFetchedAt,
    } = parsedBody.data || {};

    const ab = await runtime.computeAbExperimentsForRequest(req, res);
    const experimentsServer = (ab && ab.experiments && typeof ab.experiments === 'object') ? ab.experiments : {};

    const origin = String(websiteOrigin || req.headers.origin || '').trim();
    const currencyUsed = String(currency || 'EUR').trim().toUpperCase();

    const incomingProducts = Array.isArray(products) ? products : [];
    const incomingProductsFull = Array.isArray(productsFull) ? productsFull : [];
    const itemsIn = (incomingProductsFull.length ? incomingProductsFull : incomingProducts);

    if (!itemsIn.length) return res.status(400).json({ error: 'No products provided' });
    const { productsFlatCache } = getProductsFlatState();
    if (!productsFlatCache?.length) return res.status(503).json({ error: 'Catalog not loaded yet' });

    const toCents = createToCents();
    const countryCode = normalizeCountryCode(country) || null;

    let itemsTotalAfterItemDiscountsEUR = 0;
    let itemsTotalBeforeAnyDiscountsEUR = 0;

    const recoCfgGlobal = await runtime.RecoConfig.findOne({ widgetId: runtime.RECO_WIDGET_DEFAULT, scope: 'global', scopeId: null }).lean();
    const recoDiscountCfg = (recoCfgGlobal && recoCfgGlobal.discount && typeof recoCfgGlobal.discount === 'object') ? recoCfgGlobal.discount : {};
    const recoDiscountEnabled = !!recoDiscountCfg.enabled;
    const recoDiscountMinPct = Math.max(0, Number(recoDiscountCfg.minPct || 0) || 0);
    const recoDiscountMaxPct = Math.max(recoDiscountMinPct, Number(recoDiscountCfg.maxPct || 0) || 0);
    const recoDiscountMinMarginPct = Math.max(0, Math.min(0.99, Number(recoDiscountCfg.minMarginPct || 0.20) || 0.20));

    const lookupMaps = getCatalogLookupMaps();
    const normalization = await normalizeCheckoutItems({
      itemsIn,
      experimentsServer,
      ...lookupMaps,
      allowLookupByName: (process.env.ALLOW_CATALOG_LOOKUP_BY_NAME === '1' || process.env.NODE_ENV !== 'production'),
      recoDiscountEnabled,
      recoDiscountMinPct,
      recoDiscountMaxPct,
      recoDiscountMinMarginPct,
      RecoDiscountRedemption: runtime.RecoDiscountRedemption,
    });
    const normalizedItems = normalization.normalizedItems;
    itemsTotalBeforeAnyDiscountsEUR = normalization.itemsTotalBeforeAnyDiscountsEUR;
    itemsTotalAfterItemDiscountsEUR = normalization.itemsTotalAfterItemDiscountsEUR;

    const baseTotalEUR = round2Strict(itemsTotalAfterItemDiscountsEUR, 'itemsTotalAfterItemDiscountsEUR');
    if (!Number.isFinite(baseTotalEUR) || baseTotalEUR < 0) {
      return res.status(400).json({ error: 'Invalid basket total' });
    }
    const baseTotalBeforeAnyDiscountsEUR = round2(itemsTotalBeforeAnyDiscountsEUR);

    try { await runtime.refreshIncentivesRuntime(); } catch {}

    const incentives = runtime.computeCartIncentivesServer({ baseTotalEUR, normalizedItems });
    const totalBeforeTariffEUR = Number(incentives?.totalWithShippingEUR ?? baseTotalEUR) || baseTotalEUR;

    const tariff = (Number(runtime.getTariffPctForCountry(countryCode)) || 0);
    const applyTariffServer = getStripeRuntime().APPLY_TARIFF_SERVER;
    const totalEUR = totalBeforeTariffEUR * (applyTariffServer ? (1 + tariff) : 1);

    const clientCents = (req.body && Number.isFinite(Number(req.body.clientAmountCents))) ? parseInt(req.body.clientAmountCents, 10) : 0;

    let exchangeRate = 1;
    let fxUsedAt = null;
    let amountCents = toCents(totalEUR);
    try {
      const fxPicked = pickFxAmount({
        currencyUsed,
        totalEUR,
        clientCents,
        fxFetchedAt,
        latestFx: (currencyUsed !== 'EUR') ? await getLiveEurRatesSafe() : null,
        history: Array.isArray(runtime.fxHistory) ? runtime.fxHistory : [],
      });
      exchangeRate = fxPicked.exchangeRate;
      fxUsedAt = fxPicked.fxUsedAt;
      amountCents = fxPicked.amountCents;
    } catch (fxErr) {
      if (fxErr?.code === 'FX_SNAPSHOT_NOT_FOUND') {
        return res.status(409).json({
          error: 'FX_SNAPSHOT_NOT_FOUND',
          message: 'Exchange rate snapshot expired. Please refresh and try again.',
          fxFetchedAt: fxErr.fxFetchedAt
        });
      }
      if (fxErr?.code === 'FX_RATE_MISSING') {
        return res.status(500).json({ error: fxErr.message });
      }
      throw fxErr;
    }
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      return res.status(400).json({ error: 'Amount too small or invalid' });
    }

    const isFreeCheckout = (amountCents === 0);
    if (!isFreeCheckout && amountCents < 50) {
      return res.status(400).json({ error: 'Amount too small or invalid' });
    }

    const totals = summarizeDiscounts({
      baseTotalBeforeAnyDiscountsEUR,
      baseTotalEUR,
      incentives,
      totalBeforeTariffEUR,
      totalEUR,
    });
    const _baseTotalBeforeAnyRounded = totals.baseTotalBeforeAnyRounded;
    const _baseTotalAfterItemRounded = totals.baseTotalAfterItemRounded;
    const _subtotalAfterRounded = totals.subtotalAfterRounded;
    const _totalDiscountRounded = totals.totalDiscountRounded;
    const _effectivePct = totals.effectivePct;

    if (clientCents) {
      if (Math.abs(clientCents - amountCents) > 2) {
        try {
          console.error('[PI][TOTAL_MISMATCH]', buildTotalMismatchDebugPayload({
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
            baseTotalBeforeAnyRounded: _baseTotalBeforeAnyRounded,
            baseTotalAfterItemRounded: _baseTotalAfterItemRounded,
            subtotalAfterRounded: _subtotalAfterRounded,
            totalDiscountRounded: _totalDiscountRounded,
            effectivePct: _effectivePct,
            itemsIn,
            normalizedItems,
          }));
          console.error('[PI][TOTAL_MISMATCH][SUMMARY]', { reqId, clientAmountCents: clientCents, serverAmountCents: amountCents, diffCents: (amountCents - clientCents), currency: currencyUsed, country: countryCode, hasRecoToken: (itemsIn || []).some(p => !!p?.recoDiscountToken) });
        } catch (e) {
          console.error('[PI][TOTAL_MISMATCH][LOG_FAIL]', { reqId, msg: String(e && e.message || e) });
        }
        return res.status(409).json(buildTotalMismatchResponse({
          amountCents,
          clientCents,
          currencyUsed,
          fxUsedAt,
          applyTariffServer,
          applyTariff,
          tariff,
          experimentsServer,
        }));
      }
    }

    const checkoutIdIn = parsedBody.data?.checkoutId ? String(parsedBody.data.checkoutId).trim() : '';
    const checkoutTokenIn = parsedBody.data?.checkoutToken ? String(parsedBody.data.checkoutToken).trim() : '';

    const pricingPayload = buildPricingPayload({
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
    });

    let draft = null;
    let publicToken = null;

    try {
      const loaded = await loadOrCreateCheckoutDraft({
        checkoutIdIn,
        checkoutTokenIn,
        origin,
        incentives,
        normalizedItems,
        pricingPayload,
        countryCode,
        DraftOrder: runtime.DraftOrder,
      });
      draft = loaded.draft;
      publicToken = loaded.publicToken;
    } catch (e) {
      return res.status(Number(e?.status || 400)).json({ error: e?.code || e?.message || 'CHECKOUT_ERROR' });
    }

    const buildMetadata = buildPaymentIntentMetadata({
      draft,
      origin,
      countryCode,
      tariff,
      fxUsedAt,
      metadata,
    });

    const existingPiId = String(draft?.stripe?.paymentIntentId || '').trim();
    let paymentIntent = null;

    if (isFreeCheckout) {
      try {
        await markDraftAsFreeCheckout({ draft });
      } catch (e) {
        console.error('[PI][FREE_CHECKOUT][DRAFT_SAVE_FAIL]', { reqId, msg: String(e?.message || e) });
      }

      return res.json(buildFreeCheckoutResponse({ draft, publicToken, currencyUsed }));
    }

    if (existingPiId && existingPiId.startsWith('pi_')) {
      try {
        const existingPi = await stripeClient.paymentIntents.retrieve(existingPiId);
        const sameCurrency = String(existingPi?.currency || '').toLowerCase() === currencyUsed.toLowerCase();
        const status = String(existingPi?.status || '');
        const canUpdateAmount = (status === 'requires_payment_method' || status === 'requires_confirmation');

        if (sameCurrency && canUpdateAmount) {
          paymentIntent = await stripeClient.paymentIntents.update(existingPiId, {
            amount: amountCents,
            metadata: buildMetadata((existingPi && existingPi.metadata) ? existingPi.metadata : {})
          });
        }
      } catch (e) {
        console.warn('[stripe] existing PI update failed; creating a new PI:', e?.message || e);
        paymentIntent = null;
      }
    }

    if (!paymentIntent) {
      const piIdempotencyKey = `checkout_pi:${String(draft._id)}:${amountCents}:${currencyUsed.toLowerCase()}`;
      paymentIntent = await stripeClient.paymentIntents.create({
        amount: amountCents,
        currency: currencyUsed.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: buildMetadata()
      }, { idempotencyKey: piIdempotencyKey });
    }

    draft.stripe = draft.stripe || {};
    draft.stripe.paymentIntentId = paymentIntent.id;
    draft.stripe.currency = currencyUsed;
    draft.pricing = pricingPayload;
    draft.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    try {
      await draft.save();
    } catch (e) {
      if (!existingPiId && paymentIntent?.id && String(paymentIntent.id).startsWith('pi_')) {
        console.error('[PI][DRAFT_SAVE_FAIL_AFTER_CREATE]', {
          draftId: String(draft?._id || ''),
          paymentIntentId: String(paymentIntent.id),
          msg: String(e?.message || e),
        });
      }
      throw e;
    }

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      checkoutId: String(draft._id),
      checkoutPublicToken: publicToken,
      amountCents,
      currency: currencyUsed,
      fxFetchedAtUsed: fxUsedAt,
      applyTariff: !!applyTariffServer,
      tariffPct: Number(tariff) || 0,
      experiments: experimentsServer,
      experimentsServer: experimentsServer
    });
  } catch (err) {
    if (err?.code === 'PRODUCT_NOT_FOUND') {
      return res.status(400).json({
        error: 'PRODUCT_NOT_FOUND',
        message: 'A product in your cart no longer exists (or pricing changed). Please refresh.',
        ref: err.ref
      });
    }
    if (err?.code === 'INVALID_CATALOG_PRICE') {
      return res.status(500).json({ error: 'INVALID_CATALOG_PRICE', message: err.message });
    }

    console.error('❌ Error creating payment intent:', err);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
}

async function handleStoreUserDetails(req, res) {
  try {
    const runtime = getCheckoutState();
    const { checkoutId, token, paymentIntentId, clientSecret, userDetails } = req.body || {};
    if (!userDetails || typeof userDetails !== 'object') {
      return res.status(400).json({ error: 'Missing userDetails' });
    }
    try {
      const raw = JSON.stringify(userDetails);
      if (raw && raw.length > 6000) {
        return res.status(413).json({ error: 'userDetails too large' });
      }
      const keys = Object.keys(userDetails || {});
      if (keys.length > 40) {
        return res.status(400).json({ error: 'Too many fields in userDetails' });
      }
    } catch {}

    let resolved;
    try {
      resolved = await resolveCheckoutTarget({
        checkoutId,
        token,
        paymentIntentId,
        clientSecret,
        DraftOrder: runtime.DraftOrder,
        Order: runtime.Order,
        initStripe: runtime.initStripe,
      });
    } catch (e) {
      return res.status(Number(e?.status || 400)).json({ error: e?.code || e?.message || 'Unauthorized' });
    }

    const { piid, draft, order, target } = resolved;
    const { countryCode } = applyUserDetailsToTarget({
      target,
      paymentIntentId: piid,
      userDetails,
    });

    await target.save();

    const meta = buildStoreUserDetailsMetadataPatch({
      draft,
      order,
      target,
      countryCode,
      paymentIntentId: piid,
    });
    if (meta.paymentIntentId && meta.paymentIntentId.startsWith('pi_')) {
      await mergePaymentIntentMetadata(meta.paymentIntentId, meta.patch);
    }

    return res.json(buildStoreUserDetailsResponse({ draft, order }));
  } catch (err) {
    console.error('store-user-details error:', err);
    return res.status(500).json({ error: 'Failed to store details' });
  }
}

module.exports = {
  requireCheckoutRuntime,
  handleCreatePaymentIntent,
  handleStoreUserDetails,
  mergePaymentIntentMetadata,
};
