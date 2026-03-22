(function (window, document) {
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
          <div class="sk pps-thumb"></div><div class="sk pps-thumb"></div><div class="sk pps-thumb"></div><div class="sk pps-thumb"></div><div class="sk pps-thumb"></div>
        </div>
      </div>
      <div class="pps-right">
        <div class="sk pps-title-line pps-title-line-1"></div>
        <div class="sk pps-title-line pps-title-line-2"></div>
        <div class="pps-desc"><div class="sk pps-text"></div><div class="sk pps-text"></div><div class="sk pps-text short"></div></div>
        <div class="pps-bullets">
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
          <div class="pps-bullet-row"><div class="sk pps-icon"></div><div class="sk pps-bullet-text"></div></div>
        </div>
        <div class="sk pps-shipping"></div>
        <div class="sk pps-price"></div>
        <div class="pps-buy-row"><div class="pps-qty"><div class="sk pps-qty-btn"></div><div class="sk pps-qty-num"></div><div class="sk pps-qty-btn"></div></div><div class="sk pps-cart-btn"></div></div>
        <div class="sk pps-buy-btn"></div>
      </div>
    </div>
  </div>
</div>`;
}

function __ssEnsureProductPageSkeletonStyles() {
    if (document.getElementById('__ssProductPageSkeletonStyles')) return;
    const s = document.createElement('style');
    s.id = '__ssProductPageSkeletonStyles';
    s.textContent = `.pps{padding:18px 0}.pps-inner{display:grid;gap:18px}.pps-top{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:18px}.pps-left,.pps-right{display:grid;gap:12px}.pps-main-image{width:100%;aspect-ratio:1/1;border-radius:18px}.pps-thumbs{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.pps-thumb{aspect-ratio:1/1;border-radius:12px}.pps-title-line{height:18px;border-radius:999px}.pps-title-line-1{width:88%}.pps-title-line-2{width:62%}.pps-desc,.pps-bullets{display:grid;gap:10px}.pps-text{height:12px;border-radius:999px}.pps-text.short{width:56%}.pps-bullet-row{display:grid;grid-template-columns:18px 1fr;gap:10px;align-items:center}.pps-icon{width:18px;height:18px;border-radius:999px}.pps-bullet-text{height:12px;border-radius:999px}.pps-shipping{height:14px;width:42%;border-radius:999px}.pps-price{height:24px;width:34%;border-radius:999px}.pps-buy-row{display:grid;grid-template-columns:140px 1fr;gap:12px}.pps-qty{display:grid;grid-template-columns:40px 1fr 40px;gap:10px}.pps-qty-btn,.pps-cart-btn,.pps-buy-btn{height:46px;border-radius:14px}.sk{position:relative;overflow:hidden;background:rgba(127,127,127,.16)}.sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);animation:ssSk 1.3s infinite}.dark-mode .sk::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)}@keyframes ssSk{100%{transform:translateX(100%)}}@media (max-width:780px){.pps-top{grid-template-columns:1fr}.pps-buy-row{grid-template-columns:1fr}.pps-thumbs{grid-template-columns:repeat(4,1fr)}}`;
    document.head.appendChild(s);
}

function __ssShowProductPageSkeleton() {
    const viewer = document.getElementById('Viewer');
    if (!viewer) return;
    __ssEnsureProductPageSkeletonStyles();
    try { viewer.innerHTML = __ssBuildProductPageSkeletonHtml(); } catch {}
}

function __ssHideProductPageSkeleton() {
    try { document.getElementById('ProductPageSkeleton')?.remove(); } catch {}
}

function handleSwipeGesture(startX, endX, threshold = 50) {
    const diff = Number(endX || 0) - Number(startX || 0);
    if (Math.abs(diff) < threshold) return 0;
    return diff > 0 ? -1 : 1;
}

function __ssSafeCatalogFlat() {
    try {
        if (typeof window.__ssGetCatalogFlat === 'function') {
            const flat = window.__ssGetCatalogFlat();
            if (Array.isArray(flat) && flat.length) return flat.filter(p => p && typeof p === 'object');
        }
    } catch {}
    try {
        const opt = window.__SS_PRODUCT_OPTIONS__?.__ssGetCatalogFlat?.();
        if (Array.isArray(opt) && opt.length) return opt.filter(p => p && typeof p === 'object');
    } catch {}
    try {
        const db = window.productsDatabase || window.products || {};
        const out = [];
        for (const v of Object.values(db || {})) {
            if (Array.isArray(v)) out.push(...v);
        }
        return out.filter(p => p && typeof p === 'object');
    } catch {}
    return [];
}

function __ssNormalizeNameKey(v) {
    return String(v || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function __ssProductLooksRicher(p) {
    if (!p || typeof p !== 'object') return 0;
    let score = 0;
    if (String(p.productId || '').trim()) score += 3;
    if (String(p.image || '').trim()) score += 4;
    if (Array.isArray(p.images) && p.images.length) score += 4;
    if (Array.isArray(p.imagesB) && p.imagesB.length) score += 2;
    if (String(p.description || '').trim()) score += 1;
    if (String(p.productLink || p.link || '').trim()) score += 1;
    return score;
}

function __ssGetProductImageCandidates(product, imageHint = '') {
    const out = [];
    const push = (v) => {
        const s = String(v || '').trim();
        if (!s) return;
        if (!out.includes(s)) out.push(s);
    };
    push(imageHint);
    push(product?.image);
    try { (product?.images || []).forEach(push); } catch {}
    try { (product?.imagesB || []).forEach(push); } catch {}
    push(product?.mainImage);
    push(product?.thumbnail);
    if (!out.length) push('/favicon.png');
    return out;
}

function __ssResolveProductForPdp(productName, pidArg = '', imgArg = '') {
    try {
        if (typeof window.__ssProductLooksRicher !== 'function') window.__ssProductLooksRicher = __ssProductLooksRicher;
        if (typeof window.__ssGetProductImageCandidates !== 'function') window.__ssGetProductImageCandidates = __ssGetProductImageCandidates;
    } catch {}
    const flat = __ssSafeCatalogFlat();
    const pid = (typeof window.__ssIdNorm === 'function') ? window.__ssIdNorm(pidArg) : String(pidArg || '').trim();
    const rawName = String(productName || '').trim();
    const nameKey = __ssNormalizeNameKey(rawName);
    const imgKey = String(imgArg || '').trim();

    let candidates = flat;
    if (pid) {
        const byPid = flat.filter(p => ((typeof window.__ssIdNorm === 'function') ? window.__ssIdNorm(p?.productId || p?.id || '') : String(p?.productId || p?.id || '').trim()) === pid);
        if (byPid.length) candidates = byPid;
    }
    if (!candidates.length && rawName) {
        candidates = flat.filter(p => String(p?.name || '').trim() === rawName);
    }
    if (!candidates.length && nameKey) {
        candidates = flat.filter(p => __ssNormalizeNameKey(p?.name) === nameKey);
    }
    if (!candidates.length && nameKey) {
        candidates = flat.filter(p => {
            const n = __ssNormalizeNameKey(p?.name);
            return !!n && (n.includes(nameKey) || nameKey.includes(n));
        });
    }
    if (!candidates.length) candidates = flat;

    const scored = candidates
        .map(p => {
            const scoreFn = (typeof window.__ssProductLooksRicher === 'function') ? window.__ssProductLooksRicher : __ssProductLooksRicher;
            let score = scoreFn(p);
            const pName = String(p?.name || '').trim();
            if (rawName && pName === rawName) score += 50;
            if (nameKey && __ssNormalizeNameKey(pName) === nameKey) score += 40;
            const pPid = (typeof window.__ssIdNorm === 'function') ? window.__ssIdNorm(p?.productId || p?.id || '') : String(p?.productId || p?.id || '').trim();
            if (pid && pPid === pid) score += 100;
            if (imgKey) {
                const imageCandidatesFn = (typeof window.__ssGetProductImageCandidates === 'function') ? window.__ssGetProductImageCandidates : __ssGetProductImageCandidates;
                const imgs = imageCandidatesFn(p, '');
                if (imgs.includes(imgKey)) score += 20;
            }
            return { p, score };
        })
        .sort((a, b) => b.score - a.score);

    const best = scored[0]?.p || null;
    if (!best) return null;

    if (!best.image && imgKey) {
        try { best.image = imgKey; } catch {}
    }
    if ((!Array.isArray(best.images) || !best.images.length) && imgKey) {
        try {
            const imageCandidatesFn = (typeof window.__ssGetProductImageCandidates === 'function') ? window.__ssGetProductImageCandidates : __ssGetProductImageCandidates;
            best.images = imageCandidatesFn(best, imgKey);
        } catch {}
    }
    return best;
}

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

    try { if (typeof window.__ssShowProductPageSkeleton === 'function') window.__ssShowProductPageSkeleton(); } catch {}
    try { if (typeof window.__ssScrollToTopForProductSkeleton === 'function') window.__ssScrollToTopForProductSkeleton(); } catch {}
    try { removeSortContainer(); } catch { }

    const __pidArg = String(arguments[4] || "").trim();
    const __imgArg = String(arguments[3] || "").trim();
    const product = __ssResolveProductForPdp(productName, __pidArg, __imgArg);
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
    const __ssImagesForViewer = __ssGetProductImageCandidates(product, __imgArg);
    if (!product) {
        console.error("❌ Product not found:", productName, __pidArg);
        try { if (typeof window.__ssHideProductPageSkeleton === 'function') window.__ssHideProductPageSkeleton(); } catch {}
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
            const safeImages = __ssGetProductImageCandidates(product, __imgArg);
            renderProductPage(product, safeImages.length ? safeImages : ['/favicon.png'], productName, productPrice, productDescription);
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

    window.currentProductImages = Array.isArray(validImages) ? validImages.filter(Boolean) : [];
    window.__ssCurrentProductId = String(product?.productId || product?.id || '').trim() || null;

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
    const groups = Array.isArray(window.__ssExtractOptionGroups?.(product))
        ? window.__ssExtractOptionGroups(product)
        : (Array.isArray(window.__SS_PRODUCT_OPTIONS__?.__ssExtractOptionGroups?.(product))
            ? window.__SS_PRODUCT_OPTIONS__.__ssExtractOptionGroups(product)
            : []);
    const defaultSel = Array.isArray(window.__ssDefaultSelectedOptions?.(groups))
        ? window.__ssDefaultSelectedOptions(groups)
        : (Array.isArray(window.__SS_PRODUCT_OPTIONS__?.__ssDefaultSelectedOptions?.(groups))
            ? window.__SS_PRODUCT_OPTIONS__.__ssDefaultSelectedOptions(groups)
            : []);
    try {
        if (typeof window.__ssSetSelectedOptions === 'function') window.__ssSetSelectedOptions(defaultSel);
        else if (typeof window.__SS_PRODUCT_OPTIONS__?.__ssSetSelectedOptions === 'function') window.__SS_PRODUCT_OPTIONS__.__ssSetSelectedOptions(defaultSel);
        else window.selectedProductOptions = Array.isArray(defaultSel) ? defaultSel : [];
    } catch {
        window.selectedProductOptions = Array.isArray(defaultSel) ? defaultSel : [];
    }

    if (Array.isArray(groups) && groups.length) {
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
        const pid = (typeof __ssGetCurrentPidFallback === "function" ? __ssGetCurrentPidFallback() : "") || String(product?.productId || "").trim();
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
    try { if (typeof window.__ssHideProductPageSkeleton === 'function') window.__ssHideProductPageSkeleton(); } catch {}
}

  try {
    window.__ssSafeCatalogFlat = __ssSafeCatalogFlat;
    window.__ssNormalizeNameKey = __ssNormalizeNameKey;
    window.__ssProductLooksRicher = __ssProductLooksRicher;
    window.__ssGetProductImageCandidates = __ssGetProductImageCandidates;
    window.__ssResolveProductForPdp = __ssResolveProductForPdp;
    window.__ssBuildProductPageSkeletonHtml = __ssBuildProductPageSkeletonHtml;
    window.__ssShowProductPageSkeleton = __ssShowProductPageSkeleton;
    window.__ssHideProductPageSkeleton = __ssHideProductPageSkeleton;
    window.handleSwipeGesture = handleSwipeGesture;
  } catch {}

  window.__SS_PRODUCT__ = {
    buyNow,
    updateImage,
    GoToProductPage,
    renderProductPage,
    __ssResolveProductForPdp,
    __ssBuildProductPageSkeletonHtml,
    __ssShowProductPageSkeleton,
    __ssHideProductPageSkeleton,
    handleSwipeGesture
  };
})(window, document);
