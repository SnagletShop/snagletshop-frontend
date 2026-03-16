'use strict';

const { patchBootState, setBootMode, getBootMode } = require('./boot/bootState');

function bootstrapApp() {
  const { getAppBootstrapSteps } = require('./boot/getAppBootstrapSteps');
  const { createApp, mountAdminGate, registerRoutes } = getAppBootstrapSteps();
  const app = createApp();
  mountAdminGate(app);
  registerRoutes(app);

  setBootMode('modular-only');

  patchBootState({
    appBootstrapped: true,
    appBootstrappedAt: new Date().toISOString(),
    legacyEnabled: false,
    legacyLoaded: false,
    legacyBridgeRemoved: true,
    legacyCompatibilityFallbacksPresent: false,
    bootMode: getBootMode(),
    routeGroups: Array.isArray(app.__SNAGLET_ROUTE_GROUPS__) ? app.__SNAGLET_ROUTE_GROUPS__.slice() : [],
    routeGroupCount: Number(app.__SNAGLET_ROUTE_GROUP_COUNT__ || 0) || 0,
    appBootstrapStepCount: 3,
    extractedFlagCount: 0,
    extractedFlagKeys: [],
    legacyFootprint: {
      routeGroups: [],
      routeGroupCount: 0,
      startupResponsibilities: [],
      startupResponsibilityCount: 0,
      totalLegacyConcerns: 0,
      legacyBridgeRemoved: true,
    legacyCompatibilityFallbacksPresent: false,
    },
    modularRouteSurfaceReady: true,
  });

  return { app, legacyEnabled: false, bootMode: getBootMode() };
}

module.exports = { bootstrapApp };
