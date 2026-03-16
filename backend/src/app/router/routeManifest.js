'use strict';

const MODULAR_ROUTE_GROUPS = [
  'health',
  'growth',
  'webhooks',
  'payments',
  'checkout',
  'orders',
  'orderAdmin',
  'fulfillment',
  'catalogAdmin',
  'catalogPublicAdmin',
  'catalogPricing',
  'catalogFileVersioning',
  'catalogCrudMode',
  'catalogBulkState',
  'controlPlane',
  'emailMarketing',
  'analytics',
  'reporting',
  'platform',
  'accounting',
  'expenses',
];

function getModularRouteGroups() {
  return MODULAR_ROUTE_GROUPS.slice();
}

module.exports = { MODULAR_ROUTE_GROUPS, getModularRouteGroups };
