(function (window, document) {
  'use strict';

  let categoryRetryTimer = null;

  function getFirstRenderableCategory(productsDatabase = {}, products = {}) {
    const source = (products && typeof products === 'object' && Object.keys(products).length) ? products : productsDatabase;
    return Object.keys(source || {}).find(k => k !== 'Default_Page' && Array.isArray(source[k]) && source[k].length) ||
      Object.keys(productsDatabase || {}).find(k => k !== 'Default_Page' && Array.isArray(productsDatabase[k]) && productsDatabase[k].length) ||
      'Default_Page';
  }

  function getDefaultLandingCategory(productsDatabase = {}, products = {}) {
    const source = (products && typeof products === 'object' && Object.keys(products).length) ? products : productsDatabase;
    if (Array.isArray(source?.Default_Page) && source.Default_Page.length) return 'Default_Page';
    if (Array.isArray(productsDatabase?.Default_Page) && productsDatabase.Default_Page.length) return 'Default_Page';
    return getFirstRenderableCategory(productsDatabase, products);
  }

  function hasRenderableCategory(products = {}, category) {
    return !!(category && products && Object.prototype.hasOwnProperty.call(products, category) && Array.isArray(products[category]));
  }

  function parseMaybeJson(value) {
    if (typeof value !== 'string') return value;
    const s = value.trim();
    if (!s) return value;
    if (!(s.startsWith('{') || s.startsWith('['))) return value;
    try { return JSON.parse(s); } catch { return value; }
  }

  function parseLoosePrice(value) {
    try {
      if (typeof window.__ssParsePriceEUR === 'function') return window.__ssParsePriceEUR(value);
    } catch {}
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;
    let s = value.trim();
    if (!s) return 0;
    s = s.replace(/[^0-9,.\-]/g, '');
    if (!s) return 0;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
      else s = s.replace(/,/g, '');
    } else if (hasComma) {
      s = s.replace(/,/g, '.');
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
    if (typeof value === 'object') {
      if (typeof WeakSet !== 'undefined') {
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

  function collectPositivePriceArray(out, list) {
    collectNestedPriceCandidates(out, list);
  }

  function resolveCatalogProductPrice(product, ctx = {}) {
    const prices = [];
    const identity = {
      productId: String(product?.productId || product?.id || '').trim(),
      name: String(product?.name || '').trim()
    };
    try { collectPositivePrice(prices, ctx.resolveVariantPriceEUR?.(product, [], '')); } catch {}
    collectPositivePrice(prices, product?.price);
    collectPositivePrice(prices, product?.priceEUR);
    collectPositivePrice(prices, product?.basePrice);
    collectPositivePrice(prices, product?.sellPrice);
    collectPositivePrice(prices, product?.priceB);
    collectNestedPriceCandidates(prices, product?.variantPrices);
    collectNestedPriceCandidates(prices, product?.variantPricesB);
    collectPositivePriceArray(prices, product?.variants);
    collectPositivePriceArray(prices, product?.options);
    const resolved = prices.length ? Math.min(...prices) : 0;
    if (resolved > 0) {
      try { window.__ssRememberProductPrice?.(identity, resolved); } catch {}
      return resolved;
    }
    try {
      const remembered = Number(window.__ssGetRememberedProductPrice?.(identity) || 0);
      if (Number.isFinite(remembered) && remembered > 0) return remembered;
    } catch {}
    return 0;
  }

  function sortProducts(productList, sortBy, sortOrder, resolvePrice = null) {
    const getPrice = (product) => {
      const resolved = (typeof resolvePrice === 'function') ? Number(resolvePrice(product)) : Number(product?.price);
      return Number.isFinite(resolved) ? resolved : 0;
    };
    productList.sort((a, b) => {
      const priceA = getPrice(a);
      const priceB = getPrice(b);
      if (sortBy === 'Cheapest') return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      if (sortBy === 'Priciest') return sortOrder === 'asc' ? priceB - priceA : priceA - priceB;
      if (sortBy === 'NameFirst') return sortOrder === 'asc' ? String(a?.name || '').localeCompare(String(b?.name || '')) : String(b?.name || '').localeCompare(String(a?.name || ''));
      if (sortBy === 'NameLast') return sortOrder === 'asc' ? String(b?.name || '').localeCompare(String(a?.name || '')) : String(a?.name || '').localeCompare(String(b?.name || ''));
      return 0;
    });
    return productList;
  }

  function resolveUiCtx(ctx = {}) {
    if (ctx && typeof ctx === 'object' && Object.keys(ctx).length) return ctx;
    try {
      const fallback = window.__SS_CATALOG_UI_CTX__ || null;
      if (fallback && typeof fallback === 'object') return fallback;
    } catch {}
    return ctx || {};
  }

  function scheduleCategoryButtonsRetry(ctx = {}) {
    if (categoryRetryTimer) return;
    categoryRetryTimer = window.setTimeout(() => {
      categoryRetryTimer = null;
      try { api.categoryButtons(resolveUiCtx(ctx)); } catch {}
    }, 180);
  }

  const api = {
    categoryButtons(ctx = {}) {
      ctx = resolveUiCtx(ctx);
      const sidebars = document.querySelectorAll('.mobileSideBar, #SideBar, #DesktopSidebar');
      const productsDatabase = ctx.getProductsDatabase?.() || {};
      if (!sidebars.length) {
        scheduleCategoryButtonsRetry(ctx);
        return;
      }
      if (!productsDatabase || Object.keys(productsDatabase).length === 0) {
        console.error('❌ Products database not loaded yet.');
        scheduleCategoryButtonsRetry(ctx);
        return;
      }
      let renderedButtons = 0;
      sidebars.forEach(sidebar => {
        if (!sidebar) return;
        const categoryContainer = sidebar.querySelector('.sidebar-categories') || sidebar;
        while (categoryContainer.firstChild) categoryContainer.removeChild(categoryContainer.firstChild);
        Object.entries(productsDatabase).forEach(([category, catArray]) => {
          if (category === 'Default_Page' || !Array.isArray(catArray)) return;
          const button = document.createElement('button');
          button.className = 'Category_Button';
          if (category === ctx.getCurrentCategory?.()) button.classList.add('Active');
          button.onclick = () => {
            ctx.setCurrentCategory?.(category);
            ctx.syncCentralState?.('category-selected', { currentCategory: category });
            const sort = ctx.getDefaultSort?.() || 'NameFirst';
            ctx.navigate?.('loadProducts', [category, sort, 'asc']);
            api.categoryButtons(ctx);
          };
          const heading = document.createElement('h3');
          heading.classList.add('Category_Button_Heading');
          const iconValue = (catArray.length > 0) ? (catArray[0].iconPng || catArray[0].iconPngUrl || catArray[0].iconUrl || catArray[0].icon || null) : null;
          let iconPath = iconValue;
          if (typeof iconPath === 'string') {
            const s = iconPath.trim();
            if (s.startsWith('{') && s.endsWith('}')) {
              try {
                const obj = JSON.parse(s);
                if (obj && typeof obj === 'object') {
                  const light = String(obj.light || obj.l || obj.url || obj.icon || '').trim();
                  const dark = String(obj.dark || obj.d || '').trim();
                  iconPath = (ctx.isDarkModeEnabled?.() ? (dark || light) : (light || dark)) || iconPath;
                }
              } catch {}
            }
          }
          const displayName = String(category || '').replace(/_/g, ' ');
          if (iconPath) {
            const isImageIcon = typeof iconPath === 'string' && (
              iconPath.startsWith('http://') || iconPath.startsWith('https://') || iconPath.startsWith('data:image/') || /\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(iconPath)
            );
            heading.innerHTML = isImageIcon ? `
              <span class="category-icon-wrapper"><img class="category-icon-img" src="${iconPath}" alt="${displayName} icon" /></span>
              <span class="category-label">${displayName}</span>
            ` : `
              <span class="category-icon-wrapper"><svg viewBox="0 0 24 24" class="category-icon-svg"><path d="${iconPath}" /></svg></span>
              <span class="category-label">${displayName}</span>
            `;
          } else {
            heading.textContent = displayName;
          }
          button.appendChild(heading);
          categoryContainer.appendChild(button);
          renderedButtons += 1;
        });
      });
      if (!renderedButtons) scheduleCategoryButtonsRetry(ctx);
    },
    clearCategoryHighlight(ctx = {}) {
      ctx = resolveUiCtx(ctx);
      document.querySelectorAll('.Category_Button').forEach(button => button.classList.remove('Active'));
      ctx.setCurrentCategory?.(null);
      ctx.syncCentralState?.('category-cleared', { currentCategory: null });
    },
    syncSortSelects(ctx = {}, newSort) {
      document.querySelectorAll('#defaultSort').forEach(select => {
        if (select && select.value !== newSort) select.value = newSort;
      });
      try { api.setupSortDropdown(ctx, newSort); } catch {}
    },
    handleSortChange(ctx = {}, newSort) {
      ctx.lsSet?.('defaultSort', newSort);
      api.syncSortSelects(ctx, newSort);
      if (typeof ctx.getWindowCurrentCategory?.() !== 'undefined') {
        if (ctx.isReplaying?.()) {
          ctx.loadProducts?.(ctx.getWindowCurrentCategory?.(), newSort, ctx.getWindowCurrentSortOrder?.() || 'asc');
        } else {
          ctx.navigate?.('loadProducts', [ctx.getWindowCurrentCategory?.() || ctx.getLastCategory?.() || 'Default_Page', newSort, ctx.getWindowCurrentSortOrder?.() || 'asc']);
        }
      }
    },
    updateSorting(ctx = {}) {
      const selectedSort = document.getElementById('sortSelect')?.value || document.getElementById('SSSort')?.dataset?.value || null;
      if (selectedSort) api.handleSortChange(ctx, selectedSort);
    },
    setupSortDropdown(ctx = {}, currentSort) {
      const root = document.getElementById('SSSort');
      const trigger = document.getElementById('SSSortTrigger');
      const triggerText = document.getElementById('SSSortTriggerText');
      const menu = document.getElementById('SSSortMenu');
      if (!root || !trigger || !triggerText || !menu) return;
      const items = Array.from(menu.querySelectorAll('.SSSortItem'));
      function openMenu(){ menu.hidden = false; trigger.setAttribute('aria-expanded', 'true'); }
      function closeMenu(){ menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
      function toggleMenu(){ if (menu.hidden) openMenu(); else closeMenu(); }
      function setSelectedByValue(val) {
        const btn = items.find(b => b.dataset.value === val) || items[0];
        items.forEach(b => {
          const selected = b === btn;
          b.classList.toggle('is-selected', selected);
          b.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
        triggerText.textContent = btn.querySelector('.SSSortItemLabel')?.textContent || '';
        root.dataset.value = btn.dataset.value;
      }
      if (currentSort) setSelectedByValue(currentSort);
      try {
        window.__ssSortDropdownActiveMenu = menu;
        window.__ssSortDropdownRoot = root;
      } catch {}
      if (!root.dataset.bound) {
        root.dataset.bound = '1';
        trigger.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(); });
        items.forEach(btn => btn.addEventListener('click', () => { const val = btn.dataset.value; setSelectedByValue(val); api.handleSortChange(ctx, val); closeMenu(); }));
      }
      if (!window.__ssSortDropdownDocumentBound) {
        window.__ssSortDropdownDocumentBound = true;
        document.addEventListener('click', (e) => {
          try {
            const activeMenu = window.__ssSortDropdownActiveMenu;
            if (!activeMenu || activeMenu.hidden) return;
            if (!e.target.closest('#SortContainer')) activeMenu.hidden = true;
            const activeRoot = window.__ssSortDropdownRoot;
            const activeTrigger = activeRoot?.querySelector?.('#SSSortTrigger');
            if (activeTrigger) activeTrigger.setAttribute('aria-expanded', activeMenu.hidden ? 'false' : 'true');
          } catch {}
        });
        document.addEventListener('keydown', (e) => {
          if (e.key !== 'Escape') return;
          try {
            const activeMenu = window.__ssSortDropdownActiveMenu;
            if (!activeMenu || activeMenu.hidden) return;
            activeMenu.hidden = true;
            const activeRoot = window.__ssSortDropdownRoot;
            const activeTrigger = activeRoot?.querySelector?.('#SSSortTrigger');
            if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'false');
          } catch {}
        });
      }
    },
    renderCatalogProducts(ctx = {}, category, sortBy = 'NameFirst', sortOrder = 'asc') {
      ctx.setLastCategory?.(category);
      if (window.matchMedia('(max-width: 680px)').matches) window.scrollTo({ top: 0, behavior: 'smooth' });
      sortBy = sortBy || 'NameFirst';
      sortOrder = sortOrder || 'asc';
      const productsDatabase = ctx.getProductsDatabase?.() || {};
      const catalogProducts = ctx.getProducts?.() || {};
      category = category || getDefaultLandingCategory(productsDatabase, catalogProducts);
      if (!hasRenderableCategory(catalogProducts, category)) {
        category = getDefaultLandingCategory(productsDatabase, catalogProducts);
      }
      ctx.setWindowCurrentSortOrder?.(sortOrder);
      ctx.setWindowCurrentCategory?.(category);
      ctx.syncCentralState?.('window-category-set', { currentCategory: category });
      const viewer = document.getElementById('Viewer');
      if (!viewer) return;
      try { window.__ssPrimePriceCacheFromDom?.(viewer); } catch {}
      viewer.innerHTML = '';
      if (category === 'Default_Page') api.clearCategoryHighlight(ctx);
      let wrapper = document.getElementById('ProductWrapper');
      if (!wrapper && viewer.parentNode) {
        wrapper = document.createElement('div');
        wrapper.id = 'ProductWrapper';
        viewer.parentNode.insertBefore(wrapper, viewer);
        wrapper.appendChild(viewer);
      }
      viewer.innerHTML = '';
      ctx.setCart?.({});
      ctx.syncCentralState?.('cart-cleared', { cart: ctx.getCart?.() || {} });
      if (!hasRenderableCategory(catalogProducts, category) && getDefaultLandingCategory(productsDatabase, catalogProducts) !== category) {
        category = getDefaultLandingCategory(productsDatabase, catalogProducts);
        ctx.setWindowCurrentCategory?.(category);
        ctx.setCurrentCategory?.(category);
      }
      if (!hasRenderableCategory(catalogProducts, category)) {
        console.warn(`⚠️ Category '${category}' is invalid or does not contain a valid product list.`);
        return;
      }
      const resolvePrice = (product) => resolveCatalogProductPrice(product, ctx);
      const productList = sortProducts([...(catalogProducts[category] || [])], sortBy, sortOrder, resolvePrice);
      ctx.removeSortContainer?.();
      let sortContainer = document.getElementById('SortContainer');
      if (!sortContainer && wrapper) {
        sortContainer = document.createElement('div');
        sortContainer.id = 'SortContainer';
        sortContainer.className = 'SortContainer';
        const TEXTS = ctx.TEXTS || {};
        sortContainer.innerHTML = `
          <div class="SSSort" id="SSSort">
            <div class="SSSortLabel">${TEXTS?.SORTING?.LABEL || 'Sort by'}</div>
            <button class="SSSortTrigger" id="SSSortTrigger" type="button" aria-haspopup="listbox" aria-expanded="false">
              <span class="SSSortTriggerText" id="SSSortTriggerText">${TEXTS?.SORTING?.OPTIONS?.NAME_ASC || 'Name A–Z'}</span>
              <span class="SSSortChevron" aria-hidden="true"></span>
            </button>
            <div class="SSSortMenu" id="SSSortMenu" role="listbox" tabindex="-1" hidden>
              <button class="SSSortItem" type="button" role="option" data-value="NameFirst" aria-selected="false"><span class="SSSortItemLabel">${TEXTS?.SORTING?.OPTIONS?.NAME_ASC || 'Name A–Z'}</span><span class="SSSortCheck" aria-hidden="true"></span></button>
              <button class="SSSortItem" type="button" role="option" data-value="NameLast" aria-selected="false"><span class="SSSortItemLabel">${TEXTS?.SORTING?.OPTIONS?.NAME_DESC || 'Name Z–A'}</span><span class="SSSortCheck" aria-hidden="true"></span></button>
              <button class="SSSortItem" type="button" role="option" data-value="Cheapest" aria-selected="false"><span class="SSSortItemLabel">${TEXTS?.SORTING?.OPTIONS?.PRICE_ASC || 'Price low–high'}</span><span class="SSSortCheck" aria-hidden="true"></span></button>
              <button class="SSSortItem" type="button" role="option" data-value="Priciest" aria-selected="false"><span class="SSSortItemLabel">${TEXTS?.SORTING?.OPTIONS?.PRICE_DESC || 'Price high–low'}</span><span class="SSSortCheck" aria-hidden="true"></span></button>
            </div>
          </div>`;
        wrapper.insertBefore(sortContainer, viewer);
      }
      try { api.setupSortDropdown(ctx, sortBy); } catch (e) { console.warn('Sort dropdown setup failed:', e); }
      productList.forEach(product => {
        if (!product?.name) return;
        ctx.setCartItemQty?.(product.name, 1);
        const resolvedPrice = resolvePrice(product);
        const productDiv = ctx.createProductCard?.(product, {
          displayName: (ctx.getABProductName?.(product) || product.name),
          displayDescription: ((ctx.getABProductDescription?.(product) || product.description) || ctx.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER),
          priceValue: resolvedPrice,
          currencySymbol: ctx.TEXTS?.CURRENCIES?.EUR || '€',
          onOpenProduct: () => { const __img = String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '').trim(); return ctx.navigate?.('GoToProductPage', [product.name, resolvedPrice, ((ctx.getABProductDescription?.(product) || product.description) || ctx.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER), __img, (product.productId || null), null]); },
          onDecrease: (key) => ctx.decreaseQuantity?.(key),
          onIncrease: (key) => ctx.increaseQuantity?.(key),
          onAddToCart: () => { const __img = String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '').trim(); const __price = resolvePrice(product); const __ret = ctx.addToCart?.(product.name, __price, __img, product.expectedPurchasePrice, product.productLink, (ctx.getABProductDescription?.(product) || product.description), '', ctx.defaultSelectedOptions?.(ctx.extractOptionGroups?.(product)), (product.productId || null)); try { ctx.updateBasketHeaderIndicator?.(); } catch {} return __ret; }
        }) || document.createElement('div');
        viewer.appendChild(productDiv);
      });
      try { ctx.preloadProductImages?.(category); } catch (e) { console.warn('⚠️ preloadProductImages failed:', e); }
      api.categoryButtons(ctx);
    }
    ,CategoryButtons(ctx = {}) { return api.categoryButtons(ctx); }
    ,ClearCategoryHighlight(ctx = {}) { return api.clearCategoryHighlight(ctx); }
  };
  window.__SS_CATALOG_UI_RUNTIME__ = api;
  window.CategoryButtons = function CategoryButtonsBridge() {
    return api.categoryButtons(resolveUiCtx(window.__SS_CATALOG_UI_CTX__ || {}));
  };
  window.ClearCategoryHighlight = function ClearCategoryHighlightBridge() {
    return api.clearCategoryHighlight(resolveUiCtx(window.__SS_CATALOG_UI_CTX__ || {}));
  };
})(window, document);
