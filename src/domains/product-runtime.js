(function(){
  function getProductsFlat(ctx){
    const obj = (ctx && typeof ctx.getProducts === 'function' ? ctx.getProducts() : {}) || {};
    try { return Object.values(obj).flat().filter(Boolean); } catch { return []; }
  }
  const api = {
    getProductDescription(ctx, productName){
      const product = getProductsFlat(ctx).find(p => p && p.name === productName);
      return product ? product.description : 'N/A';
    },
    attachSwipeListeners(ctx){
      const image = document.getElementById('mainImage');
      if (!image) return;
      if (image.dataset?.ssSwipeBound === '1') return;
      if (image.dataset) image.dataset.ssSwipeBound = '1';
      const applyImageUpdate = (direction) => {
        try {
          if (typeof ctx.updateImage === 'function') return ctx.updateImage(direction);
          return ctx.updateMainImage?.(direction);
        } catch { return undefined; }
      };
      let touchStartX = 0, touchEndX = 0;
      image.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
      image.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) < 50) return;
        const currentIndex = Number(ctx.getCurrentIndex?.() || 0);
        const images = ctx.getCurrentProductImages?.() || [];
        if (diff > 0) {
          if (currentIndex > 0) { ctx.setCurrentIndex?.(currentIndex - 1); applyImageUpdate('left'); }
        } else if (currentIndex < images.length - 1) {
          ctx.setCurrentIndex?.(currentIndex + 1); applyImageUpdate('right');
        }
      });
    },
    selectProductOption(ctx, button, optionValue){
      document.querySelectorAll('.Product_Option_Button').forEach(btn => btn.classList.remove('selected'));
      button?.classList?.add('selected');
      window.selectedProductOption = optionValue;
      const headingEl = document.querySelector('.Product_Name_Heading');
      const productName = headingEl?.dataset?.canonicalName || headingEl?.textContent?.trim();
      const basket = ctx.getBasket?.() || {};
      if (productName && basket[productName]) {
        basket[productName].selectedOption = optionValue;
        ctx.persistBasket?.('option_change');
      }
    },
    prevImage(ctx){
      const images = ctx.getCurrentProductImages?.() || [];
      if (!images.length) return;
      const next = (Number(ctx.getCurrentIndex?.() || 0) - 1 + images.length) % images.length;
      ctx.setCurrentIndex?.(next); ctx.updateImage?.('right');
    },
    nextImage(ctx){
      const images = ctx.getCurrentProductImages?.() || [];
      if (!images.length) return;
      const next = (Number(ctx.getCurrentIndex?.() || 0) + 1) % images.length;
      ctx.setCurrentIndex?.(next); ctx.updateImage?.('left');
    },
    changeImage(ctx, imgSrc){
      const images = ctx.getCurrentProductImages?.() || [];
      const index = images.indexOf(imgSrc);
      if (index !== -1) { ctx.setCurrentIndex?.(index); ctx.updateImage?.(); }
    },
    getQtyKey(k){ return String(k || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80); },
    getQtyValue(productKey){
      const key = api.getQtyKey(productKey);
      window.__ssQtyByKey = window.__ssQtyByKey || {};
      const raw = parseInt(window.__ssQtyByKey[key], 10);
      const qty = Math.max(1, Number.isFinite(raw) ? raw : 1);
      window.__ssQtyByKey[key] = qty;
      return qty;
    },
    setQtyValue(productKey, qty){
      const key = api.getQtyKey(productKey);
      window.__ssQtyByKey = window.__ssQtyByKey || {};
      const safeQty = Math.max(1, parseInt(qty, 10) || 1);
      window.__ssQtyByKey[key] = safeQty;
      const el = document.getElementById(`quantity-${key}`);
      if (el) el.innerText = safeQty;
      return safeQty;
    },
    increaseQuantity(productKey){ return api.setQtyValue(productKey, api.getQtyValue(productKey) + 1); },
    decreaseQuantity(productKey){ return api.setQtyValue(productKey, Math.max(1, api.getQtyValue(productKey) - 1)); },
    filterProducts(ctx, searchTerm){
      const out = [];
      const products = (ctx.getProducts?.() || {});
      for (const category in products) {
        const list = products[category];
        if (Array.isArray(list)) out.push(...list.filter(product => String(product?.name || '').toLowerCase().includes(String(searchTerm || '').toLowerCase())));
      }
      return out;
    },
    slugifyName(name){
      return String(name || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    },
    findProductById(ctx, productId){
      const id = String(productId || '').trim();
      if (!id) return null;
      const byId = ctx.getProductsById?.() || null;
      if (byId && byId[id]) return byId[id];
      try {
        const cats = ctx.getCatalog?.() || {};
        for (const arr of Object.values(cats)) for (const p of (arr || [])) if (String(p?.productId || '') === id) return p;
      } catch {}
      return null;
    },
    findProductBySlug(ctx, slug){
      const s = String(slug || '').trim().toLowerCase();
      if (!s) return null;
      try {
        const cats = ctx.getCatalog?.() || {};
        for (const arr of Object.values(cats)) for (const p of (arr || [])) if (ctx.slugifyName?.(p?.name || '') === s) return p;
      } catch {}
      return null;
    },
    findProductByName(ctx, name){
      const nrm = ctx.normalizeProductKey?.(name);
      try {
        const cats = ctx.getCatalog?.() || {};
        for (const arr of Object.values(cats)) for (const p of (arr || [])) if (ctx.normalizeProductKey?.(p?.name || '') === nrm) return p;
      } catch {}
      return null;
    },
    parseIncomingProductRef(locationLike){
      const sp = new URLSearchParams(locationLike?.search || '');
      const pid = sp.get('pid') || '';
      const pname = sp.get('product') || '';
      const path = String(locationLike?.pathname || '');
      if (path.startsWith('/p/')) return { type: 'id', value: decodeURIComponent(path.slice(3).split('/')[0] || '') };
      if (path.startsWith('/product/')) return { type: 'slug', value: decodeURIComponent(path.slice('/product/'.length).split('/')[0] || '') };
      if (path && path !== '/' && !path.includes('.') && !path.startsWith('/category/') && !path.startsWith('/order-status/')) {
        const slug = decodeURIComponent(path.slice(1).split('/')[0] || '');
        if (slug) return { type: 'slug', value: slug };
      }
      if (pid) return { type: 'id', value: pid };
      if (pname) return { type: 'name', value: pname };
      return null;
    },
    navigateToProduct(ctx, productName){
      const clickToken = ctx.tokenFactory?.('click');
      ctx.rememberClickToken?.(clickToken);
      ctx.sendAnalyticsEvent?.('product_click', { ...(ctx.buildAnalyticsProductPayload?.(productName) || {}), extra: { clickToken } });
      try {
        const prod = (ctx.getAllProductsFlatSafe?.() || []).find(p => String(p?.name || '') === String(productName || '')) || null;
        const desc = (prod && ((ctx.getABDescription?.(prod) || prod.description))) || ctx.getProductDescription?.(productName);
        const price = (prod && (ctx.resolveVariantPriceEUR?.(prod, [], '') || prod.price || prod.priceEUR || prod.basePrice || prod.sellPrice)) || ctx.getProductPrice?.(productName);
        const pid = ctx.idNorm?.(prod?.productId || '');
        ctx.navigate?.('GoToProductPage', [productName, price, desc, null, pid || null, null]);
      } catch {
        ctx.navigate?.('GoToProductPage', [productName, ctx.getProductPrice?.(productName), ctx.getProductDescription?.(productName)]);
      }
    },
    getProductPrice(ctx, productName){
      const product = getProductsFlat(ctx).find(p => p && p.name === productName);
      if (!product) return 'N/A';
      return (ctx.resolveVariantPriceEUR?.(product, [], '') || product.price || product.priceEUR || product.basePrice || product.sellPrice || 'N/A');
    }
  };
  window.__SS_PRODUCT_RUNTIME__ = api;
})();
