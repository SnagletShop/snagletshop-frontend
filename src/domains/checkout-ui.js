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

                clearPaymentPendingFlag();
                clearBasketCompletely();
                try { clearCheckoutDraft(); } catch { }
                setPaymentSuccessFlag({ reloadOnOk: true });
                window.location.href = window.location.origin;
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
