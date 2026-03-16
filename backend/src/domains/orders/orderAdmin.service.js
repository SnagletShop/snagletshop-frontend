'use strict';

const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { getOrderAdminState } = require('../../lib/orderAdminState');

function runtime() {
  return getOrderAdminState();
}

function requireOrderAdminRuntime() {
  return runtime();
}

async function handleAdminOrdersList(req, res) {
  try {
    const rt = runtime();
    const { from, to, limit = 1000, includeUnpaid, status } = req.query || {};
    const q = {};

    const includeAll = String(includeUnpaid || '').toLowerCase() === 'true' || String(includeUnpaid || '') === '1';
    if (!includeAll) q.paidAt = { $ne: null };

    if (status) {
      const arr = String(status).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 25);
      if (arr.length) q.status = { $in: arr };
    }

    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    const lim = Math.max(1, Math.min(5000, Number(limit)));
    const rows = await rt.Order.find(q).sort({ createdAt: -1 }).limit(lim).lean();
    return res.json(rows.map((r) => ({ ...r, id: r.orderId || r._id })));
  } catch (e) {
    console.error('orders list error', e);
    return res.status(500).json({ error: 'list failed' });
  }
}

async function handleAdminOrderPatch(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const payload = req.body || {};

    const parsedPatch = rt.OrderPatchSchema.safeParse(payload);
    if (!parsedPatch.success) return rt.zodBadRequest(res, parsedPatch, 'Invalid order patch payload');

    const order = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Not found' });

    const prevStatus = order.status;

    if (payload.status != null) order.status = String(payload.status);

    if (payload.pricing && typeof payload.pricing === 'object') {
      order.pricing = order.pricing || {};
      if (payload.pricing.note != null) order.pricing.note = String(payload.pricing.note);

      const allowFinancialOverrides = String(process.env.ADMIN_ALLOW_FINANCIAL_OVERRIDES || '').toLowerCase();
      const allow = (allowFinancialOverrides === '1' || allowFinancialOverrides === 'true' || allowFinancialOverrides === 'yes');
      if (allow) {
        if (payload.pricing.currency != null) order.pricing.currency = String(payload.pricing.currency);
        if (payload.pricing.totalPaidEUR != null) order.pricing.totalPaidEUR = Number(payload.pricing.totalPaidEUR) || 0;
      }
    }

    if (payload.operator && typeof payload.operator === 'object') {
      order.operator = order.operator || {};
      if (payload.operator.procurementStatus != null) {
        const s = String(payload.operator.procurementStatus);
        if (rt.PROCUREMENT_STATUSES.includes(s)) order.operator.procurementStatus = s;
      }
      if (payload.operator.supplierProvider != null) order.operator.supplierProvider = String(payload.operator.supplierProvider).slice(0, 120);
      if (payload.operator.supplierOrderId != null) order.operator.supplierOrderId = String(payload.operator.supplierOrderId).slice(0, 200);
      if (payload.operator.purchasedAt !== undefined) order.operator.purchasedAt = payload.operator.purchasedAt ? new Date(payload.operator.purchasedAt) : null;
      if (payload.operator.supplierCostEUR !== undefined) {
        const v = payload.operator.supplierCostEUR;
        order.operator.supplierCostEUR = (v === null || v === '') ? null : (Number(v) || 0);
      }
      if (payload.operator.internalNote != null) order.operator.internalNote = String(payload.operator.internalNote).slice(0, 2000);
      if (payload.operator.deliveredAt !== undefined) order.operator.deliveredAt = payload.operator.deliveredAt ? new Date(payload.operator.deliveredAt) : null;
      if (payload.operator.doneAt !== undefined) order.operator.doneAt = payload.operator.doneAt ? new Date(payload.operator.doneAt) : null;

      if (payload.operator.shipping && typeof payload.operator.shipping === 'object') {
        order.operator.shipping = order.operator.shipping || {};
        for (const k of ['aliExpress', 'thirdParty1', 'thirdParty2']) {
          if (payload.operator.shipping[k] != null) order.operator.shipping[k] = Number(payload.operator.shipping[k]) || 0;
        }
      }

      if (Array.isArray(payload.operator.tracking)) {
        order.operator.tracking = payload.operator.tracking.slice(0, 20).map((t) => ({
          code: String(t?.code || '').slice(0, 120),
          carrier: String(t?.carrier || '').slice(0, 120),
          url: String(t?.url || '').slice(0, 500),
          addedAt: t?.addedAt ? new Date(t.addedAt) : new Date(),
        }));
      }
    }

    if (payload.costs && typeof payload.costs === 'object') {
      order.costs = order.costs || {};
      if (payload.costs.shippingCostEUR !== undefined) order.costs.shippingCostEUR = payload.costs.shippingCostEUR === null ? null : (Number(payload.costs.shippingCostEUR) || 0);
      if (payload.costs.otherCostEUR !== undefined) order.costs.otherCostEUR = payload.costs.otherCostEUR === null ? null : (Number(payload.costs.otherCostEUR) || 0);
    }

    if (payload.accounting && typeof payload.accounting === 'object') {
      order.accounting = order.accounting || {};
      if (payload.accounting.vatScheme != null) order.accounting.vatScheme = String(payload.accounting.vatScheme).slice(0, 40);
      if (payload.accounting.customerCountryCode != null) order.accounting.customerCountryCode = String(payload.accounting.customerCountryCode).slice(0, 2).toUpperCase();
      if (payload.accounting.invoiceNumber != null) order.accounting.invoiceNumber = String(payload.accounting.invoiceNumber).slice(0, 64);
    }

    if (payload.emailSentAt) order.emailSentAt = new Date(payload.emailSentAt);

    if (Array.isArray(payload.itemsPatch)) {
      for (const p of payload.itemsPatch.slice(0, 200)) {
        const idx = Number(p?.index);
        if (!Number.isInteger(idx) || idx < 0 || idx >= (order.items || []).length) continue;
        const it = order.items[idx];
        if (p.expectedPurchase !== undefined) it.expectedPurchase = Number(p.expectedPurchase) || 0;
        if (p.actualPurchaseEUR !== undefined) it.actualPurchaseEUR = (p.actualPurchaseEUR === null || p.actualPurchaseEUR === '') ? null : (Number(p.actualPurchaseEUR) || 0);
        if (p.supplierLink !== undefined) it.supplierLink = String(p.supplierLink || '').slice(0, 500);
        if (p.supplierSku !== undefined) it.supplierSku = String(p.supplierSku || '').slice(0, 120);
      }
    }

    if (payload.note != null) rt.addNote(order, payload.note, req.user?.sub || 'admin');
    if (prevStatus !== order.status) rt.addStatusHistory(order, prevStatus, order.status, req.user?.sub || 'admin', 'admin patch');
    if (order.operator?.procurementStatus === 'DELIVERED' && !order.operator.deliveredAt) order.operator.deliveredAt = new Date();

    if ((order.status === 'PAID' || order.paidAt) && (!order.accounting || !order.accounting.invoiceNumber)) {
      try { await rt.ensureInvoiceNumber(order); } catch {}
    }

    await order.save();
    return res.json({ ok: true, order: { ...order.toObject(), id: order.orderId || order._id } });
  } catch (e) {
    console.error('patch error', e);
    return res.status(500).json({ error: 'patch failed' });
  }
}

