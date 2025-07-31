
window.functionBlacklist = new Set([

]);
const AUTO_UPDATE_CURRENCY_ON_COUNTRY_CHANGE = true;
const APPLY_TARIFF = true; // 🔁 You can toggle this manually
localStorage.setItem("applyTariff", APPLY_TARIFF.toString());


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
    ZW: "Zimbabwe"
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

const preloadedImages = new Set();


let selectedCurrency = "EUR";
try {
    selectedCurrency = localStorage.getItem("selectedCurrency") || "EUR";
} catch (err) {
    console.warn("⚠️ Could not access localStorage:", err);
}
const searchInput = document.getElementById("Search_Bar");
const mobileSearchInput = document.getElementById("Mobile_Search_Bar");
const navEntry = performance.getEntriesByType("navigation")[0];
const productsDatabase = products;
const isPageRefresh = navEntry?.type === "reload";
const SETTINGS_CACHE_KEY = "preloadedSettings";
const SETTINGS_CACHE_TTL_HOURS = 12;

window.preloadedData = {
    exchangeRates: null,
    countries: null
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

if (location.pathname !== "/" && !location.pathname.includes(".")) {
    history.replaceState(null, "", "/");
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

    // Save to sessionStorage
    try {


    } catch (err) {
        console.warn("⚠️ Could not save history:", err);
    }

    history.pushState({ index: currentIndex }, '', '');
    handleStateChange(newState);
}
function isSettingsCacheValid(timestamp) {
    if (!timestamp) return false;
    const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    return ageInHours < SETTINGS_CACHE_TTL_HOURS;
}

async function preloadSettingsData() {
    const cached = JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) || "{}");

    if (isSettingsCacheValid(cached.timestamp)) {
        console.log("⚡ Using cached settings data.");
        window.preloadedData.exchangeRates = cached.data.exchangeRates;
        window.preloadedData.countries = cached.data.countries;

        // Apply exchange rates
        if (cached.data.exchangeRates) {
            for (const [currency, rate] of Object.entries(cached.data.exchangeRates)) {
                exchangeRates[currency] = rate;
            }
        }

        return;
    }

    // No valid cache → fetch fresh data
    try {
        const [countryRes, rateRes] = await Promise.all([
            fetch("https://api.snagletshop.com/countries"),
            fetch("https://api.snagletshop.com/rates")
        ]);

        const countries = await countryRes.json();
        const rateData = await rateRes.json();

        window.preloadedData.countries = countries;
        window.preloadedData.exchangeRates = rateData.rates;

        // Apply exchange rates
        if (rateData.rates) {
            for (const [currency, rate] of Object.entries(rateData.rates)) {
                exchangeRates[currency] = rate;
            }
        }

        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: {
                countries,
                exchangeRates: rateData.rates
            }
        }));

        console.log("✅ Fetched and cached fresh settings data.");
    } catch (err) {
        console.error("❌ Failed to preload settings data:", err);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded. Checking for product from query...");

    const params = new URLSearchParams(window.location.search);
    const productName = params.get("product");

    if (productName) {
        const cleanedQuery = productName.toLowerCase().trim();
        console.log("🔍 Looking for product:", `"${cleanedQuery}"`);

        let attempts = 0;
        const maxAttempts = 300;

        const checkProducts = setInterval(() => {
            if (typeof products !== "undefined" && Object.keys(products).length > 0) {
                clearInterval(checkProducts);

                const allProducts = Object.values(products).flat();

                console.log("🧪 Checking against these product names:");
                allProducts.forEach(p => {
                    if (p && typeof p.name === "string") {
                        const name = p.name.toLowerCase().trim();
                        console.log("→", `"${name}"`);
                    } else {
                        console.warn("⚠️ Skipping invalid product:", p);
                    }
                });

                // Try exact match
                let match = allProducts.find(p => {
                    if (!p || typeof p.name !== "string") return false;

                    const dbName = p.name.toLowerCase().trim();
                    const dbNameCodes = [...dbName].map(c => c.charCodeAt(0));
                    const queryCodes = [...cleanedQuery].map(c => c.charCodeAt(0));

                    console.log(`🔎 Comparing "${dbName}" to "${cleanedQuery}"`);
                    console.log("   DB char codes  :", dbNameCodes.join(" "));
                    console.log("   Query char codes:", queryCodes.join(" "));

                    return dbName === cleanedQuery;
                });

                // Fallback: fuzzy match
                if (!match) {
                    console.warn("⚠️ No exact match. Trying fuzzy match...");
                    match = allProducts.find(p =>
                        p && typeof p.name === "string" &&
                        p.name.toLowerCase().trim().includes(cleanedQuery)
                    );
                    if (match) {
                        console.log("✅ Fuzzy match found:", match.name);
                    }
                }

                if (
                    match &&
                    Array.isArray(match.images) &&
                    match.images.length > 0
                ) {
                    console.log("✅ Matched product:", match.name);
                    navigate("GoToProductPage", [
                        match.name,
                        match.price,
                        match.description || "No description available."
                    ]);
                } else {
                    console.warn("❌ Product not found or has no valid images:", `"${productName}"`);
                    history.replaceState({}, "", "/");
                    loadProducts("Default_Page");
                }
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(checkProducts);
                    console.error("⏰ Timeout: products not loaded in time.");
                    history.replaceState({}, "", "/");
                    loadProducts("Default_Page");
                } else {
                    console.log("⌛ Waiting for products to load...");
                }
            }
        }, 10);
    } else {
        loadProducts("Default_Page");
    }

    if (typeof searchInput !== "undefined") {
        searchInput.addEventListener("keyup", searchProducts);
    }
});
document.addEventListener("DOMContentLoaded", async () => {
    await preloadSettingsData();
});


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


    if (currentIndex >= 0 && userHistoryStack[currentIndex]) {
        handleStateChange(userHistoryStack[currentIndex]);
    } else {
        navigate('loadProducts', ['Default_Page', 'NameFirst', 'asc']);
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

// Call this on page load
initializeHistory();





document.getElementById("Search_Bar").addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(searchProducts, 200);
});
document.getElementById("Search_Bar").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); // stops form submit
    }
});
document.getElementById("Mobile_Search_Bar").addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(searchProducts, 200);
});
document.getElementById("Mobile_Search_Bar").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); // stops form submit
    }
});
// Unified Search Handling for Both Desktop and Mobile

const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};
async function fetchTariffs() {
    const response = await fetch("https://api.snagletshop.com/countries");
    console.log(response);
    const countries = await response.json();
    tariffMultipliers = Object.fromEntries(countries.map(c => [c.code, c.tariff]));
}

searchInput.addEventListener("input", debounce(() => {
    const query = searchInput.value.trim();
    mobileSearchInput.value = query; // Sync with mobile

    if (query.length > 0) {
        trackSearch(query);
        searchProducts(query);
    } else {
        loadProducts(lastCategory || "Default_Page"); // Reload last selected category
    }
}, 300));



