'use strict';

const express = require('express');
const { getPlatformRouteState } = require('../../lib/middlewareState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  handleAdminTariffsDownload,
  handleAdminTariffsReplace,
  handleRates,
  handleProxyRates,
  handleTariffs,
  handleCountries,
  handleProducts,
  handleProductsFlat,
  handleProductsContribution,
  handleCatalog,
  handleProductById,
  handleConfig,
  handleStorefrontConfig,
  handlePublicConfig,
  handleSendMessage,
  handleAdminAnalyticsTimeseries,
  handleAdminStripeSelftest,
} = require('./platform.service');

function mountPlatformRoutes(app) {
  const runtimeAdmin = lazyRuntimeMiddleware(getPlatformRouteState, 'admin');
  const runtimeContactLimiter = lazyRuntimeMiddleware(getPlatformRouteState, 'contactLimiter');

  app.get('/admin/tariffs/download', runtimeAdmin, handleAdminTariffsDownload);
  app.post('/admin/tariffs/replace', runtimeAdmin, express.text({ type: ['text/plain'], limit: '512kb' }), handleAdminTariffsReplace);
  app.get('/rates', handleRates);
  app.get('/api/proxy-rates', handleProxyRates);
  app.get('/tariffs', handleTariffs);
  app.get('/countries', handleCountries);
  app.get('/products', handleProducts);
  app.get('/products/flat', handleProductsFlat);
  app.get('/products/contribution', handleProductsContribution);
  app.get('/catalog', handleCatalog);
  app.get('/product/by-id/:productId', handleProductById);
  app.get('/config', handleConfig);
  app.get('/storefront-config', handleStorefrontConfig);
  app.get('/public-config', handlePublicConfig);
  app.post('/send-message', runtimeContactLimiter, handleSendMessage);
  app.get('/admin/analytics/timeseries', runtimeAdmin, handleAdminAnalyticsTimeseries);
  app.get('/admin/selftest/stripe', runtimeAdmin, handleAdminStripeSelftest);
}

module.exports = { mountPlatformRoutes };
