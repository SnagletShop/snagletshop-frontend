'use strict';

function getRuntimeBootstrapSteps() {
  return [
    require('./loadEnv').loadEnv,
    require('./loadStripeRuntime').loadStripeRuntime,
    require('./loadMailRuntime').loadMailRuntime,
    require('./loadGoogleRuntime').loadGoogleRuntime,
    require('./loadLimiterRuntime').loadLimiterRuntime,
    require('./loadMiddlewareRuntime').loadMiddlewareRuntime,
    require('./loadDbRuntime').loadDbRuntime,
    require('./loadPlatformRuntime').loadPlatformRuntime,
    require('./loadCatalogRuntime').loadCatalogRuntime,
    require('./loadCheckoutRuntime').loadCheckoutRuntime,
    require('./loadGrowthRuntime').loadGrowthRuntime,
    require('./loadAnalyticsRuntime').loadAnalyticsRuntime,
    require('./loadControlPlaneRuntime').loadControlPlaneRuntime,
    require('./loadEmailMarketingRuntime').loadEmailMarketingRuntime,
    require('./loadOrderRuntime').loadOrderRuntime,
    require('./loadFxRuntime').loadFxRuntime,
    require('./safetyChecks').bootSafetyChecks,
  ].filter((fn) => typeof fn === 'function');
}

module.exports = { getRuntimeBootstrapSteps };