async function handleAdminOrdersBulkPatch(req, res) {
  try {
    const rt = runtime();
    const parsedBulk = {
      success: Array.isArray(req.body?.ids) && req.body?.patch && typeof req.body.patch === 'object',
      data: { ids: Array.isArray(req.body?.ids) ? req.body.ids : [], patch: req.body?.patch || {} },
    };
    if (!parsedBulk.success) return res.status(400).json({ error: 'Invalid bulk patch payload' });
    if (parsedBulk.data.ids.length > 200) return res.status(400).json({ error: 'Too many ids' });

    const ids = parsedBulk.data.ids.map((x) => String(x || '').trim()).filter(Boolean);
    const patch = parsedBulk.data.patch || {};
    const patchCheck = rt.OrderPatchSchema.safeParse(patch);
    if (!patchCheck.success) return rt.zodBadRequest(res, patchCheck, 'Invalid bulk patch payload');

    const updated = [];
    const failed = [];
    for (const id of ids.slice(0, 200)) {
      try {
        const order = await rt.Order.findOne(rt.buildOrderLookup(id));
        if (!order) {
          failed.push({ id, error: 'not found' });
          continue;
        }
        const prevStatus = order.status;

        if (patch.status != null) order.status = String(patch.status);
        if (patch.operator && typeof patch.operator === 'object') {
          order.operator = order.operator || {};
          if (patch.operator.procurementStatus != null) {
            const s = String(patch.operator.procurementStatus);
            if (rt.PROCUREMENT_STATUSES.includes(s)) order.operator.procurementStatus = s;
          }
        }
        if (patch.operator?.doneAt !== undefined) order.operator.doneAt = patch.operator.doneAt ? new Date(patch.operator.doneAt) : null;
        if (prevStatus !== order.status) rt.addStatusHistory(order, prevStatus, order.status, req.user?.sub || 'admin', 'bulk patch');
        if (patch.note != null) rt.addNote(order, patch.note, req.user?.sub || 'admin');
        await order.save();
        updated.push(order.orderId);
      } catch (e) {
        failed.push({ id, error: String(e?.message || e) });
      }
    }
    return res.status(failed.length ? 207 : 200).json({ ok: failed.length === 0, updated, failed });
  } catch (e) {
    console.error('bulk patch error', e);
    return res.status(500).json({ error: 'bulk patch failed' });
  }
}

