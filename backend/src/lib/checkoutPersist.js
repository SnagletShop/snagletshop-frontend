'use strict';

const { validateAndNormalizeUserDetails } = require('./checkout');
const {
  assertCheckoutObjectId,
  assertAuthorizedByToken,
  assertAuthorizedByPaymentIntentSecret,
} = require('./checkoutAuth');

async function resolveCheckoutTarget({
  checkoutId,
  token,
  paymentIntentId,
  clientSecret,
  DraftOrder,
  Order,
  initStripe,
}) {
  const cid = checkoutId ? String(checkoutId).trim() : '';
  const piid = paymentIntentId ? String(paymentIntentId).trim() : '';

  if (!cid && !piid) {
    const err = new Error('Missing checkoutId or paymentIntentId');
    err.status = 400;
    err.code = 'MISSING_CHECKOUT_OR_PAYMENT_INTENT';
    throw err;
  }

  let draft = null;
  let order = null;

  if (cid) {
    assertCheckoutObjectId(cid);
    draft = await DraftOrder.findById(cid);
    if (!draft) {
      const err = new Error('CHECKOUT_NOT_FOUND');
      err.status = 404;
      err.code = 'CHECKOUT_NOT_FOUND';
      throw err;
    }
    assertAuthorizedByToken(draft, token);
  } else {
    await assertAuthorizedByPaymentIntentSecret({
      paymentIntentId: piid,
      clientSecret,
      initStripe,
    });

    draft = await DraftOrder.findOne({ 'stripe.paymentIntentId': piid });
    if (!draft) {
      order = await Order.findOne({ 'stripe.paymentIntentId': piid });
      if (!order) {
        const err = new Error('Not found');
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }
  }

  const target = draft || order;
  if (!target) {
    const err = new Error('Not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return { cid, piid, draft, order, target };
}

function applyUserDetailsToTarget({ target, paymentIntentId, userDetails }) {
  const normalizedUser = validateAndNormalizeUserDetails(userDetails, target.customer || {});
  const countryCode = normalizedUser.countryCode;

  target.customer = normalizedUser.customer;
  target.accounting = target.accounting || {};
  if (countryCode) target.accounting.customerCountryCode = countryCode;

  const piid = String(paymentIntentId || '').trim();
  if (piid) {
    target.stripe = target.stripe || {};
    if (!target.stripe.paymentIntentId) target.stripe.paymentIntentId = piid;
  }

  return { normalizedUser, countryCode };
}

function buildStoreUserDetailsMetadataPatch({ draft, order, target, countryCode, paymentIntentId }) {
  const piForMeta = String(paymentIntentId || target?.stripe?.paymentIntentId || '').trim();
  return {
    paymentIntentId: piForMeta,
    patch: {
      draftId: draft ? String(draft._id) : '',
      orderId: order ? String(order.orderId || '') : '',
      customerEmail: target?.customer?.email || '',
      country: countryCode || '',
    },
  };
}

function buildStoreUserDetailsResponse({ draft, order }) {
  return {
    ok: true,
    checkoutId: draft ? String(draft._id) : null,
    orderId: order ? String(order.orderId || '') : null,
  };
}

module.exports = {
  resolveCheckoutTarget,
  applyUserDetailsToTarget,
  buildStoreUserDetailsMetadataPatch,
  buildStoreUserDetailsResponse,
};
