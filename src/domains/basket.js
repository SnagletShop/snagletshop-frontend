(function (window, document) {
const runtimeStore = window.__SS_RESOLVE__?.resolve?.('state.runtime', window.__SS_RUNTIME_STORE__ || null) || window.__SS_RUNTIME_STORE__ || null;
const basketRowComponent = () => window.__SS_RESOLVE__?.resolve?.('component.basketRow', window.__SS_BASKET_ROW__ || null) || window.__SS_BASKET_ROW__ || null;
function readBasketFromStorageSafe() {
    try {
        const raw = localStorage.getItem(BASKET_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
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
    try { runtimeStore?.setBasket?.(basket, `sync:${reason}`); } catch {}

}

function persistBasket(reason = "update") {
    try { localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket)); } catch { }
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch { }

    if (basketBC) {
        try { basketBC.postMessage({ type: "basket_changed", from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch { }
    }
    try { __ssUpdateBasketHeaderIndicator(); } catch { }
    try { runtimeStore?.setBasket?.(basket, `persist:${reason}`); } catch {}

}

function clearBasketStorage(reason = "clear") {
    try { localStorage.removeItem(BASKET_STORAGE_KEY); } catch { }
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch { }

    if (basketBC) {
        try { basketBC.postMessage({ type: "basket_changed", from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch { }
    }
    try { __ssUpdateBasketHeaderIndicator(); } catch { }
    try { runtimeStore?.setBasket?.({}, `clear:${reason}`); } catch {}

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

function loadBasket() {
    updateBasket();
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

function addToCart(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = "", selectedOptions = null, productIdHint = null) {
    // Prefer explicit productId passed by callers (PDP/recs) to avoid name/link matching failures.
    let productIdForCart = String(productIdHint || "").trim();

    let pRef = {};
    try {
        if (typeof findProductByNameParam === "function") pRef = findProductByNameParam(productName) || {};
        else if (typeof findProductByName === "function") pRef = findProductByName(productName) || {};
    } catch {}
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
            basket[key].unitPriceEUR = price;
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
                unitPriceEUR: price,
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
    window.__ssBasketRenderInProgress = true;
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

                    const flatFromCatalog = (typeof window.__ssGetCatalogFlat === 'function') ? window.__ssGetCatalogFlat() : null;
                    const flatFromCache = window.__ssCatalogIndexCache?.flat || window.__ssCatalogIndexCache?.flat?.flat || null;
                    const arr = Array.isArray(flatFromCatalog)
                        ? flatFromCatalog
                        : (Array.isArray(flatFromCache)
                            ? flatFromCache
                            : (Array.isArray(window.__ssCatalogIndexCache?.flat) ? window.__ssCatalogIndexCache.flat : null));

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
            const product = __ssProductByName ? (__ssProductByName.get(item?.name || "") || null) : null;
            const productDiv = basketRowComponent()?.createBasketRow?.(key, item, product) || document.createElement("div");
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
                      <span class="ss-price-old">${preCartTotal.toFixed(2)}€</span>
                      <span class="ss-price-new">${postCartTotal.toFixed(2)}€</span>
                   </td>`;
            } else if (hasRecoDisc && recoOrigTotal > preCartTotal) {
                // only reco discount
                priceCellHTML =
                    `<td class="basket-item-price" data-eur="${preCartTotal.toFixed(2)}" data-eur-original="${recoOrigTotal.toFixed(2)}" data-discount-pct="${Number(item.recoDiscountPct || 0)}">
                      <span class="ss-price-old">${recoOrigTotal.toFixed(2)}€</span>
                      <span class="ss-price-new">${preCartTotal.toFixed(2)}€</span>
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
                ? `<span class="ss-price-old--muted">${totalSum.toFixed(2)}€</span> <span>${__ssTotalAfter.toFixed(2)}€</span>`
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
        try { (window.__ssBindCartIncentives || __ssBindCartIncentives)?.(basketContainer); } catch { }

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
        window.__ssBasketRenderInProgress = false;
        if (window.__ssBasketNeedsRerender) {
            window.__ssBasketNeedsRerender = false;
            (window.__ssRequestBasketRerender || __ssRequestBasketRerender)?.("post-render");
        }
    }
}

  window.__SS_BASKET__ = {
    readBasketFromStorageSafe,
    syncBasketFromStorage,
    persistBasket,
    clearBasketStorage,
    clearBasketCompletely,
    loadBasket,
    readBasket,
    GoToCart,
    addToCart,
    updateBasket
  };
})(window, document);
