(function (window) {
  'use strict';

  let initProductsPromise = null;

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

                window.__ssSetProductsDatabase ? window.__ssSetProductsDatabase(resolvedCatalog) : (window.productsDatabase = resolvedCatalog, window.products = resolvedCatalog);
                __ssNormalizeCatalogImages(window.productsDatabase || window.products || {});

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

            window.__ssSetProductsDatabase ? window.__ssSetProductsDatabase(deduped) : (window.productsDatabase = deduped, window.products = deduped);
            __ssNormalizeCatalogImages(window.productsDatabase || window.products || {});

            if (typeof cfg.applyTariff === "boolean") {
                window.serverApplyTariff = cfg.applyTariff;
                localStorage.setItem("applyTariff", String(window.serverApplyTariff));
            }

            console.log("✅ Products data loaded.");
        } catch (err) {
            console.error("❌ Failed to load products from server, falling back to window.products:", err);
            window.__ssSetProductsDatabase ? window.__ssSetProductsDatabase(window.products || window.productsDatabase || {}) : (window.productsDatabase = window.products || {}, window.products = window.products || {});
        }

        return window.products;
    })();

    return initProductsPromise;
}

// Kick off loading immediately when the script is loaded
initProducts();


  window.__SS_CATALOG_RUNTIME__ = { initProducts };
})(window);
