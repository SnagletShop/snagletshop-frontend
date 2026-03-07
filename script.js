
// --- PRICE PARSER (global, hoisted) ---
function __ssParsePriceEUR(v) {
    try {
        if (v == null) return 0;
        if (typeof v === "number") return Number.isFinite(v) ? v : 0;
        let s = String(v).trim();
        if (!s) return 0;

        // remove spaces and currency/other symbols, keep digits and separators
        s = s.replace(/\s+/g, "");
        s = s.replace(/[^0-9,\.\-]/g, "");

        // handle "1.234,56" vs "1,234.56"
        const hasComma = s.includes(",");
        const hasDot = s.includes(".");
        if (hasComma && hasDot) {
            const lastComma = s.lastIndexOf(",");
            const lastDot = s.lastIndexOf(".");
            if (lastComma > lastDot) {
                // comma is decimal separator
                s = s.replace(/\./g, "");
                s = s.replace(/,/g, ".");
            } else {
                // dot is decimal separator
                s = s.replace(/,/g, "");
            }
        } else if (hasComma && !hasDot) {
            // treat comma as decimal separator
            s = s.replace(/,/g, ".");
        }
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : 0;
    } catch {
        return 0;
    }
}

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

// Routing mode: path routes (/p/<id>) require server rewrite. Query routes (/?p=<id>) are reload-safe on any static host.
// Set to true only if your web server rewrites /p/* to /index.html.
const __SS_USE_PATH_ROUTES__ = false;
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

/* ---------------- Add-to-basket popup toggles ----------------
   Two modes for the "added to basket" notification:
   1) Legacy: browser alert()
   2) New: a toast that originates from the Basket icon
   Set exactly one of these to true.
*/
const USE_ADD_TO_CART_POPUP_LEGACY_ALERT = false;
const USE_ADD_TO_CART_POPUP_BASKET_TOAST = false;

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

function __ssAbFNV1a32(str) {
    const s = String(str || "");
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        // h *= 16777619 (with overflow)
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
}

let __ss_ab_mem_uid = null;

function __ssAbGetUid() {
    const k = "ss_ab_uid_v1";
    try {
        let v = localStorage.getItem(k);
        if (v && String(v).trim()) return String(v).trim();
        // Generate a random stable uid for this browser.
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            const a = new Uint32Array(4);
            crypto.getRandomValues(a);
            v = Array.from(a).map(x => x.toString(16)).join("");
        } else {
            v = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2));
        }
        localStorage.setItem(k, v);
        return v;
    } catch {
        // localStorage unavailable (privacy mode / blocked). Use an in-memory uid for this session.
        if (!__ss_ab_mem_uid) {
            try {
                if (typeof crypto !== "undefined" && crypto.getRandomValues) {
                    const a = new Uint32Array(4);
                    crypto.getRandomValues(a);
                    __ss_ab_mem_uid = Array.from(a).map(x => x.toString(16)).join("");
                } else {
                    __ss_ab_mem_uid = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2));
                }
            } catch {
                __ss_ab_mem_uid = String(Date.now()) + "_" + Math.random().toString(16).slice(2);
            }
        }
        return __ss_ab_mem_uid;
    }
}

function __ssAbChooseBucket(expKey) {
    const uid = __ssAbGetUid();
    const h = __ssAbFNV1a32(`${uid}|${String(expKey || "")}`);
    // 0..1
    const p = h / 0xFFFFFFFF;
    return (p < 0.5) ? "A" : "B";
}

let __ss_ab_cache = null;
let __ss_server_ab = null;
let __ss_server_ab_promise = null;

async function __ssFetchServerExperiments() {
    try {
        if (__ss_server_ab) return __ss_server_ab;
        if (__ss_server_ab_promise) return __ss_server_ab_promise;

        __ss_server_ab_promise = (async () => {
            try {
                const r = await fetch(`${API_BASE}/ab/assignments`, { method: "GET", credentials: "include" });
                const d = await r.json().catch(() => null);
                try { console.log("[recs] IN", { ok: !!(d && d.ok), widgetId: d && d.widgetId, sourceProductId: d && d.sourceProductId, items: Array.isArray(d && d.items) ? d.items.length : 0, hasMore: d && d.hasMore, listToken: (d && d.listToken) || null, token: (d && d.token) || null }); } catch { }
                if (d && d.ok && d.experiments && typeof d.experiments === "object") {
                    __ss_server_ab = d.experiments;
                    __ss_ab_cache = d.experiments; // keep UI consistent with server (esp. pricing)
                    return __ss_server_ab;
                }
            } catch { }
            return null;
        })();

        return __ss_server_ab_promise;
    } catch {
        return null;
    }
}

function __ssGetExperiments() {
    if (__ss_ab_cache) return __ss_ab_cache;
    if (__ss_server_ab) {
        __ss_ab_cache = __ss_server_ab;
        return __ss_ab_cache;
    }
    const keys = ["pn", "pd", "pr", "dl", "pi"];
    const out = {};
    for (const k of keys) out[k] = __ssAbChooseBucket(k);
    __ss_ab_cache = out;
    if (__dbg) { try { console.log('out', out); console.groupEnd(); } catch { } }
    return out;
}

// Fire-and-forget bootstrap (best effort)
try { __ssFetchServerExperiments(); } catch { }

function __ssABIsB(key) {
    try { return String(__ssGetExperiments()?.[key] || "A").toUpperCase() === "B"; } catch { return false; }
}

function __ssABGetProductName(product) {
    const a = String(product?.name || "").trim();
    if (!a) return "";
    if (__ssABIsB("pn")) {
        const b = product?.nameB ?? product?.abNameB ?? product?.ab_name_b ?? product?.abName ?? "";
        return String(b || a).trim();
    }
    return a;
}

function __ssABGetProductDescription(product) {
    const a = String(product?.description || "").trim();
    if (__ssABIsB("pd")) {
        const b = product?.descriptionB ?? product?.abDescriptionB ?? product?.abDescB ?? product?.ab_description_b ?? "";
        return String(b || a).trim();
    }
    return a;
}

function __ssABGetDeliveryText(product) {
    const a = String(product?.deliveryText || product?.delivery || "Shipping free").trim();
    const b = String(product?.deliveryTextB || product?.deliveryB || "Free shipping").trim();
    return __ssABIsB("dl") ? (b || a) : (a || b);
}

// In the basket UI we always want this exact text:
function __ssShipFreeText() { return "Shipping free"; }

function __ssEnsureABUiStyles() {
    if (document.getElementById("__ss-ab-ui-styles")) return;
    const style = document.createElement("style");
    style.id = "__ss-ab-ui-styles";
    style.textContent = `
  .ReceiptItemName{display:block;}
  .ReceiptItemShipFree{font-size:12px;opacity:.85;margin-top:2px;line-height:1.2;}
  .BasketItemShipFree{font-size:12px;opacity:.85;margin-top:6px;line-height:1.2;}
  .Product_Delivery_Info{margin-top:10px;font-size:13px;opacity:.9;line-height:1.2;}
  `;
    document.head.appendChild(style);
}


function __ssABGetPrimaryImageUrl(product) {
    try {
        const p = product;
        let url = "";

        if (__ssABIsB("pi")) {
            if (p && typeof p.imageB === "string" && p.imageB.trim()) {
                url = p.imageB.trim();
            } else if (p && Array.isArray(p.imagesB)) {
                const firstB = p.imagesB.find(u => typeof u === "string" && u.trim());
                if (firstB) url = firstB.trim();
            }
        }

        if (!url) {
            if (p && typeof p.image === "string" && p.image.trim()) {
                url = p.image.trim();
            } else if (p && Array.isArray(p.images)) {
                const first = p.images.find(u => typeof u === "string" && u.trim());
                if (first) url = first.trim();
            }
        }

        return url || "";
    } catch {
        return "";
    }
}

function __ssEnsureBasketToastStyles() {
    // Styles are defined in index.html (using CSS variables for light/dark mode).
    // Keep this function as a no-op for backward compatibility.
    return;
}

function __ssGetBasketButtonEl() {
    const candidates = Array.from(document.querySelectorAll("#BasketButtonDesktop, #BasketButtonMobile, .BasketButton, .mobileBasketButton"));
    const visible = candidates.find((el) => {
        try {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return el.offsetParent !== null && r.width > 0 && r.height > 0;
        } catch {
            return false;
        }
    });
    return visible || candidates[0] || null;
}


let __ssActiveBasketToast = null;
let __ssActiveBasketToastTimers = [];

/* Persistent basket indicator (badge) */
function __ssGetBasketCounts() {
    const b = (typeof basket === "object" && basket) ? basket : {};
    let totalQty = 0;
    let distinct = 0;

    for (const it of Object.values(b)) {
        if (!it) continue;
        distinct += 1;
        totalQty += Math.max(0, parseInt(it.quantity || 0, 10) || 0);
    }
    return { totalQty, distinct };
}

function __ssUpdateBasketHeaderIndicator() {
    const { totalQty } = __ssGetBasketCounts();

    const buttons = Array.from(document.querySelectorAll(".BasketButton, .mobileBasketButton, #BasketButtonDesktop, #BasketButtonMobile"));
    for (const btn of buttons) {
        if (!btn) continue;

        let badge = btn.querySelector(".ss-cart-badge");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "ss-cart-badge";
            badge.setAttribute("aria-hidden", "true");
            btn.appendChild(badge);
        }

        if (totalQty > 0) {
            badge.style.display = "inline-flex";
            badge.textContent = totalQty > 99 ? "99+" : String(totalQty);
            btn.classList.add("ss-has-items");
            btn.setAttribute("aria-label", `Basket (${totalQty} items)`);
        } else {
            badge.style.display = "none";
            btn.classList.remove("ss-has-items");
            btn.setAttribute("aria-label", "Basket");
        }
    }
}

function __ssCloseActiveBasketToast() {
    try {
        if (__ssActiveBasketToast) {
            __ssActiveBasketToast.remove();
        }
    } catch { }
    __ssActiveBasketToast = null;
    try {
        for (const t of __ssActiveBasketToastTimers) clearTimeout(t);
    } catch { }
    __ssActiveBasketToastTimers = [];
}

function __ssUndoAddToCart(itemKey, qty) {
    const key = String(itemKey || "");
    const q = Math.max(1, parseInt(qty, 10) || 1);
    if (!key || !basket || !basket[key]) return;

    const nextQty = (parseInt(basket[key].quantity || 0, 10) || 0) - q;
    if (nextQty <= 0) delete basket[key];
    else basket[key].quantity = nextQty;

    try {
        if (typeof persistBasket === "function") persistBasket("undo_add_to_cart");
        else localStorage.setItem("basket", JSON.stringify(basket));
    } catch {
        try { localStorage.setItem("basket", JSON.stringify(basket)); } catch { }
    }

    try { refreshBasketUIIfOpen(); } catch { }
}


function __ssShowBasketToastAddToCart({ qty, productName, optMsg, imageUrl, itemKey }) {
    __ssEnsureBasketToastStyles();
    __ssCloseActiveBasketToast();

    const origin = __ssGetBasketButtonEl();
    const rect = origin ? origin.getBoundingClientRect() : null;

    let startX = rect ? (rect.left + rect.width / 2) : (window.innerWidth - 36);
    let startY = rect ? (rect.top + rect.height / 2) : 44;

    const toast = document.createElement("div");
    toast.className = "ss-basket-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.left = `${Math.round(startX)}px`;
    toast.style.top = `${Math.round(startY)}px`;

    const row = document.createElement("div");
    row.className = "ss-basket-toast-row";

    const safeImg = String(imageUrl || "").trim();
    if (safeImg) {
        const img = document.createElement("img");
        img.className = "ss-basket-toast-thumb";
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.src = safeImg;
        row.appendChild(img);
    }

    const body = document.createElement("div");
    body.className = "ss-basket-toast-body";

    const l1 = document.createElement("div");
    l1.className = "ss-basket-toast-title";
    l1.textContent = "Added to basket";

    const l2 = document.createElement("div");
    l2.className = "ss-basket-toast-sub";
    l2.textContent = `${qty} × ${String(productName || "").trim()}${optMsg || ""}`;

    body.appendChild(l1);
    body.appendChild(l2);
    row.appendChild(body);
    toast.appendChild(row);

    const key = String(itemKey || "").trim();
    if (key) {
        const actions = document.createElement("div");
        actions.className = "ss-basket-toast-actions";

        const btnUndo = document.createElement("button");
        btnUndo.type = "button";
        btnUndo.className = "ss-basket-toast-btn";
        btnUndo.textContent = "Undo";

        const btnView = document.createElement("button");
        btnView.type = "button";
        btnView.className = "ss-basket-toast-btn primary";
        btnView.textContent = "View basket";

        btnUndo.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            try { __ssUndoAddToCart(key, qty); } catch { }
            __ssCloseActiveBasketToast();
        });

        btnView.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            __ssCloseActiveBasketToast();

            try {
                if (typeof trackedGoToCart === "function") trackedGoToCart();
                else if (typeof GoToCart === "function") GoToCart();
                else if (typeof navigate === "function") navigate("GoToCart");
            } catch { }
        });

        actions.appendChild(btnUndo);
        actions.appendChild(btnView);
        toast.appendChild(actions);
    }

    toast.addEventListener("click", (e) => {
        // Click anywhere on the toast (except buttons) closes it early.
        const t = e.target;
        if (t && t.closest && t.closest("button")) return;
        __ssCloseActiveBasketToast();
    });

    document.body.appendChild(toast);
    __ssActiveBasketToast = toast;

    // Clamp into viewport (mobile-safe) after we know the actual toast dimensions.
    try {
        const tr = toast.getBoundingClientRect();
        const pad = 10;
        const halfW = tr.width / 2;
        const halfH = tr.height / 2;
        const minX = pad + halfW;
        const maxX = window.innerWidth - pad - halfW;
        const minY = pad + halfH;
        const maxY = window.innerHeight - pad - halfH;

        startX = Math.max(minX, Math.min(maxX, startX));
        startY = Math.max(minY, Math.min(maxY, startY));

        toast.style.left = `${Math.round(startX)}px`;
        toast.style.top = `${Math.round(startY)}px`;
    } catch { }

    // Subtle pulse on the icon
    if (origin) {
        origin.classList.remove("ss-basket-pulse");
        void origin.offsetWidth; // reflow to retrigger
        origin.classList.add("ss-basket-pulse");
        __ssActiveBasketToastTimers.push(setTimeout(() => origin.classList.remove("ss-basket-pulse"), 280));
    }

    requestAnimationFrame(() => {
        toast.classList.add("ss-show");
        try {
            const tr2 = toast.getBoundingClientRect();
            const pad = 10;
            const halfH = tr2.height / 2;
            const minY = pad + halfH;
            const maxY = window.innerHeight - pad - halfH;
            const targetY = Math.max(minY, Math.min(maxY, startY - 18));
            toast.style.top = `${Math.round(targetY)}px`;
        } catch {
            toast.style.top = `${Math.round(startY - 18)}px`;
        }
    });

    const showMs = 2400;
    __ssActiveBasketToastTimers.push(setTimeout(() => {
        if (!toast.isConnected) return;
        toast.classList.remove("ss-show");
        toast.classList.add("ss-hide");
        try {
            const tr3 = toast.getBoundingClientRect();
            const pad = 10;
            const halfH = tr3.height / 2;
            const minY = pad + halfH;
            const maxY = window.innerHeight - pad - halfH;
            const targetY = Math.max(minY, Math.min(maxY, startY - 30));
            toast.style.top = `${Math.round(targetY)}px`;
        } catch {
            toast.style.top = `${Math.round(startY - 30)}px`;
        }
    }, showMs));

    __ssActiveBasketToastTimers.push(setTimeout(() => {
        __ssCloseActiveBasketToast();
    }, showMs + 420));
}

function __ssNotifyAddToCart({ qty, productName, optMsg, imageUrl, itemKey }) {
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const name = String(productName || "").trim();

    if (USE_ADD_TO_CART_POPUP_BASKET_TOAST) {
        try {
            __ssShowBasketToastAddToCart({
                qty: q,
                productName: name,
                optMsg: optMsg || "",
                imageUrl: imageUrl || "",
                itemKey: itemKey || ""
            });
            return;
        } catch { }
    }

    if (USE_ADD_TO_CART_POPUP_LEGACY_ALERT) {
        try {
            alert(`${q} x ${name}${optMsg || ""} added to cart!`);
        } catch { }
    }
}


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

        const productId = String(it?.productId || "").trim();

        const out = {
            ...it,
            productLink: canonicalLink || productLink
        };
        if (productId) out.productId = productId;

        return out;
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

// --- Image URL normalization (GitHub raw refs -> stable CDN) ---
// Some catalogs contain image URLs like:
//   https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/main/<path>
// which can intermittently fail on some networks with ERR_SSL_PROTOCOL_ERROR.
// Normalize to a stable URL and prefer jsDelivr CDN.
function __ssFixImageUrl(u) {
    try {
        let s = String(u || "").trim();
        if (!s) return s;
        // raw.github.../refs/heads/<branch>/...  -> raw.github.../<branch>/...
        if (s.includes("raw.githubusercontent.com/") && s.includes("/refs/heads/")) {
            s = s.replace("/refs/heads/", "/");
        }
        // Prefer jsDelivr for SnagletShop image repo.
        // raw: https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/main/<encodedPath>
        const m = s.match(/^https:\/\/raw\.githubusercontent\.com\/SnagletShop\/snagletshop-frontend\/main\/(.+)$/);
        if (m && m[1]) {
            const decodedPath = decodeURIComponent(m[1]);
            return `https://cdn.jsdelivr.net/gh/SnagletShop/snagletshop-frontend@main/${decodedPath}`;
        }
        return s;
    } catch {
        return String(u || "");
    }
}