// Allow pressing "Enter" without form submission
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
});
mobileSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
});






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
async function fetchExchangeRatesFromServer() {
    try {
        const response = await fetch("https://api.snagletshop.com/rates");
        const data = await response.json();
        console.log("🔍 Raw exchange rate response from server:", data); // 👈 Add this
        if (data.rates) {
            for (const [currency, rate] of Object.entries(data.rates)) {
                exchangeRates[currency] = rate;
            }
            console.log("✅ Updated exchange rates from server:", exchangeRates);
        } else {
            console.warn("⚠️ No rates found in response. Using default rates.");
        }
    } catch (error) {
        console.error("❌ Failed to fetch exchange rates:", error);
    }
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



// === POPSTATE HANDLER ===
window.addEventListener("popstate", function (event) {
    // ✅ Close modal if open
    const modal = document.getElementById("paymentModal");
    if (modal && typeof closeModal === "function") {
        console.log("🔙 Back button pressed — closing modal...");
        closeModal();
        return;
    }

    // 🔁 Existing replay logic can go here
    const index = event.state?.index;

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
            addToCartBtn.textContent = TEXTS.PRODUCT_SECTION.ADD_TO_CART;
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


document.addEventListener("click", function (event) {
    const img = event.target.closest(".Clickable_Image, .Basket_Image");
    if (!img) return;

    const name = img.dataset.name;
    const price = img.dataset.price;
    const description = img.dataset.description;
    if (!name || !price) {
        console.warn("⚠️ Missing data-name or data-price on image.");
        return;
    }

    console.debug(`🖼️ Product image clicked - GoToProductPage("${name}", "${price}", "${description}")`);


    GoToProductPage(name, price, description);
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
    fetch("https://ipapi.co/json/")
        .then(response => response.json())
        .then(data => {
            const userCountry = data.country_code;

            selectedCurrency = countryToCurrency[userCountry] || "EUR";
            localStorage.setItem("selectedCurrency", selectedCurrency);
            localStorage.setItem("detectedCountry", userCountry); // ✅ Add this line

            const currencySelect = document.getElementById("currency-select");
            if (currencySelect) {
                currencySelect.value = selectedCurrency;
            }



            console.log("🌍 Country detected:", userCountry);
            console.log("💱 Currency set to:", selectedCurrency);
            console.log("📦 Tariff applied:", localStorage.getItem("applyTariff"));

            updateAllPrices();
        })



}


function convertPrice(priceInEur) {
    let converted = priceInEur * exchangeRates[selectedCurrency];

    const selectedCountry = localStorage.getItem("detectedCountry") || "US";
    const tariff = tariffMultipliers[selectedCountry] || 0;

    const applyTariff = localStorage.getItem("applyTariff") === "true";
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

    const response = await fetch("https://api.snagletshop.com/countries");
    const countries = await response.json();
    console.log(`📦 Loaded ${countries.length} countries`, countries);

    select.innerHTML = ""; // Clear it

    countries.sort((a, b) => a.code.localeCompare(b.code));

    for (const c of countries) {
        const code = c.code.toUpperCase();
        const name = countryNames[code] || code;
        console.log(`🌍 Adding ${code}: ${name}`);
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = name;
        select.appendChild(opt);
    }

    const detected = localStorage.getItem("detectedCountry") || "US";
    document.getElementById("detected-country").textContent = detected;
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

    if (select.tomselect) {
        select.tomselect.destroy();
    }

    new TomSelect(select, {
        maxOptions: 1000,
        sortField: { field: "text", direction: "asc" },
        placeholder: "Select a country…",
        closeAfterSelect: true
    });

    console.log("✅ TomSelect initialized on countrySelect");
}






async function GoToSettings() {
    clearCategoryHighlight();
    const viewer = document.getElementById("Viewer");
    if (!viewer) {
        console.error("Viewer element not found.");
        return;
    }

    if (typeof removeSortContainer === "function") {
        removeSortContainer();
    }

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
<select id="currencySelect" class="currencySelect tom-hidden"></select>
        </select>
    `;

    // 🚀 Country Selector (added right under currency)
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
    const contactSection = document.createElement("div");
    contactSection.classList.add("settings-section");
    contactSection.innerHTML = `
        <h3>${TEXTS.CONTACT_FORM.TITLE}</h3>
        <form id="contact-form">
            <label for="email">${TEXTS.CONTACT_FORM.FIELDS.EMAIL}</label>
            <input type="email" id="email" required>
            <label for="message">${TEXTS.CONTACT_FORM.FIELDS.MESSAGE}</label>
            <textarea id="message" class="MessageTextArea" required></textarea>
            <button type="submit">${TEXTS.CONTACT_FORM.SEND_BUTTON}</button>
        </form>
        <p class="contact-note">If the form doesn't work, email us at <a href="mailto:snagletshophelp@gmail.com">snagletshophelp@gmail.com</a></p>
    `;

    // Legal Notice
    const legalSection = document.createElement("div");
    legalSection.classList.add("settings-section");
    legalSection.innerHTML = `
    <h3>Legal Notice & Store Policies</h3>
    <p><strong>Legal Notice:</strong><br>
    Unauthorized scraping, reproduction, or copying of this website, its design, content, or data is strictly prohibited. Any such actions may result in legal action.</p>

    <h4>Shipping Policy</h4>
    <p>
    We operate on a dropshipping model, and most products are shipped directly from global suppliers. Delivery times may range from <strong>2 weeks up to 6 months</strong> depending on your location and product availability.<br><br>
    We are not responsible for delays caused by customs, local postal services, global events, or other circumstances beyond our control.
    </p>

    <h4>Returns & Refunds</h4>
    <p>
    <strong>All sales are final.</strong> We do <strong>not offer refunds, returns, or exchanges</strong> unless an item arrives defective or significantly different from its description.<br><br>
    If your item arrives damaged or is not as described, please contact us within 5 days of delivery with clear photos and your order number. We will assess the case and offer a solution at our discretion.<br><br>
    Orders cannot be canceled after they are placed.
    </p>

    <h4>Warranty & Insurance</h4>
    <p>
    We do <strong>not provide any warranty or insurance</strong> on the products we sell. All items are sold “as-is.” Any manufacturer guarantees (if applicable) must be handled directly with the manufacturer.
    </p>

    <h4>Customs, Duties & Taxes</h4>
    <p>
    Buyers are solely responsible for any customs duties, taxes, or import restrictions that may apply in their country.
    </p>

    <h4>Responsibility Disclaimer</h4>
    <p>
    We are not liable for:<br>
    - Orders lost or delayed due to incorrect shipping information provided by the customer.<br>
    - Packages lost or stolen after delivery.<br>
    - Use or misuse of products sold through our store.
    </p>
`;

    // Append all sections
    wrapper.append(themeSection, currencySection, countrySection, clearSection, contactSection, legalSection);
    viewer.appendChild(wrapper);
    document.getElementById("clearDataButton").addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all saved data?")) {
            localStorage.clear();
            sessionStorage.clear();
            alert("All data cleared. Reloading page...");
            location.reload();
        }
    });

    // Theme toggle logic
    const themeToggle = document.getElementById("themeToggle");
    themeToggle.checked = localStorage.getItem("themeMode") === "dark";
    themeToggle.addEventListener("change", (e) => {
        const darkMode = e.target.checked;
        document.documentElement.classList.toggle("dark-mode", darkMode);
        document.documentElement.classList.toggle("light-mode", !darkMode);
        localStorage.setItem("themeMode", darkMode ? "dark" : "light");
    });

    // Currency selector logic
    const currencySelect = document.getElementById("currencySelect");
    currencySelect.value = localStorage.getItem("selectedCurrency") || "EUR";
    if (!currencySelect.dataset.listenerAttached) {
        currencySelect.addEventListener("change", () => {
            localStorage.setItem("selectedCurrency", currencySelect.value);
            localStorage.setItem("manualCurrencyOverride", "true");
            syncCurrencySelects(currencySelect.value);
            updateAllPrices();
        });
        currencySelect.dataset.listenerAttached = "true";
    }


    const currencyDropdown = document.getElementById("currencySelect");
    if (currencyDropdown) {
        currencyDropdown.innerHTML = ""; // Clear existing

        Object.keys(exchangeRates).sort().forEach(code => {
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = `${currencySymbols[code] || ''} ${code}`;
            currencyDropdown.appendChild(opt);
        });

        currencyDropdown.value = selectedCurrency;

        // ✅ Destroy previous instances of TomSelect if they exist
        const existingCurrency = currencyDropdown.tomselect;
        if (existingCurrency) existingCurrency.destroy();

        const existingCountry = document.querySelector("#countrySelect")?.tomselect;
        if (existingCountry) existingCountry.destroy();

        // ✅ Populate countries before enhancing
        const countrySelect = document.getElementById("countrySelect");
        countrySelect.innerHTML = "";
        const detected = localStorage.getItem("detectedCountry") || "US";
        document.getElementById("detected-country").textContent = detected;

        window.preloadedData.countries
            ?.sort((a, b) => a.code.localeCompare(b.code))
            .forEach(c => {
                const code = c.code.toUpperCase();
                const name = countryNames[code] || code;
                const opt = document.createElement("option");
                opt.value = code;
                opt.textContent = name;
                countrySelect.appendChild(opt);
            });

        countrySelect.value = detected;
        countrySelect.addEventListener("change", () => {
            const newCountry = countrySelect.value;
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


        // ✅ Enhance both selects with TomSelect

        new TomSelect("#currencySelect", {
            maxOptions: 200,
            sortField: { field: "text", direction: "asc" },
            placeholder: "Select a currency…",
            closeAfterSelect: true
        });

        new TomSelect("#countrySelect", {
            maxOptions: 1000,
            sortField: { field: "text", direction: "asc" },
            placeholder: "Select a country…",
            closeAfterSelect: true
        });

        document.getElementById("currencySelect").classList.remove("tom-hidden");
        document.getElementById("countrySelect").classList.remove("tom-hidden");

    }

    // 🚀 Country selector logic
    const countrySelect = document.getElementById("countrySelect");
    countrySelect.innerHTML = "";
    const detected = localStorage.getItem("detectedCountry") || "US";
    document.getElementById("detected-country").textContent = detected;

    window.preloadedData.countries
        ?.sort((a, b) => a.code.localeCompare(b.code))
        .forEach(c => {
            const code = c.code.toUpperCase();
            const name = countryNames[code] || code;
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = name;
            countrySelect.appendChild(opt);
        });

    countrySelect.value = detected;
    countrySelect.addEventListener("change", () => {
        const newCountry = countrySelect.value;
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




    // Clear data logic


    // Contact form submission logic
    document.getElementById("contact-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();

        if (!email || !message) {
            alert("Please fill in both fields.");
            return;
        }

        try {
            const response = await fetch("https://api.snagletshop.com/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, message })
            });

            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("An error occurred. Try emailing us directly.");
        }
    });

    syncCurrencySelects(currencySelect.value);
    const settingsStyle = document.createElement("style");

    // Inject one-line Tom Select CSS fix
    const dropdownStyle = document.createElement("style");

    document.head.appendChild(dropdownStyle);


}

// helper function for countries




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
    let checkProductsLoaded = setInterval(() => {
        if (typeof products !== "undefined" && Object.keys(products).length > 0) {
            clearInterval(checkProductsLoaded); // Stop checking
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
        Object.keys(productsDatabase).forEach(category => {
            if (category !== "Default_Page") {
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

                const catArray = productsDatabase[category];
                const iconPath = catArray.length > 0 && catArray[0].icon ? catArray[0].icon : null;
                const displayName = category.replace(/_/g, ' ');

                if (iconPath) {
                    heading.innerHTML = `
                        <span class="category-icon-wrapper">
                            <svg viewBox="0 0 24 24" class="category-icon-svg">
                                <path d="${iconPath}" />
                            </svg>
                        </span>
                        <span class="category-label">${displayName}</span>
                    `;
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
    // Ensure the theme class is applied correctly
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
    modal.classList.add("modal");

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>${TEXTS.PAYMENT_MODAL.TITLE}</h2>

            <form id="paymentForm">
                <div id="Name_Holder">
                    <div><input type="text" id="Name" placeholder="${TEXTS.PAYMENT_MODAL.FIELDS.NAME}" required></div>
                    <div><input type="text" id="Surname" placeholder="${TEXTS.PAYMENT_MODAL.FIELDS.SURNAME}" required></div>
                </div>
                <div><input type="email" id="email" placeholder="${TEXTS.PAYMENT_MODAL.FIELDS.EMAIL}" required></div>
                <div id="Address_Holder">
                    <input type="text" id="Street" placeholder="${TEXTS.PAYMENT_MODAL.FIELDS.STREET_HOUSE_NUMBER}" required>
                    <input type="text" id="City" placeholder="${TEXTS.PAYMENT_MODAL.FIELDS.CITY}" required>
                    <input type="text" id="Postal_Code" placeholder="${TEXTS.PAYMENT_MODAL.FIELDS.POSTAL_CODE}" required>
                    <label for="Country">${TEXTS.PAYMENT_MODAL.FIELDS.COUNTRY}</label>
                    <select id="Country" class="tom-hidden" required style="width: 100%"></select>
                </div>
                <div id="payment-request-button" style="margin: 20px 0;"></div>
                <div id="payment-element" style="margin-top: 20px;"></div>
                <button class="Submit_Button" id="confirm-payment-button" type="button">
                    ${TEXTS.PAYMENT_MODAL.BUTTONS.SUBMIT}
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Inject modal-specific dark/light theme styles
    const modalStyle = document.createElement("style");
    modalStyle.innerHTML = `
#paymentModal input,
#paymentModal select,
#paymentModal textarea,
#paymentModal label,
#paymentModal h2 {
    color: var(--Default_Text_Colour) !important;
}
#paymentModal input,
#paymentModal select,
#paymentModal textarea {
 

}
#paymentModal button {
    color: var(--Default_Text_Colour) !important;
    background-color: var(--SearchBar_Background_Colour) !important;

}
`;


    document.head.appendChild(modalStyle);

    modal.addEventListener("click", handleOutsideClick);
    modal.addEventListener("touchstart", handleOutsideClick);
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    modal.style.display = "flex";

    // Populate country dropdown with TomSelect
    const countrySelect = document.getElementById("Country");
    if (countrySelect.tomselect) {
        countrySelect.tomselect.destroy();
    }
    const detectedCountry = localStorage.getItem("detectedCountry") || "US";

    if (countrySelect && window.preloadedData?.countries) {
        countrySelect.innerHTML = "";

        window.preloadedData.countries
            .sort((a, b) => a.code.localeCompare(b.code))
            .forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.code;
                opt.textContent = countryNames[c.code] || c.code;
                countrySelect.appendChild(opt);
            });

        countrySelect.value = detectedCountry;

        // Initialize TomSelect
        new TomSelect("#Country", {
            maxOptions: 1000,
            sortField: { field: "text", direction: "asc" },
            placeholder: "Select a country…",
            closeAfterSelect: true
        });
        // ✅ Inject dark mode styling after TomSelect is initialized
        if (document.body.classList.contains('dark')) {
            document.querySelector('.ts-control')?.style.setProperty(
                'background-color',
                getComputedStyle(document.documentElement).getPropertyValue('--Input_Background').trim()
            );
            document.querySelector('.ts-control')?.style.setProperty(
                'color',
                getComputedStyle(document.body).color
            );
        }

        countrySelect.classList.remove("tom-hidden");

        countrySelect.addEventListener("change", async () => {
            const selected = countrySelect.value;
            localStorage.setItem("detectedCountry", selected);

            if (!localStorage.getItem("manualCurrencyOverride")) {
                const newCurrency = countryToCurrency[selected];
                if (newCurrency) {
                    selectedCurrency = newCurrency;
                    localStorage.setItem("selectedCurrency", selectedCurrency);
                    syncCurrencySelects(selectedCurrency);
                }
            }

            updateAllPrices();

            // ✅ RECREATE PAYMENT INTENT based on new country
            const cartItems = JSON.parse(localStorage.getItem("basket")) || {};
            const fullCart = Object.values(cartItems).map(item => ({
                name: item.name,
                quantity: parseInt(item.quantity) || 1,
                price: parseFloat(item.price || 1).toFixed(2),
                expectedPurchasePrice: parseFloat(item.expectedPurchasePrice || item.price || 1).toFixed(2),
                productLink: item.productLink || "N/A",
                ...(item.selectedOption && { selectedOption: item.selectedOption })
            }));

            const stripeCart = fullCart.map(({ productLink, ...rest }) => rest);
            const summarizedCart = stripeCart.map(item => {
                const name = item.name.length > 30 ? item.name.slice(0, 30) + "…" : item.name;
                const option = item.selectedOption ? ` (${item.selectedOption})` : '';
                return `${item.quantity}x ${name}${option}`;
            }).join(", ").slice(0, 499);

            // 🔁 Create new payment intent with new country and currency
            const res = await fetch("https://api.snagletshop.com/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    websiteOrigin: "Dropshipping Website",
                    products: stripeCart,
                    currency: selectedCurrency,
                    country: selected,
                    metadata: { order_summary: summarizedCart }
                })
            });

            const data = await res.json();
            const newClientSecret = data.clientSecret;

            if (newClientSecret && newClientSecret.includes("_secret_")) {
                const stripe = stripeInstance || await Stripe('pk_test_...');
                stripeInstance = stripe;
                elementsInstance = stripe.elements({ clientSecret: newClientSecret });
                paymentElementInstance = elementsInstance.create("payment");
                paymentElementInstance.mount("#payment-element");

                // Update reference to latest client secret
                window.latestClientSecret = newClientSecret;
            } else {
                alert("❌ Failed to update payment intent.");
            }
        });

    }
    const stripe = stripeInstance || await Stripe('pk_test_51QvljKCvmsp7wkrwLSpmOlOkbs1QzlXX2noHpkmqTzB27Qb4ggzYi75F7rIyEPDGf5cuH28ogLDSQOdwlbvrZ9oC00J6B9lZLi');
    stripeInstance = stripe;

    const cartItems = JSON.parse(localStorage.getItem("basket")) || {};
    const fullCart = Object.values(cartItems).map(item => ({
        name: item.name,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price || 1).toFixed(2),
        expectedPurchasePrice: parseFloat(item.expectedPurchasePrice || item.price || 1).toFixed(2),
        productLink: item.productLink || "N/A",
        ...(item.selectedOption && { selectedOption: item.selectedOption })
    }));

    const stripeCart = fullCart.map(({ productLink, ...rest }) => rest);
    const summarizedCart = stripeCart.map(item => {
        const name = item.name.length > 30 ? item.name.slice(0, 30) + "…" : item.name;
        const option = item.selectedOption ? ` (${item.selectedOption})` : '';
        return `${item.quantity}x ${name}${option}`;
    }).join(", ").slice(0, 499);

    const res = await fetch("https://api.snagletshop.com/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            websiteOrigin: "Dropshipping Website",
            products: stripeCart,
            currency: selectedCurrency,
            country: localStorage.getItem("detectedCountry") || "US",
            metadata: { order_summary: summarizedCart }
        })

    });

    const data = await res.json();
    const clientSecret = data.clientSecret;
    if (!clientSecret || !clientSecret.includes("_secret_")) {
        alert("❌ Could not initialize payment.");
        return;
    }

    // 🧩 Initialize Stripe Elements
    elementsInstance = stripe.elements({
        clientSecret,
        appearance: {
            theme: 'flat',
            variables: {
                colorText: getComputedStyle(document.body).color,
                colorBackground: getComputedStyle(document.documentElement).getPropertyValue('--Input_Background').trim(),
                fontFamily: getComputedStyle(document.body).fontFamily,
            }
        }
    });
    paymentElementInstance = elementsInstance.create("payment");
    paymentElementInstance.mount("#payment-element");

    // 💳 Apple Pay / Google Pay Button
    const paymentRequest = stripe.paymentRequest({
        country: "US", // You can dynamically set this based on user
        currency: selectedCurrency.toLowerCase(),
        total: {
            label: "Total",
            amount: Math.round(fullCart.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100)
        },
        requestPayerName: true,
        requestPayerEmail: true
    });

    function renderPaymentRequestButton() {
        const container = document.getElementById("payment-request-button");
        container.innerHTML = ""; // clear previous button

        const isDarkMode = document.documentElement.classList.contains("dark-mode");

        const prButton = elementsInstance.create("paymentRequestButton", {
            paymentRequest,
            style: {
                paymentRequestButton: {
                    type: "default",
                    theme: isDarkMode ? "dark" : "light",
                    height: "45px"
                }
            }
        });

        paymentRequest.canMakePayment().then(result => {
            if (result) {
                prButton.mount("#payment-request-button");
            } else {
                container.style.display = "none";
            }
        });
    }

    // initially render
    renderPaymentRequestButton();

    // observe theme changes while modal is open
    const observer = new MutationObserver(() => {
        renderPaymentRequestButton();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // 🧾 Apple/Google Pay Checkout Handler
    paymentRequest.on("paymentmethod", async ev => {
        const { error: backendErr, clientSecret: freshClientSecret } = await fetch("https://api.snagletshop.com/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                websiteOrigin: "SnagletShop",
                products: stripeCart,
                currency: selectedCurrency,
                country: document.getElementById("Country")?.value || "US", // ✅ Add this
                metadata: { order_summary: summarizedCart }
            })
        }).then(res => res.json());


        if (!freshClientSecret) {
            ev.complete("fail");
            return;
        }

        const { error: confirmError } = await stripe.confirmCardPayment(
            freshClientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
        );

        if (confirmError) {
            ev.complete("fail");
            alert("❌ Payment failed: " + confirmError.message);
        } else {
            ev.complete("success");
            const finalResult = await stripe.confirmCardPayment(freshClientSecret);
            if (finalResult.error) {
                alert("❌ Final step failed: " + finalResult.error.message);
            } else {
                localStorage.removeItem("basket");
                alert("🎉 Payment successful!");
                location.reload();
            }
        }
    });

    // 🖱️ Manual Payment Button
    const confirmBtn = document.getElementById("confirm-payment-button");
    if (!confirmBtn.dataset.listenerAttached) {
        confirmBtn.addEventListener("click", async () => {
            const form = document.getElementById("paymentForm");
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.textContent = "Processing...";

            const userDetails = {
                name: document.getElementById("Name").value.trim(),
                surname: document.getElementById("Surname").value.trim(),
                email: document.getElementById("email").value.trim(),
                street: document.getElementById("Street").value.trim(),
                city: document.getElementById("City").value.trim(),
                postalCode: document.getElementById("Postal_Code").value.trim(),
                country: document.getElementById("Country").value.trim()
            };

            const finalClientSecret = window.latestClientSecret || clientSecret;
            const paymentIntentId = finalClientSecret.split("_secret")[0];

            await fetch("https://api.snagletshop.com/store-user-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentIntentId, userDetails })
            });

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements: elementsInstance,
                confirmParams: {
                    return_url: window.location.href,
                    payment_method_data: {
                        billing_details: {
                            name: `${userDetails.name} ${userDetails.surname}`,
                            email: userDetails.email,
                            address: {
                                city: userDetails.city,
                                postal_code: userDetails.postalCode,
                                country: userDetails.country
                            }
                        }
                    }
                },
                redirect: "if_required"
            });

            if (error) {
                alert("❌ Payment failed: " + error.message);
                confirmBtn.disabled = false;
                confirmBtn.textContent = TEXTS.PAYMENT_MODAL.BUTTONS.SUBMIT;
            } else if (paymentIntent?.status === "succeeded") {
                localStorage.removeItem("basket");
                alert("🎉 Payment succeeded!");
                location.reload();
            } else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = TEXTS.PAYMENT_MODAL.BUTTONS.SUBMIT;
            }
        });

        confirmBtn.dataset.listenerAttached = "true";
    }
}


// When the user clicks "Pay Now"
function handleOutsideClick(event) {
    const modalContent = modal.querySelector(".modal-content");
    if (!modalContent.contains(event.target)) {
        closeModal();
    }
}








// Function to show the modal
function openModal() {
    createPaymentModal();
    document.getElementById("paymentModal").style.display = "block";
    history.pushState({ modalOpen: true }, "", window.location.href);
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById("paymentModal");
    if (modal) {
        modal.remove();

        // 🔁 Reset Stripe elements so they can be remounted on reopen
        elementsInstance = null;
        paymentElementInstance = null;
    }
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

async function processPayment(e) {
    if (e) e.preventDefault();

    const stripe = stripeInstance || await Stripe('pk_test_51QvljKCvmsp7wkrwLSpmOlOkbs1QzlXX2noHpkmqTzB27Qb4ggzYi75F7rIyEPDGf5cuH28ogLDSQOdwlbvrZ9oC00J6B9lZLi');
    stripeInstance = stripe;

    const userDetails = {
        name: document.getElementById("Name").value.trim(),
        surname: document.getElementById("Surname").value.trim(),
        email: document.getElementById("email").value.trim(),
        street: document.getElementById("Street").value.trim(),
        city: document.getElementById("City").value.trim(),
        postalCode: document.getElementById("Postal_Code").value.trim(),
        country: document.getElementById("Country").value.trim()
    };

    const cartItems = JSON.parse(localStorage.getItem("basket")) || {};

    if (Object.keys(cartItems).length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const fullCart = Object.values(cartItems).map(item => {
        const price = parseFloat(item.price) || 1;
        const expectedPrice = parseFloat(item.expectedPurchasePrice) || price;
        return {
            name: item.name,
            quantity: parseInt(item.quantity) || 1,
            price: price.toFixed(2),
            expectedPurchasePrice: expectedPrice.toFixed(2),
            productLink: item.productLink || "N/A",
            ...(item.selectedOption && { selectedOption: item.selectedOption })
        };
    });

    // Create a Stripe-safe version (no productLink)
    const stripeCart = fullCart.map(({ productLink, ...rest }) => rest);

    // Stripe metadata-safe summary (≤ 500 characters)
    const summarizedCart = stripeCart.map(item => {
        const shortName = item.name.length > 30 ? item.name.slice(0, 30) + "…" : item.name;
        const option = item.selectedOption ? ` (${item.selectedOption})` : '';
        return `${item.quantity}x ${shortName}${option}`;
    }).join(", ").slice(0, 499);

    const websiteOrigin = "Dropshipping Website";
    console.log("🔍 Sending currency to server:", selectedCurrency);

    try {
        const response = await fetch("https://api.snagletshop.com/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                websiteOrigin,
                products: stripeCart, // ✅ sending productLink-free version
                currency: selectedCurrency,
                metadata: { order_summary: summarizedCart }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server responded with ${response.status}: ${text}`);
        }

        const data = await response.json();
        const { clientSecret } = data;

        if (!clientSecret) throw new Error("No client secret received.");

        if (!elementsInstance) {
            elementsInstance = stripe.elements({
                clientSecret,
                appearance: {
                    theme: 'flat',
                    variables: {
                        colorText: getComputedStyle(document.body).color,
                        colorBackground: getComputedStyle(document.documentElement).getPropertyValue('--Input_Background').trim(),
                        fontFamily: getComputedStyle(document.body).fontFamily,
                    }
                }
            });
            paymentElementInstance = elementsInstance.create("payment");
            paymentElementInstance.mount('#payment-element');
        }

        const confirmBtn = document.getElementById("confirm-payment-button");
        if (!confirmBtn) throw new Error("❌ Confirm payment button not found");

        if (!confirmBtn.dataset.listenerAttached) {
            confirmBtn.addEventListener("click", async () => {
                const { error, paymentIntent } = await stripe.confirmPayment({
                    elements: elementsInstance,
                    confirmParams: {
                        return_url: window.location.href,
                        payment_method_data: {
                            billing_details: {
                                name: `${userDetails.name} ${userDetails.surname}`,
                                email: userDetails.email,
                                address: {
                                    city: userDetails.city,
                                    postal_code: userDetails.postalCode,
                                    country: userDetails.country
                                }
                            }
                        }
                    },
                    redirect: "if_required"
                });

                if (error) {
                    alert("❌ Payment failed: " + error.message);
                } else if (paymentIntent && paymentIntent.status === "succeeded") {
                    localStorage.removeItem("basket");
                    alert("🎉 Payment succeeded!");
                    location.reload();
                }
            });

            confirmBtn.dataset.listenerAttached = "true";
        }

    } catch (error) {
        console.error("❌ Payment Error:", error);
        alert("An error occurred while processing payment.");
    }
}


