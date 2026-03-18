(function (window, document) {
function getProductCardComponent() {
    return window.__SS_RESOLVE__?.resolve?.('component.productCard', window.__SS_PRODUCT_CARD__ || null) || window.__SS_PRODUCT_CARD__ || null;
}
function getSearchInputs() {
    return [document.getElementById('Search_Bar'), document.getElementById('Mobile_Search_Bar')].filter(Boolean);
}
function getCatalog() {
    const base = window.products || window.productsDatabase || {};
    return (base && typeof base === 'object') ? base : {};
}
function getPrimaryImage(product) {
    const fix = window.__SS_CATALOG_IMAGE_RUNTIME__?.fixImageUrl;
    const vals = [product?.image, ...(Array.isArray(product?.images) ? product.images : []), ...(Array.isArray(product?.imagesB) ? product.imagesB : [])]
      .map(v => typeof fix === 'function' ? fix(v) : String(v || '').trim())
      .filter(Boolean);
    return vals[0] || '';
}
function syncInputs(value) {
    getSearchInputs().forEach(el => { try { el.value = value; } catch {} });
}
function setupSearchInputs() {
    const inputs = getSearchInputs();
    if (!inputs.length) {
        console.warn('⚠️ Search inputs not found; skipping search binding.');
        return;
    }
    const handleSearch = (query) => {
        const trimmed = String(query || '').trim();
        syncInputs(trimmed);
        if (trimmed.length > 0) {
            try { if (typeof window.trackSearch === 'function') window.trackSearch(trimmed); } catch {}
            try { if (typeof window.navigate === 'function') return window.navigate('searchQuery', [trimmed]); } catch {}
            return searchProducts(trimmed);
        }
        const db = getCatalog();
        const fallbackCategory = window.currentCategory || window.lastCategory || Object.keys(db).find(k => k !== 'Default_Page' && Array.isArray(db[k]) && db[k].length) || 'Default_Page';
        try { return window.navigate?.('loadProducts', [fallbackCategory, localStorage.getItem('defaultSort') || 'NameFirst', window.currentSortOrder || 'asc']); } catch {}
    };
    const debounced = window.debounce ? window.debounce(handleSearch, 300) : handleSearch;
    inputs.forEach(input => {
        input.addEventListener('input', () => debounced(input.value));
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(input.value); } });
    });
}
function searchQuery(query) {
    const normalized = String(query || '').trim();
    syncInputs(normalized);
    return searchProducts(normalized);
}
function searchProducts(forcedQuery = null) {
    const inputs = getSearchInputs();
    const activeElement = document.activeElement;
    let rawQuery = typeof forcedQuery === 'string' ? forcedQuery : '';
    if (!rawQuery) {
        const activeInput = inputs.find(el => el === activeElement);
        rawQuery = activeInput?.value || inputs[0]?.value || '';
    }
    const query = String(rawQuery || '').toLowerCase().replace(/\s+/g, '').trim();
    if (!query) return;
    syncInputs(rawQuery);
    const viewer = document.getElementById('Viewer');
    if (!viewer) return;
    viewer.innerHTML = '';
    const catalog = getCatalog();
    const results = [];
    Object.keys(catalog).forEach(category => {
        const list = Array.isArray(catalog[category]) ? catalog[category] : [];
        results.push(...list.filter(product => {
            if (!product || !product.name) return false;
            const normalizedName = String(product.name).toLowerCase().replace(/\s+/g, '');
            const normalizedDescription = String(product.description || '').toLowerCase().replace(/\s+/g, '');
            return normalizedName.includes(query) || normalizedDescription.includes(query);
        }));
    });
    const uniqueResults = [];
    const seenNames = new Set();
    results.forEach(product => {
        const key = String(product?.productId || product?.id || product?.name || '').trim();
        if (!key || seenNames.has(key)) return;
        seenNames.add(key);
        uniqueResults.push(product);
    });
    if (uniqueResults.length > 0) {
        uniqueResults.forEach(product => {
            const primaryImage = getPrimaryImage(product);
            const productDiv = getProductCardComponent()?.createProductCard?.(product, {
                displayName: (window.__ssABGetProductName?.(product) || product.name),
                displayDescription: ((window.__ssABGetProductDescription?.(product) || product.description) || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER),
                priceValue: (window.__ssResolveVariantPriceEUR?.(product, [], '') || product.price),
                currencySymbol: window.TEXTS?.CURRENCIES?.EUR || '€',
                onOpenProduct: () => {
                    window.navigate?.('GoToProductPage', [
                        product.name,
                        (window.__ssResolveVariantPriceEUR?.(product, [], '') || product.price),
                        ((window.__ssABGetProductDescription?.(product) || product.description) || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER),
                        primaryImage || null,
                        (product.productId || product.id || null),
                        null
                    ]);
                },
                onDecrease: (key) => window.decreaseQuantity?.(key),
                onIncrease: (key) => window.increaseQuantity?.(key),
                onAddToCart: () => {
                    const fn = window.addToCart || window.__SS_BASKET__?.addToCart;
                    fn?.(
                        product.name,
                        product.price,
                        primaryImage || '',
                        product.expectedPurchasePrice,
                        product.productLink,
                        product.description,
                        '',
                        window.__ssDefaultSelectedOptions?.(window.__ssExtractOptionGroups?.(product)),
                        (product.productId || product.id || null)
                    );
                }
            }) || document.createElement('div');
            viewer.appendChild(productDiv);
        });
    } else {
        viewer.innerHTML = '<p>No products found.</p>';
    }
}
  window.__SS_SEARCH__ = {
    setupSearchInputs,
    searchQuery,
    searchProducts
  };
})(window, document);