function __ssNormalizeCatalogImages(catalogObj) {
    try {
        if (!catalogObj || typeof catalogObj !== "object") return catalogObj;
        for (const cat of Object.keys(catalogObj)) {
            const list = catalogObj[cat];
            if (!Array.isArray(list)) continue;
            for (const p of list) {
                if (!p || typeof p !== "object") continue;
                if (p.image) p.image = __ssFixImageUrl(p.image);
                if (Array.isArray(p.images)) p.images = p.images.map(__ssFixImageUrl);
                if (Array.isArray(p.imagesB)) p.imagesB = p.imagesB.map(__ssFixImageUrl);
            }
        }
    } catch { }
    return catalogObj;
}

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

            // ---- helpers: dedupe within /catalog payload ----
            const __ssNorm = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\p{L}\p{N} ]+/gu, "");
            const __ssDedupeByKey = (arr) => {
                const out = [];
                const seen = new Set();
                for (const p of (arr || [])) {
                    if (!p) continue;
                    const key =
                        (p.productId ? `id:${p.productId}` : "") ||
                        (p.productLink ? `l:${p.productLink}` : "") ||
                        `n:${__ssNorm(p.name)}|i:${String(p.image || "").trim()}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(p);
                }
                return out;
            };

            // ---- canonical shape (/catalog) ----
            if (productsPayload && productsPayload.productsById && productsPayload.categories) {
                const productsById = productsPayload.productsById || {};
                const categories = productsPayload.categories || {};

                const resolvedCatalog = {};
                for (const [cat, ids] of Object.entries(categories)) {
                    // 1) Dedupe ids in case categories array contains repeats
                    const uniqIds = Array.from(new Set(ids || []));
                    // 2) Resolve ids -> products
                    const list = uniqIds.map(id => productsById[id]).filter(Boolean);
                    // 3) Final safety: dedupe by stable key (productId/link/name+image)
                    resolvedCatalog[cat] = __ssDedupeByKey(list);
                }

                productsDatabase = resolvedCatalog;
                __ssNormalizeCatalogImages(productsDatabase);
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

            // Legacy payloads can already be category->array. Dedupe each category defensively.
            const rawCatalog = catalog || {};
            const deduped = {};
            for (const [cat, list] of Object.entries(rawCatalog)) {
                deduped[cat] = Array.isArray(list) ? __ssDedupeByKey(list) : list;
            }

            productsDatabase = deduped;
            __ssNormalizeCatalogImages(productsDatabase);
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
const HISTORY_SESSION_KEY = "ss_history_stack_v1";
const HISTORY_INDEX_SESSION_KEY = "ss_history_index_v1";
let __ssHandlingPopstate = false;
let __ssModalHistoryPushed = false;

function __ssPersistHistoryState() {
    try {
        sessionStorage.setItem(HISTORY_SESSION_KEY, JSON.stringify(userHistoryStack || []));
        sessionStorage.setItem(HISTORY_INDEX_SESSION_KEY, String(Number.isFinite(currentIndex) ? currentIndex : -1));
    } catch { }
}

function __ssRestoreHistoryStateFromSession() {
    try {
        const rawStack = sessionStorage.getItem(HISTORY_SESSION_KEY);
        const rawIndex = sessionStorage.getItem(HISTORY_INDEX_SESSION_KEY);
        const parsed = rawStack ? JSON.parse(rawStack) : null;
        if (Array.isArray(parsed) && parsed.length) {
            userHistoryStack = parsed;
            const idx = parseInt(rawIndex ?? String(parsed.length - 1), 10);
            currentIndex = Number.isFinite(idx) ? Math.max(0, Math.min(idx, parsed.length - 1)) : (parsed.length - 1);
            return true;
        }
    } catch { }
    return false;
}

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
            const pidRaw = state?.data?.[4];
            const pid = __ssIdNorm(pidRaw);
            const disc = state?.data?.[5] && typeof state.data[5] === "object" ? state.data[5] : null;
            const tok = __ssIdNorm(disc?.discountToken || disc?.recoToken || "");

            const pidOk = pid && !__ssIsBadId(pid);
            if (pidOk) {
                if (__SS_USE_PATH_ROUTES__) {
                    if (tok) return `/p/${encodeURIComponent(pid)}?reco=${encodeURIComponent(tok)}`;
                    return `/p/${encodeURIComponent(pid)}`;
                }
                // reload-safe routing
                if (tok) return `/?p=${encodeURIComponent(pid)}&reco=${encodeURIComponent(tok)}`;
                return `/?p=${encodeURIComponent(pid)}`;
            }
            if (name) return `/?product=${encodeURIComponent(name)}`;
        }
    } catch { }
    // for every other state, keep URL clean (important so product param doesn't “stick”)
    return "/";
}

function navigate(action, data = null, options = null) {
    if (isReplaying) return;

    const opts = (options && typeof options === "object") ? options : {};
    const replaceCurrent = opts.replaceCurrent === true;
    const newState = { action, data };
    const lastState = userHistoryStack[currentIndex] || null;
    const sameAsLast = !!(lastState && JSON.stringify(lastState) === JSON.stringify(newState));

    if (sameAsLast) {
        try { history.replaceState({ index: currentIndex }, "", buildUrlForState(newState)); } catch { }
        __ssPersistHistoryState();
        handleStateChange(newState);
        return;
    }

    if (replaceCurrent && currentIndex >= 0 && userHistoryStack[currentIndex]) {
        userHistoryStack[currentIndex] = newState;
        try { history.replaceState({ index: currentIndex }, "", buildUrlForState(newState)); } catch { }
        __ssPersistHistoryState();
        handleStateChange(newState);
        return;
    }

    // Trim future if navigating from mid-history
    if (currentIndex < userHistoryStack.length - 1) {
        userHistoryStack = userHistoryStack.slice(0, currentIndex + 1);
    }

    // Add new state
    userHistoryStack.push(newState);

    if (userHistoryStack.length > MAX_HISTORY_LENGTH) {
        const overflow = userHistoryStack.length - MAX_HISTORY_LENGTH;
        userHistoryStack = userHistoryStack.slice(overflow);
        currentIndex = userHistoryStack.length - 1;
    } else {
        currentIndex = userHistoryStack.length - 1;
    }

    history.pushState({ index: currentIndex }, "", buildUrlForState(newState));
    __ssPersistHistoryState();
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

function __ssIdNorm(v) {
    if (v == null) return "";
    // Defensive: some upstream code accidentally passes Set/Array instead of a string id.
    if (typeof Set !== "undefined" && v instanceof Set) {
        for (const x of v) {
            const s = String(x ?? "").trim();
            if (s) return s;
        }
        return "";
    }
    if (Array.isArray(v)) {
        for (const x of v) {
            const s = String(x ?? "").trim();
            if (s) return s;
        }
        return "";
    }
    return String(v).trim();
}
function __ssIdEq(a, b) {
    const aa = __ssIdNorm(a);
    const bb = __ssIdNorm(b);
    return !!aa && !!bb && aa === bb;
}

function __ssIsBadId(v) {
    const s = String(v ?? '').trim();
    if (!s) return true;
    if (/^\[object\s+/.test(s)) return true;
    return false;
}

function __ssResolvePidFromCatalogByName(name) {
    const nRaw = String(name ?? '').trim();
    if (!nRaw) return '';
    const n = nRaw;
    const nLower = nRaw.toLowerCase();
    try {
        const flat = __ssGetCatalogFlat();
        // 1) exact trimmed match
        let hit = (flat || []).find(p => String(p?.name ?? '').trim() === n);
        // 2) case-insensitive trimmed match
        if (!hit) hit = (flat || []).find(p => String(p?.name ?? '').trim().toLowerCase() === nLower);
        const pid = __ssIdNorm(hit?.productId || '');
        return __ssIsBadId(pid) ? '' : pid;
    } catch { return ''; }
}

function __ssResolvePidForRecs(product) {
    // 1) direct productId
    try {
        const pid = __ssIdNorm(product?.productId || '');
        if (pid && !__ssIsBadId(pid) && !/\s/.test(pid)) return pid;
        if (pid && !__ssIsBadId(pid) && /\s/.test(pid)) {
            // looks like a name, try resolve
            const rp = __ssResolvePidFromCatalogByName(pid);
            if (rp) return rp;
        }
    } catch { }

    // 2) URL /p/<pid>
    try {
        const path = String(location.pathname || '');
        const mm = path.match(/^\/p\/([^\/]+)\/?$/);
        if (mm && mm[1]) {
            const pid = __ssIdNorm(decodeURIComponent(mm[1]));
            if (pid && !__ssIsBadId(pid) && !/\s/.test(pid)) return pid;
            if (pid && !__ssIsBadId(pid) && /\s/.test(pid)) {
                const rp = __ssResolvePidFromCatalogByName(pid);
                if (rp) return rp;
            }
        }
    } catch { }

    // 3) global
    try {
        const pid = __ssIdNorm(window.__ssCurrentProductId || '');
        if (pid && !__ssIsBadId(pid) && !/\s/.test(pid)) return pid;
        if (pid && !__ssIsBadId(pid) && /\s/.test(pid)) {
            const rp = __ssResolvePidFromCatalogByName(pid);
            if (rp) return rp;
        }
    } catch { }

    // 4) discount payload
    try {
        const d = JSON.parse(sessionStorage.getItem('ss_reco_pdp_discount_v1') || 'null');
        const pid = __ssIdNorm(d?.productId || d?.targetProductId || '');
        if (pid && !__ssIsBadId(pid) && !/\s/.test(pid)) return pid;
        if (pid && !__ssIsBadId(pid) && /\s/.test(pid)) {
            const rp = __ssResolvePidFromCatalogByName(pid);
            if (rp) return rp;
        }
    } catch { }

    // 5) name -> pid
    try {
        const name = String(product?.name ?? product?.title ?? '').trim();
        const rp = __ssResolvePidFromCatalogByName(name);
        if (rp) return rp;
    } catch { }

    return '';
}

function __ssGetCurrentPidFallback() {
    try {
        // 1) URL /p/<pid>
        const path = String(location.pathname || '');
        const mm = path.match(/^\/p\/([^\/]+)\/?$/);
        if (mm && mm[1]) {
            const pid = __ssIdNorm(decodeURIComponent(mm[1]));
            if (!__ssIsBadId(pid)) {
                if (/\s/.test(pid)) {
                    const rp = __ssResolvePidFromCatalogByName(pid);
                    if (rp) return rp;
                }
                return pid;
            }
        }
    } catch { }
    try {
        // 1b) URL query ?p=<pid> (reload-safe routing)
        const params = new URLSearchParams(String(location.search || ''));
        const qp = params.get('p') || params.get('pid') || params.get('productId');
        if (qp) {
            const pid = __ssIdNorm(qp);
            if (!__ssIsBadId(pid)) return pid;
        }
    } catch { }
    try {
        // 2) stored global
        const pid = __ssIdNorm(window.__ssCurrentProductId || '');
        if (!__ssIsBadId(pid)) {
            if (/\s/.test(pid)) {
                const rp = __ssResolvePidFromCatalogByName(pid);
                if (rp) return rp;
            }
            return pid;
        }
    } catch { }
    try {
        // 3) discount payload
        const d = JSON.parse(sessionStorage.getItem('ss_reco_pdp_discount_v1') || 'null');
        const pid = __ssIdNorm(d?.productId || d?.targetProductId || '');
        if (!__ssIsBadId(pid)) {
            if (/\s/.test(pid)) {
                const rp = __ssResolvePidFromCatalogByName(pid);
                if (rp) return rp;
            }
            return pid;
        }
    } catch { }
    return '';
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
    try { __ssUpdateBasketHeaderIndicator(); } catch { }

}

function persistBasket(reason = "update") {
    try { localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket)); } catch { }
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch { }

    if (basketBC) {
        try { basketBC.postMessage({ type: "basket_changed", from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch { }
    }
    try { __ssUpdateBasketHeaderIndicator(); } catch { }

}

function clearBasketStorage(reason = "clear") {
    try { localStorage.removeItem(BASKET_STORAGE_KEY); } catch { }
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch { }

    if (basketBC) {
        try { basketBC.postMessage({ type: "basket_changed", from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch { }
    }
    try { __ssUpdateBasketHeaderIndicator(); } catch { }

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
                storefrontConfig: null,
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
                window.preloadedData.storefrontConfig = cached.storefrontConfig || cached.storefront || null;

                handlesTariffsDropdown(window.preloadedData.countries || []);
                console.log("⚡ Using cached settings data.");
                return;
            }

            // Fetch fresh settings (NO fetchTariffs() here -> breaks recursion)
            const [tariffsObj, ratesData, countriesArr, storefrontCfg] = await Promise.all([
                fetchTariffsFromServer(),
                fetchExchangeRatesFromServer(),
                fetchCountriesFromServer().catch(() => null),
                fetchStorefrontConfigFromServer().catch(() => null)
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
            window.preloadedData.storefrontConfig = (typeof storefrontCfg !== "undefined" ? storefrontCfg : (window.storefrontCfg || null));

            lsSet(SETTINGS_CACHE_KEY, JSON.stringify({
                tariffs: tariffMultipliers,
                rates: exchangeRates,
                ratesFetchedAt: Number(window.exchangeRatesFetchedAt || 0) || 0,
                countries: countriesList,
                storefrontConfig: storefrontCfg || null,
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
function sendAnalyticsEvent(type, payload = {}, options = {}) {
    try {
        const p = (payload && typeof payload === "object") ? payload : {};
        const mergedExtra = {
            visitorId: analyticsVisitorId,
            sessionId: analyticsSessionId,
            ...(p.extra && typeof p.extra === "object" ? p.extra : {})
        };

        fetch(`${API_BASE}/analytics/event`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                sessionId: analyticsSessionId,
                path: window.location.pathname + window.location.search,
                websiteOrigin: window.location.hostname,
                ...p,
                extra: mergedExtra
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


function __ssToken(prefix = "t") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let __ssLastClickToken = null;
let __ssCurrentViewToken = null;
let __ssCurrentViewStartedAt = 0;

function __ssRememberClickToken(token) {
    try {
        __ssLastClickToken = token;
        sessionStorage.setItem("__ss_last_click_token", token);
        sessionStorage.setItem("__ss_last_click_token_ts", String(Date.now()));
    } catch { }
}

function __ssConsumeRecentClickToken(maxAgeMs = 15000) {
    try {
        const token = sessionStorage.getItem("__ss_last_click_token");
        const ts = Number(sessionStorage.getItem("__ss_last_click_token_ts") || 0);
        if (token && Number.isFinite(ts) && (Date.now() - ts) <= maxAgeMs) return token;
    } catch { }
    return null;
}

function __ssStartProductViewSession() {
    __ssCurrentViewToken = __ssToken("view");
    __ssCurrentViewStartedAt = Date.now();
    return __ssCurrentViewToken;
}

function __ssEndProductViewSessionSend(productName, productLink) {
    try {
        if (!__ssCurrentViewToken || !__ssCurrentViewStartedAt) return;
        const dur = Date.now() - __ssCurrentViewStartedAt;
        const clickToken = __ssConsumeRecentClickToken();

        sendAnalyticsEvent('product_time', {
            product: {
                name: String(productName || ""),
                productLink: String(productLink || "")
            },
            extra: {
                viewToken: __ssCurrentViewToken,
                clickToken: clickToken || null,
                durationMs: dur
            }
        }, { keepalive: true });
    } catch { }
}


// Send product_time when leaving/hiding the page (best effort)
window.addEventListener('beforeunload', () => {
    try {
        const n = window.__ssCurrentViewedProductName || "";
        const l = window.__ssCurrentViewedProductLink || "";
        __ssEndProductViewSessionSend(n, l);
    } catch { }
});

document.addEventListener('visibilitychange', () => {
    try {
        if (document.visibilityState === 'hidden') {
            const n = window.__ssCurrentViewedProductName || "";
            const l = window.__ssCurrentViewedProductLink || "";
            __ssEndProductViewSessionSend(n, l);
        }
    } catch { }
});

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
    const index = event.state?.index;
    const wantsModalOpen = event.state?.modalOpen === true;
    __ssHandlingPopstate = true;
    try {
        if (modal && typeof closeModal === "function") {
            closeModal({ fromHistory: true });
        }

        if (typeof index === 'number' && userHistoryStack[index]) {
            isReplaying = true;
            currentIndex = index;
            __ssPersistHistoryState();
            handleStateChange(userHistoryStack[index]);
            isReplaying = false;
            __ssModalHistoryPushed = wantsModalOpen;

            if (wantsModalOpen && typeof openModal === "function") {
                Promise.resolve().then(() => openModal({ fromHistory: true })).catch(() => { });
            }
            return;
        }

        if (wantsModalOpen && typeof openModal === "function") {
            __ssModalHistoryPushed = true;
            Promise.resolve().then(() => openModal({ fromHistory: true })).catch(() => { });
            return;
        }

        __ssModalHistoryPushed = false;
        console.warn("⚠️ Invalid popstate index:", event.state);
    } finally {
        __ssHandlingPopstate = false;
    }
});
function initializeHistory() {
    const params = new URLSearchParams(window.location.search);

    // Deep link: /p/<productId>?reco=<token>
    try {
        const path = String(window.location.pathname || "/");
        const mm = path.match(/^\/p\/([^\/]+)\/?$/);
        if (mm && mm[1]) {
            const pid = __ssIdNorm(decodeURIComponent(mm[1]));
            const recoTok = __ssIdNorm(params.get("reco") || "");
            const prod = getAllProductsFlatSafe().find(p => __ssIdEq(p?.productId, pid)) || null;
            if (prod) {
                const desc =
                    prod.description ||
                    TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER ||
                    "No description available.";

                if (recoTok) {
                    try {
                        const ent = __ssRecoDiscountStoreGet(recoTok);
                        if (ent && __ssIdEq(ent.productId, pid) && Number(ent.discountPct || 0) > 0) {
                            sessionStorage.setItem("ss_reco_pdp_discount_v1", JSON.stringify({
                                productId: pid,
                                discountToken: recoTok,
                                discountPct: Number(ent.discountPct || 0),
                                discountedPrice: Number(ent.discountedPrice || 0),
                                ts: Date.now()
                            }));
                        }
                    } catch { }
                }

                const state = {
                    action: "GoToProductPage",
                    data: [prod.name, prod.price, desc, null, pid, (recoTok ? { discountToken: recoTok } : null)]
                };

                userHistoryStack = [state];
                currentIndex = 0;
                __ssPersistHistoryState();
                history.replaceState({ index: 0 }, "", buildUrlForState(state));
                handleStateChange(state);
                return;
            }

            history.replaceState({ index: 0 }, "", "/");
        }
    } catch { }

    // Deep link: /?p=<productId>
    const pidParam = params.get("p") || params.get("pid") || params.get("productId");
    if (pidParam) {
        const pid = __ssIdNorm(pidParam);
        if (pid && !__ssIsBadId(pid)) {
            const prod = __ssGetCatalogFlat().find(p => String(p?.productId || "").trim() === String(pid).trim());
            if (prod) {
                const desc = ((__ssABGetProductDescription(prod) || prod.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER);
                const state = { action: "GoToProductPage", data: [prod.name, (__ssResolveVariantPriceEUR(prod, [], "") || prod.price), desc, null, pid, null] };
                userHistoryStack = [state];
                currentIndex = 0;
                __ssPersistHistoryState();
                history.replaceState({ index: 0 }, "", buildUrlForState(state));
                handleStateChange(state);
                return;
            }
        }
    }

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
            __ssPersistHistoryState();
            history.replaceState({ index: 0 }, "", buildUrlForState(state));
            handleStateChange(state);
            return;
        }

        history.replaceState({ index: 0 }, "", "/");
    }

    if (__ssRestoreHistoryStateFromSession() && currentIndex >= 0 && userHistoryStack[currentIndex]) {
        try { history.replaceState({ index: currentIndex }, "", buildUrlForState(userHistoryStack[currentIndex])); } catch { }
        handleStateChange(userHistoryStack[currentIndex]);
        return;
    }

    navigate("loadProducts", ["Default_Page", localStorage.getItem("defaultSort") || "NameFirst", window.currentSortOrder || "asc"]);
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

        try { __ssUpdateBasketHeaderIndicator(); } catch { }

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


async function fetchStorefrontConfigFromServer() {
    const res = await fetch(`${API_BASE}/storefront-config`, { cache: "no-store", credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch storefront config (${res.status})`);
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== "object") throw new Error("Invalid storefront config payload.");
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
            return;
        }

        navigate("loadProducts", [window.currentCategory || lastCategory || "Default_Page", localStorage.getItem("defaultSort") || "NameFirst", window.currentSortOrder || "asc"]);
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
function setPaymentPendingFlag({ paymentIntentId = null, orderId = null, clientSecret = null, checkoutId = null, checkoutToken = null } = {}) {
    if (!paymentIntentId && !clientSecret) return;
    try {
        localStorage.setItem(
            PAYMENT_PENDING_KEY,
            JSON.stringify({
                ts: Date.now(),
                paymentIntentId: paymentIntentId ? String(paymentIntentId) : null,
                orderId: orderId ? String(orderId) : null,
                clientSecret: clientSecret ? String(clientSecret) : null,
                checkoutId: checkoutId ? String(checkoutId) : null,
                checkoutToken: checkoutToken ? String(checkoutToken) : null
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

        const checkoutId = obj?.checkoutId ? String(obj.checkoutId) : null;
        const checkoutToken = obj?.checkoutToken ? String(obj.checkoutToken) : null;

        return { ts, paymentIntentId, clientSecret, orderId, checkoutId, checkoutToken };
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


async function resolveOrderIdByPaymentIntent({ paymentIntentId, clientSecret, maxWaitMs = 60000, intervalMs = 1200 } = {}) {
    const piid = String(paymentIntentId || "").trim();
    const cs = String(clientSecret || "").trim();
    if (!piid || !piid.startsWith("pi_")) return null;
    if (!cs || !cs.includes("_secret_")) return null;

    const deadline = Date.now() + maxWaitMs;
    let attemptedFinalize = false;
    while (Date.now() < deadline) {
        try {
            const url = `${API_BASE}/order-by-payment-intent/${encodeURIComponent(piid)}?clientSecret=${encodeURIComponent(cs)}`;
            const res = await fetch(url, { cache: "no-store" });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data?.orderId) return String(data.orderId);

            // 202 => webhook still processing; optionally attempt server-side finalization once
            if (res.status === 202 && data?.pending) {
                if (!attemptedFinalize) {
                    attemptedFinalize = true;
                    try {
                        const pending = getPaymentPendingFlag() || {};
                        const checkoutId = pending.checkoutId || window.latestCheckoutId || null;
                        const checkoutToken = pending.checkoutToken || window.latestCheckoutPublicToken || null;

                        const fr = await fetch(`${API_BASE}/finalize-order`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                paymentIntentId: piid,
                                clientSecret: cs,
                                checkoutId,
                                token: checkoutToken
                            })
                        });
                        const fd = await fr.json().catch(() => ({}));
                        if (fr.ok && fd?.orderId) return String(fd.orderId);
                    } catch { }
                }

                await new Promise(r => setTimeout(r, intervalMs));
                continue;
            }

            // If webhook isn't configured or the /order-by-payment-intent lookup didn't find a draft yet,
            // attempt server-side finalization once anyway (requires checkoutId+token).
            if (!res.ok && !attemptedFinalize) {
                attemptedFinalize = true;
                try {
                    const pending = getPaymentPendingFlag() || {};
                    const checkoutId = pending.checkoutId || window.latestCheckoutId || null;
                    const checkoutToken = pending.checkoutToken || window.latestCheckoutPublicToken || null;

                    if (checkoutId && checkoutToken) {
                        const fr = await fetch(`${API_BASE}/finalize-order`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                paymentIntentId: piid,
                                clientSecret: cs,
                                checkoutId,
                                token: checkoutToken
                            })
                        });
                        const fd = await fr.json().catch(() => ({}));
                        if (fr.ok && fd?.orderId) return String(fd.orderId);
                    }
                } catch { }
            }

            // If still unresolved, retry a bit (covers eventual webhook delivery)
            if (!res.ok) {
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

async function checkAndHandlePendingPaymentOnLoad() {
    const pending = getPaymentPendingFlag();
    if (!pending?.paymentIntentId) return;

    // Avoid stale "pending payment" flags causing random alerts during normal browsing.
    // If the flag is older than 15 minutes, clear it silently.
    const MAX_AGE_MS = 15 * 60 * 1000;
    if (pending?.ts && (Date.now() - Number(pending.ts) > MAX_AGE_MS)) {
        clearPaymentPendingFlag();
        return;
    }

    const { status } = await pollPendingPaymentUntilFinal({ paymentIntentId: pending.paymentIntentId, clientSecret: pending.clientSecret });

    if (status === "succeeded") {
        const checkoutToken = pending.checkoutToken || null;
        const resolvedOrderId = await resolveOrderIdByPaymentIntent({
            paymentIntentId: pending.paymentIntentId,
            clientSecret: pending.clientSecret
        });

        if (resolvedOrderId && checkoutToken) {
            const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
            window.latestOrderId = resolvedOrderId;
            window.latestOrderPublicToken = checkoutToken;
            window.latestOrderStatusUrl = statusUrl;
            addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: pending.paymentIntentId });
        }

        if (!resolvedOrderId) {
            alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update.");
            return;
        }

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

    // timeout/unknown: keep pending flag + keep basket.
    // Do not show a blocking alert here (it fires during normal browsing if the API is temporarily down).
    console.warn("Payment is still processing (or status check failed). Cart is unchanged. You can try again in a moment.");
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
            addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: finalPiId });
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
    const path = String(window.location.pathname || "/");
    const isProductDeepLink = path.startsWith("/p/") || params.has("product") || params.has("p") || params.has("pid") || params.has("productId");
    if (isPageRefresh && !isProductDeepLink && currentIndex >= 0) {
        try { history.replaceState({ index: currentIndex }, "", buildUrlForState(userHistoryStack[currentIndex] || { action: "loadProducts", data: [window.currentCategory || lastCategory || "Default_Page", localStorage.getItem("defaultSort") || "NameFirst", window.currentSortOrder || "asc"] })); } catch { }
    }
});





// === KEYBOARD SHORTCUTS (Alt + Arrow) ===
document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;

});













function searchQuery(query) {
    const normalized = String(query || "").trim();
    const input = document.getElementById("Search_Bar");
    const mobileInput = document.getElementById("Mobile_Search_Bar");

    if (input) input.value = normalized;
    if (mobileInput) mobileInput.value = normalized;

    console.debug(`🔍 Replaying search for: ${normalized}`);
    searchProducts(normalized);
}




