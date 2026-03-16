'use strict';

const { getFulfillmentRouteState } = require('../../lib/middlewareState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  handleAdminOrderFulfillmentGet,
  handleAdminOrderFulfillmentPatch,
  handleAdminOrderFulfillmentQuote,
  handleAdminOrderFulfillmentPlace,
  handleAdminOrderFulfillmentCancel,
  handleAgentWebhook,
} = require('./fulfillment.service');

function mountFulfillmentRoutes(app) {
  const runtimeAdminAuth = lazyRuntimeMiddleware(getFulfillmentRouteState, 'adminAuth');
  const runtimeWebhookAuth = lazyRuntimeMiddleware(getFulfillmentRouteState, 'webhookAuth');

  app.get('/admin/orders/:id/fulfillment', runtimeAdminAuth, handleAdminOrderFulfillmentGet);
  app.patch('/admin/orders/:id/fulfillment', runtimeAdminAuth, handleAdminOrderFulfillmentPatch);
  app.post('/admin/orders/:id/fulfillment/quote', runtimeAdminAuth, handleAdminOrderFulfillmentQuote);
  app.post('/admin/orders/:id/fulfillment/place', runtimeAdminAuth, handleAdminOrderFulfillmentPlace);
  app.post('/admin/orders/:id/fulfillment/cancel', runtimeAdminAuth, handleAdminOrderFulfillmentCancel);
  app.post('/admin/agents/:provider/webhook', runtimeWebhookAuth, handleAgentWebhook);
}

module.exports = { mountFulfillmentRoutes };
