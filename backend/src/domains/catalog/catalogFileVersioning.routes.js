'use strict';

const express = require('express');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireCatalogFileVersioningRuntime,
  handleAdminCatalogFileGet,
  handleAdminCatalogFilePut,
  handleAdminCatalogCategoryListsGet,
  handleAdminCatalogCategoryListsPut,
  handleAdminCatalogCategoriesMetaGet,
  handleAdminCatalogCategoryMetaPost,
  handleAdminCatalogVersionsGet,
  handleAdminCatalogVersionJsonGet,
  handleAdminCatalogVersionDbGet,
  handleAdminCatalogVersionRestorePost,
} = require('./catalogFileVersioning.service');

function mountCatalogFileVersioningRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireCatalogFileVersioningRuntime, 'authMiddleware');
  app.get('/admin/catalog/file', runtimeAuth, handleAdminCatalogFileGet);
  app.put('/admin/catalog/file', runtimeAuth, handleAdminCatalogFilePut);
  app.get('/admin/catalog/category-lists', runtimeAuth, handleAdminCatalogCategoryListsGet);
  app.put('/admin/catalog/category-lists', runtimeAuth, handleAdminCatalogCategoryListsPut);
  app.get('/admin/catalog/categories-meta', runtimeAuth, handleAdminCatalogCategoriesMetaGet);
  app.post('/admin/catalog/category-meta', runtimeAuth, express.json({ limit: '1mb' }), handleAdminCatalogCategoryMetaPost);
  app.get('/admin/catalog/versions', runtimeAuth, handleAdminCatalogVersionsGet);
  app.get('/admin/catalog/versions/:stamp/json', runtimeAuth, handleAdminCatalogVersionJsonGet);
  app.get('/admin/catalog/versions/:stamp/db', runtimeAuth, handleAdminCatalogVersionDbGet);
  app.post('/admin/catalog/versions/:stamp/restore', runtimeAuth, handleAdminCatalogVersionRestorePost);
}

module.exports = { mountCatalogFileVersioningRoutes };