async function initStripePaymentUI(userDetails, formattedCart, metadataSummary) {
    const stripe = stripeInstance || await Stripe('pk_test_51QvljKCvmsp7wkrwLSpmOlOkbs1QzlXX2noHpkmqTzB27Qb4ggzYi75F7rIyEPDGf5cuH28ogLDSQOdwlbvrZ9oC00J6B9lZLi'); // ✅ Replace with your real publishable key
    stripeInstance = stripe;

    try {
        const response = await fetch("https://api.snagletshop.com/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                websiteOrigin: "Dropshipping Website",
                products: formattedCart,
                userDetails,
                currency: selectedCurrency,
                metadata: { order_summary: metadataSummary }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Stripe server error:", errorText);
            alert("Server error while creating payment intent.");
            return;
        }

        const data = await response.json();
        const clientSecret = data.clientSecret;

        console.log("✅ Received clientSecret:", clientSecret);

        if (!clientSecret || !clientSecret.includes("_secret_")) {
            throw new Error("Invalid or missing clientSecret from server.");
        }

        if (!elementsInstance) {
            elementsInstance = stripe.elements({ clientSecret });
            paymentElementInstance = elementsInstance.create("payment");
            paymentElementInstance.mount("#payment-element");
        }

    } catch (error) {
        console.error("❌ Stripe UI Init Error:", error);
        alert("Failed to initialize Stripe payment.");
    }
}

