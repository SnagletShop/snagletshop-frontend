(function (window, document) {
let __ssRecoUpdateNav = function(){};
let __ssRecoRenderToken = 0;
let __ssSmartRecoApiCache = window.__ssSmartRecoApiCache || { key: "", at: 0, data: null, pendingKey: "", pending: null };

window.__SS_RECO_LAYOUT__ = window.__SS_RECO_LAYOUT__ || {
    desktopVisibleCount: 5,
    mobileVisibleCount: 2,
    desktopBatchSize: 5,
    mobileBatchSize: 2,
    desktopMaxBatches: 6,
    mobileMaxBatches: 6,
    desktopMaxItems: 0,
    mobileMaxItems: 0,
    desktopSwipeSmallPx: 35,
    mobileSwipeSmallPx: 35,
    desktopSwipeBigPx: 120,
    mobileSwipeBigPx: 120
};
window.__ssSmartRecoApiCache = window.__ssSmartRecoApiCache || __ssSmartRecoApiCache;
const __SS_RECO_DESKTOP_VISIBLE_TARGET__ = 5;
const __SS_RECO_DESKTOP_BATCH_TARGET__ = 5;

function __ssRecoClearRecentClick() {
    try { localStorage.removeItem("ss_reco_last_click_v1"); } catch { }
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

function __ssRecoEnsureStyles() {
    return true;
}

function __ssRecoGetExcludeIds(sourceProductId = "") {
    const fallbackPid = (() => {
        try {
            return __ssIdNorm(
                sourceProductId ||
                window.__ssCurrentProductId ||
                (typeof __ssGetCurrentPidFallback === "function" ? __ssGetCurrentPidFallback() : "")
            );
        } catch {
            return "";
        }
    })();

    try {
        const b = (typeof readBasket === "function")
            ? readBasket()
            : (() => { try { return JSON.parse(localStorage.getItem("basket") || "{}"); } catch { return {}; } })();
        const ids = new Set();
        Object.values(b || {}).forEach((it) => {
            const pid = __ssIdNorm(it?.productId || "");
            if (pid) ids.add(pid);
        });
        if (fallbackPid && !__ssIsBadId(fallbackPid)) ids.add(fallbackPid);
        return Array.from(ids);
    } catch {
        return (fallbackPid && !__ssIsBadId(fallbackPid)) ? [fallbackPid] : [];
    }
}

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

function getOrCreateRecoSessionId() {
    return __ssRecoGetSessionId();
}

async function trackRecoImpressions(payload) {
    try {
        const widgetId = String(payload?.widgetId || "").trim();
        const sourceProductId = __ssIdNorm(payload?.sourceProductId || "");
        const sessionId = String(payload?.sessionId || __ssRecoGetSessionId()).trim();
        if (!sourceProductId) return;

        const shown = Array.isArray(payload?.extra?.shown) ? payload.extra.shown : [];
        const items = shown
            .map((item) => ({
                targetProductId: __ssIdNorm(item?.productId || ""),
                position: Number(item?.position || 0) || null
            }))
            .filter((item) => item.targetProductId);

        if (!items.length) return;

        await Promise.allSettled(items.map((item) => __ssRecoSendEvent("impression", {
            widgetId,
            sourceProductId,
            targetProductId: item.targetProductId,
            position: item.position,
            sessionId,
            extra: payload?.extra || null
        })));
    } catch { }
}

function __ssRecoGetLayoutSettings() {
    const fromPreload = (window?.preloadedData?.storefrontConfig?.productPageRecommendations && typeof window.preloadedData.storefrontConfig.productPageRecommendations === "object")
        ? window.preloadedData.storefrontConfig.productPageRecommendations
        : {};
    const fromWindow = (window.__SS_RECO_LAYOUT__ && typeof window.__SS_RECO_LAYOUT__ === "object")
        ? window.__SS_RECO_LAYOUT__
        : {};

    return { ...fromPreload, ...fromWindow };
}

function __ssNormalizeSmartRecoPayload(payload = {}) {
    const cartItems = Array.isArray(payload?.cartItems)
        ? payload.cartItems.map((item) => ({
            name: String(item?.name || item?.productName || "").trim()
        })).filter((item) => item.name).sort((a, b) => a.name.localeCompare(b.name))
        : [];
    const context = (payload?.context && typeof payload.context === "object") ? payload.context : {};
    return {
        placement: String(payload?.placement || "").trim(),
        sessionId: String(payload?.sessionId || "").trim(),
        desiredEUR: Math.round((Number(payload?.desiredEUR || 0) || 0) * 100) / 100,
        limit: Math.max(1, Math.min(12, Number(payload?.limit || 6) || 6)),
        cartItems,
        context: {
            lang: String(context?.lang || "").trim(),
            device: String(context?.device || "").trim(),
            page: String(context?.page || "").trim(),
            strictMaxPrice: !!context?.strictMaxPrice,
            optimization: String(context?.optimization || "").trim(),
            profitTieEUR: Math.round((Number(context?.profitTieEUR || 0) || 0) * 100) / 100,
            enableRecoDiscounts: !!context?.enableRecoDiscounts
        }
    };
}

function __ssGetSmartRecoPayloadKey(payload = {}) {
    try {
        return JSON.stringify(__ssNormalizeSmartRecoPayload(payload));
    } catch {
        return "";
    }
}

function __ssRecoGetLayout(device) {
    const mobile = String(device || "").toLowerCase() === "mobile";
    const cfg = __ssRecoGetLayoutSettings();
    const visibleCount = mobile
        ? Math.max(1, Number(cfg.mobileVisibleCount || 2) || 2)
        : __SS_RECO_DESKTOP_VISIBLE_TARGET__;
    const batchSize = mobile
        ? Math.max(1, Number(cfg.mobileBatchSize || 2) || 2)
        : __SS_RECO_DESKTOP_BATCH_TARGET__;
    const maxBatches = mobile
        ? Math.max(1, Number(cfg.mobileMaxBatches || 6) || 6)
        : Math.max(1, Number(cfg.desktopMaxBatches || 6) || 6);
    const maxItems = mobile
        ? Math.max(0, Number(cfg.mobileMaxItems || 0) || 0)
        : Math.max(0, Number(cfg.desktopMaxItems || 0) || 0);
    const swipeSmallPx = mobile
        ? Math.max(5, Number(cfg.mobileSwipeSmallPx || 35) || 35)
        : Math.max(5, Number(cfg.desktopSwipeSmallPx || 35) || 35);
    const swipeBigPx = mobile
        ? Math.max(swipeSmallPx + 12, Number(cfg.mobileSwipeBigPx || 120) || 120)
        : Math.max(swipeSmallPx + 12, Number(cfg.desktopSwipeBigPx || 120) || 120);
    return mobile
        ? { visibleCount, batchSize, maxBatches, maxItems, swipeSmallPx, swipeBigPx }
        : { visibleCount, batchSize, maxBatches, maxItems, swipeSmallPx, swipeBigPx };
}

function __ssRecoApplyLayout(recState, strip, ui = null) {
    const layout = __ssRecoGetLayout(recState?.device);
    if (!recState) return layout;
    const mobile = String(recState?.device || "").toLowerCase() === "mobile";
    recState.visibleCount = mobile
        ? Math.max(1, Number(ui?.visibleCount || 0) || Number(layout.visibleCount || recState.visibleCount || 1) || 1)
        : __SS_RECO_DESKTOP_VISIBLE_TARGET__;
    recState.batchSize = mobile
        ? Math.max(1, Number(ui?.batchSize || 0) || Number(layout.batchSize || recState.batchSize || 1) || 1)
        : __SS_RECO_DESKTOP_BATCH_TARGET__;
    recState.maxBatches = Math.max(1, Number(ui?.maxBatches || 0) || Number(layout.maxBatches || recState.maxBatches || 1) || 1);
    recState.maxItems = Math.max(0, Number(ui?.maxItems || 0) || Number(layout.maxItems || recState.maxItems || 0) || 0);
    recState.swipeSmallPx = Math.max(5, Number(ui?.swipeSmallPx || 0) || Number(layout.swipeSmallPx || recState.swipeSmallPx || 35) || 35);
    recState.swipeBigPx = Math.max(recState.swipeSmallPx + 12, Number(ui?.swipeBigPx || 0) || Number(layout.swipeBigPx || recState.swipeBigPx || 120) || 120);
    try {
        if (strip?.style?.setProperty) strip.style.setProperty("--reco-cols", String(recState.visibleCount));
    } catch { }
    return layout;
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

async function __ssRecoRenderForProduct(product) {
    try {
        if (!product) return;
        const renderToken = ++__ssRecoRenderToken;
        window.__ssRecoRenderToken = renderToken;
        try { await window.__SS_CATALOG_RUNTIME__?.initProducts?.(); } catch { }
        const viewer = document.getElementById("Viewer");
        const pv = document.getElementById("Product_Viewer");
        if (!viewer || !pv) return;

        __ssRecoEnsureStyles();

        // Remove any previous sections so races cannot leave duplicate rows behind.
        try {
            document.querySelectorAll('[data-ss-reco-section="1"], #RecoSection').forEach((node) => node.remove());
        } catch {}

        const sid = __ssRecoGetSessionId();
        const device = (window.innerWidth <= 700) ? "mobile" : "desktop";
        const initialLayout = __ssRecoGetLayout(device);

        const recState = {
            widgetId: null,
            token: null,
            listToken: null,
            // IMPORTANT: /recs expects a stable productId, not a name
            sourceProductId: (__ssResolvePidForRecs(product) || __ssGetCurrentPidFallback() || __ssIdNorm(product.productId)),
            currentProductId: __ssIdNorm(product.productId || (__ssResolvePidForRecs(product) || __ssGetCurrentPidFallback() || '')),
            device,
            visibleCount: initialLayout.visibleCount,
            batchSize: initialLayout.batchSize,
            maxBatches: initialLayout.maxBatches,
            maxItems: initialLayout.maxItems,
            swipeSmallPx: initialLayout.swipeSmallPx,
            swipeBigPx: initialLayout.swipeBigPx,
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
                let attempt = 0;
                while (attempt++ < 4) {
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
                        u.searchParams.set("exclude", exCsv);
                        recState.__excludeSet = exSet;
                    } catch { }

                    console.log("[recs] OUT", { url: String(u), sourceProductId: recState.sourceProductId, currentProductId: recState.currentProductId, device: recState.device, offset: recState.offset, limit: recState.batchSize, excludeCount: (recState.__excludeSet instanceof Set) ? recState.__excludeSet.size : 0, listToken: recState.listToken || null });

                    const recoService = window.__SS_RECOMMENDATIONS_SERVICE__;
                    if (!recoService?.getRecommendations) throw new Error('Recommendations service unavailable: getRecommendations');
                    const d = await recoService.getRecommendations(String(u));
                    try { console.log("[recs] IN", { ok: !!(d && d.ok), widgetId: d && d.widgetId, sourceProductId: d && d.sourceProductId, items: Array.isArray(d && d.items) ? d.items.length : 0, hasMore: d && d.hasMore, listToken: (d && d.listToken) || null, token: (d && d.token) || null }); } catch { }
                    if (!d || !d.ok || !Array.isArray(d.items)) return null;

                    recState.widgetId = recState.widgetId || d.widgetId;
                    if (!recState.token && typeof d.token === 'string' && d.token) recState.token = d.token;
                    if (!recState.listToken && typeof d.listToken === 'string' && d.listToken) recState.listToken = d.listToken;

                    const ui = (d.ui && typeof d.ui === "object") ? d.ui : {};
                    recState.serverUi = ui;
                    __ssRecoApplyLayout(recState, null, ui);

                    const serverReturned = Array.isArray(d.items) ? d.items.length : 0;
                    const maxAdd = (recState.maxItems > 0) ? Math.max(0, recState.maxItems - recState.offset) : 9999;
                    const items = (d.items || []).slice(0, maxAdd);

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
                        items.length = 0;
                        items.push(...filtered);
                    } catch { }

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
                        const exSet = (recState.excludeSet instanceof Set) ? new Set(recState.excludeSet) : new Set();
                        const cur = __ssIdNorm(recState.currentProductId || recState.sourceProductId || product?.productId || '');
                        const src = __ssIdNorm(recState.sourceProductId || '');
                        if (cur && !__ssIsBadId(cur)) exSet.add(cur);
                        if (src && !__ssIsBadId(src)) exSet.add(src);
                        recState.excludeSet = exSet;
                    } catch { }

                    if (items.length > 0 || !recState.hasMore || serverReturned <= 0) {
                        return { d, items };
                    }
                }
                return null;
            } finally {
                recState.loading = false;
            }
        }

        function buildCatalogFallbackBatch() {
            try {
                const routeRelated = Array.isArray(window.__SS_SSR_ROUTE_DATA__?.relatedProductIds)
                    ? window.__SS_SSR_ROUTE_DATA__.relatedProductIds.map((x) => __ssIdNorm(x)).filter(Boolean)
                    : [];
                const sourceCats = new Set((Array.isArray(product?.categories) ? product.categories : []).map((x) => String(x || "").trim()).filter(Boolean));
                const exSet = (recState.excludeSet instanceof Set) ? recState.excludeSet : new Set();
                const byId = (window.productsById && typeof window.productsById === "object") ? window.productsById : {};
                const toRecoItem = (p, idx) => ({
                    productId: __ssIdNorm(p?.productId || p?.id || ""),
                    name: String(p?.name || ""),
                    price: Number(__ssResolveVariantPriceEUR?.(p, [], "") || p?.price || p?.priceEUR || p?.basePrice || p?.sellPrice || 0) || 0,
                    description: String(p?.description || ""),
                    image: String(p?.image || (Array.isArray(p?.images) ? p.images[0] : "") || (Array.isArray(p?.imagesB) ? p.imagesB[0] : "") || ""),
                    productLink: String(p?.productLink || p?.link || ""),
                    position: idx + 1
                });
                if (routeRelated.length) {
                    const items = [];
                    for (const pid of routeRelated) {
                        if (!pid || exSet.has(pid)) continue;
                        const hit = byId?.[pid];
                        if (!hit || typeof hit !== "object") continue;
                        items.push(toRecoItem(hit, items.length));
                        if (items.length >= Math.max(1, Number(recState.batchSize || 4) || 4)) break;
                    }
                    if (items.length) {
                        recState.hasMore = routeRelated.length > items.length;
                        return {
                            d: { ok: true, widgetId: "ssr_related_fallback", sourceProductId: recState.sourceProductId, hasMore: recState.hasMore, token: null, listToken: null },
                            items
                        };
                    }
                }
                const pick = (sameCategoryOnly) => {
                    const out = [];
                    const flat = __ssGetCatalogFlat();
                    for (const p of (Array.isArray(flat) ? flat : [])) {
                        if (!p || typeof p !== "object" || !String(p?.name || "").trim()) continue;
                        const pid = __ssIdNorm(p?.productId || p?.id || "");
                        if (pid && exSet.has(pid)) continue;
                        if (sameCategoryOnly && sourceCats.size) {
                            const cats = (Array.isArray(p?.categories) ? p.categories : []).map((x) => String(x || "").trim()).filter(Boolean);
                            if (cats.length && !cats.some((cat) => sourceCats.has(cat))) continue;
                        }
                        out.push(toRecoItem(p, out.length));
                        if (out.length >= Math.max(1, Number(recState.batchSize || 3) || 3)) break;
                    }
                    return out;
                };
                const items = pick(true);
                const resolvedItems = items.length ? items : pick(false);
                if (!resolvedItems.length) return null;
                recState.hasMore = false;
                return {
                    d: { ok: true, widgetId: "catalog_fallback", sourceProductId: recState.sourceProductId, hasMore: false, token: null, listToken: null },
                    items: resolvedItems
                };
            } catch {
                return null;
            }
        }

        const first = await fetchBatch();
        const firstResolved = (first && first.items && first.items.length) ? first : buildCatalogFallbackBatch();
        if (!firstResolved || !firstResolved.items || firstResolved.items.length === 0) return;
        if ((window.__ssRecoRenderToken || 0) !== renderToken) return;
        if (!recState.widgetId && firstResolved.d?.widgetId) recState.widgetId = firstResolved.d.widgetId;
        recState.items = [];

        const section = document.createElement("div");
        section.id = "RecoSection";
        section.className = "RecoSection";
        section.dataset.ssRecoSection = "1";
        section.dataset.sourceProductId = String(recState.sourceProductId || "");
        section.dataset.renderToken = String(renderToken);

        const head = document.createElement("div");
        head.className = "RecoHead";

        const h = document.createElement("h3");
        h.textContent = "Related items";

        const navs = document.createElement("div");
        navs.className = "RecoNavs";

        const btnL = document.createElement("button");
        btnL.type = "button";
        btnL.className = "RecoNav";
        btnL.setAttribute("aria-label", "Scroll left");
        btnL.innerHTML = "&lsaquo;";
        btnL.textContent = "‹";

        const btnR = document.createElement("button");
        btnR.type = "button";
        btnR.className = "RecoNav";
        btnR.setAttribute("aria-label", "Scroll right");
        btnR.innerHTML = "&rsaquo;";
        btnR.textContent = "›";

        btnL.innerHTML = "&#8249;";
        btnR.innerHTML = "&#8250;";

        navs.appendChild(btnL);
        navs.appendChild(btnR);

        head.appendChild(h);
        head.appendChild(navs);

        const viewport = document.createElement("div");
        viewport.className = "RecoViewport";

        const strip = document.createElement("div");
        strip.className = "RecoStrip";
        __ssRecoApplyLayout(recState, strip, recState.serverUi);

        viewport.appendChild(strip);
        __ssEnsureContributionProducts();
        const flat = (Array.isArray(window.__ssContributionCache?.items) && window.__ssContributionCache.items.length)
            ? window.__ssContributionCache.items.map(x => ({ name: x.name, price: x.price, images: x.images || [], productLink: x.productLink || "", productId: x.productId }))
            : __ssGetCatalogFlat();

        function makeCard(it, idx) {
            const card = document.createElement("div");
            card.className = "RecoCard";
            card.dataset.productId = __ssIdNorm(it.productId);
            card.dataset.position = String(it.position || (idx + 1));
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");

            const media = document.createElement("div");
            media.className = "RecoMedia";

            const img = document.createElement("img");
            img.className = "RecoImg";
            img.loading = "lazy";
            img.alt = String(it.name || "");
            img.src = String(it.image || "");

            media.appendChild(img);

            const nm = document.createElement("div");
            nm.className = "RecoName";
            nm.textContent = String(it.name || "");

            const price = document.createElement("span");
            // Make it compatible with updateAllPrices() (currency + tariffs)
            price.className = "product-price RecoPrice";
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
                price.innerHTML = `<span class="ss-price-old">${eur}</span> <span class="ss-price-new">${discPrice}</span>`;
            } else {
                price.dataset.eur = String(eur || "");
                price.textContent = eur ? `${eur}` : "";
            }

            const badge = document.createElement("span");
            badge.className = "RecoBadge";
            const pos = Number(it.position || (idx + 1));
            if (hasRealDiscount) {
                badge.textContent = "Deal";
                badge.classList.add("RecoBadge--deal");
            } else if (pos <= 2) {
                badge.textContent = "Hot";
                badge.classList.add("RecoBadge--best");
            } else {
                badge.textContent = "Pick";
                badge.classList.add("RecoBadge--soft");
            }

            media.appendChild(badge);

            const body = document.createElement("div");
            body.className = "RecoBody";

            const promo = document.createElement("div");
            promo.className = "RecoPromo";

            const promoTag = document.createElement("span");
            promoTag.className = "RecoPromoTag";
            if (hasRealDiscount) promoTag.classList.add("RecoPromoTag--deal");
            else if (pos <= 2) promoTag.classList.add("RecoPromoTag--hot");
            else promoTag.classList.add("RecoPromoTag--soft");
            promoTag.textContent = hasRealDiscount ? "DEAL" : (pos <= 2 ? "HOT" : "PICK");

            const promoText = document.createElement("span");
            promoText.className = "RecoPromoText";
            promoText.textContent = hasRealDiscount ? "Recommended offer" : (pos <= 2 ? "Popular related item" : "Picked for you");

            promo.append(promoTag, promoText);

            const meta = document.createElement("div");
            meta.className = "RecoMeta";

            const priceRow = document.createElement("div");
            priceRow.className = "RecoPriceRow";
            priceRow.append(price);

            if (hasRealDiscount) {
                const priceOff = document.createElement("span");
                priceOff.className = "RecoPriceOff";
                priceOff.textContent = `-${Math.round(discPct)}%`;
                priceRow.append(priceOff);
            }

            const hint = document.createElement("div");
            hint.className = "RecoHint";
            if (hasRealDiscount) hint.classList.add("RecoHint--deal");
            hint.textContent = hasRealDiscount ? "Special recommendation deal" : (pos <= 2 ? "Popular with similar shoppers" : "Matched to this product");

            meta.append(priceRow, hint);

            body.append(promo, nm, meta);
            card.append(media, body);

            const openRecoProduct = (e) => {
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
            };

            card.addEventListener("click", openRecoProduct);
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    openRecoProduct(e);
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
                if (typeof updateAllPrices === "function") updateAllPrices(section);
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

        appendItems(firstResolved.items);

        section.append(head, viewport);

        const pdp = document.querySelector('.Product_Detail_Page');
        const anchor = pdp || pv;
        if ((window.__ssRecoRenderToken || 0) !== renderToken) return;
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
                    __ssRecoApplyLayout(recState, strip, recState.serverUi);
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

        function getVisibleWindowCount() {
            try {
                const stride = getStride();
                if (!(stride > 0)) return Math.max(1, Number(recState.visibleCount || 1) || 1);
                return Math.max(1, Math.floor((viewport.clientWidth + 4) / stride));
            } catch {
                return Math.max(1, Number(recState.visibleCount || 1) || 1);
            }
        }

        function scrollToIndex(i, behavior = "smooth") {
            const stride = getStride();
            const total = strip.querySelectorAll(".RecoCard").length;
            const maxIndex = Math.max(0, total - getVisibleWindowCount());
            const target = Math.max(0, Math.min(maxIndex, Math.round(i))) * stride;
            viewport.scrollTo({ left: target, behavior });
        }

        function currentIndex() {
            const stride = getStride();
            return stride > 0 ? Math.round(viewport.scrollLeft / stride) : 0;
        }

        function distanceToEndPx() {
            return Math.max(0, viewport.scrollWidth - (viewport.scrollLeft + viewport.clientWidth));
        }

        async function maybeLoadMore(force = false) {
            try {
                const visibleWindow = getVisibleWindowCount();
                const totalCards = strip.querySelectorAll(".RecoCard").length;
                const nearEndByIndex = (currentIndex() + visibleWindow) >= Math.max(0, totalCards - 1);
                const nearEndByPixels = distanceToEndPx() <= Math.max(getStride() * 2, 28);
                const nearEnd = force || nearEndByIndex || nearEndByPixels;
                if (!nearEnd) return;
                const batch = await fetchBatch();
                if (batch && batch.items && batch.items.length) {
                    appendItems(batch.items);
                    __ssRecoApplyLayout(recState, strip, recState.serverUi);
                    __ssRecoUpdateNav();
                }
            } catch { }
        }

        __ssRecoUpdateNav = function __ssRecoUpdateNav() {
            try {
                // align width
                try { const w = anchor.getBoundingClientRect().width; if (w && w > 240) section.style.maxWidth = Math.round(w) + 'px'; } catch { }
                const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
                btnL.disabled = viewport.scrollLeft <= 2;
                btnR.disabled = (viewport.scrollLeft >= (maxScroll - 2)) && !recState.hasMore;
            } catch { }
        }

        // Nav buttons: support mobile tap reliably + step one item on mobile
        function navStepItems() {
            return 1;
        }

        async function handleNav(dir) {
            try {
                const visibleWindow = getVisibleWindowCount();
                const totalBefore = strip.querySelectorAll(".RecoCard").length;
                const current = currentIndex();
                const targetBefore = current + (dir * navStepItems());
                const needsMoreAhead = dir > 0 && (targetBefore + visibleWindow) >= totalBefore;
                if (needsMoreAhead || (dir > 0 && distanceToEndPx() <= Math.max(getStride(), 24))) {
                    await maybeLoadMore(true);
                    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
                }
                scrollToIndex(currentIndex() + (dir * navStepItems()), "smooth");
                setTimeout(() => {
                    try {
                        __ssRecoUpdateNav();
                        if (dir > 0) maybeLoadMore();
                    } catch { }
                }, 220);
            } catch { }
        }

        function bindNav(btn, dir) {
            if (!btn || btn.dataset.ssRecoNavBound === '1') return;
            btn.dataset.ssRecoNavBound = '1';
            btn.addEventListener('click', (e) => {
                try { e.preventDefault(); e.stopPropagation(); } catch { }
                handleNav(dir);
            });
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
                const visibleWindow = getVisibleWindowCount();
                const stride = getStride();

                if (adx >= recState.swipeBigPx) {
                    viewport.scrollBy({ left: dir * stride * visibleWindow, behavior: "smooth" });
                } else {
                    viewport.scrollBy({ left: dir * stride, behavior: "smooth" });
                }
                await maybeLoadMore();
            } catch { }
        }, { passive: true });

        if (viewport && viewport.dataset.ssRecoScrollBound !== '1') {
            viewport.dataset.ssRecoScrollBound = '1';
            viewport.addEventListener('scroll', () => { __ssRecoUpdateNav(); maybeLoadMore(); }, { passive: true });
        }

        try {
            if (typeof window.__ssRecoResizeHandler === 'function') {
                window.removeEventListener('resize', window.__ssRecoResizeHandler);
            }
        } catch {}
        window.__ssRecoResizeHandler = () => {
            recState.device = (window.innerWidth <= 720) ? "mobile" : "desktop";
            __ssRecoApplyLayout(recState, strip, recState.serverUi);
            __ssRecoUpdateNav();
        };
        window.addEventListener('resize', window.__ssRecoResizeHandler);

        __ssRecoUpdateNav();
    } catch { }
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

