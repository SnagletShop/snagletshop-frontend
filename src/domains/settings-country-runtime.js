(function (window, document) {
  'use strict';

  function isDarkModeEnabled() {
    return document.documentElement.classList.contains('dark-mode') ||
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark-mode') ||
      document.body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function syncCurrencySelects(newCurrency) {
    const selects = document.querySelectorAll('#currency-select, #currencySelect');
    selects.forEach((select) => {
      if (select && select.value !== newCurrency) select.value = newCurrency;
    });
  }

  function handlesTariffsDropdown(ctx = {}, countriesList = []) {
    try {
      if (Array.isArray(ctx) && (!Array.isArray(countriesList) || countriesList.length === 0)) {
        countriesList = ctx;
        ctx = {};
      }
      window.preloadedData = window.preloadedData || { exchangeRates: null, countries: null, tariffs: null };
      if (!Array.isArray(countriesList)) countriesList = [];
      window.preloadedData.countries = countriesList;
      window.preloadedData.storefrontConfig = ctx.getStorefrontConfig?.() || window.storefrontCfg || null;

      const select = document.getElementById('countrySelect');
      if (!select) return;

      select.innerHTML = '';
      const sorted = countriesList.slice().sort((a, b) => String(a?.code || '').localeCompare(String(b?.code || '')));
      for (const c of sorted) {
        const code = String(c?.code || '').toUpperCase();
        if (!code) continue;
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = (ctx.countryNames?.[code]) ? ctx.countryNames[code] : code;
        select.appendChild(opt);
      }

      let detected = 'US';
      try { detected = localStorage.getItem('detectedCountry') || 'US'; } catch {}
      const detectedEl = document.getElementById('detected-country');
      if (detectedEl) detectedEl.textContent = detected;
      select.value = detected;

      if (!select.dataset.listenerAttached) {
        select.addEventListener('change', () => {
          const newCountry = select.value;
          try { localStorage.setItem('detectedCountry', newCountry); } catch {}

          if (ctx.autoUpdateCurrencyOnCountryChange && !localStorage.getItem('manualCurrencyOverride')) {
            const newCurrency = ctx.countryToCurrency?.[newCountry];
            if (newCurrency) {
              ctx.setSelectedCurrency?.(newCurrency);
              try { localStorage.setItem('selectedCurrency', newCurrency); } catch {}
              try { syncCurrencySelects(newCurrency); } catch {}
              try { ctx.syncCentralState?.('country-auto-currency', { selectedCurrency: newCurrency }); } catch {}
            }
          }

          try { ctx.updateAllPrices?.(); } catch {}
        });
        select.dataset.listenerAttached = 'true';
      }
    } catch (e) {
      console.warn('⚠️ handlesTariffsDropdown failed:', e);
    }
  }

  async function populateCountries(ctx = {}) {
    console.log('📦 Running populateCountries()');
    const select = document.getElementById('countrySelect');
    if (!select) {
      console.warn('❌ countrySelect not found.');
      return;
    }

    await ctx.fetchTariffs?.();

    const countries = window.preloadedData?.countries?.length
      ? window.preloadedData.countries
      : (ctx.tariffsObjectToCountriesArray?.(ctx.getTariffMultipliers?.()) || []);

    console.log(`📦 Loaded ${countries.length} countries from tariffs`, countries);
    select.innerHTML = '';

    for (const c of countries) {
      const code = String(c.code || '').toUpperCase();
      if (!code) continue;
      const name = ctx.countryNames?.[code] || code;
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = name;
      select.appendChild(opt);
    }

    const detected = localStorage.getItem('detectedCountry') || 'US';
    const detectedEl = document.getElementById('detected-country');
    if (detectedEl) detectedEl.textContent = detected;
    select.value = detected;

    if (!select.dataset.populateCountriesBound) {
      select.addEventListener('change', () => {
        const newCountry = select.value;
        localStorage.setItem('detectedCountry', newCountry);

        if (ctx.autoUpdateCurrencyOnCountryChange && !localStorage.getItem('manualCurrencyOverride')) {
          const newCurrency = ctx.countryToCurrency?.[newCountry];
          if (newCurrency) {
            ctx.setSelectedCurrency?.(newCurrency);
            localStorage.setItem('selectedCurrency', newCurrency);
            try { ctx.syncCentralState?.('country-auto-currency', { selectedCurrency: newCurrency }); } catch {}
            syncCurrencySelects(newCurrency);
          }
        }

        try { ctx.updateAllPrices?.(); } catch {}
      });
      select.dataset.populateCountriesBound = 'true';
    }

    if (select.tomselect) select.tomselect.destroy();

    if (typeof window.TomSelect === 'function') {
      new window.TomSelect(select, {
        maxOptions: 1000,
        sortField: { field: 'text', direction: 'asc' },
        placeholder: 'Select a country…',
        closeAfterSelect: true
      });
      console.log('✅ TomSelect initialized on countrySelect');
    } else {
      console.warn("TomSelect not loaded; using native country <select>.");
    }
  }

  window.__SS_SETTINGS_COUNTRY_RUNTIME__ = { isDarkModeEnabled, syncCurrencySelects, handlesTariffsDropdown, populateCountries };
})(window, document);
