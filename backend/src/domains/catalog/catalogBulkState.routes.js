'use strict';

const express = require('express');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireCatalogBulkStateRuntime,
  handleAdminProductsBulkCost,
  handleAdminProductsBulkEnable,
} = require('./catalogBulkState.service');

function mountCatalogBulkStateRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireCatalogBulkStateRuntime, 'requireAdmin');
  app.post('/admin/products/bulk-cost', runtimeAuth, express.json({ limit: '2mb' }), handleAdminProductsBulkCost);
  app.post('/admin/products/bulk-enable', runtimeAuth, express.json({ limit: '1mb' }), handleAdminProductsBulkEnable);
}

module.exports = { mountCatalogBulkStateRoutes };
