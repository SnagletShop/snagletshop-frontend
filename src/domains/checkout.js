(function (window, document) {
const COUNTRY_OVERRIDE_STORAGE_KEY = "selectedCountryOverride";
const CHECKOUT_DRAFT_TTL_MS = 30 * 60 * 1000;

function _normalizeCountryCode(value, fallback = "") {
    const code = String(value || "").trim().toUpperCase();
    return code || fallback;
}

function _getManualCountryOverride() {
    try {
        return _normalizeCountryCode(localStorage.getItem(COUNTRY_OVERRIDE_STORAGE_KEY));
    } catch { }
    return "";
}

function _getPreferredCountry() {
    try {
        return _getManualCountryOverride() || _normalizeCountryCode(localStorage.getItem("detectedCountry"), "US");
    } catch { }
    return "US";
}

function _setManualCountryOverride(countryCode) {
    const code = _normalizeCountryCode(countryCode);
    if (!code) return "";
    try {
        localStorage.setItem(COUNTRY_OVERRIDE_STORAGE_KEY, code);
        localStorage.setItem("detectedCountry", code);
    } catch { }
    return code;
}

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
            sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify({
                savedAt: Date.now(),
                fields: draft
            }));
        } else {
            sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
        }
    } catch { }
}

async function restoreCheckoutDraftToModal() {
    try {
        const raw = sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return;
        const savedAt = Number(parsed.savedAt || 0) || 0;
        if (!savedAt || (Date.now() - savedAt) > CHECKOUT_DRAFT_TTL_MS) {
            sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
            return;
        }

        const draft = (parsed.fields && typeof parsed.fields === "object") ? parsed.fields : parsed;

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

    // Also clear in-memory checkout session state (draft checkoutId/token)
    try {
        window.latestCheckoutId = null;
        window.latestCheckoutPublicToken = null;
        window.latestPaymentIntentId = null;
        window.latestClientSecret = null;
        window.latestOrderId = null;
        window.latestOrderPublicToken = null;
        window.latestOrderStatusUrl = null;
    } catch { }
}

function __ssGetCheckoutSuccessFirstCategory() {
    try {
        const db = (window.productsDatabase && typeof window.productsDatabase === "object")
            ? window.productsDatabase
            : ((window.products && typeof window.products === "object") ? window.products : {});
        return Object.keys(db || {}).find((k) => k !== "Default_Page" && Array.isArray(db[k]) && db[k].length) || "Default_Page";
    } catch { }
    return "Default_Page";
}

function __ssGetCheckoutSuccessDefaultSort() {
    try { return localStorage.getItem("defaultSort") || "NameFirst"; } catch { }
    return "NameFirst";
}

function __ssGetCheckoutSuccessDefaultSortOrder() {
    return String(window.currentSortOrder || "asc").trim().toLowerCase() === "desc" ? "desc" : "asc";
}

function __ssClearCheckoutModalHistoryMarker() {
    try {
        const currentState = (history.state && typeof history.state === "object") ? history.state : null;
        if (!currentState || currentState.modalOpen !== true) return;
        const idx = Number.isInteger(currentState.index)
            ? currentState.index
            : (Number.isInteger(window.currentIndex) ? window.currentIndex : -1);
        const routeState = currentState.route
            || (Array.isArray(window.userHistoryStack) && idx >= 0 ? window.userHistoryStack[idx] : null)
            || null;
        const snapshot = window.__SS_ROUTER__?.buildHistoryState?.(routeState, idx, {}) || { ...currentState };
        try { delete snapshot.modalOpen; } catch { }
        history.replaceState(snapshot, "", window.location.href);
    } catch { }
}

function __ssNavigateHomeAfterPaymentSuccess() {
    const data = [
        __ssGetCheckoutSuccessFirstCategory(),
        __ssGetCheckoutSuccessDefaultSort(),
        __ssGetCheckoutSuccessDefaultSortOrder()
    ];

    try {
        const router = window.__SS_ROUTER__ || null;
        if (router && typeof router.navigate === "function") {
            router.navigate("loadProducts", data, { replaceCurrent: false });
            return true;
        }
    } catch { }

    try {
        if (typeof window.loadProducts === "function") {
            window.loadProducts(...data);
            return true;
        }
    } catch { }

    return false;
}

function __ssHandleSuccessfulCheckoutUi() {
    const orderSnapshot = {
        orderId: window.latestOrderId || null,
        orderPublicToken: window.latestOrderPublicToken || null,
        orderStatusUrl: window.latestOrderStatusUrl || null
    };
    let basketSnapshot = null;
    try {
        basketSnapshot = (typeof readBasket === "function")
            ? (readBasket() || {})
            : (() => { try { return JSON.parse(localStorage.getItem("basket") || "{}"); } catch { return {}; } })();
    } catch { }

    try {
        window.__SS_ANALYTICS_HELPERS__?.__ssTrackSuccessfulPurchase?.({
            orderId: orderSnapshot.orderId || null,
            paymentIntentId: window.latestPaymentIntentId || null,
            currency: localStorage.getItem("selectedCurrency") || window.selectedCurrency || "EUR"
        }, basketSnapshot || {});
    } catch { }

    try { clearPaymentPendingFlag(); } catch { }
    try { clearBasketCompletely(); } catch { }
    try { clearCheckoutDraft(); } catch { }
    try { __ssClearCheckoutModalHistoryMarker(); } catch { }
    try { closeModal({ fromHistory: true, clearDraft: true, preserveDraft: false, reason: "payment_success" }); } catch { }
    try {
        if (orderSnapshot.orderId) window.latestOrderId = orderSnapshot.orderId;
        if (orderSnapshot.orderPublicToken) window.latestOrderPublicToken = orderSnapshot.orderPublicToken;
        if (orderSnapshot.orderStatusUrl) window.latestOrderStatusUrl = orderSnapshot.orderStatusUrl;
    } catch { }

    const navigated = __ssNavigateHomeAfterPaymentSuccess();

    try { setPaymentSuccessFlag({ reloadOnOk: false }); } catch { }

    try {
        if (typeof window.checkAndShowPaymentSuccess === "function") {
            requestAnimationFrame(() => {
                try { window.checkAndShowPaymentSuccess(); } catch { }
            });
        } else if (typeof showPaymentSuccessOverlay === "function") {
            const msg = (typeof TEXTS !== "undefined" && TEXTS?.CHECKOUT_SUCCESS)
                ? TEXTS.CHECKOUT_SUCCESS
                : "Thank you for shopping with us! Your payment was successful and we are hard at work to get you your order as soon as possible!";
            requestAnimationFrame(() => {
                try { showPaymentSuccessOverlay(msg); } catch { }
            });
        }
    } catch { }

    if (!navigated) {
        try { window.location.replace(window.location.origin + "/"); } catch { }
    }
}

function resolveStripeAppearanceSafe() {
    try {
        const appearance = window.__SS_CHECKOUT_UI__?.getStripeAppearanceForModal?.();
        if (appearance && typeof appearance === "object") return appearance;
    } catch { }
    try {
        if (typeof getStripeAppearanceForModal === "function") {
            const appearance = getStripeAppearanceForModal();
            if (appearance && typeof appearance === "object") return appearance;
        }
    } catch { }
    try {
        if (typeof _getStripeAppearance === "function") {
            const appearance = _getStripeAppearance();
            if (appearance && typeof appearance === "object") return appearance;
        }
    } catch { }
    return {
        theme: "flat",
        variables: {
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
            fontSizeBase: "14px",
            colorBackground: "#ffffff",
            colorText: "#111827",
            colorPrimary: "#2563eb",
            colorDanger: "#ef4444",
            borderRadius: "14px",
            spacingUnit: "6px"
        }
    };
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
        marketingOptIn: !!document.getElementById("MarketingOptIn")?.checked,
        phone: (d?.phone || get("Phone")) || "",
        street: (d?.street || get("Street")) || "",
        address2: (d?.address2 || get("Address_Line2", "AddressLine2")) || "",
        city: (d?.city || get("City")) || "",
        state: (d?.region || d?.state || get("State", "Region")) || "",
        postalCode: (d?.postalCode || get("Postal_Code", "PostalCode")) || "",
        country: (d?.country || get("Country")) || "" // should be ISO-2 if your select uses ISO codes
    };
}

