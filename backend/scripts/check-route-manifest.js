'use strict';

const { MODULAR_ROUTE_GROUPS, getModularRouteGroups } = require('../src/app/router/routeManifest');

if (!Array.isArray(MODULAR_ROUTE_GROUPS) || !MODULAR_ROUTE_GROUPS.length) {
  throw new Error('MODULAR_ROUTE_GROUPS must be a non-empty array');
}
const copy = getModularRouteGroups();
if (!Array.isArray(copy) || copy.length !== MODULAR_ROUTE_GROUPS.length) {
  throw new Error('getModularRouteGroups() must return a same-length array');
}
if (new Set(copy).size !== copy.length) {
  throw new Error('Route manifest contains duplicate group names');
}
console.log(`Route manifest OK (${copy.length} groups)`);