async function confirmStripePayment(userDetails) {
    const stripe = stripeInstance;
    if (!stripe || !elementsInstance) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
        elements: elementsInstance,
        confirmParams: {
            return_url: window.location.href,
            payment_method_data: {
                billing_details: {
                    name: `${userDetails.name} ${userDetails.surname}`,
                    email: userDetails.email,
                    address: {
                        city: userDetails.city,
                        postal_code: userDetails.postalCode,
                        country: userDetails.country
                    }
                }
            }
        },
        redirect: "if_required"
    });

    if (error) {
        alert("❌ Payment failed: " + error.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
        localStorage.removeItem("basket");
        alert("🎉 Payment succeeded!");
        location.reload();
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
    let checkProductsLoaded = setInterval(() => {
        if (typeof products !== "undefined") {
            clearInterval(checkProductsLoaded); // Stop checking
            const params = new URLSearchParams(window.location.search);
            if (!params.has("product")) {
                const params = new URLSearchParams(window.location.search);
                if (!params.has("product")) {
                    loadProducts("Default_Page", "NameFirst", "asc");
                }

            }

        } else {
            console.error("⚠️ Waiting for products to load...");
        }
    }, 100);
});
// Ensure sorting dropdown exists when the page loads
document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.currentCategory === "undefined") {
        window.currentCategory = "Default_Page"; // Set default category
    }
    if (typeof window.currentSortOrder === "undefined") {
        window.currentSortOrder = "asc"; // Set default order
    }
    loadProducts(window.currentCategory);
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
    category = category || "Default_Page";
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
        addToCartBtn.textContent = TEXTS.PRODUCT_SECTION.ADD_TO_CART;
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
    let checkProductsLoaded = setInterval(() => {
        if (typeof products !== "undefined" && Object.keys(products).length > 0) {
            clearInterval(checkProductsLoaded);
            preloadProductImages();  // ✅ Preload images
            CategoryButtons();       // Efxisting function
        }
    }, 100);

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
window.lastProductName = productName;
window.lastProductPrice = productPrice;
window.lastProductDescription = productDescription;

