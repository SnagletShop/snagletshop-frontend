(function (window, document) {
  'use strict';

  async function preloadSettingsData(ctx = {}) {
    if (ctx.getPreloadPromise?.()) return ctx.getPreloadPromise();

    const setRatesFetchedAt = (ts) => {
      const safeTs = Number(ts || 0) || 0;
      window.exchangeRatesFetchedAt = safeTs;
      if (typeof ctx.setExchangeRatesFetchedAt === 'function') ctx.setExchangeRatesFetchedAt(safeTs);
      window.preloadedData = window.preloadedData || {};
      window.preloadedData.ratesFetchedAt = safeTs;
    };

    const promise = (async () => {
      try {
        window.preloadedData = window.preloadedData || {
          exchangeRates: null,
          countries: null,
          tariffs: null,
          storefrontConfig: null,
          ratesFetchedAt: 0
        };

        const cached = ctx.safeJsonParse?.(ctx.lsGet?.(ctx.SETTINGS_CACHE_KEY));
        if (cached && ctx.isSettingsCacheValid?.(cached.timestamp)) {
          const safeTariffs = (cached.tariffs && typeof cached.tariffs === 'object') ? cached.tariffs : {};
          const safeRates = (cached.rates && typeof cached.rates === 'object') ? cached.rates : {};
          ctx.setTariffMultipliers?.(safeTariffs);
          ctx.setExchangeRates?.(safeRates);
          setRatesFetchedAt(cached.ratesFetchedAt || cached.fetchedAt || 0);
          window.preloadedData.tariffs = safeTariffs;
          window.preloadedData.exchangeRates = safeRates;
          ctx.syncCentralState?.('preload-fetch-success', { exchangeRates: safeRates, tariffMultipliers: safeTariffs });
          ctx.syncCentralState?.('preload-cache-hit', { exchangeRates: safeRates, tariffMultipliers: safeTariffs });
          window.preloadedData.countries = cached.countries || ctx.tariffsObjectToCountriesArray?.(safeTariffs);
          window.preloadedData.storefrontConfig = cached.storefrontConfig || cached.storefront || null;
          ctx.handlesTariffsDropdown?.(window.preloadedData.countries || []);
          console.log('⚡ Using cached settings data.');
          return;
        }

        const [tariffsObj, ratesData, countriesArr, storefrontCfg] = await Promise.all([
          ctx.fetchTariffsFromServer?.(),
          ctx.fetchExchangeRatesFromServer?.(),
          ctx.fetchCountriesFromServer?.().catch(() => null),
          ctx.fetchStorefrontConfigFromServer?.().catch(() => null)
        ]);

        const safeTariffs = (tariffsObj && typeof tariffsObj === 'object' && !Array.isArray(tariffsObj)) ? tariffsObj : {};
        const safeRates = (ratesData && typeof ratesData.rates === 'object' && ratesData.rates && !Array.isArray(ratesData.rates))
          ? ratesData.rates
          : ((ratesData && typeof ratesData === 'object' && !Array.isArray(ratesData)) ? ratesData : {});
        const fetchedAt = (ratesData && Number(ratesData.fetchedAt || 0)) ? Number(ratesData.fetchedAt) : 0;

        ctx.setTariffMultipliers?.({ ...safeTariffs });
        ctx.setExchangeRates?.({ ...safeRates });
        setRatesFetchedAt(fetchedAt);

        const currentTariffs = ctx.getTariffMultipliers?.() || {};
        const currentRates = ctx.getExchangeRates?.() || {};
        const countriesList = (Array.isArray(countriesArr) && countriesArr.length)
          ? countriesArr
          : ctx.tariffsObjectToCountriesArray?.(currentTariffs);
        ctx.handlesTariffsDropdown?.(countriesList);

        window.preloadedData.tariffs = currentTariffs;
        window.preloadedData.exchangeRates = currentRates;
        window.preloadedData.countries = countriesList;
        window.preloadedData.storefrontConfig = (typeof storefrontCfg !== 'undefined' ? storefrontCfg : (window.storefrontCfg || null));

        ctx.lsSet?.(ctx.SETTINGS_CACHE_KEY, JSON.stringify({
          tariffs: currentTariffs,
          rates: currentRates,
          ratesFetchedAt: Number(window.exchangeRatesFetchedAt || 0) || 0,
          countries: countriesList,
          storefrontConfig: storefrontCfg || null,
          timestamp: Date.now()
        }));

        console.log('✅ Settings data loaded & cached.');
      } catch (err) {
        console.warn('⚠️ preloadSettingsData failed:', err?.message || err);
        const safeTariffs = ctx.getTariffMultipliers?.() || {};
        const safeRates = ctx.getExchangeRates?.() || {};
        ctx.setTariffMultipliers?.(safeTariffs);
        ctx.setExchangeRates?.(safeRates);
        setRatesFetchedAt(window.exchangeRatesFetchedAt || 0);
      }
    })();

    ctx.setPreloadPromise?.(promise);
    try {
      return await promise;
    } finally {
      ctx.setPreloadPromise?.(null);
    }
  }

  async function goToSettings(ctx = {}) {
    await ctx.preloadSettingsData?.();
    ctx.clearCategoryHighlight?.();

    const viewer = document.getElementById('Viewer');
    if (!viewer) {
      console.error('Viewer element not found.');
      return;
    }

    if (typeof ctx.removeSortContainer === 'function') ctx.removeSortContainer();
    viewer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.classList.add('settings-panel');
    wrapper.style.backgroundColor = 'var(--SearchBar_Background_Colour)';
    wrapper.style.color = 'var(--Default_Text_Colour)';

    const TEXTS = ctx.TEXTS || {};
    const themeSection = document.createElement('div');
    themeSection.classList.add('settings-section');
    themeSection.innerHTML = `
        <h3>Theme</h3>
        <label for="themeToggle">${TEXTS?.GENERAL?.DARK_MODE_LABEL || 'Dark Mode'}</label>
        <label class="switch">
          <input type="checkbox" id="themeToggle">
          <span class="slider"></span>
        </label>
      `;

    const currencySection = document.createElement('div');
    currencySection.classList.add('settings-section');
    currencySection.innerHTML = `
        <h3>Currency</h3>
        <label for="currencySelect">Preferred currency:</label>
        <select id="currencySelect" class="currencySelect tom-hidden" style="width: 100%"></select>
      `;

    const countrySection = document.createElement('div');
    countrySection.classList.add('settings-section');
    countrySection.innerHTML = `
        <h3>Shipping Country</h3>
        <label for="countrySelect">Detected: <span id="detected-country"></span></label>
        <select id="countrySelect" class="tom-hidden" style="width: 100%"></select>
      `;

    const clearSection = document.createElement('div');
    clearSection.classList.add('settings-section');
    clearSection.innerHTML = `
        <h3>Reset</h3>
        <button class="clearDataButton" id="clearDataButton">Clear all saved data (cart, preferences, etc.)</button>
      `;

    const contactSection = document.createElement('div');
    contactSection.classList.add('settings-section');
    contactSection.innerHTML = `
    <h3>${TEXTS?.CONTACT_FORM?.TITLE || 'Send us a Message!'}</h3>
    <form id="contact-form" autocomplete="off">
      <label for="contact-email">${TEXTS?.CONTACT_FORM?.FIELDS?.EMAIL || 'Your Email'}</label>
      <input type="email" id="contact-email" name="email" autocomplete="email" required>
      <label for="contact-message">${TEXTS?.CONTACT_FORM?.FIELDS?.MESSAGE || 'Message'}</label>
      <textarea id="contact-message" name="message" class="MessageTextArea" required></textarea>
      <div aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;pointer-events:none;">
        <label for="contact-website">Website</label>
        <input type="text" id="contact-website" name="contact_website_do_not_fill" autocomplete="new-password" tabindex="-1" inputmode="none" value="" readonly>
      </div>
      <button type="submit">${TEXTS?.CONTACT_FORM?.SEND_BUTTON || 'Send!'}</button>
    </form>
    <p class="contact-note">If the form doesn't work, email us at <a href="mailto:snagletshophelp@gmail.com">snagletshophelp@gmail.com</a></p>`;

    const legalSection = document.createElement('div');
    legalSection.classList.add('settings-section');
    legalSection.innerHTML = `
        <h3>Legal Notice &amp; Store Policies</h3>
        <p><strong>Legal Notice:</strong><br>
        Unauthorized scraping, reproduction, or copying of this website, its design, content, or data is prohibited and may result in legal action and claims for damages.</p>
        <h4>Shipping Policy</h4>
        <p>We operate on a dropshipping model. Most items ship from global suppliers and logistics partners.
        Estimated delivery: <strong>2&nbsp;weeks to several weeks</strong>, depending on destination, carrier performance,
        customs processing, and product availability. Estimated dates are <strong>not guaranteed</strong>.</p>
        <h4>Returns, Cancellations &amp; Refunds</h4>
        <p><strong>Before shipment:</strong> We may be able to cancel an order if it has not yet been processed; this is not guaranteed.</p>
        <p><strong>After shipment (general rule):</strong> We do not accept cancellations or “change-of-mind” returns once an order has been handed to a carrier, <strong>except</strong> where mandatory consumer law grants you a right to withdraw.</p>
        <p><strong>EU/EEA/UK consumers (cooling-off):</strong> For most physical goods, you have a statutory right to withdraw from a distance contract within <strong>14 days</strong> after delivery without giving a reason (exceptions apply).</p>
        <h4>Items Damaged, Defective, or Not-as-Described</h4>
        <p>If your item arrives damaged, defective, or significantly different from its description, contact us <strong>promptly</strong> with your order number and clear photos/videos so we can assist.</p>
        <h4>Warranty / Legal Guarantee</h4>
        <p>Unless a manufacturer warranty is explicitly provided with the product, we do not offer a separate commercial warranty. <strong>This does not affect your statutory rights</strong>.</p>
        <h4>Customs, Duties &amp; Taxes</h4>
        <p>Prices may or may not include taxes and import fees depending on your destination and the shipping method.</p>
        <h4>Delivery Issues &amp; Risk of Loss</h4>
        <p>Ensure your shipping address and contact details are accurate. We are not responsible for loss, delay, or misdelivery arising from incorrect or incomplete addresses provided by you.</p>
        <h4>Exclusions</h4>
        <ul>
          <li>We do not accept returns for buyer’s remorse where not required by law.</li>
          <li>We do not accept returns for incorrect size/color/variant chosen by the customer, unless required by law.</li>
          <li>Minor variations in color, packaging, or appearance that do not affect basic function are not considered defects.</li>
        </ul>
        <h4>Contact</h4>
        <p>To exercise your rights or request help with an order, contact us at the email address shown on the checkout or confirmation email.</p>
        <p><em>Nothing in these policies is intended to exclude or limit any non-waivable rights you may have under applicable consumer protection or e-commerce law.</em></p>`;

    wrapper.append(themeSection, currencySection, countrySection, clearSection, contactSection, legalSection);
    viewer.appendChild(wrapper);

    document.getElementById('clearDataButton')?.addEventListener('click', () => {
      if (!confirm('Are you sure you want to reset all saved data?')) return;
      localStorage.clear();
      sessionStorage.clear();
      alert('All data cleared. Reloading page...');
    });

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.checked = localStorage.getItem('themeMode') === 'dark';
      themeToggle.addEventListener('change', (e) => {
        const darkMode = !!e.target.checked;
        document.documentElement.classList.toggle('dark-mode', darkMode);
        document.documentElement.classList.toggle('light-mode', !darkMode);
        localStorage.setItem('themeMode', darkMode ? 'dark' : 'light');
      });
    }

    const currencySelect = document.getElementById('currencySelect');
    const countrySelect = document.getElementById('countrySelect');
    const detectedCountry = (localStorage.getItem('detectedCountry') || 'US').toUpperCase();
    const detectedSpan = document.getElementById('detected-country');
    if (detectedSpan) detectedSpan.textContent = detectedCountry;

    if (currencySelect) {
      currencySelect.innerHTML = '';
      const codes = Object.keys(ctx.getExchangeRates?.() || {}).sort();
      for (const code of codes) {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = `${ctx.currencySymbols?.[code] || ''} ${code}`.trim();
        currencySelect.appendChild(opt);
      }

      const restoredCurrency = localStorage.getItem('selectedCurrency') || ctx.getSelectedCurrency?.() || 'EUR';
      ctx.setSelectedCurrency?.(restoredCurrency);
      ctx.syncCentralState?.('currency-restore', { selectedCurrency: restoredCurrency });
      currencySelect.value = restoredCurrency;
    }

    if (countrySelect) {
      countrySelect.innerHTML = '';
      (window.preloadedData?.countries || []).slice().sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''))).forEach((c) => {
        const code = String(c.code || '').toUpperCase();
        if (!code) return;
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = ctx.countryNames?.[code] || code;
        countrySelect.appendChild(opt);
      });
      countrySelect.value = detectedCountry;
    }

    if (currencySelect?.tomselect) currencySelect.tomselect.destroy();
    if (countrySelect?.tomselect) countrySelect.tomselect.destroy();

    if (currencySelect) {
      if (typeof TomSelect === 'function') {
        new TomSelect('#currencySelect', {
          maxOptions: 200,
          sortField: { field: 'text', direction: 'asc' },
          placeholder: 'Select a currency…',
          closeAfterSelect: true,
          onChange: (val) => {
            if (!val) return;
            ctx.setSelectedCurrency?.(val);
            localStorage.setItem('selectedCurrency', val);
            ctx.syncCentralState?.('currency-select-tom', { selectedCurrency: val });
            localStorage.setItem('manualCurrencyOverride', 'true');
            ctx.syncCurrencySelects?.(val);
            ctx.updateAllPrices?.();
          }
        });
      }
      currencySelect.classList.remove('tom-hidden');
    }

    if (countrySelect) {
      if (typeof TomSelect === 'function') {
        new TomSelect('#countrySelect', {
          maxOptions: 1000,
          sortField: { field: 'text', direction: 'asc' },
          placeholder: 'Select a country…',
          closeAfterSelect: true,
          onChange: (val) => {
            if (!val) return;
            const newCountry = String(val).toUpperCase();
            localStorage.setItem('detectedCountry', newCountry);
            if (detectedSpan) detectedSpan.textContent = newCountry;
            if (ctx.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE && !localStorage.getItem('manualCurrencyOverride')) {
              const newCurrency = ctx.countryToCurrency?.[newCountry];
              if (newCurrency) {
                ctx.setSelectedCurrency?.(newCurrency);
                localStorage.setItem('selectedCurrency', newCurrency);
                ctx.syncCentralState?.('country-auto-currency', { selectedCurrency: newCurrency });
                ctx.syncCurrencySelects?.(newCurrency);
              }
            }
            ctx.updateAllPrices?.();
          }
        });
      }
      countrySelect.classList.remove('tom-hidden');
    }

    const isValidEmailClient = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
    const cf = document.getElementById('contact-form');
    if (cf) {
      cf.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('contact-email')?.value?.trim() || '';
        const message = document.getElementById('contact-message')?.value?.trim() || '';
        const website = '';
        if (!isValidEmailClient(email)) return alert('Please enter a valid email address (e.g., name@example.com).');
        if (message.length < 5) return alert('Please enter a message (at least 5 characters).');

        let turnstileToken = '';
        try {
          turnstileToken = (await ctx.snagletGetTurnstileToken?.({ forceFresh: true })) || document.querySelector('input[name="cf-turnstile-response"]')?.value || '';
        } catch {
          turnstileToken = document.querySelector('input[name="cf-turnstile-response"]')?.value || '';
        }

        try {
          const result = await window.__SS_CONTACT__.sendMessage({ email, message, turnstileToken, website });
          alert(result.message || 'Message sent.');
          const msgEl = document.getElementById('contact-message');
          if (msgEl) msgEl.value = '';
        } catch (error) {
          console.error('Failed to send message:', error);
          alert('An error occurred. Try emailing us directly.');
        }
      });
    }

    if (currencySelect) ctx.syncCurrencySelects?.(currencySelect.value || ctx.getSelectedCurrency?.() || 'EUR');
  }

  window.__SS_SETTINGS_RUNTIME__ = { preloadSettingsData, goToSettings };
})(window, document);
