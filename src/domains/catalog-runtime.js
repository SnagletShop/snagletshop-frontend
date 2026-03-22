(function (window) {
  'use strict';

  let initProductsPromise = null;

function parseMaybeJson(value) {
    if (typeof value !== "string") return value;
    const s = value.trim();
    if (!s) return value;
    if (!(s.startsWith("{") || s.startsWith("["))) return value;
    try { return JSON.parse(s); } catch { return value; }
}

function parseLoosePrice(value) {
    try {
        if (typeof window.__ssParsePriceEUR === "function") return window.__ssParsePriceEUR(value);
    } catch {}
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;
    let s = value.trim();
    if (!s) return 0;
    s = s.replace(/[^0-9,.\-]/g, "");
    if (!s) return 0;
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");
    if (hasComma && hasDot) {
        if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(/,/g, ".");
        else s = s.replace(/,/g, "");
    } else if (hasComma) {
        s = s.replace(/,/g, ".");
    }
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : 0;
}

function collectPositivePrice(out, value) {
    const num = parseLoosePrice(value);
    if (Number.isFinite(num) && num > 0) out.push(num);
}

function collectNestedPriceCandidates(out, value, depth = 0, seen = null) {
    if (depth > 6 || value == null) return;
    value = parseMaybeJson(value);
    if (Array.isArray(value)) {
        value.forEach((entry) => collectNestedPriceCandidates(out, entry, depth + 1, seen));
        return;
    }
    if (typeof value === "object") {
        if (typeof WeakSet !== "undefined") {
            seen = seen || new WeakSet();
            if (seen.has(value)) return;
            seen.add(value);
        }
        collectPositivePrice(out, value.price);
        collectPositivePrice(out, value.priceEUR);
        collectPositivePrice(out, value.basePrice);
        collectPositivePrice(out, value.sellPrice);
        collectPositivePrice(out, value.priceB);
        collectPositivePrice(out, value.addPrice);
        Object.values(value).forEach((entry) => collectNestedPriceCandidates(out, entry, depth + 1, seen));
        return;
    }
    collectPositivePrice(out, value);
}

function resolveCatalogProductPrice(product) {
    const prices = [];
    try { collectPositivePrice(prices, window.__ssResolveVariantPriceEUR?.(product, [], "")); } catch {}
    collectPositivePrice(prices, product?.price);
    collectPositivePrice(prices, product?.priceEUR);
    collectPositivePrice(prices, product?.basePrice);
    collectPositivePrice(prices, product?.sellPrice);
    collectPositivePrice(prices, product?.priceB);
    collectNestedPriceCandidates(prices, product?.variantPrices);
    collectNestedPriceCandidates(prices, product?.variantPricesB);
    collectNestedPriceCandidates(prices, product?.variants);
    collectNestedPriceCandidates(prices, product?.options);
    return prices.length ? Math.min(...prices) : 0;
}

function hydrateRememberedPrice(product, remembered) {
    const price = Number(remembered || 0);
    if (!Number.isFinite(price) || price <= 0 || !product || typeof product !== "object") return 0;
    if (!(parseLoosePrice(product.price) > 0)) product.price = price;
    if (!(parseLoosePrice(product.priceEUR) > 0)) product.priceEUR = price;
    if (!(parseLoosePrice(product.basePrice) > 0)) product.basePrice = price;
    if (!(parseLoosePrice(product.sellPrice) > 0)) product.sellPrice = price;
    return price;
}

function reconcileCatalogPrices(productsById, catalogLike) {
    const seen = new Set();
    const visit = (product) => {
        if (!product || typeof product !== "object") return;
        const pid = String(product?.productId || product?.id || "").trim();
        const name = String(product?.name || "").trim().toLowerCase();
        const key = pid ? `id:${pid}` : (name ? `name:${name}` : "");
        if (key && seen.has(key)) return;
        if (key) seen.add(key);

        const direct = resolveCatalogProductPrice(product);
        if (direct > 0) {
            try { window.__ssRememberProductPrice?.(product, direct); } catch {}
            return;
        }

        let remembered = 0;
        try { remembered = Number(window.__ssGetRememberedProductPrice?.(product) || 0); } catch {}
        if (Number.isFinite(remembered) && remembered > 0) hydrateRememberedPrice(product, remembered);
    };

    Object.values(productsById || {}).forEach(visit);
    Object.values(catalogLike || {}).forEach((list) => {
        (Array.isArray(list) ? list : []).forEach(visit);
    });
}

function __ssPublishCatalogLookups(productsById, catalogLike) {
    try {
        const byId = (productsById && typeof productsById === "object") ? productsById : {};
        const flat = Object.values(catalogLike || {})
            .flat()
            .filter(p => p && typeof p === "object" && !Array.isArray(p) && typeof p.name === "string" && p.name.trim());
        const derivedById = {};
        for (const product of flat) {
            const pid = String(product?.productId || "").trim();
            if (pid && !derivedById[pid]) derivedById[pid] = product;
        }
        window.productsById = Object.keys(byId).length ? { ...byId } : derivedById;
        window.productsFlatFromServer = flat;
    } catch {}
}

function reconcileRememberedPrices() {
    try {
        reconcileCatalogPrices(window.productsById || {}, window.productsDatabase || window.products || {});
    } catch {}
    return window.products || window.productsDatabase || {};
}

function initProducts() {
    if (initProductsPromise) return initProductsPromise;

    initProductsPromise = (async () => {
        try {
            const productsPayload = await window.__SS_CATALOG_API__.getCatalog();

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

                reconcileCatalogPrices(productsById, resolvedCatalog);

                window.__ssSetProductsDatabase ? window.__ssSetProductsDatabase(resolvedCatalog) : (window.productsDatabase = resolvedCatalog, window.products = resolvedCatalog);
                __ssPublishCatalogLookups(productsById, resolvedCatalog);
                reconcileRememberedPrices();
                (window.__ssNormalizeCatalogImages || window.__SS_CATALOG_IMAGE_RUNTIME__?.normalizeCatalogImages || (()=>{}))(window.productsDatabase || window.products || {});

                const cfg = productsPayload.config || {};
                if (typeof cfg.applyTariff === "boolean") {
                    window.serverApplyTariff = cfg.applyTariff;
                    localStorage.setItem("applyTariff", String(window.serverApplyTariff));
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

            reconcileCatalogPrices(null, deduped);

            window.__ssSetProductsDatabase ? window.__ssSetProductsDatabase(deduped) : (window.productsDatabase = deduped, window.products = deduped);
            __ssPublishCatalogLookups(null, deduped);
            reconcileRememberedPrices();
            (window.__ssNormalizeCatalogImages || window.__SS_CATALOG_IMAGE_RUNTIME__?.normalizeCatalogImages || (()=>{}))(window.productsDatabase || window.products || {});

            if (typeof cfg.applyTariff === "boolean") {
                window.serverApplyTariff = cfg.applyTariff;
                localStorage.setItem("applyTariff", String(window.serverApplyTariff));
            }

            console.log("✅ Products data loaded.");
        } catch (err) {
            console.error("❌ Failed to load products from server, falling back to window.products:", err);
            window.__ssSetProductsDatabase ? window.__ssSetProductsDatabase(window.products || window.productsDatabase || {}) : (window.productsDatabase = window.products || {}, window.products = window.products || {});
            __ssPublishCatalogLookups(null, window.products || window.productsDatabase || {});
        }

        return window.products;
    })();

    return initProductsPromise;
}

// Kick off loading immediately when the script is loaded
initProducts();
  window.__SS_CATALOG_RUNTIME__ = { initProducts, reconcileRememberedPrices };
})(window);
