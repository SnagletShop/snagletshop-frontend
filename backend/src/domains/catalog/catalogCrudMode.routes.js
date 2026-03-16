'use strict';

const express = require('express');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireCatalogCrudModeRuntime,
  handleAdminProductsCreate,
  handleAdminProductsPatch,
  handleAdminCatalogFilemodeGet,
  handleAdminCatalogFilemodePost,
  handleAdminCatalogConvertToSplit,
} = require('./catalogCrudMode.service');

function mountCatalogCrudModeRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireCatalogCrudModeRuntime, 'authMiddleware');
  app.post('/admin/products', runtimeAuth, express.json({ limit: '5mb' }), handleAdminProductsCreate);
  app.patch('/admin/products/:productId', runtimeAuth, express.json({ limit: '5mb' }), handleAdminProductsPatch);
  app.get('/admin/catalog/filemode', runtimeAuth, handleAdminCatalogFilemodeGet);
  app.post('/admin/catalog/filemode', runtimeAuth, express.json({ limit: '1mb' }), handleAdminCatalogFilemodePost);
  app.post('/admin/catalog/convert/to-split', runtimeAuth, handleAdminCatalogConvertToSplit);
}

module.exports = { mountCatalogCrudModeRoutes };
