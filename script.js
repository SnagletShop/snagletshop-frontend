async function ensureStripePublishableKey() {
    // 1) Prefer explicitly injected key (e.g. in index.html or Netlify env replacement)
    if (window.STRIPE_PUBLISHABLE_KEY && String(window.STRIPE_PUBLISHABLE_KEY).trim()) {
        return String(window.STRIPE_PUBLISHABLE_KEY).trim();
    }
    // 2) Fetch from backend public-config (no secrets)
    try {
        const res = await fetch(`${API_BASE}/public-config`, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        const k = data && data.stripePublishableKey ? String(data.stripePublishableKey).trim() : "";
        if (k) {
            window.STRIPE_PUBLISHABLE_KEY = k;
            return k;
        }
    } catch { }
    return "";
}

function showStripeConfigError(msg) {
    try {
        alert(msg);
    } catch { }
    const payBtn = document.getElementById("payButton") || document.getElementById("payBtn");
    if (payBtn) payBtn.disabled = true;
}


window.functionBlacklist = new Set([

]);
const AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE = true;
// applyTariff is controlled by the backend (see /products payload: applyTariff).
// We keep a local fallback for offline/backwards compatibility.
let serverApplyTariff = null;
if (localStorage.getItem("applyTariff") == null) localStorage.setItem("applyTariff", "true");
// early in boot:
// API base is configurable for local/staging.
// You can override by setting window.__API_BASE__ before this script loads,
// or by setting <meta name="api-base" content="https://..."> in index.html.
const DEFAULT_BACKEND_PORT = 5500; // server.js default

const API_BASE = (() => {
  const injected = (typeof window !== "undefined" && window.__API_BASE__) ? String(window.__API_BASE__) : "";
  const meta = String(document.querySelector('meta[name="api-base"]')?.getAttribute("content") || "");

  const chosen = (injected || meta).trim();
  if (chosen) return chosen.replace(/\/+$/, "");

  // Production default (no explicit port -> https/443)
  const host = window.location.hostname || "";
  const isProd =
    host === "snagletshop.com" ||
    host === "www.snagletshop.com" ||
    host === "api.snagletshop.com" ||
    host.endsWith(".snagletshop.com");

  if (isProd) return "https://api.snagletshop.com";

  // Dev / direct-IP default -> same host on :8080
  const proto = window.location.protocol || "http:";
  return `${proto}//${host}:${DEFAULT_BACKEND_PORT}`;
})().replace(/\/+$/, "");


function canonicalizeProductLink(link) {
    const raw = String(link || "").trim();
    if (!raw) return "";
    try {
        const u = new URL(raw);
        u.search = "";
        u.hash = "";
        const path = u.pathname.replace(/\/+$/, "");
        return `${u.protocol}//${u.host}${path}`;
    } catch {
        return raw.split("?")[0].split("#")[0].replace(/\/+$/, "");
    }
}

function extractProductIdFromLink(link) {
    const s = canonicalizeProductLink(link);
    if (!s) return "";
    const m = s.match(/\/item\/(\d+)\.html/i) || s.match(/\/i\/(\d+)\.html/i);
    if (m && m[1]) return String(m[1]);
    const m2 = s.match(/(\d{10,16})/);
    if (m2 && m2[1]) return String(m2[1]);
    return "";
}

function normalizeCartItemsForServer(items) {
    const arr = Array.isArray(items) ? items : [];
    return arr.map((it) => {
        const productLink = String(it?.productLink || it?.link || "").trim();
        const canonicalLink = canonicalizeProductLink(productLink);
        const productId = String(it?.productId || extractProductIdFromLink(productLink) || extractProductIdFromLink(canonicalLink) || "").trim();
        return {
            ...it,
            productLink: canonicalLink || productLink,
            productId
        };
    });
}




// ---------------- Turnstile (Cloudflare) token helper ----------------
// Requirements:
//  - index.html must include Turnstile api.js?render=explicit
//  - set <meta name="turnstile-sitekey" content="...">
//  - an element with id="snaglet-turnstile" exists (created in index.html; fallback created here)
const __snagletTurnstile = {
    widgetId: null,
    lastToken: "",
    pending: null
};

function __snagletGetTurnstileSiteKey() {
    const key = document.querySelector('meta[name="turnstile-sitekey"]')?.content?.trim() || "";
    // Keep default placeholder inert (prevents accidental broken builds)
    if (!key || key === "__TURNSTILE_SITE_KEY__") return "";
    return key;
}

function __snagletEnsureTurnstileContainer() {
    let el = document.getElementById("snaglet-turnstile");
    if (!el) {
        el = document.createElement("div");
        el.id = "snaglet-turnstile";
        el.style.cssText = "position:fixed;bottom:12px;right:12px;width:150px;min-height:140px;z-index:2147483647;";
        document.body.appendChild(el);
    }
    return el;
}

function __snagletWaitForTurnstile(timeoutMs = 10000) {
    return new Promise((resolve) => {
        const started = Date.now();
        const tick = () => {
            if (window.turnstile && typeof window.turnstile.render === "function") return resolve(true);
            if (Date.now() - started > timeoutMs) return resolve(false);
            setTimeout(tick, 50);
        };
        tick();
    });
}

async function __snagletInitTurnstileOnce() {
    if (__snagletTurnstile.widgetId != null) return true;

    const sitekey = __snagletGetTurnstileSiteKey();
    if (!sitekey) return false;

    // Make sure container exists
    __snagletEnsureTurnstileContainer();

    const ok = await __snagletWaitForTurnstile(12000);
    if (!ok) return false;

    try {
        window.turnstile.ready(() => {
            try {
                __snagletTurnstile.widgetId = window.turnstile.render("#snaglet-turnstile", {
                    sitekey,
                    size: "compact",
                    appearance: "interaction-only",
                    execution: "execute", // token is generated only when we call turnstile.execute()
                    callback: (token) => {
                        __snagletTurnstile.lastToken = token || "";
                        if (__snagletTurnstile.pending) {
                            clearTimeout(__snagletTurnstile.pending.timer);
                            __snagletTurnstile.pending.resolve(__snagletTurnstile.lastToken);
                            __snagletTurnstile.pending = null;
                        }
                    },
                    "expired-callback": () => {
                        __snagletTurnstile.lastToken = "";
                    },
                    "error-callback": () => {
                        __snagletTurnstile.lastToken = "";
                        if (__snagletTurnstile.pending) {
                            clearTimeout(__snagletTurnstile.pending.timer);
                            __snagletTurnstile.pending.resolve("");
                            __snagletTurnstile.pending = null;
                        }
                    }
                });
            } catch (e) {
                console.warn("[turnstile] render failed:", e?.message || e);
            }
        });
        return true;
    } catch (e) {
        console.warn("[turnstile] init failed:", e?.message || e);
        return false;
    }
}

async function snagletGetTurnstileToken({ forceFresh = true, timeoutMs = 12000 } = {}) {
    const inited = await __snagletInitTurnstileOnce();
    if (!inited || !window.turnstile || __snagletTurnstile.widgetId == null) return "";

    const wid = __snagletTurnstile.widgetId;

    // If caller doesn't require fresh token, reuse current one if present
    try {
        if (!forceFresh) {
            const existing = window.turnstile.getResponse(wid);
            if (existing) return String(existing);
        }

        // Reset + execute to get a single-use, fresh token
        window.turnstile.reset(wid);

        const token = await new Promise((resolve) => {
            const timer = setTimeout(() => resolve(""), timeoutMs);
            __snagletTurnstile.pending = { resolve, timer };
            try {
                try {
                    window.turnstile.execute(wid);
                } catch (e2) {
                    // Fallback for older API signatures
                    window.turnstile.execute("#snaglet-turnstile");
                }
            } catch (e) {
                clearTimeout(timer);
                __snagletTurnstile.pending = null;
                resolve("");
            }
        });

        return String(token || window.turnstile.getResponse(wid) || __snagletTurnstile.lastToken || "");
    } catch (e) {
        console.warn("[turnstile] token failed:", e?.message || e);
        return "";
    }
}

// Initialize early so the widget is ready when user checks out
document.addEventListener("DOMContentLoaded", () => { __snagletInitTurnstileOnce(); });
// ----------------------------------------------------------------------

let productsDatabase = {};

// Seed from legacy window.products (if present)
if (typeof window !== "undefined" && window.products && typeof window.products === "object" && Object.keys(window.products).length > 0) {
    productsDatabase = window.products;
    console.log("ℹ️ Seeded productsDatabase from legacy window.products.");
}

let initProductsPromise = null;
let exchangeRatesFetchedAt = 0;
/**
 * Loads product catalog from the backend and normalizes globals:
 * - productsDatabase (this file)
 * - window.products (legacy global used throughout the UI)
 *
 * Returns a Promise that resolves to the loaded products object.
 * Safe to call multiple times (memoized).
 */
function initProducts() {
    if (initProductsPromise) return initProductsPromise;

    initProductsPromise = (async () => {
        try {
            const r = await fetch(`${API_BASE}/catalog`);
            if (!r.ok) throw new Error(`Products request failed: ${r.status}`);

            const productsPayload = await r.json();

            // ---- canonical shape (/catalog) ----
            if (productsPayload && productsPayload.productsById && productsPayload.categories) {
                const productsById = productsPayload.productsById || {};
                const categories = productsPayload.categories || {};

                const resolvedCatalog = {};
                for (const [cat, ids] of Object.entries(categories)) {
                    resolvedCatalog[cat] = (ids || []).map(id => productsById[id]).filter(Boolean);
                }

                productsDatabase = resolvedCatalog;
                window.products = productsDatabase;

                const cfg = productsPayload.config || {};
                if (typeof cfg.applyTariff === "boolean") {
                    serverApplyTariff = cfg.applyTariff;
                    localStorage.setItem("applyTariff", String(serverApplyTariff));
                }

                console.log("✅ Products data loaded (canonical).");
                return window.products; // IMPORTANT: stop here
            }

            // ---- legacy shapes (if ever used) ----
            const catalog =
                (productsPayload && typeof productsPayload === "object" && productsPayload.catalog && typeof productsPayload.catalog === "object")
                    ? productsPayload.catalog
                    : productsPayload;

            const cfg =
                (productsPayload && typeof productsPayload === "object" && productsPayload.config && typeof productsPayload.config === "object")
                    ? productsPayload.config
                    : {};

            productsDatabase = catalog || {};
            window.products = productsDatabase;

            if (typeof cfg.applyTariff === "boolean") {
                serverApplyTariff = cfg.applyTariff;
                localStorage.setItem("applyTariff", String(serverApplyTariff));
            }

            console.log("✅ Products data loaded.");
        } catch (err) {
            console.error("❌ Failed to load products from server, falling back to window.products:", err);
            productsDatabase = window.products || {};
            window.products = productsDatabase;
        }

        return window.products;
    })();

    return initProductsPromise;
}

// Kick off loading immediately when the script is loaded
initProducts();





const TEXTS = {
    ERRORS: {
        BASKET_PARSE: "❌ Failed to parse basket from localStorage. Resetting basket.",
        GEOLOCATION_FAIL: "Geolocation failed, defaulting to EUR",
        PRODUCTS_NOT_LOADED: "Products data not loaded. Check your script order.",
        PRODUCTS_LOADED: "Products data loaded."
    },
    GENERAL: {
        TOTAL_LABEL: "Total: ",
        DARK_MODE_LABEL: "Dark Mode"
    },
    CURRENCIES: {
        EUR: "€",
        USD: "$",
        GBP: "£",
        CAD: "C$",
        AUD: "A$"
    },
    PAYMENT_MODAL: {
        TITLE: "Enter Payment Details",
        FIELDS: {
            NAME: "First Name",
            SURNAME: "Last Name",
            EMAIL: "Email Address",
            CITY: "City / Town",
            POSTAL_CODE: "Postal Code",
            STREET_HOUSE_NUMBER: "Street and House Number",
            COUNTRY: "Country of Residence",
            CARD_HOLDER_NAME_LABEL: "Cardholder Name",
            CARD_HOLDER_NAME_PLACEHOLDER: "Cardholder Name",
            CARD_NUMBER_LABEL: "Card Number",
            CARD_NUMBER_PLACEHOLDER: "xxxx xxxx xxxx xxxx",
            EXPIRY_DATE_LABEL: "Card Expiry Date",
            EXPIRY_DATE_PLACEHOLDER: "MM/YY",
            CVV_LABEL: "CVV",
            CVV_PLACEHOLDER: "CVV"
        },
        BUTTONS: {
            SUBMIT: "Pay Now",
            CLOSE: "×"
        }
    },
    CONTACT_FORM: {
        TITLE: "Send us a Message!",
        FIELDS: {
            EMAIL: "Your Email",
            MESSAGE: "Message"
        },
        SEND_BUTTON: "Send!"
    },
    SORTING: {
        LABEL: "Sort by:",
        OPTIONS: {
            NAME_ASC: "Name (A-Z)",
            NAME_DESC: "Name (Z-A)",
            PRICE_ASC: "Price (Low to High)",
            PRICE_DESC: "Price (High to Low)"
        }
    },
    PRODUCT_SECTION: {
        ADD_TO_CART: "Add to Cart",
        BUY_NOW: "Buy",
        PRICE_LABEL: "Price: ",
        DESCRIPTION_PLACEHOLDER: "No description available.",
        IMAGE_NAV: {
            PREVIOUS: "◀",
            NEXT: "▶"
        }
    },
    SEARCH: {
        PLACEHOLDER: "Search",
        EMPTY_MESSAGE: "Please enter a search term.",
        NO_RESULTS: "No products found."
    },
    BASKET: {
        EMPTY_MESSAGE: "The basket is empty.",
        TOTAL_PRICE: "Total Price: ",
        QUANTITY: "Quantity:",
        BUTTONS: {
            DECREASE: "−",
            INCREASE: "+",
            PAY_NOW: "Pay Now"
        },
        RECEIPT_TITLE: "Receipt"
    }
};
// Exchange rates
let exchangeRates = {

    EUR: 1,
    USD: 1.1,
    GBP: 0.85,
    CAD: 1.45,
    AUD: 1.6
};
let tariffMultipliers = {};
// Country-to-currency mapping
const countryToCurrency = {
    US: "USD", CA: "CAD", MX: "MXN", JM: "JMD", DO: "DOP",
    GB: "GBP", FR: "EUR", DE: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
    PL: "PLN", CZ: "CZK", SE: "SEK", NO: "NOK", DK: "DKK", HU: "HUF", RO: "RON", BG: "BGN",
    RU: "RUB", UA: "UAH",
    SK: "EUR", SI: "EUR", PT: "EUR", FI: "EUR", IE: "EUR", AT: "EUR", GR: "EUR", EE: "EUR", LV: "EUR", LT: "EUR",
    JP: "JPY", CN: "CNY", IN: "INR", KR: "KRW", ID: "IDR", MY: "MYR", PH: "PHP", TH: "THB", VN: "VND",
    PK: "PKR", BD: "BDT",
    ZA: "ZAR", NG: "NGN", KE: "KES", EG: "EGP", GH: "GHS", TZ: "TZS",
    AU: "AUD", NZ: "NZD", FJ: "FJD", PG: "PGK",
    AE: "AED", SA: "SAR", IL: "ILS", TR: "TRY", IR: "IRR",
    BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", VE: "VES"
};
const countryNames = {
    US: "United States",
    CA: "Canada",
    MX: "Mexico",
    JM: "Jamaica",
    DO: "Dominican Republic",

    GB: "United Kingdom",
    FR: "France",
    DE: "Germany",
    IT: "Italy",
    ES: "Spain",
    NL: "Netherlands",
    BE: "Belgium",

    PL: "Poland",
    CZ: "Czechia",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    HU: "Hungary",
    RO: "Romania",
    BG: "Bulgaria",

    RU: "Russia",
    UA: "Ukraine",

    SK: "Slovakia",
    SI: "Slovenia",
    PT: "Portugal",
    FI: "Finland",
    IE: "Ireland",
    AT: "Austria",
    GR: "Greece",
    EE: "Estonia",
    LV: "Latvia",
    LT: "Lithuania",

    JP: "Japan",
    CN: "China",
    IN: "India",
    KR: "South Korea",
    ID: "Indonesia",
    MY: "Malaysia",
    PH: "Philippines",
    TH: "Thailand",
    VN: "Vietnam",

    PK: "Pakistan",
    BD: "Bangladesh",

    ZA: "South Africa",
    NG: "Nigeria",
    KE: "Kenya",
    EG: "Egypt",
    GH: "Ghana",
    TZ: "Tanzania",

    AU: "Australia",
    NZ: "New Zealand",
    FJ: "Fiji",
    PG: "Papua New Guinea",

    AE: "United Arab Emirates",
    SA: "Saudi Arabia",
    IL: "Israel",
    TR: "Turkey",
    IR: "Iran",

    BR: "Brazil",
    AR: "Argentina",
    CL: "Chile",
    CO: "Colombia",
    PE: "Peru",
    VE: "Venezuela",
    AF: "Afghanistan",
    AL: "Albania",
    AM: "Armenia",
    AO: "Angola",
    AZ: "Azerbaijan",
    BA: "Bosnia and Herzegovina",
    BB: "Barbados",
    BH: "Bahrain",
    BI: "Burundi",
    BJ: "Benin",
    BO: "Bolivia",
    BW: "Botswana",
    BY: "Belarus",
    BZ: "Belize",
    CD: "Democratic Republic of the Congo",
    CF: "Central African Republic",
    CG: "Republic of the Congo",
    CI: "Ivory Coast",
    CR: "Costa Rica",
    CU: "Cuba",
    CV: "Cape Verde",
    CY: "Cyprus",
    DJ: "Djibouti",
    DZ: "Algeria",
    EC: "Ecuador",
    ER: "Eritrea",
    ET: "Ethiopia",
    GA: "Gabon",
    GE: "Georgia",
    GM: "Gambia",
    GN: "Guinea",
    GQ: "Equatorial Guinea",
    GT: "Guatemala",
    GY: "Guyana",
    HN: "Honduras",
    HR: "Croatia",
    HT: "Haiti",
    IS: "Iceland",
    JO: "Jordan",
    KZ: "Kazakhstan",
    LB: "Lebanon",
    LK: "Sri Lanka",
    LR: "Liberia",
    LS: "Lesotho",
    LY: "Libya",
    MA: "Morocco",
    MD: "Moldova",
    ME: "Montenegro",
    MG: "Madagascar",
    MK: "North Macedonia",
    ML: "Mali",
    MM: "Myanmar (Burma)",
    MN: "Mongolia",
    MR: "Mauritania",
    MW: "Malawi",
    MZ: "Mozambique",
    NA: "Namibia",
    NE: "Niger",
    NI: "Nicaragua",
    NP: "Nepal",
    OM: "Oman",
    PA: "Panama",
    PS: "Palestine",
    QA: "Qatar",
    RS: "Serbia",
    RW: "Rwanda",
    SD: "Sudan",
    SN: "Senegal",
    SO: "Somalia",
    SS: "South Sudan",
    SR: "Suriname",
    SV: "El Salvador",
    SY: "Syria",
    TM: "Turkmenistan",
    TN: "Tunisia",
    TT: "Trinidad and Tobago",
    TW: "Taiwan",
    TZ: "Tanzania",
    UG: "Uganda",
    UY: "Uruguay",
    UZ: "Uzbekistan",
    YE: "Yemen",
    ZM: "Zambia",
    ZW: "Zimbabwe",
    AD: "Andorra",
    AG: "Antigua and Barbuda",
    AI: "Anguilla",
    AQ: "Antarctica",
    AS: "American Samoa",
    AW: "Aruba",
    AX: "Åland Islands",

    BF: "Burkina Faso",
    BL: "Saint Barthélemy",
    BM: "Bermuda",
    BN: "Brunei",
    BQ: "Bonaire, Sint Eustatius and Saba",
    BS: "Bahamas",
    BT: "Bhutan",
    BV: "Bouvet Island",

    CC: "Cocos (Keeling) Islands",
    CH: "Switzerland",
    CK: "Cook Islands",
    CM: "Cameroon",
    CW: "Curaçao",
    CX: "Christmas Island",

    DM: "Dominica",
    EH: "Western Sahara",

    FK: "Falkland Islands (Malvinas)",
    FM: "Micronesia",
    FO: "Faroe Islands",

    GD: "Grenada",
    GF: "French Guiana",
    GG: "Guernsey",
    GI: "Gibraltar",
    GL: "Greenland",
    GP: "Guadeloupe",
    GS: "South Georgia and the South Sandwich Islands",
    GU: "Guam",
    GW: "Guinea-Bissau",

    HK: "Hong Kong",
    HM: "Heard Island and McDonald Islands",
    IM: "Isle of Man",
    IO: "British Indian Ocean Territory",
    IQ: "Iraq",
    JE: "Jersey",

    KG: "Kyrgyzstan",
    KH: "Cambodia",
    KI: "Kiribati",
    KM: "Comoros",
    KN: "Saint Kitts and Nevis",
    KP: "North Korea",
    KW: "Kuwait",
    KY: "Cayman Islands",
    LA: "Laos",
    LC: "Saint Lucia",
    LI: "Liechtenstein",
    LU: "Luxembourg",

    MC: "Monaco",
    MF: "Saint Martin (French part)",
    MH: "Marshall Islands",
    MO: "Macao",
    MP: "Northern Mariana Islands",
    MQ: "Martinique",
    MS: "Montserrat",
    MT: "Malta",
    MU: "Mauritius",
    MV: "Maldives",

    NC: "New Caledonia",
    NF: "Norfolk Island",
    NR: "Nauru",
    NU: "Niue",

    PF: "French Polynesia",
    PM: "Saint Pierre and Miquelon",
    PN: "Pitcairn",
    PR: "Puerto Rico",
    PW: "Palau",
    PY: "Paraguay",
    RE: "Réunion",

    SB: "Solomon Islands",
    SC: "Seychelles",
    SG: "Singapore",
    SH: "Saint Helena, Ascension and Tristan da Cunha",
    SJ: "Svalbard and Jan Mayen",
    SL: "Sierra Leone",
    SM: "San Marino",
    ST: "São Tomé and Príncipe",
    SX: "Sint Maarten (Dutch part)",
    SZ: "Eswatini",

    TC: "Turks and Caicos Islands",
    TD: "Chad",
    TF: "French Southern Territories",
    TG: "Togo",
    TJ: "Tajikistan",
    TK: "Tokelau",
    TL: "Timor-Leste",
    TO: "Tonga",
    TV: "Tuvalu",

    UM: "United States Minor Outlying Islands",
    VA: "Vatican City",
    VC: "Saint Vincent and the Grenadines",
    VG: "British Virgin Islands",
    VI: "U.S. Virgin Islands",
    VU: "Vanuatu",
    WF: "Wallis and Futuna",
    WS: "Samoa",
    YT: "Mayotte",

};

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


function showAppLoader(text = "Loading…") {
    const overlay = document.getElementById(APP_LOADER_ID);
    if (overlay) {
        const textEl = document.getElementById(`${APP_LOADER_ID}_text`);
        if (textEl) textEl.textContent = String(text || "Loading…");
        overlay.style.display = "flex";
    }

    document.documentElement.style.cursor = "progress";
    document.documentElement.setAttribute("aria-busy", "true");

    try { if (document.body) document.body.style.overflow = "hidden"; } catch { }
}

function hideAppLoader() {
    const overlay = document.getElementById(APP_LOADER_ID);
    if (overlay) overlay.remove(); // remove entirely so it can’t reflash

    document.documentElement.style.cursor = "";
    document.documentElement.removeAttribute("aria-busy");

    try { if (document.body) document.body.style.overflow = ""; } catch { }
}

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

if (location.pathname !== "/" && !location.pathname.includes(".") && !location.pathname.startsWith("/order-status/") && !location.pathname.startsWith("/p/")) {
    // Allow deep links for product slugs and /p/<id>.
    // Do not force redirect to '/'.
}
function normalizeProductKey(s) {
    return String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getAllProductsFlatSafe() {
    const db =
        (window.products && typeof window.products === "object" && window.products) ||
        (typeof products !== "undefined" && products) ||
        {};

    const out = [];
    for (const v of Object.values(db)) {
        if (Array.isArray(v)) out.push(...v);
    }

    // filter out the per-category "icon" objects etc.
    return out.filter(p => p && typeof p === "object" && typeof p.name === "string" && p.name.trim());
}

function findProductByNameParam(productParam) {
    const target = normalizeProductKey(productParam);
    const all = getAllProductsFlatSafe();

    // exact normalized match first
    let p = all.find(x => normalizeProductKey(x.name) === target);
    if (p) return p;

    // fallback: handle common slug-ish links
    p = all.find(x => normalizeProductKey(x.name).includes(target) || target.includes(normalizeProductKey(x.name)));
    return p || null;
}

function buildUrlForState(state) {
    try {
        if (state?.action === "GoToProductPage") {
            const name = state?.data?.[0];
            const pid = state?.data?.[4];
            if (pid) return `/p/${encodeURIComponent(pid)}`;
            if (name) return `/?product=${encodeURIComponent(name)}`;
        }
    } catch { }
    // for every other state, keep URL clean (important so product param doesn't “stick”)
    return "/";
}

function navigate(action, data = null) {
    if (isReplaying) return;

    const newState = { action, data };

    // Trim future if navigating from mid-history
    if (currentIndex < userHistoryStack.length - 1) {
        userHistoryStack = userHistoryStack.slice(0, currentIndex + 1);
    }

    // Add new state
    userHistoryStack.push(newState);
    currentIndex = userHistoryStack.length - 1;

    history.pushState({ index: currentIndex }, "", buildUrlForState(newState));
    handleStateChange(newState);
}

function isSettingsCacheValid(timestamp) {
    if (!timestamp) return false;
    const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    return ageInHours < SETTINGS_CACHE_TTL_HOURS;
}
function safeJsonParse(str, fallback = null) {
    try { return JSON.parse(str); } catch { return fallback; }
}

function lsGet(key, fallback = null) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
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

function readBasketFromStorageSafe() {
    try {
        const raw = localStorage.getItem(BASKET_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

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
}

function refreshBasketUIIfOpen() {
    // Only re-render if the basket view already exists; don't “force open” it.
    if (document.getElementById("Basket_Viewer") && typeof updateBasket === "function") {
        updateBasket();
    }
}

function syncBasketFromStorage(reason = "external") {
    replaceBasketInMemory(readBasketFromStorageSafe());
    refreshBasketUIIfOpen();

    // If checkout modal is open and cart changed in another tab, close it to avoid stale checkout state.
    const modal = document.getElementById("paymentModal");
    const modalOpen = modal && modal.style && modal.style.display && modal.style.display !== "none";
    if (modalOpen && typeof closeModal === "function") {
        try { closeModal(); } catch { }
    }
}

function persistBasket(reason = "update") {
    try { localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket)); } catch { }
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch { }

    if (basketBC) {
        try { basketBC.postMessage({ type: "basket_changed", from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch { }
    }
}

function clearBasketStorage(reason = "clear") {
    try { localStorage.removeItem(BASKET_STORAGE_KEY); } catch { }
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch { }

    if (basketBC) {
        try { basketBC.postMessage({ type: "basket_changed", from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch { }
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
    if (_preloadSettingsPromise) return _preloadSettingsPromise;

    const setRatesFetchedAt = (ts) => {
        const safeTs = Number(ts || 0) || 0;

        // always publish timestamp globally so other functions can read it safely
        window.exchangeRatesFetchedAt = safeTs;

        // if you have a global variable declared, keep it in sync (no ReferenceError)
        if (typeof exchangeRatesFetchedAt !== "undefined") {
            exchangeRatesFetchedAt = safeTs;
        }

        window.preloadedData = window.preloadedData || {};
        window.preloadedData.ratesFetchedAt = safeTs;
    };

    _preloadSettingsPromise = (async () => {
        try {
            window.preloadedData = window.preloadedData || {
                exchangeRates: null,
                countries: null,
                tariffs: null,
                ratesFetchedAt: 0
            };

            const cached = safeJsonParse(lsGet(SETTINGS_CACHE_KEY));
            if (cached && isSettingsCacheValid(cached.timestamp)) {
                tariffMultipliers = (cached.tariffs && typeof cached.tariffs === "object") ? cached.tariffs : {};
                exchangeRates = (cached.rates && typeof cached.rates === "object") ? cached.rates : {};

                // restore FX snapshot timestamp (0 if older cache format)
                setRatesFetchedAt(cached.ratesFetchedAt || cached.fetchedAt || 0);

                window.preloadedData.tariffs = tariffMultipliers;
                window.preloadedData.exchangeRates = exchangeRates;
                window.preloadedData.countries =
                    cached.countries || tariffsObjectToCountriesArray(tariffMultipliers);

                handlesTariffsDropdown(window.preloadedData.countries || []);
                console.log("⚡ Using cached settings data.");
                return;
            }

            // Fetch fresh settings (NO fetchTariffs() here -> breaks recursion)
            const [tariffsObj, ratesData, countriesArr] = await Promise.all([
                fetchTariffsFromServer(),
                fetchExchangeRatesFromServer(),
                fetchCountriesFromServer().catch(() => null)
            ]);

            const safeTariffs =
                (tariffsObj && typeof tariffsObj === "object" && !Array.isArray(tariffsObj)) ? tariffsObj : {};

            // ratesData expected: { rates: {...}, fetchedAt: <ms> }, but tolerate older shapes too
            const safeRates =
                (ratesData && typeof ratesData.rates === "object" && ratesData.rates && !Array.isArray(ratesData.rates))
                    ? ratesData.rates
                    : ((ratesData && typeof ratesData === "object" && !Array.isArray(ratesData)) ? ratesData : {});

            const fetchedAt =
                (ratesData && Number(ratesData.fetchedAt || 0)) ? Number(ratesData.fetchedAt) : 0;

            tariffMultipliers = { ...safeTariffs };
            exchangeRates = { ...safeRates };
            setRatesFetchedAt(fetchedAt);

            const countriesList = (Array.isArray(countriesArr) && countriesArr.length)
                ? countriesArr
                : tariffsObjectToCountriesArray(tariffMultipliers);
            handlesTariffsDropdown(countriesList);

            // keep global preloadedData coherent
            window.preloadedData.tariffs = tariffMultipliers;
            window.preloadedData.exchangeRates = exchangeRates;
            window.preloadedData.countries = countriesList;

            lsSet(SETTINGS_CACHE_KEY, JSON.stringify({
                tariffs: tariffMultipliers,
                rates: exchangeRates,
                ratesFetchedAt: Number(window.exchangeRatesFetchedAt || 0) || 0,
                countries: countriesList,
                timestamp: Date.now()
            }));

            console.log("✅ Settings data loaded & cached.");
        } catch (err) {
            console.warn("⚠️ preloadSettingsData failed:", err?.message || err);
            tariffMultipliers = (tariffMultipliers && typeof tariffMultipliers === "object") ? tariffMultipliers : {};
            exchangeRates = (exchangeRates && typeof exchangeRates === "object") ? exchangeRates : {};
            setRatesFetchedAt(window.exchangeRatesFetchedAt || 0);
        }
    })();

    try {
        return await _preloadSettingsPromise;
    } finally {
        _preloadSettingsPromise = null;
    }
}








function openOrderStatusModal(prefill = {}) {
    // Avoid duplicates
    if (document.getElementById("orderStatusModal")) return;

    const overlay = document.createElement("div");
    overlay.id = "orderStatusModal";
    overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:999999",
        "background:rgba(0,0,0,0.55)",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "padding:12px"
    ].join(";");

    const card = document.createElement("div");
    card.style.cssText = [
        "width:min(720px,100%)",
        "max-height:calc(100vh - 24px)",
        "overflow:auto",
        "background:var(--Modal_Background_Colour)",
        "border-radius:18px",
        "padding:18px 18px 14px",
        "box-shadow:0 20px 70px rgba(0,0,0,0.35)",
        "border:1px solid rgba(0,0,0,0.08)",
        "color:var(--Default_Text_Colour)",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"
    ].join(";");

    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;";

    const h = document.createElement("div");
    h.textContent = "Track your order";
    h.style.cssText = "font-size:18px;font-weight:800;";

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.style.cssText = "font-size:22px;line-height:1;border:none;background:transparent;cursor:pointer;padding:6px 10px;border-radius:10px;";
    close.onclick = () => overlay.remove();

    header.appendChild(h);
    header.appendChild(close);

    const form = document.createElement("div");
    form.style.cssText = "display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin-bottom:12px;";

    const oidWrap = document.createElement("div");
    const oidLabel = document.createElement("div");
    oidLabel.textContent = "Order ID";
    oidLabel.style.cssText = "font-size:12px;opacity:0.75;margin-bottom:4px;";
    const oidInput = document.createElement("input");
    oidInput.type = "text";
    oidInput.placeholder = "e.g. SS-2026-000123";
    oidInput.value = prefill.orderId ? String(prefill.orderId) : "";
    oidInput.style.cssText = "width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,0.12);";
    oidWrap.appendChild(oidLabel);
    oidWrap.appendChild(oidInput);

    const tokWrap = document.createElement("div");
    const tokLabel = document.createElement("div");
    tokLabel.textContent = "Token";
    tokLabel.style.cssText = "font-size:12px;opacity:0.75;margin-bottom:4px;";
    const tokInput = document.createElement("input");
    tokInput.type = "text";
    tokInput.placeholder = "public token";
    tokInput.value = prefill.token ? String(prefill.token) : "";
    tokInput.style.cssText = "width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,0.12);";
    tokWrap.appendChild(tokLabel);
    tokWrap.appendChild(tokInput);

    const go = document.createElement("button");
    go.type = "button";
    go.textContent = "Check";
    go.style.cssText = "padding:10px 14px;border-radius:12px;border:none;background:#59a3f2;color:#fff;cursor:pointer;font-weight:700;";

    form.appendChild(oidWrap);
    form.appendChild(tokWrap);
    form.appendChild(go);

    const out = document.createElement("div");
    out.style.cssText = "border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:12px;background:rgba(0,0,0,0.03);min-height:90px;white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:12px;";

    function render(obj) {
        try {
            const lines = [];
            if (obj?.ok) {
                lines.push(`ok: true`);
                lines.push(`orderId: ${obj.orderId || ""}`);
                lines.push(`status: ${obj.status || ""}`);
                if (obj.createdAt) lines.push(`createdAt: ${_formatDateMaybe(obj.createdAt)}`);
                if (obj.paidAt) lines.push(`paidAt: ${_formatDateMaybe(obj.paidAt)}`);
                if (obj.procurementStatus) lines.push(`procurementStatus: ${obj.procurementStatus}`);
                if (obj.deliveredAt) lines.push(`deliveredAt: ${_formatDateMaybe(obj.deliveredAt)}`);
                if (Array.isArray(obj.tracking) && obj.tracking.length) {
                    lines.push(`tracking:`);
                    for (const t of obj.tracking) {
                        const carrier = t?.carrier ? ` ${t.carrier}` : "";
                        const num = t?.number ? ` ${t.number}` : "";
                        const url = t?.url ? ` ${t.url}` : "";
                        lines.push(`  -${carrier}${num}${url}`);
                    }
                }
                if (Array.isArray(obj.items) && obj.items.length) {
                    lines.push(`items:`);
                    for (const it of obj.items) {
                        const opts = Array.isArray(it.selectedOptions) && it.selectedOptions.length ? ` [${it.selectedOptions.join(" | ")}]` : "";
                        const opt1 = it.selectedOption ? ` (${it.selectedOption})` : "";
                        lines.push(`  - ${it.quantity}x ${it.name}${opt1}${opts}`);
                    }
                }
                out.textContent = lines.join("\n");
            } else {
                out.textContent = JSON.stringify(obj, null, 2);
            }
        } catch {
            out.textContent = String(obj || "");
        }
    }

    async function run() {
        go.disabled = true;
        go.textContent = "Checking...";
        out.textContent = "Loading...";
        try {
            const data = await fetchOrderStatus({ orderId: oidInput.value, token: tokInput.value });
            render(data);
        } catch (e) {
            out.textContent = `Error: ${e?.message || e}`;
        } finally {
            go.disabled = false;
            go.textContent = "Check";
        }
    }

    go.onclick = run;
    oidInput.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    tokInput.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });

    const recent = document.createElement("div");
    recent.style.cssText = "margin-top:12px;";

    const recentTitle = document.createElement("div");
    recentTitle.textContent = "Recent orders on this device";
    recentTitle.style.cssText = "font-weight:800;margin-bottom:8px;font-size:13px;opacity:0.9;";

    const recentList = document.createElement("div");
    recentList.style.cssText = "display:flex;flex-direction:column;gap:8px;";

    function renderRecent() {
        recentList.innerHTML = "";
        const items = getRecentOrders();
        if (!items.length) {
            const empty = document.createElement("div");
            empty.textContent = "No recent orders stored yet.";
            empty.style.cssText = "font-size:12px;opacity:0.75;";
            recentList.appendChild(empty);
            return;
        }

        for (const it of items) {
            const row = document.createElement("div");
            row.style.cssText = "display:flex;gap:10px;align-items:center;justify-content:space-between;border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:10px 12px;background:rgba(0,0,0,0.02);";

            const left = document.createElement("div");
            left.style.cssText = "display:flex;flex-direction:column;gap:2px;min-width:0;";

            const a = document.createElement("div");
            a.textContent = String(it.orderId);
            a.style.cssText = "font-weight:800;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";

            const b = document.createElement("div");
            b.textContent = _formatDateMaybe(it.ts);
            b.style.cssText = "font-size:11px;opacity:0.72;";

            left.appendChild(a);
            left.appendChild(b);

            const actions = document.createElement("div");
            actions.style.cssText = "display:flex;gap:8px;align-items:center;";

            const view = document.createElement("button");
            view.type = "button";
            view.textContent = "View";
            view.style.cssText = "padding:8px 10px;border-radius:12px;border:none;background:#59a3f2;color:#fff;cursor:pointer;font-weight:700;";
            view.onclick = () => {
                oidInput.value = String(it.orderId);
                tokInput.value = String(it.token);
                run();
            };

            const open = document.createElement("button");
            open.type = "button";
            open.textContent = "Open link";
            open.style.cssText = "padding:8px 10px;border-radius:12px;border:1px solid rgba(0,0,0,0.12);background:transparent;cursor:pointer;font-weight:700;";
            open.onclick = () => {
                let url = it.orderStatusUrl || `${API_BASE}/order-status-view/${encodeURIComponent(it.orderId)}#token=${encodeURIComponent(it.token)}`;

                // Backward compatibility: convert old ?token= links to the fragment-based view.
                if (typeof url === "string" && url.includes("/order-status/") && url.includes("?token=")) {
                    try {
                        const u = new URL(url, window.location.origin);
                        const tok = u.searchParams.get("token") || "";
                        u.pathname = u.pathname.replace(/\/order-status\//, "/order-status-view/");
                        u.search = "";
                        u.hash = tok ? `token=${encodeURIComponent(tok)}` : "";
                        url = u.toString();
                    } catch { }
                }
                window.open(url, "_blank", "noopener,noreferrer");
            };

            actions.appendChild(view);
            actions.appendChild(open);

            row.appendChild(left);
            row.appendChild(actions);
            recentList.appendChild(row);
        }
    }

    renderRecent();

    // Auto-run when opened from a direct link (orderId + token present)
    if (oidInput.value && tokInput.value) {
        setTimeout(() => { try { run(); } catch { } }, 0);
    }

    recent.appendChild(recentTitle);
    recent.appendChild(recentList);

    card.appendChild(header);
    card.appendChild(form);
    card.appendChild(out);
    card.appendChild(recent);

    overlay.appendChild(card);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

document.addEventListener("DOMContentLoaded", async () => {
    await preloadSettingsData();
});

const ANALYTICS_SESSION_KEY = 'snaglet_analytics_session';
function findCatalogProductByLink(productLink) {
    const link = String(productLink || "").trim();
    if (!link) return null;

    if (Array.isArray(products)) {
        const hit = products.find(p => String(p?.productLink || "").trim() === link);
        if (hit) return hit;
    }

    if (productsDatabase && typeof productsDatabase === "object") {
        for (const arr of Object.values(productsDatabase)) {
            if (!Array.isArray(arr)) continue;
            const hit = arr.find(p => String(p?.productLink || "").trim() === link);
            if (hit) return hit;
        }
    }

    return null;
}

function findCatalogProductByName(name) {
    const n = String(name || "").trim();
    if (!n) return null;

    if (Array.isArray(products)) {
        const hit = products.find(p => String(p?.name || "").trim() === n);
        if (hit) return hit;
    }

    if (productsDatabase && typeof productsDatabase === "object") {
        for (const arr of Object.values(productsDatabase)) {
            if (!Array.isArray(arr)) continue;
            const hit = arr.find(p => String(p?.name || "").trim() === n);
            if (hit) return hit;
        }
    }

    return null;
}

function buildFullCartFromBasket() {
    const basket = readBasket();
    const fullCart = [];

    for (const item of basket) {
        const quantity = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);

        // Prefer server-provided catalog truth
        const cat =
            findCatalogProductByLink(item?.productLink) ||
            findCatalogProductByName(item?.name);

        const unitEUR = Number(cat?.price ?? item?.price ?? 0) || 0;
        const expectedPurchase = Number(cat?.expectedPurchasePrice ?? item?.expectedPurchasePrice ?? 0) || 0;

        fullCart.push({
            name: String(cat?.name ?? item?.name ?? "").trim(),
            selectedOption: String(item?.selectedOption ?? "").trim(),
            quantity,
            // keep both fields (your server accepts either)
            price: unitEUR,
            unitPriceEUR: unitEUR,
            expectedPurchasePrice: expectedPurchase,
            expectedPurchase: expectedPurchase,
            productLink: String(cat?.productLink ?? item?.productLink ?? "").trim(),
            image: String(cat?.image ?? item?.image ?? "").trim(),
            description: String(cat?.description ?? item?.description ?? "")
        });
    }

    return fullCart;
}

// Simple anonymous session id stored in localStorage
let analyticsSessionId = localStorage.getItem(ANALYTICS_SESSION_KEY);
if (!analyticsSessionId) {
    analyticsSessionId =
        Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(ANALYTICS_SESSION_KEY, analyticsSessionId);
}

/**
 * Fire a lightweight analytics event to the server.
 * This should never block the UI or throw.
 */
function sendAnalyticsEvent(type, payload = {}, options = {}) {
    try {
        fetch(`${API_BASE}/analytics/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                sessionId: analyticsSessionId,
                path: window.location.pathname + window.location.search,
                websiteOrigin: window.location.hostname,
                ...payload
            }),
            // For unload events you could set keepalive: true
            keepalive: !!options.keepalive
        }).catch(() => {
            // ignore network errors for analytics
        });
    } catch (e) {
        // swallow; analytics must never break the page
    }
}

function buildAnalyticsProductPayload(productName, override = {}) {
    const p = findProductByNameParam(productName) || {};
    const name = override.name || p.name || String(productName || "");
    const productId = override.productId || p.productId || null;
    const productLink = override.productLink || p.productLink || p.canonicalLink || null;
    const priceEUR =
        override.priceEUR != null ? override.priceEUR :
            (p.price != null ? Number(p.price) : null);

    return {
        product: {
            name,
            productId,
            category: (typeof currentCategory !== "undefined" ? currentCategory : null),
            productLink,
            priceEUR
        }
    };
}

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
    switch (state.action) {
        case 'loadProducts':
            const [category, sort, order] = state.data || [];
            currentCategory = category; // ✅ Make sure it's globally set
            loadProducts(category, sort, order);
            CategoryButtons(); // Now this works properly
            break;

        case 'GoToProductPage':
            GoToProductPage(...(state.data || []));
            break;
        case 'GoToCart':
            GoToCart();
            break;
        case 'GoToSettings':
            GoToSettings();
            break;
        case 'searchQuery':
            searchQuery(...(state.data || []));
            break;
        default:
            console.warn('⚠️ Unknown state action:', state.action);
    }
}

window.addEventListener('popstate', (event) => {
    const modal = document.getElementById("paymentModal");
    if (modal && typeof closeModal === "function") {
        closeModal();
        return;
    }

    const index = event.state?.index;
    if (typeof index === 'number' && userHistoryStack[index]) {
        isReplaying = true;
        handleStateChange(userHistoryStack[index]);
        currentIndex = index;

        isReplaying = false;
    } else {
        console.warn("⚠️ Invalid popstate index:", event.state);
    }
});
function initializeHistory() {
    // Deep link: /?product=...
    const params = new URLSearchParams(window.location.search);
    const productParam = params.get("product");

    if (productParam) {
        const prod = findProductByNameParam(productParam);

        if (prod) {
            const desc =
                prod.description ||
                TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER ||
                "No description available.";

            const state = {
                action: "GoToProductPage",
                data: [prod.name, prod.price, desc]
            };

            userHistoryStack = [state];
            currentIndex = 0;

            // Keep the URL as product link and render the product page
            history.replaceState({ index: 0 }, "", buildUrlForState(state));
            handleStateChange(state);
            return;
        }

        // Invalid product link: clean it so refresh doesn't keep retrying
        history.replaceState({ index: 0 }, "", "/");
    }

    // Normal boot path
    if (currentIndex >= 0 && userHistoryStack[currentIndex]) {
        handleStateChange(userHistoryStack[currentIndex]);
    } else {
        navigate("loadProducts", ["Default_Page", "NameFirst", "asc"]);
    }
}

// Replace old trackUserEvent calls with navigate()
function trackedGoToSettings() {
    navigate('GoToSettings');
}

function trackedGoToCart() {
    navigate('GoToCart');
}

function trackSearch(query) {
    const lastEvent = userHistoryStack[userHistoryStack.length - 1];
    if (!lastEvent || lastEvent.action !== 'searchQuery' || lastEvent.data[0] !== query) {
        navigate('searchQuery', [query]);
    }
}
/* =========================
   APP BOOT LOADER (Products)
   ========================= */
const APP_LOADER_STYLE_ID = "appBootLoaderStyles";
const APP_LOADER_ID = "appBootLoaderOverlay";

let __appBootPrevBodyOverflow = null;
let __appBootPrevTitle = null;

function ensureAppLoaderStyles() {
    if (document.getElementById(APP_LOADER_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = APP_LOADER_STYLE_ID;
    style.textContent = `
         @keyframes appLoaderSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   
         #${APP_LOADER_ID}{
           position:fixed; inset:0; z-index:90000;
           display:flex; align-items:center; justify-content:center;
           padding:16px;
           background:rgba(0,0,0,.45);
           backdrop-filter: blur(8px);
           -webkit-backdrop-filter: blur(8px);
         }
         #${APP_LOADER_ID} .card{
           width:min(520px, calc(100vw - 32px));
           border-radius:16px;
           border:1px solid rgba(255,255,255,0.12);
           background:rgba(20,20,20,0.9);
           box-shadow:0 20px 60px rgba(0,0,0,.65);
           padding:16px;
           font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
           color:#fff;
         }
         #${APP_LOADER_ID} .row{
           display:flex; align-items:center; gap:12px;
         }
         #${APP_LOADER_ID} .spinner{
           width:22px; height:22px; border-radius:999px;
           border:3px solid rgba(255,255,255,0.22);
           border-top-color: rgba(255,255,255,0.95);
           animation: appLoaderSpin 900ms linear infinite;
           flex:0 0 auto;
         }
         #${APP_LOADER_ID} .title{
           font-weight:700; font-size:15px; line-height:1.2;
         }
         #${APP_LOADER_ID} .sub{
           margin-top:6px;
           font-size:13px;
           opacity:.85;
           line-height:1.35;
         }
       `;
    document.head.appendChild(style);

}

function showAppLoader(text = "Loading…") {
    try { ensureAppLoaderStyles(); } catch { }

    let overlay = document.getElementById(APP_LOADER_ID);
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = APP_LOADER_ID;
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML = `
             <div class="card">
               <div class="row">
                 <div class="spinner" aria-hidden="true"></div>
                 <div class="title">Loading SnagletShop</div>
               </div>
               <div class="sub" id="${APP_LOADER_ID}_text"></div>
             </div>
           `;
        (document.body || document.documentElement).appendChild(overlay);
    }

    const textEl = document.getElementById(`${APP_LOADER_ID}_text`);
    if (textEl) textEl.textContent = String(text || "Loading…");

    // small UX touches
    document.documentElement.style.cursor = "progress";
    document.documentElement.setAttribute("aria-busy", "true");

    try {
        if (__appBootPrevTitle === null) __appBootPrevTitle = document.title;
        if (!/Loading/i.test(document.title)) document.title = `Loading…`;
    } catch { }

    try {
        if (document.body) {
            if (__appBootPrevBodyOverflow === null) __appBootPrevBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        }
    } catch { }
}

function hideAppLoader() {
    const overlay = document.getElementById(APP_LOADER_ID);
    if (overlay) overlay.remove();

    document.documentElement.style.cursor = "";
    document.documentElement.removeAttribute("aria-busy");

    try {
        if (document.body && __appBootPrevBodyOverflow !== null) {
            document.body.style.overflow = __appBootPrevBodyOverflow;
        }
    } catch { }
    __appBootPrevBodyOverflow = null;

    try {
        if (__appBootPrevTitle !== null) document.title = __appBootPrevTitle;
    } catch { }
    __appBootPrevTitle = null;
}

// Boot after DOM is ready and products are available.
// This prevents the early history/render call from throwing and aborting the rest of the script.
let __bootAppStarted = false;

async function bootApp() {
    if (__bootAppStarted) return;
    __bootAppStarted = true;

    showAppLoader("Loading products…");

    try {
        // Ensure catalog is ready before the first render
        try { await initProducts(); } catch { }
        showAppLoader("Preparing store…");

        // Ensure global `products` exists for legacy code paths
        if (!window.products || typeof window.products !== "object") {
            window.products = productsDatabase || {};
        }

        // Hydrate basket early
        try {
            basket = JSON.parse(localStorage.getItem("basket")) || {};
        } catch {
            basket = {};
            try { localStorage.setItem("basket", JSON.stringify(basket)); } catch { }
        }

        // Defaults used throughout the UI
        if (typeof window.currentCategory === "undefined") window.currentCategory = "Default_Page";
        if (typeof window.currentSortOrder === "undefined") window.currentSortOrder = "asc";

        // Initial render (history-aware)
        try {
            initializeHistory();
        } catch (e) {
            console.warn("⚠️ initializeHistory failed on boot, falling back to Default_Page:", e);
            loadProducts("Default_Page", localStorage.getItem("defaultSort") || "NameFirst", "asc");
            CategoryButtons();
        }

        // Let the render paint, then remove overlay
        requestAnimationFrame(() => setTimeout(hideAppLoader, 0));
    } catch (e) {
        console.warn("⚠️ bootApp error:", e);
        hideAppLoader(); // never get stuck behind the loader
    }
}


if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void bootApp());
} else {
    void bootApp();
}





// Unified Search Handling for Both Desktop and Mobile

const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};
async function fetchTariffsFromServer() {
    const res = await fetch(`${API_BASE}/tariffs`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch tariffs (${res.status})`);
    const data = await res.json().catch(() => null);

    // Accept either { ... } or { tariffs: { ... } }
    const obj =
        (data && typeof data === "object" && !Array.isArray(data))
            ? (data.tariffs && typeof data.tariffs === "object" ? data.tariffs : data)
            : null;

    if (!obj) throw new Error("Invalid tariffs payload.");
    return obj;
}

async function fetchCountriesFromServer() {
    const res = await fetch(`${API_BASE}/countries`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch countries (${res.status})`);
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error("Invalid countries payload.");

    // Normalize expected shape: [{ code, tariff }]
    return data
        .filter(x => x && typeof x === "object" && x.code)
        .map(x => ({
            code: String(x.code).toUpperCase(),
            tariff: Number(x.tariff || 0) || 0
        }));
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
        await preloadSettingsData();

        if (window.preloadedData.tariffs && Object.keys(window.preloadedData.tariffs).length) {
            tariffMultipliers = { ...window.preloadedData.tariffs };
            return tariffMultipliers;
        }

        // Last resort direct fetch
        const tariffsObj = await fetchTariffsFromServer();
        tariffMultipliers = { ...tariffsObj };
        window.preloadedData.tariffs = tariffMultipliers;
        window.preloadedData.countries = tariffsObjectToCountriesArray(tariffMultipliers);
        return tariffMultipliers;
    } catch (e) {
        console.warn("⚠️ fetchTariffs failed; keeping existing tariffMultipliers:", e);
        tariffMultipliers = (tariffMultipliers && typeof tariffMultipliers === "object") ? tariffMultipliers : {};
        return tariffMultipliers;
    }
}



function setupSearchInputs() {
    searchInput = document.getElementById("Search_Bar");
    mobileSearchInput = document.getElementById("Mobile_Search_Bar");

    if (!searchInput || !mobileSearchInput) {
        console.warn("⚠️ Search inputs not found; skipping search binding.");
        return;
    }

    const handleSearch = (query) => {
        const trimmed = (query || "").trim();
        searchInput.value = trimmed;
        mobileSearchInput.value = trimmed;

        if (trimmed.length > 0) {
            trackSearch(trimmed);
            searchProducts(trimmed);
        } else {
            loadProducts(lastCategory || "Default_Page");
        }
    };

    const debouncedDesktop = debounce(() => {
        handleSearch(searchInput.value);
    }, 300);

    const debouncedMobile = debounce(() => {
        handleSearch(mobileSearchInput.value);
    }, 300);

    searchInput.addEventListener("input", debouncedDesktop);
    mobileSearchInput.addEventListener("input", debouncedMobile);

    const stopSubmit = (e) => {
        if (e.key === "Enter") e.preventDefault();
    };

    searchInput.addEventListener("keydown", stopSubmit);
    mobileSearchInput.addEventListener("keydown", stopSubmit);
}

document.addEventListener("DOMContentLoaded", setupSearchInputs);







const functionRegistry = {
    loadProducts,
    GoToProductPage,
    GoToCart,
    GoToSettings,
    searchQuery
    // add more functions here as needed
};

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

const RECENT_ORDERS_KEY = "recentOrders_v1";

function _safeJsonParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
}

function getRecentOrders() {
    const raw = localStorage.getItem(RECENT_ORDERS_KEY);
    const arr = Array.isArray(_safeJsonParse(raw)) ? _safeJsonParse(raw) : [];
    return (arr || [])
        .filter(o => o && typeof o === "object" && o.orderId && o.token)
        .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
        .slice(0, 25);
}

function addRecentOrder({ orderId, token, orderStatusUrl = null, paymentIntentId = null } = {}) {
    if (!orderId || !token) return;
    const now = Date.now();

    const entry = {
        ts: now,
        orderId: String(orderId),
        token: String(token),
        orderStatusUrl: orderStatusUrl ? String(orderStatusUrl) : null,
        paymentIntentId: paymentIntentId ? String(paymentIntentId) : null
    };

    const current = getRecentOrders();
    // de-dup by orderId
    const next = [entry, ...current.filter(o => String(o.orderId) !== String(orderId))].slice(0, 25);

    try { localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(next)); } catch { }
}

async function fetchOrderStatus({ orderId, token } = {}) {
    const oid = String(orderId || "").trim();
    const t = String(token || "").trim();
    if (!oid || !t) throw new Error("Missing orderId or token.");

    const url = `${API_BASE}/order-status/${encodeURIComponent(oid)}?token=${encodeURIComponent(t)}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        // Turnstile specific guidance
        if (data && (data.error === "TURNSTILE_FAILED" || data.error === "TURNSTILE_REQUIRED" || String(data.message || "").toUpperCase().includes("TURNSTILE"))) {
            const configured = Boolean(__snagletGetTurnstileSiteKey());
            const hint = configured
                ? "Turnstile verification failed. Please refresh the page and try again."
                : "Bot protection (Turnstile) is not configured on this site. Set <meta name=\"turnstile-sitekey\" content=\"YOUR_SITE_KEY\"> in index.html (and ensure the backend TURNSTILE_SECRET_KEY matches).";
            alert(hint);
        }

        const msg = data?.error || data?.message || `Order status failed (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.details = data;
        throw err;
    }
    return data;
}

function _formatDateMaybe(v) {
    try {
        if (!v) return "";
        const d = (typeof v === "string" || typeof v === "number") ? new Date(v) : new Date(String(v));
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleString();
    } catch {
        return String(v || "");
    }
}

/**
 * Stores enough info to recover after a Stripe redirect (3DS) or refresh.
 */
function setPaymentPendingFlag({ paymentIntentId = null, orderId = null, clientSecret = null } = {}) {
    if (!paymentIntentId && !clientSecret) return;
    try {
        localStorage.setItem(
            PAYMENT_PENDING_KEY,
            JSON.stringify({
                ts: Date.now(),
                paymentIntentId: paymentIntentId ? String(paymentIntentId) : null,
                orderId: orderId ? String(orderId) : null,
                clientSecret: clientSecret ? String(clientSecret) : null
            })
        );
    } catch { }
}

function getPaymentPendingFlag() {
    try {
        const raw = localStorage.getItem(PAYMENT_PENDING_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);

        // Backwards-compatible: tolerate older shapes
        const paymentIntentId = obj?.paymentIntentId ? String(obj.paymentIntentId) : null;
        const clientSecret = obj?.clientSecret ? String(obj.clientSecret) : null;
        const orderId = obj?.orderId ? String(obj.orderId) : null;
        const ts = Number(obj?.ts || 0) || 0;

        if (!paymentIntentId && !clientSecret) return null;

        return { ts, paymentIntentId, clientSecret, orderId };
    } catch {
        return null;
    }
}

function clearPaymentPendingFlag() {
    try { localStorage.removeItem(PAYMENT_PENDING_KEY); } catch { }
}

async function pollPendingPaymentUntilFinal({ paymentIntentId, clientSecret, timeoutMs = 120000, intervalMs = 2500 } = {}) {
    if (!paymentIntentId) return { status: "unknown" };

    const cs =
        (clientSecret ? String(clientSecret) : null) ||
        (getPaymentPendingFlag()?.clientSecret ? String(getPaymentPendingFlag().clientSecret) : null) ||
        (window.latestClientSecret ? String(window.latestClientSecret) : null);

    const baseUrl = `${API_BASE}/payment-intent-status/${encodeURIComponent(paymentIntentId)}`;
    const url = cs ? `${baseUrl}?clientSecret=${encodeURIComponent(cs)}` : baseUrl;

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const res = await fetch(url, { cache: "no-store" });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // If clientSecret is missing, backend returns 400; stop early to avoid spamming.
                if (res.status === 400 && !cs) return { status: "missing_client_secret" };
                // Otherwise keep polling a bit (transient errors)
            } else {
                const status = String(data?.status || "");

                if (status === "succeeded") return { status };
                if (status === "requires_payment_method" || status === "canceled") return { status };
            }

            // still pending: processing / requires_capture / requires_action / etc.
        } catch { }

        await new Promise(r => setTimeout(r, intervalMs));
    }

    return { status: "timeout" };
}

async function checkAndHandlePendingPaymentOnLoad() {
    const pending = getPaymentPendingFlag();
    if (!pending?.paymentIntentId) return;

    const { status } = await pollPendingPaymentUntilFinal({ paymentIntentId: pending.paymentIntentId, clientSecret: pending.clientSecret });

    if (status === "succeeded") {
        clearPaymentPendingFlag();
        clearBasketCompletely();
        try { clearCheckoutDraft(); } catch { }
        setPaymentSuccessFlag({ reloadOnOk: true });
        window.location.replace(window.location.origin);
        return;
    }

    if (status === "requires_payment_method" || status === "canceled") {
        clearPaymentPendingFlag();
        alert("Payment did not complete. Your cart is still saved—please try again.");
        return;
    }

    // timeout/unknown: keep pending flag + keep basket
    alert("Payment is still processing. Your cart is unchanged. Check again in a moment.");
}
function getStripePublishableKeySafe() {
    // Preferred sources (in order):
    //  1) window.STRIPE_PUBLISHABLE_KEY / window.STRIPE_PUBLISHABLE (runtime injection)
    //  2) <meta name="stripe-publishable-key" content="pk_live_...">
    const fromMeta = document.querySelector('meta[name="stripe-publishable-key"]')?.content?.trim() || "";
    const pk = (window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE || fromMeta || "").trim();

    if (!pk || pk === "__STRIPE_PUBLISHABLE_KEY__") {
        throw new Error("Stripe publishable key is not configured. Set <meta name=\"stripe-publishable-key\" content=\"pk_live_...\"/> or define window.STRIPE_PUBLISHABLE_KEY before script.js.");
    }

    // Prevent accidental production deploy with a test key.
    const host = String(location.hostname || "").toLowerCase();
    const isLocal = (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local"));
    if (!isLocal && pk.startsWith("pk_test_")) {
        throw new Error("Refusing to run checkout with a Stripe TEST publishable key on a non-localhost domain. Use a pk_live_... key.");
    }
    return pk;
}
function ensureStripeInstance() {
    if (!window.stripeInstance) {
        if (typeof Stripe !== "function") throw new Error("Stripe.js not loaded");
        window.stripeInstance = Stripe(getStripePublishableKeySafe());
    }
    return window.stripeInstance;
}

function stripStripeReturnParamsFromUrl(urlObj) {
    // Stripe appends these on return_url
    urlObj.searchParams.delete("redirect_status");
    urlObj.searchParams.delete("payment_intent");
    urlObj.searchParams.delete("payment_intent_client_secret");

    // your own marker (optional)
    urlObj.searchParams.delete("stripe_return");

    // legacy flag you used earlier
    urlObj.searchParams.delete("payment_success");
}
document.addEventListener("DOMContentLoaded", () => {
    try { installApiHealthIndicator(); } catch { }
    try { installOrderTrackingButton(); } catch { }

    // Support direct customer links produced by backend: /order-status/:orderId?token=...
    try {
        const sp = new URLSearchParams(window.location.search || "");
        const path = String(window.location.pathname || "");

        let orderIdFromPath = "";
        if (path.startsWith("/order-status/")) {
            orderIdFromPath = decodeURIComponent(path.slice("/order-status/".length).split("/")[0] || "");
        }

        const orderId = orderIdFromPath || (sp.get("orderId") || "");
        const token = sp.get("token") || "";

        if (orderId && token && (orderIdFromPath || sp.has("orderId"))) {
            openOrderStatusModal({ orderId, token });
        }
    } catch { }


    // 1) Handle Stripe redirect returns (3DS) safely
    handleStripeRedirectReturnOnLoad()
        .catch(e => console.warn("handleStripeRedirectReturnOnLoad failed:", e))
        .finally(() => {
            // 2) Show success overlay if flagged
            checkAndShowPaymentSuccess();

            // 3) If something is pending, poll Stripe via server until final
            checkAndHandlePendingPaymentOnLoad();
        });
});

/**
 * Handles Stripe "return_url" redirects (3DS) reliably.
 * - If succeeded: clears basket + sets success flag
 * - If still processing: stores pending + lets polling finish on load
 * - If failed/canceled: keeps basket
 */
async function handleStripeRedirectReturnOnLoad() {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const piIdFromUrl = params.get("payment_intent");
    const csFromUrl = params.get("payment_intent_client_secret");
    const hasStripeReturnSignals =
        !!csFromUrl || !!piIdFromUrl || params.has("redirect_status") || params.has("stripe_return");

    if (!hasStripeReturnSignals) return false;

    // If we have PI id / client secret, persist pending so refreshes are safe
    if (piIdFromUrl || csFromUrl) {
        setPaymentPendingFlag({
            paymentIntentId: piIdFromUrl || null,
            orderId: window.latestOrderId || null,
            clientSecret: csFromUrl || null
        });
    }

    let finalStatus = null;
    let finalPiId = piIdFromUrl || null;

    // Try client-side retrieve first (best signal right after redirect)
    if (csFromUrl) {
        try {
            const stripe = ensureStripeInstance();
            const { paymentIntent, error } = await stripe.retrievePaymentIntent(csFromUrl);
            if (error) throw error;

            if (paymentIntent?.id) finalPiId = paymentIntent.id;
            if (paymentIntent?.status) finalStatus = paymentIntent.status;

            if (finalPiId) {
                setPaymentPendingFlag({
                    paymentIntentId: finalPiId,
                    orderId: window.latestOrderId || null,
                    clientSecret: csFromUrl
                });
            }
        } catch (e) {
            console.warn("Stripe retrievePaymentIntent failed; will fall back to server polling.", e);
        }
    }

    // If we already know the result, apply it now
    if (finalStatus === "succeeded") {
        clearPaymentPendingFlag();
        clearBasketCompletely();
        try { clearCheckoutDraft(); } catch { }
        setPaymentSuccessFlag({ reloadOnOk: true });
    } else if (finalStatus === "requires_payment_method" || finalStatus === "canceled") {
        clearPaymentPendingFlag();
        alert("Payment did not complete. Your cart is still saved—please try again.");
    } else {
        // unknown/processing: keep pending; checkAndHandlePendingPaymentOnLoad() will poll
        if (finalPiId) {
            setPaymentPendingFlag({
                paymentIntentId: finalPiId,
                orderId: window.latestOrderId || null,
                clientSecret: csFromUrl || null
            });
        }
    }

    // Always clean URL so reloads don't re-trigger
    stripStripeReturnParamsFromUrl(url);
    const q = url.searchParams.toString();
    const cleaned = url.pathname + (q ? `?${q}` : "");
    try { window.history.replaceState({}, "", cleaned); } catch { }

    return true;
}

async function fetchExchangeRatesFromServer() {
    // Prefer the backend proxy endpoint (so the frontend exercises /api/proxy-rates),
    // but fall back to the direct /rates endpoint if needed.
    let res = null;

    try {
        res = await fetch(`${API_BASE}/api/proxy-rates`, { cache: "no-store" });
        if (!res.ok) res = null;
    } catch {
        res = null;
    }

    if (!res) {
        res = await fetch(`${API_BASE}/rates`, { cache: "no-store" });
    }

    if (!res.ok) throw new Error(`Failed to fetch exchange rates (${res.status})`);
    const data = await res.json().catch(() => null);
    if (!data || !data.rates) throw new Error("Invalid exchange rates payload.");
    return data;
}




document.addEventListener("DOMContentLoaded", () => {





    const navEntry = performance.getEntriesByType("navigation")[0];
    const isPageRefresh = navEntry?.type === "reload";

    const params = new URLSearchParams(window.location.search);
    if (isPageRefresh && !params.has("product")) {
        console.log("🔄 Page refresh detected, clearing session history...");



        history.replaceState({ page: "loadProducts", index: 0 }, "", window.location.pathname);
    }
});





// === KEYBOARD SHORTCUTS (Alt + Arrow) ===
document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;

});













function searchQuery(query) {
    const input = document.getElementById("Search_Bar");
    const mobileInput = document.getElementById("Mobile_Search_Bar");

    if (input) input.value = query;
    if (mobileInput) mobileInput.value = query;

    console.debug(`🔍 Replaying search for: ${query}`);
    searchProducts(query); // ✅ This triggers the actual search display
}




function searchProducts() {
    const queryDesktop = document.getElementById("Search_Bar")?.value || "";
    const queryMobile = document.getElementById("Mobile_Search_Bar")?.value || "";

    const activeElement = document.activeElement;
    let rawQuery = "";

    if (activeElement?.id === "Mobile_Search_Bar") {
        rawQuery = queryMobile;
    } else {
        rawQuery = queryDesktop;
    }

    const query = rawQuery.toLowerCase().replace(/\s+/g, "").trim();
    if (!query) return;

    // Sync both fields
    document.getElementById("Search_Bar").value = rawQuery;
    document.getElementById("Mobile_Search_Bar").value = rawQuery;

    const viewer = document.getElementById("Viewer");
    viewer.innerHTML = "";

    let results = [];

    Object.keys(products).forEach(category => {
        results.push(
            ...products[category].filter(product => {
                if (!product.name) return false; // ⛔ Skip icon-only objects
                const normalizedName = product.name.toLowerCase().replace(/\s+/g, "");
                const normalizedDescription = (product.description || "").toLowerCase().replace(/\s+/g, "");
                return normalizedName.includes(query) || normalizedDescription.includes(query);
            })

        );
    });

    const uniqueResults = [];
    const seenNames = new Set();

    results.forEach(product => {
        if (!seenNames.has(product.name)) {
            seenNames.add(product.name);
            uniqueResults.push(product);
        }
    });

    if (uniqueResults.length > 0) {
        uniqueResults.forEach(product => {
            const productDiv = document.createElement("div");
            productDiv.classList.add("product");

            const card = document.createElement("div");
            card.className = "product-card";

            // Clickable product name as a link, no underline
            const nameLink = document.createElement("a");
            nameLink.className = "product-name";

            nameLink.textContent = product.name;
            nameLink.style.textDecoration = "none";
            nameLink.addEventListener("click", (e) => {
                e.preventDefault();
                navigate("GoToProductPage", [
                    product.name,
                    product.price,
                    product.description || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER
                ]);
            });


            nameLink.href = `https://www.snagletshop.com/?product=${encodeURIComponent(product.name)}`;
            nameLink.target = "_blank"; // Open in new tab
            const img = document.createElement("img");
            img.className = "Clickable_Image";
            img.src = product.image;
            img.alt = product.name;
            img.dataset.name = product.name;
            img.dataset.price = product.price;
            img.dataset.imageurl = product.image;
            img.dataset.description = product.description || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER;


            img.href = `https://www.snagletshop.com/?product=${encodeURIComponent(product.name)}`;
            img.target = "_blank"; // Open in new tab
            img.addEventListener("click", () => {
                navigate("GoToProductPage", [
                    product.name,
                    product.price,
                    product.description || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER
                ]);
            });

            const priceP = document.createElement("p");
            priceP.className = "product-price";
            priceP.textContent = `${product.price}€`;

            const quantityContainer = document.createElement("div");
            quantityContainer.className = "quantity-container";

            const quantityControls = document.createElement("div");
            quantityControls.className = "quantity-controls";

            const decBtn = document.createElement("button");
            decBtn.className = "Button";
            decBtn.textContent = TEXTS.BASKET.BUTTONS.DECREASE;
            decBtn.addEventListener("click", () => decreaseQuantity(product.name));

            const quantitySpan = document.createElement("span");
            quantitySpan.className = "WhiteText";
            quantitySpan.id = `quantity-${product.name}`;
            quantitySpan.textContent = "1";

            const incBtn = document.createElement("button");
            incBtn.className = "Button";
            incBtn.textContent = TEXTS.BASKET.BUTTONS.INCREASE;
            incBtn.addEventListener("click", () => increaseQuantity(product.name));

            const addToCartBtn = document.createElement("button");
            addToCartBtn.className = "add-to-cart";

            addToCartBtn.innerHTML = `
              <span style="display: flex; align-items: center; gap: 6px;">
                ${TEXTS.PRODUCT_SECTION.ADD_TO_CART}
                <svg class="cart-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            `;

            addToCartBtn.addEventListener("click", () => {
                addToCart(
                    product.name,
                    product.price,
                    product.image,
                    product.expectedPurchasePrice,
                    product.productLink,
                    product.description,
                    (product.productOptions && product.productOptions[1]) || ""
                );
            });


            quantityControls.append(decBtn, quantitySpan, incBtn);
            quantityContainer.append(quantityControls, addToCartBtn);

            card.append(nameLink, img, priceP, quantityContainer);
            productDiv.appendChild(card);
            viewer.appendChild(productDiv);
        });
    } else {
        viewer.innerHTML = "<p>No products found.</p>";
    }
}




