(function (window, document) {
  'use strict';

function getStripeAppearanceForModal() {
    const dark = document.documentElement.classList.contains("dark-mode");
    const baseVariables = {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        fontSizeBase: "14px",
        colorBackground: dark ? "#0b1220" : "#ffffff",
        colorText: dark ? "rgba(255,255,255,.92)" : "#111827",
        colorPrimary: dark ? "#3b82f6" : "#2563eb",
        colorDanger: "#ef4444",
        borderRadius: "14px",
        spacingUnit: "6px"
    };

    if (dark) {
        return {
            theme: "night",
            variables: baseVariables,
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
        variables: baseVariables,
        rules: {
            ".Block": {
                backgroundColor: "#ffffff",
                borderColor: "rgba(17,24,39,.10)"
            },
            ".Input": {
                borderColor: "rgba(17,24,39,.15)",
                boxShadow: "none"
            },
            ".Input:focus": {
                borderColor: "rgba(37,99,235,.45)",
                boxShadow: "0 0 0 3px rgba(37,99,235,.14)"
            },
            ".Label": {
                color: "#4b5563"
            },
            ".Tab": {
                borderColor: "rgba(17,24,39,.12)"
            }
        }
    };
}

// ----------------------------------------------------------------------------
// Checkout draft persistence (name/address/email only)
// Stripe Payment Element details cannot be persisted.
// ----------------------------------------------------------------------------
const CHECKOUT_DRAFT_STORAGE_KEY = "snaglet_checkout_draft_v1";

function __ssGetCheckoutSuccessRouteData() {
    try {
        const db = (window.productsDatabase && typeof window.productsDatabase === "object") ? window.productsDatabase : (window.products || {});
        const firstCategory = (Array.isArray(db?.Default_Page) && db.Default_Page.length)
            ? "Default_Page"
            : (Object.keys(db || {}).find((k) => k !== "Default_Page" && Array.isArray(db[k]) && db[k].length) || "Default_Page");
        const defaultSort = (() => { try { return localStorage.getItem("defaultSort") || "NameFirst"; } catch {} return "NameFirst"; })();
        const defaultOrder = String(window.currentSortOrder || "asc").trim().toLowerCase() === "desc" ? "desc" : "asc";
        return [firstCategory, defaultSort, defaultOrder];
    } catch {}
    return ["Default_Page", "NameFirst", "asc"];
}

function __ssNavigateHomeAfterPaymentSuccess() {
    const data = __ssGetCheckoutSuccessRouteData();
    try {
        const router = window.__SS_ROUTER__ || null;
        if (router && typeof router.navigate === "function") {
            router.navigate("loadProducts", data, { replaceCurrent: true });
            return true;
        }
    } catch {}
    try {
        if (typeof window.navigate === "function") {
            window.navigate("loadProducts", data, { replaceCurrent: true });
            return true;
        }
    } catch {}
    try {
        if (typeof window.loadProducts === "function") {
            window.loadProducts(...data);
            return true;
        }
    } catch {}
    return false;
}

function __ssHandleWalletSuccessfulCheckoutUi() {
    const orderSnapshot = {
        orderId: window.latestOrderId || null,
        orderPublicToken: window.latestOrderPublicToken || null,
        orderStatusUrl: window.latestOrderStatusUrl || null
    };

    try { clearPaymentPendingFlag(); } catch {}
    try { clearBasketCompletely(); } catch {}
    try { if (typeof window.clearCheckoutDraft === "function") window.clearCheckoutDraft(); } catch {}
    try { if (typeof window.__ssClearCheckoutModalHistoryMarker === "function") window.__ssClearCheckoutModalHistoryMarker(); } catch {}
    try {
        if (typeof window.closeModal === "function") {
            window.closeModal({ fromHistory: true, clearDraft: true, preserveDraft: false, reason: "wallet_payment_success" });
        }
    } catch {}
    try {
        if (orderSnapshot.orderId) window.latestOrderId = orderSnapshot.orderId;
        if (orderSnapshot.orderPublicToken) window.latestOrderPublicToken = orderSnapshot.orderPublicToken;
        if (orderSnapshot.orderStatusUrl) window.latestOrderStatusUrl = orderSnapshot.orderStatusUrl;
    } catch {}

    const navigated = __ssNavigateHomeAfterPaymentSuccess();

    try { setPaymentSuccessFlag({ reloadOnOk: false }); } catch {}
    try {
        if (typeof window.checkAndShowPaymentSuccess === "function") {
            requestAnimationFrame(() => {
                try { window.checkAndShowPaymentSuccess(); } catch {}
            });
        } else if (typeof window.showPaymentSuccessOverlay === "function") {
            requestAnimationFrame(() => {
                try { window.showPaymentSuccessOverlay("Thank you for shopping with us! Your payment was successful and we are hard at work to get you your order as soon as possible!"); } catch {}
            });
        }
    } catch {}

    if (!navigated) {
        try { window.location.replace(window.location.origin + "/"); } catch {}
    }
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
        appearance: getStripeAppearanceForModal()
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
            try {
                await window.__SS_CHECKOUT_API__.storeUserDetails({
                    checkoutId: window.latestCheckoutId || null,
                    token: window.latestCheckoutPublicToken || null,
                    paymentIntentId: paymentIntentId || window.latestPaymentIntentId || null,
                    clientSecret: (typeof clientSecret !== "undefined" && clientSecret) ? clientSecret : (window.latestClientSecret || null),
                    userDetails
                });
            } catch (err) {
                ev.complete("fail");
                alert(err?.message || "We could not save your checkout details. Please verify the form and try again.");
                return;
            }

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
                const cs = (typeof clientSecret !== "undefined" && clientSecret) ? clientSecret : (window.latestClientSecret || null);
                const checkoutToken = window.latestCheckoutPublicToken || null;
                const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: pi.id, clientSecret: cs });

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

                __ssHandleWalletSuccessfulCheckoutUi();
                return;
            }

            if (pi?.id) {
                // processing / requires_capture / etc.: keep cart, poll server for final
                setPaymentPendingFlag({ paymentIntentId: pi.id, orderId: null, clientSecret: (typeof clientSecret !== "undefined" && clientSecret) ? clientSecret : (window.latestClientSecret || null), checkoutId: window.latestCheckoutId || null, checkoutToken: window.latestCheckoutPublicToken || null });

                const r = await pollPendingPaymentUntilFinal({ paymentIntentId: pi.id });
                if (r.status === "succeeded") {
                    const cs = (typeof clientSecret !== "undefined" && clientSecret) ? clientSecret : (window.latestClientSecret || null);
                    const checkoutToken = window.latestCheckoutPublicToken || null;
                    const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: pi.id, clientSecret: cs });

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

                    __ssHandleWalletSuccessfulCheckoutUi();
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

function showPaymentSuccessOverlay(message) {
    // Prevent duplicates
    if (document.getElementById("paymentSuccessOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "paymentSuccessOverlay";

    const card = document.createElement("div");
    card.className = "payment-success__card";

    const title = document.createElement("div");
    title.textContent = "Payment successful";
    title.className = "payment-success__title";

    const body = document.createElement("div");
    body.textContent = message || "Thank you for shopping with us! Your payment was successful and we are hard at work to get you your order as soon as possible!";
    body.className = "payment-success__body";

    const actions = document.createElement("div");
    actions.className = "payment-success__actions";

    const ok = document.createElement("button");
    ok.type = "button";
    ok.textContent = "OK";
    ok.className = "payment-success__ok";

    actions.appendChild(ok);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const reloadOnOk = (() => {
        try {
            const store = __paymentSuccessStore();
            return !!store && store.getItem(PAYMENT_SUCCESS_RELOAD_KEY) === "1";
        } catch {
            return false;
        }
    })();

    const cleanupAndMaybeReload = () => {
        // Ensure it can't show again
        try {
            const store = __paymentSuccessStore();
            if (store) {
                store.removeItem(PAYMENT_SUCCESS_FLAG_KEY);
                store.removeItem(PAYMENT_SUCCESS_RELOAD_KEY);
            }
            __clearLegacyPaymentSuccessLocalStorage();
        } catch { }

        overlay.remove();

        // Reset custom SPA history so the next load behaves like a true fresh visit.
        if (reloadOnOk) {
            try {
                sessionStorage.removeItem(HISTORY_SESSION_KEY);
                sessionStorage.removeItem(HISTORY_INDEX_SESSION_KEY);
            } catch { }
            try {
                window.userHistoryStack = [];
                window.currentIndex = -1;
                if (typeof window.__ssSyncCentralState === "function") {
                    window.__ssSyncCentralState("history-cleared", { userHistoryStack: window.userHistoryStack, currentIndex: window.currentIndex });
                } else if (typeof __ssSyncCentralState === "function") {
                    __ssSyncCentralState("history-cleared", { userHistoryStack: window.userHistoryStack, currentIndex: window.currentIndex });
                }
                if (typeof history.replaceState === "function") {
                    history.replaceState({}, "", "/");
                }
            } catch { }
            window.location.replace(window.location.origin + "/");
        }
    };

    ok.addEventListener("click", cleanupAndMaybeReload);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanupAndMaybeReload();
    });
}

  window.__SS_CHECKOUT_UI__ = {
    getStripeAppearanceForModal,
    setupWalletPaymentRequestButton,
    showPaymentSuccessOverlay
  };
})(window, document);
