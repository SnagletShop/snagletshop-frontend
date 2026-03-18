(function (window, document) {
function getProductCardComponent() {
    return window.__SS_RESOLVE__?.resolve?.('component.productCard', window.__SS_PRODUCT_CARD__ || null) || window.__SS_PRODUCT_CARD__ || null;
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

        navigate("loadProducts", [window.currentCategory || lastCategory || Object.keys(window.productsDatabase || window.products || {}).find(k => k !== 'Default_Page' && Array.isArray((window.productsDatabase || window.products || {})[k]) && (window.productsDatabase || window.products || {})[k].length) || "Default_Page", localStorage.getItem("defaultSort") || "NameFirst", window.currentSortOrder || "asc"]);
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
            const productDiv = getProductCardComponent()?.createProductCard?.(product, {
                displayName: (__ssABGetProductName(product) || product.name),
                displayDescription: ((__ssABGetProductDescription(product) || product.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER),
                priceValue: (__ssResolveVariantPriceEUR(product, [], "") || product.price),
                currencySymbol: '€',
                onOpenProduct: () => {
                    navigate("GoToProductPage", [
                        product.name,
                        (__ssResolveVariantPriceEUR(product, [], "") || product.price),
                        ((__ssABGetProductDescription(product) || product.description) || TEXTS.PRODUCT_SECTION.DESCRIPTION_PLACEHOLDER)
                    ]);
                },
                onDecrease: (key) => decreaseQuantity(key),
                onIncrease: (key) => increaseQuantity(key),
                onAddToCart: () => {
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