function handleCurrencyChange(newCurrency) {
    selectedCurrency = newCurrency;
    localStorage.setItem("selectedCurrency", selectedCurrency);
    syncCurrencySelects(selectedCurrency);
    updateAllPrices();
}




document.getElementById("currency-select")?.addEventListener("change", (e) => {
    handleCurrencyChange(e.target.value);
});

document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "currencySelect") {
        handleCurrencyChange(e.target.value);
    }
});
document.addEventListener("click", function (event) {
    const button = event.target.closest(".Category_Button");
    if (!button) return;

    const functionCall = button.getAttribute("onclick");
    if (!functionCall) return;

    const match = functionCall.match(/(\w+)\(([^)]*)\)/);
    if (!match) return;

    const functionName = match[1];
    const args = match[2]
        .split(",")
        .map(arg => arg.trim().replace(/^['"]|['"]$/g, ""));

    console.debug(`🛍️ Category button clicked - ${functionName}`, args);

    invokeFunctionByName(functionName, args);
});











try {
    basket = JSON.parse(localStorage.getItem("basket")) || {};
} catch (e) {
    console.error("❌ Failed to parse basket from localStorage. Resetting basket.");
    basket = {};
    localStorage.setItem("basket", JSON.stringify(basket));
}

// Detect user's currency via IP API (if no saved preference)
function detectUserCurrency() {
    // Detect user's currency via IP API (best-effort). Never throw.
    return fetch("https://ipapi.co/json/")
        .then(response => response.json())
        .then(data => {
            const userCountry = String(data?.country_code || "").toUpperCase();
            if (!userCountry) return;

            selectedCurrency = countryToCurrency[userCountry] || (localStorage.getItem("selectedCurrency") || "EUR");
            localStorage.setItem("selectedCurrency", selectedCurrency);
            localStorage.setItem("detectedCountry", userCountry);

            const currencySelect = document.getElementById("currency-select");
            if (currencySelect) currencySelect.value = selectedCurrency;

            console.log("🌍 Country detected:", userCountry);
            console.log("💱 Currency set to:", selectedCurrency);
            console.log("📦 Tariff applied:", localStorage.getItem("applyTariff"));

            updateAllPrices();
        })
        .catch((err) => {
            console.warn("Currency detect blocked/failed; keeping saved currency.", err);
            // Keep existing selectedCurrency (saved/manual)
        });
}

function convertPrice(priceInEur) {
    let converted = priceInEur * exchangeRates[selectedCurrency];

    const selectedCountry = localStorage.getItem("detectedCountry") || "US";
    const tariff = tariffMultipliers[selectedCountry] || 0;

    const applyTariff = getApplyTariffFlag();
    if (applyTariff) {
        converted *= (1 + tariff);
    }

    return converted.toFixed(2);
}


// Function to update all prices
function updateAllPrices() {
    document.querySelectorAll(".price, .product-price, .basket-item-price, #product-page-price").forEach(element => {
        let basePrice = parseFloat(element.dataset.eur);
        if (!isNaN(basePrice)) {
            let convertedValue = convertPrice(basePrice);

            let currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
            element.textContent = `${currencySymbol}${convertedValue}`;
        }
    });

    // Update total price in basket
    let totalElement = document.getElementById("basket-total");
    if (totalElement) {
        let baseTotal = parseFloat(totalElement.dataset.eur);
        if (!isNaN(baseTotal)) {
            totalElement.textContent = `Total: ${convertPrice(baseTotal)} ${selectedCurrency}`;
        }
    }
}

// Store original EUR value in dataset when page loads
function initializePrices() {
    document.querySelectorAll(".price, .product-price, .basket-item-price, #product-page-price, .productPrice").forEach(element => {
        let basePrice = parseFloat(element.textContent.replace(/[^0-9.]/g, ""));
        if (!isNaN(basePrice)) {
            element.dataset.eur = basePrice;
        }
    });

    let totalElement = document.getElementById("basket-total");
    if (totalElement) {
        let baseTotal = parseFloat(totalElement.textContent.replace(/[^0-9.]/g, ""));
        if (!isNaN(baseTotal)) {
            totalElement.dataset.eur = baseTotal;
        }
    }
}

function observeNewProducts() {
    let observer = new MutationObserver(() => {
        observer.disconnect(); // Stop observing temporarily

        document.querySelectorAll(".price, .product-price, .basket-item-price, #product-page-price").forEach(element => {
            if (!element.dataset.eur) {
                element.dataset.eur = element.textContent.replace(/[^0-9.]/g, "").trim();
            }
        });

        updateAllPrices();

        observer.observe(document.body, { childList: true, subtree: true }); // Resume observing
    });

    observer.observe(document.body, { childList: true, subtree: true });
}


document.getElementById("currencySelect")?.addEventListener("change", function (event) {
    selectedCurrency = event.target.value;
    localStorage.setItem("selectedCurrency", selectedCurrency);

    syncCurrencySelects(selectedCurrency);  // ✅ this ensures the TopBar updates too
    updateAllPrices();
});

document.getElementById("currencySelect")?.addEventListener("change", function (event) {
    selectedCurrency = event.target.value;
    localStorage.setItem("selectedCurrency", selectedCurrency);
    syncCurrencySelects(selectedCurrency);  // 🔁 this updates the other one
    updateAllPrices();
});


// Page load: Apply saved currency or detect it


document.addEventListener("DOMContentLoaded", async () => {
    const currencySelect = document.getElementById("currency-select");
    await fetchTariffs();
    if (!currencySelect) {
        console.warn("currency-select element not found. Skipping price initialization.");
        return;
    }
    currencySelect.value = selectedCurrency;
    detectUserCurrency();
    initializePrices();         // Store original EUR prices in DOM
    observeNewProducts();       // Handle dynamic product loading
    // Set preferred currency

    await fetchExchangeRatesFromServer();  // ✅ WAIT for rates to update
    updateAllPrices();                     // ✅ THEN convert prices properly
});

async function populateCountries() {
    console.log("📦 Running populateCountries()");

    const select = document.getElementById("countrySelect");
    if (!select) {
        console.warn("❌ countrySelect not found.");
        return;
    }

    // Ensure tariffs are loaded (preferred path: preload cache)
    await fetchTariffs();

    const countries = window.preloadedData?.countries?.length
        ? window.preloadedData.countries
        : tariffsObjectToCountriesArray(tariffMultipliers);

    console.log(`📦 Loaded ${countries.length} countries from tariffs`, countries);

    select.innerHTML = ""; // clear

    for (const c of countries) {
        const code = String(c.code || "").toUpperCase();
        if (!code) continue;
        const name = countryNames[code] || code;

        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = name;
        select.appendChild(opt);
    }

    const detected = localStorage.getItem("detectedCountry") || "US";
    const detectedEl = document.getElementById("detected-country");
    if (detectedEl) detectedEl.textContent = detected;
    select.value = detected;

    select.addEventListener("change", () => {
        const newCountry = select.value;
        localStorage.setItem("detectedCountry", newCountry);

        if (AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE && !localStorage.getItem("manualCurrencyOverride")) {
            const newCurrency = countryToCurrency[newCountry];
            if (newCurrency) {
                selectedCurrency = newCurrency;
                localStorage.setItem("selectedCurrency", selectedCurrency);
                syncCurrencySelects(selectedCurrency);
            }
        }

        updateAllPrices();
    });

    if (select.tomselect) select.tomselect.destroy();

    new TomSelect(select, {
        maxOptions: 1000,
        sortField: { field: "text", direction: "asc" },
        placeholder: "Select a country…",
        closeAfterSelect: true
    });

    console.log("✅ TomSelect initialized on countrySelect");
}







async function GoToSettings() {
    await preloadSettingsData();
    clearCategoryHighlight();

    const viewer = document.getElementById("Viewer");
    if (!viewer) {
        console.error("Viewer element not found.");
        return;
    }

    if (typeof removeSortContainer === "function") removeSortContainer();

    viewer.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.classList.add("settings-panel");
    wrapper.style.backgroundColor = "var(--SearchBar_Background_Colour)";
    wrapper.style.color = "var(--Default_Text_Colour)";

    // Theme Toggle
    const themeSection = document.createElement("div");
    themeSection.classList.add("settings-section");
    themeSection.innerHTML = `
      <h3>Theme</h3>
      <label for="themeToggle">${TEXTS.GENERAL.DARK_MODE_LABEL}</label>
      <label class="switch">
        <input type="checkbox" id="themeToggle">
        <span class="slider"></span>
      </label>
    `;

    // Currency Selector
    const currencySection = document.createElement("div");
    currencySection.classList.add("settings-section");
    currencySection.innerHTML = `
      <h3>Currency</h3>
      <label for="currencySelect">Preferred currency:</label>
      <select id="currencySelect" class="currencySelect tom-hidden" style="width: 100%"></select>
    `;

    // Country Selector
    const countrySection = document.createElement("div");
    countrySection.classList.add("settings-section");
    countrySection.innerHTML = `
      <h3>Shipping Country</h3>
      <label for="countrySelect">Detected: <span id="detected-country"></span></label>
      <select id="countrySelect" class="tom-hidden" style="width: 100%"></select>
    `;

    // Clear Data Button
    const clearSection = document.createElement("div");
    clearSection.classList.add("settings-section");
    clearSection.innerHTML = `
      <h3>Reset</h3>
      <button class="clearDataButton" id="clearDataButton">Clear all saved data (cart, preferences, etc.)</button>
    `;

    // Contact Form

// Contact Form
const contactSection = document.createElement("div");
contactSection.classList.add("settings-section");
contactSection.innerHTML = `
  <h3>${TEXTS.CONTACT_FORM.TITLE}</h3>
  <form id="contact-form" autocomplete="off">
    <label for="contact-email">${TEXTS.CONTACT_FORM.FIELDS.EMAIL}</label>
    <input type="email" id="contact-email" name="email" autocomplete="email" required>

    <label for="contact-message">${TEXTS.CONTACT_FORM.FIELDS.MESSAGE}</label>
    <textarea id="contact-message" name="message" class="MessageTextArea" required></textarea>

    <!-- honeypot (hidden from humans, should stay empty) -->
    <div aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;pointer-events:none;">
      <label for="contact-website">Website</label>
      <input
        type="text"
        id="contact-website"
        name="contact_website_do_not_fill"
        autocomplete="new-password"
        tabindex="-1"
        inputmode="none"
        value=""
        readonly
      >
    </div>

    <button type="submit">${TEXTS.CONTACT_FORM.SEND_BUTTON}</button>
  </form>

  <p class="contact-note">If the form doesn't work, email us at
    <a href="mailto:snagletshophelp@gmail.com">snagletshophelp@gmail.com</a>
  </p>
`;



    // Legal Notice
    const legalSection = document.createElement("div");
    legalSection.classList.add("settings-section");
    legalSection.innerHTML = `
      <h3>Legal Notice &amp; Store Policies</h3>
      <p><strong>Legal Notice:</strong><br>
      Unauthorized scraping, reproduction, or copying of this website, its design, content, or data is prohibited and may result in legal action and claims for damages.</p>
  
      <h4>Shipping Policy</h4>
      <p>
        We operate on a dropshipping model. Most items ship from global suppliers and logistics partners.
        Estimated delivery: <strong>2&nbsp;weeks to several weeks</strong>, depending on destination, carrier performance,
        customs processing, and product availability. Estimated dates are <strong>not guaranteed</strong>.<br><br>
        We are not responsible for delays caused by customs, carriers, labor actions, natural disasters, or other events outside our direct control.
      </p>
  
      <h4>Returns, Cancellations &amp; Refunds</h4>
      <p><strong>Before shipment:</strong> We may be able to cancel an order if it has not yet been processed; this is not guaranteed.</p>
      <p><strong>After shipment (general rule):</strong> We do not accept cancellations or “change-of-mind” returns once an order has been handed to a carrier, <strong>except</strong> where mandatory consumer law grants you a right to withdraw.</p>
      <p><strong>EU/EEA/UK consumers (cooling-off):</strong> For most physical goods, you have a statutory right to withdraw from a distance contract within <strong>14 days</strong> after delivery without giving a reason (exceptions apply). This paragraph prevails over any conflicting term in these policies.</p>
  
      <h4>Items Damaged, Defective, or Not-as-Described</h4>
      <p>
        If your item arrives damaged, defective, or significantly different from its description, contact us <strong>promptly</strong>
        with your order number and clear photos/videos so we can assist. Any request for early notice does not limit your
        <strong>non-waivable statutory rights</strong>.
      </p>
  
      <h4>Warranty / Legal Guarantee</h4>
      <p>
        Unless a manufacturer warranty is explicitly provided with the product, we do not offer a separate commercial warranty.
        <strong>This does not affect your statutory rights</strong>.
      </p>
  
      <h4>Customs, Duties &amp; Taxes</h4>
      <p>
        Prices may or may not include taxes and import fees depending on your destination and the shipping method:
        <ul>
          <li><strong>Taxes collected at checkout (e.g., VAT/IOSS, DDP):</strong> If stated at checkout, these are included in your final price.</li>
          <li><strong>Taxes due on delivery (DDU/DAP):</strong> If not shown as included, you are responsible for any applicable import duties/VAT/GST/fees.</li>
        </ul>
      </p>
  
      <h4>Delivery Issues &amp; Risk of Loss</h4>
      <p>
        Ensure your shipping address and contact details are accurate. We are not responsible for loss, delay, or misdelivery
        arising from incorrect or incomplete addresses provided by you.
      </p>
  
      <h4>Exclusions</h4>
      <ul>
        <li>We do not accept returns for buyer’s remorse where not required by law.</li>
        <li>We do not accept returns for incorrect size/color/variant chosen by the customer, unless required by law.</li>
        <li>Minor variations in color, packaging, or appearance that do not affect basic function are not considered defects.</li>
      </ul>
  
      <h4>Contact</h4>
      <p>
        To exercise your rights or request help with an order, contact us at the email address shown on the checkout or confirmation email.
      </p>
  
      <p><em>Nothing in these policies is intended to exclude or limit any non-waivable rights you may have under applicable consumer protection or e-commerce law.</em></p>
    `;

    wrapper.append(themeSection, currencySection, countrySection, clearSection, contactSection, legalSection);
    viewer.appendChild(wrapper);

    // Reset button
    document.getElementById("clearDataButton")?.addEventListener("click", () => {
        if (!confirm("Are you sure you want to reset all saved data?")) return;
        localStorage.clear();
        sessionStorage.clear();
        alert("All data cleared. Reloading page...");
        // location.reload();
    });

    // Theme toggle logic
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.checked = localStorage.getItem("themeMode") === "dark";
        themeToggle.addEventListener("change", (e) => {
            const darkMode = !!e.target.checked;
            document.documentElement.classList.toggle("dark-mode", darkMode);
            document.documentElement.classList.toggle("light-mode", !darkMode);
            localStorage.setItem("themeMode", darkMode ? "dark" : "light");
        });
    }

    // Populate selects
    const currencySelect = document.getElementById("currencySelect");
    const countrySelect = document.getElementById("countrySelect");
    const detectedCountry = (localStorage.getItem("detectedCountry") || "US").toUpperCase();
    const detectedSpan = document.getElementById("detected-country");
    if (detectedSpan) detectedSpan.textContent = detectedCountry;

    // Currency options
    if (currencySelect) {
        currencySelect.innerHTML = "";
        const codes = Object.keys(exchangeRates || {}).sort();
        for (const code of codes) {
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = `${currencySymbols?.[code] || ""} ${code}`.trim();
            currencySelect.appendChild(opt);
        }

        selectedCurrency = localStorage.getItem("selectedCurrency") || selectedCurrency || "EUR";
        currencySelect.value = selectedCurrency;
    }

    // Country options
    if (countrySelect) {
        countrySelect.innerHTML = "";
        (window.preloadedData?.countries || [])
            .slice()
            .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")))
            .forEach((c) => {
                const code = String(c.code || "").toUpperCase();
                if (!code) return;
                const opt = document.createElement("option");
                opt.value = code;
                opt.textContent = countryNames?.[code] || code;
                countrySelect.appendChild(opt);
            });

        countrySelect.value = detectedCountry;
    }

    // Destroy previous TomSelect instances (if any)
    if (currencySelect?.tomselect) currencySelect.tomselect.destroy();
    if (countrySelect?.tomselect) countrySelect.tomselect.destroy();

    // Attach logic via TomSelect onChange (more reliable than select change)
    if (currencySelect) {
        new TomSelect("#currencySelect", {
            maxOptions: 200,
            sortField: { field: "text", direction: "asc" },
            placeholder: "Select a currency…",
            closeAfterSelect: true,
            onChange: (val) => {
                if (!val) return;
                selectedCurrency = val;
                localStorage.setItem("selectedCurrency", selectedCurrency);
                localStorage.setItem("manualCurrencyOverride", "true");
                syncCurrencySelects(selectedCurrency);
                updateAllPrices();
            }
        });
        currencySelect.classList.remove("tom-hidden");
    }

    if (countrySelect) {
        new TomSelect("#countrySelect", {
            maxOptions: 1000,
            sortField: { field: "text", direction: "asc" },
            placeholder: "Select a country…",
            closeAfterSelect: true,
            onChange: (val) => {
                if (!val) return;
                const newCountry = String(val).toUpperCase();
                localStorage.setItem("detectedCountry", newCountry);
                if (detectedSpan) detectedSpan.textContent = newCountry;

                if (AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE && !localStorage.getItem("manualCurrencyOverride")) {
                    const newCurrency = countryToCurrency?.[newCountry];
                    if (newCurrency) {
                        selectedCurrency = newCurrency;
                        localStorage.setItem("selectedCurrency", selectedCurrency);
                        syncCurrencySelects(selectedCurrency);
                    }
                }
                updateAllPrices();
            }
        });
        countrySelect.classList.remove("tom-hidden");
    }

    // Contact form submission logic (matches backend rules: valid email + message length >= 5)
    const isValidEmailClient = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

    const cf = document.getElementById("contact-form");
    if (cf) {
        cf.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = document.getElementById("contact-email")?.value?.trim() || "";
            const message = document.getElementById("contact-message")?.value?.trim() || "";
const website = ""; // prevent autofill false-positives

const response = await fetch(`${API_BASE}/send-message`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, message, turnstileToken, website }),
});
            if (!isValidEmailClient(email)) {
                alert("Please enter a valid email address (e.g., name@example.com).");
                return;
            }
            if (message.length < 5) {
                alert("Please enter a message (at least 5 characters).");
                return;
            }

            let turnstileToken = "";
            try {
                turnstileToken =
                    (await snagletGetTurnstileToken({ forceFresh: true })) ||
                    document.querySelector('input[name="cf-turnstile-response"]')?.value ||
                    "";
            } catch {
                turnstileToken = document.querySelector('input[name="cf-turnstile-response"]')?.value || "";
            }

            try {
                const response = await fetch(`${API_BASE}/send-message`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, message, turnstileToken, website })
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    const msg = result?.message || result?.error || `Failed (${response.status}).`;
                    alert(msg);
                    return;
                }

                alert(result.message || "Message sent.");
                const msgEl = document.getElementById("contact-message");
                if (msgEl) msgEl.value = "";
            } catch (error) {
                console.error("Failed to send message:", error);
                alert("An error occurred. Try emailing us directly.");
            }
        });
    }

    // Keep selects in sync + update prices
    if (currencySelect) syncCurrencySelects(currencySelect.value || selectedCurrency || "EUR");
}

