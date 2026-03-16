(function (window, document) {
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

    // Recent-orders UI removed intentionally.

    overlay.appendChild(card);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

window.__SS_BOOT__?.onReady(async () => {
    try {
        const preload = window.preloadSettingsData || window.__SS_SETTINGS_RUNTIME__?.preloadSettingsData;
        if (typeof preload === "function") await preload();
    } catch (e) {
        console.warn("orders preloadSettingsData failed:", e);
    }
});

const ANALYTICS_VISITOR_KEY = 'snaglet_visitor_id';
const ANALYTICS_SESSION_KEY = 'snaglet_session_id';

/** Persistent pseudonymous visitor id (per browser) */
let analyticsVisitorId = localStorage.getItem(ANALYTICS_VISITOR_KEY);
if (!analyticsVisitorId) {
    analyticsVisitorId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(ANALYTICS_VISITOR_KEY, analyticsVisitorId);
}

/** Session id (per tab/session) */
let analyticsSessionId = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
if (!analyticsSessionId) {
    analyticsSessionId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(ANALYTICS_SESSION_KEY, analyticsSessionId);
}
try { window.__ssSessionId = analyticsSessionId; } catch { }


/**
 * Fire a lightweight analytics event to the server.
 * This should never block the UI or throw.
 */
  

async function fetchOrderStatus({ orderId, token } = {}) {
    const oid = String(orderId || '').trim();
    const t = String(token || '').trim();
    if (!oid || !t) throw new Error('Missing orderId or token.');
    const svc = window.__SS_ORDERS_SERVICE__;
    if (svc?.getOrderStatus) return svc.getOrderStatus(oid, t);
    const res = await window.__SS_API__.request(`/order-status/${encodeURIComponent(oid)}?token=${encodeURIComponent(t)}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.error || data?.message || `Order status failed (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.details = data;
        throw err;
    }
    return data;
}

async function pollPendingPaymentUntilFinal({ paymentIntentId, clientSecret, timeoutMs = 120000, intervalMs = 2500 } = {}) {
    if (!paymentIntentId) return { status: 'unknown' };
    const cs = clientSecret ? String(clientSecret) : null;
    const baseUrl = `/payment-intent-status/${encodeURIComponent(paymentIntentId)}`;
    const path = cs ? `${baseUrl}?clientSecret=${encodeURIComponent(cs)}` : baseUrl;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const svc = window.__SS_ORDERS_SERVICE__;
            const reply = svc?.getPaymentIntentStatus ? await svc.getPaymentIntentStatus(paymentIntentId, cs) : null;
            const resOk = reply ? reply.ok : null;
            const resStatus = reply ? reply.status : null;
            const data = reply ? (reply.data || {}) : (() => ({}))();
            if (resOk) {
                const status = String(data?.status || '');
                if (status === 'succeeded' || status === 'requires_payment_method' || status === 'canceled') return { status };
            } else if ((reply ? resStatus : null) === 400 && !cs) {
                return { status: 'missing_client_secret' };
            }
        } catch {}
        await new Promise(r => setTimeout(r, intervalMs));
    }
    return { status: 'timeout' };
}

async function resolveOrderIdByPaymentIntent({ paymentIntentId, clientSecret, checkoutId = null, checkoutToken = null, maxWaitMs = 60000, intervalMs = 1200 } = {}) {
    const piid = String(paymentIntentId || '').trim();
    const cs = String(clientSecret || '').trim();
    if (!piid || !piid.startsWith('pi_')) return null;
    if (!cs || !cs.includes('_secret_')) return null;
    const deadline = Date.now() + maxWaitMs;
    let attemptedFinalize = false;
    while (Date.now() < deadline) {
        try {
            const svc = window.__SS_ORDERS_SERVICE__;
            const reply = svc?.getOrderByPaymentIntent ? await svc.getOrderByPaymentIntent(piid, cs) : null;
            const resOk = reply ? reply.ok : null;
            const resStatus = reply ? reply.status : null;
            const data = reply ? (reply.data || {}) : (() => ({}))();
            if (resOk && data?.orderId) return String(data.orderId);
            if (((resStatus === 202) && data?.pending) || (!resOk && !attemptedFinalize)) {
                if (!attemptedFinalize) {
                    attemptedFinalize = true;
                    try {
                        if (checkoutId && checkoutToken && window.__SS_CHECKOUT_API__?.finalizeOrder) {
                            const fd = await window.__SS_CHECKOUT_API__.finalizeOrder({ paymentIntentId: piid, clientSecret: cs, checkoutId, token: checkoutToken });
                            if (fd?.orderId) return String(fd.orderId);
                        }
                    } catch {}
                }
                await new Promise(r => setTimeout(r, intervalMs));
                continue;
            }
            if (!resOk) {
                await new Promise(r => setTimeout(r, intervalMs));
                continue;
            }
            return null;
        } catch {
            await new Promise(r => setTimeout(r, intervalMs));
        }
    }
    return null;
}

window.__SS_ORDERS__ = { openOrderStatusModal, fetchOrderStatus, pollPendingPaymentUntilFinal, resolveOrderIdByPaymentIntent };
})(window, document);
