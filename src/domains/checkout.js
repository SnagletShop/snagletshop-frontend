(function (window, document) {
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

async function restoreCheckoutDraftToModal() {
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
              <input type="tel"  id="Phone" placeholder="Phone (optional)">
    
              <label for="Country">${TEXTS?.PAYMENT_MODAL?.FIELDS?.COUNTRY || "Country"}</label>
              <select id="Country" class="tom-hidden" required style="width: 100%"></select>
            </div>
    
            <div id="payment-request-button" style="margin: 16px 0;"></div>
            <div id="payment-element" class = "payment_element"style="margin-top: 16px;"></div>
            <div id="ss-last-chance" style="margin-top:12px;"></div>
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
              max-height: calc(100dvh - 48px);
      overflow-y: auto;
      overscroll-behavior: contain;
          border: 1px solid rgba(0,0,0,.08);
        }
        #paymentModal h2{ margin: 6px 0 12px; font-size: 1.25rem; }
        #paymentModal .ss-marketing-optin{ display:flex; gap:10px; align-items:flex-start; margin:10px 0 2px; font-size:12px; line-height:1.35; opacity:.9; user-select:none; }
        #paymentModal .ss-marketing-optin input{ margin-top:2px; width:16px; height:16px; accent-color: var(--Accent, #111); }
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
  
        /* Last-chance upsell */
        #paymentModal #ss-last-chance{
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,.10);
          background: rgba(0,0,0,.02);
        }
        html.dark-mode #paymentModal #ss-last-chance{
          border-color: rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
        }
        #paymentModal .ss-lc-row{ display:flex; gap:10px; align-items:center; }
        #paymentModal .ss-lc-img{ width:44px; height:44px; border-radius: 10px; object-fit:cover; flex:0 0 auto; background: rgba(0,0,0,.05); }
        #paymentModal .ss-lc-name{ font-weight:700; font-size:.92rem; line-height:1.15; }
        #paymentModal .ss-lc-sub{ font-size:.86rem; opacity:.85; }
        #paymentModal .ss-lc-btn{
          margin-left:auto; padding: 9px 12px; border-radius: 12px; cursor:pointer;
          border: 1px solid rgba(0,0,0,.12); background: rgba(0,0,0,.03); font-weight:700;
        }
        html.dark-mode #paymentModal .ss-lc-btn{ border-color: rgba(255,255,255,.16); background: rgba(255,255,255,.06); color: inherit; }
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

    // IMPORTANT: use 'let' so fallbacks can rebuild carts safely
    let fullCart = buildFullCartFromBasket();
    let stripeCart = buildStripeSafeCart(fullCart);

    if (!stripeCart.length) {
        // Fallback: build from canonical basket directly.
        // Do NOT require productId/token for an item to be considered in-cart.
        const normSel = (typeof __ssNormalizeSelectedOptions === 'function')
            ? __ssNormalizeSelectedOptions
            : (arr) => Array.isArray(arr) ? arr : [];

        const items = Object.values(__ssBasketAny || {});
        const fc = items.map((it) => ({
            name: String(it?.name || it?.title || ''),
            quantity: Number(it?.quantity ?? it?.qty ?? 1) || 1,
            productId: String(it?.productId || it?.pid || it?.id || ''),
            unitPriceEUR: Number(it?.unitPriceEUR ?? it?.price ?? 0),
            price: Number(it?.unitPriceEUR ?? it?.price ?? 0),
            productLink: String(it?.productLink || ''),
            selectedOption: String(it?.selectedOption || ''),
            selectedOptions: normSel(it?.selectedOptions || []),
            recoDiscountToken: String(it?.recoDiscountToken || it?.discountToken || '')
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

    const data = await getOrCreatePaymentIntentRecycled({
        websiteOrigin,
        currency: selectedCurrency,
        country,
        fullCart,
        stripeCart
    });

    const { clientSecret, paymentIntentId, amountCents, currency, checkoutId, checkoutPublicToken } = data;

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
            try { clearBasketStorage("free_checkout"); } catch { }
            try { closeModal({ reason: "free_checkout" }); } catch { }
            try { showPaymentSuccessOverlay(`Order confirmed (${fin.orderId || "FREE"}).`); } catch { }
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
        appearance: _getStripeAppearance()
    });



    // [stripe][debug] elements created
    try {
        console.log("[stripe][elements] created", {
            hasElements: !!window.elementsInstance,
            hasStripe: !!window.stripeInstance
        });
    } catch { }
    window.paymentElementInstance = window.elementsInstance.create("payment");
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
        orderId: null,
        paymentIntentId
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

        window.attachConfirmHandlerOnce();

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
    if (confirmBtn) confirmBtn = window._replaceWithClone(confirmBtn);

    let countrySelect = document.getElementById("Country");
    if (countrySelect) countrySelect = window._replaceWithClone(countrySelect);

    // Populate + initialize Country select (modal)
    if (countrySelect) {
        window._fillCountrySelectOptions(countrySelect);

        const detected = window._getDetectedCountry();
        countrySelect.value = detected;
        localStorage.setItem("detectedCountry", detected);

        window._setupTomSelectCountry(countrySelect);

        countrySelect.addEventListener("change", async () => {
            const cc = String(countrySelect.value || "").toUpperCase();
            localStorage.setItem("detectedCountry", cc);

            window._syncSelectedCurrencyFromCountry(cc);

            if (typeof updateAllPrices === "function") updateAllPrices();

            // Recreate PI + remount Stripe Elements (server-truth)
            await setupCheckoutFlow(selectedCurrency);
            try { window.__ssUpdateLastChanceOfferUI(); } catch { }
        });
    }

    // Initialize Stripe UI once on open (server-truth)
    selectedCurrency = localStorage.getItem("selectedCurrency") || selectedCurrency || "EUR";
    await setupCheckoutFlow(selectedCurrency);
    try { window.__ssUpdateLastChanceOfferUI(); } catch { }
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
            const statusUrl = `${window.location.origin}/?orderId=${encodeURIComponent(resolvedOrderId)}&token=${encodeURIComponent(checkoutToken)}`;
            window.latestOrderId = resolvedOrderId;
            window.latestOrderPublicToken = checkoutToken;
            window.latestOrderStatusUrl = statusUrl;
        }

        if (!resolvedOrderId) {
            alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update.");
            return;
        }

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
    try { window.history.replaceState({ index: currentIndex }, "", cleaned); } catch { }

    return true;
}

  window.__SS_CHECKOUT__ = {
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