// helper function for countries


function handlesTariffsDropdown(countriesList = []) {
    try {
        // Always keep preloadedData coherent, even if Settings UI isn't open
        window.preloadedData = window.preloadedData || { exchangeRates: null, countries: null, tariffs: null };
        if (!Array.isArray(countriesList)) countriesList = [];
        window.preloadedData.countries = countriesList;

        // If the Settings page isn't rendered, stop here (preload must not crash)
        const select = document.getElementById("countrySelect");
        if (!select) return;

        // Populate options
        select.innerHTML = "";
        const sorted = countriesList
            .slice()
            .sort((a, b) => String(a?.code || "").localeCompare(String(b?.code || "")));

        for (const c of sorted) {
            const code = String(c?.code || "").toUpperCase();
            if (!code) continue;
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = (typeof countryNames !== "undefined" && countryNames?.[code]) ? countryNames[code] : code;
            select.appendChild(opt);
        }

        // Detected label + default value
        let detected = "US";
        try { detected = localStorage.getItem("detectedCountry") || "US"; } catch { }
        const detectedEl = document.getElementById("detected-country");
        if (detectedEl) detectedEl.textContent = detected;
        select.value = detected;

        // Attach the change handler once
        if (!select.dataset.listenerAttached) {
            select.addEventListener("change", () => {
                const newCountry = select.value;

                try { localStorage.setItem("detectedCountry", newCountry); } catch { }

                if (typeof AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE !== "undefined"
                    && AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE
                    && !localStorage.getItem("manualCurrencyOverride")) {
                    const newCurrency = (typeof countryToCurrency !== "undefined") ? countryToCurrency?.[newCountry] : null;
                    if (newCurrency) {
                        selectedCurrency = newCurrency;
                        try { localStorage.setItem("selectedCurrency", selectedCurrency); } catch { }
                        if (typeof syncCurrencySelects === "function") syncCurrencySelects(selectedCurrency);
                    }
                }

                if (typeof updateAllPrices === "function") updateAllPrices();
            });

            select.dataset.listenerAttached = "true";
        }
    } catch (e) {
        console.warn("⚠️ handlesTariffsDropdown failed:", e);
    }
}