function searchProducts(forcedQuery = null) {
    const queryDesktop = document.getElementById("Search_Bar")?.value || "";
    const queryMobile = document.getElementById("Mobile_Search_Bar")?.value || "";

    const activeElement = document.activeElement;
    let rawQuery = "";

    if (typeof forcedQuery === "string") {
        rawQuery = forcedQuery;
    } else if (activeElement?.id === "Mobile_Search_Bar") {
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

            nameLink.textContent = (__ssABGetProductName(product) || product.name);
            nameLink.style.textDecoration = "none";
            nameLink.addEventListener("click", (e) => {
                e.preventDefault();
                navigate("GoToProductPage", [
                    product.name,
                    (__ssResolveVariantPriceEUR(product, [], "") || product.price),
                    ((__ssABGetProductDescription(product) || product.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER)
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
                    (__ssResolveVariantPriceEUR(product, [], "") || product.price),
                    ((__ssABGetProductDescription(product) || product.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER)
                ]);
            });

            const priceP = document.createElement("p");
            priceP.className = "product-price";
            priceP.textContent = `${(__ssResolveVariantPriceEUR(product, [], "") || product.price)}€`;

            const quantityContainer = document.createElement("div");
            quantityContainer.className = "quantity-container";

            const quantityControls = document.createElement("div");
            quantityControls.className = "quantity-controls";

            const decBtn = document.createElement("button");
            decBtn.className = "Button";
            decBtn.textContent = TEXTS.BASKET.BUTTONS.DECREASE;
            decBtn.addEventListener("click", () => decreaseQuantity(product.productId || product.id || product.name));

            const quantitySpan = document.createElement("span");
            quantitySpan.className = "WhiteText";
            quantitySpan.id = `quantity-${__ssGetQtyKey(product.productId || product.id || product.name)}`;
            quantitySpan.textContent = String(__ssGetQtyValue(product.productId || product.id || product.name));

            const incBtn = document.createElement("button");
            incBtn.className = "Button";
            incBtn.textContent = TEXTS.BASKET.BUTTONS.INCREASE;
            incBtn.addEventListener("click", () => increaseQuantity(product.productId || product.id || product.name));

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
                    "",
                    __ssDefaultSelectedOptions(__ssExtractOptionGroups(product)),
                    (product.productId || null)
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
    if (!newCurrency) return;
    if (newCurrency === selectedCurrency) return;
    selectedCurrency = newCurrency;
    localStorage.setItem("selectedCurrency", selectedCurrency);
    syncCurrencySelects(selectedCurrency);
    updateAllPrices();
}

// Keep legacy mirror selector behavior (some UIs use #currency-select)
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

try { __ssUpdateBasketHeaderIndicator(); } catch { }

// Detect user's currency via IP API (if no saved preference)
function detectUserCurrency() {
    // Best-effort currency selection.
    // Priority:
    //  1) explicit saved currency (manual)
    //  2) server default (if provided)
    //  3) cached geo-detected currency (30d)
    //  4) one-shot geo detection (ipapi), with backoff on failure
    try {
        const saved = localStorage.getItem("selectedCurrency");
        if (saved) {
            selectedCurrency = saved;
            return Promise.resolve();
        }
    } catch { }
    try {
        const disabledUntil = Number(localStorage.getItem("geoCurrencyDisabledUntil") || 0);
        if (disabledUntil && Date.now() < disabledUntil) return Promise.resolve();

        const detectedAt = Number(localStorage.getItem("geoCurrencyDetectedAt") || 0);
        const cachedCountry = String(localStorage.getItem("detectedCountry") || "").toUpperCase();
        const cachedCurrency = String(localStorage.getItem("geoDetectedCurrency") || "");
        if (detectedAt && (Date.now() - detectedAt) < (30 * 24 * 60 * 60 * 1000) && cachedCurrency) {
            selectedCurrency = cachedCurrency;
            if (cachedCountry) localStorage.setItem("detectedCountry", cachedCountry);
            localStorage.setItem("selectedCurrency", selectedCurrency);
            updateAllPrices();
            return Promise.resolve();
        }
    } catch { }

    // Detect user's currency via IP API (best-effort). Never throw.
    return fetch("https://ipapi.co/json/", { cache: "no-store" })
        .then(r => r.json())
        .then(data => {
            const userCountry = String(data?.country_code || "").toUpperCase();
            if (!userCountry) return;

            selectedCurrency = countryToCurrency[userCountry] || "EUR";

            try {
                localStorage.setItem("selectedCurrency", selectedCurrency);
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
                localStorage.setItem("geoCurrencyDisabledUntil", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
            } catch { }
        });
}

function convertPriceNumber(priceInEur) {
    const eur = Number(priceInEur);
    const rate = Number(exchangeRates?.[selectedCurrency] ?? 1);
    let converted = (Number.isFinite(eur) ? eur : 0) * (Number.isFinite(rate) && rate > 0 ? rate : 1);

    const selectedCountry = localStorage.getItem("detectedCountry") || "US";
    const tariff = Number(tariffMultipliers?.[selectedCountry] ?? 0) || 0;

    const applyTariff = getApplyTariffFlag();
    if (applyTariff) {
        converted *= (1 + tariff);
    }

    // Keep everything in 2-decimal display space to avoid drift
    return Math.round(converted * 100) / 100;
}

function convertPrice(priceInEur) {
    return convertPriceNumber(priceInEur).toFixed(2);
}


// Function to update all prices
function updateAllPrices(rootEl) {
    const root = (rootEl || document);

    // Standard price nodes
    root.querySelectorAll(".price, .product-price, .basket-item-price, #product-page-price").forEach(element => {
        const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;

        // If element represents a recommendation discount (PDP or reco card), preserve the markup.
        const eur = parseFloat(element.dataset.eur);
        const eurOrig = parseFloat(element.dataset.eurOriginal);
        const pct = Number(element.dataset.recoDiscountPct || element.dataset.discountPct || 0);

        if (!isNaN(eurOrig) && eurOrig > 0 && !isNaN(eur) && eur > 0 && eurOrig > eur) {
            const convOrig = convertPrice(eurOrig);
            const convDisc = convertPrice(eur);
            if (pct > 0) {
                const __html = `<span style="text-decoration:line-through;opacity:.65;margin-right:4px">${currencySymbol}${convOrig}</span> <span style="font-weight:700">${currencySymbol}${convDisc}</span> `;
                if (element.innerHTML !== __html) element.innerHTML = __html;
            } else {
                // Cart-level / generic discount strike-through (no pct)
                const __html = `<span style="text-decoration:line-through;opacity:.65;margin-right:4px">${currencySymbol}${convOrig}</span> <span style="font-weight:700">${currencySymbol}${convDisc}</span> `;
                if (element.innerHTML !== __html) element.innerHTML = __html;
            }
            return;
        }

        if (!isNaN(eur)) {
            const convertedValue = convertPrice(eur);
            element.textContent = `${currencySymbol}${convertedValue}`;
        }
    });

    // Cart incentive amount fragments (e.g., "Add X to unlock")
    root.querySelectorAll(".ss-ci-amt[data-eur]").forEach(el => {
        const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;

        const minEurRaw = el.dataset.ciMinEur;
        const baseEurRaw = el.dataset.ciBaseEur;

        // If we have both, compute the "need" in display space:
        // need = convert(min) - convert(base)
        if (minEurRaw != null && baseEurRaw != null) {
            const minEUR = parseFloat(minEurRaw);
            const baseEUR = parseFloat(baseEurRaw);
            if (!isNaN(minEUR) && !isNaN(baseEUR)) {
                const need = Math.max(0, Math.round((convertPriceNumber(minEUR) - convertPriceNumber(baseEUR)) * 100) / 100);
                el.textContent = `${currencySymbol}${need.toFixed(2)}`;
                return;
            }
        }

        // Fallback: direct conversion of a EUR amount
        const eur = parseFloat(el.dataset.eur);
        if (isNaN(eur)) return;
        el.textContent = `${currencySymbol}${convertPrice(eur)}`;
    });

    // Cart incentive badges that represent EUR amounts (Saved / Bundle)
    root.querySelectorAll(".ss-ci-badge[data-eur]").forEach(el => {
        const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
        const eur = parseFloat(el.dataset.eur);
        if (isNaN(eur)) return;
        const kind = String(el.dataset.badgeKind || "").toLowerCase();
        const val = `${currencySymbol}${convertPrice(Math.abs(eur))}`;

        if (kind === "saved") {
            el.textContent = `Saved ${val}`;
        } else if (kind === "bundle") {
            el.textContent = `Bundle -${val}`;
        } else {
            // Generic amount badge
            el.textContent = val;
        }
    });

    // Update total price in basket
    let totalElement = document.getElementById("basket-total");
    if (totalElement) {
        let baseTotal = parseFloat(totalElement.dataset.eur);
        if (!isNaN(baseTotal)) {
            const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
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
    // Debounced, scoped price updater to avoid main-thread freezes.
    // Observes only the main Viewer area (where products are dynamically appended),
    // ignores Basket_Viewer / payment modal mutations, and batches updates.
    let target = document.getElementById("Viewer") || document.body;

    let pending = false;
    let timer = null;

    const schedule = () => {
        if (pending) return;
        pending = true;
        // Debounce: multiple mutations collapse into one update
        timer = setTimeout(() => {
            pending = false;
            try {
                // Only update within Viewer (product grid / PDP), not whole document
                const root = document.getElementById("Viewer") || document.body;
                updateAllPrices(root);
            } catch { }
        }, 80);
    };

    const shouldIgnoreNode = (node) => {
        try {
            if (!node) return false;
            if (node.nodeType === 3) node = node.parentElement; // text node
            if (!node || !node.closest) return false;
            // Ignore basket + payment modal + stripe iframes + recs carousels
            return !!node.closest("#Basket_Viewer, .payment-modal, .payment-modal-overlay, .payment-modal-card, .__PrivateStripeElement, iframe");
        } catch { return false; }
    };

    const observer = new MutationObserver((mutations) => {
        // If everything mutated is inside ignored containers, skip
        let allIgnored = true;
        for (const m of mutations) {
            if (m.type === "childList") {
                if ((m.addedNodes && m.addedNodes.length) || (m.removedNodes && m.removedNodes.length)) {
                    if (!shouldIgnoreNode(m.target)) { allIgnored = false; break; }
                }
            } else {
                if (!shouldIgnoreNode(m.target)) { allIgnored = false; break; }
            }
        }
        if (allIgnored) return;

        // During explicit suppression (e.g., basket rendering), skip
        if (window.__ssSuppressPriceObserver) return;

        // Ensure newly added price nodes have dataset.eur recorded once
        try {
            const root = document.getElementById("Viewer") || document.body;
            root.querySelectorAll(".price, .product-price, .basket-item-price, #product-page-price, .productPrice").forEach(el => {
                if (!el.dataset.eur) {
                    const base = parseFloat(String(el.textContent || "").replace(/[^0-9.]/g, ""));
                    if (!isNaN(base)) el.dataset.eur = String(base);
                }
            });
        } catch { }

        schedule();
    });

    observer.observe(target, { childList: true, subtree: true });
    // Expose for debugging / manual disconnect
    window.__ssPriceObserver = observer;
}


document.getElementById("currencySelect")?.addEventListener("change", function (event) {
    const v = event?.target?.value;
    if (typeof handleCurrencyChange === "function") {
        handleCurrencyChange(v);
        return;
    }
    selectedCurrency = v;
    localStorage.setItem("selectedCurrency", selectedCurrency);
    try { syncCurrencySelects(selectedCurrency); } catch { }
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

    if (typeof TomSelect === "function") {
        new TomSelect(select, {
            maxOptions: 1000,
            sortField: { field: "text", direction: "asc" },
            placeholder: "Select a country…",
            closeAfterSelect: true
        });
        console.log("✅ TomSelect initialized on countrySelect");
    } else {
        console.warn("TomSelect not loaded; using native country <select>.");
    }
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
          To exercise your rights or request help with an order, contact us at the email address shown on the checkout or confirmation email. You can always use our contact form or the email, listed below it, in case of problems!
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
        if (typeof TomSelect === "function") {
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
        } else {
            // Fallback: native select change handler already wired elsewhere
            currencySelect.classList.remove("tom-hidden");
        }
    }

    if (countrySelect) {
        if (typeof TomSelect === "function") {
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
        } else {
            countrySelect.classList.remove("tom-hidden");
        }
    }

    // Contact form submission logic (matches backend rules: valid email + message length >= 5)
    const isValidEmailClient = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

    const cf = document.getElementById("contact-form");
    if (cf) {
        cf.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = document.getElementById("contact-email")?.value?.trim() || "";
            const message = document.getElementById("contact-message")?.value?.trim() || "";

            const website = ""; // prevent autofill false-positives (do NOT read #contact-website)

            if (!isValidEmailClient(email)) {
                alert("Please enter a valid email address (e.g., name@example.com).");
                return;
            }
            if (message.length < 5) {
                alert("Please enter a message (at least 5 characters).");
                return;
            }

            // IMPORTANT: declare BEFORE using it anywhere
            let turnstileToken = "";
            try {
                turnstileToken =
                    (await snagletGetTurnstileToken({ forceFresh: true })) ||
                    document.querySelector('input[name="cf-turnstile-response"]')?.value ||
                    "";
            } catch {
                turnstileToken =
                    document.querySelector('input[name="cf-turnstile-response"]')?.value || "";
            }

            try {
                const response = await fetch(`${API_BASE}/send-message`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, message, turnstileToken, website }),
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
        window.preloadedData.storefrontConfig = (typeof storefrontCfg !== "undefined" ? storefrontCfg : (window.storefrontCfg || null));

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
                let iconPath = iconValue;
                if (typeof iconPath === "string") {
                    const s = iconPath.trim();
                    if (s.startsWith("{") && s.endsWith("}")) {
                        try {
                            const obj = JSON.parse(s);
                            if (obj && typeof obj === "object") {
                                const light = String(obj.light || obj.l || obj.url || obj.icon || "").trim();
                                const dark = String(obj.dark || obj.d || "").trim();
                                iconPath = (isDarkModeEnabled() ? (dark || light) : (light || dark)) || iconPath;
                            }
                        } catch { }
                    }
                }
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


function __ssUpdateLastChanceOfferUI() {
    const el = document.getElementById("ss-last-chance");
    if (!el) return;

    try {
        let fullCart = __ssGetFullCartPreferred();
        // Fallback: if the legacy duplicate buildFullCartFromBasket() returns [], build from the in-memory basket.
        // This prevents tier math from seeing an empty cart even though the UI basket has items.
        try {
            if ((!Array.isArray(fullCart) || fullCart.length === 0) && typeof basket === "object" && basket && Object.keys(basket).length) {
                fullCart = Object.values(basket).map(it => ({
                    ...it,
                    productId: it?.productId || it?.id || it?.pid || "",
                    quantity: it?.quantity ?? it?.qty ?? it?.count ?? 1,
                    unitPriceEUR: it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? 0,
                    originalUnitPriceEUR: it?.originalUnitPriceEUR ?? it?.originalPriceEUR ?? it?.compareAtPriceEUR ?? it?.originalPrice ?? 0
                }));
            }
        } catch { }
        const base = (fullCart || []).reduce((s, i) => s + (__ssParsePriceEUR(i?.unitPriceEUR ?? i?.price ?? 0)) * (Math.max(1, parseInt(i?.quantity ?? 1, 10) || 1)), 0);
        const inc = __ssComputeCartIncentivesClient(base, fullCart);

        const cfg = __ssGetCartIncentivesConfig();
        const tiers = (cfg?.tierDiscount?.enabled && Array.isArray(cfg?.tierDiscount?.tiers)) ? cfg.tierDiscount.tiers : [];
        let nextTier = null;
        for (const t of tiers) {
            const min = Math.max(0, Number(t?.minEUR || 0) || 0);
            const pct = Math.max(0, Number(t?.pct || 0) || 0);
            if (min > base && pct > 0) { nextTier = { min, pct }; break; }
        }

        const desired = nextTier ? Math.max(3, nextTier.min - base) : 0;
        const pick = __ssCartPickAddonProducts({ desiredEUR: desired, limit: 1 })[0];

        if (!pick) {
            el.innerHTML = "";
            return;
        }

        const price = Number(pick?.price || 0) || 0;
        const headline = nextTier
            ? `Last chance: add ${(nextTier.min - base).toFixed(2)}€ to unlock ${nextTier.pct}% OFF`
            : "Last chance: frequently added";

        el.innerHTML = `
            <div class="ss-lc-sub" style="margin-bottom:8px; font-weight:700;">${__ssEscHtml(headline)}</div>
            <div class="ss-lc-row">
              <img class="ss-lc-img" src="${__ssEscHtml(pick?.image || "")}" alt="${__ssEscHtml(pick?.name || "")}">
              <div style="min-width:0;">
                <div class="ss-lc-name">${__ssEscHtml(pick?.name || "")}</div>
                <div class="ss-lc-sub">${price.toFixed(2)}€</div>
              </div>
              <button class="ss-lc-btn" type="button" data-ss-lc-add="${__ssEscHtml(pick?.name || "")}">Add</button>
            </div>
          `;

        if (!el.dataset.bound) {
            el.dataset.bound = "1";
            el.addEventListener("click", async (e) => {
                const btn = e.target?.closest?.("[data-ss-lc-add]");
                if (!btn) return;
                e.preventDefault();
                const name = String(btn.getAttribute("data-ss-lc-add") || "").trim();
                const p = __ssGetCatalogFlat().find(pp => String(pp?.name || "").trim() === name);
                if (!p) return;

                const groups = __ssExtractOptionGroups(p);
                const sel = __ssDefaultSelectedOptions(groups);
                addToCart(p.name, Number(p.price || 0) || 0, p.image || "", p.expectedPurchasePrice || 0, p.productLink || "", p.description || "", "", sel, (p.productId || null));

                try { updateBasket(); } catch { }

                // Important: refresh PaymentIntent because totals changed
                try {
                    if (typeof setupCheckoutFlow === "function" && typeof selectedCurrency !== "undefined") {
                        await setupCheckoutFlow(selectedCurrency);
                    }
                } catch { }

                try { __ssUpdateLastChanceOfferUI(); } catch { }
            }, { passive: false });
        }
    } catch {
        el.innerHTML = "";
    }
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
                    checkoutId: window.latestCheckoutId || null,
                    token: window.latestCheckoutPublicToken || null,
                    paymentIntentId: paymentIntentId || window.latestPaymentIntentId || null,
                    // Backend requires either token OR clientSecret; send both for robustness
                    clientSecret: (typeof clientSecret !== "undefined" && clientSecret) ? clientSecret : (window.latestClientSecret || null),
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
                const cs = (typeof clientSecret !== "undefined" && clientSecret) ? clientSecret : (window.latestClientSecret || null);
                const checkoutToken = window.latestCheckoutPublicToken || null;
                const resolvedOrderId = await resolveOrderIdByPaymentIntent({ paymentIntentId: pi.id, clientSecret: cs });

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
                        addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: pi.id });
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
async function openModal(options = {}) {
    const opts = (options && typeof options === "object") ? options : {};
    const fromHistory = opts.fromHistory === true;

    await createPaymentModal();

    const modal = document.getElementById("paymentModal");
    if (modal) modal.style.display = "flex";

    if (!__ssModalHistoryPushed && !fromHistory) {
        try {
            history.pushState({ index: currentIndex, modalOpen: true }, "", window.location.href);
            __ssModalHistoryPushed = true;
        } catch { }
    } else if (fromHistory) {
        __ssModalHistoryPushed = true;
    }

    // ✅ Re-wire modal logic to the new server-truth flow (tariffs + PI + mismatch handling)
    await initPaymentModalLogic();
}

function closeModal(opts = {}) {
    const options = (opts && typeof opts === "object") ? opts : {};
    const preserveDraft = options.preserveDraft !== false; // default true
    const clearDraft = options.clearDraft === true;
    const fromHistory = options.fromHistory === true;

    if (!fromHistory && !__ssHandlingPopstate && history.state?.modalOpen) {
        try { history.back(); return; } catch { }
    }

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
    __ssModalHistoryPushed = false;
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
        history.replaceState({ index: currentIndex }, "", cleanUrl);

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
        if (isReplaying) {
            loadProducts(window.currentCategory, newSort, window.currentSortOrder || "asc");
        } else {
            navigate("loadProducts", [window.currentCategory || lastCategory || "Default_Page", newSort, window.currentSortOrder || "asc"]);
        }
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
    window.currentSortOrder = sortOrder;
    window.currentCategory = category;

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

        // Custom-styled dropdown (native <select> can't be styled like the target design across browsers)
        sortContainer.innerHTML = `
            <div class="SSSort" id="SSSort">
              <div class="SSSortLabel">${TEXTS.SORTING.LABEL}</div>
  
              <button class="SSSortTrigger" id="SSSortTrigger" type="button" aria-haspopup="listbox" aria-expanded="false">
                <span class="SSSortTriggerText" id="SSSortTriggerText">${TEXTS.SORTING.OPTIONS.NAME_ASC}</span>
                <span class="SSSortChevron" aria-hidden="true"></span>
              </button>
  
              <div class="SSSortMenu" id="SSSortMenu" role="listbox" tabindex="-1" hidden>
                <button class="SSSortItem" type="button" role="option" data-value="NameFirst" aria-selected="false">
                  <span class="SSSortItemLabel">${TEXTS.SORTING.OPTIONS.NAME_ASC}</span>
                  <span class="SSSortCheck" aria-hidden="true"></span>
                </button>
                <button class="SSSortItem" type="button" role="option" data-value="NameLast" aria-selected="false">
                  <span class="SSSortItemLabel">${TEXTS.SORTING.OPTIONS.NAME_DESC}</span>
                  <span class="SSSortCheck" aria-hidden="true"></span>
                </button>
                <button class="SSSortItem" type="button" role="option" data-value="Cheapest" aria-selected="false">
                  <span class="SSSortItemLabel">${TEXTS.SORTING.OPTIONS.PRICE_ASC}</span>
                  <span class="SSSortCheck" aria-hidden="true"></span>
                </button>
                <button class="SSSortItem" type="button" role="option" data-value="Priciest" aria-selected="false">
                  <span class="SSSortItemLabel">${TEXTS.SORTING.OPTIONS.PRICE_DESC}</span>
                  <span class="SSSortCheck" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          `;
        wrapper.insertBefore(sortContainer, viewer);
    }

    // Ensure the dropdown reflects current sort and handlers are bound once per insertion.
    try { __ssSetupSortDropdown(sortBy); } catch (e) { console.warn("Sort dropdown setup failed:", e); }

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


        nameLink.textContent = (__ssABGetProductName(product) || product.name);
        nameLink.addEventListener("click", (e) => {
            e.preventDefault();
            navigate("GoToProductPage", [
                product.name,
                (__ssResolveVariantPriceEUR(product, [], "") || product.price),
                ((__ssABGetProductDescription(product) || product.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER)
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
                (__ssResolveVariantPriceEUR(product, [], "") || product.price),
                ((__ssABGetProductDescription(product) || product.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER)
            ]);
        });

        const priceP = document.createElement("p");
        priceP.className = "product-price";
        priceP.textContent = `${(__ssResolveVariantPriceEUR(product, [], "") || product.price)}${TEXTS.CURRENCIES.EUR}`;

        const quantityContainer = document.createElement("div");
        quantityContainer.className = "quantity-container";

        const quantityControls = document.createElement("div");
        quantityControls.className = "quantity-controls";

        const decBtn = document.createElement("button");
        decBtn.className = "Button";
        decBtn.textContent = TEXTS.BASKET.BUTTONS.DECREASE;
        decBtn.addEventListener("click", () => decreaseQuantity(product.productId || product.id || product.name));

        const quantitySpan = document.createElement("span");
        quantitySpan.className = "WhiteText";
        quantitySpan.id = `quantity-${__ssGetQtyKey(product.productId || product.id || product.name)}`;
        quantitySpan.textContent = String(__ssGetQtyValue(product.productId || product.id || product.name));

        const incBtn = document.createElement("button");
        incBtn.className = "Button";
        incBtn.textContent = TEXTS.BASKET.BUTTONS.INCREASE;
        incBtn.addEventListener("click", () => increaseQuantity(product.productId || product.id || product.name));

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
                (__ssABGetProductDescription(product) || product.description),
                "",
                __ssDefaultSelectedOptions(__ssExtractOptionGroups(product)),
                (product.productId || null)
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
    // Keep settings select (if present) in sync.
    document.querySelectorAll('#defaultSort').forEach(select => {
        if (select && select.value !== newSort) select.value = newSort;
    });

    // Keep custom dropdown in sync.
    try { __ssSetupSortDropdown(newSort); } catch { }
}


function updateSorting() {
    // Legacy entrypoint (was bound to native <select onchange>). Keep for compatibility.
    const selectedSort =
        document.getElementById("sortSelect")?.value ||
        document.getElementById("SSSort")?.dataset?.value ||
        null;
    if (selectedSort) handleSortChange(selectedSort);
}

// Custom "Sort by" dropdown (native <select> can't be styled like the target design across browsers)
function __ssSetupSortDropdown(currentSort) {
    const root = document.getElementById("SSSort");
    const trigger = document.getElementById("SSSortTrigger");
    const triggerText = document.getElementById("SSSortTriggerText");
    const menu = document.getElementById("SSSortMenu");
    if (!root || !trigger || !triggerText || !menu) return;

    const items = Array.from(menu.querySelectorAll(".SSSortItem"));

    function openMenu() {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    }
    function toggleMenu() {
        if (menu.hidden) openMenu();
        else closeMenu();
    }

    function setSelectedByValue(val) {
        const btn = items.find(b => b.dataset.value === val) || items[0];
        items.forEach(b => {
            const selected = (b === btn);
            b.classList.toggle("is-selected", selected);
            b.setAttribute("aria-selected", selected ? "true" : "false");
        });
        triggerText.textContent = btn.querySelector(".SSSortItemLabel")?.textContent || "";
        root.dataset.value = btn.dataset.value;
    }

    // Update UI to reflect current selection
    if (currentSort) setSelectedByValue(currentSort);

    // Bind handlers once per insertion
    if (!root.dataset.bound) {
        root.dataset.bound = "1";

        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            toggleMenu();
        });

        items.forEach(btn => {
            btn.addEventListener("click", () => {
                const val = btn.dataset.value;
                setSelectedByValue(val);
                handleSortChange(val);
                closeMenu();
            });
        });

        // close when clicking outside
        document.addEventListener("click", (e) => {
            if (menu.hidden) return;
            if (!e.target.closest("#SortContainer")) closeMenu();
        });

        // close on Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !menu.hidden) closeMenu();
        });
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
        let url = __ssABGetPrimaryImageUrl(p);

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
    }, { passive: true });

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

    const headingEl = document.querySelector(".Product_Name_Heading");
    const productName = headingEl?.dataset?.canonicalName || headingEl?.textContent?.trim();
    if (productName && basket[productName]) {
        basket[productName].selectedOption = optionValue;
        persistBasket("option_change");
        console.log(`🟢 Saved selected option "${optionValue}" for "${productName}"`);
    }
}








function buyNow(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "") {
    console.log(productName, productPrice, imageUrl, selectedOption);
    let quantity = parseInt(document.getElementById(`quantity-${__ssGetQtyKey(window.__ssCurrentProductId || productName)}`).innerText) || 1;
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


function __ssGetQtyKey(k) {
    // Safe DOM id fragment + stable quantity key
    return String(k || "").trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80);
}

function __ssGetQtyValue(productKey) {
    const key = __ssGetQtyKey(productKey);
    window.__ssQtyByKey = window.__ssQtyByKey || {};
    const raw = parseInt(window.__ssQtyByKey[key], 10);
    const qty = Math.max(1, Number.isFinite(raw) ? raw : 1);
    window.__ssQtyByKey[key] = qty;
    return qty;
}

function __ssSetQtyValue(productKey, qty) {
    const key = __ssGetQtyKey(productKey);
    window.__ssQtyByKey = window.__ssQtyByKey || {};
    const safeQty = Math.max(1, parseInt(qty, 10) || 1);
    window.__ssQtyByKey[key] = safeQty;
    const el = document.getElementById(`quantity-${key}`);
    if (el) el.innerText = safeQty;
    return safeQty;
}

function increaseQuantity(productKey) {
    const next = __ssGetQtyValue(productKey) + 1;
    __ssSetQtyValue(productKey, next);
}

function decreaseQuantity(productKey) {
    const next = Math.max(1, __ssGetQtyValue(productKey) - 1);
    __ssSetQtyValue(productKey, next);
}

function addToCart_legacy(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = '') {// analytics: add to cart
    try {
        const payload = buildAnalyticsProductPayload(productName, { priceEUR: price, productLink });
        payload.extra = { selectedOption: selectedOption || "" };
        sendAnalyticsEvent('add_to_cart', {
            ...payload,
            extra: { ...(payload.extra || {}), viewToken: (typeof __ssCurrentViewToken !== 'undefined' ? __ssCurrentViewToken : null), clickToken: __ssConsumeRecentClickToken(), experiments: (typeof __ssGetExperiments === "function" ? __ssGetExperiments() : null) }
        });
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
                displayName,
                displayDescription,
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
        __ssNotifyAddToCart({ qty: quantity, productName, optMsg: selectedOption ? ' (' + selectedOption + ')' : '', imageUrl, itemKey: key });
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

    // Reset per-open auto-scroll flag (mobile UX)
    try { window.__ssBasketAutoScrolledForOpen = false; } catch { }

    // Delay updating the basket to ensure the UI is fully created
    setTimeout(() => {
        updateBasket();

        // On small screens, gently scroll so the user can see the checkout area.
        // Important: do this only once per basket open, and never fight user scrolling.
        try {
            const isMobile = window.matchMedia && window.matchMedia('(max-width: 520px)').matches;
            if (isMobile && !window.__ssBasketAutoScrolledForOpen) {
                window.__ssBasketAutoScrolledForOpen = true;
                setTimeout(() => {
                    try {
                        const payBtn = document.querySelector('#Basket_Viewer .PayButton');
                        if (payBtn) payBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    } catch { }
                }, 220);
            }
        } catch { }
    }, 100);

    removeSortContainer();
}



/* Removed obsolete duplicate updateBasket() implementation (legacy). */




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
                displayName,
                displayDescription,
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
        __ssNotifyAddToCart({ qty: quantity, productName, optMsg: selectedOption ? ' (' + selectedOption + ')' : '', imageUrl, itemKey: key });
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
    // analytics: product clicked
    const __ssClickToken = __ssToken('click');
    __ssRememberClickToken(__ssClickToken);
    sendAnalyticsEvent('product_click', {
        ...buildAnalyticsProductPayload(productName),
        extra: { clickToken: __ssClickToken }
    });

    try {
        const prod = getAllProductsFlatSafe().find(p => String(p?.name || "") === String(productName || "")) || null;
        const desc = (prod && ((__ssABGetProductDescription(prod) || prod.description))) || getProductDescription(productName);
        const price = (prod && (__ssResolveVariantPriceEUR(prod, [], "") || prod.price)) || getProductPrice(productName);
        const pid = __ssIdNorm(prod?.productId || "");
        navigate("GoToProductPage", [productName, price, desc, null, pid || null, null]);
    } catch {
        navigate("GoToProductPage", [productName, getProductPrice(productName), getProductDescription(productName)]);
    }
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







// ---- Stripe globals (keep only one set of these in the whole file) ----

function getApiBase() {
    // Uses your existing API_BASE if you have it, otherwise falls back to same-origin.
    return (typeof API_BASE !== "undefined" && API_BASE) ? API_BASE : "";
}

function readBasket() {
    // IMPORTANT: Prefer the in-memory basket object (used by the UI) to avoid
    // false "Basket is empty" during fast interactions where localStorage
    // hasn't been flushed yet or when other helpers keep basket in memory.
    try {
        if (typeof basket === "object" && basket && Object.keys(basket).length) {
            return JSON.parse(JSON.stringify(basket));
        }
    } catch { }
    try {
        const raw = localStorage.getItem("basket");
        const parsed = raw ? JSON.parse(raw) : {};
        try {
            if (typeof basket === "object" && basket && !Object.keys(basket).length && parsed && typeof parsed === "object") {
                // keep memory in sync if it was empty
                for (const k of Object.keys(parsed)) basket[k] = parsed[k];
            }
        } catch { }
        return parsed || {};
    } catch {
        return {};
    }
}




function buildStripeSafeCart(fullCart) {
    return (fullCart || []).map((i) => {
        const out = {
            name: i.name,
            quantity: i.quantity,
            productId: i.productId || "",
            // price is not trusted by the server (server recomputes), but keep it for display/debug
            price: Number(i.unitPriceEUR || i.price || 0),
            selectedOption: i.selectedOption || "",
            selectedOptions: __ssNormalizeSelectedOptions(i.selectedOptions || []),
            recoDiscountToken: i.recoDiscountToken || ""
        };
        if (i.productId) out.productId = String(i.productId).trim();
        if (i.productLink) out.productLink = String(i.productLink).trim();
        return out;
    });
}

try {
    if (typeof window !== 'undefined' && typeof window.__ssBuildStripeSafeCartV2 !== 'function') {
        window.__ssBuildStripeSafeCartV2 = buildStripeSafeCart;
    }
} catch { }

function buildFullCartFromBasket() {
    const basketObj = (typeof readBasket === "function") ? readBasket() : (() => {
        try { return JSON.parse(localStorage.getItem("basket") || "{}"); } catch { return {}; }
    })();

    const items = Object.values(basketObj || {});
    __ssEnsureContributionProducts();
    // IMPORTANT: cart checkout needs productId. Preserve productId/id when building a flat view.
    const flat = (Array.isArray(__ssContributionCache.items) && __ssContributionCache.items.length)
        ? __ssContributionCache.items.map(x => ({
            name: x.name,
            price: x.price,
            images: x.images || [],
            productLink: x.productLink || "",
            productId: x.productId || x.id || "",
            expectedPurchasePrice: x.expectedPurchasePrice || 0,
            description: x.description || "",
            image: x.image || (Array.isArray(x.images) ? (x.images[0] || "") : "")
        }))
        : __ssGetCatalogFlat();


    function __ssRecoGetExcludeIds() {
        try {
            const b = (typeof readBasket === "function") ? readBasket() : (() => { try { return JSON.parse(localStorage.getItem("basket") || "{}"); } catch { return {}; } })();
            const ids = new Set();
            Object.values(b || {}).forEach((it) => {
                const pid = String(it?.productId || "").trim();
                if (pid) ids.add(pid);
            });
            // Also exclude the product currently being viewed
            if (recState.sourceProductId) ids.add(String(recState.sourceProductId));
            return Array.from(ids);
        } catch {
            return recState.sourceProductId ? [String(recState.sourceProductId)] : [];
        }
    }

    return items
        .map((item) => {
            const qty = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);

            const sel = __ssNormalizeSelectedOptions(item?.selectedOptions || []);
            const legacySel = String(item?.selectedOption || "").trim();

            // Attempt to rehydrate from current catalog
            const pid = String(item?.productId || "").trim();
            const canon = canonicalizeProductLink(item?.productLink || "");
            const prod =
                (pid ? flat.find(p => String(p?.productId || "").trim() === pid) : null) ||
                (canon ? flat.find(p => canonicalizeProductLink(p?.productLink || "") === canon) : null) ||
                (item?.name ? flat.find(p => String(p?.name || "").trim() === String(item.name).trim()) : null) ||
                null;

            const unitEURFromBasket = Number(parseFloat(item?.price ?? item?.unitPriceEUR ?? 0) || 0);
            const unitEUR = Number((__ssResolveVariantPriceEUR(prod || {}, sel, legacySel) || unitEURFromBasket || 0).toFixed(2));

            const expectedFromBasket = Number(parseFloat(item?.expectedPurchasePrice ?? 0) || 0);
            const expectedFromProd = Number(parseFloat(prod?.expectedPurchasePrice ?? 0) || 0);
            const expected = Number(((expectedFromProd || expectedFromBasket || unitEUR) || 0).toFixed(2));

            const out = {
                name: String(item?.name || prod?.name || "").slice(0, 120),
                productId: String(item?.productId || "").slice(0, 80),
                quantity: qty,
                unitPriceEUR: unitEUR,
                recoDiscountToken: String(item?.recoDiscountToken || "").slice(0, 500),
                recoDiscountPct: Number(item?.recoDiscountPct || 0) || 0,
                unitPriceOriginalEUR: (item?.unitPriceOriginalEUR != null ? Number(item.unitPriceOriginalEUR) : null),
                price: unitEUR,
                expectedPurchasePrice: expected,
                productLink: String(item?.productLink || prod?.productLink || "N/A").slice(0, 800),
                image: String(item?.image || prod?.image || "").slice(0, 800),
                description: String(item?.description || prod?.description || "").slice(0, 2000)
            };

            const outPid = String(pid || prod?.productId || "").trim();
            if (outPid) out.productId = outPid;

            if (legacySel) out.selectedOption = String(legacySel).slice(0, 120);
            if (sel.length) out.selectedOptions = sel;

            return out;
        })
        .filter((x) => x && x.name && x.quantity > 0);
}

function __ssBuildFullCartFromBasketObject(basketObj) {
    try {
        const items = Object.values(basketObj || {});
        return items.map(it => {
            const out = { ...it };
            out.productId = it?.productId || it?.id || it?.pid || "";
            out.quantity = it?.quantity ?? it?.qty ?? 1;
            // best-effort price fields used by incentives math
            if (out.unitPriceEUR == null) out.unitPriceEUR = it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? 0;
            if (out.originalUnitPriceEUR == null) out.originalUnitPriceEUR = it?.originalUnitPriceEUR ?? it?.compareAtPriceEUR ?? it?.originalPriceEUR ?? it?.originalPriceEur ?? 0;
            return out;
        });
    } catch {
        return [];
    }
}

function __ssGetFullCartPreferred() {
    let fc = [];
    try { fc = __ssGetFullCartPreferred(); } catch { fc = []; }
    if (Array.isArray(fc) && fc.length) return fc;

    // Fallback: use in-memory basket (updateBasket uses this) if localStorage is stale.
    try {
        if (typeof basket === "object" && basket && Object.keys(basket).length) {
            const b = basket;
            const out = __ssBuildFullCartFromBasketObject(b);
            if (out.length) return out;
        }
    } catch { }

    // Fallback: readBasket() if available
    try {
        if (typeof readBasket === "function") {
            const b = readBasket();
            const out = __ssBuildFullCartFromBasketObject(b);
            if (out.length) return out;
        }
    } catch { }

    return [];
}

// Preserve the "full" cart builder (includes productId + reco discount metadata).
// Later in this file, a legacy duplicate definition may overwrite buildFullCartFromBasket;
// checkout must continue using the full version.
try {
    if (typeof window !== "undefined" && typeof window.__ssBuildFullCartFromBasketV2 !== "function") {
        window.__ssBuildFullCartFromBasketV2 = buildFullCartFromBasket;
    }
} catch { }

// ---- Safety helpers (prevents hard crashes if a merge ever drops a helper) ----
// Keep these as idempotent window assignments so they work even if a function
// declaration is missing in some deployed variant.
(function __ssEnsureCheckoutHelpers() {
    const w = (typeof window !== "undefined") ? window : {};
    if (typeof w.getSelectedCountryCode !== "function") {
        w.getSelectedCountryCode = function getSelectedCountryCode() {
            try {
                const v =
                    document.getElementById("countrySelect")?.value ||
                    localStorage.getItem("detectedCountry") ||
                    "US";
                return String(v).trim().toUpperCase();
            } catch {
                return "US";
            }
        };
    }
    if (typeof w.round2 !== "function") {
        w.round2 = function round2(n) {
            const x = Number(n);
            if (!Number.isFinite(x)) return 0;
            return Math.round(x * 100) / 100;
        };
    }
})();


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


function __ssGetCartIncentivesConfig() {
    // Prefer server-provided config (keeps mismatch checks happy)
    const cfg = window?.preloadedData?.storefrontConfig?.cartIncentives;
    if (cfg && typeof cfg === "object") return cfg;

    // Safe fallback (must match backend defaults)
    return {
        enabled: true,
        freeShipping: { enabled: false, thresholdEUR: 0, shippingFeeEUR: 0 },
        tierDiscount: {
            enabled: true,
            // If false, tier discount will NOT apply to items that already have an item-level discount (e.g. reco token).
            // Threshold unlock still uses the full cart subtotal.
            applyToDiscountedItems: false,
            tiers: [{ minEUR: 25, pct: 3 }, { minEUR: 40, pct: 6 }, { minEUR: 60, pct: 10 }]
        },
        bundles: { enabled: false, bundles: [] }
    };
}


// --- Tier/Basket debug helpers (safe groups + reentry guard) ---
function __ssDbgTierEnabled() {
    try { return localStorage.getItem('ss_debug_tier') === '1'; } catch { return false; }
}
function __ssTierDbgGroup(label, fn) {
    if (!__ssDbgTierEnabled()) return fn(0);
    const runId = (window.__ssTierDbgRunId = (window.__ssTierDbgRunId || 0) + 1);
    console.groupCollapsed(`[tier][dbg] ${label} #${runId}`);
    try {
        return fn(runId);
    } catch (e) {
        console.error('[tier][dbg] ERROR', e);
        throw e;
    } finally {
        console.groupEnd();
    }
}
// --------------------------------------------------------------

function __ssComputeCartIncentivesClient(baseTotalEUR, fullCart) {

    if (window.__ssComputingIncentives) {
        if (__ssDbgTierEnabled()) console.warn('[tier][dbg] reentry blocked');
        return window.__ssLastIncentives || null;
    }
    window.__ssComputingIncentives = true;
    try {
        const cfg = __ssGetCartIncentivesConfig();
        const enabled = !!cfg?.enabled;
        const out = {
            enabled,
            baseTotalEUR: round2(baseTotalEUR),
            tierPct: 0,
            tierDiscountEUR: 0,
            bundlePct: 0,
            bundleDiscountEUR: 0,
            shippingFeeEUR: 0,
            freeShippingEligible: false,
            subtotalAfterDiscountsEUR: round2(baseTotalEUR),
            totalWithShippingEUR: round2(baseTotalEUR)
        };
        if (!enabled) return out;

        const __dbg = (() => {
            try { return (localStorage.getItem('ss_debug_tier') === '1') || (window.__SS_DEBUG_TIER === 1); } catch { return false; }
        })();

        let subtotal = Number(baseTotalEUR) || 0;

        // Eligible subtotal for tier discount when applyToDiscountedItems is false.
        // Discounted items are detected via recoDiscountPct or recoDiscountToken and/or original vs paid unit price.

        // Robust numeric parser for prices that may come as strings like "€4.99" or "4,99"
        function __ssParsePriceEUR(v) {
            if (typeof v === "number") return Number.isFinite(v) ? v : 0;
            if (typeof v !== "string") return 0;
            let s = v.trim();
            if (!s) return 0;
            s = s.replace(/[^0-9,\.\-]/g, "");
            if (!s) return 0;
            const hasComma = s.indexOf(",") >= 0;
            const hasDot = s.indexOf(".") >= 0;
            if (hasComma && hasDot) {
                // assume last separator is decimal
                if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
                    s = s.replace(/\./g, "").replace(/,/g, ".");
                } else {
                    s = s.replace(/,/g, "");
                }
            } else if (hasComma && !hasDot) {
                s = s.replace(/,/g, ".");
            }
            const n = parseFloat(s);
            return Number.isFinite(n) ? n : 0;
        }

        let tierEligibleSubtotal = 0;
        const __tierDbgRows = (__dbg ? [] : null);
        const __tierDiscMap = {};
        try {
            const items = Array.isArray(fullCart) ? fullCart : [];
            for (const it of items) {
                const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
                const unit = __ssParsePriceEUR(it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? 0);
                const line = unit * qty;
                if (!Number.isFinite(line) || line <= 0) continue;
                const recoPct = Number(it?.recoDiscountPct || 0) || 0;
                const hasTok = !!it?.recoDiscountToken;
                const u0 = __ssParsePriceEUR(it?.unitPriceOriginalEUR ?? it?.unitPriceOriginalEur ?? it?.originalUnitPriceEUR ?? it?.compareAtPriceEUR ?? NaN);
                const u1 = __ssParsePriceEUR(it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? NaN);
                const looksDiscounted = (Number.isFinite(u0) && Number.isFinite(u1) && u0 > u1 + 1e-9);
                const isDiscountedItem = (recoPct > 0) || hasTok || looksDiscounted;
                try {
                    const __pid = String(it?.productId || it?.pid || it?.id || '').trim();
                    if (__pid) __tierDiscMap[__pid] = (__tierDiscMap[__pid] || false) || !!isDiscountedItem;
                    try { window.__ssTierDiscMap = __tierDiscMap; } catch { }
                } catch { }
                if (__tierDbgRows) {
                    try {
                        __tierDbgRows.push({
                            name: String(it?.name || it?.title || it?.productName || it?.productId || '').slice(0, 80),
                            productId: String(it?.productId || ''),
                            qty,
                            unit,
                            line,
                            recoPct,
                            hasTok,
                            orig: u0,
                            cur: u1,
                            looksDiscounted,
                            isDiscountedItem,
                            eligibleTier: !isDiscountedItem
                        });
                    } catch { }
                }
                if (!isDiscountedItem) tierEligibleSubtotal += line;
            }
        } catch { }

        if (__dbg) {
            __ssTierDbgGroup('compute incentives', (runId) => {
                try {
                    const tcfg = cfg?.tierDiscount;

                    console.log("baseTotalEUR", round2(baseTotalEUR), "enabled", enabled);
                    console.log("cfg", {
                        enabled: cfg?.enabled,
                        applyToDiscountedItems: cfg?.applyToDiscountedItems,
                        tierApplyToDiscountedItems: tcfg?.applyToDiscountedItems,
                        tiers: Array.isArray(tcfg?.tiers) ? tcfg.tiers : null,
                        bundlesEnabled: !!cfg?.bundles?.enabled,
                        freeShipping: cfg?.freeShipping || null
                    });
                    console.log("tierEligibleSubtotal(pre-bundle)=", round2(tierEligibleSubtotal), "fullCartItems=", Array.isArray(fullCart) ? fullCart.length : 0);
                    if (Array.isArray(__tierDbgRows)) {
                        try { console.table(__tierDbgRows); } catch { }
                    }
                } catch { }
            });
        }

        // Optional bundle discount (max one)
        try {
            const bcfg = cfg?.bundles;
            if (bcfg?.enabled && Array.isArray(bcfg?.bundles) && bcfg.bundles.length) {
                const ids = new Set((fullCart || []).map(i => String(i?.productId || "").trim()).filter(Boolean));
                let best = null;
                for (const b of bcfg.bundles) {
                    const pids = Array.isArray(b?.productIds) ? b.productIds.map(x => String(x || "").trim()).filter(Boolean) : [];
                    if (pids.length < 2) continue;
                    const ok = pids.every(pid => ids.has(pid));
                    if (!ok) continue;
                    const pct = Math.max(0, Math.min(80, Number(b?.pct || 0) || 0));
                    if (!best || pct > best.pct) best = { pct };
                }
                if (best && best.pct > 0) {
                    out.bundlePct = best.pct;
                    out.bundleDiscountEUR = round2(subtotal * (best.pct / 100));
                    subtotal = subtotal - out.bundleDiscountEUR;

                    // Keep tierEligibleSubtotal in the same "post-bundle" space by applying the same bundle %.
                    if (Number.isFinite(tierEligibleSubtotal) && tierEligibleSubtotal > 0) {
                        tierEligibleSubtotal = tierEligibleSubtotal * (1 - (best.pct / 100));
                    }
                }
            }
        } catch { }

        // Tier discount
        try {
            const tcfg = cfg?.tierDiscount;
            if (tcfg?.enabled && Array.isArray(tcfg?.tiers) && tcfg.tiers.length) {
                let pct = 0;
                for (const t of tcfg.tiers) {
                    const min = Math.max(0, Number(t?.minEUR || 0) || 0);
                    const p = Math.max(0, Math.min(80, Number(t?.pct || 0) || 0));
                    if (min > 0 && p > 0 && subtotal >= min) pct = Math.max(pct, p);
                }
                out.tierPct = pct;

                if (__dbg) {
                    try {
                        console.log("tier selection pct=", pct, "subtotalPostBundle=", round2(subtotal));
                    } catch { }
                }

                // Threshold unlock uses full post-bundle subtotal (subtotal).
                // Discount amount may optionally exclude already-discounted items.
                const applyToDiscounted = (tcfg?.applyToDiscountedItems === true);
                const tierBase = applyToDiscounted ? subtotal : Math.max(0, Number(tierEligibleSubtotal) || 0);
                out.tierDiscountEUR = pct > 0 ? round2(tierBase * (pct / 100)) : 0;
                if (__dbg) {
                    try {
                        console.log("tier base applyToDiscounted=", applyToDiscounted, "tierEligibleSubtotal=", round2(tierEligibleSubtotal), "tierBase=", round2(tierBase), "tierDiscountEUR=", out.tierDiscountEUR, "subtotalAfterTier=", round2(subtotal));
                    } catch { }
                }

                subtotal = subtotal - out.tierDiscountEUR;
            }
        } catch { }

        subtotal = Math.max(0, round2(subtotal));
        out.subtotalAfterDiscountsEUR = subtotal;

        // Optional shipping fee
        try {
            const ship = cfg?.freeShipping;
            const enabledShip = !!ship?.enabled;
            const fee = Math.max(0, Number(ship?.shippingFeeEUR || 0) || 0);
            const thr = Math.max(0, Number(ship?.thresholdEUR || 0) || 0);
            if (enabledShip && fee > 0 && thr > 0) {
                out.freeShippingEligible = subtotal >= thr;
                out.shippingFeeEUR = out.freeShippingEligible ? 0 : round2(fee);
                out.totalWithShippingEUR = round2(subtotal + out.shippingFeeEUR);
            } else {
                out.freeShippingEligible = true;
                out.shippingFeeEUR = 0;
                out.totalWithShippingEUR = subtotal;
            }
        } catch {
            out.freeShippingEligible = true;
            out.shippingFeeEUR = 0;
            out.totalWithShippingEUR = subtotal;
        }

        return out;

    } finally {
        window.__ssComputingIncentives = false;
    }
}

function computeExpectedClientTotalForServer(fullCart, currency, countryCode) {
    const cur = String(currency || "EUR").toUpperCase();
    const cc = String(countryCode || "").toUpperCase();

    const baseEUR = (fullCart || []).reduce((sum, i) => {
        const qty = Math.max(1, parseInt(i?.quantity ?? 1, 10) || 1);
        const unit = __ssParsePriceEUR(i?.unitPriceEUR ?? i?.price ?? 0);
        return sum + unit * qty;
    }, 0);

    // Cart incentives (tier discounts / optional shipping fee) MUST match backend
    const inc = __ssComputeCartIncentivesClient(baseEUR, fullCart);
    let totalEUR = Number(inc?.totalWithShippingEUR ?? inc?.subtotalAfterDiscountsEUR ?? baseEUR) || baseEUR;

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


        const __pi_payload = {
            checkoutId: window.latestCheckoutId || null,
            checkoutToken: window.latestCheckoutPublicToken || null,
            websiteOrigin,
            currency,
            country,
            products: stripeCart,
            productsFull: fullCart,
            expectedClientTotal,
            applyTariff: getApplyTariffFlag(),
            metadata: { order_summary },
            fxFetchedAt,
            turnstileToken,
            experiments: (typeof __ssGetExperiments === "function" ? __ssGetExperiments() : null)
        };

        try {
            window.__LAST_PI_REQUEST__ = __pi_payload;
            localStorage.setItem("__LAST_PI_REQUEST__", JSON.stringify(__pi_payload));
        } catch { }

        try {
            console.log("[PI][CLIENT][REQ]", {
                currency,
                country,
                expectedClientTotal,
                fxFetchedAt,
                items: Array.isArray(fullCart) ? fullCart.length : null,
                hasRecoToken: Array.isArray(fullCart) && fullCart.some(p => !!String(p?.recoDiscountToken || "").trim())
            });
        } catch { }

        const res = await fetch(`${API_BASE}/create-payment-intent`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(__pi_payload)
        });

        const data = await res.json().catch(() => ({}));

        try {
            window.__LAST_PI_RESPONSE__ = { status: res.status, ok: res.ok, data };
            localStorage.setItem("__LAST_PI_RESPONSE__", JSON.stringify(window.__LAST_PI_RESPONSE__));
            console.log("[PI][CLIENT][RESP]", { status: res.status, ok: res.ok, data });
        } catch { }
        if (res.ok) return data;

        const code = data?.error || data?.code;


        // If the cached checkout draft was deleted/expired (e.g., payment already finalized), retry once fresh.
        if (attempt === 1 && (res.status === 404 || res.status === 400) && (code === "CHECKOUT_NOT_FOUND" || code === "CHECKOUT_NOT_FOUND")) {
            try {
                window.latestCheckoutId = null;
                window.latestCheckoutPublicToken = null;
            } catch { }
            continue;
        }

        if (attempt === 1 && res.status === 401) {
            // Token mismatch (stale client state). Retry once with a fresh checkout.
            try {
                window.latestCheckoutId = null;
                window.latestCheckoutPublicToken = null;
            } catch { }
            continue;
        }

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

// ===== Stripe PI recycle cache (client-side) =====
// Goal: avoid creating new PaymentIntents if cart+currency+country didn't change.
// This reduces Stripe PI velocity + prevents FRAUD_VELOCITY_PI on rapid retries.
// Storage: sessionStorage (tab-scoped); safe fallback to in-memory when unavailable.

function _fnv1a32(str) {
    // non-crypto hash, deterministic, good enough for cache keying
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        // h *= 16777619
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
}

function _stableCartForSig(stripeCart) {
    const items = Array.isArray(stripeCart) ? stripeCart : [];
    const norm = items.map(it => {
        const pid = String(it?.productId ?? it?.id ?? "").trim();
        const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
        // include option/variant identifiers if present to distinguish same product different variant
        const opt = String(it?.selectedOptionId ?? it?.optionId ?? it?.variantId ?? it?.variant ?? it?.option ?? "").trim();
        const sku = String(it?.sku ?? "").trim();
        return { pid, qty, opt, sku };
    }).filter(x => x.pid);
    norm.sort((a, b) => {
        const ak = `${a.pid}|${a.opt}|${a.sku}`;
        const bk = `${b.pid}|${b.opt}|${b.sku}`;
        return ak < bk ? -1 : ak > bk ? 1 : (a.qty - b.qty);
    });
    return norm;
}

function _buildPiSig({ currency, country, stripeCart, expectedTotalCents }) {
    const cur = String(currency || "").toUpperCase();
    const cty = String(country || "").toUpperCase();
    const payload = { cur, cty, amt: (Number(expectedTotalCents || 0) || 0), items: _stableCartForSig(stripeCart) };
    const raw = JSON.stringify(payload);
    return `pi_${_fnv1a32(raw)}`;
}

function _getPiCacheStore() {
    try {
        const raw = sessionStorage.getItem("ss_pi_cache_v1");
        const obj = raw ? JSON.parse(raw) : {};
        return (obj && typeof obj === "object") ? obj : {};
    } catch {
        return (window.__ssPiCacheMem && typeof window.__ssPiCacheMem === "object") ? window.__ssPiCacheMem : {};
    }
}

function _setPiCacheStore(obj) {
    try {
        sessionStorage.setItem("ss_pi_cache_v1", JSON.stringify(obj || {}));
    } catch {
        window.__ssPiCacheMem = obj || {};
    }
}

function _getCachedPI(sig) {
    const store = _getPiCacheStore();
    const row = store?.[sig];
    if (!row || typeof row !== "object") return null;

    const createdAt = Number(row.createdAt || 0) || 0;
    // Default TTL 30 minutes; keep short to avoid stale FX snapshots or Stripe state.
    const ttlMs = Math.max(60_000, Number(window.STRIPE_PI_CACHE_TTL_MS || 30 * 60 * 1000) || (30 * 60 * 1000));
    if (!createdAt || (Date.now() - createdAt) > ttlMs) return null;

    if (!row.clientSecret || !row.paymentIntentId) return null;
    // Require checkoutId + public token so we can server-finalize if Stripe webhooks are delayed/misconfigured.
    const cid = row.checkoutId || null;
    const tok = row.checkoutPublicToken || row.checkoutToken || null;
    if (!cid || !tok) return null;
    if (!row.checkoutPublicToken && row.checkoutToken) row.checkoutPublicToken = row.checkoutToken;
    return row;
}

function _putCachedPI(sig, row) {
    const store = _getPiCacheStore();
    store[sig] = { ...(row || {}), createdAt: Date.now() };
    // keep cache bounded
    const keys = Object.keys(store);
    if (keys.length > 12) {
        keys.sort((a, b) => Number(store[a]?.createdAt || 0) - Number(store[b]?.createdAt || 0));
        for (let i = 0; i < keys.length - 12; i++) delete store[keys[i]];
    }
    _setPiCacheStore(store);
}

function _invalidatePiCache(sig) {
    const store = _getPiCacheStore();
    if (sig && store[sig]) {
        delete store[sig];
        _setPiCacheStore(store);
    }
}

// If the basket hasn't changed, reuse cached PI response (client secret + ids).
async function getOrCreatePaymentIntentRecycled({ websiteOrigin, currency, country, fullCart, stripeCart }) {
    // IMPORTANT: PI reuse must be invalidated when discounts/thresholds change.
    await preloadSettingsData();
    const expectedClientTotal = computeExpectedClientTotalForServer(fullCart, currency, country);
    const expectedTotalCents = Math.round((Number(expectedClientTotal || 0) || 0) * 100);
    const sig = _buildPiSig({ currency, country, stripeCart, expectedTotalCents });

    const cached = _getCachedPI(sig);
    if (cached) {
        try {
            console.log("[stripe][pi] reuse", { sig, paymentIntentId: cached.paymentIntentId, amountCents: cached.amountCents ?? null, currency: cached.currency ?? currency });
        } catch { }
        // mirror the server response shape expected by callers
        return {
            ...cached,
            _reused: true,
            _sig: sig
        };
    }

    const data = await createPaymentIntentOnServer({ websiteOrigin, currency, country, fullCart, stripeCart });

    if (data && data.free) {
        return { ...data, _reused: false, _sig: sig };
    }

    try {
        _putCachedPI(sig, {
            clientSecret: data?.clientSecret || null,
            paymentIntentId: data?.paymentIntentId || null,
            amountCents: data?.amountCents ?? null,
            currency: data?.currency ?? currency,
            checkoutId: data?.checkoutId ?? null,
            checkoutPublicToken: data?.checkoutPublicToken ?? null
        });
        console.log("[stripe][pi] cache-store", { sig, paymentIntentId: data?.paymentIntentId || null, amountCents: data?.amountCents ?? null });
    } catch { }

    return { ...data, _reused: false, _sig: sig };
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
            const finRes = await fetch(`${API_BASE}/finalize-order`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    free: true,
                    draftId: data.draftId || data.checkoutId || null,
                    token: data.checkoutPublicToken || data.token || checkoutPublicToken || null
                })
            });
            const fin = await finRes.json().catch(() => ({}));
            if (!finRes.ok || !fin?.ok) {
                throw new Error(fin?.error || fin?.message || "Failed to finalize free order");
            }
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
                        checkoutId: window.latestCheckoutId || null,
                        token: window.latestCheckoutPublicToken || null,
                        paymentIntentId: window.latestPaymentIntentId || null,
                        clientSecret: window.latestClientSecret || null,
                        userDetails
                    })
                }).catch(() => { });
            }

            const clientSecret = window.latestClientSecret || null;
            const orderId = window.latestOrderId || null;
            const paymentIntentId = window.latestPaymentIntentId || null;

            // Guard: if the PaymentIntent is already processing/succeeded, do NOT call confirmPayment again.
            // This prevents Stripe "payment_intent_unexpected_state" when users retry quickly or double-submit.
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

                        clearPaymentPendingFlag();
                        clearBasketCompletely();
                        try { clearCheckoutDraft(); } catch { }
                        setPaymentSuccessFlag({ reloadOnOk: true });
                        window.location.replace(window.location.origin);
                        return;
                    }

                    if (pi?.status === "processing") {
                        setPaymentPendingFlag({
                            paymentIntentId: pi.id,
                            orderId: orderId || null,
                            clientSecret,
                            checkoutId: window.latestCheckoutId || null,
                            checkoutToken: window.latestCheckoutPublicToken || null
                        });

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

                    if (pi?.status === "canceled") {
                        clearPaymentPendingFlag();
                        alert("This payment attempt was canceled. Please try again.");
                        return;
                    }
                } catch { }
            }

            // CRITICAL FIX: set pending BEFORE confirmPayment so redirects are safe
            setPaymentPendingFlag({ paymentIntentId, orderId, clientSecret, checkoutId: window.latestCheckoutId || null, checkoutToken: window.latestCheckoutPublicToken || null });

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
                const checkoutToken = window.latestCheckoutPublicToken || null;
                const resolvedOrderId = await resolveOrderIdByPaymentIntent({
                    paymentIntentId: paymentIntent.id,
                    clientSecret
                });

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
                    clientSecret,
                    checkoutId: window.latestCheckoutId || null,
                    checkoutToken: window.latestCheckoutPublicToken || null
                });

                const { status } = await pollPendingPaymentUntilFinal({ paymentIntentId: paymentIntent.id });

                if (status === "succeeded") {
                    const checkoutToken = window.latestCheckoutPublicToken || null;
                    const resolvedOrderId = await resolveOrderIdByPaymentIntent({
                        paymentIntentId: paymentIntent.id,
                        clientSecret
                    });

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
            // Stripe may occasionally respond with payment_intent_unexpected_state even when the PI ended up succeeded.
            // In that case, treat it as success and resolve the orderId from the PI.
            try {
                const pi = e?.payment_intent || e?.paymentIntent || null;
                if (pi && pi.id && pi.status === "succeeded" && String(e?.code || "").includes("payment_intent_")) {
                    const checkoutToken = window.latestCheckoutPublicToken || null;
                    const resolvedOrderId = await resolveOrderIdByPaymentIntent({
                        paymentIntentId: pi.id,
                        clientSecret
                    });
                    if (resolvedOrderId && checkoutToken) {
                        const statusUrl = `${window.location.origin}/order-status/${encodeURIComponent(resolvedOrderId)}?token=${encodeURIComponent(checkoutToken)}`;
                        window.latestOrderId = resolvedOrderId;
                        window.latestOrderPublicToken = checkoutToken;
                        window.latestOrderStatusUrl = statusUrl;
                        addRecentOrder({ orderId: resolvedOrderId, token: checkoutToken, orderStatusUrl: statusUrl, paymentIntentId: pi.id });
                        clearCart();
                        closeModal();
                        window.location.href = statusUrl;
                        return;
                    }
                }
            } catch { /* fall through */ }
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
            try { __ssUpdateLastChanceOfferUI(); } catch { }
        });
    }

    // Initialize Stripe UI once on open (server-truth)
    selectedCurrency = localStorage.getItem("selectedCurrency") || selectedCurrency || "EUR";
    await setupCheckoutFlow(selectedCurrency);
    try { __ssUpdateLastChanceOfferUI(); } catch { }
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