async function createPaymentModal() {
    if (document.getElementById("paymentModal")) return;

    // Ensure texts/theme data exist (safe even if initPaymentModalLogic calls it again)
    try { if (typeof window.preloadSettingsData === "function") await window.preloadSettingsData(); } catch { }

    try {
        window.__SS_THEME__?.apply?.(window.__SS_THEME__?.getStoredMode?.() || 'auto', { persist: false });
    } catch {
        const savedTheme = localStorage.getItem("themeMode");
        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark-mode");
            document.documentElement.classList.remove("light-mode");
        } else {
            document.documentElement.classList.add("light-mode");
            document.documentElement.classList.remove("dark-mode");
        }
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
              <input type="tel"  id="Phone" placeholder="Phone (optional)">
    
              <label for="Country">${TEXTS?.PAYMENT_MODAL?.FIELDS?.COUNTRY || "Country"}</label>
              <select id="Country" class="tom-hidden payment-modal-country ss-select-fullwidth" required></select>
            </div>
    
            <div id="payment-request-button" class="payment-request-slot"></div>
            <div id="payment-element" class="payment_element payment-element-slot"></div>
            <div id="ss-last-chance" class="payment-last-chance-slot"></div>
              <label class="ss-marketing-optin">
              <input type="checkbox" id="MarketingOptIn" checked/>
              <span>${(typeof TEXTS !== "undefined" && TEXTS?.PAYMENT_MODAL?.FIELDS?.MARKETING_OPTIN) ? TEXTS.PAYMENT_MODAL.FIELDS.MARKETING_OPTIN : "Send me occasional product offers by email"}</span>
            </label>
            <button class="Submit_Button" id="confirm-payment-button" type="button">
              ${TEXTS?.PAYMENT_MODAL?.BUTTONS?.SUBMIT || "Pay"}
            </button>
          </form>
        </div>
      `;

    document.body.appendChild(modal);

    try {
        const basketObj = (typeof readBasket === 'function') ? (readBasket() || {}) : (() => {
            try { return JSON.parse(localStorage.getItem('basket') || '{}'); } catch { return {}; }
        })();
        const itemsCount = Object.values(basketObj || {}).reduce((sum, item) => sum + Math.max(1, Number(item?.quantity ?? item?.qty ?? 1) || 1), 0);
        sendAnalyticsEvent('checkout_modal_opened', {
            extra: {
                currency: localStorage.getItem('selectedCurrency') || window.selectedCurrency || 'EUR',
                country: _getPreferredCountry(),
                itemsCount
            }
        });
    } catch { }

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

async function initStripePaymentUI(selectedCurrency) {
    // Canonical basket hydration (prevents false 'Basket is empty')
    const __ssBasketAny = (() => {
        try {
            if (typeof readBasket === 'function') {
                const b = readBasket() || {};
                if (b && typeof b === 'object') return b;
            }
        } catch { }
        try {
            const raw = localStorage.getItem('basket');
            return raw ? (JSON.parse(raw) || {}) : {};
        } catch {
            return {};
        }
    })();
    try { window.basket = __ssBasketAny; } catch { }
    try { basket = __ssBasketAny; } catch { }

    // Ensure catalog data is loaded before rehydrating basket prices
    try {
        if (typeof initProducts === "function") await initProducts();
    } catch { }

    // Canonical basket hydrate: UI and checkout must agree
    const __b = (typeof readBasket === "function") ? (readBasket() || {}) : (window.basket || {});
    try { window.basket = __b; } catch { }
    try { basket = __b; } catch { }

    try {
        const basketEntries = Object.entries(__b || {});
        if (basketEntries.length && typeof window.__ssValidateRecoDiscountsInBasketBestEffort === "function") {
            await window.__ssValidateRecoDiscountsInBasketBestEffort(basketEntries);
        }
    } catch { }

    const __checkoutBasket = (typeof readBasket === "function") ? (readBasket() || __b || {}) : (__b || window.basket || {});
    try { window.basket = __checkoutBasket; } catch { }
    try { basket = __checkoutBasket; } catch { }

    // IMPORTANT: use 'let' so fallbacks can rebuild carts safely
    let fullCart = [];
    try {
        fullCart = (typeof __ssGetFullCartPreferred === "function")
            ? (__ssGetFullCartPreferred() || [])
            : [];
    } catch { fullCart = []; }
    if (!Array.isArray(fullCart) || !fullCart.length) {
        fullCart = buildFullCartFromBasket();
    }
    let stripeCart = buildStripeSafeCart(fullCart);

    if (!stripeCart.length) {
        // Fallback: build from canonical basket directly.
        // Do NOT require productId/token for an item to be considered in-cart.
        const normSel = (typeof __ssNormalizeSelectedOptions === 'function')
            ? __ssNormalizeSelectedOptions
            : (arr) => Array.isArray(arr) ? arr : [];
        const resolveUnitPrice = window.__SS_CHECKOUT_RUNTIME__?.resolveCheckoutUnitPriceEUR;

        const items = Object.values(__checkoutBasket || __ssBasketAny || {});
        const fc = items.map((it) => ({
            name: String(it?.name || it?.title || ''),
            quantity: Number(it?.quantity ?? it?.qty ?? 1) || 1,
            productId: String(it?.productId || it?.pid || it?.id || ''),
            unitPriceEUR: (typeof resolveUnitPrice === 'function')
                ? Number(resolveUnitPrice(it) || 0)
                : Number(it?.price ?? it?.unitPriceEUR ?? 0),
            price: (typeof resolveUnitPrice === 'function')
                ? Number(resolveUnitPrice(it) || 0)
                : Number(it?.price ?? it?.unitPriceEUR ?? 0),
            productLink: String(it?.productLink || ''),
            selectedOption: String(it?.selectedOption || ''),
            selectedOptions: normSel(it?.selectedOptions || []),
            recoDiscountToken: String(it?.recoDiscountToken || it?.discountToken || ''),
            recoTrackingToken: String(it?.recoTrackingToken || ''),
            recoWidgetId: String(it?.recoWidgetId || ''),
            recoSourceProductId: String(it?.recoSourceProductId || ''),
            recoPosition: it?.recoPosition == null ? null : (Number(it?.recoPosition || 0) || 0),
            recoDiscountPct: Number(it?.recoDiscountPct || 0) || 0,
            unitPriceOriginalEUR: Number(it?.unitPriceOriginalEUR || 0) || 0,
            smartRecoToken: String(it?.smartRecoToken || ''),
            smartRecoItemKey: String(it?.smartRecoItemKey || ''),
            smartRecoPlacement: String(it?.smartRecoPlacement || '')
        }));

        fullCart = fc;
        stripeCart = buildStripeSafeCart(fc);
    }
    if (!stripeCart.length) throw new Error('Basket is empty.');



    // [stripe][debug] init start
    try {
        console.log("[stripe][init] start", {
            apiBase: (typeof API_BASE !== "undefined" ? API_BASE : null),
            origin: window.location.origin,
            currency: selectedCurrency,
            country: getSelectedCountryCode(),
            stripeCartItems: Array.isArray(stripeCart) ? stripeCart.length : null,
            fullCartItems: Array.isArray(fullCart) ? fullCart.length : null
        });
    } catch { }
    // analytics: begin checkout
    try {
        const items = buildAnalyticsCartItems(stripeCart);
        const safeSelectedCurrency = _getSafeCheckoutCurrency(getSelectedCountryCode(), selectedCurrency);
        if (safeSelectedCurrency && safeSelectedCurrency !== String(selectedCurrency || "").toUpperCase()) {
            selectedCurrency = safeSelectedCurrency;
            try { window.selectedCurrency = safeSelectedCurrency; } catch { }
            try { localStorage.setItem("selectedCurrency", safeSelectedCurrency); } catch { }
            try { if (typeof syncCurrencySelects === "function") syncCurrencySelects(safeSelectedCurrency); } catch { }
            try { if (typeof updateAllPrices === "function") updateAllPrices(); } catch { }
        }
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

    try {
        if (typeof ensureStripePublishableKey === 'function') {
            await ensureStripePublishableKey();
        }
    } catch (err) {
        showStripeConfigError(err?.message || err || 'Stripe publishable key is not configured.');
        throw err;
    }

    let publishableKey = '';
    try {
        if (window.__SS_ORDERS_RUNTIME__?.ensureStripeInstance) {
            window.stripeInstance = window.__SS_ORDERS_RUNTIME__.ensureStripeInstance();
            publishableKey = String(window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE || '').trim();
        } else {
            publishableKey = (typeof getStripePublishableKeySafe === 'function')
                ? getStripePublishableKeySafe()
                : String(window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE || '').trim();
            if (!publishableKey) throw new Error('Stripe publishable key is not configured.');
            if (!window.stripeInstance) window.stripeInstance = Stripe(publishableKey);
        }
    } catch (err) {
        showStripeConfigError(err?.message || err || 'Unable to initialize Stripe.');
        throw err;
    }

    const websiteOrigin = window.location.origin;

    const data = await getOrCreatePaymentIntentRecycled({
        websiteOrigin,
        currency: selectedCurrency,
        country,
        fullCart,
        stripeCart
    });

    const { clientSecret, paymentIntentId, amountCents, currency, checkoutId, checkoutPublicToken } = data;
    const resolvedCurrency = String(currency || selectedCurrency || 'EUR').trim().toUpperCase();
    if (resolvedCurrency && resolvedCurrency !== String(selectedCurrency || '').trim().toUpperCase()) {
        selectedCurrency = resolvedCurrency;
        try { window.selectedCurrency = resolvedCurrency; } catch { }
        try { localStorage.setItem('selectedCurrency', resolvedCurrency); } catch { }
        try { if (typeof syncCurrencySelects === "function") syncCurrencySelects(resolvedCurrency); } catch { }
        try { if (typeof updateAllPrices === "function") updateAllPrices(); } catch { }
    }

    // 0-value carts: finalize immediately without Stripe UI
    if (data && data.free) {
        try {
            const checkoutService = window.__SS_CHECKOUT_SERVICE__;
            if (!checkoutService?.finalizeOrder) {
                throw new Error('Checkout service unavailable: finalizeOrder');
            }
            const fin = await checkoutService.finalizeOrder({
                free: true,
                draftId: data.draftId || data.checkoutId || null,
                token: data.checkoutPublicToken || data.token || checkoutPublicToken || null
            });
            try {
                if (fin?.orderId) window.latestOrderId = fin.orderId;
                if (data?.checkoutPublicToken || data?.token || checkoutPublicToken) {
                    window.latestOrderPublicToken = data.checkoutPublicToken || data.token || checkoutPublicToken || null;
                }
            } catch { }
            __ssHandleSuccessfulCheckoutUi();
            // Stop further Stripe mounting
            return;
        } catch (e) {
            console.error("[free-checkout] finalize failed:", e);
            throw e;
        }
    }




    // [stripe][debug] payment intent response
    try {
        const pk = String(publishableKey || "");
        console.log("[stripe][pi] in", {
            publishableKeyPrefix: pk ? (pk.slice(0, 12) + "…") : "",
            currency: currency || selectedCurrency,
            amountCents: amountCents ?? null,
            paymentIntentId: paymentIntentId || null,
            clientSecretPrefix: (clientSecret ? String(clientSecret).slice(0, 16) + "…" : ""),
            checkoutId: checkoutId || null,
            hasCheckoutPublicToken: !!(checkoutPublicToken && String(checkoutPublicToken).trim())
        });
    } catch { }
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
    window.latestPaymentIntentId = paymentIntentId || null;

    window.latestCheckoutId = checkoutId || window.latestCheckoutId || null;
    window.latestCheckoutPublicToken = checkoutPublicToken || window.latestCheckoutPublicToken || null;

    // Backwards-compat (no orderId exists until Stripe succeeds + webhook finalizes it)
    window.latestOrderId = null;
    window.latestOrderPublicToken = null;
    window.latestOrderStatusUrl = null;
    try { window.paymentElementInstance?.unmount?.(); } catch { }
    const paymentElContainer = document.getElementById("payment-element");
    if (paymentElContainer) paymentElContainer.innerHTML = "";

    window.elementsInstance = window.stripeInstance.elements({
        clientSecret,
        appearance: resolveStripeAppearanceSafe()
    });



    // [stripe][debug] elements created
    try {
        console.log("[stripe][elements] created", {
            hasElements: !!window.elementsInstance,
            hasStripe: !!window.stripeInstance
        });
    } catch { }
    window.paymentElementInstance = window.elementsInstance.create("payment");
    let stripeMountRetried = false;
    window.paymentElementInstance.mount("#payment-element");



    // [stripe][debug] Payment Element lifecycle logs
    try {
        const __mountId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        window.__ssStripeMountId = __mountId;

        console.log("[stripe][payment] mount", {
            mountId: __mountId,
            paymentIntentId: paymentIntentId || null,
            clientSecretPrefix: (clientSecret ? String(clientSecret).slice(0, 16) + "…" : ""),
            container: "#payment-element"
        });

        // Events
        try {
            window.paymentElementInstance.on("ready", () => {
                if (window.__ssStripeMountId !== __mountId) return;
                console.log("[stripe][payment] ready", { mountId: __mountId });
            });
        } catch (e) {
            console.warn("[stripe][payment] on(ready) failed:", e?.message || e);
        }

        try {
            window.paymentElementInstance.on("change", (e) => {
                if (window.__ssStripeMountId !== __mountId) return;
                // Avoid logging full billing details; Stripe's event is safe but keep it compact.
                console.log("[stripe][payment] change", {
                    mountId: __mountId,
                    complete: !!e?.complete,
                    empty: !!e?.empty,
                    collapsed: !!e?.collapsed,
                    valueType: e?.value ? Object.keys(e.value) : null,
                    brand: e?.value?.payment_method?.card?.brand || null,
                    type: e?.value?.type || null
                });
                if (e?.error) console.warn("[stripe][payment] change.error", { mountId: __mountId, message: e.error.message, code: e.error.code, type: e.error.type });
            });
        } catch (e) {
            console.warn("[stripe][payment] on(change) failed:", e?.message || e);
        }

        try {
            window.paymentElementInstance.on("loaderror", async (e) => {
                if (window.__ssStripeMountId !== __mountId) return;
                console.error("[stripe][payment] loaderror", {
                    mountId: __mountId,
                    message: e?.error?.message || e?.message || null,
                    code: e?.error?.code || e?.code || null,
                    type: e?.error?.type || e?.type || null
                });

                if (stripeMountRetried) return;
                stripeMountRetried = true;

                try { window.__SS_CHECKOUT_HELPERS__?._invalidatePiCache?.(data?._sig || null); } catch { }
                try {
                    window.latestCheckoutId = null;
                    window.latestCheckoutPublicToken = null;
                    window.latestPaymentIntentId = null;
                    window.latestClientSecret = null;
                } catch { }
                try {
                    window.paymentElementInstance?.unmount?.();
                    window.paymentElementInstance?.destroy?.();
                } catch { }
                try {
                    window.elementsInstance = null;
                    window.paymentElementInstance = null;
                    window.stripeInstance = null;
                    window.__ssStripeLoadedPublishableKey = "";
                } catch { }

                if (paymentElContainer) {
                    paymentElContainer.innerHTML = `
                    <div class="ss-note-box">
                      Refreshing payment session...
                    </div>`;
                }

                const retryHost = document.getElementById("payment-element");
                const retryModal = document.getElementById("paymentModal");
                if (!retryHost || !retryHost.isConnected || !retryModal || !retryModal.isConnected) {
                    console.warn("[stripe][payment] retry skipped; payment container no longer exists", { mountId: __mountId });
                    return;
                }

                try {
                    await initStripePaymentUI(selectedCurrency);
                } catch (retryErr) {
                    console.error("[stripe][payment] retry failed", retryErr);
                }
            });
        } catch (e) {
            console.warn("[stripe][payment] on(loaderror) failed:", e?.message || e);
        }

        // Post-mount DOM health checks (iframe existence, sizing)
        setTimeout(() => {
            if (window.__ssStripeMountId !== __mountId) return;
            const host = document.getElementById("payment-element");
            const frame = host ? host.querySelector("iframe") : null;
            const hostRect = host ? host.getBoundingClientRect() : null;
            const frameRect = frame ? frame.getBoundingClientRect() : null;
            console.log("[stripe][payment] domcheck", {
                mountId: __mountId,
                hostExists: !!host,
                iframeExists: !!frame,
                hostRect: hostRect ? { w: Math.round(hostRect.width), h: Math.round(hostRect.height) } : null,
                iframeRect: frameRect ? { w: Math.round(frameRect.width), h: Math.round(frameRect.height) } : null,
                hostOverflowY: host ? getComputedStyle(host).overflowY : null
            });
        }, 1200);

        // If still not ready after a while, surface a warning (usually indicates a config/API issue)
        setTimeout(() => {
            if (window.__ssStripeMountId !== __mountId) return;
            console.warn("[stripe][payment] not-ready-timeout", {
                mountId: __mountId,
                hint: "If iframe exists but no fields render, check /create-payment-intent response and browser console/network for Stripe errors."
            });
        }, 4500);
    } catch { }
    await setupWalletPaymentRequestButton({
        stripe: window.stripeInstance,
        clientSecret,
        amountCents,
        currency: (currency || selectedCurrency),
        country,
        walletCountry: _normalizeWalletPaymentRequestCountry(country),
        orderId: null,
        paymentIntentId
    });

    try {
        sendAnalyticsEvent('checkout_payment_ui_ready', {
            extra: {
                paymentIntentId: paymentIntentId || null,
                amountCents: amountCents ?? null,
                currency: currency || selectedCurrency || null,
                country: country || null,
                walletVisible: !!document.getElementById('payment-request-button')?.children?.length
            }
        });
    } catch { }
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
            <div class="ss-note-box">
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
            <div class="ss-note-box ss-note-box--danger">
              <strong>Payment UI could not load.</strong><br>${msg}<br><br>
              Common causes: Stripe.js blocked, API error, or empty cart.
            </div>`;
        }

        alert(e?.message || "Checkout initialization failed. Please try again.");
    }
}

