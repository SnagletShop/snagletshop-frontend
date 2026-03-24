(function(){
  function getFirstRenderableCategory() {
    const db = (typeof window !== 'undefined' && window.productsDatabase && typeof window.productsDatabase === 'object') ? window.productsDatabase : (window.products || {});
    return Object.keys(db || {}).find(k => k !== 'Default_Page' && Array.isArray(db[k]) && db[k].length) || 'Default_Page';
  }

  function getDefaultLandingCategory() {
    const db = (typeof window !== 'undefined' && window.productsDatabase && typeof window.productsDatabase === 'object') ? window.productsDatabase : (window.products || {});
    if (Array.isArray(db?.Default_Page) && db.Default_Page.length) return 'Default_Page';
    return getFirstRenderableCategory();
  }
  let started = false;
  const api = {
    async boot(ctx = {}) {
      if (started) return;
      started = true;
      const show = ctx.showAppLoader || (() => {});
      const hide = ctx.hideAppLoader || (() => {});
      show('Loading products…');
      try {
        try { await ctx.initProducts?.(); } catch {}
        try { ctx.reconcileRememberedPrices?.(); } catch {}
        show('Preparing store…');
        if (!window.products || typeof window.products !== 'object') {
          window.products = ctx.getProductsDatabase?.() || {};
        }
        try {
          const parsed = JSON.parse(localStorage.getItem('basket')) || {};
          ctx.setBasket?.(parsed);
          ctx.syncCentralState?.('basket-storage-load', { basket: parsed });
        } catch {
          const empty = {};
          ctx.setBasket?.(empty);
          ctx.syncCentralState?.('basket-storage-empty', { basket: empty });
          try { localStorage.setItem('basket', JSON.stringify(empty)); } catch {}
        }
        if (typeof window.currentCategory === 'undefined' || !window.currentCategory) window.currentCategory = getDefaultLandingCategory();
        if (typeof window.currentSortOrder === 'undefined') window.currentSortOrder = 'asc';
        try {
          await ctx.initializeHistory?.();
        } catch (e) {
          const fallbackCategory = getDefaultLandingCategory();
          console.warn('⚠️ initializeHistory failed on boot, falling back to default landing category:', e, fallbackCategory);
          ctx.loadProducts?.(fallbackCategory, localStorage.getItem('defaultSort') || 'NameFirst', 'asc');
        }
        try { ctx.categoryButtons?.(); } catch {}
        try { ctx.updateBasketHeaderIndicator?.(); } catch {}
        requestAnimationFrame(() => setTimeout(hide, 0));
      } catch (e) {
        console.warn('⚠️ bootApp error:', e);
        hide();
      }
    }
  };
  window.__SS_BOOT_RUNTIME__ = api;
})();
