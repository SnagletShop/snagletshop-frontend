
// --- PRICE PARSER (global, hoisted) ---
function __ssParsePriceEUR(v) {
    const runtime = window.__SS_UTILS_RUNTIME__;
    if (runtime && typeof runtime.parsePriceEUR === "function") return runtime.parsePriceEUR(v);
    return 0;
}
async function ensureStripePublishableKey() {
    const runtime = window.__SS_STRIPE_CONFIG_RUNTIME__;
    if (runtime && typeof runtime.ensureStripePublishableKey === "function") {
        return runtime.ensureStripePublishableKey({ getPublicConfig: () => window.__SS_CATALOG_API__.getPublicConfig(), window });
    }
    return "";
}

function showStripeConfigError(msg) {
    const runtime = window.__SS_STRIPE_CONFIG_RUNTIME__;
    if (runtime && typeof runtime.showStripeConfigError === "function") {
        return runtime.showStripeConfigError(msg);
    }
}



window.__ssNormalizeCatalogImages = __ssNormalizeCatalogImages;
window.functionBlacklist = new Set([

]);

// Routing mode: path routes (/p/<id>) require server rewrite. Query routes (/?p=<id>) are reload-safe on any static host.
// Set to true only if your web server rewrites /p/* to /index.html.
const __SS_USE_PATH_ROUTES__ = window.__SS_CONFIG__?.USE_PATH_ROUTES ?? false;
const AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE = window.__SS_CONFIG__?.AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE ?? true;
// applyTariff is controlled by the backend (see /products payload: applyTariff).
// We keep a local fallback for offline/backwards compatibility.
let serverApplyTariff = null;
if (localStorage.getItem("applyTariff") == null) localStorage.setItem("applyTariff", "true");
// early in boot:
// API base is configurable for local/staging.
// You can override by setting window.__API_BASE__ before this script loads,
// or by setting <meta name="api-base" content="https://..."> in index.html.
const DEFAULT_BACKEND_PORT = window.__SS_CONFIG__?.DEFAULT_BACKEND_PORT ?? 5500; // server.js default

const API_BASE = String(window.__SS_CONFIG__?.API_BASE || "").replace(/\/+$/, "");

/* ---------------- Add-to-basket popup toggles ----------------
   Two modes for the "added to basket" notification:
   1) Legacy: browser alert()
   2) New: a toast that originates from the Basket icon
   Set exactly one of these to true.
*/
const USE_ADD_TO_CART_POPUP_LEGACY_ALERT = false;
const USE_ADD_TO_CART_POPUP_BASKET_TOAST = true;

/* ---------------- A/B testing (client-side, deterministic) ----------------
   Experiments (keys):
     pn - product name
     pd - product description
     pr - price variant
     dl - delivery copy
   Assignment is deterministic per browser (localStorage) so users stay in the same bucket.
*/
function __ssRound2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round(x * 100) / 100;
}

function __ssEnsureBasketToastStyles() {
    // Styles are defined in index.html (using CSS variables for light/dark mode).
    // Keep this function as a no-op for backward compatibility.
    return;
}

let __ssActiveBasketToast = null;
let __ssActiveBasketToastTimers = [];

function __ssGetBasketButtonEl() {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.getBasketButtonEl === "function") return runtime.getBasketButtonEl();
    return null;
}

function __ssGetBasketCounts() {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.getBasketCounts === "function") return runtime.getBasketCounts({ basket });
    return { totalQty: 0, distinct: 0 };
}

function __ssUpdateBasketHeaderIndicator() {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.updateBasketHeaderIndicator === "function") return runtime.updateBasketHeaderIndicator({ basket });
}

function __ssCloseActiveBasketToast() {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.closeActiveBasketToast === "function") {
        const state = { activeToast: __ssActiveBasketToast, activeToastTimers: __ssActiveBasketToastTimers };
        runtime.closeActiveBasketToast(state);
        __ssActiveBasketToast = state.activeToast;
        __ssActiveBasketToastTimers = state.activeToastTimers;
        return;
    }
}

function __ssUndoAddToCart(itemKey, qty) {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.undoAddToCart === "function") {
        return runtime.undoAddToCart(itemKey, qty, { basket, persistBasket, refreshBasketUIIfOpen });
    }
}

function __ssShowBasketToastAddToCart({ qty, productName, optMsg, imageUrl, itemKey }) {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.showBasketToastAddToCart === "function") {
        return runtime.showBasketToastAddToCart({ qty, productName, optMsg, imageUrl, itemKey });
    }
}

function __ssNotifyAddToCart({ qty, productName, optMsg, imageUrl, itemKey }) {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.notifyAddToCart === "function") {
        return runtime.notifyAddToCart({ qty, productName, optMsg, imageUrl, itemKey }, {
            useBasketToast: USE_ADD_TO_CART_POPUP_BASKET_TOAST,
            useLegacyAlert: USE_ADD_TO_CART_POPUP_LEGACY_ALERT
        });
    }
}

function canonicalizeProductLink(link) {
    const runtime = window.__SS_UTILS_RUNTIME__;
    if (runtime && typeof runtime.canonicalizeProductLink === "function") return runtime.canonicalizeProductLink(link);
    return String(link || "").trim();
}
function extractProductIdFromLink(link) {
    const runtime = window.__SS_UTILS_RUNTIME__;
    if (runtime && typeof runtime.extractProductIdFromLink === "function") return runtime.extractProductIdFromLink(link);
    return "";
}
function normalizeCartItemsForServer(items) {
    const runtime = window.__SS_UTILS_RUNTIME__;
    if (runtime && typeof runtime.normalizeCartItemsForServer === "function") return runtime.normalizeCartItemsForServer(items);
    return Array.isArray(items) ? items.slice() : [];
}
function __ssFixImageUrl(u) {
    const runtime = window.__SS_CATALOG_IMAGE_RUNTIME__;
    if (runtime && typeof runtime.fixImageUrl === "function") return runtime.fixImageUrl(u);
    return String(u || "");
}

function __ssNormalizeCatalogImages(catalogObj) {
    const runtime = window.__SS_CATALOG_IMAGE_RUNTIME__;
    if (runtime && typeof runtime.normalizeCatalogImages === "function") return runtime.normalizeCatalogImages(catalogObj);
    return catalogObj;
}

const { TEXTS, countryToCurrency, countryNames } = window.__SS_SHARED_DATA__ || { TEXTS: {}, countryToCurrency: {}, countryNames: {} };
// Exchange rates
let exchangeRates = {

    EUR: 1,
    USD: 1.1,
    GBP: 0.85,
    CAD: 1.45,
    AUD: 1.6
};
let tariffMultipliers = {};
let productsDatabase = (typeof window !== "undefined" && window.productsDatabase && typeof window.productsDatabase === "object")
    ? window.productsDatabase
    : ((typeof window !== "undefined" && window.products && typeof window.products === "object") ? window.products : {});