function attachPayButtonHandlerOnce() {
    if (window.__payButtonHandlerAttached) return;
    window.__payButtonHandlerAttached = true;
    document.addEventListener('click', async (event) => {
        const btn = event?.target?.closest?.('.PayButton');
        if (!btn) return;
        event.preventDefault();
        const wasDisabled = !!btn.disabled;
        btn.disabled = true;
        try { await openModal(); }
        catch (e) {
            console.error('openModal() failed:', e);
            alert('Could not initialize checkout. Please try again.');
        } finally {
            btn.disabled = wasDisabled;
        }
    });
}

function _replaceWithClone(el) {
    if (!el || !el.parentNode) return el;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
}

function _getDetectedCountry() {
    return _getPreferredCountry();
}

function _getSafeCheckoutCurrency(countryCode, preferredCurrency) {
    const cc = String(countryCode || "").trim().toUpperCase();
    const requested = String(preferredCurrency || "").trim().toUpperCase();
    if (requested === "UAH" || cc === "UA") return "EUR";
    return requested || String((window.countryToCurrency || {})?.[cc] || "EUR").trim().toUpperCase() || "EUR";
}

function _normalizeWalletPaymentRequestCountry(countryCode) {
    try {
        const runtimeNormalize = window.__SS_CHECKOUT_UI__?.normalizeWalletPaymentRequestCountry;
        if (typeof runtimeNormalize === "function") return runtimeNormalize(countryCode);
    } catch { }

    const cc = String(countryCode || "").trim().toUpperCase();
    const supported = new Set([
        "AE", "AT", "AU", "BE", "BG", "BR", "CA", "CH", "CI", "CR", "CY", "CZ", "DE", "DK", "DO", "EE",
        "ES", "FI", "FR", "GB", "GI", "GR", "GT", "HK", "HR", "HU", "ID", "IE", "IN", "IT", "JP", "LI",
        "LT", "LU", "LV", "MT", "MX", "MY", "NL", "NO", "NZ", "PE", "PH", "PL", "PT", "RO", "SE", "SG",
        "SI", "SK", "SN", "TH", "TT", "US", "UY"
    ]);
    if (supported.has(cc)) return cc;
    const fallbackMap = {
        AS: "US",
        GU: "US",
        MP: "US",
        PR: "US",
        UM: "US",
        VI: "US",
        AX: "FI",
        GG: "GB",
        IM: "GB",
        JE: "GB",
        BQ: "NL",
        CW: "NL",
        SX: "NL",
        GF: "FR",
        GP: "FR",
        MQ: "FR",
        RE: "FR",
        YT: "FR",
        PM: "FR",
        BL: "FR",
        MF: "FR"
    };
    const mapped = String(fallbackMap[cc] || "").trim().toUpperCase();
    return supported.has(mapped) ? mapped : "US";
}

