(function (window) {
  'use strict';

  function app() {
    return window.__SS_APP__ || null;
  }

  function resolve(name, fallback = null) {
    try {
      const value = app()?.resolve?.(name, fallback);
      return value != null ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function bindGlobal(name, getter) {
    const fn = function publicApiProxy() {
      const target = getter();
      if (typeof target !== 'function') return undefined;
      return target.apply(window, arguments);
    };
    try { window[name] = fn; } catch {}
    return fn;
  }

  function bindMethod(globalName, registryName, method) {
    return bindGlobal(globalName, () => {
      const target = resolve(registryName, null);
      return target && typeof target[method] === 'function' ? target[method].bind(target) : null;
    });
  }

  const api = {
    GoToCart: bindGlobal('GoToCart', () => {
      const screens = resolve('screens.manager', null);
      if (screens?.show) return () => screens.show('basket', { action: 'GoToCart', data: [] });
      const basket = resolve('domain.basket', null);
      return basket?.GoToCart ? basket.GoToCart.bind(basket) : null;
    }),
    GoToProductPage: bindGlobal('GoToProductPage', () => {
      const screens = resolve('screens.manager', null);
      if (screens?.show) return function () { return screens.show('product', { action: 'GoToProductPage', data: Array.from(arguments) }); };
      const product = resolve('domain.product', null);
      return product?.GoToProductPage ? product.GoToProductPage.bind(product) : null;
    }),
    GoToSettings: bindGlobal('GoToSettings', () => {
      const screens = resolve('screens.manager', null);
      if (screens?.show) return () => screens.show('settings', { action: 'GoToSettings', data: [] });
      const settingsRuntime = resolve('domain.settingsRuntime', window.__SS_SETTINGS_RUNTIME__ || null);
      if (settingsRuntime?.goToSettings) return () => settingsRuntime.goToSettings();
      return typeof window.renderSettingsScreen === 'function' ? window.renderSettingsScreen : null;
    }),
    openOrderStatusModal: bindGlobal('openOrderStatusModal', () => {
      const screen = resolve('screen.orderStatus', null);
      return screen?.open ? screen.open.bind(screen) : null;
    })
  };

  [
    ['readBasketFromStorageSafe','domain.basket','readBasketFromStorageSafe'],
    ['syncBasketFromStorage','domain.basket','syncBasketFromStorage'],
    ['persistBasket','domain.basket','persistBasket'],
    ['clearBasketStorage','domain.basket','clearBasketStorage'],
    ['saveCheckoutDraftFromModal','domain.checkout','saveCheckoutDraftFromModal'],
    ['restoreCheckoutDraftToModal','domain.checkout','restoreCheckoutDraftToModal'],
    ['clearCheckoutDraft','domain.checkout','clearCheckoutDraft'],
    ['clearBasketCompletely','domain.basket','clearBasketCompletely'],
    ['buyNow','domain.product','buyNow'],
    ['updateImage','domain.product','updateImage'],
    ['loadBasket','domain.basket','loadBasket'],
    ['readCheckoutForm','domain.checkout','readCheckoutForm'],
    ['readBasket','domain.basket','readBasket'],
    ['computeExpectedClientTotalForServer','domain.checkoutHelpers','computeExpectedClientTotalForServer'],
    ['buildStripeOrderSummary','domain.checkoutHelpers','buildStripeOrderSummary'],
    ['__ssEscHtml','domain.productOptions','__ssEscHtml'],
    ['__ssGetCatalogFlat','domain.productOptions','__ssGetCatalogFlat'],
    ['__ssExtractOptionGroups','domain.productOptions','__ssExtractOptionGroups'],
    ['__ssNormalizeSelectedOptions','domain.productOptions','__ssNormalizeSelectedOptions'],
    ['__ssDefaultSelectedOptions','domain.productOptions','__ssDefaultSelectedOptions'],
    ['__ssFormatSelectedOptionsDisplay','domain.productOptions','__ssFormatSelectedOptionsDisplay'],
    ['__ssFormatSelectedOptionsKey','domain.productOptions','__ssFormatSelectedOptionsKey'],
    ['__ssResolveVariantPriceEUR','domain.productOptions','__ssResolveVariantPriceEUR'],
    ['__ssCleanOptionLabel','domain.productOptions','__ssCleanOptionLabel'],
    ['__ssEnsureOptionChipStyles','domain.productOptions','__ssEnsureOptionChipStyles'],
    ['__ssGetSelectedOptionsForDisplay','domain.productOptions','__ssGetSelectedOptionsForDisplay'],
    ['__ssBuildOptionChipsHTML','domain.productOptions','__ssBuildOptionChipsHTML'],
    ['__ssApplyOptionImageMapping','domain.productOptions','__ssApplyOptionImageMapping'],
    ['__ssSetSelectedOptions','domain.productOptions','__ssSetSelectedOptions'],
    ['__ssGetSelectedOptions','domain.productOptions','__ssGetSelectedOptions'],
    ['__ssRecoGetSessionId','domain.recommendations','__ssRecoGetSessionId'],
    ['__ssRecoDiscountStorePut','domain.recommendations','__ssRecoDiscountStorePut'],
    ['__ssRecoSaveRecentClick','domain.recommendations','__ssRecoSaveRecentClick'],
    ['__ssRecoConsumeRecentClick','domain.recommendations','__ssRecoConsumeRecentClick'],
    ['__ssRecoClearRecentClick','domain.recommendations','__ssRecoClearRecentClick'],
    ['__ssRecoEnsureStyles','domain.recommendations','__ssRecoEnsureStyles'],
    ['addToCart','domain.basket','addToCart'],
    ['__ssEnsureSmartCartRecs','domain.recommendations','__ssEnsureSmartCartRecs'],
    ['__ssEnsureContributionProducts','domain.recommendations','__ssEnsureContributionProducts'],
    ['updateBasket','domain.basket','updateBasket'],
    ['fetchTariffsFromServer','domain.pricing','fetchTariffsFromServer'],
    ['fetchCountriesFromServer','domain.pricing','fetchCountriesFromServer'],
    ['fetchStorefrontConfigFromServer','domain.pricing','fetchStorefrontConfigFromServer'],
    ['fetchTariffs','domain.pricing','fetchTariffs'],
    ['setupSearchInputs','domain.search','setupSearchInputs'],
    ['fetchExchangeRatesFromServer','domain.pricing','fetchExchangeRatesFromServer'],
    ['searchQuery','domain.search','searchQuery'],
    ['searchProducts','domain.search','searchProducts'],
    ['handleCurrencyChange','domain.pricing','handleCurrencyChange'],
    ['detectUserCurrency','domain.pricing','detectUserCurrency'],
    ['sendAnalyticsEvent','domain.analyticsHelpers','sendAnalyticsEvent'],
    ['buildAnalyticsProductPayload','domain.analyticsHelpers','buildAnalyticsProductPayload'],
    ['__ssAbFNV1a32','domain.analyticsHelpers','__ssAbFNV1a32'],
    ['__ssAbGetUid','domain.analyticsHelpers','__ssAbGetUid'],
    ['__ssAbChooseBucket','domain.analyticsHelpers','__ssAbChooseBucket'],
    ['__ssFetchServerExperiments','domain.analyticsHelpers','__ssFetchServerExperiments'],
    ['__ssGetExperiments','domain.analyticsHelpers','__ssGetExperiments'],
    ['__ssABIsB','domain.analyticsHelpers','__ssABIsB'],
    ['__ssABGetProductName','domain.analyticsHelpers','__ssABGetProductName'],
    ['__ssABGetProductDescription','domain.analyticsHelpers','__ssABGetProductDescription'],
    ['__ssABGetDeliveryText','domain.analyticsHelpers','__ssABGetDeliveryText'],
    ['__ssShipFreeText','domain.analyticsHelpers','__ssShipFreeText'],
    ['__ssEnsureABUiStyles','domain.analyticsHelpers','__ssEnsureABUiStyles'],
    ['__ssABGetPrimaryImageUrl','domain.analyticsHelpers','__ssABGetPrimaryImageUrl'],
    ['__ssToken','domain.analyticsHelpers','__ssToken'],
    ['__ssRememberClickToken','domain.analyticsHelpers','__ssRememberClickToken'],
    ['__ssConsumeRecentClickToken','domain.analyticsHelpers','__ssConsumeRecentClickToken'],
    ['__ssStartProductViewSession','domain.analyticsHelpers','__ssStartProductViewSession'],
    ['__ssEndProductViewSessionSend','domain.analyticsHelpers','__ssEndProductViewSessionSend'],
    ['__snagletGetTurnstileSiteKey','domain.turnstile','__snagletGetTurnstileSiteKey'],
    ['__snagletEnsureTurnstileContainer','domain.turnstile','__snagletEnsureTurnstileContainer'],
    ['__snagletWaitForTurnstile','domain.turnstile','__snagletWaitForTurnstile'],
    ['__snagletInitTurnstileOnce','domain.turnstile','__snagletInitTurnstileOnce'],
    ['snagletGetTurnstileToken','domain.turnstile','snagletGetTurnstileToken'],
    ['convertPriceNumber','domain.pricingRuntime','convertPriceNumber'],
    ['convertPrice','domain.pricingRuntime','convertPrice'],
    ['updateAllPrices','domain.pricingRuntime','updateAllPrices'],
    ['initializePrices','domain.pricingRuntime','initializePrices'],
    ['observeNewProducts','domain.pricingRuntime','observeNewProducts'],
    ['populateCountries','domain.settingsCountryRuntime','populateCountries'],
    ['handlesTariffsDropdown','domain.settingsCountryRuntime','handlesTariffsDropdown'],
    ['syncCurrencySelects','domain.settingsCountryRuntime','syncCurrencySelects'],
    ['isDarkModeEnabled','domain.settingsCountryRuntime','isDarkModeEnabled'],
    ['CategoryButtons','domain.catalogUiRuntime','categoryButtons'],
    ['clearCategoryHighlight','domain.catalogUiRuntime','clearCategoryHighlight'],
    ['handleSortChange','domain.catalogUiRuntime','handleSortChange'],
    ['syncSortSelects','domain.catalogUiRuntime','syncSortSelects'],
    ['updateSorting','domain.catalogUiRuntime','updateSorting'],
    ['__ssSetupSortDropdown','domain.catalogUiRuntime','setupSortDropdown'],
    ['__ssGetCartIncentivesConfig','domain.cartIncentives','__ssGetCartIncentivesConfig'],
    ['__ssDbgTierEnabled','domain.cartIncentives','__ssDbgTierEnabled'],
    ['__ssTierDbgGroup','domain.cartIncentives','__ssTierDbgGroup'],
    ['__ssComputeCartIncentivesClient','domain.cartIncentives','__ssComputeCartIncentivesClient'],
    ['__ssEnsureCartIncentiveStyles','domain.cartIncentives','__ssEnsureCartIncentiveStyles'],
    ['__ssCartSigForSmartReco','domain.cartIncentives','__ssCartSigForSmartReco'],
    ['__ssFetchSmartCartRecs','domain.cartIncentives','__ssFetchSmartCartRecs'],
    ['__ssEnsureSmartCartRecs','domain.cartIncentives','__ssEnsureSmartCartRecs'],
    ['__ssLowerBoundByPrice','domain.cartIncentives','__ssLowerBoundByPrice'],
    ['__ssGetAddonPoolSorted','domain.cartIncentives','__ssGetAddonPoolSorted'],
    ['__ssCartPickAddonProducts','domain.cartIncentives','__ssCartPickAddonProducts'],
    ['__ssRenderCartIncentivesHTML','domain.cartIncentives','__ssRenderCartIncentivesHTML'],
    ['__ssBindCartIncentives','domain.cartIncentives','__ssBindCartIncentives'],
    ['__ssValidateRecoDiscountsInBasketBestEffort','domain.cartIncentives','__ssValidateRecoDiscountsInBasketBestEffort']
  ].forEach(([globalName, registryName, method]) => bindMethod(globalName, registryName, method));

  window.__SS_PUBLIC_API__ = api;
  try { app()?.register?.('app.publicApi', api); } catch {}
})(window);