function syncCurrencySelects(newCurrency) {
    const selects = document.querySelectorAll('#currency-select, #currencySelect');
    selects.forEach(select => {
        if (select && select.value !== newCurrency) {
            select.value = newCurrency;
        }
    });
}

document.getElementById("currency-select")?.addEventListener("change", (e) => {
    handleCurrencyChange(e.target.value);
});

document.addEventListener("DOMContentLoaded", () => {
    const isDarkMode = localStorage.getItem("themeMode") === "dark";
    document.documentElement.classList.toggle("dark-mode", isDarkMode);
    document.documentElement.classList.toggle("light-mode", !isDarkMode);

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.checked = isDarkMode;
    }
});
//default them setting
document.addEventListener("DOMContentLoaded", () => {
    syncCurrencySelects(selectedCurrency);
});

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("themeMode");

    if (savedTheme) {
        document.documentElement.classList.toggle("dark-mode", savedTheme === "dark");
        document.documentElement.classList.toggle("light-mode", savedTheme === "light");
    } else {
        // Set default theme to light mode
        document.documentElement.classList.add("light-mode");
        localStorage.setItem("themeMode", "light");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOMContentLoaded fired!");
    const checkProductsLoaded = setInterval(() => {
        const hasWindowProducts = typeof window !== "undefined"
            && typeof window.products !== "undefined"
            && Object.keys(window.products).length > 0;
        const hasDatabase = productsDatabase && Object.keys(productsDatabase).length > 0;

        if (hasWindowProducts || hasDatabase) {
            clearInterval(checkProductsLoaded);

            // Keep legacy `products` and new `productsDatabase` in sync
            if (!hasDatabase && hasWindowProducts) {
                productsDatabase = window.products;
            } else if (hasDatabase && !hasWindowProducts) {
                window.products = productsDatabase;
            }

            CategoryButtons(); // Now call the function
        } else {
            console.error("⚠️ Waiting for products to load...");
        }
    }, 100);
});


function CategoryButtons() {
    const sidebars = document.querySelectorAll("#SideBar, #DesktopSidebar");
    console.log("CategoryButtons");

    if (typeof productsDatabase === "undefined" || Object.keys(productsDatabase).length === 0) {
        console.error("❌ Products database not loaded yet.");
        return;
    }

    sidebars.forEach(sidebar => {
        if (!sidebar) return;

        const isMobile = sidebar.id === "SideBar";
        const categoryContainer = sidebar.querySelector(".sidebar-categories") || sidebar;

        // ✅ Clear previous category buttons
        while (categoryContainer.firstChild) {
            categoryContainer.removeChild(categoryContainer.firstChild);
        }

        // ✅ Rebuild category buttons
        Object.entries(productsDatabase).forEach(([category, catArray]) => {
            if (category !== "Default_Page" && Array.isArray(catArray)) {
                const button = document.createElement("button");
                button.className = "Category_Button";

                if (category === currentCategory) {
                    button.classList.add("Active");
                }

                button.onclick = () => {
                    currentCategory = category;
                    const sort = localStorage.getItem("defaultSort") || "NameFirst";
                    const order = "asc";
                    navigate("loadProducts", [category, sort, order]);
                    CategoryButtons(); // Refresh buttons
                };

                const heading = document.createElement("h3");
                heading.classList.add("Category_Button_Heading");

                const iconValue = (catArray.length > 0) ? (catArray[0].iconPng || catArray[0].iconPngUrl || catArray[0].iconUrl || catArray[0].icon || null) : null;
                const iconPath = iconValue;
                const displayName = category.replace(/_/g, ' ');


                if (iconPath) {
                    const isImageIcon =
                        typeof iconPath === "string" &&
                        (iconPath.startsWith("http://") ||
                            iconPath.startsWith("https://") ||
                            iconPath.startsWith("data:image/") ||
                            /\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(iconPath));

                    if (isImageIcon) {
                        heading.innerHTML = `
            <span class="category-icon-wrapper">
                <img class="category-icon-img" src="${iconPath}" alt="${displayName} icon" />
            </span>
            <span class="category-label">${displayName}</span>
        `;
                    } else {
                        heading.innerHTML = `
            <span class="category-icon-wrapper">
                <svg viewBox="0 0 24 24" class="category-icon-svg">
                    <path d="${iconPath}" />
                </svg>
            </span>
            <span class="category-label">${displayName}</span>
        `;
                    }
                } else {
                    heading.textContent = displayName;
                }
                button.appendChild(heading);
                categoryContainer.appendChild(button);
            }
        });
    });
}




function clearCategoryHighlight() {
    const buttons = document.querySelectorAll(".Category_Button");
    buttons.forEach(button => {
        button.classList.remove("Active");
    });
    currentCategory = null;
}
function isDarkModeEnabled() {
    return document.body.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
}


