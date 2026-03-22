(function (window, document) {
  'use strict';

  function getFirstRenderableCategory(productsDatabase = {}, products = {}) {
    const source = (products && typeof products === 'object' && Object.keys(products).length) ? products : productsDatabase;
    return Object.keys(source || {}).find(k => k !== 'Default_Page' && Array.isArray(source[k]) && source[k].length) ||
      Object.keys(productsDatabase || {}).find(k => k !== 'Default_Page' && Array.isArray(productsDatabase[k]) && productsDatabase[k].length) ||
      'Default_Page';
  }

  function sortProducts(productList, sortBy, sortOrder) {
    productList.sort((a, b) => {
      if (sortBy === 'Cheapest') return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      if (sortBy === 'Priciest') return sortOrder === 'asc' ? b.price - a.price : a.price - b.price;
      if (sortBy === 'NameFirst') return sortOrder === 'asc' ? String(a?.name || '').localeCompare(String(b?.name || '')) : String(b?.name || '').localeCompare(String(a?.name || ''));
      if (sortBy === 'NameLast') return sortOrder === 'asc' ? String(b?.name || '').localeCompare(String(a?.name || '')) : String(a?.name || '').localeCompare(String(b?.name || ''));
      return 0;
    });
    return productList;
  }

  const api = {
    categoryButtons(ctx = {}) {
      const sidebars = document.querySelectorAll('#SideBar, #DesktopSidebar');
      const productsDatabase = ctx.getProductsDatabase?.() || {};
      if (!productsDatabase || Object.keys(productsDatabase).length === 0) {
        console.error('❌ Products database not loaded yet.');
        return;
      }
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
        });
      });
    },
    clearCategoryHighlight(ctx = {}) {
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
      if (!root.dataset.bound) {
        root.dataset.bound = '1';
        trigger.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(); });
        items.forEach(btn => btn.addEventListener('click', () => { const val = btn.dataset.value; setSelectedByValue(val); api.handleSortChange(ctx, val); closeMenu(); }));
        document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('#SortContainer')) closeMenu(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });
      }
    },
    renderCatalogProducts(ctx = {}, category, sortBy = 'NameFirst', sortOrder = 'asc') {
      ctx.setLastCategory?.(category);
      if (window.matchMedia('(max-width: 680px)').matches) window.scrollTo({ top: 0, behavior: 'smooth' });
      sortBy = sortBy || 'NameFirst';
      sortOrder = sortOrder || 'asc';
      const productsDatabase = ctx.getProductsDatabase?.() || {};
      category = category || getFirstRenderableCategory(productsDatabase, ctx.getProducts?.() || {});
      if (category === 'Default_Page' || !Array.isArray((ctx.getProducts?.() || {})[category])) {
        category = getFirstRenderableCategory(productsDatabase, ctx.getProducts?.() || {});
      }
      ctx.setWindowCurrentSortOrder?.(sortOrder);
      ctx.setWindowCurrentCategory?.(category);
      ctx.syncCentralState?.('window-category-set', { currentCategory: category });
      const viewer = document.getElementById('Viewer');
      if (!viewer) return;
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
      const products = ctx.getProducts?.() || {};
      if ((category === 'Default_Page' || !products.hasOwnProperty(category) || !Array.isArray(products[category])) && getFirstRenderableCategory(productsDatabase, products) !== 'Default_Page') {
        category = getFirstRenderableCategory(productsDatabase, products);
        ctx.setWindowCurrentCategory?.(category);
        ctx.setCurrentCategory?.(category);
      }
      if (!products.hasOwnProperty(category) || !Array.isArray(products[category])) {
        console.warn(`⚠️ Category '${category}' is invalid or does not contain a valid product list.`);
        return;
      }
      const productList = sortProducts([...(products[category] || [])], sortBy, sortOrder);
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
        const productDiv = ctx.createProductCard?.(product, {
          displayName: (ctx.getABProductName?.(product) || product.name),
          displayDescription: ((ctx.getABProductDescription?.(product) || product.description) || ctx.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER),
          priceValue: (ctx.resolveVariantPriceEUR?.(product, [], '') || product.price),
          currencySymbol: ctx.TEXTS?.CURRENCIES?.EUR || '€',
          onOpenProduct: () => { const __img = String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '').trim(); return ctx.navigate?.('GoToProductPage', [product.name, (ctx.resolveVariantPriceEUR?.(product, [], '') || product.price), ((ctx.getABProductDescription?.(product) || product.description) || ctx.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER), __img, (product.productId || null), null]); },
          onDecrease: (key) => ctx.decreaseQuantity?.(key),
          onIncrease: (key) => ctx.increaseQuantity?.(key),
          onAddToCart: () => { const __img = String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '').trim(); const __price = (ctx.resolveVariantPriceEUR?.(product, [], '') || product.price || product.priceEUR || product.basePrice || 0); const __ret = ctx.addToCart?.(product.name, __price, __img, product.expectedPurchasePrice, product.productLink, (ctx.getABProductDescription?.(product) || product.description), '', ctx.defaultSelectedOptions?.(ctx.extractOptionGroups?.(product)), (product.productId || null)); try { ctx.updateBasketHeaderIndicator?.(); } catch {} return __ret; }
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
})(window, document);