if (typeof window !== "undefined") {
    window.productsDatabase = productsDatabase;
    if (!window.products || typeof window.products !== "object" || !Object.keys(window.products).length) {
        window.products = productsDatabase;
    }
}
let __ssSyncingProductsDatabase = false;
function __ssSetProductsDatabase(next) {
    productsDatabase = (next && typeof next === 'object') ? next : {};
    if (typeof window !== 'undefined' && !__ssSyncingProductsDatabase) {
        __ssSyncingProductsDatabase = true;
        try {
            try { delete window.productsDatabase; } catch {}
            try { delete window.products; } catch {}
            window.productsDatabase = productsDatabase;
            window.products = productsDatabase;
        } finally {
            __ssSyncingProductsDatabase = false;
            try { __ssInstallLegacyGlobalBridges(); } catch {}
        }
    }
    return productsDatabase;
}

// Seed from existing window.products (if present)
if (typeof window !== "undefined" && window.products && typeof window.products === "object" && Object.keys(window.products).length > 0) {
    __ssSetProductsDatabase(window.products);
    console.log("ℹ️ Seeded productsDatabase from existing window.products.");
}

let exchangeRatesFetchedAt = 0;
/**
 * Loads product catalog from the backend and normalizes globals:
 * - productsDatabase (this file)
 * - window.products (shared global used throughout the UI)
 *
 * Returns a Promise that resolves to the loaded products object.
 * Safe to call multiple times (memoized).
 */
function initProducts() {
    const runtime = window.__SS_CATALOG_RUNTIME__;
    if (runtime && typeof runtime.initProducts === "function") {
        return runtime.initProducts.apply(this, arguments);
    }
    return Promise.resolve(window.products || productsDatabase || {});
}
// Kick off loading immediately when the script is loaded
initProducts();


const currencySymbols = {
    USD: "$", CAD: "C$", MXN: "$", JMD: "J$", DOP: "RD$",
    EUR: "€", GBP: "£", CHF: "CHF", PLN: "zł", CZK: "Kč", SEK: "kr", NOK: "kr", DKK: "kr",
    HUF: "Ft", RON: "lei", BGN: "лв", RUB: "₽", UAH: "₴",
    JPY: "¥", CNY: "¥", INR: "₹", KRW: "₩", IDR: "Rp", MYR: "RM", PHP: "₱", THB: "฿", VND: "₫",
    PKR: "₨", BDT: "৳",
    ZAR: "R", NGN: "₦", KES: "KSh", EGP: "E£", GHS: "₵", TZS: "TSh",
    AUD: "A$", NZD: "NZ$", FJD: "FJ$", PGK: "K",
    AED: "د.إ", SAR: "﷼", ILS: "₪", TRY: "₺", IRR: "﷼",
    BRL: "R$", ARS: "$", CLP: "$", COP: "$", PEN: "S/", VES: "Bs"
};



const preloadedImages = new Set();


let selectedCurrency = "EUR";
try {
    selectedCurrency = localStorage.getItem("selectedCurrency") || "EUR";
} catch (err) {
    console.warn("⚠️ Could not access localStorage:", err);
}
let searchInput = null;
let mobileSearchInput = null;
const navEntry = performance.getEntriesByType("navigation")[0];

const isPageRefresh = navEntry?.type === "reload";
const SETTINGS_CACHE_KEY = "preloadedSettings";
const SETTINGS_CACHE_TTL_HOURS = 12;

window.preloadedData = {
    exchangeRates: null,
    countries: null,
    tariffs: null
};


let cart = {};
let basket = {};
let currentCategory = null;
let elements; // Declare outside to reuse
let paymentElement; // Reuse across submissions
let stripeInstance;
let elementsInstance;
let paymentElementInstance;
let clientSecret = null;

let lastCategory = "Default_Page"; // Start with a default


let isReplaying = false;
// === CONFIG ===
const MAX_HISTORY_LENGTH = 500;
window.DEBUG_HISTORY = false;
let debounceTimeout;


// Refactored history system for consistent back/forward navigation

let userHistoryStack = [];
let currentIndex = -1;
const HISTORY_SESSION_KEY = "ss_history_stack_v1";
const HISTORY_INDEX_SESSION_KEY = "ss_history_index_v1";
let __ssHandlingPopstate = false;
let __ssModalHistoryPushed = false;

const __ssRuntimeStore = window.__SS_RUNTIME_STORE__ || null;

function __ssDefineWindowBridge(name, getter, setter) {
    try {
        Object.defineProperty(window, name, {
            configurable: true,
            enumerable: true,
            get: getter,
            set: setter
        });
    } catch {
        try { window[name] = getter(); } catch {}
    }
}

function __ssInstallLegacyGlobalBridges() {
    try {
        window.TEXTS = TEXTS;
        window.countryToCurrency = countryToCurrency;
        window.countryNames = countryNames;
        window.products = productsDatabase;
        window.productsDatabase = productsDatabase;
    } catch {}

    __ssDefineWindowBridge('selectedCurrency', () => selectedCurrency, (v) => { selectedCurrency = String(v || 'EUR'); });
    __ssDefineWindowBridge('exchangeRates', () => exchangeRates, (v) => { exchangeRates = (v && typeof v === 'object') ? v : {}; });
    __ssDefineWindowBridge('tariffMultipliers', () => tariffMultipliers, (v) => { tariffMultipliers = (v && typeof v === 'object') ? v : {}; });
    __ssDefineWindowBridge('productsDatabase', () => productsDatabase, (v) => { __ssSetProductsDatabase(v); });
    __ssDefineWindowBridge('products', () => productsDatabase, (v) => { __ssSetProductsDatabase(v); });
    __ssDefineWindowBridge('cart', () => cart, (v) => { cart = (v && typeof v === 'object') ? v : {}; });
    __ssDefineWindowBridge('basket', () => basket, (v) => { basket = (v && typeof v === 'object') ? v : {}; });
    __ssDefineWindowBridge('currentCategory', () => currentCategory, (v) => { currentCategory = v == null ? null : String(v); });
    __ssDefineWindowBridge('lastCategory', () => lastCategory, (v) => { lastCategory = v == null ? 'Default_Page' : String(v); });
    __ssDefineWindowBridge('userHistoryStack', () => userHistoryStack, (v) => { userHistoryStack = Array.isArray(v) ? v : []; });
    __ssDefineWindowBridge('currentIndex', () => currentIndex, (v) => { currentIndex = Number.isFinite(Number(v)) ? Number(v) : -1; });
    __ssDefineWindowBridge('clientSecret', () => clientSecret, (v) => { clientSecret = v == null ? null : String(v); });
    __ssDefineWindowBridge('serverApplyTariff', () => serverApplyTariff, (v) => { serverApplyTariff = v == null ? null : !!v; });
}

