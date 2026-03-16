'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const { getOrdersState } = require('../../lib/orderState');
const { publicTokenHash, timingSafeEqualHex } = require('../../lib/security');


function runtime() { return getOrdersState(); }
function requireOrdersRuntime() { return runtime(); }

async function handleFinalizeOrder(req, res) {
  try {
    const rt = runtime();

    const { paymentIntentId, clientSecret, checkoutId, token } = req.body || {};
    const { draftId, free } = req.body || {};
    const isFree = (free === true || free === 'true');
    const did = String(draftId || checkoutId || '').trim();

    if (isFree) {
      if (!did) return res.status(400).json({ error: 'draftId is required' });

      const fraud = await rt.fraudCheck(req, 'finalize');
      if (!fraud.ok) return res.status(429).json({ error: fraud.code || 'FRAUD_VELOCITY' });

      const draft = await rt.DraftOrder.findById(did);
      if (!draft) return res.status(404).json({ error: 'DRAFT_NOT_FOUND' });

      const t = String(token || '').trim();
      if (!t) return res.status(401).json({ error: 'INVALID_TOKEN' });
      const th = publicTokenHash(t);
      if (!draft?.public?.tokenHash || th !== String(draft.public.tokenHash)) {
        return res.status(401).json({ error: 'INVALID_TOKEN' });
      }
      const totalPaid = Number(draft?.pricing?.totalPaidEUR ?? draft?.pricing?.totalPaid ?? 0);
      if (!Number.isFinite(totalPaid) || totalPaid !== 0) {
        return res.status(400).json({ error: 'NOT_FREE_ORDER' });
      }

      if (draft.orderId) {
        return res.json({ ok: true, orderId: String(draft.orderId) });
      }

      const newOrderId = String(draft.orderId || `ORD_FREE_${String(draft._id)}`);
      let order;
      try {
        order = await rt.Order.create({
          orderId: newOrderId,
          status: 'PAID',
          websiteOrigin: draft.websiteOrigin || '',
          customer: draft.customer || {},
          items: draft.items || [],
          pricing: draft.pricing || {},
          accounting: draft.accounting || {},
          public: draft.public || {},
          stripe: { paymentIntentId: null, free: true },
          paidAt: new Date()
        });
      } catch (e) {
        if (e?.code === 11000) {
          order = await rt.Order.findOne({ orderId: newOrderId });
          if (!order) throw e;
        } else {
          throw e;
        }
      }

      draft.status = 'COMPLETE';
      draft.orderId = newOrderId;
      draft.completedAt = new Date();
      await draft.save();

      if (!order.emailSentAt) {
        try {
          await rt.sendOrderEmailWithCooldown({ order, field: 'emailSentAt', type: 'confirmation', sender: rt.sendConfirmationEmail });
        } catch (e) {
          console.warn('⚠️ sendConfirmationEmail after finalize-order free failed:', e?.message || e);
        }
      }

      return res.json({ ok: true, orderId: order.orderId, free: true });
    }

    const piid = String(paymentIntentId || '').trim();
    if (!piid.startsWith('pi_')) return res.status(400).json({ error: 'Invalid paymentIntentId' });

    const fraud = await rt.fraudCheck(req, 'finalize');
    if (!fraud.ok) {
      return res.status(429).json({ error: fraud.code || 'FRAUD_VELOCITY' });
    }

    const cs = String(clientSecret || '').trim();
    if (!cs || !cs.includes('_secret_')) return res.status(400).json({ error: 'clientSecret is required' });

    const stripeClient = rt.initStripe();
    if (!stripeClient) return res.status(503).json({ error: 'STRIPE_NOT_CONFIGURED' });

    const pi = await stripeClient.paymentIntents.retrieve(piid);
    const serverSecret = String(pi?.client_secret || '');
    if (!serverSecret) return res.status(500).json({ error: 'client_secret missing on PaymentIntent' });
    const a = Buffer.from(serverSecret, 'utf8');
    const b = Buffer.from(cs, 'utf8');
    const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await rt.Order.findOne({ 'stripe.paymentIntentId': piid }).lean();
    if (existing?.orderId) return res.json({ ok: true, orderId: existing.orderId, status: existing.status || null });

    if (String(pi.status || '') !== 'succeeded') {
      return res.status(409).json({ ok: false, error: 'PAYMENT_NOT_SUCCEEDED', status: pi.status || null });
    }

    let draft = null;
    const cid = checkoutId ? String(checkoutId).trim() : '';
    if (cid && mongoose.Types.ObjectId.isValid(cid)) {
      draft = await rt.DraftOrder.findById(cid);
      if (draft) {
        const providedToken = String(token || '').trim();
        if (!providedToken) return res.status(401).json({ error: 'Unauthorized' });
        const hash = publicTokenHash(providedToken);
        const stored = draft.public?.tokenHash || '';
        if (!stored || !timingSafeEqualHex(hash, stored)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
    }
    if (!draft) {
      draft = await rt.DraftOrder.findOne({ 'stripe.paymentIntentId': piid });
    }
    if (!draft) return res.status(404).json({ error: 'CHECKOUT_NOT_FOUND' });

    try {
      const normCC2 = (v) => (v ? String(v).trim().toUpperCase() : '');
      const draftCC = normCC2(draft?.customer?.countryCode || draft?.accounting?.customerCountryCode || '');
      let stripeCC = normCC2(pi?.shipping?.address?.country || '');

      if (!stripeCC && pi?.latest_charge) {
        try {
          const ch = await stripeClient.charges.retrieve(String(pi.latest_charge));
          stripeCC = normCC2(ch?.shipping?.address?.country || ch?.billing_details?.address?.country || '');
        } catch {}
      }

      if (draftCC && stripeCC && draftCC !== stripeCC) {
        try {
          draft.accounting = draft.accounting || {};
          draft.accounting.stripeCountryCode = stripeCC;
          await draft.save();
        } catch {}
        return res.status(409).json({
          ok: false,
          error: 'COUNTRY_MISMATCH',
          message: 'Shipping country mismatch. Please refresh and try again.',
          draftCountryCode: draftCC,
          stripeCountryCode: stripeCC
        });
      }

      if (stripeCC) {
        try {
          draft.accounting = draft.accounting || {};
          draft.accounting.stripeCountryCode = stripeCC;
          await draft.save();
        } catch {}
      }
    } catch {}

    const newOrderId = `ORD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let order;
    try {
      order = await rt.Order.create({
        orderId: newOrderId,
        status: 'PAID',
        websiteOrigin: draft.websiteOrigin || '',
        customer: draft.customer || {},
        items: draft.items || [],
        pricing: draft.pricing || {},
        fulfillment: {},
        stripe: {
          ...(draft.stripe || {}),
          paymentIntentId: piid,
          currency: (draft.pricing?.currency || (pi.currency ? String(pi.currency).toUpperCase() : 'EUR'))
        },
        paidAt: new Date(),
        emailSentAt: null,
        shippedEmailSentAt: null,
        expiresAt: undefined,
        public: draft.public || {},
        operator: {
          procurementStatus: 'TO_ORDER',
          shipping: { aliExpress: 0, thirdParty1: 0, thirdParty2: 0 }
        },
        accounting: draft.accounting || {},
        createdAt: draft.createdAt || new Date(),
        updatedAt: new Date(),
        notes: [],
        statusHistory: [{ at: new Date(), from: 'CHECKOUT', to: 'PAID', by: 'finalize-order', note: 'payment_intent.succeeded' }]
      });
    } catch (e) {
      if (e?.code === 11000) {
        const racedOrder = await rt.Order.findOne({ 'stripe.paymentIntentId': piid });
        if (racedOrder?.orderId) {
          try { await rt.DraftOrder.deleteOne({ _id: draft._id }); } catch {}
          return res.json({ ok: true, orderId: racedOrder.orderId, status: racedOrder.status || null, deduped: true });
        }
      }
      throw e;
    }

    try { await rt.ensureInvoiceNumber(order); } catch (e) { console.warn('[invoice] assign failed:', e?.message || e); }
    try { await rt.enrichStripeFeesIfMissing(order); } catch {}
    await order.save();
    try { await rt.updateProductProfitStatsFromOrder(order, { isRefund: false }); } catch {}

    if (!order.emailSentAt) {
      try {
        await rt.sendOrderEmailWithCooldown({ order, field: 'emailSentAt', type: 'confirmation', sender: rt.sendConfirmationEmail });
      } catch (e) {
        console.warn('⚠️ sendConfirmationEmail after finalize-order failed:', e?.message || e);
      }
    }

    try { await rt.DraftOrder.deleteOne({ _id: draft._id }); } catch {}

    return res.json({ ok: true, orderId: order.orderId, status: order.status });
  } catch (err) {
    console.error('finalize-order error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to finalize order' });
  }
}

async function handleOrderStatus(req, res) {
  try {
    const rt = runtime();

    const orderId = String(req.params.orderId || '').trim();
    const token = String(req.query.token || '').trim();

    if (!orderId || !token) {
      return res.status(400).json({ error: 'Missing orderId or token' });
    }

    const order = await rt.Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'Not found' });

    const hash = publicTokenHash(token);
    const stored = order.public?.tokenHash || '';
    if (!stored || !timingSafeEqualHex(hash, stored)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.json({
      ok: true,
      orderId: order.orderId,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      procurementStatus: order.operator?.procurementStatus || null,
      deliveredAt: order.operator?.deliveredAt || null,
      tracking: Array.isArray(order.operator?.tracking) ? order.operator.tracking : [],
      items: (order.items || []).map((it) => ({
        name: it.name,
        quantity: it.quantity,
        selectedOption: it.selectedOption || '',
        selectedOptions: Array.isArray(it.selectedOptions) ? it.selectedOptions : [],
      })),
    });
  } catch (err) {
    console.error('order-status error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to fetch order status' });
  }
}

module.exports = { requireOrdersRuntime, handleFinalizeOrder, handleOrderStatus };