function GoToProductPage(productName, productPrice, productDescription) {
    console.log("Product clicked:", productName);
    clearCategoryHighlight();

    const viewer = document.getElementById("Viewer");
    if (!viewer) {
        console.error(TEXTS.ERRORS.PRODUCTS_NOT_LOADED);
        return;
    }

    viewer.innerHTML = ""; // Clear any previous content
    removeSortContainer();

    const product = Object.values(products || {}).flat().find(p => p.name === productName);
    if (!product || !Array.isArray(product.images) || product.images.length === 0) {
        console.error("❌ Product not found or no images:", productName);
        return;
    }

    // ✅ Preload & validate images before rendering ANYTHING
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
            viewer.innerHTML = `<p>${TEXTS.ERRORS.PRODUCTS_NOT_LOADED}</p>`;
            return;
        }

        // Proceed to render product only once
        window.currentProductImages = validImages;
        window.currentIndex = 0;
        cart[productName] = 1;

        const Product_Viewer = document.createElement("div");
        Product_Viewer.id = "Product_Viewer";
        Product_Viewer.className = "Product_Viewer";

        const thumbnailsHTML = validImages.map((img, index) =>
            `<img class="Thumbnail${index === 0 ? ' active' : ''}" src="${img}" onclick="changeImage('${img}')">`
        ).join("");

        let productOptionLabel = '';
        let productOptionButtons = '';
        let selectedOption = '';

        if (Array.isArray(product.productOptions) && product.productOptions.length > 1) {
            const [label, ...options] = product.productOptions;
            selectedOption = options[0];
            productOptionLabel = `<div class="Product_Option_Label"><strong>${label}</strong></div>`;
            productOptionButtons = options.map((opt, index) => `
                <button 
                    class="Product_Option_Button${index === 0 ? ' selected' : ''}" 
                    onclick="selectProductOption(this, '${opt}')">${opt}</button>
            `).join('');
        }

        window.selectedProductOption = selectedOption;

        const productDiv = document.createElement("div");
        productDiv.className = "Product_Detail_Page";

        productDiv.innerHTML = `
            <div class="Product_Details">
                <div class="Product_Images">
                    <div class="ImageControl">
                        <button class="ImageControlButtonPrevious" onclick="prevImage()">
                            <div class="ImageControlButtonText">${TEXTS.PRODUCT_SECTION.IMAGE_NAV.PREVIOUS}</div>
                        </button>
                        <div class="image-slider-wrapper">
                            <img id="mainImage" class="mainImage slide-image" src="${validImages[0]}" alt="${productName}">
                        </div>
                        <button class="ImageControlButtonNext" onclick="nextImage()">
                            <div class="ImageControlButtonText">${TEXTS.PRODUCT_SECTION.IMAGE_NAV.NEXT}</div>
                        </button>
                    </div>
                    <div class="ThumbnailsHolder">${thumbnailsHTML}</div>
                </div>

                <div class="Product_Info">
                    <div class="Product_Name_Heading">${productName}</div>
                    <div class="Product_Description">${productDescription || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER}</div>

                    ${productOptionLabel ? `
                        <div class="Product_Options_Container">
                            ${productOptionLabel}
                            <div class="Product_Option_Buttons">${productOptionButtons}</div>
                        </div>` : ''}

                    <div class="Product_Price_Label">
                        <strong>${TEXTS.PRODUCT_SECTION.PRICE_LABEL}</strong> 
                        <span id="product-page-price" class="productPrice" data-eur="${productPrice}">
                            ${productPrice} ${TEXTS.CURRENCIES.EUR}
                        </span>
                    </div>

                    <div class="ProductPageQuantityContainer">
                        <div class="Quantity_Controls_ProductPage">
                            <button class="Button" onclick="decreaseQuantity('${productName}')">${TEXTS.BASKET.BUTTONS.DECREASE}</button>
                            <span class="WhiteText" id="quantity-${productName}">1</span>
                            <button class="Button" onclick="increaseQuantity('${productName}')">${TEXTS.BASKET.BUTTONS.INCREASE}</button>
                        </div>
                        <button class="add-to-cart-product" onclick="addToCart(
                            '${productName}',
                            ${parseFloat(productPrice)},
                            '${validImages[0]}',
                            '${product.expectedPurchasePrice}',
                            '${product.productLink}',
                            \`${productDescription}\`,
                            window.selectedProductOption || ''
                        )">${TEXTS.PRODUCT_SECTION.ADD_TO_CART}</button>
                    </div>

                    <button class="ProductPageBuyButton" onclick="buyNow(
                        '${productName}',
                        ${parseFloat(productPrice)},
                        '${validImages[0]}',
                        '${product.expectedPurchasePrice}',
                        '${product.productLink}',
                        \`${productDescription}\`,
                        window.selectedProductOption || ''
                    )">${TEXTS.PRODUCT_SECTION.BUY_NOW}</button>
                </div>
            </div>
        `;
        const existingProductViewer = document.getElementById("Product_Viewer");
        if (existingProductViewer) {
            existingProductViewer.remove(); // 👈 ensures no duplicates
        }

        Product_Viewer.appendChild(productDiv);
        viewer.appendChild(Product_Viewer); // ✅ Only once, after build is complete

        // Swipe support
        const mainImageElement = document.getElementById("mainImage");
        if (mainImageElement) {
            let touchStartX = 0;
            let touchEndX = 0;

            mainImageElement.addEventListener("touchstart", e => {
                touchStartX = e.changedTouches[0].screenX;
            });

            mainImageElement.addEventListener("touchend", e => {
                touchEndX = e.changedTouches[0].screenX;
                const threshold = 50;
                if (touchEndX < touchStartX - threshold) nextImage();
                else if (touchEndX > touchStartX + threshold) prevImage();
            });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });

        updateAllPrices();
        updateImage();
    });
}


