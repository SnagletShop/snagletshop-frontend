'use strict';

const { mountHealthRoutes } = require('./healthRouter');
const { MODULAR_ROUTE_GROUPS } = require('./routeManifest');
const { mountAccountingRoutes } = require('../../domains/accounting/accounting.routes');
const { mountControlPlaneRoutes } = require('../../domains/controlplane/controlPlane.routes');
const { mountEmailMarketingRoutes } = require('../../domains/emailMarketing/emailMarketing.routes');
const { mountAnalyticsRoutes } = require('../../domains/analytics/analytics.routes');
const { mountReportingRoutes } = require('../../domains/reporting/reporting.routes');
const { mountCatalogAdminRoutes } = require('../../domains/catalog/catalogAdmin.routes');
const { mountCatalogPublicAdminRoutes } = require('../../domains/catalog/catalogPublicAdmin.routes');
const { mountCatalogPricingRoutes } = require('../../domains/catalog/catalogPricing.routes');
const { mountCatalogFileVersioningRoutes } = require('../../domains/catalog/catalogFileVersioning.routes');
const { mountCatalogCrudModeRoutes } = require('../../domains/catalog/catalogCrudMode.routes');
const { mountCatalogBulkStateRoutes } = require('../../domains/catalog/catalogBulkState.routes');
const { mountPaymentRoutes } = require('../../domains/payments/payments.routes');
const { mountCheckoutRoutes } = require('../../domains/checkout/checkout.routes');
const { mountOrderRoutes } = require('../../domains/orders/orders.routes');
const { mountOrderAdminRoutes } = require('../../domains/orders/orderAdmin.routes');
const { mountFulfillmentRoutes } = require('../../domains/orders/fulfillment.routes');
const { mountPlatformRoutes } = require('../../domains/platform/platform.routes');
const { mountWebhookRoutes } = require('../../domains/webhooks/webhooks.routes');
const { mountGrowthRoutes } = require('../../domains/growth/growth.routes');
const { mountExpensesRoutes } = require('../../domains/expenses/expenses.routes');

function registerRoutes(app) {
  if (!app || typeof app !== 'function') throw new Error('[registerRoutes] express app is required');
  if (app.__SNAGLET_ROUTES_REGISTERED__) return app;
  mountHealthRoutes(app);
  mountGrowthRoutes(app);
  mountWebhookRoutes(app);
  mountPaymentRoutes(app);
  mountCheckoutRoutes(app);
  mountOrderRoutes(app);
  mountOrderAdminRoutes(app);
  mountFulfillmentRoutes(app);
  mountCatalogAdminRoutes(app);
  mountCatalogPublicAdminRoutes(app);
  mountCatalogPricingRoutes(app);
  mountCatalogFileVersioningRoutes(app);
  mountCatalogCrudModeRoutes(app);
  mountCatalogBulkStateRoutes(app);
  mountControlPlaneRoutes(app);
  mountEmailMarketingRoutes(app);
  mountAnalyticsRoutes(app);
  mountReportingRoutes(app);
  mountPlatformRoutes(app);
  mountAccountingRoutes(app);
  mountExpensesRoutes(app);
  app.__SNAGLET_ROUTES_REGISTERED__ = true;
  app.__SNAGLET_ROUTE_GROUP_COUNT__ = MODULAR_ROUTE_GROUPS.length;
  app.__SNAGLET_ROUTE_GROUPS__ = MODULAR_ROUTE_GROUPS.slice();
  return app;
}

module.exports = { registerRoutes };
