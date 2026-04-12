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

  function enhanceTomSelectSearch(instance, { placeholder = 'Type to search...' } = {}) {
    if (!instance || typeof instance !== 'object') return instance;
    const attach = () => {
      const control = instance.control;
      const input = instance.control_input || control?.querySelector('input');
      if (!control || !input) return;
      const syncInput = () => {
        try {
          input.readOnly = false;
          input.disabled = false;
          input.removeAttribute('readonly');
          input.removeAttribute('disabled');
        } catch {}
        try {
          input.setAttribute('placeholder', placeholder);
          input.setAttribute('aria-label', placeholder);
        } catch {}
      };
      try {
        input.setAttribute('type', 'search');
        input.setAttribute('inputmode', 'search');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'none');
        input.setAttribute('spellcheck', 'false');
      } catch {}
      if (control.dataset.ssSearchReady === '1') return;
      const focusInput = () => {
        syncInput();
        try {
          requestAnimationFrame(() => {
            try { input.focus({ preventScroll: true }); } catch {
              try { input.focus(); } catch {}
            }
          });
        } catch {
          try { input.focus(); } catch {}
        }
      };
      syncInput();
      try { instance.on?.('dropdown_open', focusInput); } catch {}
      try { instance.on?.('focus', syncInput); } catch {}
      try { instance.on?.('type', syncInput); } catch {}
      control.dataset.ssSearchReady = '1';
    };
    attach();
    try { requestAnimationFrame(attach); } catch {}
    try { setTimeout(attach, 0); } catch {}
    try { setTimeout(attach, 80); } catch {}
    return instance;
  }

  function enhanceTomSelectFiltering(instance, sourceOptions = []) {
    if (!instance || typeof instance !== 'object' || instance.__ssFilteringReady) return instance;
    const allOptions = Array.isArray(sourceOptions) ? sourceOptions.slice() : [];
    const scoreFactory = buildTomSelectScore();
    const getSelectedValues = () => {
      try {
        const values = Array.isArray(instance.items) ? instance.items.slice() : [];
        if (values.length) return values.filter(Boolean);
      } catch {}
      try {
        const single = instance.getValue?.();
        return single ? [single] : [];
      } catch {}
      return [];
    };
    const render = (query = '') => {
      const scorer = scoreFactory({ query });
      let filtered = allOptions.slice();
      if (String(query || '').trim()) {
        filtered = allOptions
          .map((option) => ({ option, score: Number(scorer(option) || 0) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return String(a.option?.text || '').localeCompare(String(b.option?.text || ''));
          })
          .map((entry) => entry.option);
      }
      const selected = new Set(getSelectedValues());
      const selectedBackfill = allOptions.filter((option) => selected.has(option?.value));
      const seen = new Set();
      const finalOptions = [...filtered, ...selectedBackfill].filter((option) => {
        const value = String(option?.value || '').trim();
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
      });
      try { instance.clearOptions(); } catch {}
      for (const option of finalOptions) {
        try { instance.addOption(option); } catch {}
      }
      try { instance.refreshOptions(String(query || '').trim().length > 0); } catch {}
    };
    try {
      instance.on?.('type', render);
      instance.on?.('dropdown_open', () => render(instance.control_input?.value || ''));
      instance.on?.('clear', () => render(''));
      instance.on?.('change', () => render(instance.control_input?.value || ''));
    } catch {}
    render('');
    instance.__ssFilteringReady = true;
    return instance;
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

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildDesktopRegionCtx(overrides = {}) {
    const pricingRuntime = window.__SS_PRICING__ || {};
    return {
      preloadSettingsData: overrides.preloadSettingsData || window.preloadSettingsData || (() => Promise.resolve()),
      currencySymbols: overrides.currencySymbols || window.currencySymbols || {},
      countryNames: overrides.countryNames || window.countryNames || {},
      countryToCurrency: overrides.countryToCurrency || window.countryToCurrency || {},
      getSelectedCurrency: overrides.getSelectedCurrency || (() => String(window.selectedCurrency || localStorage.getItem('selectedCurrency') || 'EUR').trim().toUpperCase() || 'EUR'),
      setSelectedCurrency: overrides.setSelectedCurrency || ((value) => {
        try { window.selectedCurrency = String(value || 'EUR').trim().toUpperCase() || 'EUR'; } catch {}
      }),
      syncCurrencySelects: overrides.syncCurrencySelects || window.syncCurrencySelects || (() => {}),
      updateAllPrices: overrides.updateAllPrices || window.updateAllPrices || (() => {}),
      getTariffMultipliers: overrides.getTariffMultipliers || (() => window.tariffMultipliers || {}),
      AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE: typeof overrides.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE === 'boolean'
        ? overrides.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE
        : (window.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE !== false),
      fetchCountriesFromServer: overrides.fetchCountriesFromServer || pricingRuntime.fetchCountriesFromServer || null
    };
  }

  function getCountryLabel(ctx = {}, code = '') {
    const cc = String(code || '').trim().toUpperCase();
    return String(ctx.countryNames?.[cc] || cc).trim() || cc;
  }

  function getCurrencyLongLabel(ctx = {}, code = '') {
    const currencyCode = String(code || '').trim().toUpperCase();
    if (!currencyCode) return '';
    const englishName = collectIntlDisplayNames('currency', currencyCode, ['en'])[0] || currencyCode;
    return `${currencyCode} (${englishName})`;
  }

  function getCurrencyCompactLabel(ctx = {}, code = '') {
    const currencyCode = String(code || '').trim().toUpperCase();
    if (!currencyCode) return '';
    const symbol = String(ctx.currencySymbols?.[currencyCode] || '').trim();
    return `${currencyCode}${symbol ? ` ${symbol}` : ''}`;
  }

  function normalizeFlagSource(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^<svg[\s>]/i.test(raw)) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(raw)}`;
    }
    return raw;
  }

  function resolveCountryFlagSource(entry = {}, code = '') {
    const explicit = [
      entry?.flagSvg,
      entry?.flagUrl,
      entry?.flagImage,
      entry?.flag,
      entry?.svg,
      entry?.image,
      entry?.imageUrl
    ].map(normalizeFlagSource).find(Boolean);
    if (explicit) return explicit;

    const cc = String(code || entry?.code || '').trim().toLowerCase();
    if (/^[a-z]{2}$/.test(cc)) {
      return `https://flagcdn.com/24x18/${cc}.png`;
    }
    return '';
  }

  function buildFlagMarkup(flagSrc = '', alt = '') {
    if (!flagSrc) return '';
    return `
      <span class="ss-desktop-region-flag">
        <img src="${escapeHtml(flagSrc)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.closest('.ss-desktop-region-flag')?.remove();">
      </span>
    `;
  }

  function rankSearchOptions(options = [], query = '') {
    const list = Array.isArray(options) ? options.slice() : [];
    const q = String(query || '').trim();
    if (!q) return list;
    const scorer = buildTomSelectScore()({ query: q });
    return list
      .map((option) => ({ option, score: Number(scorer(option) || 0) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.option?.displayText || a.option?.text || '').localeCompare(String(b.option?.displayText || b.option?.text || ''));
      })
      .map((entry) => entry.option);
  }

  function syncDesktopRegionLauncher(payload = {}) {
    const launcher = document.getElementById('desktopRegionLauncher');
    if (!launcher) return;
    const ctx = buildDesktopRegionCtx();
    const currentCurrency = String(payload.currency || document.getElementById('currency-select')?.value || ctx.getSelectedCurrency?.() || 'EUR').trim().toUpperCase() || 'EUR';
    const label = launcher.querySelector('.ss-desktop-region-launcher__label');
    if (label) label.textContent = getCurrencyCompactLabel(ctx, currentCurrency) || currentCurrency;
  }

  function initDesktopRegionModal(overrides = {}) {
    if (window.innerWidth <= 680) return null;
    const nativeSelect = document.getElementById('currency-select');
    if (!nativeSelect) return null;

    let launcher = document.getElementById('desktopRegionLauncher');
    if (!launcher) {
      launcher = document.createElement('button');
      launcher.type = 'button';
      launcher.id = 'desktopRegionLauncher';
      launcher.className = 'currency-select currency-select--launcher';
      launcher.setAttribute('aria-haspopup', 'dialog');
      launcher.setAttribute('aria-expanded', 'false');
      launcher.innerHTML = `
        <span class="ss-desktop-region-launcher__label"></span>
        <span class="ss-desktop-region-launcher__chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      `;
      nativeSelect.insertAdjacentElement('beforebegin', launcher);
    }
    nativeSelect.classList.add('currency-select-native');
    nativeSelect.setAttribute('aria-hidden', 'true');
    nativeSelect.tabIndex = -1;
    syncDesktopRegionLauncher();

    if (launcher.dataset.regionModalBound === '1') return launcher;
    launcher.dataset.regionModalBound = '1';

    const modal = document.createElement('div');
    modal.id = 'ssDesktopRegionModal';
    modal.className = 'ss-desktop-region-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="ss-desktop-region-modal__backdrop" data-close="true"></div>
      <div class="ss-desktop-region-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="ssDesktopRegionModalTitle">
        <div class="ss-desktop-region-modal__body">
          <section class="ss-desktop-region-field" data-kind="country">
            <div class="ss-desktop-region-field__title" id="ssDesktopRegionModalTitle">Ship to</div>
            <button type="button" class="ss-desktop-region-field__trigger" data-trigger="country">
              <span class="ss-desktop-region-field__value" data-field-value="country"></span>
              <span class="ss-desktop-region-field__chevron" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
            <div class="ss-desktop-region-field__panel" data-panel="country"></div>
          </section>

          <section class="ss-desktop-region-field" data-kind="currency">
            <div class="ss-desktop-region-field__title">Currency</div>
            <button type="button" class="ss-desktop-region-field__trigger" data-trigger="currency">
              <span class="ss-desktop-region-field__value" data-field-value="currency"></span>
              <span class="ss-desktop-region-field__chevron" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
            <div class="ss-desktop-region-field__panel" data-panel="currency"></div>
          </section>

          <button type="button" class="ss-desktop-region-save" data-save="true">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const recommendedCountryCodes = ['US', 'ES', 'FR', 'GB', 'BR', 'KR', 'DE', 'SK'];
    const state = {
      open: false,
      activePanel: '',
      stagedCountry: getPreferredCountryCode(),
      stagedCurrency: String(nativeSelect.value || localStorage.getItem('selectedCurrency') || 'EUR').trim().toUpperCase() || 'EUR',
      countryQuery: '',
      currencyQuery: '',
      currencyTouched: false
    };

    const getCtx = () => buildDesktopRegionCtx(overrides);
    const getCountryOptions = () => {
      const ctx = getCtx();
      const countries = buildCountriesList(ctx);
      return buildCountrySearchOptions(ctx, countries).map((option) => ({
        ...option,
        displayText: getCountryLabel(ctx, option.code),
        flagSrc: resolveCountryFlagSource(countries.find((entry) => String(entry?.code || '').toUpperCase() === String(option.code || '').toUpperCase()) || {}, option.code)
      }));
    };
    const getCurrencyOptions = () => {
      const ctx = getCtx();
      return buildCurrencySearchOptions(ctx, buildCurrencyCodeList(ctx)).map((option) => ({
        ...option,
        displayText: getCurrencyLongLabel(ctx, option.code)
      }));
    };

    const renderFieldValue = (kind) => {
      const ctx = getCtx();
      const target = modal.querySelector(`[data-field-value="${kind}"]`);
      if (!target) return;
      if (kind === 'country') {
        const options = getCountryOptions();
        const current = options.find((option) => option.code === state.stagedCountry);
        const label = current?.displayText || getCountryLabel(ctx, state.stagedCountry);
        target.innerHTML = `${buildFlagMarkup(current?.flagSrc || '', `${label} flag`)}<span class="ss-desktop-region-field__text">${escapeHtml(label)}</span>`;
        return;
      }
      target.innerHTML = `<span class="ss-desktop-region-field__text">${escapeHtml(getCurrencyLongLabel(ctx, state.stagedCurrency) || state.stagedCurrency)}</span>`;
    };

    const renderCountryPanel = () => {
      const panel = modal.querySelector('[data-panel="country"]');
      if (!panel) return;
      const query = state.countryQuery;
      const allOptions = getCountryOptions();
      const filtered = rankSearchOptions(allOptions, query);
      const preferredCodes = new Set([state.stagedCountry, ...recommendedCountryCodes]);
      const recommended = !query ? allOptions.filter((option) => preferredCodes.has(option.code)) : [];
      const recommendedCodes = new Set(recommended.map((option) => option.code));
      const rest = filtered.filter((option) => !recommendedCodes.has(option.code));
      const optionMarkup = (option) => `
        <button type="button" class="ss-desktop-region-option${option.code === state.stagedCountry ? ' is-selected' : ''}" data-option-kind="country" data-option-value="${escapeHtml(option.code)}">
          ${buildFlagMarkup(option.flagSrc || '', `${option.displayText} flag`)}
          <span class="ss-desktop-region-option__label">${escapeHtml(option.displayText)}</span>
        </button>
      `;
      panel.innerHTML = `
        <div class="ss-desktop-region-panel__search">
          <input type="search" class="ss-desktop-region-search" data-search-kind="country" placeholder="Search country" value="${escapeHtml(query)}">
        </div>
        <div class="ss-desktop-region-panel__scroll">
          ${recommended.length ? `
            <div class="ss-desktop-region-panel__section-title">Recommend</div>
            <div class="ss-desktop-region-panel__list">${recommended.map(optionMarkup).join('')}</div>
          ` : ''}
          ${rest.length ? `
            ${recommended.length ? '<div class="ss-desktop-region-panel__section-title">All countries</div>' : ''}
            <div class="ss-desktop-region-panel__list">${rest.map(optionMarkup).join('')}</div>
          ` : (!recommended.length ? '<div class="ss-desktop-region-panel__empty">No countries found.</div>' : '')}
        </div>
      `;
    };

    const renderCurrencyPanel = () => {
      const panel = modal.querySelector('[data-panel="currency"]');
      if (!panel) return;
      const query = state.currencyQuery;
      const options = rankSearchOptions(getCurrencyOptions(), query);
      panel.innerHTML = `
        <div class="ss-desktop-region-panel__search">
          <input type="search" class="ss-desktop-region-search" data-search-kind="currency" placeholder="Search currency" value="${escapeHtml(query)}">
        </div>
        <div class="ss-desktop-region-panel__scroll">
          ${options.length ? `<div class="ss-desktop-region-panel__list">
            ${options.map((option) => `
              <button type="button" class="ss-desktop-region-option${option.code === state.stagedCurrency ? ' is-selected' : ''}" data-option-kind="currency" data-option-value="${escapeHtml(option.code)}">
                <span class="ss-desktop-region-option__label">${escapeHtml(option.displayText)}</span>
              </button>
            `).join('')}
          </div>` : '<div class="ss-desktop-region-panel__empty">No currencies found.</div>'}
        </div>
      `;
    };

    const renderPanels = () => {
      renderFieldValue('country');
      renderFieldValue('currency');
      renderCountryPanel();
      renderCurrencyPanel();
      modal.querySelectorAll('.ss-desktop-region-field').forEach((field) => {
        field.classList.toggle('is-open', field.dataset.kind === state.activePanel);
      });
    };

    const focusActiveSearch = () => {
      if (!state.activePanel) return;
      const input = modal.querySelector(`.ss-desktop-region-field[data-kind="${state.activePanel}"] [data-search-kind="${state.activePanel}"]`);
      try { input?.focus({ preventScroll: true }); } catch { try { input?.focus(); } catch {} }
      try { input?.select?.(); } catch {}
    };

    const openModal = async () => {
      state.stagedCountry = getPreferredCountryCode();
      state.stagedCurrency = String(nativeSelect.value || localStorage.getItem('selectedCurrency') || getCtx().getSelectedCurrency?.() || 'EUR').trim().toUpperCase() || 'EUR';
      state.countryQuery = '';
      state.currencyQuery = '';
      state.currencyTouched = false;
      state.activePanel = '';
      try { await getCtx().preloadSettingsData?.(); } catch {}
      renderPanels();
      modal.hidden = false;
      modal.classList.add('is-open');
      launcher.setAttribute('aria-expanded', 'true');
      document.body.classList.add('ss-desktop-region-modal-open');
      state.open = true;
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('ss-desktop-region-modal-open');
      state.activePanel = '';
      state.countryQuery = '';
      state.currencyQuery = '';
      state.open = false;
    };

    const saveModal = () => {
      const ctx = getCtx();
      const currentCountry = getPreferredCountryCode();
      const currentCurrency = String(nativeSelect.value || localStorage.getItem('selectedCurrency') || ctx.getSelectedCurrency?.() || 'EUR').trim().toUpperCase() || 'EUR';
      if (state.stagedCountry && state.stagedCountry !== currentCountry) {
        setPreferredCountryCode(state.stagedCountry);
        const liveCountrySelect = document.getElementById('countrySelect');
        try {
          if (liveCountrySelect?.tomselect) liveCountrySelect.tomselect.setValue(state.stagedCountry, true);
          else if (liveCountrySelect) liveCountrySelect.value = state.stagedCountry;
        } catch {}
      }
      if (!state.currencyTouched && state.stagedCountry !== currentCountry && ctx.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE && !localStorage.getItem('manualCurrencyOverride')) {
        const autoCurrency = String(ctx.countryToCurrency?.[state.stagedCountry] || '').trim().toUpperCase();
        if (autoCurrency) state.stagedCurrency = autoCurrency;
      }
      if (state.stagedCurrency && state.stagedCurrency !== currentCurrency) {
        try { localStorage.setItem('manualCurrencyOverride', 'true'); } catch {}
        try {
          if (typeof window.handleCurrencyChange === 'function') window.handleCurrencyChange(state.stagedCurrency);
          else {
            ctx.setSelectedCurrency?.(state.stagedCurrency);
            localStorage.setItem('selectedCurrency', state.stagedCurrency);
            ctx.syncCurrencySelects?.(state.stagedCurrency);
            ctx.updateAllPrices?.();
          }
        } catch {}
      } else if (state.stagedCountry !== currentCountry) {
        try { ctx.updateAllPrices?.(); } catch {}
      }
      syncDesktopRegionLauncher({ currency: state.stagedCurrency });
      closeModal();
    };

    launcher.addEventListener('click', (event) => {
      event.preventDefault();
      if (state.open) {
        closeModal();
        return;
      }
      openModal();
    });

    nativeSelect.addEventListener('change', () => syncDesktopRegionLauncher({ currency: nativeSelect.value }));
    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-close="true"]')) {
        closeModal();
        return;
      }
      const trigger = event.target.closest('[data-trigger]');
      if (trigger) {
        const nextPanel = String(trigger.dataset.trigger || '');
        state.activePanel = state.activePanel === nextPanel ? '' : nextPanel;
        renderPanels();
        requestAnimationFrame(focusActiveSearch);
        return;
      }
      const option = event.target.closest('[data-option-kind]');
      if (option) {
        const kind = String(option.dataset.optionKind || '');
        const value = String(option.dataset.optionValue || '').trim().toUpperCase();
        if (kind === 'country' && value) {
          state.stagedCountry = value;
          state.countryQuery = '';
          state.activePanel = '';
          if (!state.currencyTouched && getCtx().AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE && !localStorage.getItem('manualCurrencyOverride')) {
            const autoCurrency = String(getCtx().countryToCurrency?.[value] || '').trim().toUpperCase();
            if (autoCurrency) state.stagedCurrency = autoCurrency;
          }
        }
        if (kind === 'currency' && value) {
          state.stagedCurrency = value;
          state.currencyTouched = true;
          state.currencyQuery = '';
          state.activePanel = '';
        }
        renderPanels();
        return;
      }
      if (event.target.closest('[data-save="true"]')) {
        saveModal();
      }
    });

    modal.addEventListener('input', (event) => {
      const search = event.target.closest('[data-search-kind]');
      if (!search) return;
      const kind = String(search.dataset.searchKind || '');
      if (kind === 'country') state.countryQuery = search.value || '';
      if (kind === 'currency') state.currencyQuery = search.value || '';
      renderPanels();
      requestAnimationFrame(focusActiveSearch);
    });

    document.addEventListener('keydown', (event) => {
      if (!state.open) return;
      if (String(event.key || '') === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    });

    return launcher;
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
    const detectedCountry = getPreferredCountryCode();

    const wrapper = document.createElement('div');
    wrapper.classList.add('settings-panel', 'settings-panel--modern');
    wrapper.innerHTML = `
      <section class="settings-hero">
        <div class="settings-hero-copy">
          <div class="settings-eyebrow">Store settings</div>
          <h2>Settings</h2>
          <p>Manage theme, region, saved data, support, and store policies for this device.</p>
        </div>
        <div class="settings-hero-summary">
          <div class="settings-summary-card">
            <span class="settings-summary-label">Theme</span>
            <strong id="settingsThemeSummary">Light</strong>
          </div>
          <div class="settings-summary-card">
            <span class="settings-summary-label">Currency</span>
            <strong id="settingsCurrencySummary">EUR</strong>
          </div>
          <div class="settings-summary-card">
            <span class="settings-summary-label">Country</span>
            <strong id="settingsCountrySummary">${detectedCountry}</strong>
          </div>
        </div>
      </section>
      <div class="settings-grid settings-grid--top"></div>
      <div class="settings-stack"></div>
    `;

    const topGrid = wrapper.querySelector('.settings-grid--top');
    const stack = wrapper.querySelector('.settings-stack');

    const TEXTS = ctx.TEXTS || {};
    const themeSection = document.createElement('div');
    themeSection.classList.add('settings-section', 'settings-card', 'settings-card--theme');
    themeSection.innerHTML = `
        <div class="settings-card-head">
          <div>
            <div class="settings-card-kicker">Appearance</div>
            <h3>Theme</h3>
            <p>Switch the storefront between light and dark without changing anything else.</p>
          </div>
        </div>
        <div class="settings-inline-setting">
          <div class="settings-inline-copy">
            <label for="themeAutoToggle">Use device theme</label>
            <div class="settings-inline-help">Automatically follows the browser or operating-system appearance preference when available.</div>
          </div>
          <label class="switch settings-switch">
            <input type="checkbox" id="themeAutoToggle">
            <span class="slider"></span>
          </label>
        </div>
        <div class="settings-inline-setting">
          <div class="settings-inline-copy">
            <label for="themeToggle">${TEXTS?.GENERAL?.DARK_MODE_LABEL || 'Dark Mode'}</label>
            <div class="settings-inline-help">Use this only when you want to override the device preference manually.</div>
          </div>
          <label class="switch settings-switch">
            <input type="checkbox" id="themeToggle">
            <span class="slider"></span>
          </label>
        </div>
      `;

    const currencySection = document.createElement('div');
    currencySection.classList.add('settings-section', 'settings-card', 'settings-card--currency');
    currencySection.innerHTML = `
        <div class="settings-card-head">
          <div>
            <div class="settings-card-kicker">Shopping region</div>
            <h3>Currency</h3>
            <p>Choose how prices should be displayed throughout the storefront.</p>
          </div>
        </div>
        <label for="currencySelect">Preferred currency</label>
        <select id="currencySelect" class="currencySelect tom-hidden ss-select-fullwidth"></select>
      `;

    const countrySection = document.createElement('div');
    countrySection.classList.add('settings-section', 'settings-card', 'settings-card--country');
    countrySection.innerHTML = `
        <div class="settings-card-head">
          <div>
            <div class="settings-card-kicker">Shopping region</div>
            <h3>Shipping country</h3>
            <p>Set the country we should use for tariffs, shipping context, and regional pricing logic.</p>
          </div>
        </div>
        <label for="countrySelect">Detected country <span class="settings-inline-value" id="detected-country"></span></label>
        <select id="countrySelect" class="tom-hidden ss-select-fullwidth"></select>
      `;

    const clearSection = document.createElement('div');
    clearSection.classList.add('settings-section', 'settings-card', 'settings-card--danger');
    clearSection.innerHTML = `
        <div class="settings-card-head">
          <div>
            <div class="settings-card-kicker">Reset</div>
            <h3>Clear saved storefront data</h3>
            <p>Use this if you want to reset local preferences, cart contents, and temporary browsing state on this device.</p>
          </div>
        </div>
        <button class="clearDataButton" id="clearDataButton">Clear saved data</button>
      `;

    const contactSection = document.createElement('div');
    contactSection.classList.add('settings-section', 'settings-card', 'settings-card--contact');
    contactSection.innerHTML = `
    <div class="settings-card-head">
      <div>
        <div class="settings-card-kicker">Support</div>
        <h3>${TEXTS?.CONTACT_FORM?.TITLE || 'Send us a message'}</h3>
        <p>Reach us directly from the storefront if you need help with a product, order, or general question.</p>
      </div>
    </div>
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
    legalSection.classList.add('settings-section', 'settings-card', 'settings-card--legal');
    legalSection.innerHTML = `
        <div class="settings-card-head">
          <div>
            <div class="settings-card-kicker">Policies</div>
            <h3>Legal notice &amp; store policies</h3>
            <p>The essentials for shipping, returns, delivery issues, and customer rights, kept in one place.</p>
          </div>
        </div>
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

    topGrid?.append(themeSection, currencySection, countrySection);
    stack?.append(clearSection, contactSection, legalSection);
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
    const themeAutoToggle = document.getElementById('themeAutoToggle');
    const themeSummary = document.getElementById('settingsThemeSummary');
    const themeRuntime = window.__SS_THEME__ || null;
    const syncToggleVisualState = (input) => {
      const toggleInput = input instanceof HTMLInputElement ? input : null;
      const toggleLabel = toggleInput?.closest?.('.settings-switch.switch');
      if (!toggleInput || !toggleLabel) return;
      const isDisabled = !!toggleInput.disabled;
      const isOn = !!toggleInput.checked;
      toggleLabel.classList.toggle('is-on', isOn);
      toggleLabel.classList.toggle('is-disabled', isDisabled);
      toggleLabel.setAttribute('role', 'switch');
      toggleLabel.setAttribute('aria-checked', isOn ? 'true' : 'false');
      toggleLabel.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      toggleLabel.tabIndex = isDisabled ? -1 : 0;
    };
    const bindToggleLabel = (input) => {
      const toggleInput = input instanceof HTMLInputElement ? input : null;
      const toggleLabel = toggleInput?.closest?.('.settings-switch.switch');
      if (!toggleInput || !toggleLabel || toggleLabel.dataset.toggleBound === 'yes') return;
      const toggleFromShell = () => {
        if (toggleInput.disabled) return;
        toggleInput.checked = !toggleInput.checked;
        toggleInput.dispatchEvent(new Event('change', { bubbles: true }));
        syncToggleVisualState(toggleInput);
      };
      toggleLabel.dataset.toggleBound = 'yes';
      toggleLabel.addEventListener('click', (event) => {
        if (toggleInput.disabled) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        toggleFromShell();
      });
      toggleLabel.addEventListener('keydown', (event) => {
        const key = String(event?.key || '');
        if (key !== 'Enter' && key !== ' ') return;
        event.preventDefault();
        toggleFromShell();
      });
      toggleInput.addEventListener('change', () => syncToggleVisualState(toggleInput));
      syncToggleVisualState(toggleInput);
    };
    const syncThemeControls = () => {
      const storedMode = String(themeRuntime?.getStoredMode?.() || localStorage.getItem('themeMode') || 'auto').trim().toLowerCase() || 'auto';
      const resolvedMode = String(themeRuntime?.getResolvedMode?.() || (document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light')).trim().toLowerCase();
      const isAuto = storedMode === 'auto';
      if (themeAutoToggle) themeAutoToggle.checked = isAuto;
      if (themeToggle) {
        themeToggle.checked = resolvedMode === 'dark';
        themeToggle.disabled = false;
      }
      if (themeSummary) {
        themeSummary.textContent = isAuto
          ? `Auto (${resolvedMode === 'dark' ? 'Dark' : 'Light'})`
          : (resolvedMode === 'dark' ? 'Dark' : 'Light');
      }
      syncToggleVisualState(themeAutoToggle);
      syncToggleVisualState(themeToggle);
    };

    if (themeAutoToggle) {
      themeAutoToggle.addEventListener('change', (e) => {
        const useAuto = !!e.target.checked;
        themeRuntime?.apply?.(useAuto ? 'auto' : (themeToggle?.checked ? 'dark' : 'light'), { persist: true });
        syncThemeControls();
      });
    }

    if (themeToggle) {
      themeToggle.addEventListener('change', (e) => {
        const darkMode = !!e.target.checked;
        if (themeAutoToggle?.checked) {
          themeAutoToggle.checked = false;
          syncToggleVisualState(themeAutoToggle);
        }
        themeRuntime?.apply?.(darkMode ? 'dark' : 'light', { persist: true });
        syncThemeControls();
      });
    }
    try {
      window.addEventListener('ss:theme-mode-changed', syncThemeControls);
    } catch {}
    bindToggleLabel(themeAutoToggle);
    bindToggleLabel(themeToggle);
    syncThemeControls();

    const currencySelect = document.getElementById('currencySelect');
    const countrySelect = document.getElementById('countrySelect');
    const detectedSpan = document.getElementById('detected-country');
    if (detectedSpan) detectedSpan.textContent = detectedCountry;
    const currencySummary = document.getElementById('settingsCurrencySummary');
    const countrySummary = document.getElementById('settingsCountrySummary');
    if (countrySummary) countrySummary.textContent = detectedCountry;
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
      if (currencySummary) currencySummary.textContent = restoredCurrency;
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
        const currencyTom = new TomSelect('#currencySelect', {
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
          openOnFocus: true,
          onInitialize: function () {
            enhanceTomSelectSearch(this, { placeholder: 'Type to search currency...' });
          },
          onFocus: function () {
            this.open();
          },
          onType: function () {
            this.open();
          },
          onChange: (val) => {
            if (!val) return;
            ctx.setSelectedCurrency?.(val);
            localStorage.setItem('selectedCurrency', val);
            ctx.syncCentralState?.('currency-select-tom', { selectedCurrency: val });
            localStorage.setItem('manualCurrencyOverride', 'true');
            ctx.syncCurrencySelects?.(val);
            if (currencySummary) currencySummary.textContent = String(val || '').toUpperCase();
            ctx.updateAllPrices?.();
          }
        });
        enhanceTomSelectSearch(currencyTom, { placeholder: 'Type to search currency...' });
        enhanceTomSelectFiltering(currencyTom, currencyOptions);
      }
      currencySelect.classList.remove('tom-hidden');
    }

    if (countrySelect) {
      if (typeof TomSelect === 'function') {
        const countryOptions = buildCountrySearchOptions(ctx, countriesList);
        const countryTom = new TomSelect('#countrySelect', {
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
          openOnFocus: true,
          onInitialize: function () {
            enhanceTomSelectSearch(this, { placeholder: 'Type to search country...' });
          },
          onFocus: function () {
            this.open();
          },
          onType: function () {
            this.open();
          },
          onChange: (val) => {
            if (!val) return;
            const newCountry = String(val).toUpperCase();
            setPreferredCountryCode(newCountry);
            if (detectedSpan) detectedSpan.textContent = newCountry;
            if (countrySummary) countrySummary.textContent = newCountry;
            if (ctx.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE && !localStorage.getItem('manualCurrencyOverride')) {
              const newCurrency = ctx.countryToCurrency?.[newCountry];
              if (newCurrency) {
                ctx.setSelectedCurrency?.(newCurrency);
                localStorage.setItem('selectedCurrency', newCurrency);
                ctx.syncCentralState?.('country-auto-currency', { selectedCurrency: newCurrency });
                ctx.syncCurrencySelects?.(newCurrency);
                if (currencySummary) currencySummary.textContent = String(newCurrency || '').toUpperCase();
              }
            }
            ctx.updateAllPrices?.();
          }
        });
        enhanceTomSelectSearch(countryTom, { placeholder: 'Type to search country...' });
        enhanceTomSelectFiltering(countryTom, countryOptions);
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

  window.__SS_SETTINGS_RUNTIME__ = {
    preloadSettingsData,
    clearSettingsCache,
    goToSettings,
    initDesktopRegionModal,
    syncDesktopRegionLauncher
  };

  const bootDesktopRegionModal = () => {
    try { initDesktopRegionModal(); } catch (error) {
      console.warn('desktop region modal init failed:', error?.message || error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDesktopRegionModal, { once: true });
  } else {
    setTimeout(bootDesktopRegionModal, 0);
  }
  window.addEventListener('load', bootDesktopRegionModal, { once: true });
})(window, document);
