'use strict';

const { model, requireValue } = require('../../lib/runtimeResolver');

function runtime() {
  const Order = model('Order');
  requireValue('ORDER_CREATED_WEBHOOK_RUNTIME_NOT_READY:Order', Order);
  return { Order };
}

async function handleOrderCreatedWebhook(req, res) {
  try {
    const rt = runtime();
    const payload = req.body || {};
    const orderId = String(payload.orderId || '').trim();
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const exists = await rt.Order.findOne({ orderId });
    if (exists) return res.json({ ok: true, id: exists.orderId, duplicated: true });

    const safeCustomer = (payload.customer && typeof payload.customer === 'object') ? payload.customer : {};
    const safeItems = Array.isArray(payload.items) ? payload.items.slice(0, 200) : [];
    const safePricing = (payload.pricing && typeof payload.pricing === 'object') ? payload.pricing : {};

    const doc = await rt.Order.create({
      orderId,
      customer: safeCustomer,
      items: safeItems,
      pricing: safePricing,
      status: 'NEW',
    });

    return res.json({ ok: true, id: doc.orderId });
  } catch (e) {
    if (e && (e.code == 11000 || e.code == 11001 || /duplicate key/i.test(String(e.message || '')))) {
      try {
        const rt = runtime();
        const orderId = String((req.body || {}).orderId || '').trim();
        const existing = orderId ? await rt.Order.findOne({ orderId }) : null;
        if (existing) return res.json({ ok: true, id: existing.orderId, duplicated: true });
      } catch (_) {}
    }
    console.error('webhook error', e);
    return res.status(500).json({ error: 'insert failed' });
  }
}

module.exports = { handleOrderCreatedWebhook };
