(function (window) {
function normalizeTariffMap(raw) {
    const input = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : {};
    const out = {};
    for (const [code, value] of Object.entries(input)) {
        const key = String(code || "").trim().toUpperCase();
        if (!key) continue;
        const num = Number(value);
        out[key] = (Number.isFinite(num) && num >= 0) ? num : 0;
    }
    return out;
}

async function fetchTariffsFromServer() {
    const svc = window.__SS_PRICING_SERVICE__;
    if (!svc?.getTariffs) throw new Error('Pricing service unavailable: getTariffs');
    const data = await svc.getTariffs();

    // Accept either { ... } or { tariffs: { ... } }
    const obj =
        (data && typeof data === "object" && !Array.isArray(data))
            ? (data.tariffs && typeof data.tariffs === "object" ? data.tariffs : data)
            : null;

    if (!obj) throw new Error("Invalid tariffs payload.");
    return normalizeTariffMap(obj);
}

async function fetchCountriesFromServer() {
    const svc = window.__SS_PRICING_SERVICE__;
    if (!svc?.getCountries) throw new Error('Pricing service unavailable: getCountries');
    const data = await svc.getCountries();
    if (!Array.isArray(data)) throw new Error("Invalid countries payload.");

    // Normalize expected shape: [{ code, tariff }]
    return data
        .filter(x => x && typeof x === "object" && x.code)
        .map(x => ({
            code: String(x.code).toUpperCase(),
            tariff: Number(x.tariff || 0) || 0
        }));
}

async function fetchStorefrontConfigFromServer() {
    const svc = window.__SS_PRICING_SERVICE__;
    if (!svc?.getStorefrontConfig) throw new Error('Pricing service unavailable: getStorefrontConfig');
    const data = await svc.getStorefrontConfig();
    if (!data || typeof data !== "object") throw new Error("Invalid storefront config payload.");
    return data;
}

async function fetchExchangeRatesFromServer() {
    const data = await (window.__SS_PRICING_SERVICE__?.getExchangeRates ? window.__SS_PRICING_SERVICE__.getExchangeRates() : (async () => { let res = null; try { res = await window.__SS_API__.request('/api/proxy-rates', { cache: 'no-store' }); if (!res.ok) res = null; } catch { res = null; } if (!res) { res = await window.__SS_API__.request('/rates', { cache: 'no-store' }); } if (!res.ok) throw new Error(`Failed to fetch exchange rates (${res.status})`); return res.json().catch(() => null); })());
    if (!data || !data.rates) throw new Error('Invalid exchange rates payload.');
    const safeRates = (data.rates && typeof data.rates === "object" && !Array.isArray(data.rates)) ? { ...data.rates } : {};
    try { exchangeRates = safeRates; } catch {}
    try {
        window.preloadedData = window.preloadedData || {};
        window.preloadedData.exchangeRates = safeRates;
        if (data.fetchedAt != null) window.preloadedData.ratesFetchedAt = Number(data.fetchedAt || 0) || 0;
    } catch {}
    return data;
}

async function fetchTariffs() {
    try {
        window.preloadedData = window.preloadedData || { exchangeRates: null, countries: null, tariffs: null };

        // If already loaded, use it
        if (window.preloadedData.tariffs && Object.keys(window.preloadedData.tariffs).length) {
            tariffMultipliers = { ...window.preloadedData.tariffs };
            return tariffMultipliers;
        }

        // Load via settings preload (safe now; no recursion)
        await window.preloadSettingsData();

        if (window.preloadedData.tariffs && Object.keys(window.preloadedData.tariffs).length) {
            tariffMultipliers = { ...window.preloadedData.tariffs };
            return tariffMultipliers;
        }

        // Last resort direct fetch
        const tariffsObj = await fetchTariffsFromServer();
        tariffMultipliers = normalizeTariffMap(tariffsObj);
        window.preloadedData.tariffs = tariffMultipliers;
        window.preloadedData.countries = tariffsObjectToCountriesArray(tariffMultipliers);
        return tariffMultipliers;
    } catch (e) {
        console.warn("⚠️ fetchTariffs failed; keeping existing tariffMultipliers:", e);
        tariffMultipliers = (tariffMultipliers && typeof tariffMultipliers === "object") ? tariffMultipliers : {};
        return tariffMultipliers;
    }
}

function handleCurrencyChange(newCurrency) {
    if (!newCurrency) return;
    if (newCurrency === selectedCurrency) return;
    selectedCurrency = newCurrency;
(window.__SS_STORAGE_SERVICE__?.set || localStorage.setItem.bind(localStorage))("selectedCurrency", selectedCurrency);
    syncCurrencySelects(selectedCurrency);
    updateAllPrices();
}

function detectUserCurrency() {
    // Best-effort currency selection.
    // Priority:
    //  1) explicit saved currency (manual)
    //  2) server default (if provided)
    //  3) cached geo-detected currency (30d)
    //  4) one-shot geo detection (ipapi), with backoff on failure
    try {
        const saved = (window.__SS_STORAGE_SERVICE__?.get || localStorage.getItem.bind(localStorage))("selectedCurrency");
        if (saved) {
            selectedCurrency = saved;
            return Promise.resolve();
        }
    } catch { }
    try {
        const disabledUntil = Number((window.__SS_STORAGE_SERVICE__?.get || localStorage.getItem.bind(localStorage))("geoCurrencyDisabledUntil") || 0);
        if (disabledUntil && Date.now() < disabledUntil) return Promise.resolve();

        const detectedAt = Number((window.__SS_STORAGE_SERVICE__?.get || localStorage.getItem.bind(localStorage))("geoCurrencyDetectedAt") || 0);
        const cachedCountry = String((window.__SS_STORAGE_SERVICE__?.get || localStorage.getItem.bind(localStorage))("detectedCountry") || "").toUpperCase();
        const cachedCurrency = String((window.__SS_STORAGE_SERVICE__?.get || localStorage.getItem.bind(localStorage))("geoDetectedCurrency") || "");
        if (detectedAt && (Date.now() - detectedAt) < (30 * 24 * 60 * 60 * 1000) && cachedCurrency) {
            selectedCurrency = cachedCurrency;
            if (cachedCountry) localStorage.setItem("detectedCountry", cachedCountry);
        (window.__SS_STORAGE_SERVICE__?.set || localStorage.setItem.bind(localStorage))("selectedCurrency", selectedCurrency);
            updateAllPrices();
            return Promise.resolve();
        }
    } catch { }

    // Detect user's currency via IP API (best-effort). Never throw.
    const pricingService = window.__SS_PRICING_SERVICE__;
    if (!pricingService?.detectGeoCurrency) return Promise.resolve();
    return pricingService.detectGeoCurrency().then(data =>
 {
            const userCountry = String(data?.country_code || "").toUpperCase();
            if (!userCountry) return;

            selectedCurrency = countryToCurrency[userCountry] || "EUR";

            try {
            (window.__SS_STORAGE_SERVICE__?.set || localStorage.setItem.bind(localStorage))("selectedCurrency", selectedCurrency);
                localStorage.setItem("detectedCountry", userCountry);
                localStorage.setItem("geoDetectedCurrency", selectedCurrency);
                localStorage.setItem("geoCurrencyDetectedAt", String(Date.now()));
            } catch { }

            const currencySelect = document.getElementById("currency-select");
            if (currencySelect) currencySelect.value = selectedCurrency;

            updateAllPrices();
        })
        .catch((err) => {
            console.warn("Currency detect blocked/failed; keeping saved currency.", err);
            try {
                // backoff for 7 days to avoid repeated failing calls
                (window.__SS_STORAGE_SERVICE__?.set || localStorage.setItem.bind(localStorage))("geoCurrencyDisabledUntil", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
            } catch { }
        });
}
  window.__SS_PRICING__ = {
    fetchTariffsFromServer,
    fetchCountriesFromServer,
    fetchStorefrontConfigFromServer,
    fetchExchangeRatesFromServer,
    fetchTariffs,
    handleCurrencyChange,
    detectUserCurrency
  };
})(window);
