'use strict';

const { getOrderRouteState } = require('../../lib/middlewareState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const { handleFinalizeOrder, handleOrderStatus } = require('./orders.service');

function mountOrderRoutes(app) {
  const runtimePaymentStatusLimiter = lazyRuntimeMiddleware(getOrderRouteState, 'paymentStatusLimiter');
  app.post('/finalize-order', runtimePaymentStatusLimiter, handleFinalizeOrder);
  app.get('/order-status/:orderId', runtimePaymentStatusLimiter, handleOrderStatus);
}

module.exports = { mountOrderRoutes };