function _syncSelectedCurrencyFromCountry(countryCode) {
    if (localStorage.getItem("manualCurrencyOverride")) return;
    const cc = String(countryCode || "").toUpperCase();
    const next = _getSafeCheckoutCurrency(cc, (window.countryToCurrency || {})?.[cc]);
    if (next) {
        selectedCurrency = next;
        try { window.selectedCurrency = next; } catch { }
        localStorage.setItem("selectedCurrency", selectedCurrency);
        if (typeof syncCurrencySelects === "function") syncCurrencySelects(selectedCurrency);
        try { if (typeof updateAllPrices === "function") updateAllPrices(); } catch { }
    }
}

function _fillCountrySelectOptions(selectEl) {
    const arr =
        (window.preloadedData?.countries?.length && window.preloadedData.countries) ||
        (typeof tariffsObjectToCountriesArray === "function"
            ? tariffsObjectToCountriesArray(window.tariffMultipliers || {})
            : []);

    selectEl.innerHTML = "";
    for (const c of arr) {
        const code = String(c.code || "").toUpperCase();
        if (!code) continue;
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = (window.countryNames?.[code]) ? window.countryNames[code] : code;
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

        try {
            const details = (typeof readCheckoutForm === 'function') ? (readCheckoutForm() || {}) : {};
            sendAnalyticsEvent('checkout_details_submitted', {
                extra: {
                    country: String(details?.country || getSelectedCountryCode() || '').trim().toUpperCase() || null,
                    currency: localStorage.getItem('selectedCurrency') || selectedCurrency || null,
                    hasPhone: !!String(details?.phone || '').trim(),
                    hasAddress2: !!String(details?.address2 || '').trim(),
                    marketingOptIn: !!details?.marketingOptIn
                }
            });
        } catch { }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Processing…";

        try {
            const userDetails = (typeof readCheckoutForm === 'function') ? (readCheckoutForm() || {}) : {};
            if (window.latestPaymentIntentId || window.latestOrderId) {
                await window.__SS_CHECKOUT_API__?.storeUserDetails?.({
                    checkoutId: window.latestCheckoutId || null,
                    token: window.latestCheckoutPublicToken || null,
                    paymentIntentId: window.latestPaymentIntentId || null,
                    clientSecret: window.latestClientSecret || null,
                    userDetails
                }).catch(() => {});
            }

            const clientSecret = window.latestClientSecret || null;
            const orderId = window.latestOrderId || null;
            const paymentIntentId = window.latestPaymentIntentId || null;

            if (clientSecret && window.stripeInstance?.retrievePaymentIntent) {
                try {
                    const piRes = await window.stripeInstance.retrievePaymentIntent(clientSecret);
                    const pi = piRes?.paymentIntent;
                    if (pi?.status === "succeeded") {
                        const checkoutToken = window.latestCheckoutPublicToken || null;
                        const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: pi.id, clientSecret });
                        if (resolvedOrderId && checkoutToken) {
                            const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
                            window.latestOrderId = resolvedOrderId;
                            window.latestOrderPublicToken = checkoutToken;
                            window.latestOrderStatusUrl = statusUrl;
                            addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: pi.id });
                        }
                        if (!resolvedOrderId) {
                            alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update.");
                            return;
                        }
                        __ssHandleSuccessfulCheckoutUi();
                        return;
                    }
                    if (pi?.status === "processing") {
                        setPaymentPendingFlag({ paymentIntentId: pi.id, orderId: orderId || null, clientSecret, checkoutId: window.latestCheckoutId || null, checkoutToken: window.latestCheckoutPublicToken || null });
                        const { status } = await pollPendingPaymentUntilFinal({ paymentIntentId: pi.id });
                        if (status === "succeeded") {
                            const checkoutToken = window.latestCheckoutPublicToken || null;
                            const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: pi.id, clientSecret });
                            if (resolvedOrderId && checkoutToken) {
                                const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
                                window.latestOrderId = resolvedOrderId;
                                window.latestOrderPublicToken = checkoutToken;
                                window.latestOrderStatusUrl = statusUrl;
                                addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: pi.id });
                            }
                            if (!resolvedOrderId) {
                                alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update.");
                                return;
                            }
                            __ssHandleSuccessfulCheckoutUi();
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
                    if (pi?.status === "canceled") {
                        clearPaymentPendingFlag();
                        alert("This payment attempt was canceled. Please try again.");
                        return;
                    }
                } catch {}
            }

            setPaymentPendingFlag({ paymentIntentId, orderId, clientSecret, checkoutId: window.latestCheckoutId || null, checkoutToken: window.latestCheckoutPublicToken || null });

            const returnUrl = new URL(window.location.href);
            stripStripeReturnParamsFromUrl(returnUrl);
            returnUrl.searchParams.set("stripe_return", "1");

            const { error, paymentIntent } = await window.stripeInstance.confirmPayment({
                elements: window.elementsInstance,
                confirmParams: { return_url: returnUrl.toString() },
                redirect: "if_required"
            });

            if (error) {
                clearPaymentPendingFlag();
                throw error;
            }

            if (paymentIntent?.status === "succeeded") {
                const checkoutToken = window.latestCheckoutPublicToken || null;
                const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: paymentIntent.id, clientSecret });
                if (resolvedOrderId && checkoutToken) {
                    const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
                    window.latestOrderId = resolvedOrderId;
                    window.latestOrderPublicToken = checkoutToken;
                    window.latestOrderStatusUrl = statusUrl;
                    addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: paymentIntent.id });
                }
                if (!resolvedOrderId) {
                    alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update.");
                    return;
                }
                __ssHandleSuccessfulCheckoutUi();
                return;
            }

            if (paymentIntent?.id) {
                setPaymentPendingFlag({ paymentIntentId: paymentIntent.id, orderId: orderId || null, clientSecret, checkoutId: window.latestCheckoutId || null, checkoutToken: window.latestCheckoutPublicToken || null });
                const { status } = await pollPendingPaymentUntilFinal({ paymentIntentId: paymentIntent.id });
                if (status === "succeeded") {
                    const checkoutToken = window.latestCheckoutPublicToken || null;
                    const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: paymentIntent.id, clientSecret });
                    if (resolvedOrderId && checkoutToken) {
                        const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
                        window.latestOrderId = resolvedOrderId;
                        window.latestOrderPublicToken = checkoutToken;
                        window.latestOrderStatusUrl = statusUrl;
                        addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: paymentIntent.id });
                    }
                    if (!resolvedOrderId) {
                        alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update.");
                        return;
                    }
                    __ssHandleSuccessfulCheckoutUi();
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
        } catch (e) {
            try {
                const pi = e?.payment_intent || e?.paymentIntent || null;
                if (pi && pi.id && pi.status === "succeeded" && String(e?.code || "").includes("payment_intent_")) {
                    const clientSecret = window.latestClientSecret || null;
                    const checkoutToken = window.latestCheckoutPublicToken || null;
                    const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: pi.id, clientSecret });
                    if (resolvedOrderId && checkoutToken) {
                        const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
                        window.latestOrderId = resolvedOrderId;
                        window.latestOrderPublicToken = checkoutToken;
                        window.latestOrderStatusUrl = statusUrl;
                        addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: pi.id });
                        __ssHandleSuccessfulCheckoutUi();
                        return;
                    }
                }
            } catch {}
            console.error("confirmPayment failed:", e);
            alert(e?.message || "Payment could not be completed.");
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

