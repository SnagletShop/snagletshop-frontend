'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const { getStripeRuntime } = require('../../lib/stripeRuntime');
const { getWebhookState } = require('../../lib/webhookState');

function requireWebhookRuntime() {
  try {
    return getWebhookState();
  } catch (e) {
    const err = new Error('WEBHOOK_RUNTIME_NOT_READY:' + String(e?.message || e));
    err.code = 'WEBHOOK_RUNTIME_NOT_READY';
    throw err;
  }
}

function parseStripeEvent(req) {
  const { initStripe } = requireWebhookRuntime();
  const sig = req.headers['stripe-signature'];
  const whSecret = getStripeRuntime().ACTIVE_STRIPE_WEBHOOK_SECRET;
  let event;

  if (whSecret && sig) {
    const stripeClient = initStripe();
    if (!stripeClient) throw new Error('Stripe is not configured (missing STRIPE_SECRET_KEY)');
    const payload = Buffer.isBuffer(req.body)
      ? req.body
      : (Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(JSON.stringify(req.body || {})));
    event = stripeClient.webhooks.constructEvent(payload, sig, whSecret);
  } else if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
    event = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || ''));
  } else {
    throw new Error('Missing Stripe webhook secret/signature in production.');
  }

  return event;
}

async function handleStripeWebhookEvent(event) {
  const {
    Order,
    DraftOrder,
    addStatusHistory,
    ensureInvoiceNumber,
    enrichStripeFeesIfMissing,
    sendOrderEmailWithCooldown,
    sendConfirmationEmail,
    writeOrderToFile,
    writeOrderToExcel,
  } = requireWebhookRuntime();

  const type = event.type;
  const pi = event.data?.object;
  const piId = pi?.id;
  if (!piId) return { received: true };

  let order = await Order.findOne({ 'stripe.paymentIntentId': piId });
  let draft = null;
  if (!order) {
    const draftId = pi?.metadata?.draftId ? String(pi.metadata.draftId).trim() : '';
    draft = (draftId && mongoose.Types.ObjectId.isValid(draftId))
      ? await DraftOrder.findById(draftId)
      : await DraftOrder.findOne({ 'stripe.paymentIntentId': piId });
  }

  if (!order && !draft) {
    console.warn('[stripe-webhook] No order/draft found for PI', piId);
    return { received: true };
  }

  const isAlreadyPaid = !!order?.paidAt || ['PAID', 'REFUNDED'].includes(order?.status);

  if (type === 'payment_intent.succeeded') {
    if (!order) {
      const newOrderId = `ORD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      try {
        order = await Order.create({
          orderId: newOrderId,
          status: 'PAID',
          websiteOrigin: draft.websiteOrigin || '',
          customer: draft.customer || {},
          items: draft.items || [],
          pricing: draft.pricing || {},
          fulfillment: {},
          stripe: {
            ...(draft.stripe || {}),
            paymentIntentId: piId,
            currency: (draft.pricing?.currency || (pi.currency ? String(pi.currency).toUpperCase() : 'EUR')),
          },
          paidAt: new Date(),
          emailSentAt: null,
          shippedEmailSentAt: null,
          expiresAt: undefined,
          public: draft.public || {},
          operator: {
            procurementStatus: 'TO_ORDER',
            shipping: { aliExpress: 0, thirdParty1: 0, thirdParty2: 0 },
          },
          accounting: draft.accounting || {},
          createdAt: draft.createdAt || new Date(),
          updatedAt: new Date(),
          notes: [],
          statusHistory: [{ at: new Date(), from: 'CHECKOUT', to: 'PAID', by: 'stripe-webhook', note: 'payment_intent.succeeded' }],
        });

        try { await ensureInvoiceNumber(order); } catch (e) { console.warn('[invoice] assign failed:', e?.message || e); }
        try { await enrichStripeFeesIfMissing(order); } catch {}
        await order.save();
        try { await DraftOrder.deleteOne({ _id: draft._id }); } catch {}
      } catch (e) {
        if (e?.code === 11000) {
          order = await Order.findOne({ 'stripe.paymentIntentId': piId });
          if (!order) throw e;
          try { await DraftOrder.deleteOne({ _id: draft._id }); } catch {}
        } else {
          throw e;
        }
      }
    }

    const prevStatus = order.status;
    if (!order.paidAt) order.paidAt = new Date();
    if (!['PLACED_WITH_AGENT', 'REFUNDED'].includes(order.status)) order.status = 'PAID';
    order.expiresAt = undefined;
    order.stripe = order.stripe || {};
    order.stripe.paymentIntentId = piId;
    if (pi.currency) order.stripe.currency = String(pi.currency).toUpperCase();
    if (typeof pi.amount_received === 'number') order.stripe.amountMinor = pi.amount_received;
    else if (typeof pi.amount === 'number') order.stripe.amountMinor = pi.amount;

    order.operator = order.operator || {};
    if (!order.operator.procurementStatus || order.operator.procurementStatus === 'AWAITING_PAYMENT') {
      order.operator.procurementStatus = 'TO_ORDER';
    }
    order.accounting = order.accounting || {};
    if (!order.accounting.customerCountryCode) order.accounting.customerCountryCode = order.customer?.countryCode || '';

    try {
      if (prevStatus !== order.status) addStatusHistory(order, prevStatus, order.status, 'stripe-webhook', 'payment_intent.succeeded');
    } catch {}

    try { await ensureInvoiceNumber(order); } catch (e) { console.warn('[invoice] assign failed:', e?.message || e); }
    try { await enrichStripeFeesIfMissing(order); } catch {}
    await order.save();

    order.sideEffects = order.sideEffects || {};
    if (!order.emailSentAt) {
      try {
        await sendOrderEmailWithCooldown({ order, field: 'emailSentAt', type: 'confirmation', sender: sendConfirmationEmail });
      } catch (e) {
        console.warn('⚠️ sendConfirmationEmail failed:', e?.message || e);
      }
    }
    if (!order.sideEffects.fileWrittenAt) {
      try {
        writeOrderToFile(order);
        order.sideEffects.fileWrittenAt = new Date();
        await order.save();
      } catch (e) {
        console.warn('⚠️ writeOrderToFile failed:', e?.message || e);
      }
    }
    if (!order.sideEffects.excelWrittenAt) {
      try {
        await writeOrderToExcel(order);
        order.sideEffects.excelWrittenAt = new Date();
        await order.save();
      } catch (e) {
        console.warn('⚠️ writeOrderToExcel failed:', e?.message || e);
      }
    }
    return { received: true };
  }

  if (isAlreadyPaid) return { received: true };

  if (type === 'payment_intent.payment_failed') {
    if (draft) {
      draft.status = 'PAYMENT_FAILED';
      draft.expiresAt = draft.expiresAt || new Date(Date.now() + 60 * 60 * 1000);
      const lpe = pi.last_payment_error;
      draft.lastPaymentError = lpe ? {
        message: lpe.message,
        code: lpe.code,
        declineCode: lpe.decline_code,
        type: lpe.type,
        at: new Date(),
      } : null;
      await draft.save();
    }
    if (order) {
      order.status = 'PAYMENT_FAILED';
      order.expiresAt = order.expiresAt || new Date(Date.now() + 60 * 60 * 1000);
      const lpe = pi.last_payment_error;
      order.lastPaymentError = lpe ? {
        message: lpe.message,
        code: lpe.code,
        declineCode: lpe.decline_code,
        type: lpe.type,
        at: new Date(),
      } : null;
      await order.save();
    }
    return { received: true };
  }

  if (type === 'payment_intent.canceled') {
    if (draft) {
      draft.status = 'CANCELED';
      draft.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await draft.save();
    }
    if (order) {
      order.status = 'CANCELED';
      order.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await order.save();
    }
    return { received: true };
  }

  return { received: true };
}

module.exports = {
  requireWebhookRuntime,
  parseStripeEvent,
  handleStripeWebhookEvent,
};
