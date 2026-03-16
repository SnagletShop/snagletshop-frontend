(function(){
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
        if (typeof window.currentCategory === 'undefined') window.currentCategory = 'Default_Page';
        if (typeof window.currentSortOrder === 'undefined') window.currentSortOrder = 'asc';
        try {
          await ctx.initializeHistory?.();
        } catch (e) {
          console.warn('⚠️ initializeHistory failed on boot, falling back to Default_Page:', e);
          ctx.loadProducts?.('Default_Page', localStorage.getItem('defaultSort') || 'NameFirst', 'asc');
          ctx.categoryButtons?.();
        }
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