function preloadProductImages() {
    if (typeof products === "undefined") return;

    Object.values(products).flat().forEach(product => {
        const urls = Array.isArray(product.images) ? product.images : [product.image];

        urls.forEach(url => {
            if (url && !preloadedImages.has(url)) {
                const img = new Image();
                img.src = url;
                preloadedImages.add(url); // ✅ Mark as preloaded
            }
        });
    });
}


function renderProductPage(product, validImages, productName, productPrice, productDescription) {
    const viewer = document.getElementById("Viewer");

    const Product_Viewer = document.createElement("div");
    Product_Viewer.id = "Product_Viewer";
    Product_Viewer.className = "Product_Viewer";

    window.currentProductImages = validImages;
    window.currentIndex = 0;
    cart[productName] = 1;

    const thumbnailsHTML = validImages.map((img, index) =>
        `<img class="Thumbnail${index === 0 ? ' active' : ''}" src="${img}" onclick="changeImage('${img}')">`).join("");

    let productOptionLabel = '';
    let productOptionButtons = '';
    let selectedOption = '';

    if (Array.isArray(product.productOptions) && product.productOptions.length > 1) {
        const [label, ...options] = product.productOptions;
        selectedOption = options[0];
        productOptionLabel = `<div class="Product_Option_Label"><strong>${label}</strong></div>`;
        productOptionButtons = options.map((opt, index) => `
            <button 
                class="Product_Option_Button${index === 0 ? ' selected' : ''}" 
                onclick="selectProductOption(this, '${opt}')">${opt}</button>
        `).join('');
    }

    window.selectedProductOption = selectedOption;

    const productDiv = document.createElement("div");
    productDiv.className = "Product_Detail_Page";

    productDiv.innerHTML = `
        <div class="Product_Details">
            <div class="Product_Images">
                <div class="ImageControl">
                    <button class="ImageControlButtonPrevious" onclick="prevImage()">
                        <div class="ImageControlButtonText">${TEXTS.PRODUCT_SECTION.IMAGE_NAV.PREVIOUS}</div>
                    </button>
                    <div class="image-slider-wrapper">
                        <img id="mainImage" class="mainImage slide-image" src="${validImages[0]}" alt="${productName}">
                    </div>
                    <button class="ImageControlButtonNext" onclick="nextImage()">
                        <div class="ImageControlButtonText">${TEXTS.PRODUCT_SECTION.IMAGE_NAV.NEXT}</div>
                    </button>
                </div>
                <div class="ThumbnailsHolder">${thumbnailsHTML}</div>
            </div>

            <div class="Product_Info">
                <div class="Product_Name_Heading">${productName}</div>
                <div class="Product_Description">${productDescription || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER}</div>

                ${productOptionLabel ? `
                    <div class="Product_Options_Container">
                        ${productOptionLabel}
                        <div class="Product_Option_Buttons">${productOptionButtons}</div>
                    </div>` : ''}

                <div class="Product_Price_Label">
                    <strong>${TEXTS.PRODUCT_SECTION.PRICE_LABEL}</strong> 
                    <span id="product-page-price" class="productPrice" data-eur="${productPrice}">
                        ${productPrice} ${TEXTS.CURRENCIES.EUR}
                    </span>
                </div>

                <div class="ProductPageQuantityContainer">
                    <div class="Quantity_Controls_ProductPage">
                        <button class="Button" onclick="decreaseQuantity('${productName}')">${TEXTS.BASKET.BUTTONS.DECREASE}</button>
                        <span class="WhiteText" id="quantity-${productName}">1</span>
                        <button class="Button" onclick="increaseQuantity('${productName}')">${TEXTS.BASKET.BUTTONS.INCREASE}</button>
                    </div>
                    <button class="add-to-cart-product" onclick="addToCart(
                        '${productName}',
                        ${parseFloat(productPrice)},
                        '${validImages[0]}',
                        '${product.expectedPurchasePrice}',
                        '${product.productLink}',
                        \`${productDescription}\`,
                        window.selectedProductOption || ''
                    )">${TEXTS.PRODUCT_SECTION.ADD_TO_CART}</button>
                </div>

                <button class="ProductPageBuyButton" onclick="buyNow(
                    '${productName}',
                    ${parseFloat(productPrice)},
                    '${validImages[0]}',
                    '${product.expectedPurchasePrice}',
                    '${product.productLink}',
                    \`${productDescription}\`,
                    window.selectedProductOption || ''
                )">${TEXTS.PRODUCT_SECTION.BUY_NOW}</button>
            </div>
        </div>
    `;
    Product_Viewer.appendChild(productDiv);
    viewer.appendChild(Product_Viewer);


    const mainImageElement = document.getElementById("mainImage");

    if (mainImageElement) {
        let touchStartX = 0;
        let touchEndX = 0;

        mainImageElement.addEventListener("touchstart", (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        mainImageElement.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const threshold = 50;
            if (touchEndX < touchStartX - threshold) nextImage();
            else if (touchEndX > touchStartX + threshold) prevImage();
        });
    }

    updateAllPrices();
    updateImage(); // set initial state
}

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