function __ssResolveVariantPriceEUR(product, selectedOptions, legacySelectedOption = "") {
    const ex = (typeof __ssGetExperiments === "function") ? __ssGetExperiments() : null;
    const useB = ex && String(ex.pr || "").toUpperCase() === "B";

    const baseA = Number(parseFloat(product?.price ?? 0) || 0);
    const baseBraw = Number(parseFloat(product?.priceB ?? NaN));
    const base = (useB && Number.isFinite(baseBraw) && baseBraw > 0) ? baseBraw : baseA;

    const mapA = (product && typeof product === "object") ? product.variantPrices : null;
    const mapB = (product && typeof product === "object") ? product.variantPricesB : null;
    const map = (useB && mapB && typeof mapB === "object" && !Array.isArray(mapB)) ? mapB : mapA;

    if (!map || typeof map !== "object" || Array.isArray(map)) return __ssRound2(base);

    const sel = __ssNormalizeSelectedOptions(selectedOptions || []);
    const candidates = [];

    const fullKey = sel.length ? __ssFormatSelectedOptionsKey(sel) : "";
    if (fullKey) candidates.push(fullKey);

    if (sel.length) {
        const vOnly = sel.map(o => String(o.value || "").trim()).filter(Boolean).join(" | ");
        if (vOnly && vOnly !== fullKey) candidates.push(vOnly);
    }

    if (sel.length === 1) {
        const l = String(sel[0].label || "").trim();
        const v = String(sel[0].value || "").trim();
        if (l && v) candidates.push(`${l}=${v}`);
        if (v) candidates.push(v);
    }

    const legacy = String(legacySelectedOption || "").trim();
    if (legacy) candidates.push(legacy);

    for (const k of candidates) {
        const key = String(k || "").trim();
        if (!key) continue;
        const num = Number(parseFloat(map[key]) || 0);
        if (Number.isFinite(num) && num > 0) return __ssRound2(num);
    }

    return __ssRound2(base);
}


