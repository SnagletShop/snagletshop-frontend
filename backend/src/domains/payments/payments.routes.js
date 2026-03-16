'use strict';

const { getPaymentsState } = require('../../lib/paymentsState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requirePaymentRuntime,
  getAuthorizedPaymentIntent,
  resolveOrderByPaymentIntent,
} = require('./payments.service');

function mountPaymentRoutes(app) {
  const runtimeLimiter = lazyRuntimeMiddleware(getPaymentsState, 'paymentStatusLimiter');

  app.get('/payment-intent-status/:paymentIntentId', runtimeLimiter, async (req, res) => {
    try {
      requirePaymentRuntime();
      const pi = await getAuthorizedPaymentIntent(req.params.paymentIntentId, req.query.clientSecret);
      return res.json({
        id: pi.id,
        status: pi.status,
        amount: pi.amount,
        currency: pi.currency,
      });
    } catch (err) {
      if (err && err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('payment-intent-status error:', err?.message || err);
      return res.status(500).json({ error: 'Failed to fetch payment status' });
    }
  });

  app.get('/order-by-payment-intent/:paymentIntentId', runtimeLimiter, async (req, res) => {
    try {
      requirePaymentRuntime();
      const result = await resolveOrderByPaymentIntent(
        String(req.params.paymentIntentId || '').trim(),
        req.query.clientSecret,
      );
      return res.status(result.statusCode).json(result.body);
    } catch (err) {
      if (err && err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('order-by-payment-intent error:', err?.message || err);
      return res.status(500).json({ error: 'Failed to resolve order' });
    }
  });
}

module.exports = { mountPaymentRoutes };