async function createPaymentModal() {
    if (document.getElementById("paymentModal")) return;

    // Ensure texts/theme data exist (safe even if initPaymentModalLogic calls it again)
    try { if (typeof preloadSettingsData === "function") await preloadSettingsData(); } catch { }

    const savedTheme = localStorage.getItem("themeMode");
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-mode");
        document.documentElement.classList.remove("light-mode");
    } else {
        document.documentElement.classList.add("light-mode");
        document.documentElement.classList.remove("dark-mode");
    }

    const modal = document.createElement("div");
    modal.id = "paymentModal";
    modal.innerHTML = `
      <div class="payment-modal-card">
        <span class="payment-modal-close" onclick="closeModal()">&times;</span>
        <h2>${(typeof TEXTS !== "undefined" && TEXTS?.PAYMENT_MODAL?.TITLE) ? TEXTS.PAYMENT_MODAL.TITLE : "Checkout"}</h2>
  
        <form id="paymentForm">
          <div id="Name_Holder">
            <div><input type="text" id="Name" placeholder="${TEXTS?.PAYMENT_MODAL?.FIELDS?.NAME || "Name"}" required></div>
            <div><input type="text" id="Surname" placeholder="${TEXTS?.PAYMENT_MODAL?.FIELDS?.SURNAME || "Surname"}" required></div>
          </div>
  
          <div><input type="email" id="email" placeholder="${TEXTS?.PAYMENT_MODAL?.FIELDS?.EMAIL || "Email"}" required></div>
  
          <div id="Address_Holder">
            <input type="text" id="Street" placeholder="${TEXTS?.PAYMENT_MODAL?.FIELDS?.STREET_HOUSE_NUMBER || "Street + number"}" required>
            <input type="text" id="City" placeholder="${TEXTS?.PAYMENT_MODAL?.FIELDS?.CITY || "City"}" required>
            <input type="text" id="Postal_Code" placeholder="${TEXTS?.PAYMENT_MODAL?.FIELDS?.POSTAL_CODE || "Postal code"}" required>
            <input type="text" id="Address_Line2" placeholder="Apartment, suite, etc. (optional)">
            <input type="text" id="State" placeholder="State / Province / Region">
            <input type="tel"  id="Phone" placeholder="Phone (for delivery updates)">
  
            <label for="Country">${TEXTS?.PAYMENT_MODAL?.FIELDS?.COUNTRY || "Country"}</label>
            <select id="Country" class="tom-hidden" required style="width: 100%"></select>
          </div>
  
          <div id="payment-request-button" style="margin: 16px 0;"></div>
          <div id="payment-element" style="margin-top: 16px;"></div>
  
          <button class="Submit_Button" id="confirm-payment-button" type="button">
            ${TEXTS?.PAYMENT_MODAL?.BUTTONS?.SUBMIT || "Pay"}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Minimal styling (keeps layout stable; your global CSS can further refine it)
    const style = document.createElement("style");
    style.id = "paymentModalStyle";
    style.textContent = `
      #paymentModal{
        position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center;
        padding:24px 12px; background: rgba(0,0,0,.55);
      }
      #paymentModal .payment-modal-card{
        width:min(520px, 100%); border-radius:20px; padding:18px 16px;
        background: var(--Card_Background, #fff);
        box-shadow: 0 12px 40px rgba(0,0,0,.35);
        color: var(--Default_Text_Colour, #111);
        position: relative;
        border: 1px solid rgba(0,0,0,.08);
      }
      #paymentModal h2{ margin: 6px 0 12px; font-size: 1.25rem; }
      #paymentModal label{ display:block; margin-top:10px; font-size:.9rem; opacity:.85; }
      #paymentModal .payment-modal-close{
        position:absolute; right:14px; top:10px; font-size:26px; cursor:pointer; opacity:.85;
      }
      #paymentModal input, #paymentModal select{
        width:100%; margin:6px 0; padding:10px 12px; border-radius:12px;
        border: 1px solid rgba(0,0,0,.15);
        background: var(--Input_Background, rgba(255,255,255,.92));
        color: inherit;
        outline: none;
      }
      #paymentModal input::placeholder{ color: rgba(0,0,0,.45); }
      #paymentModal input:focus, #paymentModal select:focus{
        border-color: rgba(0,0,0,.28);
        box-shadow: 0 0 0 3px rgba(37,99,235,.12);
      }
      #paymentModal #payment-element{
        margin-top: 16px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(0,0,0,.15);
        background: var(--Input_Background, rgba(255,255,255,.92));
      }
      #paymentModal #payment-request-button{ margin: 16px 0; }
      #Name_Holder{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }

      /* TomSelect (country dropdown) */
      #paymentModal .ts-control, 
      #paymentModal .ts-dropdown{
        border-radius: 12px;
        border: 1px solid rgba(0,0,0,.15);
        background: var(--Input_Background, rgba(255,255,255,.92));
        color: inherit;
      }
      #paymentModal .ts-dropdown .option{ padding: 10px 12px; }
      #paymentModal .ts-dropdown .active{ background: rgba(0,0,0,.06); }

      .Submit_Button{
        width:100%; margin-top:12px; padding:12px 14px; border-radius:14px; border:none;
        background: var(--Accent, #2563eb); color:#fff; font-weight:600; cursor:pointer;
      }
      .Submit_Button:disabled{ opacity:.6; cursor:not-allowed; }

      /* Dark mode overrides (modal + TomSelect). Stripe PaymentElement is themed via Appearance in JS. */

      html.dark-mode #paymentModal input,
      html.dark-mode #paymentModal select,
      html.dark-mode #paymentModal #payment-element{
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.06);
        color: inherit;
      }
      html.dark-mode #paymentModal input::placeholder{ color: rgba(255,255,255,.45); }
      html.dark-mode #paymentModal input:focus,
      html.dark-mode #paymentModal select:focus{
        border-color: rgba(255,255,255,.28);
        box-shadow: 0 0 0 3px rgba(59,130,246,.20);
      }
      html.dark-mode #paymentModal .payment-modal-close{ opacity:.9; }

      html.dark-mode #paymentModal .ts-control,
      html.dark-mode #paymentModal .ts-dropdown{
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.06);
        color: inherit;
      }
      html.dark-mode #paymentModal .ts-dropdown .active{ background: rgba(255,255,255,.12); }
    `;
    document.head.appendChild(style);

    // Restore any draft customer data (name/address/email) saved when closing the modal.
    // Note: Stripe PaymentElement details (card, etc.) cannot be persisted for compliance reasons.
    try { restoreCheckoutDraftToModal(); } catch { }

    // Autosave draft while typing (helps when closing by clicking outside / back button)
    try {
        const form = document.getElementById("paymentForm");
        if (form && form.dataset.draftListenerAttached !== "true") {
            form.dataset.draftListenerAttached = "true";
            let t;
            form.addEventListener("input", () => {
                clearTimeout(t);
                t = setTimeout(() => saveCheckoutDraftFromModal(), 250);
            });
        }
    } catch { }

    // Close modal when clicking on the overlay (outside the card)
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal({ preserveDraft: true });
    });

    // Close on Escape key
    try {
        const escHandler = (e) => {
            if (e.key === "Escape") closeModal({ preserveDraft: true });
        };
        window.__snagletPaymentModalEscHandler = escHandler;
        document.addEventListener("keydown", escHandler);
    } catch { }
}

function getStripeAppearanceForModal() {
    const dark = document.documentElement.classList.contains("dark-mode");

    if (dark) {
        return {
            theme: "night",
            variables: {
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                fontSizeBase: "14px",

                colorBackground: "#0b1220",
                colorText: "rgba(255,255,255,.92)",
                colorTextSecondary: "rgba(229,231,235,.70)",
                colorPrimary: "#3b82f6",
                colorDanger: "#ef4444",
                colorSuccess: "#22c55e",
                colorBorder: "rgba(255,255,255,.14)",

                borderRadius: "14px",
                spacingUnit: "6px",
                focusBoxShadow: "0 0 0 3px rgba(59,130,246,.20)"
            },
            rules: {
                ".Block": {
                    backgroundColor: "transparent",
                    borderColor: "rgba(255,255,255,.10)"
                },
                ".Input": {
                    backgroundColor: "rgba(255,255,255,.06)",
                    borderColor: "rgba(255,255,255,.14)",
                    color: "rgba(255,255,255,.92)",
                    boxShadow: "none"
                },
                ".Input:focus": {
                    borderColor: "rgba(59,130,246,.55)",
                    boxShadow: "0 0 0 3px rgba(59,130,246,.20)"
                },
                ".Label": {
                    color: "rgba(229,231,235,.85)"
                },
                ".Tab": {
                    backgroundColor: "rgba(255,255,255,.06)",
                    borderColor: "rgba(255,255,255,.12)",
                    color: "rgba(229,231,235,.90)"
                },
                ".Tab--selected": {
                    backgroundColor: "rgba(255,255,255,.12)",
                    borderColor: "rgba(255,255,255,.22)",
                    color: "rgba(255,255,255,.98)"
                }

            }
        };
    }

    // Light mode (optional: match your light UI too)
    return {
        theme: "flat",
        variables: {
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
            fontSizeBase: "14px",
            colorBackground: "#ffffff",
            colorText: "#111827",
            colorTextSecondary: "#4b5563",
            colorPrimary: "#2563eb",
            colorBorder: "rgba(17,24,39,.15)",
            borderRadius: "14px",
            spacingUnit: "6px"
        }
    };
}

// ----------------------------------------------------------------------------
// Checkout draft persistence (name/address/email only)
// Stripe Payment Element details cannot be persisted.
// ----------------------------------------------------------------------------
const CHECKOUT_DRAFT_STORAGE_KEY = "snaglet_checkout_draft_v1";

function saveCheckoutDraftFromModal() {
    try {
        const modal = document.getElementById("paymentModal");
        if (!modal) return;

        const ids = [
            "Name",
            "Surname",
            "email",
            "Street",
            "City",
            "Postal_Code",
            "Address_Line2",
            "State",
            "Phone"
        ];

        const draft = {};
        let any = false;

        for (const id of ids) {
            const el = modal.querySelector(`#${id}`);
            const val = (el && typeof el.value === "string") ? el.value.trim() : "";
            if (val) {
                draft[id] = val;
                any = true;
            }
        }

        if (any) {
            sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
        } else {
            sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
        }
    } catch { }
}

function restoreCheckoutDraftToModal() {
    try {
        const raw = sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
        if (!raw) return;

        const draft = JSON.parse(raw);
        if (!draft || typeof draft !== "object") return;

        for (const [id, val] of Object.entries(draft)) {
            const el = document.getElementById(id);
            if (el && typeof val === "string" && !el.value) {
                el.value = val;
            }
        }
    } catch { }
}

function clearCheckoutDraft() {
    try { sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY); } catch { }
}

function resetWalletPaymentRequestButton() {
    try { window.paymentRequestButtonElement?.unmount?.(); } catch { }
    window.paymentRequestButtonElement = null;
    window.paymentRequestInstance = null;
    window.prElementsInstance = null;

    const c = document.getElementById("payment-request-button");
    if (c) c.innerHTML = "";
}

function _isIso2Country(v) {
    return /^[A-Z]{2}$/.test(String(v || "").trim().toUpperCase());
}

function _getWalletButtonTheme() {
    // Stripe supports: 'dark', 'light', 'light-outline'
    const isDark = document.documentElement.classList.contains("dark-mode");
    return isDark ? "dark" : "light";
}

function _getStripeAppearance() {
    // Stripe Appearance API supports theme + variables + rules.
    // We use a dark palette aligned with the payment modal styling.
    const isDark =
        document.documentElement.classList.contains("dark-mode") ||
        localStorage.getItem("themeMode") === "dark";

    if (!isDark) {
        return {
            theme: "flat",
            variables: {
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                fontSizeBase: "14px",
                colorBackground: "#ffffff",
                colorText: "#111827",
                colorTextSecondary: "#4b5563",
                colorPrimary: "#2563eb",
                colorBorder: "rgba(17,24,39,.15)",
                borderRadius: "14px",
                spacingUnit: "6px"
            }
        };
    }

    return {
        theme: "night",
        variables: {
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
            fontSizeBase: "14px",

            colorBackground: "#0b1220",
            colorText: "rgba(255,255,255,.92)",
            colorTextSecondary: "rgba(229,231,235,.70)",
            colorPrimary: "#3b82f6",
            colorDanger: "#ef4444",
            colorSuccess: "#22c55e",
            colorBorder: "rgba(255,255,255,.14)",

            borderRadius: "14px",
            spacingUnit: "6px",
            focusBoxShadow: "0 0 0 3px rgba(59,130,246,.20)"
        },
        rules: {
            ".Block": {
                backgroundColor: "transparent",
                borderColor: "rgba(255,255,255,.10)"
            },
            ".Input": {
                backgroundColor: "rgba(255,255,255,.06)",
                borderColor: "rgba(255,255,255,.14)",
                color: "rgba(255,255,255,.92)",
                boxShadow: "none"
            },
            ".Input:focus": {
                borderColor: "rgba(59,130,246,.55)",
                boxShadow: "0 0 0 3px rgba(59,130,246,.20)"
            },
            ".Label": {
                color: "rgba(229,231,235,.85)"
            },
            ".Tab": {
                backgroundColor: "rgba(255,255,255,.06)",
                borderColor: "rgba(255,255,255,.12)",
                color: "rgba(229,231,235,.90)"
            },
            ".Tab--selected": {
                backgroundColor: "rgba(255,255,255,.10)",
                borderColor: "rgba(59,130,246,.45)"
            }
        }
    };
}


async function setupWalletPaymentRequestButton({
    stripe,
    clientSecret,
    amountCents,
    currency,
    country,
    orderId,
    paymentIntentId
}) {
    const container = document.getElementById("payment-request-button");
    if (!container || !stripe || !clientSecret) return;

    resetWalletPaymentRequestButton();

    const cc = _isIso2Country(country) ? String(country).trim().toUpperCase() : "US";
    const cur = String(currency || "EUR").trim().toLowerCase();
    const amt = parseInt(amountCents, 10);

    if (!Number.isFinite(amt) || amt <= 0) {
        container.style.display = "none";
        return;
    }

    const paymentRequest = stripe.paymentRequest({
        country: cc,
        currency: cur,
        total: { label: "Total", amount: amt }, // amount is in minor units
        requestPayerName: true,
        requestPayerEmail: true,
        requestPayerPhone: true
        // requestShipping: false (you use your form fields for shipping)
    });

    const canMakePayment = await paymentRequest.canMakePayment();
    if (!canMakePayment) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";

    // Use a separate Elements instance for the wallet button
    const prElements = stripe.elements({
        appearance: _getStripeAppearance()
    });

    const prButton = prElements.create("paymentRequestButton", {
        paymentRequest,
        style: {
            paymentRequestButton: {
                type: "buy",
                theme: _getWalletButtonTheme(),
                height: "44px"
            }
        }
    });

    prButton.mount("#payment-request-button");

    window.paymentRequestInstance = paymentRequest;
    window.prElementsInstance = prElements;
    window.paymentRequestButtonElement = prButton;

    paymentRequest.on("paymentmethod", async (ev) => {
        try {
            // Require your form to be valid (so shipping/customer pipeline always has data)
            const form = document.getElementById("paymentForm");
            if (form && !form.checkValidity()) {
                form.reportValidity();
                ev.complete("fail");
                return;
            }

            // Build userDetails from your form, then patch missing fields from wallet
            const userDetails = (typeof readCheckoutForm === "function") ? readCheckoutForm() : {};
            if (!userDetails.email && ev.payerEmail) userDetails.email = ev.payerEmail;
            if (!userDetails.phone && ev.payerPhone) userDetails.phone = ev.payerPhone;
            if ((!userDetails.name || !userDetails.surname) && ev.payerName) {
                // naive split; your form already requires both, so this is mostly fallback
                const parts = String(ev.payerName).trim().split(/\s+/);
                if (!userDetails.name) userDetails.name = parts[0] || "";
                if (!userDetails.surname) userDetails.surname = parts.slice(1).join(" ") || "";
            }
            if (!userDetails.country) userDetails.country = cc;

            // Attach customer details to the SAME order/PI (your pipeline)
            await fetch(`${API_BASE}/store-user-details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentIntentId: paymentIntentId || window.latestPaymentIntentId || null,
                    orderId: orderId || window.latestOrderId || null,
                    // Backend requires either token OR clientSecret; send both for robustness
                    clientSecret: (typeof clientSecret !== "undefined" && clientSecret) ? clientSecret : (window.latestClientSecret || null),
                    token: window.latestOrderPublicToken || null,
                    userDetails
                })
            }).catch(() => { });

            // Confirm the SAME PaymentIntent (do NOT create a new one here)
            const first = await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: ev.paymentMethod.id },
                { handleActions: false }
            );

            if (first.error) {
                ev.complete("fail");
                alert(first.error.message || "Payment failed.");
                return;
            }

            // Close the Apple/Google Pay sheet
            ev.complete("success");

            let pi = first.paymentIntent;

            // Handle next actions (3DS, etc.)
            if (pi && pi.status === "requires_action") {
                const second = await stripe.confirmCardPayment(clientSecret);
                if (second.error) {
                    alert(second.error.message || "Authentication failed. Your cart is unchanged.");
                    return;
                }
                pi = second.paymentIntent;
            }

            // Final handling (same policy as your card flow)
            if (pi?.status === "succeeded") {
                clearPaymentPendingFlag();
                clearBasketCompletely();
                try { clearCheckoutDraft(); } catch { }
                setPaymentSuccessFlag({ reloadOnOk: true });
                window.location.href = window.location.origin;
                return;
            }

            if (pi?.id) {
                // processing / requires_capture / etc.: keep cart, poll server for final
                setPaymentPendingFlag({ paymentIntentId: pi.id, orderId: orderId || window.latestOrderId || null });

                const r = await pollPendingPaymentUntilFinal({ paymentIntentId: pi.id });
                if (r.status === "succeeded") {
                    clearPaymentPendingFlag();
                    clearBasketCompletely();
                    try { clearCheckoutDraft(); } catch { }
                    setPaymentSuccessFlag({ reloadOnOk: true });
                    window.location.href = window.location.origin;
                    return;
                }

                if (r.status === "requires_payment_method" || r.status === "canceled") {
                    clearPaymentPendingFlag();
                    alert("Payment did not complete. Your cart is still saved—please try again.");
                    return;
                }

                alert("Payment is still processing. Your cart is unchanged.");
                return;
            }

            alert("Payment submitted. Your cart is unchanged until confirmation.");
        } catch (e) {
            try { ev.complete("fail"); } catch { }
            console.error("Wallet payment failed:", e);
            alert(e?.message || "Wallet payment failed. Your cart is unchanged.");
        }
    });
}

// --- PAYMENT SUCCESS (non-blocking UI) ---------------------------
const PAYMENT_SUCCESS_FLAG_KEY = "payment_successful";
const PAYMENT_SUCCESS_RELOAD_KEY = "payment_successful_reload_on_ok";

function setPaymentSuccessFlag({ reloadOnOk = true } = {}) {
    try {
        localStorage.setItem(PAYMENT_SUCCESS_FLAG_KEY, "1");
        if (reloadOnOk) localStorage.setItem(PAYMENT_SUCCESS_RELOAD_KEY, "1");
        else localStorage.removeItem(PAYMENT_SUCCESS_RELOAD_KEY);
    } catch (e) {
        console.warn("Could not set payment success flag:", e);
    }
}

function showPaymentSuccessOverlay(message) {
    // Prevent duplicates
    if (document.getElementById("paymentSuccessOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "paymentSuccessOverlay";
    overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:100000",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "padding:16px",
        "background:rgba(0,0,0,0.55)",
        "backdrop-filter:blur(6px)"
    ].join(";");

    const card = document.createElement("div");
    card.style.cssText = [
        "width:min(520px, calc(100vw - 32px))",
        "background:#141414",
        "color:#fff",
        "border:1px solid rgba(255,255,255,0.12)",
        "border-radius:14px",
        "box-shadow:0 20px 60px rgba(0,0,0,0.65)",
        "padding:16px 16px 14px",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "Payment successful";
    title.style.cssText = "font-size:16px;font-weight:700;margin-bottom:8px;";

    const body = document.createElement("div");
    body.textContent = message || "Thank you for shopping with us! Your payment was successful and we are hard at work to get you your order as soon as possible!";
    body.style.cssText = "font-size:14px;opacity:0.92;line-height:1.35;margin-bottom:14px;";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:10px;";

    const track = document.createElement("button");
    track.type = "button";
    track.textContent = "Track order";
    track.style.cssText = [
        "padding:10px 14px",
        "border-radius:10px",
        "border:1px solid rgba(255,255,255,0.18)",
        "background:rgba(255,255,255,0.14)",
        "color:#fff",
        "cursor:pointer",
        "font-weight:700"
    ].join(";");

    track.onclick = () => {
        try {
            openOrderStatusModal({
                orderId: window.latestOrderId || "",
                token: window.latestOrderPublicToken || ""
            });
        } catch { }
    };

    const ok = document.createElement("button");
    ok.type = "button";
    ok.textContent = "OK";
    ok.style.cssText = [
        "padding:10px 14px",
        "border-radius:10px",
        "border:1px solid rgba(255,255,255,0.18)",
        "background:rgba(255,255,255,0.08)",
        "color:#fff",
        "cursor:pointer",
        "font-weight:600"
    ].join(";");

    if (window.latestOrderId && window.latestOrderPublicToken) {
        actions.appendChild(track);
    }
    actions.appendChild(ok);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const reloadOnOk = (() => {
        try { return localStorage.getItem(PAYMENT_SUCCESS_RELOAD_KEY) === "1"; }
        catch { return false; }
    })();

    const cleanupAndMaybeReload = () => {
        // Ensure it can't show again
        try {
            localStorage.removeItem(PAYMENT_SUCCESS_FLAG_KEY);
            localStorage.removeItem(PAYMENT_SUCCESS_RELOAD_KEY);
        } catch { }

        overlay.remove();

        // If you want “OK → reload to origin”
        if (reloadOnOk) {
            window.location.replace(window.location.origin);
        }
    };

    ok.addEventListener("click", cleanupAndMaybeReload);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanupAndMaybeReload();
    });
}

function checkAndShowPaymentSuccess() {
    try {
        const flag = localStorage.getItem(PAYMENT_SUCCESS_FLAG_KEY);
        if (flag !== "1") return false;

        // Do NOT show a blocking alert. Show overlay.
        // (Keep the flag until user clicks OK; overlay will remove it.)
        const msg = (typeof TEXTS !== "undefined" && TEXTS?.CHECKOUT_SUCCESS)
            ? TEXTS.CHECKOUT_SUCCESS
            : "Thank you for shopping with us! Your payment was successful and we are hard at work to get you your order as soon as possible!";

        // Let initial scripts paint first, but do not block timers like alert()
        requestAnimationFrame(() => showPaymentSuccessOverlay(msg));
        return true;
    } catch (e) {
        console.warn("Could not check payment success flag:", e);
        return false;
    }
}






// When the user clicks "Pay Now"
function handleOutsideClick(event) {
    const modal = document.getElementById("paymentModal");
    if (!modal) return;

    // Close only when clicking the overlay itself (outside the card)
    if (event.target === modal) closeModal({ preserveDraft: true });
}

function clearBasketCompletely() {
    try {
        if (typeof basket === "object" && basket) {
            for (const k of Object.keys(basket)) delete basket[k];
        }
    } catch { }

    clearBasketStorage("clear_basket");
    refreshBasketUIIfOpen();
}












// Function to show the modal
async function openModal() {
    await createPaymentModal();

    const modal = document.getElementById("paymentModal");
    if (modal) modal.style.display = "flex";

    history.pushState({ modalOpen: true }, "", window.location.href);

    // ✅ Re-wire modal logic to the new server-truth flow (tariffs + PI + mismatch handling)
    await initPaymentModalLogic();
}

function closeModal(opts = {}) {
    const options = (opts && typeof opts === "object") ? opts : {};
    const preserveDraft = options.preserveDraft !== false; // default true
    const clearDraft = options.clearDraft === true;

    if (preserveDraft) saveCheckoutDraftFromModal();
    if (clearDraft) clearCheckoutDraft();

    // Remove ESC handler if it was attached while the modal was open
    try {
        if (window.__snagletPaymentModalEscHandler) {
            document.removeEventListener("keydown", window.__snagletPaymentModalEscHandler);
            window.__snagletPaymentModalEscHandler = null;
        }
    } catch { }

    const modal = document.getElementById("paymentModal");
    if (modal) modal.remove();

    // Reset wallet UI
    resetWalletPaymentRequestButton();

    // Reset Stripe state so reopen is clean
    try { window.paymentElementInstance?.unmount?.(); } catch { }
    window.elementsInstance = null;
    window.paymentElementInstance = null;

    // Keep stripeInstance (fine), but clear “latest” references
    window.latestClientSecret = null;
    window.latestOrderId = null;
    window.latestPaymentIntentId = null;
}





// Format card number (add spaces every 4 digits)
function formatCardNumber(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    value = value.replace(/(.{4})/g, '$1 ').trim(); // Add space every 4 digits
    e.target.value = value;
}

// Format expiry date (MM/YY)
function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    e.target.value = value;
}

// Function to calculate total price
function calculateTotal(cartItems) {
    return Object.values(cartItems).reduce(
        (sum, item) => sum + (parseFloat(item.price) * item.quantity),
        0
    ).toFixed(2);
}
function removeSortContainer() {
    console.log("✅ SortContainer removed engaged!");
    let sortContainer = document.getElementById("SortContainer");
    if (sortContainer) {
        sortContainer.remove(); // Remove only the sorting dropdown container
        console.log("✅ SortContainer removed successfully!");
    } else {
        console.log("⚠️ SortContainer not found.");
    }
}









// Function to calculate total price
function calculateTotalAmount() {
    return Object.values(basket).reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
}

function basketButtonFunction() {
    let basketData = encodeURIComponent(JSON.stringify(basket)); // Convert basket to a URL-safe string
    window.open(`basket.html?data=${basketData}`, "_blank");
};

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const redirectStatus = params.get("redirect_status");

    if (redirectStatus === "succeeded") {
        console.log("✅ Stripe redirect success detected – clearing basket and flagging success.");

        // Clear basket and mark success
        clearBasketCompletely();
        try { clearCheckoutDraft(); } catch { }
        setPaymentSuccessFlag({ reloadOnOk: true }); // OK will reload to origin

        // Clean Stripe params so refresh doesn't re-trigger
        params.delete("redirect_status");
        params.delete("payment_intent");
        params.delete("payment_intent_client_secret");

        const newQuery = params.toString();
        const cleanUrl =
            window.location.pathname +
            (newQuery ? "?" + newQuery : "") +
            window.location.hash;

        // IMPORTANT: no reload here. Just clean the address bar.
        history.replaceState({}, "", cleanUrl);

        // Show success overlay (non-blocking)
        checkAndShowPaymentSuccess();
        return;
    }

    // Normal loads: if a previous flow set the flag, show it now
    checkAndShowPaymentSuccess();
    checkAndHandlePendingPaymentOnLoad();

});












let searchTimeout;










function handleSortChange(newSort) {
    localStorage.setItem("defaultSort", newSort);
    syncSortSelects(newSort); // Updates both dropdowns
    if (typeof window.currentCategory !== "undefined") {
        loadProducts(window.currentCategory, newSort, window.currentSortOrder || "asc");
    }
}






function loadProducts(category, sortBy = "NameFirst", sortOrder = "asc") {
    lastCategory = category;
    if (window.matchMedia("(max-width: 680px)").matches) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sortBy = sortBy || "NameFirst";
    sortOrder = sortOrder || "asc";
    category = category || Object.keys(productsDatabase).find(k => Array.isArray(productsDatabase[k]) && productsDatabase[k].length) || "Default_Page";

    document.getElementById('Viewer').innerHTML = '';

    if (category === "Default_Page") {
        clearCategoryHighlight();
    }

    let savedSort = localStorage.getItem("defaultSort") || "NameFirst";
    const viewer = document.getElementById("Viewer");
    window.currentCategory = category;

    let wrapper = document.getElementById("ProductWrapper");
    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "ProductWrapper";
        viewer.parentNode.insertBefore(wrapper, viewer);
        wrapper.appendChild(viewer);
    }

    viewer.innerHTML = "";
    cart = {};

    if (!products.hasOwnProperty(category) || !Array.isArray(products[category])) {
        console.warn(`⚠️ Category '${category}' is invalid or does not contain a valid product list.`);
        return;
    }

    let productList = [...products[category]];

    productList.sort((a, b) => {
        if (sortBy === "Cheapest") return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
        if (sortBy === "Priciest") return sortOrder === "asc" ? b.price - a.price : a.price - b.price;
        if (sortBy === "NameFirst") return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        if (sortBy === "NameLast") return sortOrder === "asc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
    });

    removeSortContainer();

    let sortContainer = document.getElementById("SortContainer");
    if (!sortContainer) {
        sortContainer = document.createElement("div");
        sortContainer.id = "SortContainer";
        sortContainer.className = "SortContainer";
        sortContainer.innerHTML = `
            <label for="sortSelect" class="SortSelectLabel">${TEXTS.SORTING.LABEL}</label>
            <select id="sortSelect" class="sortSelect" onchange="updateSorting()">
                <option value="NameFirst" selected>${TEXTS.SORTING.OPTIONS.NAME_ASC}</option>
                <option value="NameLast">${TEXTS.SORTING.OPTIONS.NAME_DESC}</option>
                <option value="Cheapest">${TEXTS.SORTING.OPTIONS.PRICE_ASC}</option>
                <option value="Priciest">${TEXTS.SORTING.OPTIONS.PRICE_DESC}</option>
            </select>
        `;
        wrapper.insertBefore(sortContainer, viewer);
    }

    let sortSelectElement = document.getElementById("sortSelect");
    if (sortSelectElement) {
        sortSelectElement.value = sortBy;
    }

    productList.forEach(product => {
        if (!product.name) return;
        cart[product.name] = 1;

        const productDiv = document.createElement("div");
        productDiv.classList.add("product");

        const card = document.createElement("div");
        card.className = "product-card";

        // Clickable product name as a link
        const nameLink = document.createElement("a");
        nameLink.className = "product-name";
        nameLink.style.textDecoration = "none"; // Removes underline


        nameLink.textContent = product.name;
        nameLink.addEventListener("click", (e) => {
            e.preventDefault();
            navigate("GoToProductPage", [
                product.name,
                product.price,
                product.description || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER
            ]);
        });
        nameLink.href = `https://www.snagletshop.com/?product=${encodeURIComponent(product.name)}`;
        nameLink.target = "_blank"; // Open in new tab

        const img = document.createElement("img");
        img.className = "Clickable_Image";
        img.src = product.image;
        img.alt = product.name;
        img.dataset.name = product.name;
        img.dataset.price = product.price;
        img.dataset.imageurl = product.image;
        img.dataset.description = product.description || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER;

        img.addEventListener("click", () => {
            navigate("GoToProductPage", [
                product.name,
                product.price,
                product.description || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER
            ]);
        });

        const priceP = document.createElement("p");
        priceP.className = "product-price";
        priceP.textContent = `${product.price}${TEXTS.CURRENCIES.EUR}`;

        const quantityContainer = document.createElement("div");
        quantityContainer.className = "quantity-container";

        const quantityControls = document.createElement("div");
        quantityControls.className = "quantity-controls";

        const decBtn = document.createElement("button");
        decBtn.className = "Button";
        decBtn.textContent = TEXTS.BASKET.BUTTONS.DECREASE;
        decBtn.addEventListener("click", () => decreaseQuantity(product.name));

        const quantitySpan = document.createElement("span");
        quantitySpan.className = "WhiteText";
        quantitySpan.id = `quantity-${product.name}`;
        quantitySpan.textContent = "1";

        const incBtn = document.createElement("button");
        incBtn.className = "Button";
        incBtn.textContent = TEXTS.BASKET.BUTTONS.INCREASE;
        incBtn.addEventListener("click", () => increaseQuantity(product.name));

        const addToCartBtn = document.createElement("button");
        addToCartBtn.className = "add-to-cart";

        // Use flexbox to align text and SVG
        addToCartBtn.innerHTML = `
        <span style="display: flex; align-items: center;">
          ${TEXTS.PRODUCT_SECTION.ADD_TO_CART}
          <svg class="cart-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      `;


        addToCartBtn.addEventListener("click", () => {
            addToCart(
                product.name,
                product.price,
                product.image,
                product.expectedPurchasePrice,
                product.productLink,
                product.description,
                (product.productOptions && product.productOptions[1]) || ""
            );
        });



        quantityControls.append(decBtn, quantitySpan, incBtn);
        quantityContainer.append(quantityControls, addToCartBtn);

        card.append(nameLink, img, priceP, quantityContainer);
        productDiv.appendChild(card);
        viewer.appendChild(productDiv);
    });
    try {
        preloadProductImages(category); // only current category thumbnails, throttled
    } catch (e) {
        console.warn("⚠️ preloadProductImages failed:", e);
    }

    CategoryButtons();


}




function syncSortSelects(newSort) {
    document.querySelectorAll('#sortSelect, #defaultSort').forEach(select => {
        if (select && select.value !== newSort) {
            select.value = newSort;
        }
    });
}


function updateSorting() {
    const selectedSort = document.getElementById("sortSelect")?.value;
    if (selectedSort) {
        handleSortChange(selectedSort);
    }
}




function getProductDescription(productName) {
    let product = Object.values(products || {}).flat().find(p => p.name === productName);
    return product ? product.description : "N/A";
}
window.__alreadyRetriedBrokenProduct = false;
window.lastProductName = null;
window.lastProductPrice = null;
window.lastProductDescription = null;


function preloadProductImages(category) {
    if (typeof products === "undefined" || !products) return;

    // Default to the current/last category so we DON'T preload the entire catalog.
    const cat =
        category ||
        (typeof lastCategory !== "undefined" && lastCategory) ||
        window.currentCategory ||
        "Default_Page";

    const list = Array.isArray(products[cat]) ? products[cat] : [];
    if (!list.length) return;

    // Tune these:
    const MAX_PRODUCTS = 20;     // how many product thumbnails to warm up
    const CONCURRENCY = 4;       // how many simultaneous image requests

    // Pick ONE thumbnail URL per product (not the whole images[] array)
    const urls = [];
    for (let i = 0; i < Math.min(MAX_PRODUCTS, list.length); i++) {
        const p = list[i];
        let url = "";

        if (p && typeof p.image === "string" && p.image.trim()) {
            url = p.image.trim();
        } else if (p && Array.isArray(p.images)) {
            const first = p.images.find(u => typeof u === "string" && u.trim());
            if (first) url = first.trim();
        }

        if (!url) continue;

        // Basic relative handling (keeps current behavior from breaking if some are relative)
        if (!/^https?:\/\//i.test(url) && !/^data:/i.test(url) && !/^blob:/i.test(url)) {
            if (url.startsWith("/")) url = `${window.location.origin}${url}`;
            else url = `${window.location.origin}/${url}`;
        }

        if (!preloadedImages.has(url)) urls.push(url);
    }

    if (!urls.length) return;

    // Avoid restarting the same preload repeatedly
    const key = `${cat}::${urls.length}`;
    if (preloadProductImages.__lastKey === key && preloadProductImages.__running) return;
    preloadProductImages.__lastKey = key;

    const run = () => {
        preloadProductImages.__running = true;

        let idx = 0;
        let active = 0;

        const pump = () => {
            while (active < CONCURRENCY && idx < urls.length) {
                const url = urls[idx++];
                if (!url || preloadedImages.has(url)) continue;

                active++;

                const img = new Image();
                img.decoding = "async";

                const done = () => {
                    active--;
                    preloadedImages.add(url);
                    if (idx >= urls.length && active === 0) {
                        preloadProductImages.__running = false;
                        return;
                    }
                    pump();
                };

                img.onload = done;
                img.onerror = done;
                img.src = url;
            }
        };

        pump();
    };

    // Don’t fight the initial render
    if ("requestIdleCallback" in window) {
        requestIdleCallback(run, { timeout: 1200 });
    } else {
        setTimeout(run, 0);
    }
}



function attachSwipeListeners() {
    const image = document.getElementById("mainImage");
    if (!image) return;

    let touchStartX = 0;
    let touchEndX = 0;

    image.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    image.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    });

    function handleSwipeGesture() {
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) < 50) return; // avoid tiny swipes

        if (diff > 0) {
            // Swipe right → go to previous image
            if (window.currentIndex > 0) {
                window.currentIndex--;
                updateMainImage("left"); // swipe right, image slides left
            }
        } else {
            // Swipe left → go to next image
            if (window.currentIndex < window.currentProductImages.length - 1) {
                window.currentIndex++;
                updateMainImage("right"); // swipe left, image slides right
            }
        }
    }
}



