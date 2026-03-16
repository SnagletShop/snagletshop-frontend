'use strict';

const { getBootState } = require('./bootState');
const { getBootEnvSnapshot } = require('./shouldLoadLegacy');

function getBootDiagnostics({ app } = {}) {
  const boot = getBootState();
  const routeGroups = Array.isArray(app?.__SNAGLET_ROUTE_GROUPS__) ? app.__SNAGLET_ROUTE_GROUPS__.slice() : (boot.routeGroups || []);
  const routeGroupCount = Number(app?.__SNAGLET_ROUTE_GROUP_COUNT__ || boot.routeGroupCount || routeGroups.length || 0) || 0;
  return {
    service: 'snagletshop-backend',
    ts: new Date().toISOString(),
    bootMode: boot.bootMode || 'modular-only',
    envPolicy: getBootEnvSnapshot(),
    legacyLoaded: false,
    legacyBridgeRemoved: true,
    legacyCompatibilityFallbacksPresent: false,
    routeGroupCount,
    routeGroups,
    startupJobsCompleted: !!boot.startupJobsCompleted,
    runtimeBootstrapped: !!boot.runtimeBootstrapped,
    appBootstrapped: !!boot.appBootstrapped,
    listening: !!boot.listening,
  };
}

module.exports = { getBootDiagnostics };