function prevImage() {
    window.currentIndex = (window.currentIndex - 1 + window.currentProductImages.length) % window.currentProductImages.length;
    updateImage('right');
}

function nextImage() {
    window.currentIndex = (window.currentIndex + 1) % window.currentProductImages.length;
    updateImage('left');
}


let currentImageIndex = 0;
let startX = 0;

const carousel = document.getElementById("imageCarousel");
const images = carousel.querySelectorAll(".carousel-image");

carousel.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
});

carousel.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
        images[currentImageIndex].style.display = "none";

        if (diff > 0) {
            // Swipe left
            currentImageIndex = (currentImageIndex + 1) % images.length;
        } else {
            // Swipe right
            currentImageIndex =
                (currentImageIndex - 1 + images.length) % images.length;
        }

        images[currentImageIndex].style.display = "block";
    }
});

function selectProductOption(button, optionValue) {
    document.querySelectorAll(".Product_Option_Button").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");

    window.selectedProductOption = optionValue;

    const productName = document.querySelector(".Product_Name_Heading")?.textContent?.trim();
    if (productName && basket[productName]) {
        basket[productName].selectedOption = optionValue;
        localStorage.setItem("basket", JSON.stringify(basket));
        console.log(`🟢 Saved selected option "${optionValue}" for "${productName}"`);
    }
}