let currentImageIndex = 0;
let startX = 0;

const carousel = document.getElementById("imageCarousel");
const images = carousel ? carousel.querySelectorAll(".carousel-image") : [];

if (carousel && images && images.length) {
    // Ensure the first image is visible (best-effort)
    try { images[0].style.display = "block"; } catch { }

    carousel.addEventListener("touchstart", (e) => {
        startX = e.changedTouches[0].clientX;
    }, { passive: true });

    carousel.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
            // Guard against empty list
            if (!images[currentImageIndex]) return;

            images[currentImageIndex].style.display = "none";

            if (diff > 0) {
                // Swipe left
                currentImageIndex = (currentImageIndex + 1) % images.length;
            } else {
                // Swipe right
                currentImageIndex =
                    (currentImageIndex - 1 + images.length) % images.length;
            }

            if (images[currentImageIndex]) {
                images[currentImageIndex].style.display = "block";
            }
        }
    }, { passive: true });
}
function selectProductOption(button, optionValue) {
    document.querySelectorAll(".Product_Option_Button").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");

    window.selectedProductOption = optionValue;

    const productName = document.querySelector(".Product_Name_Heading")?.textContent?.trim();
    if (productName && basket[productName]) {
        basket[productName].selectedOption = optionValue;
        persistBasket("option_change");
        console.log(`🟢 Saved selected option "${optionValue}" for "${productName}"`);
    }
}








function buyNow(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "") {
    console.log(productName, productPrice, imageUrl, selectedOption);
    let quantity = parseInt(document.getElementById(`quantity-${productName}`).innerText) || 1;
    addToCart(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption);
    navigate("GoToCart");

}

// Function to update the displayed image
function updateImage(direction = 'none') {
    const imageElement = document.getElementById("mainImage");

    if (imageElement) {
        if (direction === 'right') {
            imageElement.style.transform = 'translateX(100vw)';
            setTimeout(() => {
                imageElement.src = window.currentProductImages[window.currentIndex];
                imageElement.style.transition = 'none';
                imageElement.style.transform = 'translateX(-100vw)';
                void imageElement.offsetWidth;
                imageElement.style.transition = 'transform 0.4s ease';
                imageElement.style.transform = 'translateX(0)';
            }, 100);
        } else if (direction === 'left') {
            imageElement.style.transform = 'translateX(-100vw)';
            setTimeout(() => {
                imageElement.src = window.currentProductImages[window.currentIndex];
                imageElement.style.transition = 'none';
                imageElement.style.transform = 'translateX(100vw)';
                void imageElement.offsetWidth;
                imageElement.style.transition = 'transform 0.4s ease';
                imageElement.style.transform = 'translateX(0)';
            }, 100);
        } else {
            imageElement.src = window.currentProductImages[window.currentIndex];
        }
    }

    document.querySelectorAll(".Thumbnail").forEach(img => img.classList.remove("active"));
    const currentImage = window.currentProductImages[window.currentIndex];
    document.querySelector(`.Thumbnail[src="${currentImage}"]`)?.classList.add("active");
}

function prevImage() {
    window.currentIndex = (window.currentIndex - 1 + window.currentProductImages.length) % window.currentProductImages.length;
    updateImage('right');
}

function nextImage() {
    window.currentIndex = (window.currentIndex + 1) % window.currentProductImages.length;
    updateImage('left');
}







function changeImage(imgSrc) {
    const index = window.currentProductImages.indexOf(imgSrc);
    if (index !== -1) {
        window.currentIndex = index;
        updateImage();
    }
}


function increaseQuantity(productName) {
    if (!cart[productName]) {
        cart[productName] = 1;
    }
    cart[productName] += 1;
    document.getElementById(`quantity-${productName}`).innerText = cart[productName];
}

function decreaseQuantity(productName) {
    if (!cart[productName]) {
        cart[productName] = 1;
    }
    if (cart[productName] > 1) {
        cart[productName] -= 1;
        document.getElementById(`quantity-${productName}`).innerText = cart[productName];
    }
}

function addToCart_legacy(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = '') {// analytics: add to cart
    try {
        const payload = buildAnalyticsProductPayload(productName, { priceEUR: price, productLink });
        payload.extra = { selectedOption: selectedOption || "" };
        sendAnalyticsEvent('add_to_cart', payload);
    } catch { }

    let quantity = cart[productName] || 1;
    cart[productName] = 1;

    const key = selectedOption ? `${productName} - ${selectedOption}` : productName;

    if (quantity > 0) {
        if (basket[key]) {
            basket[key].quantity += quantity;
        } else {
            basket[key] = {
                name: productName,
                price,
                image: imageUrl,
                quantity,
                expectedPurchasePrice,
                productLink,
                description: productDescription,
                ...(selectedOption && { selectedOption })
            };
        }

        localStorage.setItem("basket", JSON.stringify(basket));
        alert(`${quantity} x ${productName}${selectedOption ? ' (' + selectedOption + ')' : ''} added to cart!`);
    } else {
        alert("Please select at least one item.");
    }
}




function GoToCart() {
    clearCategoryHighlight()
    const viewer = document.getElementById("Viewer");

    if (!viewer) {
        console.error("❌ Viewer element not found.");
        return;
    }

    viewer.innerHTML = ""; // Clear previous products

    let Basket_Viewer = document.createElement("div");
    Basket_Viewer.id = "Basket_Viewer";
    Basket_Viewer.classList.add("Basket_Viewer");

    viewer.appendChild(Basket_Viewer); // Append the container to the viewer

    // Delay updating the basket to ensure the UI is fully created
    setTimeout(() => {
        updateBasket();
    }, 100);

    removeSortContainer();
}



function updateBasket() {
    let basketContainer = document.getElementById("Basket_Viewer");

    if (!basketContainer) {
        console.error("❌ Basket_Viewer not found. Creating it...");

        let viewer = document.getElementById("Viewer");
        if (!viewer) {
            console.error("❌ Viewer element not found.");
            return;
        }

        basketContainer = document.createElement("div");
        basketContainer.id = "Basket_Viewer";
        basketContainer.classList.add("Basket_Viewer");
        viewer.appendChild(basketContainer);
    }

    basketContainer.innerHTML = "";

    if (Object.keys(basket).length === 0) {
        basketContainer.innerHTML = `<p class='EmptyBasketMessage'>The basket is empty!</p>`;
        return;
    }

    let BasketTotalPrice = 0;

    Object.entries(basket).forEach(([key, item]) => {
        let productDiv = document.createElement("div");
        productDiv.classList.add("Basket_Item_Container");

        let value = parseFloat(item.price);
        let totalPrice = (value * item.quantity).toFixed(2);

        console.log(`🔹 Product: ${item.name}`);
        console.log(`   🔹 Expected Purchase Price: ${item.expectedPurchasePrice}`);
        console.log(`   🔹 Product Link: ${item.productLink}`);
        console.log(`   🔹 Product IMAGELINK: ${item.image}`);
        console.log(`   🔹 Product description: ${item.description}`);

        let selectedOptionHTML = "";
        if (item.selectedOption) {
            // Try to find the product from the products database
            const product = Object.values(products).flat().find(p => p.name === item.name);
            let label = "option";

            if (product?.productOptions && product.productOptions.length > 1) {
                label = product.productOptions[0].replace(":", "").trim().toLowerCase();
            }

            selectedOptionHTML = `<span class="BasketSelectedOption">Selected ${label}: ${item.selectedOption.toLowerCase()}</span>`;
        }

        const encodedName = encodeURIComponent(item.name);
        productDiv.innerHTML = `
        <div class="Basket-Item">
            <a href="https://www.snagletshop.com/?product=${encodedName}" target="_blank">
                <img class="Basket_Image" 
                     src="${item.image}" 
                     alt="${item.name}" 
                     data-name="${item.name}" 
                     data-price="${item.price}" 
                     data-description="${item.description}" 
                     data-imageurl="${item.image}">
            </a>
            <div class="Item-Details">
                <a href="https://www.snagletshop.com/?product=${encodedName}" target="_blank" class="BasketText">
                    <strong class="BasketText">${item.name.length > 15 ? item.name.slice(0, 15) + "…" : item.name}</strong>

                </a>
                <p class="BasketTextDescription">${item.description}</p>
                <div class="PriceAndOptionRow">
                    <p class="basket-item-price" data-eur="${totalPrice}">${totalPrice}€</p>
                    ${selectedOptionHTML}
                </div>
            </div>
<div class="Quantity-Controls-Basket">
  <button class="BasketChangeQuantityButton" type="button"
          data-key="${encodeURIComponent(key)}" data-delta="-1">${TEXTS.BASKET.BUTTONS.DECREASE}</button>
  <span class="BasketChangeQuantityText">${item.quantity}</span>
  <button class="BasketChangeQuantityButton" type="button"
          data-key="${encodeURIComponent(key)}" data-delta="1">${TEXTS.BASKET.BUTTONS.INCREASE}</button>
</div>

        </div>
    `;


        basketContainer.appendChild(productDiv);
        BasketTotalPrice += value * item.quantity;
    });


    let totalSum = 0;
    let receiptDiv = document.createElement("div");
    receiptDiv.classList.add("BasketReceipt");

    let receiptContent = `<div class="Basket-Item-Pay"><table class="ReceiptTable">`;

    Object.entries(basket).forEach(([key, item]) => {
        let itemPrice = parseFloat(item.price);
        let itemTotal = itemPrice * item.quantity;
        totalSum += itemTotal;

        receiptContent += `
            <tr>
                <td>${item.quantity} ×</td>
                <td>${item.name}</td>
                <td class="basket-item-price" data-eur="${itemTotal.toFixed(2)}">${itemTotal.toFixed(2)}€</td>
            </tr>
        `;
    });

    receiptContent += `</table></div>`;
    receiptContent += `
        <div class="ReceiptFooter">
            <button class="PayButton">${TEXTS.PRODUCT_SECTION.BUY_NOW}</button>
            <strong class="PayTotalText" id="basket-total" data-eur="${totalSum.toFixed(2)}">Total: ${totalSum.toFixed(2)}€</strong>
        </div>
    `;

    receiptDiv.innerHTML = receiptContent;
    basketContainer.appendChild(receiptDiv);
    // Bind once per Basket_Viewer (works across re-renders)
    if (!basketContainer.dataset.qtyBound) {
        basketContainer.dataset.qtyBound = "1";
        basketContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".BasketChangeQuantityButton");
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            const k = decodeURIComponent(btn.dataset.key || "");
            const delta = parseInt(btn.dataset.delta || "0", 10) || 0;
            changeQuantity(k, delta);
        });
    }

    // ✅ Ensure the basket "Pay" button always works (even if delegated handlers weren't attached yet)
    const payBtn = receiptDiv.querySelector(".PayButton");
    if (payBtn) {
        payBtn.type = "button"; // prevent accidental form submit
        if (!payBtn.dataset.bound) {
            payBtn.dataset.bound = "1";
            payBtn.addEventListener("click", async (event) => {
                event.preventDefault();
                event.stopPropagation(); // prevent the delegated handler from firing too

                const wasDisabled = payBtn.disabled;
                payBtn.disabled = true;

                try {
                    await openModal(); // creates & opens the payment modal
                } catch (e) {
                    console.error("openModal() failed:", e);
                    alert("Could not initialize checkout. Please try again.");
                } finally {
                    payBtn.disabled = wasDisabled;
                }
            });
        }
    }

    document.querySelectorAll(".Basket_Image").forEach((img) => {
        img.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const productName = this.dataset.name;
            const productPrice = this.dataset.price;
            let productDescription = this.dataset.description;

            if (!productDescription || productDescription === "undefined") {
                const product = Object.values(products).flat().find(p => p.name === productName);
                if (product) productDescription = product.description;
            }

            navigate("GoToProductPage", [productName, productPrice, productDescription]);
        });

    });
    window.scrollTo({ top: 0, behavior: 'smooth' });

}



// Attach once: open the checkout modal + mount Stripe Elements


function changeQuantity(itemKey, amount) {
    if (!basket || !basket[itemKey]) return;

    const currentQty = Number(basket[itemKey].quantity) || 0;
    const nextQty = currentQty + (Number(amount) || 0);

    if (nextQty <= 0) {
        delete basket[itemKey];
    } else {
        basket[itemKey].quantity = nextQty;
    }

    // keep your multi-tab sync working
    if (typeof persistBasket === "function") {
        persistBasket("qty_change");
    } else {
        localStorage.setItem("basket", JSON.stringify(basket));
    }

    updateBasket();
}


function addToCart_legacy(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = '') {
    let quantity = cart[productName] || 1;
    cart[productName] = 1;

    const key = selectedOption ? `${productName} - ${selectedOption}` : productName;

    if (quantity > 0) {
        if (basket[key]) {
            basket[key].quantity += quantity;
        } else {
            basket[key] = {
                name: productName,
                price,
                image: imageUrl,
                quantity,
                expectedPurchasePrice,
                productLink,
                description: productDescription,
                ...(selectedOption && { selectedOption })
            };
        }

        persistBasket("add_to_cart");
        alert(`${quantity} x ${productName}${selectedOption ? ' (' + selectedOption + ')' : ''} added to cart!`);
    } else {
        alert("Please select at least one item.");
    }
}



function loadBasket() {
    updateBasket();
}


function filterProducts(searchTerm) {
    const filtered = [];

    for (const category in products) {
        const productList = products[category];

        if (Array.isArray(productList)) {
            const matches = productList.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            filtered.push(...matches);
        } else {
            console.warn(`⚠️ Skipped invalid product list in category: ${category}`);
        }
    }

    return filtered;
}












// ✅ Function to Navigate to a Product & Update URL


