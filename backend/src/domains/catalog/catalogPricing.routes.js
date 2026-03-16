'use strict';

const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireCatalogPricingRuntime,
  handleAdminProductPrice,
  handleAdminProductPricingPatch,
  handleAdminProductsPricingBulk,
} = require('./catalogPricing.service');

function mountCatalogPricingRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireCatalogPricingRuntime, 'authMiddleware');
  app.patch('/admin/product-price', runtimeAuth, handleAdminProductPrice);
  app.patch('/admin/products/:productId/pricing', runtimeAuth, handleAdminProductPricingPatch);
  app.patch('/admin/products/pricing/bulk', runtimeAuth, handleAdminProductsPricingBulk);
}

module.exports = { mountCatalogPricingRoutes };
