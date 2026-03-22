(function (window, document) {
function openOrderStatusModal(prefill = {}) {
    // Avoid duplicates
    if (document.getElementById("orderStatusModal")) return;

    const overlay = document.createElement("div");
    overlay.id = "orderStatusModal";

    const card = document.createElement("div");
    card.className = "order-status-modal__card";

    const header = document.createElement("div");
    header.className = "order-status-modal__header";

    const h = document.createElement("div");
    h.textContent = "Track your order";
    h.className = "order-status-modal__title";

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.className = "order-status-modal__close";
    close.onclick = () => overlay.remove();

    header.appendChild(h);
    header.appendChild(close);

    const form = document.createElement("div");
    form.className = "order-status-modal__form";

    const oidWrap = document.createElement("div");
    const oidLabel = document.createElement("div");
    oidLabel.textContent = "Order ID";
    oidLabel.className = "order-status-modal__label";
    const oidInput = document.createElement("input");
    oidInput.type = "text";
    oidInput.placeholder = "e.g. SS-2026-000123";
    oidInput.value = prefill.orderId ? String(prefill.orderId) : "";
    oidInput.className = "order-status-modal__input";
    oidWrap.appendChild(oidLabel);
    oidWrap.appendChild(oidInput);

    const tokWrap = document.createElement("div");
    const tokLabel = document.createElement("div");
    tokLabel.textContent = "Token";
    tokLabel.className = "order-status-modal__label";
    const tokInput = document.createElement("input");
    tokInput.type = "text";
    tokInput.placeholder = "public token";
    tokInput.value = prefill.token ? String(prefill.token) : "";
    tokInput.className = "order-status-modal__input";
    tokWrap.appendChild(tokLabel);
    tokWrap.appendChild(tokInput);

    const go = document.createElement("button");
    go.type = "button";
    go.textContent = "Check";
    go.className = "order-status-modal__primary";

    form.appendChild(oidWrap);
    form.appendChild(tokWrap);
    form.appendChild(go);

    const out = document.createElement("div");
    out.className = "order-status-modal__output";

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
    recent.className = "order-status-modal__recent";

    const recentTitle = document.createElement("div");
    recentTitle.textContent = "Recent orders on this device";
    recentTitle.className = "order-status-modal__recent-title";

    const recentList = document.createElement("div");
    recentList.className = "order-status-modal__recent-list";

    function renderRecent() {
        recentList.innerHTML = "";
        const items = getRecentOrders();
        if (!items.length) {
            const empty = document.createElement("div");
            empty.textContent = "No recent orders stored yet.";
            empty.className = "order-status-modal__empty";
            recentList.appendChild(empty);
            return;
        }
        for (const it of items) {
            const row = document.createElement("div");
            row.className = "order-status-modal__row";
            const left = document.createElement("div");
            left.className = "order-status-modal__row-main";
            const a = document.createElement("div");
            a.textContent = String(it.orderId);
            a.className = "order-status-modal__row-id";
            const b = document.createElement("div");
            b.textContent = _formatDateMaybe(it.ts);
            b.className = "order-status-modal__row-date";
            left.appendChild(a);
            left.appendChild(b);
            const actions = document.createElement("div");
            actions.className = "order-status-modal__row-actions";
            const view = document.createElement("button");
            view.type = "button";
            view.textContent = "View";
            view.className = "order-status-modal__view";
            view.onclick = () => {
                oidInput.value = String(it.orderId);
                tokInput.value = String(it.token || "");
                run();
            };
            actions.appendChild(view);
            row.appendChild(left);
            row.appendChild(actions);
            recentList.appendChild(row);
        }
    }

    recent.appendChild(recentTitle);
    recent.appendChild(recentList);
    card.appendChild(recent);
    renderRecent();

    overlay.appendChild(card);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

window.__SS_BOOT__?.onReady(async () => {
    try { if (typeof window.preloadSettingsData === "function") await window.preloadSettingsData(); } catch {}
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

const RECENT_ORDERS_KEY = 'recentOrders_v1';
function _safeJsonParse(raw) { try { return JSON.parse(raw); } catch { return null; } }
function getRecentOrders() {
    const raw = localStorage.getItem(RECENT_ORDERS_KEY);
    const arr = Array.isArray(_safeJsonParse(raw)) ? _safeJsonParse(raw) : [];
    return (arr || [])
        .filter(o => o && typeof o === 'object' && o.orderId && o.token)
        .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
        .slice(0, 25);
}
function addRecentOrder({ orderId, token, orderStatusUrl = null, paymentIntentId = null } = {}) {
    if (!orderId || !token) return;
    const entry = {
        ts: Date.now(),
        orderId: String(orderId),
        token: String(token),
        orderStatusUrl: orderStatusUrl ? String(orderStatusUrl) : null,
        paymentIntentId: paymentIntentId ? String(paymentIntentId) : null
    };
    const next = [entry, ...getRecentOrders().filter(o => String(o.orderId) !== String(orderId))].slice(0, 25);
    try { localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(next)); } catch {}
}
window.__SS_ORDERS__ = { openOrderStatusModal, fetchOrderStatus, pollPendingPaymentUntilFinal, resolveOrderIdByPaymentIntent, getRecentOrders, addRecentOrder };
})(window, document);
