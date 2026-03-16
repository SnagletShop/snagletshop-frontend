'use strict';

const { getCheckoutRouteState } = require('../../lib/middlewareState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  handleCreatePaymentIntent,
  handleStoreUserDetails,
} = require('./checkout.service');

function mountCheckoutRoutes(app) {
  const runtimePaymentIntentLimiter = lazyRuntimeMiddleware(getCheckoutRouteState, 'paymentIntentLimiter');
  const runtimeStoreDetailsLimiter = lazyRuntimeMiddleware(getCheckoutRouteState, 'storeDetailsLimiter');

  app.post('/create-payment-intent', runtimePaymentIntentLimiter, handleCreatePaymentIntent);
  app.post('/store-user-details', runtimeStoreDetailsLimiter, handleStoreUserDetails);
}

module.exports = { mountCheckoutRoutes };