function __ssCleanOptionLabel(label) {
    return String(label ?? "")
        .trim()
        .replace(/\s*[:\-–—]\s*$/, "");
}

function __ssEnsureOptionChipStyles() {
    if (document.getElementById("__ss-option-chip-styles")) return;

    const style = document.createElement("style");
    style.id = "__ss-option-chip-styles";
    style.textContent = `
  /* Hide legacy inline "Selected ..." label (we use chips instead) */
  .BasketSelectedOption{display:none !important;}
  
  /* Basket layout: remove fixed aspect ratio so extra lines (chips) don't overlap */
  .Basket-Item,.Basket_Item_Container{aspect-ratio:auto !important;}
  .Basket-Item{width:min(1000px,100%) !important;max-width:2000px !important;align-items:flex-start !important;padding:16px 18px !important;gap:18px !important;}
  .Basket_Item_Container{width:min(1000px,100%) !important;max-width:2000px !important;}
  
  .BasketTitle{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .BasketTextDescription{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
  /* Quantity controls: compact vertical stack, centered */
  
  
  .Quantity-Controls-Basket .BasketChangeQuantityButton:hover{
    background:rgba(0,0,0,0.06);
  }
  .Quantity-Controls-Basket .BasketChangeQuantityText{
    font-family:'Afacad',sans-serif;
    font-size:20px;
    line-height:1;
    margin:0;
    padding:0;
    min-width:1.5em;
    text-align:center;
  }
  /* Option chips */
  .BasketOptionChips{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start;align-items:flex-start;}
  .BasketOptionChip{display:inline-flex;align-items:center;padding:6px 12px;border-radius:9999px;background:rgba(0,0,0,0.045);white-space:nowrap;font-family:'Afacad',sans-serif;font-size:16px;}
  
  /* Receipt */
  .Basket-Item-Pay{display:block !important;width:min(1000px,100%) !important;}
  .ReceiptTable{width:100% !important;border-collapse:collapse;}
  .ReceiptTable td{vertical-align:top;padding:6px 8px;}
  .ReceiptItemName{display:block;}
  .ReceiptOptionChips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;}
  .ReceiptOptionChips .BasketOptionChip{padding:5px 10px;font-size:15px;}
  
  @media (max-width: 700px){
  
  
  .Quantity-Controls-Basket .BasketChangeQuantityButton{width:38px;height:38px;font-size:22px;}
  .Quantity-Controls-Basket .BasketChangeQuantityText{font-size:18px;}
    .Basket-Item{padding:12px 12px !important;gap:12px !important;}
  
    .BasketOptionChip{font-size:14px;padding:5px 10px;}
    .BasketTextDescription{-webkit-line-clamp:2;}
    .ReceiptOptionChips .BasketOptionChip{font-size:13px;}
  }
  `;
    document.head.appendChild(style);
}

function __ssGetSelectedOptionsForDisplay(item, product) {
    const multi = __ssNormalizeSelectedOptions(item?.selectedOptions || []);
    const out = [];

    if (multi.length) {
        multi.forEach(o => {
            const label = __ssCleanOptionLabel(o.label || o.key || "Option");
            const value = String(o.value ?? "").trim();
            if (!value) return;
            out.push({ label, value });
        });
        return out;
    }

    if (item?.selectedOption) {
        let label = "Option";
        if (product?.optionGroups && Array.isArray(product.optionGroups) && product.optionGroups.length && product.optionGroups[0]?.label) {
            label = product.optionGroups[0].label;
        } else if (product?.productOptions && product.productOptions.length > 1) {
            label = product.productOptions[0];
        }
        label = __ssCleanOptionLabel(label);
        const value = String(item.selectedOption ?? "").trim();
        if (value) out.push({ label, value });
    }

    return out;
}

function __ssBuildOptionChipsHTML(displayOptions, isReceipt) {
    if (!Array.isArray(displayOptions) || displayOptions.length === 0) return "";
    const cls = isReceipt ? "BasketOptionChips ReceiptOptionChips" : "BasketOptionChips";
    return `<div class="${cls}">` + displayOptions.map(o => {
        const label = __ssEscHtml(__ssCleanOptionLabel(o.label || "Option"));
        const value = __ssEscHtml(String(o.value ?? "").trim());
        return `<span class="BasketOptionChip">${label}: ${value}</span>`;
    }).join("") + `</div>`;
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

function __ssBuildProductPageSkeletonHtml() {
    return `
<div id="ProductPageSkeleton" class="pps" aria-hidden="true">
  <div class="pps-inner">
    <div class="pps-top">
      <div class="pps-left">
        <div class="pps-arrow pps-arrow-left"></div>
        <div class="pps-main-image sk"></div>
        <div class="pps-arrow pps-arrow-right"></div>
        <div class="pps-thumbs">
          <div class="sk pps-thumb"></div>
          <div class="sk pps-thumb"></div>
          <div class="sk pps-thumb"></div>
          <div class="sk pps-thumb"></div>
          <div class="sk pps-thumb"></div>
        </div>
      </div>
      <div class="pps-right">
        <div class="sk pps-title-line pps-title-line-1"></div>
        <div class="sk pps-title-line pps-title-line-2"></div>
        <div class="pps-desc">
          <div class="sk pps-text"></div>
          <div class="sk pps-text"></div>
          <div class="sk pps-text short"></div>
        </div>
        <div class="pps-bullets">
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
        </div>
        <div class="sk pps-shipping"></div>
        <div class="sk pps-price"></div>
        <div class="pps-buy-row">
          <div class="pps-qty">
            <div class="sk pps-qty-btn"></div>
            <div class="sk pps-qty-num"></div>
            <div class="sk pps-qty-btn"></div>
          </div>
          <div class="sk pps-cart-btn"></div>
        </div>
        <div class="sk pps-buy-btn"></div>
      </div>
    </div>
    <div class="pps-related">
      <div class="sk pps-related-title"></div>
      <div class="pps-related-row">
        <div class="pps-related-card"><div class="sk pps-related-image"></div><div class="sk pps-related-line"></div><div class="sk pps-related-line short"></div></div>
        <div class="pps-related-card"><div class="sk pps-related-image"></div><div class="sk pps-related-line"></div><div class="sk pps-related-line short"></div></div>
        <div class="pps-related-card desktop-only"><div class="sk pps-related-image"></div><div class="sk pps-related-line"></div><div class="sk pps-related-line short"></div></div>
        <div class="pps-related-card desktop-only"><div class="sk pps-related-image"></div><div class="sk pps-related-line"></div><div class="sk pps-related-line short"></div></div>
        <div class="pps-related-card desktop-only"><div class="sk pps-related-image"></div><div class="sk pps-related-line"></div><div class="sk pps-related-line short"></div></div>
      </div>
    </div>
  </div>
</div>`;
}

function __ssShowProductPageSkeleton() {
    const viewer = document.getElementById("Viewer");
    if (!viewer) return;
    try {
        viewer.innerHTML = __ssBuildProductPageSkeletonHtml();
    } catch {
        viewer.innerHTML = '';
    }
}

function __ssHideProductPageSkeleton() {
    const sk = document.getElementById("ProductPageSkeleton");
    if (!sk) return;
    try { sk.remove(); } catch {}
}

function __ssScrollToTopForProductSkeleton() {
    try {
        const isPhone = !!(window.matchMedia && window.matchMedia("(max-width: 680px)").matches);
        if (!isPhone) return;
        requestAnimationFrame(() => {
            try { window.scrollTo({ top: 0, behavior: "smooth" }); }
            catch {
                try { window.scrollTo(0, 0); } catch {}
            }
        });
    } catch {}
}

/* Override: safe product page with multi-options + option→image mapping */
function GoToProductPage(productName, productPrice, productDescription) {
    console.log("Product clicked:", productName);
    // analytics: product opened (viewer)
    const __ssViewToken = __ssStartProductViewSession();
    window.__ssCurrentViewedProductName = productName;
    // Initialize safely; the concrete product object is resolved further below.
    // NOTE: do not reference `product` here (TDZ) because it's declared later.
    window.__ssCurrentViewedProductLink = (typeof productLink !== 'undefined' ? productLink : '');
    const __ssClickToken2 = __ssConsumeRecentClickToken();
    sendAnalyticsEvent('product_open', {
        ...buildAnalyticsProductPayload(productName, { priceEUR: productPrice }),
        extra: { viewToken: __ssViewToken, clickToken: __ssClickToken2 }
    });
    try { clearCategoryHighlight(); } catch { }

    const viewer = document.getElementById("Viewer");
    if (!viewer) {
        console.error(TEXTS?.ERRORS?.PRODUCTS_NOT_LOADED || "Viewer not found.");
        return;
    }

    __ssShowProductPageSkeleton();
    __ssScrollToTopForProductSkeleton();
    try { removeSortContainer(); } catch { }

    const __pidArg = String(arguments[4] || "").trim();
    const product = (__pidArg ? __ssGetCatalogFlat().find(p => String(p?.productId || p?.id || "").trim() === __pidArg) : null) || __ssGetCatalogFlat().find(p => p?.name === productName);
    // Robust current productId tracking (avoid accidental [object Set] etc.)
    try {
        let __pid = __ssIdNorm(arguments[4] || product?.productId || '');
        if (__ssIsBadId(__pid)) {
            // fallback: find by name and take its productId
            const __p2 = __ssGetCatalogFlat().find(p => String(p?.name || '').trim() === String(productName || '').trim());
            __pid = __ssIdNorm(__p2?.productId || '');
        }
        if (!__ssIsBadId(__pid)) { window.__ssCurrentProductId = __pid; try { if (product && typeof product === 'object') product.productId = __pid; } catch { } }
    } catch { }
    // If navigation provided a reco discount payload, persist it for PDP rendering and cart attribution.
    try {
        const __pidNav = String(arguments[4] || product?.productId || "").trim();
        const __discNav = arguments[5] && typeof arguments[5] === "object" ? arguments[5] : null;
        const __pctNav = Number(__discNav?.discountPct || 0);
        const __discPriceNav = Number(__discNav?.discountedPrice || 0);
        const __tokNav = String(__discNav?.discountToken || "");
        if (__pidNav && __pctNav > 0 && __discPriceNav > 0) {
            sessionStorage.setItem("ss_reco_pdp_discount_v1", JSON.stringify({
                productId: __ssIdNorm(__pidNav),
                discountToken: __tokNav,
                discountPct: __pctNav,
                discountedPrice: __discPriceNav,
                ts: Date.now()
            }));
        }
    } catch { }

    // Store link for analytics / deep-linking if available.
    window.__ssCurrentViewedProductLink = (product?.productLink || product?.link || '');
    const __ssImagesForViewer = (__ssABIsB("pi") && Array.isArray(product?.imagesB) && product.imagesB.length) ? product.imagesB : (product?.images || []);
    if (!product || !Array.isArray(__ssImagesForViewer) || __ssImagesForViewer.length === 0) {
        console.error("❌ Product not found or no images:", productName);
        try { __ssHideProductPageSkeleton(); } catch {}
        return;
    }

    const imagePromises = __ssImagesForViewer.map(src => new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
    }));

    Promise.all(imagePromises).then(loadedImages => {
        const validImages = loadedImages.filter(Boolean);
        if (validImages.length === 0) {
            console.error("❌ No valid images loaded for:", productName);
            // Do not hard-fail the PDP; render with a fallback image so other features (pricing/discounts/cart) continue to work.
            const fallback = __ssFixImageUrl(product?.image || "");
            const safeImages = fallback ? [fallback] : [];
            renderProductPage(product, safeImages, productName, productPrice, productDescription);
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
    window.__ssCurrentProductId = String(product.productId || product.id || '').trim() || null;

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

    __ssEnsureABUiStyles();

    const heading = document.createElement("div");
    heading.className = "Product_Name_Heading";
    heading.dataset.canonicalName = String(productName || "");
    heading.textContent = (__ssABGetProductName(product) || productName || "");

    const desc = document.createElement("div");
    desc.className = "Product_Description";
    const __abDesc = String(__ssABGetProductDescription(product) || "").trim();
    const __displayDesc = (__abDesc)
        ? __abDesc
        : ((productDescription && String(productDescription).trim())
            ? String(productDescription)
            : (TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || ""));
    desc.textContent = __displayDesc;

    const delivery = document.createElement("div");
    delivery.className = "Product_Delivery_Info";
    delivery.textContent = String(__ssABGetDeliveryText(product) || "Shipping free");

    infoCol.append(heading, desc, delivery);

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

                    // Update price for current variant (if configured)
                    try {
                        const priceEl = document.getElementById("product-page-price");
                        if (priceEl) {
                            const eur = __ssResolveVariantPriceEUR(product, current, current?.[0]?.value || "");
                            priceEl.dataset.eur = String(eur ?? "");
                            // Base EUR text; updateAllPrices() will convert if needed
                            priceEl.textContent = `${eur} ${TEXTS?.CURRENCIES?.EUR || "€"}`;
                            if (typeof updateAllPrices === "function") updateAllPrices();
                        }
                    } catch { }

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
    const _selInit = __ssGetSelectedOptions();
    const _eurInit = __ssResolveVariantPriceEUR(product, _selInit, _selInit?.[0]?.value || "");
    pSpan.dataset.eur = String(_eurInit ?? "");
    pSpan.textContent = `${_eurInit} ${TEXTS?.CURRENCIES?.EUR || "€"}`;

    // If user arrived from a discounted recommendation, show discount on PDP and avoid double-discounting.
    try {
        const pid = __ssGetCurrentPidFallback() || String(product?.productId || "").trim();
        let d = null;
        try { d = JSON.parse(sessionStorage.getItem("ss_reco_pdp_discount_v1") || "null"); } catch { d = null; }
        // If the stored payload is for a different product, ignore it (otherwise it blocks fallback sources).
        try {
            if (d && pid && !__ssIdEq((d?.productId || d?.targetProductId || ""), pid)) d = null;
        } catch { }
        if (!d) {
            try { d = __ssRecoConsumeRecentClick(); } catch { d = null; }
            // Also ignore recent-click payloads that don't match this product.
            try {
                if (d && pid && !__ssIdEq((d?.productId || d?.targetProductId || ""), pid)) d = null;
            } catch { }
        }
        // If URL contains ?reco=<token>, hydrate discount payload from durable store (works across refresh/new tab).
        try {
            const __tokQ = __ssIdNorm(new URLSearchParams(window.location.search).get("reco") || "");
            if (__tokQ && (!d || !Number(d?.discountPct || 0))) {
                const ent = __ssRecoDiscountStoreGet(__tokQ);
                if (ent && __ssIdEq(ent.productId, pid)) {
                    d = { productId: pid, discountToken: __tokQ, discountPct: Number(ent.discountPct || 0), discountedPrice: Number(ent.discountedPrice || 0) };
                }
            }
        } catch { }
        const pct = Number(d?.discountPct || 0);
        let discPrice = Number(d?.discountedPrice || 0);
        const tok = String(d?.discountToken || "");
        const orig = Number(_eurInit || 0);
        if (pid && __ssIdEq((d?.productId || d?.targetProductId || ""), pid) && pct > 0) {
            // If backend didn't provide discountedPrice, compute from original.
            if ((!Number.isFinite(discPrice) || discPrice <= 0) && Number.isFinite(orig) && orig > 0) {
                discPrice = Math.round((orig * (1 - pct / 100)) * 100) / 100;
            }
        }
        if (pid && __ssIdEq((d?.productId || d?.targetProductId || ""), pid) && pct > 0 && discPrice > 0) {
            pSpan.dataset.eurOriginal = String(orig || "");
            pSpan.dataset.eur = String(discPrice);
            pSpan.dataset.recoDiscountToken = tok;
            pSpan.dataset.recoDiscountPct = String(pct);
            window.__ssRecoPdpDiscountAppliedFor = pid;

            const cur = (TEXTS?.CURRENCIES?.EUR || "€");
            pSpan.innerHTML = `<span style="text-decoration:line-through;opacity:.65;margin-right:4px">${orig}${cur}</span> <span style="font-weight:700">${discPrice}${cur}</span> `;
            if (typeof updateAllPrices === "function") updateAllPrices();
        } else {
            window.__ssRecoPdpDiscountAppliedFor = null;
        }
    } catch { }

    priceLabel.append(pStrong, pSpan);
    infoCol.appendChild(priceLabel);

    // Quantity + Add to cart
    const qtyWrap = document.createElement("div");
    qtyWrap.className = "ProductPageQuantityContainer";

    const qtyControls = document.createElement("div");
    qtyControls.className = "Quantity_Controls_ProductPage";

    const qtyKey = (window.__ssCurrentProductId || product.productId || product.id || productName);

    const dec = document.createElement("button");
    dec.className = "Button";
    dec.type = "button";
    dec.textContent = TEXTS?.BASKET?.BUTTONS?.DECREASE || "-";
    dec.addEventListener("click", (e) => { e.preventDefault(); try { decreaseQuantity(qtyKey); } catch { } });

    const qtySpan = document.createElement("span");
    qtySpan.className = "WhiteText";
    qtySpan.id = `quantity-${__ssGetQtyKey(qtyKey)}`;
    qtySpan.textContent = String(__ssGetQtyValue(qtyKey));

    const inc = document.createElement("button");
    inc.className = "Button";
    inc.type = "button";
    inc.textContent = TEXTS?.BASKET?.BUTTONS?.INCREASE || "+";
    inc.addEventListener("click", (e) => { e.preventDefault(); try { increaseQuantity(qtyKey); } catch { } });

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
            (parseFloat(document.getElementById("product-page-price")?.dataset?.eur || "") || parseFloat(productPrice) || Number(productPrice) || 0),
            mainSrc,
            product.expectedPurchasePrice,
            product.productLink,
            __displayDesc,
            legacy,
            sel,
            (window.__ssCurrentProductId || product.productId || null)
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
            (parseFloat(document.getElementById("product-page-price")?.dataset?.eur || "") || parseFloat(productPrice) || Number(productPrice) || 0),
            mainSrc,
            product.expectedPurchasePrice,
            product.productLink,
            __displayDesc,
            legacy,
            sel,
            (window.__ssCurrentProductId || product.productId || null)
        );
    });

    infoCol.appendChild(buyBtn);

    // Assemble
    details.append(imagesCol, infoCol);
    productDiv.appendChild(details);
    Product_Viewer.appendChild(productDiv);
    try { viewer.replaceChildren(Product_Viewer); } catch { viewer.innerHTML = ''; viewer.appendChild(Product_Viewer); }

    // Ensure product.productId is sane for recommendations + discount matching
    try {
        const __pid = __ssGetCurrentPidFallback() || __ssIdNorm(product?.productId || '');
        if (__pid && !__ssIsBadId(__pid)) {
            if (__ssIsBadId(product?.productId)) product.productId = __pid;
            window.__ssCurrentProductId = __pid;
        }
    } catch { }

    try { requestAnimationFrame(() => { try { Product_Viewer.classList.add('is-ready'); } catch {} }); } catch {}

    try { __ssRecoRenderForProduct(product); } catch { }

    // Swipe support (non-breaking)
    try {
        let touchStartX = 0;
        let touchEndX = 0;
        mainImg.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        mainImg.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const threshold = 50;
            if (touchEndX < touchStartX - threshold) nextImage();
            else if (touchEndX > touchStartX + threshold) prevImage();
        });
    } catch { }

    try {
        const __isPhoneAfterRender = !!(window.matchMedia && window.matchMedia("(max-width: 680px)").matches);
        if (!__isPhoneAfterRender) window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { }
    try { updateAllPrices(); } catch { }
    try { updateImage(); } catch { }
}


// ===== Recommendations widget (product page) =====
function __ssRecoGetSessionId() {
    const k = "ss_reco_sid_v1";
    try {
        let v = localStorage.getItem(k);
        if (v && String(v).trim()) return String(v).trim();
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            const a = new Uint32Array(4);
            crypto.getRandomValues(a);
            v = Array.from(a).map(x => x.toString(16)).join("");
        } else {
            v = String(Date.now()) + "_" + Math.random().toString(16).slice(2);
        }
        localStorage.setItem(k, v);
        return v;
    } catch {
        return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
    }
}


function __ssRecoDiscountStorePut(token, payload) {
    const k = "ss_reco_discount_store_v2";
    try {
        const tok = __ssIdNorm(token);
        if (!tok) return;
        const raw = localStorage.getItem(k) || "{}";
        const db = JSON.parse(raw);
        const now = Date.now();
        for (const [t, v] of Object.entries(db)) {
            const age = now - Number(v?.ts || 0);
            if (!(age >= 0 && age <= 2 * 60 * 60 * 1000)) delete db[t];
        }
        db[tok] = { ...payload, ts: now };
        localStorage.setItem(k, JSON.stringify(db));
    } catch { }
}
function __ssRecoDiscountStoreGet(token) {
    const k = "ss_reco_discount_store_v2";
    try {
        const tok = __ssIdNorm(token);
        if (!tok) return null;
        const raw = localStorage.getItem(k) || "{}";
        const db = JSON.parse(raw);
        const v = db && db[tok] ? db[tok] : null;
        if (!v) return null;
        const age = Date.now() - Number(v.ts || 0);
        if (!(age >= 0 && age <= 2 * 60 * 60 * 1000)) return null;
        return v;
    } catch { return null; }
}

function __ssRecoSaveRecentClick(data) {
    const k = "ss_reco_last_click_v1";
    try {
        if (data && typeof data === "object") {
            if ("targetProductId" in data) data.targetProductId = __ssIdNorm(data.targetProductId);
            if ("sourceProductId" in data) data.sourceProductId = __ssIdNorm(data.sourceProductId);
            if ("productId" in data) data.productId = __ssIdNorm(data.productId);
        }
        // Normalize discount payload: backend may omit discountedPrice.
        // If we have a pct and original price, compute discountedPrice so PDP/cart can render.
        const pct = Number(data?.discountPct || 0);
        const orig = Number(data?.originalPrice || data?.price || 0);
        let discountedPrice = Number(data?.discountedPrice || 0);
        if (pct > 0 && (!Number.isFinite(discountedPrice) || discountedPrice <= 0) && Number.isFinite(orig) && orig > 0) {
            discountedPrice = Math.round((orig * (1 - pct / 100)) * 100) / 100;
        }
        const rec = { ...data, discountedPrice, ts: Date.now() };
        localStorage.setItem(k, JSON.stringify(rec));
        if (rec && rec.discountToken && Number(rec.discountPct || 0) > 0 && Number(rec.discountedPrice || 0) > 0) {
            __ssRecoDiscountStorePut(rec.discountToken, { productId: __ssIdNorm(rec.productId || rec.targetProductId), discountPct: Number(rec.discountPct || 0), discountedPrice: Number(rec.discountedPrice || 0) });
        }
    } catch { }
}

function __ssRecoConsumeRecentClick() {
    const k = "ss_reco_last_click_v1";
    try {
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        const d = JSON.parse(raw);
        const age = Date.now() - Number(d?.ts || 0);
        if (!(age >= 0 && age <= 30 * 60 * 1000)) return null; // 30 minutes
        return d;
    } catch {
        return null;
    }
}

function __ssRecoClearRecentClick() {
    try { localStorage.removeItem("ss_reco_last_click_v1"); } catch { }
}

function __ssRecoEnsureStyles() {
    if (document.getElementById("__ssRecoStyles")) return;
    const s = document.createElement("style");
    s.id = "__ssRecoStyles";
    s.textContent = `
      .RecoSection{
        margin-top:24px;
        border-top:1px solid rgba(255,255,255,.12);
        padding-top:18px;
        /* lock to viewport width on first paint (prevents initial oversized cards) */
        width:100%;
        max-width:100%;
        margin-left:auto;
        margin-right:auto;
        box-sizing:border-box;
      }
      .RecoHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
      .RecoHead h3{margin:0;font-size:18px;}
      .RecoNavs{display:flex;gap:8px;align-items:center;}
      .RecoNav{width:36px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:inherit;cursor:pointer;display:grid;place-items:center;user-select:none}
      .RecoNav:disabled{opacity:.35;cursor:default}
  
      /* single-row AliExpress-like strip */
      .RecoViewport{
        overflow-x:auto;
        scroll-snap-type:x mandatory;
        -webkit-overflow-scrolling:touch;
        padding-bottom:10px;
  
        width:100%;
        box-sizing:border-box;
      }
      .RecoViewport::-webkit-scrollbar{height:10px}
      .RecoViewport::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:999px}
  
      .RecoStrip{
        --reco-cols: 3;
        --reco-gap: 12px;
        width:100%;
        min-width:100%;
        box-sizing:border-box;
        display:grid;
        grid-auto-flow:column;
        grid-template-rows:1fr;
        gap:var(--reco-gap);
        align-content:start;
        padding-right:6px;
        /* auto-fit N cards in the viewport; JS sets --reco-cols */
        grid-auto-columns:minmax(151px, calc((100% - (var(--reco-gap) * (var(--reco-cols) - 1))) / var(--reco-cols)));
      }
      @media (max-width: 460px){
        .RecoStrip{
        
          grid-auto-columns:minmax(47.5vw, calc((100% - (var(--reco-gap) * (var(--reco-cols) - 1))) / var(--reco-cols)));
        }
        .RecoNav{width:34px;height:34px;border-radius:11px;}
      }
  
   
      .RecoCard:hover{background:rgba(255,255,255,.07)}
      .RecoImg{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;background:rgba(255,255,255,.06)}
      .RecoName{font-size:13px;line-height:1.25;max-height:3.8em;overflow:hidden;}
      .RecoMeta{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;opacity:.9}
      .RecoBadge{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);opacity:.9}
  
      .RecoOld{text-decoration:line-through;opacity:.65;margin-right:4px}
      .RecoNew{font-weight:700}
      .RecoDisc{border-color:rgba(255,255,255,.22)}
  
    `;
    document.head.appendChild(s);
}