async function handleAdminOrderNote(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const order = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Not found' });
    rt.addNote(order, text, req.user?.sub || 'admin');
    await order.save();
    return res.json({ ok: true });
  } catch (e) {
    console.error('note error', e);
    return res.status(500).json({ error: 'note failed' });
  }
}

async function handleAdminOrderResendConfirmation(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const doc = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const result = await rt.sendOrderEmailWithCooldown({
      order: doc,
      field: 'emailSentAt',
      type: 'confirmation',
      sender: rt.sendConfirmationEmail,
    });

    return res.json({ ok: true, ...result, emailSentAt: doc.emailSentAt || result.sentAt || null });
  } catch (e) {
    console.error('resend error', e);
    return res.status(500).json({ error: e?.message || 'resend failed' });
  }
}

async function handleAdminOrderSendShippedEmail(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const doc = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const result = await rt.sendOrderEmailWithCooldown({
      order: doc,
      field: 'shippedEmailSentAt',
      type: 'shipped',
      sender: rt.sendShippedEmail,
    });

    return res.json({ ok: true, mailSent: !!result.sent, ...result, shippedEmailSentAt: doc.shippedEmailSentAt || result.sentAt || null });
  } catch (e) {
    console.error('send shipped email error', e);
    return res.status(500).json({ ok: false, mailSent: false, error: e?.message || 'send shipped email failed' });
  }
}

