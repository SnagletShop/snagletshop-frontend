'use strict';

const { getOrderAdminRouteState } = require('../../lib/middlewareState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
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
} = require('./orderAdmin.service');

function mountOrderAdminRoutes(app) {
  const runtimeAdminAuth = lazyRuntimeMiddleware(getOrderAdminRouteState, 'adminAuth');
  const runtimeAdminOnly = lazyRuntimeMiddleware(getOrderAdminRouteState, 'adminOnly');

  app.get('/admin/orders', runtimeAdminAuth, handleAdminOrdersList);
  app.patch('/admin/orders/:id', runtimeAdminAuth, handleAdminOrderPatch);
  app.post('/admin/orders/bulk', runtimeAdminAuth, handleAdminOrdersBulkPatch);
  app.post('/admin/orders/:id/note', runtimeAdminAuth, handleAdminOrderNote);
  app.post('/admin/orders/:id/resend-confirmation', runtimeAdminAuth, handleAdminOrderResendConfirmation);
  app.post('/admin/orders/:id/send-shipped-email', runtimeAdminAuth, handleAdminOrderSendShippedEmail);
  app.post('/admin/orders/:id/refund', runtimeAdminAuth, handleAdminOrderRefund);
  app.post('/admin/orders/:id/chargeback', runtimeAdminAuth, handleAdminOrderChargeback);

  app.post('/admin/orders/bulk-fulfill', runtimeAdminOnly, handleAdminOrdersBulkFulfill);
  app.get('/admin/orders/:orderId/invoice.pdf', runtimeAdminOnly, handleAdminOrderInvoicePdf);
}

module.exports = { mountOrderAdminRoutes };