async function __ssRecoSendEvent(type, payload) {
    try {
        const body = { type, ...payload };
        // sendBeacon if available
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
            navigator.sendBeacon(`${API_BASE}/recs/event`, blob);
            return;
        }
        await fetch(`${API_BASE}/recs/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            keepalive: true
        });
    } catch { }
}

async function __ssRecoRenderForProduct(product) {
    try {
        if (!product) return;
        const viewer = document.getElementById("Viewer");
        const pv = document.getElementById("Product_Viewer");
        if (!viewer || !pv) return;

        __ssRecoEnsureStyles();

        // Remove old
        const old = document.getElementById("RecoSection");
        if (old) old.remove();

        const sid = __ssRecoGetSessionId();
        const device = (window.innerWidth <= 700) ? "mobile" : "desktop";

        const recState = {
            widgetId: null,
            token: null,
            listToken: null,
            // IMPORTANT: /recs expects a stable productId, not a name
            sourceProductId: (__ssResolvePidForRecs(product) || __ssGetCurrentPidFallback() || __ssIdNorm(product.productId)),
            currentProductId: __ssIdNorm(product.productId || (__ssResolvePidForRecs(product) || __ssGetCurrentPidFallback() || '')),
            device,
            visibleCount: 3,
            batchSize: 3,
            maxBatches: 6,
            maxItems: 0,
            swipeSmallPx: 35,
            swipeBigPx: 120,
            offset: 0,
            batchesLoaded: 0,
            loading: false,
            hasMore: true
        };

        // Stable exclusion set for paging (prevents repeats + self-recommendation)
        recState.excludeSet = new Set();
        try {
            const cur0 = __ssIdNorm(recState.currentProductId || '');
            const src0 = __ssIdNorm(recState.sourceProductId || '');
            if (cur0 && !__ssIsBadId(cur0)) recState.excludeSet.add(cur0);
            if (src0 && !__ssIsBadId(src0)) recState.excludeSet.add(src0);
        } catch { }


        async function fetchBatch() {
            if (recState.loading) return null;
            if (!recState.hasMore) return null;
            if (recState.batchesLoaded >= recState.maxBatches) return null;
            if (recState.maxItems > 0 && recState.offset >= recState.maxItems) return null;

            recState.loading = true;
            try {
                // sanitize sourceProductId before calling backend
                try {
                    let spid = __ssIdNorm(recState.sourceProductId);

                    // If it's garbage (e.g. "[object Set]"), attempt recovery from URL or product name
                    if (__ssIsBadId(spid)) {
                        // 1) URL /p/<pid> or stored current pid
                        const fromUrl = __ssGetCurrentPidFallback();
                        if (fromUrl) spid = __ssIdNorm(fromUrl);

                        // 2) product name -> pid
                        if (!spid || __ssIsBadId(spid)) {
                            const nm = String(product?.name ?? product?.title ?? '').trim();
                            const rp = __ssResolvePidFromCatalogByName(nm);
                            if (rp) spid = __ssIdNorm(rp);
                        }
                        // 3) last viewed product name -> pid
                        if (!spid || __ssIsBadId(spid)) {
                            const nm2 = String(window.__ssCurrentViewedProductName || "").trim();
                            const rp2 = __ssResolvePidFromCatalogByName(nm2);
                            if (rp2) spid = __ssIdNorm(rp2);
                        }

                    }

                    // If spid looks like a name, resolve via catalog
                    if (spid && /\s/.test(spid)) {
                        const rp = __ssResolvePidFromCatalogByName(spid);
                        if (rp) spid = __ssIdNorm(rp);
                    }

                    // Final validation
                    if (!spid || __ssIsBadId(spid) || /\s/.test(spid)) {
                        console.warn('Reco: invalid sourceProductId, skipping /recs fetch:', recState.sourceProductId);
                        return null;
                    }

                    recState.sourceProductId = spid;
                } catch (e) {
                    console.warn('Reco: sanitize failed', e);
                }

                const u = new URL(`${API_BASE}/recs`);
                u.searchParams.set("sourceProductId", recState.sourceProductId);
                if (recState.currentProductId) u.searchParams.set("currentProductId", String(recState.currentProductId));
                u.searchParams.set("device", recState.device);
                u.searchParams.set("offset", String(recState.offset));
                u.searchParams.set("limit", String(recState.batchSize));
                if (recState.listToken) u.searchParams.set("listToken", recState.listToken);
                try {
                    // Build exclude list only from stable exclusions. Do not add already-rendered
                    // items here because this request also uses offset pagination; mixing both can
                    // skip later pages on mobile and leave the strip non-scrollable.
                    const exSet = (recState.excludeSet instanceof Set) ? new Set(recState.excludeSet) : new Set();

                    // Always exclude current PDP + source
                    const cur = __ssIdNorm(recState.currentProductId || recState.sourceProductId || product?.productId || '');
                    const src = __ssIdNorm(recState.sourceProductId || '');
                    if (cur && !__ssIsBadId(cur)) exSet.add(cur);
                    if (src && !__ssIsBadId(src)) exSet.add(src);

                    const exCsv = Array.from(exSet).filter(Boolean).join(",");
                    // Always include exclude param (helps backend logs + deterministic behavior)
                    u.searchParams.set("exclude", exCsv);

                    // Keep for client-side filtering too
                    recState.__excludeSet = exSet;
                } catch { }

                console.log("[recs] OUT", { url: String(u), sourceProductId: recState.sourceProductId, currentProductId: recState.currentProductId, device: recState.device, offset: recState.offset, limit: recState.batchSize, excludeCount: (recState.__excludeSet instanceof Set) ? recState.__excludeSet.size : 0, listToken: recState.listToken || null });

                const r = await fetch(String(u), { method: "GET" });
                const d = await r.json().catch(() => null);
                try { console.log("[recs] IN", { ok: !!(d && d.ok), widgetId: d && d.widgetId, sourceProductId: d && d.sourceProductId, items: Array.isArray(d && d.items) ? d.items.length : 0, hasMore: d && d.hasMore, listToken: (d && d.listToken) || null, token: (d && d.token) || null }); } catch { }
                if (!d || !d.ok || !Array.isArray(d.items)) return null;

                recState.widgetId = recState.widgetId || d.widgetId;
                if (!recState.token && typeof d.token === 'string' && d.token) recState.token = d.token;
                if (!recState.listToken && typeof d.listToken === 'string' && d.listToken) recState.listToken = d.listToken;

                const ui = (d.ui && typeof d.ui === "object") ? d.ui : {};
                recState.visibleCount = Math.max(1, Number(ui.visibleCount || recState.visibleCount) || recState.visibleCount);
                recState.batchSize = Math.max(1, Number(ui.batchSize || recState.batchSize) || recState.batchSize);
                recState.maxBatches = Math.max(1, Number(ui.maxBatches || recState.maxBatches) || recState.maxBatches);
                recState.maxItems = Math.max(0, Number(ui.maxItems || recState.maxItems) || recState.maxItems);
                recState.swipeSmallPx = Math.max(5, Number(ui.swipeSmallPx || recState.swipeSmallPx) || recState.swipeSmallPx);
                recState.swipeBigPx = Math.max(20, Number(ui.swipeBigPx || recState.swipeBigPx) || recState.swipeBigPx);

                // cap limit client-side if server doesn't
                const maxAdd = (recState.maxItems > 0) ? Math.max(0, recState.maxItems - recState.offset) : 9999;
                const items = (d.items || []).slice(0, maxAdd);

                // Defense-in-depth: never show the product currently being viewed (or anything in exclude set)
                try {
                    const exSet = (recState.__excludeSet instanceof Set) ? recState.__excludeSet : new Set();
                    const cur = __ssIdNorm(recState.currentProductId || recState.sourceProductId || product?.productId || '');
                    if (cur && !__ssIsBadId(cur)) exSet.add(cur);
                    const filtered = [];
                    for (const it of items) {
                        const pid = __ssIdNorm(it && it.productId);
                        if (pid && exSet.has(pid)) continue;
                        filtered.push(it);
                    }
                    // replace in-place so offset math uses filtered length
                    items.length = 0;
                    items.push(...filtered);
                } catch { }

                const serverReturned = Array.isArray(d.items) ? d.items.length : 0;
                // Capture best performers list for sparse repeat allowance (server-provided).
                try {
                    if (Array.isArray(d.bestPerformerIds)) {
                        recState.bestPerformerIds = d.bestPerformerIds.slice();
                        const bs = new Set();
                        d.bestPerformerIds.forEach(pid => { const n = __ssIdNorm(pid); if (n) bs.add(n); });
                        recState.bestSet = bs;
                    }
                } catch { }

                recState.offset += serverReturned;
                recState.batchesLoaded += 1;
                recState.hasMore = !!d.hasMore && serverReturned > 0;
                try {
                    // Keep stable exclusions limited to explicit/current/source ids.
                    // Already-rendered items are de-duplicated client-side via seenSet.
                    const exSet = (recState.excludeSet instanceof Set) ? new Set(recState.excludeSet) : new Set();
                    const cur = __ssIdNorm(recState.currentProductId || recState.sourceProductId || product?.productId || '');
                    const src = __ssIdNorm(recState.sourceProductId || '');
                    if (cur && !__ssIsBadId(cur)) exSet.add(cur);
                    if (src && !__ssIsBadId(src)) exSet.add(src);
                    recState.excludeSet = exSet;
                } catch { }

                return { d, items };
            } finally {
                recState.loading = false;
            }
        }

        const first = await fetchBatch();
        if (!first || !first.items || first.items.length === 0) return;
        recState.items = first.items.slice();

        const section = document.createElement("div");
        section.id = "RecoSection";
        section.className = "RecoSection";

        const head = document.createElement("div");
        head.className = "RecoHead";

        const h = document.createElement("h3");
        h.textContent = "Other products";

        const navs = document.createElement("div");
        navs.className = "RecoNavs";

        const btnL = document.createElement("button");
        btnL.type = "button";
        btnL.className = "RecoNav";
        btnL.setAttribute("aria-label", "Scroll left");
        btnL.textContent = "‹";

        const btnR = document.createElement("button");
        btnR.type = "button";
        btnR.className = "RecoNav";
        btnR.setAttribute("aria-label", "Scroll right");
        btnR.textContent = "›";

        navs.appendChild(btnL);
        navs.appendChild(btnR);

        head.appendChild(h);
        head.appendChild(navs);

        const viewport = document.createElement("div");
        viewport.className = "RecoViewport";

        const strip = document.createElement("div");
        strip.className = "RecoStrip";
        strip.style.setProperty("--reco-cols", String(recState.visibleCount));

        viewport.appendChild(strip);

        __ssEnsureContributionProducts();
        const flat = (Array.isArray(__ssContributionCache.items) && __ssContributionCache.items.length)
            ? __ssContributionCache.items.map(x => ({ name: x.name, price: x.price, images: x.images || [], productLink: x.productLink || "", productId: x.productId }))
            : __ssGetCatalogFlat();

        function makeCard(it, idx) {
            const card = document.createElement("div");
            card.className = "RecoCard";
            card.dataset.productId = __ssIdNorm(it.productId);
            card.dataset.position = String(it.position || (idx + 1));

            const img = document.createElement("img");
            img.className = "RecoImg";
            img.loading = "lazy";
            img.alt = String(it.name || "");
            img.src = String(it.image || "");

            const nm = document.createElement("div");
            nm.className = "RecoName";
            nm.textContent = String(it.name || "");

            const meta = document.createElement("div");
            meta.className = "RecoMeta";

            const price = document.createElement("span");
            // Make it compatible with updateAllPrices() (currency + tariffs)
            price.className = "product-price";
            const eur = Number(it.price || 0);
            const discPct = Number(it.discountPct || 0);
            let discPrice = Number(it.discountedPrice || 0);

            // A discount is "real" only if we can compute a valid discounted price from a valid original price.
            if (discPct > 0 && eur > 0 && (!Number.isFinite(discPrice) || discPrice <= 0)) {
                discPrice = Math.round((eur * (1 - discPct / 100)) * 100) / 100;
            }
            const hasRealDiscount = (discPct > 0 && eur > 0 && Number.isFinite(discPrice) && discPrice > 0 && discPrice < eur);

            if (hasRealDiscount) {
                price.dataset.eurOriginal = String(eur);
                price.dataset.eur = String(discPrice);
                price.dataset.discountPct = String(discPct);
                // initial paint (will be rewritten by updateAllPrices)
                price.innerHTML = `<span style="text-decoration:line-through;opacity:.65;margin-right:4px">${eur}</span> <span style="font-weight:700">${discPrice}</span>`;
            } else {
                price.dataset.eur = String(eur || "");
                price.textContent = eur ? `${eur}` : "";
            }

            const badge = document.createElement("span");
            badge.className = "RecoBadge";
            const pos = Number(it.position || (idx + 1));
            if (pos <= 2) badge.textContent = "Bestseller";
            else badge.textContent = "Suggested";

            if (hasRealDiscount) {
                const dsc = document.createElement("span");

                meta.append(price, badge, dsc);
            } else {
                meta.append(price, badge);
            }

            card.append(img, nm, meta);

            card.addEventListener("click", (e) => {
                e.preventDefault();

                __ssRecoSendEvent("click", {
                    widgetId: recState.widgetId,
                    token: recState.token,
                    sourceProductId: recState.sourceProductId,
                    targetProductId: __ssIdNorm(it.productId),
                    position: pos,
                    sessionId: sid,
                    discountToken: String(it.discountToken || ""),
                    discountPct: Number(it.discountPct || 0),
                    discountedPrice: Number(it.discountedPrice || 0)
                });

                __ssRecoSaveRecentClick({
                    widgetId: recState.widgetId,
                    token: recState.token,
                    sourceProductId: recState.sourceProductId,
                    targetProductId: __ssIdNorm(it.productId),
                    productId: __ssIdNorm(it.productId),
                    position: pos,
                    sessionId: sid,
                    discountToken: String(it.discountToken || ""),
                    discountPct: Number(it.discountPct || 0),
                    discountedPrice: Number(it.discountedPrice || 0),
                    originalPrice: Number(it.price || 0)
                });

                const pid0 = __ssIdNorm(it.productId || "");
                const pid = (!__ssIsBadId(pid0) ? pid0 : (__ssResolvePidFromCatalogByName(it.name) || ""));

                const target = flat.find(p => String(p?.productId || "").trim() === String(it.productId).trim());

                try {
                    // allow product page to render the discount immediately
                    const __pct = Number(it.discountPct || 0);
                    const __orig = Number(it.price || 0);
                    let __disc = Number(it.discountedPrice || 0);
                    if (__pct > 0 && (!Number.isFinite(__disc) || __disc <= 0) && Number.isFinite(__orig) && __orig > 0) {
                        __disc = Math.round((__orig * (1 - __pct / 100)) * 100) / 100;
                    }
                    const payload = {
                        productId: pid,
                        discountToken: String(it.discountToken || ""),
                        discountPct: __pct,
                        discountedPrice: __disc,
                        ts: Date.now()
                    };
                    sessionStorage.setItem("ss_reco_pdp_discount_v1", JSON.stringify({ ...payload, productId: __ssIdNorm(payload.productId) }));
                    if (payload.discountToken && payload.discountPct > 0 && payload.discountedPrice > 0) {
                        __ssRecoDiscountStorePut(payload.discountToken, { productId: __ssIdNorm(payload.productId), discountPct: payload.discountPct, discountedPrice: payload.discountedPrice });
                    }
                } catch { }

                (p => String(p?.productId || "").trim() === String(it.productId).trim());
                if (target) {
                    navigate("GoToProductPage", [
                        target.name,
                        (__ssResolveVariantPriceEUR(target, [], "") || target.price),
                        ((__ssABGetProductDescription(target) || target.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER),
                        null,
                        pid,
                        (() => {
                            const pct = Number(it.discountPct || 0);
                            const orig = Number(it.price || 0);
                            let disc = Number(it.discountedPrice || 0);
                            if (pct > 0 && (!Number.isFinite(disc) || disc <= 0) && Number.isFinite(orig) && orig > 0) {
                                disc = Math.round((orig * (1 - pct / 100)) * 100) / 100;
                            }
                            return { discountToken: String(it.discountToken || ""), discountPct: pct, discountedPrice: disc };
                        })()
                    ]);
                } else {
                    navigate("GoToProductPage", [
                        it.name,
                        it.price,
                        it.description || (TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER),
                        null,
                        pid,
                        (() => {
                            const pct = Number(it.discountPct || 0);
                            const orig = Number(it.price || 0);
                            let disc = Number(it.discountedPrice || 0);
                            if (pct > 0 && (!Number.isFinite(disc) || disc <= 0) && Number.isFinite(orig) && orig > 0) {
                                disc = Math.round((orig * (1 - pct / 100)) * 100) / 100;
                            }
                            return { discountToken: String(it.discountToken || ""), discountPct: pct, discountedPrice: disc };
                        })()
                    ]);
                }
            });

            return card;
        }

        function appendItems(items) {
            if (!Array.isArray(items) || items.length === 0) return;
            if (!Array.isArray(recState.items)) recState.items = [];

            // Track what has been shown to avoid repeats. Allow sparse repeats only for best performers.
            if (!(recState.seenSet instanceof Set)) {
                const ss = new Set();
                try { (recState.items || []).forEach(it => { const pid = __ssIdNorm(it && it.productId); if (pid) ss.add(pid); }); } catch { }
                recState.seenSet = ss;
            }
            if (!recState.lastShownPos || typeof recState.lastShownPos !== "object") recState.lastShownPos = Object.create(null);
            if (typeof recState.shownCounter !== "number") recState.shownCounter = recState.items.length;

            const bestSet = (recState.bestSet instanceof Set) ? recState.bestSet : new Set();
            const currentPid = __ssIdNorm(recState.currentProductId || recState.sourceProductId || "");
            const minGap = Math.max(8, Number(recState.visibleCount || 3) * 4);

            const toAppend = [];
            for (const it of items) {
                const pid = __ssIdNorm(it && it.productId);
                if (!pid || __ssIsBadId(pid)) continue;
                if (currentPid && pid === currentPid) continue;

                if (recState.seenSet.has(pid)) {
                    // Only best performers can repeat, and only sparsely.
                    if (!bestSet.has(pid)) continue;
                    const last = recState.lastShownPos[pid];
                    if (typeof last === "number" && (recState.shownCounter - last) < minGap) continue;
                }

                toAppend.push(it);
                recState.seenSet.add(pid);
                recState.lastShownPos[pid] = recState.shownCounter;
                recState.shownCounter += 1;
            }

            if (toAppend.length === 0) return;

            toAppend.forEach((it) => {
                recState.items.push(it);
                strip.appendChild(makeCard(it, recState.items.length - 1));
            });

            // Apply currency conversion + tariffs to newly injected price elements
            try {
                window.__ssSuppressPriceObserver = true;
                if (typeof updateAllPrices === "function") updateAllPrices(basketContainer);
            } catch { }
            finally {
                setTimeout(() => { try { window.__ssSuppressPriceObserver = false; } catch { } }, 250);
            }

            // analytics hook
            try {
                const sid = (typeof getOrCreateRecoSessionId === "function") ? getOrCreateRecoSessionId() : null;
                if (sid && typeof trackRecoImpressions === "function") {
                    trackRecoImpressions({
                        widgetId: recState.widgetId,
                        sourceProductId: recState.sourceProductId,
                        sessionId: sid,
                        extra: { shown: toAppend.map(x => ({ productId: x.productId, position: x.position })) }
                    });
                }
            } catch { }
        }

        appendItems(first.items);

        section.append(head, viewport);

        const pdp = document.querySelector('.Product_Detail_Page');
        const anchor = pdp || pv;
        anchor.insertAdjacentElement('afterend', section);

        async function ensureScrollableAfterPaint() {
            try {
                // wait for layout to settle (CSS injection + fonts)
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

                // if the strip isn't scrollable yet, preload more until it is (bounded)
                let safety = 0;
                while (safety++ < 6) {
                    const canScroll = viewport.scrollWidth > (viewport.clientWidth + 8);
                    if (canScroll) break;
                    const batch = await fetchBatch();
                    if (!batch || !batch.items || !batch.items.length) break;
                    appendItems(batch.items);
                    strip.style.setProperty("--reco-cols", String(recState.visibleCount));
                }
                __ssRecoUpdateNav();
            } catch { }
        }

        ensureScrollableAfterPaint();

        function getStride() {
            const firstCard = strip.querySelector(".RecoCard");
            if (!firstCard) return Math.max(150, viewport.clientWidth / Math.max(1, recState.visibleCount));
            const rect = firstCard.getBoundingClientRect();
            const gap = parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap || "12") || 12;
            return rect.width + gap;
        }

        function scrollToIndex(i, behavior = "smooth") {
            const stride = getStride();
            const target = Math.max(0, Math.round(i) * stride);
            viewport.scrollTo({ left: target, behavior });
        }

        function currentIndex() {
            const stride = getStride();
            return stride > 0 ? Math.round(viewport.scrollLeft / stride) : 0;
        }

        async function maybeLoadMore() {
            try {
                const idx = currentIndex();
                const total = strip.querySelectorAll(".RecoCard").length;
                const remaining = total - (idx + recState.visibleCount);
                const nearEnd = remaining <= Math.max(2, recState.visibleCount);
                if (!nearEnd) return;
                const batch = await fetchBatch();
                if (batch && batch.items && batch.items.length) {
                    appendItems(batch.items);
                    // refresh cols in case config changed
                    strip.style.setProperty("--reco-cols", String(recState.visibleCount));
                    __ssRecoUpdateNav();
                }
            } catch { }
        }

        function __ssRecoUpdateNav() {
            try {
                // align width
                try { const w = anchor.getBoundingClientRect().width; if (w && w > 240) section.style.maxWidth = Math.round(w) + 'px'; } catch { }
                const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
                btnL.disabled = viewport.scrollLeft <= 2;
                btnR.disabled = viewport.scrollLeft >= (maxScroll - 2);
            } catch { }
        }

        // Nav buttons: support mobile tap reliably + step one item on mobile
        function navStepItems() {
            return (recState.device === "mobile") ? 1 : recState.visibleCount;
        }

        async function handleNav(dir) {
            try {
                const step = navStepItems();
                const idx = currentIndex();
                const next = Math.max(0, idx + (dir * step));
                scrollToIndex(next);
                if (dir > 0) await maybeLoadMore();
            } catch { }
        }

        function bindNav(btn, dir) {
            // Click (desktop + many mobiles)
            btn.addEventListener('click', (e) => {
                try { e.preventDefault(); e.stopPropagation(); } catch { }
                handleNav(dir);
            });

            // Pointer/touch (some mobile browsers delay or miss click on small buttons near scroll areas)
            const onDown = (e) => {
                try { e.preventDefault(); e.stopPropagation(); } catch { }
                handleNav(dir);
            };
            btn.addEventListener('pointerdown', onDown, { passive: false });
            btn.addEventListener('touchstart', onDown, { passive: false });
        }

        bindNav(btnL, -1);
        bindNav(btnR, +1);

        // Swipe gestures
        let tStartX = 0, tStartY = 0, tDidMove = false;
        viewport.addEventListener("touchstart", (e) => {
            const t = e.touches && e.touches[0];
            if (!t) return;
            tStartX = t.clientX;
            tStartY = t.clientY;
            tDidMove = false;
        }, { passive: true });

        viewport.addEventListener("touchmove", (e) => {
            tDidMove = true;
        }, { passive: true });

        viewport.addEventListener("touchend", async (e) => {
            try {
                if (!tDidMove) return;
                const t = e.changedTouches && e.changedTouches[0];
                if (!t) return;
                const dx = t.clientX - tStartX;
                const dy = t.clientY - tStartY;
                if (Math.abs(dy) > Math.abs(dx)) return;

                const adx = Math.abs(dx);
                if (adx < recState.swipeSmallPx) return;

                const dir = dx < 0 ? 1 : -1;
                const idx = currentIndex();

                if (adx >= recState.swipeBigPx) {
                    scrollToIndex(idx + dir * recState.visibleCount);
                } else {
                    scrollToIndex(idx + dir * 1);
                }
                await maybeLoadMore();
            } catch { }
        }, { passive: true });

        viewport.addEventListener('scroll', () => { __ssRecoUpdateNav(); maybeLoadMore(); }, { passive: true });
        window.addEventListener('resize', () => {
            recState.device = (window.innerWidth <= 700) ? "mobile" : "desktop";
            strip.style.setProperty("--reco-cols", String(recState.visibleCount));
            __ssRecoUpdateNav();
        });

        __ssRecoUpdateNav();
    } catch { }
}

function __ssRecoMaybeAttributeAddToCart(targetProductId) {
    try {
        const pid = String(targetProductId || "").trim();
        if (!pid) return null;
        const click = __ssRecoConsumeRecentClick();
        if (!click) {
            try {
                const tokQ = __ssIdNorm(new URLSearchParams(window.location.search).get("reco") || "");
                const ent = tokQ ? __ssRecoDiscountStoreGet(tokQ) : null;
                if (ent && __ssIdEq(ent.productId, pid) && Number(ent.discountPct || 0) > 0) {
                    return { discountToken: tokQ, discountPct: Number(ent.discountPct || 0), discountedPrice: Number(ent.discountedPrice || 0) };
                }
            } catch { }
            return null;
        }
        if (!__ssIdEq(click.targetProductId || "", pid)) return null;

        __ssRecoSendEvent("add_to_cart", {
            widgetId: click.widgetId,
            token: click.token,
            sourceProductId: click.sourceProductId,
            targetProductId: pid,
            position: click.position,
            sessionId: click.sessionId
        });

        const out = { discountToken: String(click.discountToken || ""), discountPct: Number(click.discountPct || 0), discountedPrice: Number(click.discountedPrice || 0) };

        // one attribution per click
        __ssRecoClearRecentClick();
        return out;
    } catch { return null; }
}
/* Override: buyNow forwards selectedOptions */
function buyNow(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "", selectedOptions = null, productIdHint = null) {
    const qtyEl = document.getElementById(`quantity-${__ssGetQtyKey(window.__ssCurrentProductId || productName)}`);
    const quantity = Math.max(1, parseInt(qtyEl?.innerText || "1", 10) || 1);
    if (typeof cart === "object" && cart) cart[productName] = quantity;

    // Ensure we always pass a productId into addToCart so checkout carries productId + reco token.
    let pidHint = String(productIdHint || "").trim();
    if (!pidHint) pidHint = String(window.__ssCurrentProductId || "").trim();
    if (!pidHint) {
        try {
            const p = findProductByNameParam(productName) || null;
            pidHint = String(p?.productId || "").trim();
        } catch { }
    }

    addToCart(productName, productPrice, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption, selectedOptions, pidHint || null);
    try { navigate("GoToCart"); } catch { try { GoToCart(); } catch { } }
}

/* Override: addToCart stores selectedOptions and uses option-combo key */

function addToCart(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "", selectedOptions = null, productIdHint = null) {
    // Prefer explicit productId passed by callers (PDP/recs) to avoid name/link matching failures.
    let productIdForCart = String(productIdHint || "").trim();

    let pRef = findProductByNameParam(productName) || {};
    if (!productIdForCart) productIdForCart = String(pRef.productId || "").trim();

    if (!productIdForCart) {
        const canon = canonicalizeProductLink(productLink || "");
        const found = canon ? __ssGetCatalogFlat().find(pp => canonicalizeProductLink(pp?.productLink || "") === canon) : null;
        if (found) {
            pRef = found;
            productIdForCart = String(found.productId || "").trim();
        }
    }

    if (!productIdForCart) productIdForCart = null;

    let __recoDisc = null;
    try { __recoDisc = __ssRecoMaybeAttributeAddToCart(productIdForCart); } catch { }


    __ssEnsureABUiStyles();
    const __pForAB = (pRef && typeof pRef === "object") ? pRef : { name: productName, description: productDescription, price };
    const displayName = (__ssABGetProductName(__pForAB) || String(productName || "")).trim();
    const displayDescription = (String(productDescription || "").trim())
        ? String(productDescription)
        : (String(__ssABGetProductDescription(__pForAB) || "")).trim();


    const qtyKeyForCart = productIdForCart || productIdHint || window.__ssCurrentProductId || productName;
    const qty = Math.max(
        1,
        (typeof __ssGetQtyValue === "function")
            ? __ssGetQtyValue(qtyKeyForCart)
            : ((typeof cart === "object" && cart && cart[productName]) ? (parseInt(cart[productName], 10) || 1) : 1)
    );
    if (typeof cart === "object" && cart) cart[productName] = 1;
    try { __ssSetQtyValue(qtyKeyForCart, 1); } catch { }

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

    const priceEUR = __ssResolveVariantPriceEUR(pRef, selOpts, selectedOption) || (parseFloat(price) || Number(price) || 0);
    price = priceEUR;

    let __origPriceBeforeReco = price;
    const __pdpRecoApplied = (productIdForCart && window.__ssRecoPdpDiscountAppliedFor && String(window.__ssRecoPdpDiscountAppliedFor) === String(productIdForCart));
    // If discount was applied on PDP (from reco click), ensure we keep the token/pct for cart + checkout
    // even if the recent-click attribution is missing/cleared.
    if (__pdpRecoApplied) {
        try {
            const el = document.getElementById("product-page-price");
            const tok = String(el?.dataset?.recoDiscountToken || "");
            const pct = Number(el?.dataset?.recoDiscountPct || 0);
            const orig = Number(el?.dataset?.eurOriginal || 0);
            if (Number.isFinite(orig) && orig > 0) __origPriceBeforeReco = orig;
            if ((!__recoDisc || !String(__recoDisc.discountToken || "")) && tok && pct > 0) {
                __recoDisc = { discountToken: tok, discountPct: pct, discountedPrice: Number(el?.dataset?.eur || 0) };
            }
        } catch { }
    }


    // If discount was already applied on PDP, the displayed price is the discounted one.


    // Persist that discounted unit price into the basket; keep original for strike-through.


    if (__pdpRecoApplied && __recoDisc && Number(__recoDisc.discountedPrice || 0) > 0) {


        price = Number(__recoDisc.discountedPrice || 0);


    }



    if (__recoDisc && Number(__recoDisc.discountPct || 0) > 0 && String(__recoDisc.discountToken || "")) {
        const pct = Math.max(0, Math.min(80, Number(__recoDisc.discountPct || 0)));
        if (!__pdpRecoApplied) {
            const discounted = Math.round((price * (1 - pct / 100)) * 100) / 100;
            if (Number.isFinite(discounted) && discounted > 0) {
                price = discounted;
            }
        }
    }

    const key = selOpts.length ? `${productName} - ${__ssFormatSelectedOptionsKey(selOpts)}` : (selectedOption ? `${productName} - ${selectedOption}` : productName);

    if (qty > 0) {
        if (basket && basket[key]) {
            basket[key].quantity += qty;
            basket[key].price = price;
            basket[key].displayName = displayName;
            basket[key].displayDescription = displayDescription;
            if (!basket[key].productId && productIdForCart) basket[key].productId = productIdForCart;
            // keep latest selections
            if (selOpts.length) basket[key].selectedOptions = selOpts;
            if (selectedOption) basket[key].selectedOption = selectedOption;
            if (__recoDisc && String(__recoDisc.discountToken || "")) {
                basket[key].recoDiscountToken = String(__recoDisc.discountToken || "");
                basket[key].recoDiscountPct = Number(__recoDisc.discountPct || 0);
                basket[key].unitPriceOriginalEUR = Number(__origPriceBeforeReco);
            }
        } else {
            basket[key] = {
                name: productName,
                displayName,
                displayDescription,
                price,
                image: imageUrl,
                quantity: qty,
                productId: productIdForCart,
                expectedPurchasePrice,
                productLink,
                description: productDescription,
                ...(selectedOption ? { selectedOption } : {}),
                ...(selOpts.length ? { selectedOptions: selOpts } : {}),
                ...((__recoDisc && String(__recoDisc.discountToken || "")) ? { recoDiscountToken: String(__recoDisc.discountToken || ""), recoDiscountPct: Number(__recoDisc.discountPct || 0), unitPriceOriginalEUR: Number(__origPriceBeforeReco) } : {})
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
            sendAnalyticsEvent('add_to_cart', {
                ...payload,
                extra: { ...(payload.extra || {}), viewToken: (typeof __ssCurrentViewToken !== 'undefined' ? __ssCurrentViewToken : null), clickToken: __ssConsumeRecentClickToken(), experiments: (typeof __ssGetExperiments === "function" ? __ssGetExperiments() : null) }
            });
        } catch { }
        const optMsg = selOpts.length ? ` (${__ssFormatSelectedOptionsDisplay(selOpts)})` : (selectedOption ? ` (${selectedOption})` : "");
        __ssNotifyAddToCart({ qty, productName, optMsg, imageUrl, itemKey: key });
    } else {
        alert("Please select at least one item.");
    }
}

/* Override: checkout cart builders include selectedOptions + reco token */
function buildStripeSafeCart(fullCart) {
    try {
        if (typeof window !== 'undefined' && typeof window.__ssBuildStripeSafeCartV2 === 'function') {
            return window.__ssBuildStripeSafeCartV2(fullCart);
        }
    } catch { }
    return (fullCart || []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        productId: i.productId || '',
        price: Number(i.unitPriceEUR || i.price || 0),
        selectedOption: i.selectedOption || '',
        selectedOptions: __ssNormalizeSelectedOptions(i.selectedOptions || []),
        recoDiscountToken: i.recoDiscountToken || ''
    }));
}

function buildFullCartFromBasket() {
    // This is a legacy duplicate that used to strip productId + reco discount metadata.
    // Delegate to the preserved full builder so checkout always has productId + recoDiscountToken.
    try {
        if (typeof window !== "undefined" && typeof window.__ssBuildFullCartFromBasketV2 === "function") {
            return window.__ssBuildFullCartFromBasketV2();
        }
    } catch { }
    return [];
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


/* ===== Cart incentives UI (AOV boosters for one-time buyers) ===== */
function __ssEnsureCartIncentiveStyles() {
    if (document.getElementById("__ssCartIncentiveStyles")) return;
    const s = document.createElement("style");
    s.id = "__ssCartIncentiveStyles";
    s.textContent = `
       
     
        .ss-ci-title{ font-weight:700; font-size: .95rem; }
        .ss-ci-sub{ font-size: .86rem; opacity:.85; }
  .ss-ci-ticks-title{ margin-top:6px; font-size:.78rem; opacity:.75; text-align:center; }
        .ss-ci-bar{ position:relative; width:100%; height:10px; border-radius: 999px; background: rgba(0,0,0,.08); overflow:visible; margin-top:8px; }
        html.dark-mode .ss-ci-bar{ background: rgba(255,255,255,.12); }
        .ss-ci-fill{ position:absolute; inset:0; width:0%; background: var(--Accent, #2563eb); border-radius: 999px; }
        
        .ss-ci-ticks{ position:absolute; inset:0; pointer-events:none; }
        .ss-ci-tick{ position:absolute; top:50%; width:8px; height:8px; border-radius:999px; transform:translate(-50%,-50%); background: rgba(255,255,255,.9); border:1px solid rgba(0,0,0,.18); box-shadow: 0 1px 2px rgba(0,0,0,.12); }
        html.dark-mode .ss-ci-tick{ background: rgba(0,0,0,.35); border-color: rgba(255,255,255,.35); box-shadow: none; }
        .ss-ci-ticklbl{ position:absolute; top: -18px; font-size:.72rem; font-weight:600; opacity:.8; transform:translateX(-50%); white-space:nowrap; }
  .ss-ci-badges{ display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .ss-ci-badge{ padding:6px 10px; border-radius: 999px; font-size:.82rem; border:1px solid rgba(0,0,0,.10); background: rgba(255,255,255,.75); }
        html.dark-mode .ss-ci-badge{ border-color: rgba(255,255,255,.14); background: rgba(0,0,0,.25); }
        
        @media (max-width: 520px){ .ss-ci-addons{ grid-template-columns: 1fr; } }
        .ss-ci-card{ display:flex; gap:10px; align-items:center; padding:10px; border-radius: 14px; border:1px solid rgba(0,0,0,.10); background: rgba(255,255,255,.85); }
        .ss-ci-card, .ss-ci-card *{ color: rgba(0,0,0,.92); }
        html.dark-mode .ss-ci-card, html.dark-mode .ss-ci-card *{ color: rgba(255,255,255,.92); }
        html.dark-mode .ss-ci-card{ border-color: rgba(255,255,255,.14); background: rgba(0,0,0,.25); }
        .ss-ci-img{ width:44px; height:44px; border-radius: 10px; object-fit:cover; flex:0 0 auto; background: rgba(0,0,0,.05); }
        .ss-ci-name{ font-weight:650; font-size:.9rem; line-height:1.15; }
        .ss-ci-price{ font-size:.86rem; opacity:.85; }
        .ss-ci-btn{ margin-left:auto; padding:8px 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,.12); background: rgba(0,0,0,.03); cursor:pointer; font-weight:650; }
        html.dark-mode .ss-ci-btn{ border-color: rgba(255,255,255,.16); background: rgba(255,255,255,.06); color: inherit; }
        .ss-ci-btn:hover{ filter: brightness(1.02); }
      `;
    document.head.appendChild(s);
}



// --- Smart recommendations (cart/checkout) ---
let __ssSmartCartRecoCache = { sig: "", desired: 0, token: "", items: [] };
let __ssSmartRecoRerenderTimer = null;

// Prevent cart UI freeze from re-entrant updateBasket() loops and async smart-reco refreshes.
let __ssBasketRenderInProgress = false;
let __ssBasketNeedsRerender = false;
let __ssBasketRerenderQueued = false;
function __ssRequestBasketRerender(reason) {
    try {
        if (__ssBasketRenderInProgress) { __ssBasketNeedsRerender = true; return; }
        if (__ssBasketRerenderQueued) return;
        __ssBasketRerenderQueued = true;
        setTimeout(() => {
            __ssBasketRerenderQueued = false;
            try { if (typeof updateBasket === 'function') updateBasket(); } catch (e) { }
        }, 0);
    } catch (e) { }
}


function __ssCartSigForSmartReco() {
    try {
        const names = Object.values(basket || {}).map(i => String(i?.name || "").trim()).filter(Boolean).sort();
        return btoa(unescape(encodeURIComponent(names.join("|")))).slice(0, 64);
    } catch { return ""; }
}

async function __ssFetchSmartCartRecs({ desiredEUR = 0, limit = 4 } = {}) {
    try {
        const sig = __ssCartSigForSmartReco();
        const desired = Math.max(0, Number(desiredEUR || 0) || 0);
        const desiredKey = Math.round(desired * 100) / 100;

        if (__ssSmartCartRecoCache.sig === sig && Math.abs((__ssSmartCartRecoCache.desired || 0) - desiredKey) < 0.01 && Array.isArray(__ssSmartCartRecoCache.items) && __ssSmartCartRecoCache.items.length) {
            return __ssSmartCartRecoCache;
        }

        const cartItems = Object.values(basket || {}).map(i => ({ name: String(i?.name || "").trim() })).filter(x => x.name);

        const body = {
            placement: "cart_topup_v1",
            sessionId: String(window.__ssSessionId || ""),
            cartItems,
            desiredEUR: desired,
            limit: Math.max(1, Math.min(12, Number(limit || 4) || 4)),
            context: {
                lang: String(window.currentLanguage || ""),
                device: (window.innerWidth <= 700 ? "mobile" : "desktop"),
                page: "cart",
                strictMaxPrice: true,
                optimization: "profit_popular",
                profitTieEUR: 0.05,
                enableRecoDiscounts: true
            }
        };

        const resp = await fetch(`${API_BASE}/smart-reco/get`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            credentials: "include"
        });

        const data = await resp.json().catch(() => null);
        if (!data || !data.ok || !Array.isArray(data.items)) return null;

        __ssSmartCartRecoCache = { sig, desired: desiredKey, token: String(data.token || ""), items: data.items || [] };
        return __ssSmartCartRecoCache;
    } catch {
        return null;
    }
}

function __ssEnsureSmartCartRecs({ desiredEUR = 0, limit = 4 } = {}) {
    // Avoid infinite updateBasket() loops:
    // updateBasket() -> incentives render -> __ssEnsureSmartCartRecs() -> (cache-hit) updateBasket() ...
    try {
        const sig = __ssCartSigForSmartReco();
        const desired = Math.max(0, Number(desiredEUR || 0) || 0);
        const desiredKey = Math.round(desired * 100) / 100;

        const cacheValid =
            __ssSmartCartRecoCache &&
            __ssSmartCartRecoCache.sig === sig &&
            Math.abs((__ssSmartCartRecoCache.desired || 0) - desiredKey) < 0.01 &&
            Array.isArray(__ssSmartCartRecoCache.items) &&
            __ssSmartCartRecoCache.items.length;

        if (cacheValid) return;

        const sigBefore = sig;
        __ssFetchSmartCartRecs({ desiredEUR, limit }).then((cache) => {
            if (!cache) return;
            const sigAfter = __ssCartSigForSmartReco();
            if (sigBefore !== sigAfter) return;

            // Debounce re-render to avoid stutter while user is clicking +/- quickly.
            try { if (__ssSmartRecoRerenderTimer) clearTimeout(__ssSmartRecoRerenderTimer); } catch { }
            __ssSmartRecoRerenderTimer = setTimeout(() => {
                try {
                    const sigNow = __ssCartSigForSmartReco();
                    if (sigNow !== sigBefore) return;
                    __ssRequestBasketRerender("smart-reco");
                } catch { }
            }, 180);
        }).catch(() => { });
    } catch { }
}


async function __ssSmartRecoEvent(type, itemKey) {
    try {
        const token = String(__ssSmartCartRecoCache?.token || "").trim();
        if (!token) return;
        await fetch(`${API_BASE}/smart-reco/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, token, itemKey, sessionId: String(window.__ssSessionId || "") }),
            credentials: "include"
        });
    } catch { }
}
// Profit-optimized contribution-ranked products (best sellers, but by contribution)
// Used as a fallback candidate pool for add-ons when enabled by feature flags.
let __ssContributionCache = { at: 0, items: null };
function __ssEnsureContributionProducts() {
    try {
        const flags = (typeof __ssGetFeatureFlags === "function") ? __ssGetFeatureFlags() : null;
        const enabled = !flags || __ssFlagEnabled("contributionRanking.enabled", true);
        if (!enabled) return;

        const now = Date.now();
        if (__ssContributionCache.items && (now - (__ssContributionCache.at || 0)) < 10 * 60 * 1000) return;

        __ssContributionCache.at = now;
        fetch(`${API_BASE}/products/contribution?limit=40`, { credentials: "include" })
            .then(r => r.json().catch(() => null))
            .then(d => {
                // Only accept contribution feed if it has enough renderable items.
                // Otherwise we'd replace the local catalog pool and cart add-ons would vanish.
                if (!(d && d.ok && Array.isArray(d.items))) return;

                const items = d.items;
                let okCount = 0;
                for (const x of items) {
                    const name = String(x?.name || "").trim();
                    const price = Number(x?.price || 0) || 0;
                    const img = String(x?.image || x?.imageUrl || (Array.isArray(x?.images) ? x.images[0] : "") || "").trim();
                    if (name && price > 0 && img) okCount++;
                    if (okCount >= 8) break;
                }

                if (okCount >= 8) {
                    __ssContributionCache.items = items;
                    // Invalidate pool cache so it can rebuild from contribution feed.
                    try { __ssAddonPoolSortedCache = { src: "", ref: null, len: 0, sorted: [] }; } catch { }
                }
            })
            .catch(() => { });
    } catch { }
}