async function initPaymentModalLogic() {
    // Ensure tariffs + rates exist (from your earlier preloadSettingsData rewrite)
    if (typeof window.preloadSettingsData === "function") {
        await window.preloadSettingsData();
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

        const detected = _getPreferredCountry();
        countrySelect.value = detected;

        _setupTomSelectCountry(countrySelect);

        countrySelect.addEventListener("change", async () => {
            const cc = String(countrySelect.value || "").toUpperCase();
            _setManualCountryOverride(cc);

            _syncSelectedCurrencyFromCountry(cc);

            try {
                sendAnalyticsEvent('checkout_country_changed', {
                    extra: {
                        country: cc || null,
                        currency: selectedCurrency || localStorage.getItem('selectedCurrency') || null
                    }
                });
            } catch { }

            if (typeof updateAllPrices === "function") updateAllPrices();

            // Recreate PI + remount Stripe Elements (server-truth)
            await setupCheckoutFlow(selectedCurrency);
            try { __ssUpdateLastChanceOfferUI(); } catch { }
        });
    }

    // Initialize Stripe UI once on open (server-truth)
    selectedCurrency = localStorage.getItem("selectedCurrency") || selectedCurrency || "EUR";
    await setupCheckoutFlow(selectedCurrency);
    try { __ssUpdateLastChanceOfferUI(); } catch { }
}

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
        const prevPending = getPaymentPendingFlag() || {};
        setPaymentPendingFlag({
            paymentIntentId: piIdFromUrl || null,
            orderId: null,
            clientSecret: csFromUrl || null,
            checkoutId: prevPending.checkoutId || null,
            checkoutToken: prevPending.checkoutToken || null
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
                const prevPending2 = getPaymentPendingFlag() || {};
                setPaymentPendingFlag({
                    paymentIntentId: finalPiId,
                    orderId: null,
                    clientSecret: csFromUrl,
                    checkoutId: prevPending2.checkoutId || null,
                    checkoutToken: prevPending2.checkoutToken || null
                });
            }
        } catch (e) {
            console.warn("Stripe retrievePaymentIntent failed; will fall back to server polling.", e);
        }
    }

    // If we already know the result, apply it now
    if (finalStatus === "succeeded") {
        const prevPending = getPaymentPendingFlag() || {};
        const checkoutToken = prevPending.checkoutToken || null;
        const resolvedOrderId = await resolveOrderIdByPaymentIntent({
            paymentIntentId: finalPiId,
            clientSecret: csFromUrl
        });

        if (resolvedOrderId && checkoutToken) {
            const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
            window.latestOrderId = resolvedOrderId;
            window.latestOrderPublicToken = checkoutToken;
            window.latestOrderStatusUrl = statusUrl;
        }

        if (!resolvedOrderId) {
            alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update.");
            return;
        }

        stripStripeReturnParamsFromUrl(url);
        const q = url.searchParams.toString();
        const cleaned = url.pathname + (q ? `?${q}` : "");
        try {
            const currentState = (window.history.state && typeof window.history.state === "object") ? window.history.state : {};
            const routeState = currentState.route || (Array.isArray(window.userHistoryStack) ? window.userHistoryStack[currentIndex] : null) || null;
            const snapshot = window.__SS_ROUTER__?.buildHistoryState?.(routeState, currentIndex, { modalOpen: currentState.modalOpen === true }) || { ...currentState, index: currentIndex, route: routeState };
            window.history.replaceState(snapshot, "", cleaned);
        } catch { }

        __ssHandleSuccessfulCheckoutUi();
        return true;
    } else if (finalStatus === "requires_payment_method" || finalStatus === "canceled") {
        clearPaymentPendingFlag();
        alert("Payment did not complete. Your cart is still saved—please try again.");
    } else {
        // unknown/processing: keep pending; checkAndHandlePendingPaymentOnLoad() will poll
        if (finalPiId) {
            const prevPending3 = getPaymentPendingFlag() || {};
            setPaymentPendingFlag({
                paymentIntentId: finalPiId,
                orderId: null,
                clientSecret: csFromUrl || null,
                checkoutId: prevPending3.checkoutId || null,
                checkoutToken: prevPending3.checkoutToken || null
            });
        }
    }

    // Always clean URL so reloads don't re-trigger
    stripStripeReturnParamsFromUrl(url);
      const q = url.searchParams.toString();
      const cleaned = url.pathname + (q ? `?${q}` : "");
    try {
      const currentState = (window.history.state && typeof window.history.state === "object") ? window.history.state : {};
      const routeState = currentState.route || (Array.isArray(window.userHistoryStack) ? window.userHistoryStack[currentIndex] : null) || null;
      const snapshot = window.__SS_ROUTER__?.buildHistoryState?.(routeState, currentIndex, { modalOpen: currentState.modalOpen === true }) || { ...currentState, index: currentIndex, route: routeState };
      window.history.replaceState(snapshot, "", cleaned);
    } catch { }

      return true;
  }

  attachPayButtonHandlerOnce();

  window.__SS_CHECKOUT__ = {
    attachPayButtonHandlerOnce,
    saveCheckoutDraftFromModal,
    restoreCheckoutDraftToModal,
    clearCheckoutDraft,
    readCheckoutForm,
    createPaymentModal,
    initStripePaymentUI,
    setupCheckoutFlow,
    initPaymentModalLogic,
    handleStripeRedirectReturnOnLoad
  };
})(window, document);