async function handleAdminOrderRefund(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const payload = req.body || {};
    const amount = payload.amount;
    const reason = payload.reason;
    const note = payload.note;

    const order = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const paymentIntentId = order?.stripe?.paymentIntentId;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Order has no stored Stripe paymentIntentId; refunds are only available for newer orders.' });
    }

    const refundParams = { payment_intent: paymentIntentId };
    if (amount != null) {
      const num = Number(amount);
      if (!Number.isFinite(num) || num <= 0) return res.status(400).json({ error: 'Invalid amount' });
      const minor = Math.round(num * 100);
      if (!Number.isFinite(minor) || minor <= 0) return res.status(400).json({ error: 'Invalid amount after conversion' });
      refundParams.amount = minor;
    }

    const allowedStripeReasons = ['duplicate', 'fraudulent', 'requested_by_customer'];
    if (reason && allowedStripeReasons.includes(String(reason))) refundParams.reason = String(reason);
    if (note) refundParams.metadata = { orderId: order.orderId, note: String(note).slice(0, 500) };

    const stripeClient = rt.initStripe();
    if (!stripeClient) return res.status(503).json({ error: 'STRIPE_NOT_CONFIGURED' });

    const idempotencySeed = JSON.stringify({
      orderId: order.orderId,
      paymentIntentId,
      amount: refundParams.amount || null,
      reason: refundParams.reason || '',
      note: note ? String(note).slice(0, 500) : '',
    });
    const refund = await stripeClient.refunds.create(
      refundParams,
      { idempotencyKey: `refund:${order.orderId}:${require('crypto').createHash('sha256').update(idempotencySeed).digest('hex').slice(0, 24)}` }
    );

    const stripeInfo = order.stripe || {};
    const refunds = Array.isArray(stripeInfo.refunds) ? stripeInfo.refunds : [];
    if (!refunds.some((r) => String(r?.id || '') === String(refund.id || ''))) {
      refunds.push({
        id: refund.id,
        amountMinor: refund.amount,
        currency: (refund.currency || stripeInfo.currency || '').toUpperCase(),
        status: refund.status,
        createdAt: new Date(refund.created * 1000),
        reason: note || reason || '',
      });
    }
    stripeInfo.refunds = refunds;

    if (!stripeInfo.paymentIntentId) stripeInfo.paymentIntentId = paymentIntentId;
    if (!stripeInfo.currency && refund.currency) stripeInfo.currency = refund.currency.toUpperCase();
    if (!stripeInfo.amountMinor && typeof order?.pricing?.totalPaidEUR === 'number' && (stripeInfo.currency === 'EUR' || !stripeInfo.currency)) {
      stripeInfo.amountMinor = Math.round(order.pricing.totalPaidEUR * 100);
    }

    try {
      const totalPaidMinor = stripeInfo.amountMinor;
      const totalRefundedMinor = refunds.reduce((sum, r) => sum + (r.amountMinor || 0), 0);
      if (Number.isFinite(totalPaidMinor) && totalRefundedMinor >= totalPaidMinor) order.status = 'REFUNDED';
    } catch (e) {
      console.warn('[refund] Could not compute full-refund status:', e.message);
    }

    order.stripe = stripeInfo;
    await order.save();
    if (order.status === 'REFUNDED') {
      try { await rt.updateProductProfitStatsFromOrder(order, { isRefund: true }); } catch {}
    }

    return res.json({
      ok: true,
      refund: {
        id: refund.id,
        status: refund.status,
        amountMinor: refund.amount,
        currency: refund.currency,
        paymentIntentId,
      },
      order: { id: order.orderId, status: order.status, stripe: order.stripe },
    });
  } catch (e) {
    console.error('[refund] error while creating refund', e);
    if (e && e.raw && e.raw.message) return res.status(400).json({ error: e.raw.message });
    return res.status(500).json({ error: 'refund failed' });
  }
}

async function handleAdminOrderChargeback(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const reason = req.body?.reason != null ? String(req.body.reason).slice(0, 120) : '';
    const note = req.body?.note != null ? String(req.body.note).slice(0, 1000) : '';

    const order = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const prevStatus = String(order.status || '');
    if (prevStatus !== 'CHARGEBACK') {
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.statusHistory.push({ from: prevStatus, to: 'CHARGEBACK', by: String(req.user?.username || 'admin'), note: String(reason || note || '') });
    }

    order.status = 'CHARGEBACK';
    order.updatedAt = new Date();
    order.notes = Array.isArray(order.notes) ? order.notes : [];
    const parts = [];
    if (reason) parts.push(`Reason: ${reason}`);
    if (note) parts.push(`Note: ${note}`);
    order.notes.push({ by: String(req.user?.username || 'admin'), text: parts.length ? `Chargeback marked. ${parts.join(' | ')}` : 'Chargeback marked.' });

    await order.save();
    return res.json({ ok: true, orderId: order.orderId, status: order.status });
  } catch (e) {
    console.error('chargeback mark error', e);
    return res.status(500).json({ error: 'chargeback mark failed' });
  }
}

