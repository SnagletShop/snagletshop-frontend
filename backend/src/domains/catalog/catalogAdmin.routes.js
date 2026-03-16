'use strict';

const express = require('express');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireCatalogAdminRuntime,
  handleAdminProductsLiveGet,
  handleAdminProductsSync,
  handleAdminProductsLocalDownload,
  handleAdminProductsLocalReplace,
} = require('./catalogAdmin.service');

function mountCatalogAdminRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireCatalogAdminRuntime, 'authMiddleware');
  app.get('/admin/products/live', runtimeAuth, handleAdminProductsLiveGet);
  app.post('/admin/products/sync', runtimeAuth, handleAdminProductsSync);
  app.get('/admin/products/local/download', runtimeAuth, handleAdminProductsLocalDownload);
  app.post(
    '/admin/products/local/replace',
    runtimeAuth,
    express.text({
      type: ['text/plain', 'application/javascript', 'text/javascript', 'application/x-javascript'],
      limit: '25mb',
    }),
    handleAdminProductsLocalReplace,
  );
}

module.exports = { mountCatalogAdminRoutes };