function slugifyName(name) {
    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function findProductById(productId) {
    const id = String(productId || "").trim();
    if (!id) return null;
    const byId = window.productsById || null;
    if (byId && byId[id]) return byId[id];
    // fallback: scan catalog
    try {
        const cats = window.products || productsDatabase || {};
        for (const arr of Object.values(cats)) {
            for (const p of (arr || [])) {
                if (String(p?.productId || "") === id) return p;
            }
        }
    } catch { }
    return null;
}

function findProductBySlug(slug) {
    const s = String(slug || "").trim().toLowerCase();
    if (!s) return null;
    try {
        const cats = window.products || productsDatabase || {};
        for (const arr of Object.values(cats)) {
            for (const p of (arr || [])) {
                const n = p?.name || "";
                if (slugifyName(n) === s) return p;
            }
        }
    } catch { }
    return null;
}

function findProductByName(name) {
    const nrm = normalizeProductKey(name);
    try {
        const cats = window.products || productsDatabase || {};
        for (const arr of Object.values(cats)) {
            for (const p of (arr || [])) {
                if (normalizeProductKey(p?.name || "") === nrm) return p;
            }
        }
    } catch { }
    return null;
}

function parseIncomingProductRef() {
    const sp = new URLSearchParams(window.location.search || "");
    const pid = sp.get("pid") || "";
    const pname = sp.get("product") || "";
    const path = String(window.location.pathname || "");

    // /p/<id>
    if (path.startsWith("/p/")) {
        const id = decodeURIComponent(path.slice(3).split("/")[0] || "");
        return { type: "id", value: id };
    }

    // /<slug> (ignore root and known routes)
    if (path && path !== "/" && !path.includes(".") && !path.startsWith("/order-status/")) {
        const slug = decodeURIComponent(path.slice(1).split("/")[0] || "");
        if (slug) return { type: "slug", value: slug };
    }

    if (pid) return { type: "id", value: pid };
    if (pname) return { type: "name", value: pname };
    return null;
}

function navigateToProduct(productName) {
    const formattedName = productName.toLowerCase().replace(/\s+/g, "-");

    // analytics: product clicked
    sendAnalyticsEvent('product_click', buildAnalyticsProductPayload(productName));

    history.pushState({}, "", `/${formattedName}`);
    GoToProductPage(productName, getProductPrice(productName), getProductDescription(productName));
}


// ✅ Function to Get Product Price
function getProductPrice(productName) {
    let product = Object.values(products).flat().find(p => p.name === productName);
    return product ? product.price : "N/A";
}

// ---------- CHECKOUT HELPERS (DROP-IN) ----------

// Reads a value from an input if present; returns "" if missing.
function _val(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
}

// Build a sanitized snapshot of the cart you already send to the server


// Helper for safe value access by ID (modal fields)

// Collects user details from your current checkout modal.
// IDs must match your inputs (Name, Surname, email, Street, City, Postal_Code, Country, Phone, State/Region, AddressLine2, OrderNote).
function collectUserDetails() {
    const v = _val;

    // Existing fields
    const name = v("Name");
    const surname = v("Surname");
    const email = v("email");
    const street = v("Street");        // Address line 1
    const city = v("City");
    const postalCode = v("Postal_Code");
    const country = v("Country");       // Prefer ISO-2 code if possible

    // New / optional
    const phone = v("Phone");                 // Important for shipping labels
    const region = v("State") || v("Region");  // State / province / region
    const address2 = v("AddressLine2");          // Apt / Suite / Unit
    const orderNote = v("OrderNote");

    return { name, surname, email, phone, street, address2, city, region, postalCode, country, orderNote };
}




function readCheckoutForm() {
    const get = (...ids) => {
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && typeof el.value === "string") {
                const v = el.value.trim();
                if (v) return v;
            }
        }
        return "";
    };

    // Prefer your existing collector if it exists, but still fallback robustly
    let d = null;
    try { if (typeof collectUserDetails === "function") d = collectUserDetails(); } catch { d = null; }

    return {
        name: (d?.name || get("Name")) || "",
        surname: (d?.surname || get("Surname")) || "",
        email: (d?.email || get("email")) || "",
        phone: (d?.phone || get("Phone")) || "",
        street: (d?.street || get("Street")) || "",
        address2: (d?.address2 || get("Address_Line2", "AddressLine2")) || "",
        city: (d?.city || get("City")) || "",
        state: (d?.region || d?.state || get("State", "Region")) || "",
        postalCode: (d?.postalCode || get("Postal_Code", "PostalCode")) || "",
        country: (d?.country || get("Country")) || "" // should be ISO-2 if your select uses ISO codes
    };
}







// ---- Stripe globals (keep only one set of these in the whole file) ----

function getApiBase() {
    // Uses your existing API_BASE if you have it, otherwise falls back to same-origin.
    return (typeof API_BASE !== "undefined" && API_BASE) ? API_BASE : "";
}

function readBasket() {
    try {
        const raw = localStorage.getItem("basket");
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}



function buildStripeSafeCart(fullCart) {
    return (fullCart || []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.unitPriceEUR || 0),              // server uses price/unitPriceEUR fallback for amount calc
        selectedOption: i.selectedOption || ""
    }));
}

function buildFullCartFromBasket() {
    const basketObj = readBasket();
    const items = Object.values(basketObj || {});
    return items
        .map((item) => {
            const unitEUR = Number(parseFloat(item?.price ?? item?.unitPriceEUR ?? 0) || 0);
            const expected = Number(parseFloat(item?.expectedPurchasePrice ?? 0) || 0);
            const qty = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);

            const out = {
                name: String(item?.name || "").slice(0, 120),
                quantity: qty,
                // keep server-compatible keys
                unitPriceEUR: Number(unitEUR.toFixed(2)),
                price: Number(unitEUR.toFixed(2)),
                expectedPurchasePrice: Number((expected || unitEUR).toFixed(2)),
                productLink: String(item?.productLink || "N/A").slice(0, 800),
                image: String(item?.image || "").slice(0, 800),
                description: String(item?.description || "").slice(0, 2000)
            };

            if (item?.selectedOption) out.selectedOption = String(item.selectedOption).slice(0, 120);
            return out;
        })
        .filter((i) => i.name && i.quantity > 0 && Number(i.price) > 0);
}

function getSelectedCountryCode() {
    const v =
        document.getElementById("countrySelect")?.value ||
        localStorage.getItem("detectedCountry") ||
        "US";
    return String(v).trim().toUpperCase();
}

function getApplyTariffFlag() {
    if (typeof serverApplyTariff === "boolean") return serverApplyTariff;
    const v = localStorage.getItem("applyTariff");
    if (v == null) return true;
    return v === "true";
}

function round2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round(x * 100) / 100;
}

function computeExpectedClientTotalForServer(fullCart, currency, countryCode) {
    const cur = String(currency || "EUR").toUpperCase();
    const cc = String(countryCode || "").toUpperCase();

    const baseEUR = (fullCart || []).reduce((sum, i) => {
        const qty = Math.max(1, parseInt(i?.quantity ?? 1, 10) || 1);
        const unit = Number(i?.unitPriceEUR ?? i?.price ?? 0) || 0;
        return sum + unit * qty;
    }, 0);

    let totalEUR = baseEUR;

    // NOTE: your tariffs.json values are decimals like 0.2 (= +20%), so use (1 + tariff).
    if (getApplyTariffFlag()) {
        const tariff = Number(tariffMultipliers?.[cc] ?? 0) || 0;
        totalEUR = totalEUR * (1 + tariff);
    }

    const rate = cur === "EUR" ? 1 : (Number(exchangeRates?.[cur] ?? 0) || 0);
    const totalInCurrency = cur === "EUR" ? totalEUR : (rate ? totalEUR * rate : 0);

    return round2(totalInCurrency);
}

function buildStripeOrderSummary(stripeCart) {
    return (stripeCart || [])
        .map((item) => {
            const name = String(item?.name || "");
            const shortName = name.length > 30 ? name.slice(0, 30) + "…" : name;
            const option = item?.selectedOption ? ` (${String(item.selectedOption).slice(0, 40)})` : "";
            const qty = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);
            return `${qty}x ${shortName}${option}`;
        })
        .join(", ")
        .slice(0, 499);
}

async function createPaymentIntentOnServer({ websiteOrigin, currency, country, fullCart, stripeCart }) {
    for (let attempt = 1; attempt <= 2; attempt++) {
        await preloadSettingsData();

        const expectedClientTotal = computeExpectedClientTotalForServer(fullCart, currency, country);
        const order_summary = buildStripeOrderSummary(stripeCart);

        const fxFetchedAt =
            (typeof exchangeRatesFetchedAt !== "undefined" && Number(exchangeRatesFetchedAt) > 0)
                ? Number(exchangeRatesFetchedAt)
                : (Number(window.exchangeRatesFetchedAt || 0) > 0 ? Number(window.exchangeRatesFetchedAt) : null);

        const turnstileToken = await snagletGetTurnstileToken({ forceFresh: true });

        const res = await fetch(`${API_BASE}/create-payment-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                websiteOrigin,
                currency,
                country,
                products: stripeCart,
                productsFull: fullCart,
                expectedClientTotal,
                applyTariff: getApplyTariffFlag(),
                metadata: { order_summary },
                fxFetchedAt,
                turnstileToken
            })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;

        const code = data?.error || data?.code;

        // Retry once: cache may be stale vs server FX history (especially after backend restart)
        if (res.status === 409 && attempt === 1 && (code === "FX_SNAPSHOT_NOT_FOUND" || code === "TOTAL_MISMATCH")) {
            // Backend may have restarted and forgotten the FX snapshot we cached.
            // Force a fresh settings preload and retry once.
            try { localStorage.removeItem(SETTINGS_CACHE_KEY); } catch { }
            window.exchangeRatesFetchedAt = 0;
            try { if (typeof exchangeRatesFetchedAt !== "undefined") exchangeRatesFetchedAt = 0; } catch { }
            try { _preloadSettingsPromise = null; } catch { }
            continue;
        }

        // existing error handling
        if (res.status === 409 && code === "FX_SNAPSHOT_NOT_FOUND") {
            const err = new Error(data?.message || "Exchange rate snapshot expired. Please refresh and try again.");
            err.code = "FX_SNAPSHOT_NOT_FOUND";
            err.details = data;
            throw err;
        }

        if (res.status === 409 && code === "TOTAL_MISMATCH") {
            const err = new Error(data?.message || "Pricing changed. Please refresh and try again.");
            err.code = "TOTAL_MISMATCH";
            err.details = data;
            throw err;
        }

        throw new Error(data?.error || data?.message || `Failed to create payment intent (${res.status})`);
    }
}


async function initStripePaymentUI(selectedCurrency) {
    // Ensure catalog data is loaded before rehydrating basket prices
    try {
        if (typeof initProducts === "function") await initProducts();
    } catch { }

    const fullCart = buildFullCartFromBasket();
    const stripeCart = buildStripeSafeCart(fullCart);

    if (!stripeCart.length) throw new Error("Basket is empty.");

    // analytics: begin checkout
    try {
        const items = buildAnalyticsCartItems(stripeCart);
        sendAnalyticsEvent('begin_checkout', {
            extra: {
                currency: selectedCurrency,
                country: getSelectedCountryCode(),
                itemsCount: items.length,
                items
            }
        });
    } catch { }
    const country = getSelectedCountryCode();

    const fallbackPk =
        "pk_test_51QvljKCvmsp7wkrwLSpmOlOkbs1QzlXX2noHpkmqTzB27Qb4ggzYi75F7rIyEPDGf5cuH28ogLDSQOdwlbvrZ9oC00J6B9lZLi";

    const publishableKey =
        window.STRIPE_PUBLISHABLE_KEY ||
        window.STRIPE_PUBLISHABLE ||
        fallbackPk;

    if (!window.stripeInstance) window.stripeInstance = Stripe(publishableKey);

    const websiteOrigin = window.location.origin;

    const data = await createPaymentIntentOnServer({
        websiteOrigin,
        currency: selectedCurrency,
        country,
        fullCart,
        stripeCart
    });

    const { clientSecret, orderId, paymentIntentId, amountCents, currency, orderPublicToken, orderStatusUrl } = data;

    // analytics: payment intent created (checkout progressing)
    try {
        sendAnalyticsEvent('checkout_intent_created', {
            extra: {
                orderId: data?.orderId || null,
                paymentIntentId: data?.paymentIntentId || null,
                amountCents: data?.amountCents || null,
                currency: data?.currency || null
            }
        });
    } catch { }
    window.latestClientSecret = clientSecret;
    window.latestOrderId = orderId || null;
    window.latestPaymentIntentId = paymentIntentId || null;

    window.latestOrderPublicToken = orderPublicToken || window.latestOrderPublicToken || null;
    window.latestOrderStatusUrl = orderStatusUrl || window.latestOrderStatusUrl || null;

    // Persist for customer self-service tracking (exercises GET /order-status)
    if (orderId && (orderPublicToken || window.latestOrderPublicToken)) {
        addRecentOrder({
            orderId,
            token: orderPublicToken || window.latestOrderPublicToken,
            orderStatusUrl: orderStatusUrl || null,
            paymentIntentId: paymentIntentId || null
        });
    }

    try { window.paymentElementInstance?.unmount?.(); } catch { }
    const paymentElContainer = document.getElementById("payment-element");
    if (paymentElContainer) paymentElContainer.innerHTML = "";

    window.elementsInstance = window.stripeInstance.elements({
        clientSecret,
        appearance: _getStripeAppearance()
    });

    window.paymentElementInstance = window.elementsInstance.create("payment");
    window.paymentElementInstance.mount("#payment-element");

    await setupWalletPaymentRequestButton({
        stripe: window.stripeInstance,
        clientSecret,
        amountCents,
        currency: (currency || selectedCurrency),
        country,
        orderId,
        paymentIntentId
    });
}




function attachConfirmHandlerOnce() {
    const btn = document.getElementById("confirm-payment-button");
    if (!btn || btn.dataset.listenerAttached === "true") return;

    btn.dataset.listenerAttached = "true";

    btn.addEventListener("click", async () => {
        const form = document.getElementById("paymentForm");
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Processing…";

        try {
            // Best-effort user details attach (same as your current pipeline)
            const userDetails = readCheckoutForm?.() || {};
            if (window.latestPaymentIntentId || window.latestOrderId) {
                await fetch(`${API_BASE}/store-user-details`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        paymentIntentId: window.latestPaymentIntentId,
                        orderId: window.latestOrderId,
                        clientSecret: window.latestClientSecret || null,
                        token: window.latestOrderPublicToken || null,
                        userDetails
                    })
                }).catch(() => { });
            }

            const clientSecret = window.latestClientSecret || null;
            const orderId = window.latestOrderId || null;
            const paymentIntentId = window.latestPaymentIntentId || null;

            // CRITICAL FIX: set pending BEFORE confirmPayment so redirects are safe
            setPaymentPendingFlag({ paymentIntentId, orderId, clientSecret });

            // return_url must be stable; Stripe will append redirect_status + PI params
            const returnUrl = new URL(window.location.href);
            stripStripeReturnParamsFromUrl(returnUrl);
            returnUrl.searchParams.set("stripe_return", "1");

            const { error, paymentIntent } = await window.stripeInstance.confirmPayment({
                elements: window.elementsInstance,
                confirmParams: { return_url: returnUrl.toString() },
                redirect: "if_required"
            });

            if (error) {
                // confirm not submitted successfully
                clearPaymentPendingFlag();
                throw error;
            }

            // If Stripe did NOT redirect, we may get a PI back
            if (paymentIntent?.status === "succeeded") {
                clearPaymentPendingFlag();
                clearBasketCompletely();
                try { clearCheckoutDraft(); } catch { }
                setPaymentSuccessFlag({ reloadOnOk: true });
                window.location.replace(window.location.origin);
                return;
            }

            if (paymentIntent?.id) {
                // Keep pending + poll server until final (processing, etc.)
                setPaymentPendingFlag({
                    paymentIntentId: paymentIntent.id,
                    orderId: orderId || null,
                    clientSecret
                });

                const { status } = await pollPendingPaymentUntilFinal({ paymentIntentId: paymentIntent.id });

                if (status === "succeeded") {
                    clearPaymentPendingFlag();
                    clearBasketCompletely();
                    try { clearCheckoutDraft(); } catch { }
                    setPaymentSuccessFlag({ reloadOnOk: true });
                    window.location.replace(window.location.origin);
                    return;
                }

                if (status === "requires_payment_method" || status === "canceled") {
                    clearPaymentPendingFlag();
                    alert("Payment did not complete. Your cart is still saved—please try again.");
                    return;
                }

                alert("Payment is still processing. Your cart is unchanged. Check again in a moment.");
                return;
            }

            // If Stripe redirected, this code path usually won’t run.
            // Pending flag is already set; the return handler will resolve it.
        } catch (e) {
            console.error("confirmPayment failed:", e);
            alert(e?.message || "Payment could not be completed.");
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}




async function setupCheckoutFlow(selectedCurrency) {
    const payBtn = document.getElementById("confirm-payment-button");
    const paymentSlot = document.getElementById("payment-element");
    const walletSlot = document.getElementById("payment-request-button");

    try {
        if (payBtn) payBtn.disabled = true;
        if (walletSlot) walletSlot.innerHTML = "";

        if (paymentSlot) {
            paymentSlot.innerHTML = `
          <div style="padding:10px 12px;border:1px solid rgba(0,0,0,.15);border-radius:12px">
            Loading payment options…
          </div>`;
        }

        // Mounts Stripe elements into #payment-element
        await initStripePaymentUI(selectedCurrency);

        attachConfirmHandlerOnce();

        if (payBtn) payBtn.disabled = false;
    } catch (e) {
        console.error("setupCheckoutFlow failed:", e);

        if (payBtn) payBtn.disabled = true;

        if (paymentSlot) {
            const msg = String(e?.message || "Checkout initialization failed.");
            paymentSlot.innerHTML = `
          <div style="padding:10px 12px;border:1px solid rgba(255,0,0,.35);border-radius:12px">
            <strong>Payment UI could not load.</strong><br>${msg}<br><br>
            Common causes: Stripe.js blocked, API error, or empty cart.
          </div>`;
        }

        alert(e?.message || "Checkout initialization failed. Please try again.");
    }
}


function _replaceWithClone(el) {
    if (!el || !el.parentNode) return el;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
}

function _getDetectedCountry() {
    return String(localStorage.getItem("detectedCountry") || "US").toUpperCase();
}

function _syncSelectedCurrencyFromCountry(countryCode) {
    if (localStorage.getItem("manualCurrencyOverride")) return;

    const cc = String(countryCode || "").toUpperCase();
    const next = countryToCurrency?.[cc];
    if (next) {
        selectedCurrency = next;
        localStorage.setItem("selectedCurrency", selectedCurrency);
        if (typeof syncCurrencySelects === "function") syncCurrencySelects(selectedCurrency);
    }
}

function _fillCountrySelectOptions(selectEl) {
    // Prefer preloadedData (built from /tariffs in your earlier changes)
    const arr =
        (window.preloadedData?.countries?.length && window.preloadedData.countries) ||
        (typeof tariffsObjectToCountriesArray === "function"
            ? tariffsObjectToCountriesArray(tariffMultipliers)
            : []);

    selectEl.innerHTML = "";
    for (const c of arr) {
        const code = String(c.code || "").toUpperCase();
        if (!code) continue;
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = (typeof countryNames === "object" && countryNames?.[code]) ? countryNames[code] : code;
        selectEl.appendChild(opt);
    }
}

function _setupTomSelectCountry(selectEl) {
    try { if (selectEl.tomselect) selectEl.tomselect.destroy(); } catch { }
    if (typeof TomSelect !== "function") return;

    new TomSelect(selectEl, {
        maxOptions: 1000,
        sortField: { field: "text", direction: "asc" },
        closeAfterSelect: true,
        placeholder: "Select a country…"
    });
}

async function initPaymentModalLogic() {
    // Ensure tariffs + rates exist (from your earlier preloadSettingsData rewrite)
    if (typeof preloadSettingsData === "function") {
        await preloadSettingsData();
    }
    if (typeof fetchTariffs === "function") {
        await fetchTariffs();
    }

    // Remove legacy listeners that may still exist inside createPaymentModal()
    let confirmBtn = document.getElementById("confirm-payment-button");
    if (confirmBtn) confirmBtn = _replaceWithClone(confirmBtn);

    let countrySelect = document.getElementById("Country");
    if (countrySelect) countrySelect = _replaceWithClone(countrySelect);

    // Populate + initialize Country select (modal)
    if (countrySelect) {
        _fillCountrySelectOptions(countrySelect);

        const detected = _getDetectedCountry();
        countrySelect.value = detected;
        localStorage.setItem("detectedCountry", detected);

        _setupTomSelectCountry(countrySelect);

        countrySelect.addEventListener("change", async () => {
            const cc = String(countrySelect.value || "").toUpperCase();
            localStorage.setItem("detectedCountry", cc);

            _syncSelectedCurrencyFromCountry(cc);

            if (typeof updateAllPrices === "function") updateAllPrices();

            // Recreate PI + remount Stripe Elements (server-truth)
            await setupCheckoutFlow(selectedCurrency);
        });
    }

    // Initialize Stripe UI once on open (server-truth)
    selectedCurrency = localStorage.getItem("selectedCurrency") || selectedCurrency || "EUR";
    await setupCheckoutFlow(selectedCurrency);
}




(function attachPayButtonHandlerOnce() {
    if (window.__payButtonHandlerAttached) return;
    window.__payButtonHandlerAttached = true;

    const onClick = async (event) => {
        const btn = event?.target?.closest?.(".PayButton");
        if (!btn) return;

        event.preventDefault();

        // Avoid double-clicks creating multiple modals
        const wasDisabled = btn.disabled;
        btn.disabled = true;

        try {
            await openModal();
        } catch (e) {
            console.error("openModal() failed:", e);
            alert("Could not initialize checkout. Please try again.");
        } finally {
            btn.disabled = wasDisabled;
        }
    };

    // Safer than `document.body` if the script runs in <head>
    document.addEventListener("click", onClick);
})();


/* ===== PATCH 2026-01-29: Storefront security + multi-options + option→image =====
   - Eliminates stored XSS vectors on product page rendering (no innerHTML for product fields)
   - Supports multiple option groups (productOptions, productOptions2, ... OR optionGroups[])
   - Supports option→image mapping (productOptionImageMap, productOptionImageMap2, ... OR optionGroups[].imageByOption)
   - Persists selectedOptions[] into basket + checkout payload for backend/admin
*/
function __ssEscHtml(input) {
    const s = String(input ?? "");
    return s.replace(/[&<>"'`]/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
        "`": "&#96;"
    }[ch] || ch));
}

function __ssGetCatalogFlat() {
    try {
        if (Array.isArray(window.productsFlatFromServer) && window.productsFlatFromServer.length) {
            return window.productsFlatFromServer;
        }

        const base =
            (typeof products !== "undefined" && products) ? products :
                ((typeof productsDatabase !== "undefined" && productsDatabase) ? productsDatabase : (window.products || {}));
        return Object.values(base || {}).flat();
    } catch {
        return [];
    }
}

function __ssExtractOptionGroups(product) {
    const p = product || {};
    // Preferred: optionGroups
    if (Array.isArray(p.optionGroups) && p.optionGroups.length) {
        return p.optionGroups
            .map((g, idx) => {
                const label = String(g?.label ?? g?.name ?? `Option ${idx + 1}`).trim().replace(/:$/, "");
                const options = Array.isArray(g?.options) ? g.options.map(x => String(x).trim()).filter(Boolean) : [];
                const imageByOption = (g && typeof g.imageByOption === "object" && g.imageByOption) ? g.imageByOption : null;
                const key = String(g?.key ?? label.toLowerCase().replace(/\s+/g, "_") ?? `opt${idx + 1}`);
                return { key, label, options, imageByOption };
            })
            .filter(g => g.options.length > 0);
    }

    // Legacy: productOptions / productOptions2 / ...
    const groups = [];
    for (let i = 1; i <= 10; i++) {
        const k = (i === 1) ? "productOptions" : `productOptions${i}`;
        const arr = p[k];
        if (!Array.isArray(arr) || arr.length < 2) continue;

        const [labelRaw, ...optsRaw] = arr;
        const label = String(labelRaw ?? `Option ${i}`).trim().replace(/:$/, "");
        const options = optsRaw.map(x => String(x).trim()).filter(Boolean);
        if (!options.length) continue;

        const map =
            (i === 1)
                ? (p.productOptionImageMap || p.productOptionImageMap1 || null)
                : (p[`productOptionImageMap${i}`] || null);

        groups.push({
            key: label.toLowerCase().replace(/\s+/g, "_") || `opt${i}`,
            label,
            options,
            imageByOption: (map && typeof map === "object") ? map : null
        });
    }
    return groups;
}

function __ssNormalizeSelectedOptions(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const x of raw) {
        const label = String(x?.label ?? "").trim().replace(/:$/, "");
        const value = String(x?.value ?? "").trim();
        if (!label || !value) continue;
        out.push({ label, value });
        if (out.length >= 10) break;
    }
    return out;
}