__ssInstallLegacyGlobalBridges();

function __ssSyncCentralState(reason = "runtime-sync", payload = {}) {
    try {
        __ssRuntimeStore?.syncRuntimeState?.({
            basket,
            cart,
            selectedCurrency,
            exchangeRates,
            tariffMultipliers,
            currentCategory,
            userHistoryStack,
            currentIndex,
            clientSecret,
            stripeInstance,
            elementsInstance,
            paymentElementInstance,
            ...payload
        }, reason);
    } catch (err) {
        console.warn('[ss state sync]', reason, err);
    }
}

function __ssInitializeCentralState() {
    try {
        __ssRuntimeStore?.initialize?.({
            basket,
            cart,
            selectedCurrency,
            exchangeRates,
            tariffMultipliers,
            currentCategory,
            userHistoryStack,
            currentIndex,
            clientSecret,
            stripeInstance,
            elementsInstance,
            paymentElementInstance,
            isPageRefresh
        });
    } catch (err) {
        console.warn('[ss state init]', err);
    }
}

__ssInitializeCentralState();

function __ssPersistHistoryState() {
    const runtime = window.__SS_HISTORY_RUNTIME__;
    if (runtime && typeof runtime.persistHistoryState === "function") {
        return runtime.persistHistoryState({
            HISTORY_SESSION_KEY,
            HISTORY_INDEX_SESSION_KEY,
            getStack: () => userHistoryStack,
            getIndex: () => currentIndex,
            syncCentralState: __ssSyncCentralState
        });
    }
}

function __ssRestoreHistoryStateFromSession() {
    const runtime = window.__SS_HISTORY_RUNTIME__;
    if (runtime && typeof runtime.restoreHistoryStateFromSession === "function") {
        return runtime.restoreHistoryStateFromSession({
            HISTORY_SESSION_KEY,
            HISTORY_INDEX_SESSION_KEY,
            setStack: (value) => { userHistoryStack = value; },
            setIndex: (value) => { currentIndex = value; },
            syncCentralState: __ssSyncCentralState
        });
    }
    return false;
}

if (location.pathname !== "/" && !location.pathname.includes(".") && !location.pathname.startsWith("/p/")) {
    // Allow deep links for product slugs and /p/<id>.
}
function normalizeProductKey(s) {
    const runtime = window.__SS_PRODUCT_ID_RUNTIME__;
    if (runtime && typeof runtime.normalizeProductKey === "function") return runtime.normalizeProductKey(s);
    return String(s || "").trim();
}
function buildUrlForState(state) {
    try {
        const router = window.__SS_ROUTER__;
        if (router && typeof router.buildUrlForState === 'function') return router.buildUrlForState(state);
    } catch {}
    return '/';
}

function navigate(action, data = null, options = null) {
    try {
        const router = window.__SS_ROUTER__;
        if (router && typeof router.navigate === 'function') return router.navigate(action, data, options);
    } catch {}
    return undefined;
}

function isSettingsCacheValid(timestamp) {
    const runtime = window.__SS_STORAGE_RUNTIME__;
    if (runtime && typeof runtime.isSettingsCacheValid === "function") return runtime.isSettingsCacheValid(timestamp, SETTINGS_CACHE_TTL_HOURS);
    return false;
}
function safeJsonParse(str, fallback = null) {
    const runtime = window.__SS_STORAGE_RUNTIME__;
    if (runtime && typeof runtime.safeJsonParse === "function") return runtime.safeJsonParse(str, fallback);
    return fallback;
}

function lsGet(key, fallback = null) {
    const runtime = window.__SS_STORAGE_RUNTIME__;
    if (runtime && typeof runtime.lsGet === "function") return runtime.lsGet(key, fallback);
    return fallback;
}

function lsSet(key, value) {
    const runtime = window.__SS_STORAGE_RUNTIME__;
    if (runtime && typeof runtime.lsSet === "function") return runtime.lsSet(key, value);
    return false;
}

function __ssIdNorm(v) {
    const runtime = window.__SS_PRODUCT_ID_RUNTIME__;
    if (runtime && typeof runtime.idNorm === "function") return runtime.idNorm(v);
    return String(v ?? "").trim();
}
function __ssIdEq(a, b) {
    const runtime = window.__SS_PRODUCT_ID_RUNTIME__;
    if (runtime && typeof runtime.idEq === "function") return runtime.idEq(a, b);
    return String(a ?? "").trim() === String(b ?? "").trim();
}
function __ssIsBadId(v) {
    const runtime = window.__SS_PRODUCT_ID_RUNTIME__;
    if (runtime && typeof runtime.isBadId === "function") return runtime.isBadId(v);
    return !String(v ?? "").trim();
}
function __ssResolvePidFromCatalogByName(name) {
    const runtime = window.__SS_PRODUCT_ID_RUNTIME__;
    if (runtime && typeof runtime.resolvePidFromCatalogByName === "function") {
        return runtime.resolvePidFromCatalogByName({ getCatalogFlat: () => __ssGetCatalogFlat() }, name);
    }
    return "";
}
function __ssResolvePidForRecs(product) {
    const runtime = window.__SS_PRODUCT_ID_RUNTIME__;
    if (runtime && typeof runtime.resolvePidForRecs === "function") {
        return runtime.resolvePidForRecs({ getCatalogFlat: () => __ssGetCatalogFlat() }, product);
    }
    return "";
}
function __ssGetCurrentPidFallback() {
    const runtime = window.__SS_PRODUCT_ID_RUNTIME__;
    if (runtime && typeof runtime.getCurrentPidFallback === "function") {
        return runtime.getCurrentPidFallback({ getCatalogFlat: () => __ssGetCatalogFlat() });
    }
    return "";
}
function tariffsObjectToCountriesArray(tariffsObj) {
    if (!tariffsObj || typeof tariffsObj !== "object" || Array.isArray(tariffsObj)) return [];
    return Object.keys(tariffsObj)
        .map(code => ({ code, tariff: Number(tariffsObj[code]) || 0 }))
        .sort((a, b) => a.code.localeCompare(b.code));
}
let _preloadSettingsPromise = null;
// ======================
// Cross-tab basket sync
// ======================
const BASKET_STORAGE_KEY = "basket";
const BASKET_REV_KEY = "basket_rev"; // forces an event even if JSON string doesn't change
const TAB_SYNC_ID = (() => {
    try { return crypto.randomUUID(); } catch { return String(Date.now()) + "-" + Math.random().toString(16).slice(2); }
})();
const basketBC = ("BroadcastChannel" in window) ? new BroadcastChannel("snagletshop:basket") : null;