async function __ssRecoSendEvent(type, payload) {
    try {
        const body = { type, ...payload };
        const recoService = window.__SS_RECOMMENDATIONS_SERVICE__;
        if (!recoService?.sendRecoEvent) throw new Error('Recommendations service unavailable: sendRecoEvent');
        await recoService.sendRecoEvent(body);
    } catch { }
}

async function __ssSmartRecoEvent(type, itemKey) {
    try {
        const token = String(window.__ssSmartCartRecoCache?.token || "").trim();
        if (!token) return;
        const recoService = window.__SS_RECOMMENDATIONS_SERVICE__;
        if (!recoService?.sendSmartRecoEvent) throw new Error('Recommendations service unavailable: sendSmartRecoEvent');
        await recoService.sendSmartRecoEvent({ type, token, itemKey, sessionId: String(window.__ssSessionId || "") });
    } catch { }
}

function __ssEnsureContributionProducts() {
    try {
        const flags = (typeof __ssGetFeatureFlags === "function") ? __ssGetFeatureFlags() : null;
        const enabled = !flags || __ssFlagEnabled("contributionRanking.enabled", true);
        if (!enabled) return;

        const now = Date.now();
        const cache = (window.__ssContributionCache = window.__ssContributionCache || { at: 0, items: null, pending: null, nextRetryAt: 0 });
        if (Array.isArray(cache.items) && cache.items.length && (now - (cache.at || 0)) < 10 * 60 * 1000) return;
        if (cache.pending) return;
        if (Number(cache.nextRetryAt || 0) > now) return;

        cache.pending = (window.__SS_RECOMMENDATIONS_SERVICE__?.getContributionProducts ? window.__SS_RECOMMENDATIONS_SERVICE__.getContributionProducts(40) : Promise.reject(new Error('Recommendations service unavailable: getContributionProducts')))
            .then(d => {
                // Only accept contribution feed if it has enough renderable items.
                // Otherwise we'd replace the local catalog pool and cart add-ons would vanish.
                if (!(d && d.ok && Array.isArray(d.items))) {
                    cache.nextRetryAt = Date.now() + 60 * 1000;
                    return;
                }

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
                    cache.at = Date.now();
                    cache.items = items;
                    cache.nextRetryAt = cache.at + 10 * 60 * 1000;
                    // Invalidate pool cache so it can rebuild from contribution feed.
                    try { window.__ssAddonPoolSortedCache = { src: "", ref: null, len: 0, sorted: [] }; } catch { }
                    return;
                }

                cache.nextRetryAt = Date.now() + 60 * 1000;
            })
            .catch(() => { cache.nextRetryAt = Date.now() + 60 * 1000; })
            .finally(() => { cache.pending = null; });
    } catch { }
}