// --- Cart add-on picker performance helpers ---
// Cache a price-sorted pool so we don't sort the whole catalog on every basket update.
let __ssAddonPoolSortedCache = { src: "", ref: null, len: 0, sorted: [] };

function __ssLowerBoundByPrice(arr, price) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if ((arr[mid]?.price || 0) < price) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

function __ssGetAddonPoolSorted() {
    __ssEnsureContributionProducts();
    const useContrib = (Array.isArray(__ssContributionCache.items) && __ssContributionCache.items.length);
    const src = useContrib ? "contrib" : "catalog";
    const ref = useContrib ? __ssContributionCache.items : null;
    const len = useContrib ? __ssContributionCache.items.length : 0;

    // Contribution feed: cache based on array identity+length.
    if (src === "contrib" &&
        __ssAddonPoolSortedCache.src === src &&
        __ssAddonPoolSortedCache.ref === ref &&
        __ssAddonPoolSortedCache.len === len &&
        Array.isArray(__ssAddonPoolSortedCache.sorted) &&
        __ssAddonPoolSortedCache.sorted.length) {
        return __ssAddonPoolSortedCache.sorted;
    }

    // Local catalog: cache once per session (catalog is static during runtime).
    if (src === "catalog" &&
        __ssAddonPoolSortedCache.src === src &&
        Array.isArray(__ssAddonPoolSortedCache.sorted) &&
        __ssAddonPoolSortedCache.sorted.length) {
        return __ssAddonPoolSortedCache.sorted;
    }

    const raw = useContrib
        ? __ssContributionCache.items.map(x => ({
            key: String(x.itemKey || x.productId || x.id || x.productLink || x.name || "").trim(),
            name: String(x.name || "").trim(),
            price: Number(x.price || 0) || 0,
            image: String(x.image || x.imageUrl || (Array.isArray(x.images) ? x.images[0] : "") || "").trim(),
            productLink: String(x.productLink || x.url || x.link || "").trim(),
            description: String(x.description || x.desc || "").trim()
        }))
        : (__ssGetCatalogFlat ? __ssGetCatalogFlat() : []);

    const seen = new Set();
    const cleaned = [];
    for (const p of raw) {
        const k = String(p?.key || p?.productId || p?.id || p?.productLink || p?.name || "").trim();
        if (!k || seen.has(k)) continue;
        seen.add(k);

        const obj = {
            key: k,
            name: String(p?.name || "").trim(),
            price: Number(p?.price || 0) || 0,
            image: String(p?.image || "").trim(),
            productLink: String(p?.productLink || "").trim(),
            description: String(p?.description || "").trim()
        };
        if (!obj.name || !(obj.price > 0) || !obj.image) continue;
        cleaned.push(obj);
    }

    cleaned.sort((a, b) => (a.price - b.price));

    __ssAddonPoolSortedCache = { src, ref: src === "contrib" ? ref : null, len: src === "contrib" ? len : 0, sorted: cleaned };
    return cleaned;
}

function __ssCartPickAddonProducts({ desiredEUR, limit = 4 } = {}) {
    const desired = Math.max(0, Number(desiredEUR || 0) || 0);
    const maxN = Math.max(0, Number(limit || 4) || 4);

    const basketNames = new Set(Object.values(basket || {}).map(i => String(i?.name || "").trim()).filter(Boolean));

    // 1) Start with smart server-learned recommendations (if present), but DO NOT allow them to reduce slots.
    let smart = [];
    try {
        const sig = __ssCartSigForSmartReco();
        const desiredKey = Math.round(desired * 100) / 100;

        if (__ssSmartCartRecoCache &&
            __ssSmartCartRecoCache.sig === sig &&
            Math.abs((__ssSmartCartRecoCache.desired || 0) - desiredKey) < 0.01 &&
            Array.isArray(__ssSmartCartRecoCache.items) &&
            __ssSmartCartRecoCache.items.length) {

            const seenSmart = new Set();
            smart = __ssSmartCartRecoCache.items
                .map(it => __ssNormalizeRecoItem(it) || it)
                .map(x => ({
                    key: String(x?.key || x?.itemKey || x?.productId || x?.id || x?.productLink || x?.name || "").trim(),
                    name: String(x?.name || x?.title || x?.productName || "").trim(),
                    price: Number(x?.price || x?.priceEUR || x?.eurPrice || 0) || 0,
                    image: String(x?.image || x?.imageUrl || (Array.isArray(x?.images) ? x.images[0] : "") || "").trim(),
                    productLink: String(x?.productLink || x?.url || x?.link || "").trim(),
                    description: String(x?.description || x?.desc || "").trim()
                }))
                // must be renderable; otherwise smart can overwrite good fallback with blanks
                .filter(x => x && x.key && x.name && (Number(x.price) > 0) && x.image && !basketNames.has(x.name))
                .filter(x => {
                    if (seenSmart.has(x.key)) return false;
                    seenSmart.add(x.key);
                    return true;
                })
                .slice(0, maxN);
        }
    } catch { /* ignore */ }

    const cfg = __ssGetCartIncentivesConfig();
    const top = cfg?.topup || {};
    const pct = Math.max(0, Math.min(200, Number(top?.maxPriceDeltaPct || 25) || 25));
    const maxPrice = desired > 0 ? desired * (1 + (pct / 100)) : Infinity;

    // 2) Merge: keep smart items, then fill remaining slots with fallback items (deduped).
    const out = [];
    const seen = new Set();

    for (const s of smart) {
        const k = String(s.key || "").trim();
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(s);
        if (out.length >= maxN) return out;
    }

    const pool = __ssGetAddonPoolSorted();

    // 3) Efficient pick: binary search into price-sorted pool and expand outward.
    if (!(desired > 0)) {
        // If no top-up target, show cheapest valid items.
        for (const p of pool) {
            if (out.length >= maxN) break;
            if (!p || !p.key || seen.has(p.key) || basketNames.has(p.name)) continue;
            seen.add(p.key);
            out.push(p);
        }
        return out;
    }

    const idx = __ssLowerBoundByPrice(pool, desired);
    let l = idx - 1;
    let r = idx;

    while (out.length < maxN && (l >= 0 || r < pool.length)) {
        const left = (l >= 0) ? pool[l] : null;
        const right = (r < pool.length) ? pool[r] : null;

        const dl = left ? Math.abs((left.price || 0) - desired) : Infinity;
        const dr = right ? Math.abs((right.price || 0) - desired) : Infinity;

        const takeLeft = dl <= dr;
        const cand = takeLeft ? left : right;

        if (takeLeft) l--; else r++;

        if (!cand || !cand.key || seen.has(cand.key) || basketNames.has(cand.name)) continue;
        if (cand.price > Math.max(30, maxPrice)) continue;

        seen.add(cand.key);
        out.push(cand);
    }

    return out;
}
function __ssRenderCartIncentivesHTML(totalSumEUR, opts = {}) {
    try {
        const cfg0 = __ssGetCartIncentivesConfig();
        if (!cfg0?.enabled) return "";
        __ssEnsureCartIncentiveStyles();

        const fullCart = (opts && Array.isArray(opts.fullCart)) ? opts.fullCart : (__ssGetFullCartPreferred());
        const inc = (opts && opts.inc) ? opts.inc : __ssComputeCartIncentivesClient(totalSumEUR, fullCart);

        const cfg = __ssGetCartIncentivesConfig();
        const tiers = (cfg?.tierDiscount?.enabled && Array.isArray(cfg?.tierDiscount?.tiers)) ? cfg.tierDiscount.tiers : [];
        const base = Number(inc.baseTotalEUR || totalSumEUR) || 0;

        let nextTier = null;
        let currentTierPct = Number(inc.tierPct || 0) || 0;
        for (const t of tiers) {
            const min = Math.max(0, Number(t?.minEUR || 0) || 0);
            const pct = Math.max(0, Number(t?.pct || 0) || 0);
            if (min > base && pct > 0) { nextTier = { min, pct }; break; }
        }

        const tierText = nextTier
            ? (() => {
                const needEUR = Math.max(0, (nextTier.min - base));
                // Amount is rendered as a data-eur fragment so currency+tariff conversion stays correct.
                return `Add <span class="ss-ci-amt" data-eur="${needEUR.toFixed(2)}" data-ci-min-eur="${nextTier.min.toFixed(2)}" data-ci-base-eur="${base.toFixed(2)}">${needEUR.toFixed(2)}€</span> to unlock ${nextTier.pct}% OFF`;
            })()
            : (currentTierPct > 0 ? `Unlocked ${currentTierPct}% OFF` : `Add more to unlock a discount`);

        const tierProgress = nextTier ? Math.max(0, Math.min(100, (base / nextTier.min) * 100)) : 100;

        const tierScaleMax = (() => {
            const mins = tiers.map(t => Math.max(0, Number(t?.minEUR || 0) || 0)).filter(v => v > 0);
            const max = mins.length ? Math.max(...mins) : (nextTier ? nextTier.min : 0);
            return max > 0 ? max : (base > 0 ? base : 1);
        })();

        const tierProgressGlobal = Math.max(0, Math.min(100, (base / tierScaleMax) * 100));

        const tierTicksHTML = (() => {
            if (!tiers.length) return "";
            const parts = [];
            for (const t of tiers) {
                const min = Math.max(0, Number(t?.minEUR || 0) || 0);
                const pct = Math.max(0, Number(t?.pct || 0) || 0);
                if (!min || !pct) continue;
                const left = Math.max(0, Math.min(100, (min / tierScaleMax) * 100));
                parts.push(`<span class="ss-ci-tick" style="left:${left.toFixed(2)}%"></span>`);
                parts.push(`<span class="ss-ci-ticklbl" style="left:${left.toFixed(2)}%">${pct}%</span>`);
            }
            return parts.length ? `<div class="ss-ci-ticks">${parts.join("")}</div>` : "";
        })();

        // Optional free shipping progress
        const shipCfg = cfg?.freeShipping || {};
        const shipEnabled = !!shipCfg?.enabled && Number(shipCfg?.shippingFeeEUR || 0) > 0 && Number(shipCfg?.thresholdEUR || 0) > 0;
        const shipThr = Math.max(0, Number(shipCfg?.thresholdEUR || 0) || 0);
        const shipProg = shipEnabled ? Math.max(0, Math.min(100, (base / shipThr) * 100)) : 0;
        const shipText = shipEnabled
            ? (base >= shipThr ? "Free shipping unlocked" : (() => {
                const needEUR = Math.max(0, (shipThr - base));
                return `Add <span class="ss-ci-amt" data-eur="${needEUR.toFixed(2)}" data-ci-min-eur="${shipThr.toFixed(2)}" data-ci-base-eur="${base.toFixed(2)}">${needEUR.toFixed(2)}€</span> for free shipping`;
            })())
            : "";

        // Add-ons: aim at next tier, otherwise small add-ons
        const desired = nextTier ? Math.max(3, nextTier.min - base) : 0;
        const topCfg = (cfg?.topup && typeof cfg.topup === "object") ? cfg.topup : { maxItems: 4, maxPriceDeltaPct: 25 };
        const maxItems = Math.max(0, Math.min(12, Number(topCfg.maxItems || 4) || 4));
        __ssEnsureSmartCartRecs({ desiredEUR: desired, limit: maxItems });
        const addons = __ssCartPickAddonProducts({ desiredEUR: desired, limit: maxItems });

        const badges = [];
        if (Number(inc.tierDiscountEUR || 0) > 0) {
            const eur = Number(inc.tierDiscountEUR) || 0;
            badges.push({ kind: "saved", eur });
        }
        if (Number(inc.bundleDiscountEUR || 0) > 0) {
            const eur = Number(inc.bundleDiscountEUR) || 0;
            badges.push({ kind: "bundle", eur });
        }
        if (shipEnabled && base >= shipThr) badges.push({ kind: "text", text: "Free shipping" });

        const addonHTML = addons.length ? `
            <div class="ss-ci-sub" style="margin-top:10px;">Frequently added with your items:</div>
            <div class="ss-ci-addons">
              ${addons.map(p => {
            const price = Number(p?.price || 0) || 0;
            const hasDisc = (Number(p?.discountPct || 0) > 0 && Number(p?.discountedPrice || 0) > 0 && Number(p?.discountedPrice || 0) < price);
            const eur = hasDisc ? Number(p.discountedPrice || 0) : price;
            const eurOrig = hasDisc ? price : null;
            const pct = hasDisc ? Number(p.discountPct || 0) : 0;
            const nameEnc = encodeURIComponent(String(p?.name || ""));
            const recoQ = hasDisc && String(p?.discountToken || "") ? `&reco=${encodeURIComponent(String(p.discountToken))}` : "";
            const href = `https://www.snagletshop.com/?product=${nameEnc}${recoQ}`;

            // Store discount token in durable store so PDP can apply on refresh/new tab
            if (hasDisc && String(p?.discountToken || "")) {
                try { __ssRecoDiscountStorePut(String(p.discountToken), { productId: __ssIdNorm(p?.productId || ""), discountPct: pct, discountedPrice: eur }); } catch { }
            }

            return `
                    <div class="ss-ci-card" data-ss-addon-pid="${__ssEscHtml(String(p?.productId || ""))}" data-ss-addon-token="${__ssEscHtml(String(p?.discountToken || ""))}">
                      <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:block;">
                        <img class="ss-ci-img" src="${__ssEscHtml(p?.image || "")}" alt="${__ssEscHtml(p?.name || "")}">
                      </a>
                      <div style="min-width:0;">
                        <a href="${href}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;">
                          <div class="ss-ci-name">${__ssEscHtml(p?.name || "")}</div>
                        </a>
                        ${hasDisc
                    ? `<div class="ss-ci-price basket-item-price" data-eur="${eur.toFixed(2)}" data-eur-original="${eurOrig.toFixed(2)}" data-discount-pct="${pct}">${eur.toFixed(2)}€</div>`
                    : `<div class="ss-ci-price basket-item-price" data-eur="${eur.toFixed(2)}">${eur.toFixed(2)}€</div>`}
                      </div>
                      <button class="ss-ci-btn" type="button"
                              data-ss-quickadd="${__ssEscHtml(p?.name || "")}"
                              data-ss-quickadd-pid="${__ssEscHtml(String(p?.productId || ""))}"
                              data-ss-quickadd-token="${__ssEscHtml(String(p?.discountToken || ""))}"
                              data-ss-quickadd-pct="${__ssEscHtml(String(p?.discountPct || ""))}"
                              data-ss-quickadd-orig="${__ssEscHtml(String(price))}"
                              data-ss-quickadd-disc="${__ssEscHtml(String(p?.discountedPrice || ""))}"
                        >Add</button>
                    </div>
                  `;
        }).join("")}
            </div>
          ` : "";

        return `
            <div class="ss-cart-inc" id="ss-cart-inc">
       
           
              <div class="ss-ci-bar" aria-hidden="true"><div class="ss-ci-fill" style="width:${tierProgressGlobal.toFixed(0)}%"></div>${tierTicksHTML}</div>
              ${shipEnabled ? `<div class="ss-ci-bar" aria-hidden="true" style="margin-top:8px;"><div class="ss-ci-fill" style="width:${shipProg.toFixed(0)}%"></div></div>` : ``}
               <div class= "Badges_Div">
                ${badges.length ? `<div class="ss-ci-badges">${badges.map(b => {
            if (b && b.kind === "saved") {
                const eur = Number(b.eur || 0) || 0;
                return `<span class="ss-ci-badge" data-badge-kind="saved" data-eur="${eur.toFixed(2)}">Saved ${eur.toFixed(2)}€</span>`;
            }
            if (b && b.kind === "bundle") {
                const eur = Number(b.eur || 0) || 0;
                return `<span class="ss-ci-badge" data-badge-kind="bundle" data-eur="${eur.toFixed(2)}">Bundle -${eur.toFixed(2)}€</span>`;
            }
            const txt = String(b?.text || "");
            return `<span class="ss-ci-badge">${__ssEscHtml(txt)}</span>`;
        }).join("")}</div>` : ``}
                  <div class="ss-ci-title">${tierText}</div>
                  ${shipEnabled ? `<div class="ss-ci-sub">${shipText}</div>` : ``}
                </div>
             
              ${addonHTML}
            </div>
          `;
    } catch {
        return "";
    }
}

function __ssBindCartIncentives(rootEl) {
    const root = rootEl || document;
    if (!root || root.__ssCartIncBound) return;
    root.__ssCartIncBound = true;

    root.addEventListener("click", (e) => {
        const btn = e.target?.closest?.("[data-ss-quickadd]");
        if (!btn) return;
        e.preventDefault();
        const name = String(btn.getAttribute("data-ss-quickadd") || "").trim();
        if (!name) return;

        const p = __ssGetCatalogFlat().find(pp => String(pp?.name || "").trim() === name);
        if (!p) return;

        const groups = __ssExtractOptionGroups(p);
        const sel = __ssDefaultSelectedOptions(groups);
        __ssSmartRecoEvent("add_to_cart", String(p.productId || p.name || name));

        // If this add-on card has a reco discount token, attribute it so addToCart stores it in the basket
        try {
            const tok = String(btn.getAttribute("data-ss-quickadd-token") || "").trim();
            const pct = Number(btn.getAttribute("data-ss-quickadd-pct") || 0) || 0;
            const orig = Number(btn.getAttribute("data-ss-quickadd-orig") || 0) || 0;
            const disc = Number(btn.getAttribute("data-ss-quickadd-disc") || 0) || 0;
            if (tok && pct > 0 && disc > 0) {
                __ssRecoSaveRecentClick({
                    widgetId: "smart_cart_addons_v1",
                    token: String(__ssSmartCartRecoCache?.token || ""),
                    sessionId: String(window.__ssSessionId || ""),
                    sourceProductId: String(recState?.sourceProductId || ""),
                    targetProductId: String(p.productId || ""),
                    position: 0,
                    discountToken: tok,
                    discountPct: pct,
                    originalPrice: (orig > 0 ? orig : Number(p.price || 0) || 0),
                    discountedPrice: disc,
                    productId: String(p.productId || "")
                });
            }
        } catch { }

        addToCart(p.name, Number(p.price || 0) || 0, p.image || "", p.expectedPurchasePrice || 0, p.productLink || "", p.description || "", "", sel, (p.productId || null));

        try { updateBasket(); } catch { }
    }, { passive: false });
}


async function __ssValidateRecoDiscountsInBasketBestEffort(entries) {
    try {
        const toks = [];
        const byTok = new Map();
        for (const [k, it] of (entries || [])) {
            const tok = String(it?.recoDiscountToken || "").trim();
            if (!tok) continue;
            const pid = String(it?.productId || "").trim();
            toks.push({ token: tok, productId: pid });
            byTok.set(tok, { key: k, item: it });
        }
        if (!toks.length) return;

        const resp = await fetch(`${API_BASE}/recs/quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: toks }),
            credentials: "include"
        });
        const data = await resp.json().catch(() => null);
        if (!data || !data.ok || !Array.isArray(data.quotes)) return;

        let changed = false;
        for (const q of data.quotes) {
            const tok = String(q?.token || "").trim();
            if (!tok) continue;
            const ref = byTok.get(tok);
            if (!ref) continue;

            if (!q.valid) {
                // Expired/invalid => revert the unit price if we stored original
                const it = ref.item;
                const orig = Number(it?.unitPriceOriginalEUR || 0) || 0;
                if (orig > 0 && Number(it?.price || 0) > 0 && Number(it?.price || 0) < orig) {
                    it.price = orig;
                    delete it.recoDiscountToken;
                    delete it.recoDiscountPct;
                    delete it.unitPriceOriginalEUR;
                    changed = true;
                }
                continue;
            }

            // Valid => ensure pct is synced (helps UI conversion)
            try {
                if (ref.item) ref.item.recoDiscountPct = Number(q.discountPct || ref.item.recoDiscountPct || 0) || 0;
            } catch { }

            // Store for PDP refresh support
            try {
                __ssRecoDiscountStorePut(tok, { productId: __ssIdNorm(q.productId || ref.item?.productId || ""), discountPct: Number(q.discountPct || 0), discountedPrice: Number(q.discountedPrice || 0) });
            } catch { }
        }

        if (changed) {
            try {
                if (typeof persistBasket === "function") persistBasket("reco_quote");
                else localStorage.setItem("basket", JSON.stringify(basket));
            } catch { }
            try { __ssRequestBasketRerender("reco-quote"); } catch { try { updateBasket(); } catch { } }
        }
    } catch { }
}