async function handleAdminOrdersBulkFulfill(req, res) {
  try {
    const rt = runtime();
    const { orderIds, trackingUrl, carrier, note } = req.body || {};
    const ids = Array.isArray(orderIds) ? orderIds.map(String).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ ok: false, error: 'orderIds required' });

    const upd = {
      $set: {
        status: 'FULFILLED',
        fulfilledAt: new Date(),
      },
    };
    if (trackingUrl !== undefined) upd.$set['fulfillment.trackingUrl'] = trackingUrl ? String(trackingUrl) : '';
    if (carrier !== undefined) upd.$set['fulfillment.carrier'] = carrier ? String(carrier) : '';
    if (note !== undefined) upd.$set['fulfillment.note'] = note ? String(note) : '';
    const r = await rt.Order.updateMany({ orderId: { $in: ids } }, upd);
    return res.json({ ok: true, matched: r.matchedCount ?? r.n ?? 0, modified: r.modifiedCount ?? r.nModified ?? 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handleAdminOrderInvoicePdf(req, res) {
  try {
    const rt = runtime();
    const orderId = String(req.params.orderId || '').trim();
    const o = await rt.Order.findOne({ orderId }).lean();
    if (!o) return res.status(404).send('Not found');

    const pricing = o.pricing || {};
    const costs = o.costs || {};
    const items = Array.isArray(o.items) ? o.items : [];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text('Receipt / Invoice', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Order: ${orderId}`);
    doc.text(`Created: ${o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : ''}`);
    if (o.paidAt) doc.text(`Paid: ${new Date(o.paidAt).toISOString().slice(0, 10)}`);
    doc.moveDown(0.5);

    const cust = o.customer || {};
    doc.fontSize(11).text('Customer', { underline: true });
    doc.fontSize(10).text(`Email: ${cust.email || o.email || ''}`);
    if (cust.country) doc.text(`Country: ${cust.country}`);
    doc.moveDown(0.5);

    doc.fontSize(11).text('Items', { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(9);
    doc.text('Name', 40, doc.y, { continued: true });
    doc.text('Qty', 320, doc.y, { continued: true, width: 40, align: 'right' });
    doc.text('Unit', 370, doc.y, { continued: true, width: 70, align: 'right' });
    doc.text('Line', 440, doc.y, { width: 110, align: 'right' });
    doc.moveDown(0.2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    let gross = 0;
    for (const it of items) {
      const name = String(it?.name || '');
      const qty = Number(it?.quantity || 1) || 1;
      const unit = Number(it?.price || it?.salePrice || 0) || 0;
      const line = unit * qty;
      gross += line;

      doc.text(name.slice(0, 60), 40, doc.y, { continued: true, width: 270 });
      doc.text(String(qty), 320, doc.y, { continued: true, width: 40, align: 'right' });
      doc.text(unit.toFixed(2) + '€', 370, doc.y, { continued: true, width: 70, align: 'right' });
      doc.text(line.toFixed(2) + '€', 440, doc.y, { width: 110, align: 'right' });
    }

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    const netPaid = Number(pricing.totalPaidEUR ?? o.paidEUR ?? 0) || 0;
    const discount = Number(pricing.discountTotalEUR ?? (gross - netPaid) ?? 0) || 0;
    const stripeFee = Number(costs.stripeFeeEUR ?? o.stripeFeeEUR ?? 0) || 0;
    const shipCost = Number(costs.shippingCostEUR ?? o.shippingCostEUR ?? 0) || 0;

    doc.fontSize(10);
    doc.text(`Gross items: ${gross.toFixed(2)}€`, { align: 'right' });
    if (discount > 0.0001) doc.text(`Discounts: -${discount.toFixed(2)}€`, { align: 'right' });
    doc.text(`Total paid: ${netPaid.toFixed(2)}€`, { align: 'right' });
    doc.moveDown(0.25);
    doc.fontSize(8).fillColor('gray').text(`(Internal costs: Stripe fee ${stripeFee.toFixed(2)}€, shipping cost ${shipCost.toFixed(2)}€)`, { align: 'right' });
    doc.fillColor('black');

    doc.end();
  } catch (e) {
    console.error('invoice pdf error', e);
    return res.status(500).send('error');
  }
}

module.exports = {
  requireOrderAdminRuntime,
  handleAdminOrdersList,
  handleAdminOrderPatch,
  handleAdminOrdersBulkPatch,
  handleAdminOrderNote,
  handleAdminOrderResendConfirmation,
  handleAdminOrderSendShippedEmail,
  handleAdminOrderRefund,
  handleAdminOrderChargeback,
  handleAdminOrdersBulkFulfill,
  handleAdminOrderInvoicePdf,
};