function __ssEnsureSmartCartRecs({ desiredEUR = 0, limit = 4 } = {}) {
    try {
        const impl = window.__SS_CART_INCENTIVES__?.__ssEnsureSmartCartRecs || window.__ssEnsureSmartCartRecs;
        if (typeof impl === 'function' && impl !== __ssEnsureSmartCartRecs) return impl({ desiredEUR, limit });
    } catch { }
}


  async function getSmartRecommendations(payload = {}) {
    const key = __ssGetSmartRecoPayloadKey(payload);
    const cache = window.__ssSmartRecoApiCache || __ssSmartRecoApiCache;
    if (key && cache.key === key && Object.prototype.hasOwnProperty.call(cache || {}, 'data')) {
        return cache.data;
    }
    if (key && cache.pendingKey === key && cache.pending) {
        return cache.pending;
    }

    const pending = window.__SS_API__.request('/smart-reco/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
        credentials: 'include'
    }).then((res) => res.json().catch(() => null))
      .then((data) => {
        __ssSmartRecoApiCache = {
            key,
            at: Date.now(),
            data,
            pendingKey: "",
            pending: null
        };
        window.__ssSmartRecoApiCache = __ssSmartRecoApiCache;
        return data;
      })
      .catch((err) => {
        __ssSmartRecoApiCache = {
            ...(__ssSmartRecoApiCache || cache || {}),
            pendingKey: "",
            pending: null
        };
        window.__ssSmartRecoApiCache = __ssSmartRecoApiCache;
        throw err;
      });

    __ssSmartRecoApiCache = {
        ...(cache || {}),
        pendingKey: key,
        pending
    };
    window.__ssSmartRecoApiCache = __ssSmartRecoApiCache;
    return pending;
}

