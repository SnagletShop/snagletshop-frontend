'use strict';

const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireCatalogPublicAdminRuntime,
  handleAdminDeleteProduct,
  handleAdminMetricsCatalog,
  handleAdminCatalog,
} = require('./catalogPublicAdmin.service');

function mountCatalogPublicAdminRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireCatalogPublicAdminRuntime, 'authMiddleware');
  app.delete('/admin/products/:productId', runtimeAuth, handleAdminDeleteProduct);
  app.get('/admin/metrics/catalog', runtimeAuth, handleAdminMetricsCatalog);
  app.get('/admin/catalog', runtimeAuth, handleAdminCatalog);
}

module.exports = { mountCatalogPublicAdminRoutes };
