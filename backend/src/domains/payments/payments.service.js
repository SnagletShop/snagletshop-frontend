'use strict';

const crypto = require('crypto');
const { getPaymentsState } = require('../../lib/paymentsState');

function requirePaymentRuntime() {
  try {
    return getPaymentsState();
  } catch (e) {
    const err = new Error('PAYMENTS_RUNTIME_NOT_READY:' + String(e?.message || e));
    err.code = 'PAYMENTS_RUNTIME_NOT_READY';
    throw err;
  }
}

async function getAuthorizedPaymentIntent(paymentIntentId, clientSecret) {
  const { initStripe } = requirePaymentRuntime();
  const id = String(paymentIntentId || '').trim();
  if (!id.startsWith('pi_')) {
    const err = new Error('Invalid paymentIntentId');
    err.statusCode = 400;
    throw err;
  }

  const suppliedSecret = String(clientSecret || '').trim();
  if (!suppliedSecret || !suppliedSecret.includes('_secret_')) {
    const err = new Error('clientSecret is required');
    err.statusCode = 400;
    throw err;
  }

  const stripeClient = initStripe();
  if (!stripeClient) {
    const err = new Error('STRIPE_NOT_CONFIGURED');
    err.statusCode = 503;
    throw err;
  }

  const pi = await stripeClient.paymentIntents.retrieve(id);
  const serverSecret = String(pi?.client_secret || '');
  if (!serverSecret) {
    const err = new Error('client_secret missing on PaymentIntent');
    err.statusCode = 500;
    throw err;
  }

  const a = Buffer.from(serverSecret, 'utf8');
  const b = Buffer.from(suppliedSecret, 'utf8');
  const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);
  if (!ok) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }

  return pi;
}

async function resolveOrderByPaymentIntent(paymentIntentId, clientSecret) {
  const { Order, DraftOrder } = requirePaymentRuntime();
  await getAuthorizedPaymentIntent(paymentIntentId, clientSecret);

  const order = await Order.findOne({ 'stripe.paymentIntentId': paymentIntentId }).lean();
  if (order && order.orderId) {
    return { statusCode: 200, body: { ok: true, orderId: order.orderId, status: order.status || null } };
  }

  const draft = await DraftOrder.findOne({ 'stripe.paymentIntentId': paymentIntentId }).lean();
  if (draft) {
    return { statusCode: 202, body: { ok: false, pending: true, status: draft.status || 'CHECKOUT' } };
  }

  return { statusCode: 404, body: { ok: false, error: 'Not found' } };
}

module.exports = {
  requirePaymentRuntime,
  getAuthorizedPaymentIntent,
  resolveOrderByPaymentIntent,
};
