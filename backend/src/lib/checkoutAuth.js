'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const { publicTokenHash, timingSafeEqualHex } = require('./security');

function assertCheckoutObjectId(checkoutId) {
  const cid = checkoutId ? String(checkoutId).trim() : '';
  if (!cid) return '';
  if (!mongoose.Types.ObjectId.isValid(cid)) {
    const err = new Error('Invalid checkoutId');
    err.status = 400;
    err.code = 'INVALID_CHECKOUT_ID';
    throw err;
  }
  return cid;
}

function assertAuthorizedByToken(entity, token) {
  const providedToken = String(token || '').trim();
  if (!providedToken) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const hash = publicTokenHash(providedToken);
  const stored = entity?.public?.tokenHash || '';
  if (!stored || !timingSafeEqualHex(hash, stored)) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  return providedToken;
}

async function assertAuthorizedByPaymentIntentSecret({ paymentIntentId, clientSecret, initStripe }) {
  const piid = String(paymentIntentId || '').trim();
  const providedSecret = String(clientSecret || '').trim();
  if (!piid || !piid.startsWith('pi_')) {
    const err = new Error('Invalid paymentIntentId');
    err.status = 400;
    err.code = 'INVALID_PAYMENT_INTENT_ID';
    throw err;
  }
  if (!providedSecret || !providedSecret.includes('_secret_')) {
    const err = new Error('clientSecret is required');
    err.status = 400;
    err.code = 'MISSING_CLIENT_SECRET';
    throw err;
  }
  const stripeClient = initStripe();
  if (!stripeClient) {
    const err = new Error('STRIPE_NOT_CONFIGURED');
    err.status = 503;
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }
  const pi = await stripeClient.paymentIntents.retrieve(piid);
  const serverSecret = String(pi?.client_secret || '');
  if (!serverSecret) {
    const err = new Error('client_secret missing on PaymentIntent');
    err.status = 500;
    err.code = 'MISSING_SERVER_CLIENT_SECRET';
    throw err;
  }
  const a = Buffer.from(serverSecret, 'utf8');
  const b = Buffer.from(providedSecret, 'utf8');
  const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);
  if (!ok) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  return { piid, stripeClient, paymentIntent: pi };
}

module.exports = {
  assertCheckoutObjectId,
  assertAuthorizedByToken,
  assertAuthorizedByPaymentIntentSecret,
};
