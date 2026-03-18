(function (window, document) {
function getProductCardComponent() {
    return window.__SS_RESOLVE__?.resolve?.('component.productCard', window.__SS_PRODUCT_CARD__ || null) || window.__SS_PRODUCT_CARD__ || null;
}

function getSearchInputs() {
    return [document.getElementById("Search_Bar"), document.getElementById("Mobile_Search_Bar")].filter(Boolean);
}

function setupSearchInputs() {
    const inputs = getSearchInputs();
    if (!inputs.length) {
        console.warn("⚠️ Search inputs not found; skipping search binding.");
        return;
    }
    const handleSearch = (query) => {
        const trimmed = String(query || "").trim();
        for (const input of inputs) input.value = trimmed;
        if (trimmed.length > 0) {
            try { trackSearch(trimmed); } catch {}
            searchProducts(trimmed);
            return;
        }
        navigate("loadProducts", [window.currentCategory || window.lastCategory || Object.keys(window.productsDatabase || window.products || {}).find(k => k !== 'Default_Page' && Array.isArray((window.productsDatabase || window.products || {})[k]) && (window.productsDatabase || window.products || {})[k].length) || "Default_Page", localStorage.getItem("defaultSort") || "NameFirst", window.currentSortOrder || "asc"]);
    };
    for (const input of inputs) {
        const debounced = debounce(() => handleSearch(input.value), 250);
        input.addEventListener("input", debounced);
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(input.value); } });
    }
}

function searchQuery(query) {
    const normalized = String(query || "").trim();
    for (const input of getSearchInputs()) input.value = normalized;
    searchProducts(normalized);
}

function searchProducts(forcedQuery = null) {
    const inputs = getSearchInputs();
    const rawQuery = typeof forcedQuery === "string" ? forcedQuery : String(inputs[0]?.value || "");
    const query = rawQuery.toLowerCase().replace(/\s+/g, "").trim();
    if (!query) return;
    for (const input of inputs) input.value = rawQuery;
    const viewer = document.getElementById("Viewer");
    if (!viewer) return;
    viewer.innerHTML = "";
    const db = window.productsDatabase || window.products || {};
    let results = [];
    Object.keys(db).forEach(category => {
        const arr = Array.isArray(db[category]) ? db[category] : [];
        results.push(...arr.filter(product => {
            if (!product || !product.name) return false;
            const normalizedName = String(product.name).toLowerCase().replace(/\s+/g, "");
            const normalizedDescription = String(product.description || "").toLowerCase().replace(/\s+/g, "");
            return normalizedName.includes(query) || normalizedDescription.includes(query);
        }));
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
            const resolvedImage = String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '').trim();
            const productDiv = getProductCardComponent()?.createProductCard?.(product, {
                displayName: (window.__ssABGetProductName?.(product) || product.name),
                displayDescription: ((window.__ssABGetProductDescription?.(product) || product.description) || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER),
                priceValue: (window.__ssResolveVariantPriceEUR?.(product, [], "") || product.price),
                currencySymbol: '€',
                onOpenProduct: () => {
                    navigate("GoToProductPage", [product.name, (window.__ssResolveVariantPriceEUR?.(product, [], "") || product.price), ((window.__ssABGetProductDescription?.(product) || product.description) || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER), resolvedImage, (product.productId || null), null]);
                },
                onDecrease: (key) => window.decreaseQuantity?.(key),
                onIncrease: (key) => window.increaseQuantity?.(key),
                onAddToCart: () => {
                    window.addToCart?.(product.name, product.price, resolvedImage, product.expectedPurchasePrice, product.productLink, product.description, "", window.__ssDefaultSelectedOptions?.(window.__ssExtractOptionGroups?.(product)), (product.productId || null));
                    try { window.__ssUpdateBasketHeaderIndicator?.(); } catch {}
                }
            }) || document.createElement("div");
            viewer.appendChild(productDiv);
        });
    } else {
        viewer.innerHTML = "<p>No products found.</p>";
    }
}
  window.__SS_SEARCH__ = {
    setupSearchInputs,
    searchQuery,
    searchProducts
  };
})(window, document);