/* Override: basket rendering escapes user/product strings and shows multi-options */
function updateBasket() {
    let __ssInc = null;
    let __fullCart = [];

    // Preserve scroll position across re-renders.
    // On mobile, async re-renders (smart-reco / quote refresh) can otherwise snap the user back to top.
    let __ssPrevWinY = 0;
    let __ssPrevContainerY = 0;
    let __ssHasContainerScroll = false;
    try {
        __ssPrevWinY = (typeof window.scrollY === 'number') ? window.scrollY : (document.documentElement.scrollTop || 0);
    } catch { }


    // Guard against re-entrant / repeated basket renders that can freeze the UI
    if (window.__ssUpdatingBasket) return;
    window.__ssUpdatingBasket = true;
    __ssBasketRenderInProgress = true;
    try {
        let basketContainer = document.getElementById("Basket_Viewer");

        // IMPORTANT:
        // updateBasket() can be triggered by storage/broadcast updates even when the user is NOT on the Cart view.
        // In that case we must NOT auto-create the Basket_Viewer container, otherwise it will be appended into #Viewer
        // and will overwrite/destroy other pages (e.g., Settings UI).
        if (!basketContainer) {
            return;
        }

        try {
            __ssPrevContainerY = Number(basketContainer.scrollTop || 0) || 0;
            const st = window.getComputedStyle ? getComputedStyle(basketContainer) : null;
            const oy = String(st?.overflowY || '').toLowerCase();
            __ssHasContainerScroll = (oy === 'auto' || oy === 'scroll');
        } catch { }

        basketContainer.innerHTML = "";

        // Ensure option chips + layout overrides are available
        try { __ssEnsureOptionChipStyles(); } catch { }

        if (!basket || Object.keys(basket).length === 0) {
            basketContainer.innerHTML = `<p class='EmptyBasketMessage'>${__ssEscHtml(TEXTS?.BASKET?.EMPTY || "The basket is empty!")}</p>`;
            return;
        }

        // -------- Base total (uses current basket unit prices, which may already include reco discounts) --------
        const entries = Object.entries(basket);
        try { __ssValidateRecoDiscountsInBasketBestEffort(entries); } catch { }

        let totalSum = 0;
        for (const [, item] of entries) {
            const unit = Number(parseFloat(item?.price) || 0);
            const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);
            totalSum += (unit * qty);
        }

        // -------- Cart incentives (tier/bundle/free shipping) --------
        let __ssInc = null;
        let __ssTotalAfter = round2(totalSum);
        let __ssDiscountEUR = 0;
        try {
            __fullCart = __ssGetFullCartPreferred();
            __ssInc = __ssComputeCartIncentivesClient(totalSum, __fullCart);
            __ssTotalAfter = round2(Number(__ssInc?.subtotalAfterDiscountsEUR ?? totalSum) || totalSum);
            __ssDiscountEUR = round2((Number(__ssInc?.tierDiscountEUR || 0) || 0) + (Number(__ssInc?.bundleDiscountEUR || 0) || 0));
            window.__ssLastCartIncentives = __ssInc;
            try { localStorage.setItem("ss_cart_incentives_last_v1", JSON.stringify({ t: Date.now(), inc: __ssInc })); } catch { }
        } catch { }


        // Apply cart-level discounts for display:
        // We must support: "bundle applies to all lines" and "tier applies only to eligible lines"
        // WITHOUT breaking rounding, and WITHOUT relying on a single global ratio.
        const __incCfg = __ssGetCartIncentivesConfig();
        const __applyToDiscounted = (
            (__incCfg?.applyToDiscountedItems === true) ||
            (__incCfg?.tierDiscount?.applyToDiscountedItems === true)
        );

        const __tierPct = Math.max(0, Math.min(80, Number(__ssInc?.tierPct || 0) || 0));
        const __bundlePct = Math.max(0, Math.min(80, Number(__ssInc?.bundlePct || 0) || 0));

        const __isDiscountedCartItem = (it) => {
            try {
                const __pid = String(it?.productId || it?.pid || it?.id || '').trim();
                if (__pid) {
                    const m = (typeof window !== 'undefined') ? window.__ssTierDiscMap : null;
                    if (m && m[__pid] === true) return true;
                }
                const recoPct = Number(it?.recoDiscountPct || 0) || 0;
                const hasTok = !!it?.recoDiscountToken;

                // Explicit original/current price fields (preferred)
                const u0 = __ssParsePriceEUR(it?.unitPriceOriginalEUR ?? it?.unitPriceOriginalEur ?? it?.originalUnitPriceEUR ?? it?.compareAtPriceEUR ?? NaN);
                const u1 = __ssParsePriceEUR(it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? NaN);
                const looksDiscounted = (Number.isFinite(u0) && Number.isFinite(u1) && u0 > u1 + 1e-9);

                // If we only have a reco token (basket rows often drop recoPct/original),
                // try to infer discount by comparing against the catalog/base price.
                let looksDiscountedCatalog = false;
                if (hasTok && !looksDiscounted && !(recoPct > 0) && Number.isFinite(u1) && u1 > 0) {
                    const pid = String(it?.productId || it?.pid || it?.id || '').trim();
                    const sel = String(it?.category || it?.variant || it?.selectedCategory || it?.selectedVariant || it?.option || '').trim();

                    const flat = window.__ssCatalogIndexCache?.flat || window.__ssCatalogIndexCache?.flat?.flat || null;
                    const arr = Array.isArray(flat) ? flat : (Array.isArray(window.__ssCatalogIndexCache?.flat) ? window.__ssCatalogIndexCache.flat : null);

                    let baseUnit = NaN;
                    if (arr && pid) {
                        const p = arr.find(x => String(x?.productId || x?.pid || x?.id || '') === pid);
                        if (p) {
                            // product base price
                            baseUnit = __ssParsePriceEUR(p?.priceEUR ?? p?.priceEur ?? p?.price ?? NaN);

                            // category/variant override if selectable and we can match
                            const cats = p?.categories || p?.variants || p?.options;
                            if (Array.isArray(cats) && sel) {
                                const hit = cats.find(c =>
                                    String(c?.name || c?.label || c?.title || '').trim().toLowerCase() === sel.toLowerCase()
                                );
                                if (hit) {
                                    const v = __ssParsePriceEUR(hit?.priceEUR ?? hit?.priceEur ?? hit?.price ?? hit?.value ?? NaN);
                                    if (Number.isFinite(v) && v > 0) baseUnit = v;
                                }
                            }
                        }
                    }
                    if (Number.isFinite(baseUnit) && baseUnit > u1 + 1e-9) looksDiscountedCatalog = true;
                }

                return (recoPct > 0) || looksDiscounted || looksDiscountedCatalog;
            } catch { return false; }
        };

        // --- Precise per-line totals in cents (prevents "last item not discounted" due to rounding drift) ---
        function __ssToCents(v) {
            const n = Number(v);
            if (!Number.isFinite(n)) return 0;
            return Math.round(n * 100);
        }
        function __ssFromCents(c) {
            return round2((Number(c) || 0) / 100);
        }
        function __ssAllocateProportional(totalCents, weights) {
            // weights: array of non-negative integers
            const out = new Array(weights.length).fill(0);
            const sumW = weights.reduce((a, b) => a + (Number(b) || 0), 0);

            if (!(totalCents > 0) || !(sumW > 0)) return out;

            // Largest remainder method
            let used = 0;
            const rema = [];

            for (let i = 0; i < weights.length; i++) {
                const w = Math.max(0, Number(weights[i]) || 0);

                if (!w) {
                    out[i] = 0;
                    rema.push({ i, frac: 0 });
                    continue;
                }

                const raw = (totalCents * w) / sumW;
                const base = Math.floor(raw);

                out[i] = base;
                used += base;
                rema.push({ i, frac: raw - base });
            }

            let left = totalCents - used;

            if (left > 0) {
                rema.sort((a, b) => b.frac - a.frac);

                for (let k = 0; k < rema.length && left > 0; k++) {
                    const idx = rema[k].i;
                    out[idx] += 1;
                    left -= 1;
                }
            }

            return out;
        }

        // Build arrays aligned to entries order
        const __cartLines = entries.map(([k, it]) => {
            const qty = Math.max(1, parseInt(it?.quantity || 1, 10) || 1);
            const unit = Number(parseFloat(it?.price) || 0);
            const preCents = __ssToCents(unit) * qty;
            const isDisc = __isDiscountedCartItem(it);
            const eligibleTier = __applyToDiscounted ? true : !isDisc;
            return { key: k, it, qty, unit, preCents, isDisc, eligibleTier };
        });

        // Prefer server-computed totals (avoids drift if backend rounds differently)
        const __bundleDiscountCents = Math.max(0, __ssToCents(__ssInc?.bundleDiscountEUR || 0));
        const __tierDiscountCents = Math.max(0, __ssToCents(__ssInc?.tierDiscountEUR || 0));

        // Allocate bundle discount across ALL lines proportional to preCents
        const __bundleAlloc = __ssAllocateProportional(__bundleDiscountCents, __cartLines.map(x => x.preCents));
        const __postBundleCents = __cartLines.map((x, i) => Math.max(0, x.preCents - (__bundleAlloc[i] || 0)));

        // Allocate tier discount ONLY across eligible lines proportional to postBundleCents
        const __eligibleWeights = __cartLines.map((x, i) => (x.eligibleTier ? (__postBundleCents[i] || 0) : 0));
        const __tierAlloc = __ssAllocateProportional(__tierDiscountCents, __eligibleWeights);

        // Final per-line after totals in cents
        const __lineAfterCents = __cartLines.map((x, i) => Math.max(0, (__postBundleCents[i] || 0) - (__tierAlloc[i] || 0)));
        const __lineAfter = __lineAfterCents.map(__ssFromCents);

        // Debug (enable via: localStorage.setItem('ss_debug_tier','1'))
        try {
            const dbg = (localStorage.getItem('ss_debug_tier') === '1') || (window.__SS_DEBUG_TIER === 1);
            if (dbg) {
                const sumPre = __cartLines.reduce((a, x) => a + (x.preCents || 0), 0);
                const sumAfter = __lineAfterCents.reduce((a, c) => a + (c || 0), 0);
                console.log("[tier][dbg] pct", { tierPct: __tierPct, bundlePct: __bundlePct, applyToDiscounted: __applyToDiscounted });
                console.log("[tier][dbg] totals", {
                    sumPre: __ssFromCents(sumPre),
                    bundleDiscount: __ssFromCents(__bundleDiscountCents),
                    tierDiscount: __ssFromCents(__tierDiscountCents),
                    sumAfter: __ssFromCents(sumAfter),
                    expectedAfter: Number(__ssTotalAfter) || null,
                    delta: round2(__ssFromCents(sumAfter) - (Number(__ssTotalAfter) || 0))
                });
                console.table(__cartLines.map((x, i) => ({
                    i,
                    name: String(x.it?.name || ""),
                    qty: x.qty,
                    pre: __ssFromCents(x.preCents),
                    bundle: __ssFromCents(__bundleAlloc[i] || 0),
                    postBundle: __ssFromCents(__postBundleCents[i] || 0),
                    isDiscounted: !!x.isDisc,
                    eligibleTier: !!x.eligibleTier,
                    tier: __ssFromCents(__tierAlloc[i] || 0),
                    after: __ssFromCents(__lineAfterCents[i] || 0)
                })));
            }
        } catch { }

        // Convenience helper for row rendering
        function __computeLineTotalsForRenderByIndex(i) {
            const pre = __ssFromCents(__cartLines[i]?.preCents || 0);
            const after = __lineAfter[i] || 0;
            return { pre, after };
        }

        // Precompute product lookup once per render (avoids O(cartItems * catalogSize) scans that can freeze the page)
        let __ssProductByName = null;
        try {
            __ssProductByName = new Map();
            const groups = (typeof products === "object" && products) ? Object.values(products) : [];
            for (const g of groups) {
                if (Array.isArray(g)) {
                    for (const p of g) {
                        const n = p && p.name;
                        if (n && !__ssProductByName.has(n)) __ssProductByName.set(n, p);
                    }
                }
            }
        } catch { __ssProductByName = null; }

        // -------- Basket items (top section) --------
        for (let __i = 0; __i < entries.length; __i++) {
            const [key, item] = entries[__i];
            const productDiv = document.createElement("div");
            productDiv.classList.add("Basket_Item_Container");

            const encName = encodeURIComponent(String(item?.name || ""));
            const __recoTok = String(item?.recoDiscountToken || "").trim();
            const __recoQ = __recoTok ? `&reco=${encodeURIComponent(__recoTok)}` : "";

            const safeName = __ssEscHtml(item?.name || "");
            const safeDesc = __ssEscHtml(item?.description || "");
            const safeImg = __ssEscHtml(item?.image || "");
            const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);

            const product = __ssProductByName ? (__ssProductByName.get(item?.name || "") || null) : null;

            const __dispOpts = __ssGetSelectedOptionsForDisplay(item, product);
            const optionChipsHTML = __ssBuildOptionChipsHTML(__dispOpts, false);

            productDiv.innerHTML = `
              <div class="Basket-Item">
                <a href="https://www.snagletshop.com/?product=${encName}${__recoQ}" target="_blank" rel="noopener noreferrer">
                  <img class="Basket_Image"
                       src="${safeImg}"
                       alt="${safeName}"
                       data-name="${safeName}"
                       data-price="${__ssEscHtml(item?.price ?? "")}"
                       data-description="${safeDesc}"
                       data-imageurl="${safeImg}">
                </a>
                <div class="Item-Details">
                  <a href="https://www.snagletshop.com/?product=${encName}${__recoQ}" target="_blank" rel="noopener noreferrer" class="BasketText">
                    <strong class="BasketText BasketTitle">${safeName}</strong>
                  </a>
                  ${optionChipsHTML}
                  <p class="BasketTextDescription">${safeDesc}</p>
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
        }
        // -------- Receipt (checkout summary) --------
        const receiptDiv = document.createElement("div");
        receiptDiv.classList.add("BasketReceipt");

        let receiptContent = `<div class="Basket-Item-Pay"><table class="ReceiptTable">`;

        // Per-line totals after incentives were computed above in __lineAfter (aligned to entries order).
        for (let i = 0; i < entries.length; i++) {
            const [k, item] = entries[i];
            const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);
            const unit = Number(parseFloat(item?.price) || 0);
            const itemTotal = unit * qty;

            // Per-line total AFTER cart incentives:
            // - bundle discount applies to all items
            // - tier discount applies only to eligible items (unless applyToDiscountedItems=true)
            let lineTotalAfter = Number(__lineAfter[i]) || 0;


            const name = __ssEscHtml(item?.name || "");
            const productForReceipt = __ssProductByName ? (__ssProductByName.get(item?.name || "") || null) : null;;
            const __dispOptsReceipt = __ssGetSelectedOptionsForDisplay(item, productForReceipt);
            const receiptChipsHTML = __ssBuildOptionChipsHTML(__dispOptsReceipt, true);

            const preCartTotal = round2(itemTotal);
            const postCartTotal = round2(lineTotalAfter);

            // If there is a reco discount, keep the "original vs discounted" UX, but apply cart-level discount on top.
            const hasRecoDisc = (String(item?.recoDiscountToken || "") && Number(item?.recoDiscountPct || 0) > 0 && Number(item?.unitPriceOriginalEUR || 0) > Number(unit || 0));
            const recoOrigTotal = round2((Number(item?.unitPriceOriginalEUR || 0) * qty));

            let priceCellHTML = "";
            if (postCartTotal < preCartTotal - 1e-9) {
                // cart-level discount applies => show strike-through of pre-cart total and the post-cart total
                priceCellHTML =
                    `<td class="basket-item-price" data-eur="${postCartTotal.toFixed(2)}" data-eur-original="${preCartTotal.toFixed(2)}">
                      <span style="text-decoration:line-through;opacity:.65;margin-right:4px">${preCartTotal.toFixed(2)}€</span>
                      <span style="font-weight:700">${postCartTotal.toFixed(2)}€</span>
                   </td>`;
            } else if (hasRecoDisc && recoOrigTotal > preCartTotal) {
                // only reco discount
                priceCellHTML =
                    `<td class="basket-item-price" data-eur="${preCartTotal.toFixed(2)}" data-eur-original="${recoOrigTotal.toFixed(2)}" data-discount-pct="${Number(item.recoDiscountPct || 0)}">
                      <span style="text-decoration:line-through;opacity:.65;margin-right:4px">${recoOrigTotal.toFixed(2)}€</span>
                      <span style="font-weight:700">${preCartTotal.toFixed(2)}€</span>
                   </td>`;
            } else {
                priceCellHTML = `<td class="basket-item-price" data-eur="${preCartTotal.toFixed(2)}">${preCartTotal.toFixed(2)}€</td>`;
            }

            receiptContent += `
    <tr>
      <td>${qty} ×</td>
      <td>
        <div class="ReceiptItemName">${name}</div>
              ${receiptChipsHTML}
      </td>
      ${priceCellHTML}
    </tr>
  `;
        }

        receiptContent += `</table></div>`;

        // Incentive block (discount tiers / add-ons)
        try { receiptContent += __ssRenderCartIncentivesHTML(totalSum, { inc: __ssInc, fullCart: __fullCart }); } catch { }

        receiptContent += `
      <div class="ReceiptFooter">
        <button class="PayButton">${__ssEscHtml(TEXTS?.PRODUCT_SECTION?.BUY_NOW || "Buy now")}</button>
        <strong class="PayTotalText" id="basket-total" data-eur="${__ssTotalAfter.toFixed(2)}">
          Total: ${(__ssDiscountEUR > 0 && __ssTotalAfter < totalSum)
                ? `<span style="text-decoration:line-through; opacity:.75;">${totalSum.toFixed(2)}€</span> <span>${__ssTotalAfter.toFixed(2)}€</span>`
                : `${__ssTotalAfter.toFixed(2)}€`}
        </strong>
      </div>
    `;

        receiptDiv.innerHTML = receiptContent;
        basketContainer.appendChild(receiptDiv);

        // Restore scroll position after DOM rebuild.
        // Use rAF to ensure layout is settled before restoring.
        try {
            const restore = () => {
                try {
                    if (__ssHasContainerScroll) {
                        basketContainer.scrollTop = __ssPrevContainerY;
                    } else if (__ssPrevWinY > 0) {
                        window.scrollTo(0, __ssPrevWinY);
                    }
                } catch { }
            };
            requestAnimationFrame(() => requestAnimationFrame(restore));
        } catch { }

        try {
            window.__ssSuppressPriceObserver = true;
            if (typeof updateAllPrices === "function") updateAllPrices(basketContainer);
        } catch { }
        finally {
            setTimeout(() => { try { window.__ssSuppressPriceObserver = false; } catch { } }, 250);
        }
        try { __ssBindCartIncentives(basketContainer); } catch { }

        // Keep existing event delegation behavior for qty buttons
        if (!basketContainer.dataset.qtyBound) {
            basketContainer.dataset.qtyBound = "1";
            basketContainer.addEventListener("click", (e) => {
                const btn = e.target.closest(".BasketChangeQuantityButton");
                if (!btn) return;
                e.preventDefault();
                e.stopPropagation();
                const kk = decodeURIComponent(btn.dataset.key || "");
                const delta = parseInt(btn.dataset.delta || "0", 10) || 0;
                try { changeQuantity(kk, delta); } catch { }
            });
        }

    } finally {
        window.__ssUpdatingBasket = false;
        __ssBasketRenderInProgress = false;
        if (__ssBasketNeedsRerender) {
            __ssBasketNeedsRerender = false;
            __ssRequestBasketRerender("post-render");
        }
    }
}













