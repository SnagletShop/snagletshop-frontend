'use strict';

const { getFulfillmentState } = require('../../lib/orderState');
const { toEUR } = require('../../lib/money');
const { timingSafeEqualHex } = require('../../lib/security');

function runtime() { return getFulfillmentState(); }

function requireFulfillmentRuntime() {
  return runtime();
}

async function handleAdminOrderFulfillmentGet(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const doc = await rt.Order.findOne(rt.buildOrderLookup(id), { fulfillment: 1, customer: 1 }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    return res.json(doc.fulfillment || {});
  } catch (e) {
    console.error('fulfillment get error', e);
    return res.status(500).json({ error: 'read failed' });
  }
}

async function handleAdminOrderFulfillmentPatch(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const payload = req.body || {};
    const set = {};
    if (payload.method) set['fulfillment.method'] = String(payload.method).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(payload, 'packages')) set['fulfillment.packages'] = Array.isArray(payload.packages) ? payload.packages : [];
    if (Object.prototype.hasOwnProperty.call(payload, 'customs')) set['fulfillment.customs'] = payload.customs;
    if (Object.prototype.hasOwnProperty.call(payload, 'self')) set['fulfillment.self'] = payload.self;
    const doc = await rt.Order.findOneAndUpdate(
      rt.buildOrderLookup(id),
      { $set: set, $currentDate: { updatedAt: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true, fulfillment: doc.fulfillment });
  } catch (e) {
    console.error('fulfillment patch error', e);
    return res.status(500).json({ error: 'patch failed' });
  }
}

async function handleAdminOrderFulfillmentQuote(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const { method = 'AGENT', packages = [], customs = {} } = req.body || {};
    const order = await rt.Order.findOne(rt.buildOrderLookup(id)).lean();
    if (!order) return res.status(404).json({ error: 'Not found' });

    const to = {
      name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
      address1: order.customer?.address1 || '',
      city: order.customer?.city || '',
      postalCode: order.customer?.postalCode || '',
      country: order.customer?.countryCode || '',
      phone: order.customer?.phone || '',
      email: order.customer?.email || ''
    };

    let quote;
    if (String(method).toUpperCase() === 'SELF') {
      quote = { method: 'SELF', currency: 'EUR', amount: 0, provider: null };
    } else if (process.env.AGENT_URL && process.env.AGENT_API_KEY) {
      quote = await rt.agentQuote({ to, packages, customs });
    } else {
      const totalWeight = (packages || []).reduce((s, p) => s + Number(p?.weightKg || 0), 0);
      quote = { method: 'AGENT', provider: process.env.AGENT_NAME || 'ddp-agent', currency: 'EUR', amount: +(6.5 * totalWeight + 12).toFixed(2), simulated: true };
    }
    return res.json({ ok: true, quote });
  } catch (e) {
    console.error('fulfillment quote error', e);
    return res.status(500).json({ error: 'quote failed' });
  }
}

async function handleAdminOrderFulfillmentPlace(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const { method = 'AGENT', packages = [], customs = {}, self = {} } = req.body || {};
    const order = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Not found' });

    if (String(method).toUpperCase() === 'SELF') {
      order.fulfillment = order.fulfillment || {};
      order.fulfillment.method = 'SELF';
      order.fulfillment.self = {
        carrier: self.carrier || '',
        service: self.service || '',
        tracking: self.tracking || [],
        costEUR: toEUR(self.cost, self.currency || 'EUR')
      };
      order.status = 'PLACED_WITH_AGENT';
      await order.save();
      return res.json({ ok: true, fulfillment: order.fulfillment });
    }

    if (!(process.env.AGENT_URL && process.env.AGENT_API_KEY)) {
      const tracking = [{ code: `MOCK${Date.now().toString().slice(-6)}`, carrier: 'MockCarrier', url: '' }];
      order.fulfillment = {
        method: 'AGENT',
        packages,
        customs,
        agent: {
          provider: process.env.AGENT_NAME || 'ddp-agent',
          orderRef: `SIM-${order.orderId}`,
          status: 'PLACED',
          service: 'DDP',
          costEUR: 25.00,
          currency: 'EUR',
          tracking,
          lastEvent: new Date(),
          raw: { simulated: true }
        }
      };
      order.status = 'PLACED_WITH_AGENT';
      await order.save();
      return res.json({ ok: true, fulfillment: order.fulfillment, simulated: true });
    }

    const placed = await rt.agentPlaceOrder(order, { packages, customs });
    order.fulfillment = order.fulfillment || {};
    order.fulfillment.method = 'AGENT';
    order.fulfillment.packages = packages;
    order.fulfillment.customs = customs;
    order.fulfillment.agent = {
      provider: process.env.AGENT_NAME || 'ddp-agent',
      orderRef: placed.orderRef,
      status: placed.status || 'PLACED',
      service: placed.service || 'DDP',
      costEUR: toEUR(placed.amount, placed.currency || 'EUR'),
      currency: placed.currency || 'EUR',
      labelUrl: placed.labelUrl || '',
      tracking: placed.tracking || [],
      lastEvent: new Date(),
      raw: placed.raw || {}
    };
    order.status = 'PLACED_WITH_AGENT';
    await order.save();
    return res.json({ ok: true, fulfillment: order.fulfillment });
  } catch (e) {
    console.error('fulfillment place error', e);
    return res.status(500).json({ error: 'place failed' });
  }
}