// Mutate in-place to keep references stable
function replaceBasketInMemory(next) {
    try {
        if (typeof basket !== "object" || !basket) basket = {};
        for (const k of Object.keys(basket)) delete basket[k];
        if (next && typeof next === "object") {
            for (const k of Object.keys(next)) basket[k] = next[k];
        }
    } catch {
        basket = next && typeof next === "object" ? next : {};
    }
    __ssSyncCentralState("basket-replaced", { basket });
}

function refreshBasketUIIfOpen() {
    const runtime = window.__SS_BASKET_RUNTIME__;
    if (runtime && typeof runtime.refreshBasketUIIfOpen === "function") {
        return runtime.refreshBasketUIIfOpen({ updateBasket: (typeof updateBasket === "function") ? updateBasket : null });
    }
}




// Other tabs: localStorage events
window.addEventListener("storage", (e) => {
    if (e.storageArea !== localStorage) return;
    if (e.key === BASKET_STORAGE_KEY || e.key === BASKET_REV_KEY || e.key === null) {
        syncBasketFromStorage("storage");
    }
});

// Other tabs: BroadcastChannel (faster/more reliable on some browsers)
if (basketBC) {
    basketBC.onmessage = (ev) => {
        const msg = ev?.data;
        if (!msg || msg.type !== "basket_changed") return;
        if (msg.from === TAB_SYNC_ID) return;
        syncBasketFromStorage("broadcast");
    };
}

async function preloadSettingsData() {
    const runtime = window.__SS_SETTINGS_RUNTIME__;
    if (runtime && typeof runtime.preloadSettingsData === "function") {
        return runtime.preloadSettingsData({
            getPreloadPromise: () => _preloadSettingsPromise,
            setPreloadPromise: (value) => { _preloadSettingsPromise = value; },
            setExchangeRatesFetchedAt: (value) => { exchangeRatesFetchedAt = value; },
            safeJsonParse,
            lsGet,
            lsSet,
            SETTINGS_CACHE_KEY,
            isSettingsCacheValid,
            tariffsObjectToCountriesArray,
            handlesTariffsDropdown,
            fetchTariffsFromServer,
            fetchExchangeRatesFromServer,
            fetchCountriesFromServer,
            fetchStorefrontConfigFromServer,
            syncCentralState: __ssSyncCentralState,
            getTariffMultipliers: () => tariffMultipliers,
            setTariffMultipliers: (value) => { tariffMultipliers = value; },
            getExchangeRates: () => exchangeRates,
            setExchangeRates: (value) => { exchangeRates = value; }
        });
    }
    return Promise.resolve();
}


/**
 * Fire a lightweight analytics event to the server.
 * This should never block the UI or throw.
 */
function buildAnalyticsCartItems(stripeCart) {
    try {
        return (stripeCart || []).map(it => ({
            productId: it.productId || null,
            name: it.name || it.productName || "",
            qty: Number(it.quantity || it.qty || 1),
            priceEUR: it.priceEUR != null ? Number(it.priceEUR) : (it.price != null ? Number(it.price) : null)
        }));
    } catch {
        return [];
    }
}

// Fire a simple "page opened" ping as soon as the script runs
sendAnalyticsEvent('page_open');

function handleStateChange(state) {
    try {
        const router = window.__SS_ROUTER__;
        if (router && typeof router.dispatchState === 'function') return router.dispatchState(state);
    } catch {}
    return undefined;
}

function __ssBindRouterLifecycle() {
    try { window.__SS_ROUTER__?.bind?.(); } catch {}
}
__ssBindRouterLifecycle();

function initializeHistory() {
    try {
        const router = window.__SS_ROUTER__;
        if (router && typeof router.initializeHistory === 'function') return router.initializeHistory();
    } catch {}
    return undefined;
}


// Replace old trackUserEvent calls with navigate()
function trackedGoToSettings() {
    navigate('GoToSettings');
}

function trackedGoToCart() {
    navigate('GoToCart');
}

function trackSearch(query) {
    const trimmed = String(query || "").trim();
    const currentState = userHistoryStack[currentIndex] || null;
    const currentQuery = String(currentState?.data?.[0] || "").trim();
    if (currentState?.action === 'searchQuery') {
        if (currentQuery !== trimmed) {
            navigate('searchQuery', [trimmed], { replaceCurrent: true });
        }
        return;
    }
    navigate('searchQuery', [trimmed]);
}
/* =========================
   APP BOOT LOADER (Products)
   ========================= */
const APP_LOADER_STYLE_ID = "appBootLoaderStyles";
const APP_LOADER_ID = "appBootLoaderOverlay";

let __appBootPrevBodyOverflow = null;
let __appBootPrevTitle = null;

function ensureAppLoaderStyles() {
    const runtime = window.__SS_APP_LOADER__;
    if (runtime && typeof runtime.ensureStyles === "function") return runtime.ensureStyles();
}
function showAppLoader(text = "Loading…") {
    const runtime = window.__SS_APP_LOADER__;
    if (runtime && typeof runtime.show === "function") return runtime.show(text);
}
function hideAppLoader() {
    const runtime = window.__SS_APP_LOADER__;
    if (runtime && typeof runtime.hide === "function") return runtime.hide();
}
function __ssResolveCategoryButtons() {
    try {
        if (typeof window.CategoryButtons === 'function') return window.CategoryButtons.bind(window);
    } catch {}
    try {
        const runtime = window.__SS_CATALOG_UI_RUNTIME__;
        if (runtime && typeof runtime.CategoryButtons === 'function') {
            return function resolvedCategoryButtons() {
                return runtime.CategoryButtons.apply(runtime, arguments);
            };
        }
    } catch {}
    return function noopCategoryButtons() {};
}

async function bootApp() {
    const runtime = window.__SS_BOOT_RUNTIME__;
    if (runtime && typeof runtime.boot === "function") {
        return runtime.boot({
            showAppLoader,
            hideAppLoader,
            initProducts,
            getProductsDatabase: () => productsDatabase,
            setBasket: (next) => { basket = next; },
            syncCentralState: __ssSyncCentralState,
            initializeHistory,
            loadProducts,
            categoryButtons: __ssResolveCategoryButtons(),
            updateBasketHeaderIndicator: __ssUpdateBasketHeaderIndicator
        });
    }
}



function loadProducts(category, sortBy = "NameFirst", sortOrder = "asc") {
    try {
        const screens = window.__SS_SCREENS__;
        if (screens?.show) return screens.show('catalog', { action: 'loadProducts', data: [category, sortBy, sortOrder] });
    } catch {}
    return renderCatalogProducts(category, sortBy, sortOrder);
}

