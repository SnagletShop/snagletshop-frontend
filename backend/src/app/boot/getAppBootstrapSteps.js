'use strict';

function getAppBootstrapSteps() {
  return {
    createApp: require('../createApp').createApp,
    shouldLoadLegacy: require('./shouldLoadLegacy').shouldLoadLegacy,
    registerRoutes: require('../router/registerRoutes').registerRoutes,
    mountAdminGate: require('../router/adminGateRouter').mountAdminGate,
  };
}

module.exports = { getAppBootstrapSteps };