async function handleAdminOrderFulfillmentCancel(req, res) {
  try {
    const rt = runtime();
    const { id } = req.params;
    const order = await rt.Order.findOne(rt.buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.fulfillment?.method !== 'AGENT' || !order.fulfillment?.agent?.orderRef) {
      return res.status(400).json({ error: 'not an agent order' });
    }
    let ok = true;
    if (process.env.AGENT_URL && process.env.AGENT_API_KEY) ok = await rt.agentCancel(order.fulfillment.agent.orderRef);
    order.fulfillment.agent.status = 'CANCELLED';
    await order.save();
    return res.json({ ok });
  } catch (e) {
    console.error('fulfillment cancel error', e);
    return res.status(500).json({ error: 'cancel failed' });
  }
}

async function handleAgentWebhook(req, res) {
  try {
    const rt = runtime();
    const secret = String(process.env.AGENT_WEBHOOK_SECRET || '').trim();
    if (!secret) return res.status(503).send('webhook not configured');

    const sig = String(req.get('X-Agent-Signature') || '').trim();
    const raw =
      (req.rawBody && Buffer.isBuffer(req.rawBody)) ? req.rawBody :
      (req.rawBody ? Buffer.from(req.rawBody) :
        (Buffer.isBuffer(req.body) ? req.body :
          Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8')
        )
      );

    const expected = require('crypto').createHmac('sha256', secret).update(raw).digest('hex');
    if (!sig || !timingSafeEqualHex(sig, expected)) return res.status(401).send('bad signature');

    const text = raw.toString('utf8');
    let payload;
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    const ref = payload.orderRef || payload.id || payload.reference;
    if (!ref) return res.status(400).json({ error: 'no order ref' });

    const order = await rt.Order.findOne({ 'fulfillment.agent.orderRef': ref });
    if (!order) return res.status(404).json({ error: 'order not found' });

    const status = rt.mapAgentStatus(payload.status || payload.event || '');
    order.fulfillment = order.fulfillment || { method: 'AGENT', agent: {} };
    order.fulfillment.agent = order.fulfillment.agent || {};
    order.fulfillment.agent.status = status || order.fulfillment.agent.status || 'PLACED';
    order.fulfillment.agent.lastEvent = new Date();

    if (payload.trackingCode) {
      const t = { code: payload.trackingCode, carrier: payload.carrier || '', url: payload.trackingUrl || '' };
      const arr = order.fulfillment.agent.tracking || [];
      if (!arr.find((x) => x.code === t.code)) arr.push(t);
      order.fulfillment.agent.tracking = arr;
    }

    await order.save();
    return res.json({ ok: true });
  } catch (e) {
    console.error('agent webhook error', e);
    return res.status(500).json({ error: 'webhook failed' });
  }
}

module.exports = {
  requireFulfillmentRuntime,
  handleAdminOrderFulfillmentGet,
  handleAdminOrderFulfillmentPatch,
  handleAdminOrderFulfillmentQuote,
  handleAdminOrderFulfillmentPlace,
  handleAdminOrderFulfillmentCancel,
  handleAgentWebhook,
};