async function quoteRecommendations(items = []) {
    const res = await window.__SS_API__.request('/recs/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items || [] }),
        credentials: 'include'
    });
    return res.json().catch(() => null);
}

try {
    const maybeProduct = document.getElementById('Product_Viewer')
        ? (window.__ssResolveProductForPdp?.(window.__ssCurrentViewedProductName || '', window.__ssCurrentProductId || '', '') || null)
        : null;
    if (maybeProduct) setTimeout(() => { try { __ssRecoRenderForProduct(maybeProduct); } catch { } }, 0);
} catch { }

window.__ssRecoRenderForProduct = __ssRecoRenderForProduct;
window.getOrCreateRecoSessionId = window.getOrCreateRecoSessionId || getOrCreateRecoSessionId;
window.trackRecoImpressions = window.trackRecoImpressions || trackRecoImpressions;

window.__SS_RECOMMENDATIONS__ = {
    __ssRecoClearRecentClick,
    __ssRecoConsumeRecentClick,
    __ssRecoDiscountStoreGet,
    __ssRecoDiscountStorePut,
    __ssRecoEnsureStyles,
    __ssRecoGetExcludeIds,
    __ssRecoGetSessionId,
    getOrCreateRecoSessionId,
    trackRecoImpressions,
    __ssRecoMaybeAttributeAddToCart,
    __ssRecoRenderForProduct,
    __ssRecoSaveRecentClick,
    __ssRecoSendEvent,
    __ssRecoUpdateNav,
    __ssSmartRecoEvent,
    __ssEnsureContributionProducts,
    getSmartRecommendations,
    quoteRecommendations,
    __ssEnsureSmartCartRecs
  };
})(window, document);
