(function (window, document) {
  'use strict';
  const COUNTRY_OVERRIDE_STORAGE_KEY = 'selectedCountryOverride';

  function normalizeCountryCode(value, fallback = '') {
    const code = String(value || '').trim().toUpperCase();
    return code || fallback;
  }

  function getPreferredCountryCode() {
    try {
      return normalizeCountryCode(localStorage.getItem(COUNTRY_OVERRIDE_STORAGE_KEY)) ||
        normalizeCountryCode(localStorage.getItem('detectedCountry'), 'US');
    } catch {}
    return 'US';
  }

  function setPreferredCountryCode(value) {
    const code = normalizeCountryCode(value);
    if (!code) return '';
    try {
      localStorage.setItem(COUNTRY_OVERRIDE_STORAGE_KEY, code);
      localStorage.setItem('detectedCountry', code);
    } catch {}
    return code;
  }

  async function preloadSettingsData(ctx = {}) {
    const forceRefresh = ctx.forceRefresh === true;
    if (!forceRefresh && ctx.getPreloadPromise?.()) return ctx.getPreloadPromise();

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

        const safeCall = (fn, fallback = null) => {
          try {
            if (typeof fn !== 'function') return Promise.resolve(fallback);
            return Promise.resolve(fn()).catch(() => fallback);
          } catch {
            return Promise.resolve(fallback);
          }
        };

        const cached = forceRefresh ? null : ctx.safeJsonParse?.(ctx.lsGet?.(ctx.SETTINGS_CACHE_KEY));
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
          const cachedStorefrontConfig = cached.storefrontConfig || cached.storefront || window.storefrontCfg || null;
          window.preloadedData.storefrontConfig = cachedStorefrontConfig;
          if (cachedStorefrontConfig && typeof cachedStorefrontConfig === 'object') window.storefrontCfg = cachedStorefrontConfig;
          if (!cachedStorefrontConfig) {
            const storefrontCfg = await safeCall(ctx.fetchStorefrontConfigFromServer, null);
            if (storefrontCfg && typeof storefrontCfg === 'object') {
              window.storefrontCfg = storefrontCfg;
              window.preloadedData.storefrontConfig = storefrontCfg;
              ctx.lsSet?.(ctx.SETTINGS_CACHE_KEY, JSON.stringify({
                ...cached,
                tariffs: safeTariffs,
                rates: safeRates,
                ratesFetchedAt: Number(window.exchangeRatesFetchedAt || 0) || 0,
                countries: window.preloadedData.countries,
                storefrontConfig: storefrontCfg,
                timestamp: Date.now()
              }));
            }
          }
          ctx.handlesTariffsDropdown?.(window.preloadedData.countries || []);
          console.log('⚡ Using cached settings data.');
          return;
        }
        const [tariffsObj, ratesData, countriesArr, storefrontCfg] = await Promise.all([
          safeCall(ctx.fetchTariffsFromServer, {}),
          safeCall(ctx.fetchExchangeRatesFromServer, {}),
          safeCall(ctx.fetchCountriesFromServer, null),
          safeCall(ctx.fetchStorefrontConfigFromServer, null)
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
        if (window.preloadedData.storefrontConfig && typeof window.preloadedData.storefrontConfig === 'object') {
          window.storefrontCfg = window.preloadedData.storefrontConfig;
        }

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

  function clearSettingsCache(ctx = {}) {
    try { ctx.setPreloadPromise?.(null); } catch {}
    try {
      const key = String(ctx.SETTINGS_CACHE_KEY || window.SETTINGS_CACHE_KEY || 'preloadedSettings').trim() || 'preloadedSettings';
      if (typeof ctx.lsRemove === 'function') ctx.lsRemove(key);
      else localStorage.removeItem(key);
    } catch {}
    try {
      if (typeof ctx.setExchangeRatesFetchedAt === 'function') ctx.setExchangeRatesFetchedAt(0);
    } catch {}
    try { window.exchangeRatesFetchedAt = 0; } catch {}
    try {
      window.preloadedData = window.preloadedData || {};
      window.preloadedData.tariffs = null;
      window.preloadedData.countries = null;
      window.preloadedData.exchangeRates = null;
      window.preloadedData.ratesFetchedAt = 0;
    } catch {}
  }

  function addUniqueCode(out, seen, value) {
    const code = String(value || '').trim().toUpperCase();
    if (!code || seen.has(code)) return;
    seen.add(code);
    out.push(code);
  }

  function normalizeCountryEntry(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') {
      const code = String(entry || '').trim().toUpperCase();
      return code ? { code } : null;
    }
    const code = String(entry.code || entry.countryCode || entry.id || '').trim().toUpperCase();
    if (!code) return null;
    return { ...entry, code };
  }

  const SEARCH_LOCALES = [
    'en', 'en-US', 'en-GB', 'sk', 'cs', 'pl', 'de', 'fr', 'es', 'it', 'pt', 'pt-BR',
    'nl', 'sv', 'da', 'fi', 'no', 'hu', 'ro', 'bg', 'hr', 'sl', 'uk', 'ru', 'tr',
    'el', 'ar', 'he', 'zh-CN', 'ja', 'ko', 'hi', 'id', 'ms', 'th', 'vi'
  ];

  const US_STATE_NAMES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
  ];

  const COUNTRY_ALIAS_MAP = {
    US: ['US', 'U.S.', 'USA', 'U.S.A.', 'United States of America', 'America', ...US_STATE_NAMES],
    GB: ['UK', 'U.K.', 'Britain', 'Great Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland'],
    AE: ['UAE', 'U.A.E.', 'Emirates'],
    CZ: ['Czech Republic', 'Cesko', 'Česko'],
    KR: ['South Korea', 'Republic of Korea', 'Korea', '대한민국', '한국'],
    RU: ['Russian Federation', 'Россия'],
    UA: ['Україна', 'Украина'],
    DE: ['Deutschland'],
    AT: ['Österreich', 'Oesterreich'],
    CH: ['Schweiz', 'Suisse', 'Svizzera'],
    ES: ['España', 'Espana'],
    GR: ['Ελλάδα', 'Hellas'],
    JP: ['Nippon', 'Nihon', '日本'],
    CN: ['Zhongguo', '中国', '中國'],
    IN: ['Bharat', 'भारत'],
    FI: ['Suomi'],
    SE: ['Sverige'],
    NO: ['Norge'],
    DK: ['Danmark'],
    PL: ['Polska'],
    HU: ['Magyarország', 'Magyarorszag'],
    RO: ['România', 'Romania'],
    BG: ['България'],
    TR: ['Türkiye', 'Turkiye'],
    IL: ['ישראל'],
    SA: ['السعودية'],
    BR: ['Brasil'],
    MX: ['México', 'Mexico'],
    NL: ['Nederland', 'Holland'],
    SK: ['Slovensko'],
    SI: ['Slovenija'],
    HR: ['Hrvatska'],
    LV: ['Latvija'],
    LT: ['Lietuva'],
    EE: ['Eesti'],
    CI: ['Cote d Ivoire', 'Côte d’Ivoire', 'Ivory Coast']
  };

  const CURRENCY_ALIAS_MAP = {
    EUR: ['Euro', 'Euros', '€'],
    USD: ['US Dollar', 'US Dollars', 'American Dollar', 'American Dollars', 'Dollar', 'Dollars', '$', 'Buck', 'Bucks'],
    GBP: ['British Pound', 'British Pounds', 'Pound Sterling', 'Pounds', '£'],
    CAD: ['Canadian Dollar', 'Canadian Dollars', 'C$', 'CA Dollar'],
    AUD: ['Australian Dollar', 'Australian Dollars', 'A$', 'AU Dollar'],
    MXN: ['Mexican Peso', 'Mexican Pesos'],
    PLN: ['Polish Zloty', 'Polish Złoty', 'Zloty', 'Złoty'],
    CZK: ['Czech Koruna', 'Czech Crown', 'Koruna'],
    SEK: ['Swedish Krona', 'Swedish Crown', 'Krona'],
    NOK: ['Norwegian Krone', 'Norwegian Crown', 'Krone'],
    DKK: ['Danish Krone', 'Danish Crown', 'Krone'],
    HUF: ['Hungarian Forint', 'Forint'],
    RON: ['Romanian Leu', 'Leu'],
    BGN: ['Bulgarian Lev', 'Lev'],
    RUB: ['Russian Ruble', 'Rouble', 'Рубль'],
    UAH: ['Ukrainian Hryvnia', 'Hryvnia', 'Hrivnia', 'Гривня'],
    JPY: ['Japanese Yen', 'Yen', '円'],
    CNY: ['Chinese Yuan', 'Yuan', 'Renminbi', '人民币'],
    INR: ['Indian Rupee', 'Rupee', '₹'],
    KRW: ['South Korean Won', 'Won', '원'],
    BRL: ['Brazilian Real', 'Real'],
    ARS: ['Argentine Peso', 'Argentinian Peso'],
    CLP: ['Chilean Peso'],
    COP: ['Colombian Peso'],
    PEN: ['Peruvian Sol', 'Nuevo Sol'],
    TRY: ['Turkish Lira', 'Lira'],
    ILS: ['Israeli Shekel', 'New Shekel', 'Shekel'],
    AED: ['UAE Dirham', 'Dirham'],
    SAR: ['Saudi Riyal', 'Riyal'],
    ZAR: ['South African Rand', 'Rand'],
    NGN: ['Nigerian Naira', 'Naira'],
    KES: ['Kenyan Shilling', 'Shilling'],
    EGP: ['Egyptian Pound'],
    NZD: ['New Zealand Dollar', 'NZ Dollar'],
    FJD: ['Fijian Dollar'],
    PHP: ['Philippine Peso', 'Peso'],
    THB: ['Thai Baht', 'Baht'],
    VND: ['Vietnamese Dong', 'Dong'],
    MYR: ['Malaysian Ringgit', 'Ringgit'],
    IDR: ['Indonesian Rupiah', 'Rupiah'],
    PKR: ['Pakistani Rupee'],
    BDT: ['Bangladeshi Taka', 'Taka']
  };

  function normalizeSearchText(value) {
    let text = String(value || '').trim().toLowerCase();
    if (!text) return '';
    try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch {}
    text = text
      .replace(/ß/g, 'ss')
      .replace(/æ/g, 'ae')
      .replace(/œ/g, 'oe')
      .replace(/ø/g, 'o')
      .replace(/đ/g, 'd')
      .replace(/ł/g, 'l')
      .replace(/þ/g, 'th')
      .replace(/&/g, ' and ')
      .replace(/[@]/g, ' at ')
      .replace(/[’'`´]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
    return text;
  }

  function collectIntlDisplayNames(type, code, locales = SEARCH_LOCALES) {
    const out = [];
    const seen = new Set();
    if (!code || typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') return out;
    for (const locale of locales) {
      try {
        const dn = new Intl.DisplayNames([locale], { type });
        const value = String(dn.of(code) || '').trim();
        if (!value || value.toUpperCase() === String(code).toUpperCase() || seen.has(value)) continue;
        seen.add(value);
        out.push(value);
      } catch {}
    }
    return out;
  }

  function buildSearchAliases(values = []) {
    const aliases = [];
    const seen = new Set();
    const push = (value) => {
      const raw = String(value || '').trim();
      if (!raw) return;
      const normalized = normalizeSearchText(raw);
      const compact = normalized.replace(/\s+/g, '');
      for (const variant of [raw, normalized, compact]) {
        const candidate = String(variant || '').trim();
        if (!candidate) continue;
        const key = candidate.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        aliases.push(candidate);
      }
    };
    values.forEach(push);
    return aliases;
  }

  function buildTomSelectScore() {
    return function score(search) {
      const queryRaw = String(search?.query || '').trim();
      const queryNorm = normalizeSearchText(queryRaw);
      const queryCompact = queryNorm.replace(/\s+/g, '');
      if (!queryNorm && !queryCompact) return () => 1;
      return function itemScore(item) {
        const aliases = Array.isArray(item?.searchAliases)
          ? item.searchAliases
          : buildSearchAliases([item?.text, item?.value, item?.searchTokens]);
        let best = 0;
        for (const alias of aliases) {
          const aliasNorm = normalizeSearchText(alias);
          const aliasCompact = aliasNorm.replace(/\s+/g, '');
          if (!aliasNorm && !aliasCompact) continue;
          if (queryCompact && aliasCompact === queryCompact) best = Math.max(best, 1000);
          else if (queryNorm && aliasNorm === queryNorm) best = Math.max(best, 950);
          else if (queryCompact && aliasCompact.startsWith(queryCompact)) best = Math.max(best, 760);
          else if (queryNorm && aliasNorm.startsWith(queryNorm)) best = Math.max(best, 720);
          else if (queryNorm) {
            const tokens = aliasNorm.split(' ').filter(Boolean);
            if (tokens.some((token) => token.startsWith(queryNorm))) best = Math.max(best, 560);
            else if (aliasNorm.includes(queryNorm) || (queryCompact && aliasCompact.includes(queryCompact))) best = Math.max(best, 360);
          }
        }
        return best > 0 ? best / 1000 : 0;
      };
    };
  }

  function getCountryAliases(ctx = {}, code = '') {
    const cc = String(code || '').trim().toUpperCase();
    if (!cc) return [];
    const name = String(ctx.countryNames?.[cc] || cc).trim();
    return buildSearchAliases([
      cc,
      name,
      ...(COUNTRY_ALIAS_MAP[cc] || []),
      ...collectIntlDisplayNames('region', cc)
    ]);
  }

  function buildCountrySearchOptions(ctx = {}, countriesList = []) {
    return countriesList.map((entry) => {
      const code = String(entry?.code || '').trim().toUpperCase();
      const text = String(ctx.countryNames?.[code] || code).trim();
      const searchAliases = getCountryAliases(ctx, code);
      return {
        value: code,
        text,
        code,
        searchAliases,
        searchTokens: searchAliases.join(' | ')
      };
    }).filter((entry) => entry.value);
  }

  function buildCurrencySearchOptions(ctx = {}, codes = []) {
    const countriesByCurrency = {};
    for (const [countryCode, currencyCode] of Object.entries(ctx.countryToCurrency || {})) {
      const cur = String(currencyCode || '').trim().toUpperCase();
      if (!cur) continue;
      countriesByCurrency[cur] = countriesByCurrency[cur] || [];
      countriesByCurrency[cur].push(String(countryCode || '').trim().toUpperCase());
    }
    return codes.map((code) => {
      const currencyCode = String(code || '').trim().toUpperCase();
      const symbol = String(ctx.currencySymbols?.[currencyCode] || '').trim();
      const englishName = collectIntlDisplayNames('currency', currencyCode, ['en'])[0] || currencyCode;
      const countryAliases = (countriesByCurrency[currencyCode] || []).flatMap((countryCode) => getCountryAliases(ctx, countryCode));
      const searchAliases = buildSearchAliases([
        currencyCode,
        symbol,
        englishName,
        ...(CURRENCY_ALIAS_MAP[currencyCode] || []),
        ...collectIntlDisplayNames('currency', currencyCode),
        ...countryAliases
      ]);
      return {
        value: currencyCode,
        text: `${symbol || ''} ${currencyCode}`.trim(),
        code: currencyCode,
        searchAliases,
        searchTokens: searchAliases.join(' | ')
      };
    }).filter((entry) => entry.value);
  }

  function buildCurrencyCodeList(ctx = {}) {
    const codes = [];
    const seen = new Set();
    Object.keys(ctx.getExchangeRates?.() || {}).forEach((code) => addUniqueCode(codes, seen, code));
    Object.keys(ctx.currencySymbols || {}).forEach((code) => addUniqueCode(codes, seen, code));
    Object.values(ctx.countryToCurrency || {}).forEach((code) => addUniqueCode(codes, seen, code));
    addUniqueCode(codes, seen, localStorage.getItem('selectedCurrency') || ctx.getSelectedCurrency?.() || 'EUR');
    addUniqueCode(codes, seen, 'EUR');
    return codes.sort();
  }

  function buildCountriesList(ctx = {}) {
    const countries = [];
    const seen = new Set();
    const addCountry = (entry) => {
      const normalized = normalizeCountryEntry(entry);
      if (!normalized?.code || seen.has(normalized.code)) return;
      seen.add(normalized.code);
      countries.push(normalized);
    };
    (window.preloadedData?.countries || []).forEach(addCountry);
    Object.keys(ctx.getTariffMultipliers?.() || {}).forEach((code) => addCountry({ code, tariff: Number((ctx.getTariffMultipliers?.() || {})[code] || 0) || 0 }));
    Object.keys(ctx.countryNames || {}).forEach((code) => addCountry({ code }));
    addCountry({ code: getPreferredCountryCode() });
    return countries.sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
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
        <select id="currencySelect" class="currencySelect tom-hidden ss-select-fullwidth"></select>
      `;

    const countrySection = document.createElement('div');
    countrySection.classList.add('settings-section');
    countrySection.innerHTML = `
        <h3>Shipping Country</h3>
        <label for="countrySelect">Detected: <span id="detected-country"></span></label>
        <select id="countrySelect" class="tom-hidden ss-select-fullwidth"></select>
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
      <div aria-hidden="true" class="ss-hidden-honeypot">
        <label for="contact-website">Website</label>
        <input type="text" id="contact-website" name="contact_website_do_not_fill" autocomplete="off" tabindex="-1" inputmode="none" value="" aria-hidden="true" spellcheck="false">
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
      try {
        window.location.replace(window.location.pathname + window.location.search);
      } catch {
        window.location.reload();
      }
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
    const detectedCountry = getPreferredCountryCode();
    const detectedSpan = document.getElementById('detected-country');
    if (detectedSpan) detectedSpan.textContent = detectedCountry;
    const countriesList = buildCountriesList(ctx);
    if (countriesList.length) {
      window.preloadedData = window.preloadedData || {};
      window.preloadedData.countries = countriesList;
    }

    if (currencySelect) {
      const codes = buildCurrencyCodeList(ctx);
      const currencyOptions = buildCurrencySearchOptions(ctx, codes);
      currencySelect.innerHTML = '';
      if (typeof TomSelect !== 'function') {
        for (const option of currencyOptions) {
          const opt = document.createElement('option');
          opt.value = option.value;
          opt.textContent = option.text;
          currencySelect.appendChild(opt);
        }
      }

      const restoredCurrency = localStorage.getItem('selectedCurrency') || ctx.getSelectedCurrency?.() || 'EUR';
      ctx.setSelectedCurrency?.(restoredCurrency);
      ctx.syncCentralState?.('currency-restore', { selectedCurrency: restoredCurrency });
      currencySelect.value = restoredCurrency;
    }

    if (countrySelect) {
      const countryOptions = buildCountrySearchOptions(ctx, countriesList);
      countrySelect.innerHTML = '';
      if (typeof TomSelect !== 'function') {
        countryOptions.forEach((option) => {
          const opt = document.createElement('option');
          opt.value = option.value;
          opt.textContent = option.text;
          countrySelect.appendChild(opt);
        });
      }
      countrySelect.value = detectedCountry;
    }

    if (currencySelect?.tomselect) currencySelect.tomselect.destroy();
    if (countrySelect?.tomselect) countrySelect.tomselect.destroy();

    if (currencySelect) {
      if (typeof TomSelect === 'function') {
        const currencyOptions = buildCurrencySearchOptions(ctx, buildCurrencyCodeList(ctx));
        new TomSelect('#currencySelect', {
          options: currencyOptions,
          items: [localStorage.getItem('selectedCurrency') || ctx.getSelectedCurrency?.() || 'EUR'],
          valueField: 'value',
          labelField: 'text',
          searchField: ['text', 'searchTokens'],
          score: buildTomSelectScore(),
          maxOptions: 200,
          sortField: [{ field: '$score', direction: 'desc' }, { field: 'text', direction: 'asc' }],
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
        const countryOptions = buildCountrySearchOptions(ctx, countriesList);
        new TomSelect('#countrySelect', {
          options: countryOptions,
          items: [detectedCountry],
          valueField: 'value',
          labelField: 'text',
          searchField: ['text', 'searchTokens'],
          score: buildTomSelectScore(),
          maxOptions: 1000,
          sortField: [{ field: '$score', direction: 'desc' }, { field: 'text', direction: 'asc' }],
          placeholder: 'Select a country…',
          closeAfterSelect: true,
          onChange: (val) => {
            if (!val) return;
            const newCountry = String(val).toUpperCase();
            setPreferredCountryCode(newCountry);
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
        const website = document.getElementById('contact-website')?.value?.trim() || '';
        if (!isValidEmailClient(email)) return alert('Please enter a valid email address (e.g., name@example.com).');
        if (message.length < 5) return alert('Please enter a message (at least 5 characters).');
        if (website) {
          try { cf.reset(); } catch {}
          alert('Message sent.');
          return;
        }

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

  window.__SS_SETTINGS_RUNTIME__ = { preloadSettingsData, clearSettingsCache, goToSettings };
})(window, document);
