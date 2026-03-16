'use strict';

const express = require('express');
const { getWebhookState } = require('../../lib/webhookState');
const { getOrderCreatedWebhookRouteState } = require('../../lib/middlewareState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const { handleOrderCreatedWebhook } = require('./orderCreatedWebhook.service');
const { requireWebhookRuntime, parseStripeEvent, handleStripeWebhookEvent } = require('./stripeWebhook.service');

function mountWebhookRoutes(app) {
  const runtimeLimiter = lazyRuntimeMiddleware(getOrderCreatedWebhookRouteState, 'limiter');
  const runtimeVerify = lazyRuntimeMiddleware(getOrderCreatedWebhookRouteState, 'verify');
  app.post('/webhook/order-created', runtimeLimiter, express.json({ limit: '256kb' }), runtimeVerify, handleOrderCreatedWebhook);
  app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      getWebhookState();
    } catch (err) {
      console.error('[webhook] runtime not ready:', err?.message || err);
      return res.status(500).json({ error: 'WEBHOOK_RUNTIME_NOT_READY' });
    }

    let event;
    try {
      event = parseStripeEvent(req);
    } catch (err) {
      console.error('⚠️ Invalid signature:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      const payload = await handleStripeWebhookEvent(event);
      return res.json(payload);
    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(500).send('Webhook handler failed');
    }
  });
}

module.exports = { mountWebhookRoutes };
