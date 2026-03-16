(function (window) {
  'use strict';

  function preloadProductImages(ctx = {}, category) {
    const products = ctx.getProducts?.();
    const preloadedImages = ctx.preloadedImages;
    if (!products || !preloadedImages) return;

    const cat = category || ctx.getLastCategory?.() || window.currentCategory || 'Default_Page';
    const list = Array.isArray(products[cat]) ? products[cat] : [];
    if (!list.length) return;

    const MAX_PRODUCTS = 20;
    const CONCURRENCY = 4;
    const urls = [];

    for (let i = 0; i < Math.min(MAX_PRODUCTS, list.length); i++) {
      const p = list[i];
      let url = ctx.getPrimaryImageUrl?.(p);
      if (!url) continue;
      if (!/^https?:\/\//i.test(url) && !/^data:/i.test(url) && !/^blob:/i.test(url)) {
        url = url.startsWith('/') ? `${window.location.origin}${url}` : `${window.location.origin}/${url}`;
      }
      if (!preloadedImages.has(url)) urls.push(url);
    }

    if (!urls.length) return;
    const key = `${cat}::${urls.length}`;
    if (preloadProductImages.__lastKey === key && preloadProductImages.__running) return;
    preloadProductImages.__lastKey = key;

    const run = () => {
      preloadProductImages.__running = true;
      let idx = 0;
      let active = 0;
      const pump = () => {
        while (active < CONCURRENCY && idx < urls.length) {
          const url = urls[idx++];
          if (!url || preloadedImages.has(url)) continue;
          active++;
          const img = new Image();
          img.decoding = 'async';
          const done = () => {
            active--;
            preloadedImages.add(url);
            if (idx >= urls.length && active === 0) {
              preloadProductImages.__running = false;
              return;
            }
            pump();
          };
          img.onload = done;
          img.onerror = done;
          img.src = url;
        }
      };
      pump();
    };

    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1200 });
    else setTimeout(run, 0);
  }

  window.__SS_MEDIA_RUNTIME__ = { preloadProductImages };
})(window);