async function GoToSettings() {
    return renderSettingsScreen.apply(this, arguments);
}

const functionRegistry = {

    loadProducts,
    GoToProductPage,
    GoToCart,
    GoToSettings,
    searchQuery
    // add more functions here as needed
};
window.addEventListener("beforeunload", () => {
    try { __ssPersistHistoryState(); } catch { }
});

// === LOAD FROM SESSION ===


// === UTILITIES ===
function log(...args) {
    if (window.DEBUG_HISTORY) console.log(...args);
}

// === FUNCTION INVOCATION (Safe) ===
function invokeFunctionByName(functionName, args = []) {
    const fn = functionRegistry[functionName];
    if (typeof fn === "function") {
        try {
            fn(...args);
        } catch (err) {
            console.error(`⚠️ Error invoking ${functionName}:`, err);
        }
    } else {
        console.warn(`❌ Function not found in registry: ${functionName}`);
    }
}
// --- PAYMENT PENDING (covers 3DS redirects) --------------------------
const PAYMENT_PENDING_KEY = "payment_pending_v1";
const CHECKOUT_DRAFT_STORAGE_KEY = "snaglet_checkout_draft_v1";
function _safeJsonParse(raw){ try { return JSON.parse(raw); } catch { return null; } }
async function fetchOrderStatus({ orderId, token } = {}){ return window.__SS_ORDERS_RUNTIME__?.fetchOrderStatus?.({ fetchOrderStatus:(args)=>window.__SS_ORDERS__.fetchOrderStatus(args), getTurnstileSiteKey:()=>__snagletGetTurnstileSiteKey() }, { orderId, token }); }
function _formatDateMaybe(v){ return window.__SS_ORDERS_RUNTIME__?.formatDateMaybe?.(v) ?? String(v || ""); }
function setPaymentPendingFlag({ paymentIntentId = null, orderId = null, clientSecret = null, checkoutId = null, checkoutToken = null } = {}){ return window.__SS_ORDERS_RUNTIME__?.setPaymentPendingFlag?.({ PAYMENT_PENDING_KEY }, { paymentIntentId, orderId, clientSecret, checkoutId, checkoutToken }); }
function getPaymentPendingFlag(){ return window.__SS_ORDERS_RUNTIME__?.getPaymentPendingFlag?.({ PAYMENT_PENDING_KEY }) || null; }
function clearPaymentPendingFlag(){ return window.__SS_ORDERS_RUNTIME__?.clearPaymentPendingFlag?.({ PAYMENT_PENDING_KEY }); }
async function pollPendingPaymentUntilFinal({ paymentIntentId, clientSecret, timeoutMs = 120000, intervalMs = 2500 } = {}){ return window.__SS_ORDERS_RUNTIME__?.pollPendingPaymentUntilFinal?.({ PAYMENT_PENDING_KEY, pollPendingPaymentUntilFinal:(args)=>window.__SS_ORDERS__.pollPendingPaymentUntilFinal(args) }, { paymentIntentId, clientSecret, timeoutMs, intervalMs }); }
async function resolveOrderIdByPaymentIntent({ paymentIntentId, clientSecret, maxWaitMs = 60000, intervalMs = 1200 } = {}){ return window.__SS_ORDERS_RUNTIME__?.resolveOrderIdByPaymentIntent?.({ resolveOrderIdByPaymentIntent:(args)=>window.__SS_ORDERS__.resolveOrderIdByPaymentIntent(args) }, { paymentIntentId, clientSecret, maxWaitMs, intervalMs }); }
async function checkAndHandlePendingPaymentOnLoad(){ return window.__SS_ORDERS_RUNTIME__?.checkAndHandlePendingPaymentOnLoad?.({ getPaymentPendingFlag, setPaymentPendingFlag, clearPaymentPendingFlag, pollPendingPaymentUntilFinal, resolveOrderIdByPaymentIntent, navigate:(a,d,o)=>navigate(a,d,o), checkAndShowPaymentSuccess:()=>checkAndShowPaymentSuccess(), stripStripeReturnParamsFromUrl:(u)=>stripStripeReturnParamsFromUrl(u) }); }
function getStripePublishableKeySafe(){ return window.__SS_ORDERS_RUNTIME__?.getStripePublishableKeySafe?.({ getPublicConfig:()=>window.__SS_CATALOG_API__?.getPublicConfig?.() }); }
function ensureStripeInstance(){ return window.__SS_ORDERS_RUNTIME__?.ensureStripeInstance?.({ getStripePublishableKeySafe, getExisting:()=>window.stripeInstance || stripeInstance, setInstance:(v)=>{ window.stripeInstance=v; stripeInstance=v; } }); }
function stripStripeReturnParamsFromUrl(urlObj){ return window.__SS_ORDERS_RUNTIME__?.stripStripeReturnParamsFromUrl?.(urlObj); }
async function handleStripeRedirectReturnOnLoad(){ return window.__SS_ORDERS_RUNTIME__?.handleStripeRedirectReturnOnLoad?.({ ensureStripeInstance, stripStripeReturnParamsFromUrl, setPaymentPendingFlag, addRecentOrder, syncCentralState:__ssSyncCentralState, navigate:(a,d,o)=>navigate(a,d,o), showPaymentSuccessOverlay:(msg)=>showPaymentSuccessOverlay(msg) }); }
function getStripeAppearanceForModal(){ return window.__SS_CHECKOUT_UI__?.getStripeAppearanceForModal?.apply(this, arguments); }
function resetWalletPaymentRequestButton(){ const host = document.getElementById('walletPaymentRequestButton'); if (host) { host.innerHTML = ''; host.style.display = 'none'; } }
function _isIso2Country(value){ return /^[A-Z]{2}$/.test(String(value || '').trim().toUpperCase()); }
function _getWalletButtonTheme(){ return document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light'; }
function _getStripeAppearance(){ const isDark=document.documentElement.classList.contains('dark-mode') || localStorage.getItem('themeMode')==='dark'; return !isDark ? { theme:'flat', variables:{ fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', fontSizeBase:'14px', colorBackground:'#ffffff', colorText:'#111827', colorTextSecondary:'#4b5563', colorPrimary:'#2563eb', colorBorder:'rgba(17,24,39,.15)', borderRadius:'14px', spacingUnit:'6px' } } : { theme:'night', variables:{ fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', fontSizeBase:'14px', colorBackground:'#0b1220', colorText:'rgba(255,255,255,.92)', colorTextSecondary:'rgba(229,231,235,.70)', colorPrimary:'#3b82f6', colorDanger:'#ef4444', colorSuccess:'#22c55e', colorBorder:'rgba(255,255,255,.14)', borderRadius:'14px', spacingUnit:'6px', focusBoxShadow:'0 0 0 3px rgba(59,130,246,.20)' }, rules:{ '.Block':{ backgroundColor:'transparent', borderColor:'rgba(255,255,255,.10)' }, '.Input':{ backgroundColor:'rgba(255,255,255,.06)', borderColor:'rgba(255,255,255,.14)', color:'rgba(255,255,255,.92)', boxShadow:'none' }, '.Input:focus':{ borderColor:'rgba(59,130,246,.55)', boxShadow:'0 0 0 3px rgba(59,130,246,.20)' }, '.Label':{ color:'rgba(229,231,235,.85)' }, '.Tab':{ backgroundColor:'rgba(255,255,255,.06)', borderColor:'rgba(255,255,255,.12)', color:'rgba(229,231,235,.90)' }, '.Tab--selected':{ backgroundColor:'rgba(255,255,255,.10)', borderColor:'rgba(59,130,246,.45)' } } }; }
async function setupWalletPaymentRequestButton(){ return window.__SS_CHECKOUT_UI__?.setupWalletPaymentRequestButton?.apply(this, arguments); }
function __clearLegacyPaymentSuccessLocalStorage(){ return window.__SS_MODAL_RUNTIME__?.clearLegacyPaymentSuccessLocalStorage?.({ flagKey:PAYMENT_SUCCESS_FLAG_KEY, reloadKey:PAYMENT_SUCCESS_RELOAD_KEY }); }
function setPaymentSuccessFlag({ reloadOnOk = true } = {}){ return window.__SS_MODAL_RUNTIME__?.setPaymentSuccessFlag?.({ flagKey:PAYMENT_SUCCESS_FLAG_KEY, reloadKey:PAYMENT_SUCCESS_RELOAD_KEY, getStore:()=>__paymentSuccessStore(), clearLegacy:(keys)=>window.__SS_MODAL_RUNTIME__?.clearLegacyPaymentSuccessLocalStorage?.(keys) }, { reloadOnOk }); }
function showPaymentSuccessOverlay(){ return window.__SS_CHECKOUT_UI__?.showPaymentSuccessOverlay?.apply(this, arguments); }
function checkAndShowPaymentSuccess(){ return window.__SS_MODAL_RUNTIME__?.checkAndShowPaymentSuccess?.({ flagKey:PAYMENT_SUCCESS_FLAG_KEY, reloadKey:PAYMENT_SUCCESS_RELOAD_KEY, getStore:()=>__paymentSuccessStore(), clearLegacy:(keys)=>window.__SS_MODAL_RUNTIME__?.clearLegacyPaymentSuccessLocalStorage?.(keys), getSuccessMessage:()=>((typeof TEXTS!=='undefined' && TEXTS?.CHECKOUT_SUCCESS)?TEXTS.CHECKOUT_SUCCESS:'Thank you for shopping with us! Your payment was successful and we are hard at work to get you your order as soon as possible!'), showOverlay:(msg)=>showPaymentSuccessOverlay(msg) }) || false; }
function handleOutsideClick(event){ return window.__SS_MODAL_RUNTIME__?.handleOutsideClick?.({ closeModal:(opts)=>closeModal(opts) }, event); }
async function openModal(options = {}){ return window.__SS_MODAL_RUNTIME__?.openModal?.({ createPaymentModal:()=>createPaymentModal(), getCurrentIndex:()=>currentIndex, getModalHistoryPushed:()=>__ssModalHistoryPushed, setModalHistoryPushed:(v)=>{ __ssModalHistoryPushed=!!v; }, initPaymentModalLogic:()=>initPaymentModalLogic() }, options); }
function closeModal(opts = {}){ return window.__SS_MODAL_RUNTIME__?.closeModal?.({ isHandlingPopstate:()=>__ssHandlingPopstate, saveCheckoutDraftFromModal:()=>saveCheckoutDraftFromModal(), clearCheckoutDraft:()=>clearCheckoutDraft(), getEscHandler:()=>window.__snagletPaymentModalEscHandler, setEscHandler:(v)=>{ window.__snagletPaymentModalEscHandler=v; }, resetWalletPaymentRequestButton, getPaymentElementInstance:()=>window.paymentElementInstance, setElementsInstance:(v)=>{ window.elementsInstance=v; }, setPaymentElementInstance:(v)=>{ window.paymentElementInstance=v; }, syncCentralState:__ssSyncCentralState, getClientSecret:()=>clientSecret, getStripeInstance:()=>window.stripeInstance || stripeInstance, setLatestClientSecret:(v)=>{ window.latestClientSecret=v; }, setLatestOrderId:(v)=>{ window.latestOrderId=v; }, setLatestPaymentIntentId:(v)=>{ window.latestPaymentIntentId=v; }, setModalHistoryPushed:(v)=>{ __ssModalHistoryPushed=!!v; } }, opts); }
function formatCardNumber(e){ return window.__SS_MODAL_RUNTIME__?.formatCardNumber?.(e); }
function formatExpiryDate(e){ return window.__SS_MODAL_RUNTIME__?.formatExpiryDate?.(e); }
function calculateTotal(cartItems){ return window.__SS_MODAL_RUNTIME__?.calculateTotal?.(cartItems) || '0.00'; }
function removeSortContainer(){ return window.__SS_MODAL_RUNTIME__?.removeSortContainer?.(); }
function calculateTotalAmount(){ return window.__SS_MODAL_RUNTIME__?.calculateTotalAmount?.({ getBasket:()=>basket }) || '0.00'; }
function basketButtonFunction(){ return window.__SS_MODAL_RUNTIME__?.basketButtonFunction?.({ getBasket:()=>basket }); }
let searchTimeout;
function handleSortChange(newSort){ return window.__SS_CATALOG_UI_RUNTIME__?.handleSortChange?.({ lsSet:(k,v)=>localStorage.setItem(k,v), isReplaying:()=>isReplaying, loadProducts:(...args)=>loadProducts(...args), navigate:(...args)=>navigate(...args), getWindowCurrentCategory:()=>window.currentCategory, getWindowCurrentSortOrder:()=>window.currentSortOrder, getLastCategory:()=>lastCategory }, newSort); }
function renderCatalogProducts(category, sortBy = 'NameFirst', sortOrder = 'asc'){ return window.__SS_CATALOG_UI_RUNTIME__?.renderCatalogProducts?.({ TEXTS, getProductsDatabase:()=>typeof productsDatabase!=='undefined'?productsDatabase:{}, getProducts:()=>typeof products!=='undefined'?products:{}, setLastCategory:(v)=>{ lastCategory=v; }, getLastCategory:()=>lastCategory, setWindowCurrentSortOrder:(v)=>{ window.currentSortOrder=v; }, getWindowCurrentSortOrder:()=>window.currentSortOrder, setWindowCurrentCategory:(v)=>{ window.currentCategory=v; currentCategory=v; }, getWindowCurrentCategory:()=>window.currentCategory, syncCentralState:__ssSyncCentralState, clearCategoryHighlight, setCart:(obj)=>{ cart=obj||{}; }, getCart:()=>cart, setCartItemQty:(key,qty)=>{ cart[key]=qty; }, removeSortContainer, createProductCard:(product, options)=>window.__SS_PRODUCT_CARD__?.createProductCard?.(product, options), getABProductName:__ssABGetProductName, getABProductDescription:__ssABGetProductDescription, resolveVariantPriceEUR:__ssResolveVariantPriceEUR, navigate:(...args)=>navigate(...args), decreaseQuantity, increaseQuantity, addToCart:(...args)=>addToCart(...args), defaultSelectedOptions:__ssDefaultSelectedOptions, extractOptionGroups:__ssExtractOptionGroups, preloadProductImages:(cat)=>preloadProductImages(cat), categoryButtons:()=>__ssResolveCategoryButtons()(), isDarkModeEnabled }, category, sortBy, sortOrder); }
async function renderSettingsScreen(){ return window.__SS_SETTINGS_RUNTIME__?.goToSettings?.({ preloadSettingsData, clearCategoryHighlight, removeSortContainer, TEXTS, currencySymbols, getExchangeRates:()=>exchangeRates, getSelectedCurrency:()=>selectedCurrency, setSelectedCurrency:(v)=>{ selectedCurrency=v; }, syncCentralState:__ssSyncCentralState, countryNames, countryToCurrency, AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE, syncCurrencySelects, updateAllPrices, snagletGetTurnstileToken:snagletGetTurnstileToken }); }
function syncSortSelects(newSort){ return window.__SS_CATALOG_UI_RUNTIME__?.syncSortSelects?.({ setupSortDropdown:(value)=>__ssSetupSortDropdown(value) }, newSort); }
function updateSorting(){ return window.__SS_CATALOG_UI_RUNTIME__?.updateSorting?.({ handleSortChange:(value)=>handleSortChange(value) }); }
function __ssSetupSortDropdown(currentSort){ return window.__SS_CATALOG_UI_RUNTIME__?.setupSortDropdown?.({ handleSortChange:(value)=>handleSortChange(value) }, currentSort); }
function getProductDescription(productName){ return window.__SS_PRODUCT_RUNTIME__?.getProductDescription?.({ getProducts:()=>typeof products!=='undefined'?products:null }, productName) ?? 'N/A'; }
window.__alreadyRetriedBrokenProduct = false; window.lastProductName = null; window.lastProductPrice = null; window.lastProductDescription = null;
function preloadProductImages(category){ return window.__SS_MEDIA_RUNTIME__?.preloadProductImages?.({ getProducts:()=>typeof products!=='undefined'?products:null, getLastCategory:()=>typeof lastCategory!=='undefined'?lastCategory:null, preloadedImages, getPrimaryImageUrl:__ssABGetPrimaryImageUrl }, category); }
function attachSwipeListeners(){ return window.__SS_PRODUCT_RUNTIME__?.attachSwipeListeners?.({ getCurrentIndex:()=>window.currentIndex, setCurrentIndex:(v)=>{ window.currentIndex=v; }, getCurrentProductImages:()=>window.currentProductImages || [], updateMainImage:(dir)=>updateMainImage(dir) }); }
window.__ssCarouselTouchState = window.__ssCarouselTouchState || { currentImageIndex: 0, startX: 0, bound: false };
function selectProductOption(button, optionValue){ return window.__SS_PRODUCT_RUNTIME__?.selectProductOption?.({ getBasket:()=>basket, persistBasket:(reason)=>persistBasket(reason) }, button, optionValue); }
function prevImage(){ return window.__SS_PRODUCT_RUNTIME__?.prevImage?.({ getCurrentIndex:()=>window.currentIndex, setCurrentIndex:(v)=>{ window.currentIndex=v; }, getCurrentProductImages:()=>window.currentProductImages || [], updateImage:(dir)=>updateImage(dir) }); }
function nextImage(){ return window.__SS_PRODUCT_RUNTIME__?.nextImage?.({ getCurrentIndex:()=>window.currentIndex, setCurrentIndex:(v)=>{ window.currentIndex=v; }, getCurrentProductImages:()=>window.currentProductImages || [], updateImage:(dir)=>updateImage(dir) }); }
function changeImage(imgSrc){ return window.__SS_PRODUCT_RUNTIME__?.changeImage?.({ getCurrentProductImages:()=>window.currentProductImages || [], setCurrentIndex:(v)=>{ window.currentIndex=v; }, updateImage:()=>updateImage() }, imgSrc); }
function __ssGetQtyKey(k){ return window.__SS_PRODUCT_RUNTIME__?.getQtyKey?.(k) ?? String(k || '').trim(); }
function __ssGetQtyValue(productKey){ return window.__SS_PRODUCT_RUNTIME__?.getQtyValue?.(productKey) ?? 1; }
function __ssSetQtyValue(productKey, qty){ return window.__SS_PRODUCT_RUNTIME__?.setQtyValue?.(productKey, qty) ?? qty; }
function increaseQuantity(productKey){ return window.__SS_PRODUCT_RUNTIME__?.increaseQuantity?.(productKey); }
function decreaseQuantity(productKey){ return window.__SS_PRODUCT_RUNTIME__?.decreaseQuantity?.(productKey); }
function changeQuantity(itemKey, amount){ return window.__SS_CART_RUNTIME__?.changeQuantity?.({ basket, persistBasket, updateBasket }, itemKey, amount); }
function filterProducts(searchTerm){ return window.__SS_PRODUCT_RUNTIME__?.filterProducts?.({ getProducts:()=>typeof products!=='undefined'?products:null }, searchTerm) || []; }
function slugifyName(name){ return window.__SS_PRODUCT_RUNTIME__?.slugifyName?.(name) ?? String(name || ''); }
function findProductById(productId){ return window.__SS_PRODUCT_RUNTIME__?.findProductById?.({ getProductsById:()=>window.productsById || null, getCatalog:()=>window.products || productsDatabase || {} }, productId) || null; }
function findProductBySlug(slug){ return window.__SS_PRODUCT_RUNTIME__?.findProductBySlug?.({ getCatalog:()=>window.products || productsDatabase || {}, slugifyName:(name)=>slugifyName(name) }, slug) || null; }
function findProductByName(name){ return window.__SS_PRODUCT_RUNTIME__?.findProductByName?.({ getCatalog:()=>window.products || productsDatabase || {}, normalizeProductKey:(value)=>normalizeProductKey(value) }, name) || null; }
function parseIncomingProductRef(){ return window.__SS_PRODUCT_RUNTIME__?.parseIncomingProductRef?.(window.location) || null; }
function navigateToProduct(productName){ return window.__SS_PRODUCT_RUNTIME__?.navigateToProduct?.({ tokenFactory:(prefix)=>__ssToken(prefix), rememberClickToken:(token)=>__ssRememberClickToken(token), sendAnalyticsEvent:(type,payload)=>sendAnalyticsEvent(type,payload), buildAnalyticsProductPayload:(name)=>buildAnalyticsProductPayload(name), getAllProductsFlatSafe:()=>getAllProductsFlatSafe(), getProductDescription:(name)=>getProductDescription(name), getProductPrice:(name)=>getProductPrice(name), resolveVariantPriceEUR:(prod,arr,opt)=>__ssResolveVariantPriceEUR(prod, arr, opt), idNorm:(value)=>__ssIdNorm(value), navigate:(action,data)=>navigate(action,data), getABDescription:(prod)=>__ssABGetProductDescription(prod) }, productName); }
function getProductPrice(productName){ return window.__SS_PRODUCT_RUNTIME__?.getProductPrice?.({ getProducts:()=>typeof products!=='undefined'?products:null }, productName) ?? 'N/A'; }
function _val(id){ return window.__SS_CHECKOUT_RUNTIME__?.valById?.(id) ?? (document.getElementById(id) ? String(document.getElementById(id).value || '').trim() : ''); }
function collectUserDetails(){ return window.__SS_CHECKOUT_RUNTIME__?.collectUserDetails?.() || {}; }
function getApiBase(){ return window.__SS_CHECKOUT_RUNTIME__?.getApiBase?.({ API_BASE:typeof API_BASE!=='undefined' ? API_BASE : '' }) || ((typeof API_BASE!=='undefined' && API_BASE) ? API_BASE : ''); }
function buildStripeSafeCart(fullCart){ return window.__SS_CHECKOUT_RUNTIME__?.buildStripeSafeCart?.({ normalizeSelectedOptions:(v)=>__ssNormalizeSelectedOptions(v) }, fullCart) || (Array.isArray(fullCart) ? fullCart.slice() : []); }
try { if (typeof window!=='undefined' && typeof window.__ssBuildStripeSafeCartV2!=='function') window.__ssBuildStripeSafeCartV2=buildStripeSafeCart; } catch {}
function buildFullCartFromBasket(){ return window.__SS_CHECKOUT_RUNTIME__?.buildFullCartFromBasket?.({ readBasket:typeof readBasket==='function'?readBasket:null, ensureContributionProducts:()=>__ssEnsureContributionProducts(), getContributionCache:()=>window.__ssContributionCache, getCatalogFlat:()=>__ssGetCatalogFlat(), normalizeSelectedOptions:(v)=>__ssNormalizeSelectedOptions(v), resolveVariantPriceEUR:(prod,sel,legacySel)=>__ssResolveVariantPriceEUR(prod, sel, legacySel), canonicalizeProductLink:(v)=>canonicalizeProductLink(v) }) || []; }
function __ssBuildFullCartFromBasketObject(basketObj){ return window.__SS_CHECKOUT_RUNTIME__?.buildFullCartFromBasketObject?.(basketObj) || []; }
function __ssGetFullCartPreferred(){ return window.__SS_CHECKOUT_RUNTIME__?.getFullCartPreferred?.({ getPreservedBuilder:()=>typeof window.__ssBuildFullCartFromBasketV2==='function' ? window.__ssBuildFullCartFromBasketV2 : null, getBasket:()=>typeof basket==='object' ? basket : null, readBasket:typeof readBasket==='function' ? readBasket : null }) || []; }
try { if (typeof window!=='undefined' && typeof window.__ssBuildFullCartFromBasketV2!=='function') window.__ssBuildFullCartFromBasketV2=buildFullCartFromBasket; } catch {}
(function __ssEnsureCheckoutHelpers(){ const w=typeof window!=='undefined' ? window : {}; if (typeof w.getSelectedCountryCode!=='function') w.getSelectedCountryCode=function(){ return window.__SS_CHECKOUT_RUNTIME__?.getSelectedCountryCode?.() || String(document.getElementById('countrySelect')?.value || localStorage.getItem('detectedCountry') || 'US').trim().toUpperCase(); }; if (typeof w.round2!=='function') w.round2=function(n){ return window.__SS_CHECKOUT_RUNTIME__?.round2?.(n) ?? (Number.isFinite(Number(n)) ? Math.round(Number(n)*100)/100 : 0); }; })();
function getSelectedCountryCode(){ return window.__SS_CHECKOUT_RUNTIME__?.getSelectedCountryCode?.() || String(document.getElementById('countrySelect')?.value || localStorage.getItem('detectedCountry') || 'US').trim().toUpperCase(); }
function getApplyTariffFlag(){ const effectiveServerApplyTariff = (typeof window.serverApplyTariff==='boolean') ? window.serverApplyTariff : serverApplyTariff; if (typeof effectiveServerApplyTariff==='boolean') serverApplyTariff = effectiveServerApplyTariff; return window.__SS_CHECKOUT_RUNTIME__?.getApplyTariffFlag?.({ serverApplyTariff: effectiveServerApplyTariff }) ?? (typeof effectiveServerApplyTariff==='boolean' ? effectiveServerApplyTariff : (localStorage.getItem('applyTariff') == null ? true : localStorage.getItem('applyTariff')==='true')); }
function round2(n){ return window.__SS_CHECKOUT_RUNTIME__?.round2?.(n) ?? (Number.isFinite(Number(n)) ? Math.round(Number(n)*100)/100 : 0); }




/* Override: basket rendering escapes user/product strings and shows multi-options */



window.preloadSettingsData = preloadSettingsData;
window.__ssNormalizeCatalogImages = __ssNormalizeCatalogImages;
window.__ssGetFeatureFlags = window.__ssGetFeatureFlags || function(){ try { return (window.preloadedData && window.preloadedData.storefrontConfig && window.preloadedData.storefrontConfig.featureFlags) || {}; } catch { return {}; } };
window.__ssFlagEnabled = window.__ssFlagEnabled || function(name, fallback=false){ try { const flags = window.__ssGetFeatureFlags(); return (name in flags) ? !!flags[name] : !!fallback; } catch { return !!fallback; } };
window.__ssGetCatalogFlat = window.__ssGetCatalogFlat || function(){ try { return Object.values(window.productsDatabase || window.products || {}).filter(Boolean); } catch { return []; } };