function __ssDefaultSelectedOptions(groups) {
    return (groups || [])
        .map(g => ({ label: String(g.label || "Option").trim().replace(/:$/, ""), value: String(g.options?.[0] ?? "").trim() }))
        .filter(o => o.label && o.value);
}

function __ssFormatSelectedOptionsDisplay(selectedOptions) {
    const sel = __ssNormalizeSelectedOptions(selectedOptions);
    return sel.map(o => `${o.label}: ${o.value}`).join(", ");
}

function __ssFormatSelectedOptionsKey(selectedOptions) {
    const sel = __ssNormalizeSelectedOptions(selectedOptions);
    return sel.map(o => `${o.label}=${o.value}`).join(" | ");
}

function __ssApplyOptionImageMapping(group, optionValue, validImages) {
    const map = (group && typeof group.imageByOption === "object" && group.imageByOption) ? group.imageByOption : null;
    if (!map) return false;
    const mapped = map[optionValue];
    if (mapped === undefined || mapped === null || mapped === "") return false;

    const imgs = Array.isArray(validImages) ? validImages : (window.currentProductImages || []);
    const main = document.getElementById("mainImage");

    if (typeof mapped === "number" && Number.isFinite(mapped)) {
        const idx = Math.max(0, Math.min(imgs.length - 1, Math.floor(mapped)));
        if (imgs[idx]) {
            window.currentIndex = idx;
            updateImage();
            return true;
        }
        return false;
    }

    const url = String(mapped).trim();
    if (!url) return false;

    const idx = imgs.indexOf(url);
    if (idx !== -1) {
        window.currentIndex = idx;
        updateImage();
        return true;
    }

    if (main) {
        main.src = url;
        return true;
    }
    return false;
}

function __ssSetSelectedOptions(sel) {
    const norm = __ssNormalizeSelectedOptions(sel);
    window.selectedProductOptions = norm;
    window.selectedProductOption = norm?.[0]?.value || "";
}

function __ssGetSelectedOptions() {
    return __ssNormalizeSelectedOptions(window.selectedProductOptions || []);
}

/* Override: safer thumbnail active handling */
function updateImage(direction = "none") {
    const imageElement = document.getElementById("mainImage");
    const imgs = window.currentProductImages || [];
    const idx = Number(window.currentIndex || 0);

    if (imageElement && imgs[idx]) {
        if (direction === "right") {
            imageElement.style.transform = "translateX(100vw)";
            setTimeout(() => {
                imageElement.src = imgs[idx];
                imageElement.style.transition = "none";
                imageElement.style.transform = "translateX(-100vw)";
                void imageElement.offsetWidth;
                imageElement.style.transition = "transform 0.4s ease";
                imageElement.style.transform = "translateX(0)";
            }, 100);
        } else if (direction === "left") {
            imageElement.style.transform = "translateX(-100vw)";
            setTimeout(() => {
                imageElement.src = imgs[idx];
                imageElement.style.transition = "none";
                imageElement.style.transform = "translateX(100vw)";
                void imageElement.offsetWidth;
                imageElement.style.transition = "transform 0.4s ease";
                imageElement.style.transform = "translateX(0)";
            }, 100);
        } else {
            imageElement.src = imgs[idx];
        }
    }

    const thumbs = document.querySelectorAll(".Thumbnail");
    thumbs.forEach(t => t.classList.remove("active"));
    if (thumbs[idx]) thumbs[idx].classList.add("active");
}

/* Override: safe product page with multi-options + option→image mapping */
function GoToProductPage(productName, productPrice, productDescription) {
    console.log("Product clicked:", productName);
    // analytics: product opened (viewer)
    sendAnalyticsEvent('product_open', buildAnalyticsProductPayload(productName, { priceEUR: productPrice }));
    try { clearCategoryHighlight(); } catch { }

    const viewer = document.getElementById("Viewer");
    if (!viewer) {
        console.error(TEXTS?.ERRORS?.PRODUCTS_NOT_LOADED || "Viewer not found.");
        return;
    }

    viewer.innerHTML = "";
    try { removeSortContainer(); } catch { }

    const product = __ssGetCatalogFlat().find(p => p?.name === productName);
    if (!product || !Array.isArray(product.images) || product.images.length === 0) {
        console.error("❌ Product not found or no images:", productName);
        return;
    }

    const imagePromises = product.images.map(src => new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
    }));

    Promise.all(imagePromises).then(loadedImages => {
        const validImages = loadedImages.filter(Boolean);
        if (validImages.length === 0) {
            console.error("❌ No valid images loaded for:", productName);
            viewer.innerHTML = `<p>${__ssEscHtml(TEXTS?.ERRORS?.PRODUCTS_NOT_LOADED || "Products not loaded")}</p>`;
            return;
        }
        renderProductPage(product, validImages, productName, productPrice, productDescription);
    });
}

function renderProductPage(product, validImages, productName, productPrice, productDescription) {
    const viewer = document.getElementById("Viewer");
    if (!viewer) return;

    const existing = document.getElementById("Product_Viewer");
    if (existing) existing.remove();

    const Product_Viewer = document.createElement("div");
    Product_Viewer.id = "Product_Viewer";
    Product_Viewer.className = "Product_Viewer";

    window.currentProductImages = Array.isArray(validImages) ? validImages : [];
    window.currentIndex = 0;

    if (typeof cart === "object" && cart) cart[productName] = 1;

    const productDiv = document.createElement("div");
    productDiv.className = "Product_Detail_Page";

    const details = document.createElement("div");
    details.className = "Product_Details";

    // ----- Images column -----
    const imagesCol = document.createElement("div");
    imagesCol.className = "Product_Images";

    const imageControl = document.createElement("div");
    imageControl.className = "ImageControl";

    const prevBtn = document.createElement("button");
    prevBtn.className = "ImageControlButtonPrevious";
    prevBtn.type = "button";
    prevBtn.addEventListener("click", (e) => { e.preventDefault(); try { prevImage(); } catch { } });

    const prevTxt = document.createElement("div");
    prevTxt.className = "ImageControlButtonText";
    prevTxt.textContent = TEXTS?.PRODUCT_SECTION?.IMAGE_NAV?.PREVIOUS || "Prev";
    prevBtn.appendChild(prevTxt);

    const wrapper = document.createElement("div");
    wrapper.className = "image-slider-wrapper";

    const mainImg = document.createElement("img");
    mainImg.id = "mainImage";
    mainImg.className = "mainImage slide-image";
    mainImg.src = window.currentProductImages[0] || "";
    mainImg.alt = productName || "";
    wrapper.appendChild(mainImg);

    const nextBtn = document.createElement("button");
    nextBtn.className = "ImageControlButtonNext";
    nextBtn.type = "button";
    nextBtn.addEventListener("click", (e) => { e.preventDefault(); try { nextImage(); } catch { } });

    const nextTxt = document.createElement("div");
    nextTxt.className = "ImageControlButtonText";
    nextTxt.textContent = TEXTS?.PRODUCT_SECTION?.IMAGE_NAV?.NEXT || "Next";
    nextBtn.appendChild(nextTxt);

    imageControl.append(prevBtn, wrapper, nextBtn);

    const thumbsHolder = document.createElement("div");
    thumbsHolder.className = "ThumbnailsHolder";

    (window.currentProductImages || []).forEach((src, idx) => {
        const t = document.createElement("img");
        t.className = `Thumbnail${idx === 0 ? " active" : ""}`;
        t.src = src;
        t.alt = `${productName || "image"} ${idx + 1}`;
        t.addEventListener("click", (e) => {
            e.preventDefault();
            window.currentIndex = idx;
            updateImage();
        });
        thumbsHolder.appendChild(t);
    });

    imagesCol.append(imageControl, thumbsHolder);

    // ----- Info column -----
    const infoCol = document.createElement("div");
    infoCol.className = "Product_Info";

    const heading = document.createElement("div");
    heading.className = "Product_Name_Heading";
    heading.textContent = productName || "";

    const desc = document.createElement("div");
    desc.className = "Product_Description";
    desc.textContent = (productDescription && String(productDescription).trim())
        ? String(productDescription)
        : (TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || "");

    infoCol.append(heading, desc);

    // Options (multi)
    const groups = __ssExtractOptionGroups(product);
    const defaultSel = __ssDefaultSelectedOptions(groups);
    __ssSetSelectedOptions(defaultSel);

    if (groups.length) {
        groups.forEach((g, gIdx) => {
            const container = document.createElement("div");
            container.className = "Product_Options_Container";
            container.dataset.groupIndex = String(gIdx);

            const labelWrap = document.createElement("div");
            labelWrap.className = "Product_Option_Label";

            const strong = document.createElement("strong");
            strong.textContent = `${g.label}:`;
            labelWrap.appendChild(strong);

            const btnWrap = document.createElement("div");
            btnWrap.className = "Product_Option_Buttons";

            const selVal = defaultSel?.[gIdx]?.value || g.options[0];

            g.options.forEach((opt) => {
                const b = document.createElement("button");
                b.type = "button";
                b.className = `Product_Option_Button${opt === selVal ? " selected" : ""}`;
                b.textContent = opt;

                b.addEventListener("click", (e) => {
                    e.preventDefault();

                    // toggle selected class within this group only
                    btnWrap.querySelectorAll(".Product_Option_Button").forEach(x => x.classList.remove("selected"));
                    b.classList.add("selected");

                    const current = __ssGetSelectedOptions();
                    while (current.length < groups.length) {
                        const gg = groups[current.length];
                        current.push({ label: gg.label, value: gg.options[0] });
                    }
                    current[gIdx] = { label: g.label, value: opt };
                    __ssSetSelectedOptions(current);

                    // Option→image mapping (if configured)
                    __ssApplyOptionImageMapping(g, opt, window.currentProductImages);
                });

                btnWrap.appendChild(b);
            });

            container.append(labelWrap, btnWrap);
            infoCol.appendChild(container);
        });

        // Apply mapping for default selections (first group that has a mapping hit)
        for (let i = 0; i < groups.length; i++) {
            const sel = __ssGetSelectedOptions();
            const v = sel?.[i]?.value;
            if (__ssApplyOptionImageMapping(groups[i], v, window.currentProductImages)) break;
        }
    }

    // Price
    const priceLabel = document.createElement("div");
    priceLabel.className = "Product_Price_Label";

    const pStrong = document.createElement("strong");
    pStrong.textContent = `${TEXTS?.PRODUCT_SECTION?.PRICE_LABEL || "Price"} `;
    const pSpan = document.createElement("span");
    pSpan.id = "product-page-price";
    pSpan.className = "productPrice";
    pSpan.dataset.eur = String(productPrice ?? "");
    pSpan.textContent = `${productPrice} ${TEXTS?.CURRENCIES?.EUR || "€"}`;

    priceLabel.append(pStrong, pSpan);
    infoCol.appendChild(priceLabel);

    // Quantity + Add to cart
    const qtyWrap = document.createElement("div");
    qtyWrap.className = "ProductPageQuantityContainer";

    const qtyControls = document.createElement("div");
    qtyControls.className = "Quantity_Controls_ProductPage";

    const dec = document.createElement("button");
    dec.className = "Button";
    dec.type = "button";
    dec.textContent = TEXTS?.BASKET?.BUTTONS?.DECREASE || "-";
    dec.addEventListener("click", (e) => { e.preventDefault(); try { decreaseQuantity(productName); } catch { } });

    const qtySpan = document.createElement("span");
    qtySpan.className = "WhiteText";
    qtySpan.id = `quantity-${productName}`;
    qtySpan.textContent = "1";

    const inc = document.createElement("button");
    inc.className = "Button";
    inc.type = "button";
    inc.textContent = TEXTS?.BASKET?.BUTTONS?.INCREASE || "+";
    inc.addEventListener("click", (e) => { e.preventDefault(); try { increaseQuantity(productName); } catch { } });

    qtyControls.append(dec, qtySpan, inc);

    const addBtn = document.createElement("button");
    addBtn.className = "add-to-cart-product";
    addBtn.type = "button";
    addBtn.innerHTML = `
    <span style="display:flex;align-items:center;gap:6px;">
      ${__ssEscHtml(TEXTS?.PRODUCT_SECTION?.ADD_TO_CART || "Add to cart")}
      <svg class="cart-icon-product" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
        <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  `;

    addBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const mainSrc = document.getElementById("mainImage")?.src || window.currentProductImages?.[0] || "";
        const sel = __ssGetSelectedOptions();
        const legacy = sel?.[0]?.value || "";
        addToCart(
            productName,
            parseFloat(productPrice) || Number(productPrice) || 0,
            mainSrc,
            product.expectedPurchasePrice,
            product.productLink,
            productDescription,
            legacy,
            sel
        );
    });

    qtyWrap.append(qtyControls, addBtn);
    infoCol.appendChild(qtyWrap);

    const buyBtn = document.createElement("button");
    buyBtn.className = "ProductPageBuyButton";
    buyBtn.type = "button";
    buyBtn.textContent = TEXTS?.PRODUCT_SECTION?.BUY_NOW || "Buy now";
    buyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const mainSrc = document.getElementById("mainImage")?.src || window.currentProductImages?.[0] || "";
        const sel = __ssGetSelectedOptions();
        const legacy = sel?.[0]?.value || "";
        buyNow(
            productName,
            parseFloat(productPrice) || Number(productPrice) || 0,
            mainSrc,
            product.expectedPurchasePrice,
            product.productLink,
            productDescription,
            legacy,
            sel
        );
    });

    infoCol.appendChild(buyBtn);

    // Assemble
    details.append(imagesCol, infoCol);
    productDiv.appendChild(details);
    Product_Viewer.appendChild(productDiv);
    viewer.appendChild(Product_Viewer);

    // Swipe support (non-breaking)
    try {
        let touchStartX = 0;
        let touchEndX = 0;
        mainImg.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].screenX; });
        mainImg.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const threshold = 50;
            if (touchEndX < touchStartX - threshold) nextImage();
            else if (touchEndX > touchStartX + threshold) prevImage();
        });
    } catch { }

    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { }
    try { updateAllPrices(); } catch { }
    try { updateImage(); } catch { }
}

/* Override: buyNow forwards selectedOptions */
function buyNow(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "", selectedOptions = null) {
    const qtyEl = document.getElementById(`quantity-${productName}`);
    const quantity = Math.max(1, parseInt(qtyEl?.innerText || "1", 10) || 1);
    if (typeof cart === "object" && cart) cart[productName] = quantity;
    addToCart(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption, selectedOptions);
    try { navigate("GoToCart"); } catch { try { GoToCart(); } catch { } }
}

/* Override: addToCart stores selectedOptions and uses option-combo key */
function addToCart(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "", selectedOptions = null) {
    const _pRef = findProductByNameParam(productName) || {};
    const productIdForCart = String(_pRef.productId || "").trim() || String(extractProductIdFromLink(productLink) || "").trim() || null;

    const qty = (typeof cart === "object" && cart && cart[productName]) ? (parseInt(cart[productName], 10) || 1) : 1;
    if (typeof cart === "object" && cart) cart[productName] = 1;

    // Normalize selected options
    let selOpts = __ssNormalizeSelectedOptions(selectedOptions);

    // Back-compat: if only legacy selectedOption provided, wrap it
    if (!selOpts.length && selectedOption) {
        const p = __ssGetCatalogFlat().find(pp => pp?.name === productName) || {};
        const groups = __ssExtractOptionGroups(p);
        const label = (groups?.[0]?.label) ? groups[0].label : "Option";
        selOpts = [{ label, value: String(selectedOption).trim() }];
    }

    // Ensure legacy selectedOption reflects first group
    if (!selectedOption && selOpts.length) selectedOption = selOpts[0].value;

    const key = selOpts.length ? `${productName} - ${__ssFormatSelectedOptionsKey(selOpts)}` : (selectedOption ? `${productName} - ${selectedOption}` : productName);

    if (qty > 0) {
        if (basket && basket[key]) {
            basket[key].quantity += qty;
            // keep latest selections
            if (selOpts.length) basket[key].selectedOptions = selOpts;
            if (selectedOption) basket[key].selectedOption = selectedOption;
        } else {
            basket[key] = {
                name: productName,
                price,
                image: imageUrl,
                quantity: qty,
                productId: productIdForCart,
                expectedPurchasePrice,
                productLink,
                description: productDescription,
                ...(selectedOption ? { selectedOption } : {}),
                ...(selOpts.length ? { selectedOptions: selOpts } : {})
            };
        }

        try {
            if (typeof persistBasket === "function") persistBasket("add_to_cart");
            else localStorage.setItem("basket", JSON.stringify(basket));
        } catch {
            try { localStorage.setItem("basket", JSON.stringify(basket)); } catch { }
        }

        // analytics: add to cart
        try {
            const payload = buildAnalyticsProductPayload(productName, { priceEUR: price, productLink, productId: productIdForCart });
            payload.extra = { selectedOption: selectedOption || "", selectedOptions: selOpts || null, qty: qty };
            sendAnalyticsEvent('add_to_cart', payload);
        } catch { }
        const optMsg = selOpts.length ? ` (${__ssFormatSelectedOptionsDisplay(selOpts)})` : (selectedOption ? ` (${selectedOption})` : "");
        alert(`${qty} x ${productName}${optMsg} added to cart!`);
    } else {
        alert("Please select at least one item.");
    }
}

/* Override: checkout cart builders include selectedOptions */
function buildStripeSafeCart(fullCart) {
    return (fullCart || []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.unitPriceEUR || i.price || 0),
        selectedOption: i.selectedOption || "",
        selectedOptions: __ssNormalizeSelectedOptions(i.selectedOptions || [])
    }));
}

function buildFullCartFromBasket() {
    const basketObj = (typeof readBasket === "function") ? readBasket() : (() => {
        try { return JSON.parse(localStorage.getItem("basket") || "{}"); } catch { return {}; }
    })();

    const items = Object.values(basketObj || {});
    return items
        .map((item) => {
            const unitEUR = Number(parseFloat(item?.price ?? item?.unitPriceEUR ?? 0) || 0);
            const expected = Number(parseFloat(item?.expectedPurchasePrice ?? 0) || 0);
            const qty = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);

            const out = {
                name: String(item?.name || "").slice(0, 120),
                quantity: qty,
                unitPriceEUR: Number(unitEUR.toFixed(2)),
                price: Number(unitEUR.toFixed(2)),
                expectedPurchasePrice: Number((expected || unitEUR).toFixed(2)),
                productLink: String(item?.productLink || "N/A").slice(0, 800),
                image: String(item?.image || "").slice(0, 800),
                description: String(item?.description || "").slice(0, 2000)
            };

            if (item?.selectedOption) out.selectedOption = String(item.selectedOption).slice(0, 120);
            const sel = __ssNormalizeSelectedOptions(item?.selectedOptions || []);
            if (sel.length) out.selectedOptions = sel;

            return out;
        })
        .filter((i) => i.name && i.quantity > 0 && Number(i.price) > 0);
}

function buildStripeOrderSummary(stripeCart) {
    return (stripeCart || [])
        .map((item) => {
            const name = String(item?.name || "");
            const shortName = name.length > 30 ? name.slice(0, 30) + "…" : name;
            const sel = __ssNormalizeSelectedOptions(item?.selectedOptions || []);
            const opt = sel.length ? ` (${__ssFormatSelectedOptionsDisplay(sel).slice(0, 80)})` :
                (item?.selectedOption ? ` (${String(item.selectedOption).slice(0, 40)})` : "");
            const qty = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);
            return `${qty}x ${shortName}${opt}`;
        })
        .join(", ")
        .slice(0, 499);
}

/* Override: basket rendering escapes user/product strings and shows multi-options */
function updateBasket() {
    let basketContainer = document.getElementById("Basket_Viewer");

    if (!basketContainer) {
        const viewer = document.getElementById("Viewer");
        if (!viewer) return;
        basketContainer = document.createElement("div");
        basketContainer.id = "Basket_Viewer";
        basketContainer.classList.add("Basket_Viewer");
        viewer.appendChild(basketContainer);
    }

    basketContainer.innerHTML = "";

    if (!basket || Object.keys(basket).length === 0) {
        basketContainer.innerHTML = `<p class='EmptyBasketMessage'>${__ssEscHtml(TEXTS?.BASKET?.EMPTY || "The basket is empty!")}</p>`;
        return;
    }

    let totalSum = 0;

    Object.entries(basket).forEach(([key, item]) => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("Basket_Item_Container");

        const value = Number(parseFloat(item?.price) || 0);
        const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);
        const itemTotal = (value * qty);
        totalSum += itemTotal;

        const encName = encodeURIComponent(String(item?.name || ""));
        const safeName = __ssEscHtml(item?.name || "");
        const safeDesc = __ssEscHtml(item?.description || "");
        const safeImg = __ssEscHtml(item?.image || "");

        let optionText = "";
        const sel = __ssNormalizeSelectedOptions(item?.selectedOptions || []);
        if (sel.length) optionText = `Selected: ${__ssFormatSelectedOptionsDisplay(sel)}`;
        else if (item?.selectedOption) optionText = `Selected option: ${String(item.selectedOption)}`;

        const selectedOptionHTML = optionText
            ? `<span class="BasketSelectedOption">${__ssEscHtml(optionText)}</span>`
            : "";

        productDiv.innerHTML = `
      <div class="Basket-Item">
        <a href="https://www.snagletshop.com/?product=${encName}" target="_blank" rel="noopener noreferrer">
          <img class="Basket_Image"
               src="${safeImg}"
               alt="${safeName}"
               data-name="${safeName}"
               data-price="${__ssEscHtml(item?.price ?? "")}"
               data-description="${safeDesc}"
               data-imageurl="${safeImg}">
        </a>
        <div class="Item-Details">
          <a href="https://www.snagletshop.com/?product=${encName}" target="_blank" rel="noopener noreferrer" class="BasketText">
            <strong class="BasketText">${safeName.length > 15 ? safeName.slice(0, 15) + "…" : safeName}</strong>
          </a>
          <p class="BasketTextDescription">${safeDesc}</p>
          <div class="PriceAndOptionRow">
            <p class="basket-item-price" data-eur="${itemTotal.toFixed(2)}">${itemTotal.toFixed(2)}€</p>
            ${selectedOptionHTML}
          </div>
        </div>
        <div class="Quantity-Controls-Basket">
          <button class="BasketChangeQuantityButton" type="button"
                  data-key="${encodeURIComponent(key)}" data-delta="-1">${__ssEscHtml(TEXTS?.BASKET?.BUTTONS?.DECREASE || "-")}</button>
          <span class="BasketChangeQuantityText">${qty}</span>
          <button class="BasketChangeQuantityButton" type="button"
                  data-key="${encodeURIComponent(key)}" data-delta="1">${__ssEscHtml(TEXTS?.BASKET?.BUTTONS?.INCREASE || "+")}</button>
        </div>
      </div>
    `;

        basketContainer.appendChild(productDiv);
    });

    const receiptDiv = document.createElement("div");
    receiptDiv.classList.add("BasketReceipt");

    let receiptContent = `<div class="Basket-Item-Pay"><table class="ReceiptTable">`;

    Object.entries(basket).forEach(([k, item]) => {
        const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);
        const unit = Number(parseFloat(item?.price) || 0);
        const itemTotal = unit * qty;

        const name = __ssEscHtml(item?.name || "");
        const sel = __ssNormalizeSelectedOptions(item?.selectedOptions || []);
        const opt = sel.length ? ` (${__ssEscHtml(__ssFormatSelectedOptionsDisplay(sel))})` :
            (item?.selectedOption ? ` (${__ssEscHtml(String(item.selectedOption))})` : "");

        receiptContent += `
      <tr>
        <td>${qty} ×</td>
        <td>${name}${opt}</td>
        <td class="basket-item-price" data-eur="${itemTotal.toFixed(2)}">${itemTotal.toFixed(2)}€</td>
      </tr>
    `;
    });

    receiptContent += `</table></div>`;
    receiptContent += `
    <div class="ReceiptFooter">
      <button class="PayButton">${__ssEscHtml(TEXTS?.PRODUCT_SECTION?.BUY_NOW || "Buy now")}</button>
      <strong class="PayTotalText" id="basket-total" data-eur="${totalSum.toFixed(2)}">Total: ${totalSum.toFixed(2)}€</strong>
    </div>
  `;

    receiptDiv.innerHTML = receiptContent;
    basketContainer.appendChild(receiptDiv);

    // Keep existing event delegation behavior for qty buttons
    if (!basketContainer.dataset.qtyBound) {
        basketContainer.dataset.qtyBound = "1";
        basketContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".BasketChangeQuantityButton");
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const k = decodeURIComponent(btn.dataset.key || "");
            const delta = parseInt(btn.dataset.delta || "0", 10) || 0;
            try { changeQuantity(k, delta); } catch { }
        });
    }

    try { updateAllPrices(); } catch { }
}