function buyNow(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "") {
    console.log(productName, productPrice, imageUrl, selectedOption);
    let quantity = parseInt(document.getElementById(`quantity-${productName}`).innerText) || 1;
    addToCart(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption);
    GoToCart();
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

function addToCart(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = '') {
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
                    <strong class="BasketText">${item.name.length > 20 ? item.name.slice(0, 20) + "…" : item.name}</strong>

                </a>
                <p class="BasketTextDescription">${item.description}</p>
                <div class="PriceAndOptionRow">
                    <p class="basket-item-price" data-eur="${totalPrice}">${totalPrice}€</p>
                    ${selectedOptionHTML}
                </div>
            </div>
            <div class="Quantity-Controls-Basket">
                <button class="BasketChangeQuantityButton" onclick="changeQuantity('${key}', -1)">${TEXTS.BASKET.BUTTONS.DECREASE}</button>
                <span class="BasketChangeQuantityText">${item.quantity}</span>
                <button class="BasketChangeQuantityButton" onclick="changeQuantity('${key}', 1)">${TEXTS.BASKET.BUTTONS.INCREASE}</button>
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

    document.body.addEventListener("click", function (event) {
        if (event.target.classList.contains("PayButton")) {
            createPaymentModal();
        }
    });

    document.querySelectorAll(".Basket_Image").forEach((img) => {
        img.addEventListener("click", function () {
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






function changeQuantity(itemKey, amount) {
    if (basket[itemKey]) {
        basket[itemKey].quantity += amount;

        if (basket[itemKey].quantity <= 0) {
            delete basket[itemKey];
        }

        localStorage.setItem("basket", JSON.stringify(basket));
        updateBasket();
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









// Function to place an order based on user's basket
async function placeOrder(userId, basket) {
    try {
        const orders = [];
        for (const item of basket) {
            let orderResponse;
            if (item.source === "Amazon") {
                orderResponse = await AmazonAPI.placeOrder(item);
            } else if (item.source === "AliExpress") {
                orderResponse = await AliExpressAPI.placeOrder(item);
            } else {
                throw new Error("Unknown source");
            }

            orders.push({
                userId,
                productId: item.id,
                orderId: orderResponse.orderId,
                status: "Pending",
                source: item.source,
            });
        }
        await Order.insertMany(orders);
        return { success: true, message: "Orders placed successfully" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// API endpoint to handle orders
router.post("/place-order", async (req, res) => {
    const { userId, basket } = req.body;
    if (!userId || !basket || !Array.isArray(basket)) {
        return res.status(400).json({ success: false, message: "Invalid request" });
    }
    const response = await placeOrder(userId, basket);
    res.json(response);
});

module.exports = router;



const stripe = require("stripe")("pk_test_51QvljKCvmsp7wkrwLSpmOlOkbs1QzlXX2noHpkmqTzB27Qb4ggzYi75F7rIyEPDGf5cuH28ogLDSQOdwlbvrZ9oC00J6B9lZLi");
const nodemailer = require("nodemailer");

async function processOrder(cartItems, userDetails) {
    const totalAmount = calculateTotal(cartItems);
    console.error("processOrder");
    // Create Stripe payment with metadata
    const paymentIntent = await createStripePayment(userDetails, totalAmount, cartItems);
    if (!paymentIntent || paymentIntent.status !== "succeeded") {
        console.error("Payment failed or not confirmed.");
        return;
    }

    // Send confirmation email to the customer
    //await sendConfirmationEmail(userDetails.email, cartItems, totalAmount);

    // Trigger "Thanks for Purchase" function
    thanksForPurchase();

    console.log("Payment successful, order details sent to Stripe and customer.");
}

// Create Stripe PaymentIntent with metadata
async function createStripePayment(userDetails, amount, cartItems) {
    try {
        const safeOrderSummary = cartItems.map(item => {
            const name = item.name.length > 30 ? item.name.slice(0, 30) + "…" : item.name;
            const option = item.selectedOption ? ` (${item.selectedOption})` : '';
            return `${item.quantity}x ${name}${option}`;
        }).join(", ");

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "eur",
            metadata: {
                customer_name: `${userDetails.name} ${userDetails.surname}`,
                email: userDetails.email,
                order_summary: safeOrderSummary.slice(0, 499) // enforce Stripe's limit
            }
        });


        console.log("PaymentIntent created:", paymentIntent.id);
        return paymentIntent;
    } catch (error) {
        console.error("Stripe PaymentIntent Error:", error);
        return null;
    }
}

// Send email confirmation
async function sendConfirmationEmail(userEmail, cartItems, totalAmount) {

}

// Calculate total price
function calculateTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
}

// "Thanks for Purchase" function
function thanksForPurchase() {
    console.log("Thanks for your purchase! Your order is being processed.");
}

module.exports = { processOrder };



// ✅ Function to Navigate to a Product & Update URL
function navigateToProduct(productName) {
    const formattedName = productName.toLowerCase().replace(/\s+/g, "-");

    history.pushState({}, "", `/${formattedName}`);
    GoToProductPage(productName, getProductPrice(productName), getProductDescription(productName));
}


// ✅ Function to Get Product Price
function getProductPrice(productName) {
    let product = Object.values(products).flat().find(p => p.name === productName);
    return product ? product.price : "N/A";
}

