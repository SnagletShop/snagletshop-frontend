(function (window, document) {
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

                const recoService = window.__SS_RECOMMENDATIONS_SERVICE__;
                if (!recoService?.getRecommendations) throw new Error('Recommendations service unavailable: getRecommendations');
                const d = await recoService.getRecommendations(String(u));
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
        const token = String(__ssSmartCartRecoCache?.token || "").trim();
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
        if (__ssContributionCache.items && (now - (__ssContributionCache.at || 0)) < 10 * 60 * 1000) return;

        __ssContributionCache.at = now;
(window.__SS_RECOMMENDATIONS_SERVICE__?.getContributionProducts ? window.__SS_RECOMMENDATIONS_SERVICE__.getContributionProducts(40) : Promise.reject(new Error('Recommendations service unavailable: getContributionProducts')))
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


  async function getSmartRecommendations(payload = {}) {
    const res = await window.__SS_API__.request('/smart-reco/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
        credentials: 'include'
    });
    return res.json().catch(() => null);
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

window.__SS_RECOMMENDATIONS__ = {
    __ssRecoClearRecentClick,
    __ssRecoConsumeRecentClick,
    __ssRecoDiscountStoreGet,
    __ssRecoDiscountStorePut,
    __ssRecoEnsureStyles,
    __ssRecoGetExcludeIds,
    __ssRecoGetSessionId,
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
