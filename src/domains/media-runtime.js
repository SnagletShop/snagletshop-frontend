(function (window) {
  'use strict';

  const MEMORY_CACHE_LIMIT = 96;
  const DEFAULT_THUMBNAIL_OPTIONS = {
    width: 280,
    quality: 64,
    output: 'webp',
    fit: 'inside'
  };

  const imageMemoryCache = window.__ssImageMemoryCache instanceof Map
    ? window.__ssImageMemoryCache
    : new Map();
  const pendingUrls = new Set();
  window.__ssImageMemoryCache = imageMemoryCache;

  function getConnectionInfo() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }

  function shouldSkipPreload() {
    const connection = getConnectionInfo();
    const saveData = connection?.saveData === true;
    const effectiveType = String(connection?.effectiveType || '').toLowerCase();
    return saveData || effectiveType === 'slow-2g' || effectiveType === '2g';
  }

  function getPreloadBudget() {
    const isMobile = !!window.matchMedia?.('(max-width: 680px)')?.matches;
    return isMobile ? 36 : 72;
  }

  function normalizeImageUrl(url) {
    let out = String(url || '').trim();
    if (!out) return '';
    if (!/^https?:\/\//i.test(out) && !/^data:/i.test(out) && !/^blob:/i.test(out)) {
      out = out.startsWith('/') ? `${window.location.origin}${out}` : `${window.location.origin}/${out}`;
    }
    return out;
  }

  function parseSrcSet(srcset) {
    return String(srcset || '')
      .split(',')
      .map((entry) => String(entry || '').trim().split(/\s+/)[0])
      .filter(Boolean);
  }

  function rememberLoadedImage(url, img, preloadedImages) {
    const normalized = normalizeImageUrl(url);
    if (!normalized) return;
    imageMemoryCache.delete(normalized);
    imageMemoryCache.set(normalized, {
      img,
      loadedAt: Date.now(),
      lastUsed: Date.now()
    });
    try { preloadedImages?.add?.(normalized); } catch {}
    while (imageMemoryCache.size > MEMORY_CACHE_LIMIT) {
      const oldest = imageMemoryCache.keys().next().value;
      if (!oldest) break;
      imageMemoryCache.delete(oldest);
    }
  }

  function hasRememberedImage(url, preloadedImages) {
    const normalized = normalizeImageUrl(url);
    if (!normalized) return false;
    const cached = imageMemoryCache.get(normalized);
    if (cached) {
      cached.lastUsed = Date.now();
      return true;
    }
    return !!preloadedImages?.has?.(normalized);
  }

  function rememberImageElement(img, extraUrls = [], preloadedImages = null) {
    if (!img) return;
    const urls = new Set();
    if (img.currentSrc) urls.add(img.currentSrc);
    if (img.src) urls.add(img.src);
    if (typeof extraUrls === 'string') {
      urls.add(extraUrls);
      parseSrcSet(extraUrls).forEach((url) => urls.add(url));
    } else if (Array.isArray(extraUrls)) {
      extraUrls.forEach((url) => {
        urls.add(url);
        parseSrcSet(url).forEach((srcsetUrl) => urls.add(srcsetUrl));
      });
    }
    urls.forEach((url) => rememberLoadedImage(url, img, preloadedImages));
  }

  function buildThumbnailUrls(originalUrl) {
    const original = normalizeImageUrl(originalUrl);
    if (!original) return [];
    const runtime = window.__SS_CATALOG_IMAGE_RUNTIME__;
    try {
      return [normalizeImageUrl(runtime?.buildResizedImageUrl?.(original, DEFAULT_THUMBNAIL_OPTIONS) || original)].filter(Boolean);
    } catch {
      return [original];
    }
  }

  function collectProductsForPreload(products, category) {
    const out = [];
    const seen = new Set();
    const addList = (list) => {
      if (!Array.isArray(list)) return;
      for (const product of list) {
        const key = String(product?.productId || product?.id || product?.name || '').trim();
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        out.push(product);
        if (out.length >= getPreloadBudget()) return;
      }
    };

    const current = category || window.currentCategory || 'Default_Page';
    addList(products[current]);
    if (out.length < getPreloadBudget() && current !== 'Default_Page') addList(products.Default_Page);
    if (out.length < getPreloadBudget()) {
      Object.keys(products || {}).forEach((name) => {
        if (out.length >= getPreloadBudget() || name === current || name === 'Default_Page') return;
        addList(products[name]);
      });
    }
    return out.slice(0, getPreloadBudget());
  }

  function preloadUrls(urls, preloadedImages, options = {}) {
    const uniqueUrls = Array.from(new Set((urls || []).map(normalizeImageUrl).filter(Boolean)))
      .filter((url) => !hasRememberedImage(url, preloadedImages) && !pendingUrls.has(url));
    if (!uniqueUrls.length) return;

    const concurrency = Math.max(1, Math.min(4, Number(options.concurrency || 3) || 3));
    let idx = 0;
    let active = 0;

    const pump = () => {
      while (active < concurrency && idx < uniqueUrls.length) {
        const url = uniqueUrls[idx++];
        if (!url || hasRememberedImage(url, preloadedImages) || pendingUrls.has(url)) continue;
        pendingUrls.add(url);
        active++;
        const img = new Image();
        img.decoding = 'async';
        try { img.fetchPriority = options.priority || 'low'; } catch {}
        const done = () => {
          pendingUrls.delete(url);
          active--;
          if (img.complete && img.naturalWidth > 0) rememberLoadedImage(url, img, preloadedImages);
          else try { preloadedImages?.add?.(url); } catch {}
          if (idx < uniqueUrls.length || active > 0) pump();
        };
        img.onload = done;
        img.onerror = done;
        img.src = url;
      }
    };

    pump();
  }

  function preloadProductImages(ctx = {}, category) {
    const products = ctx.getProducts?.();
    const preloadedImages = ctx.preloadedImages || new Set();
    if (!products) return;

    const cat = category || ctx.getLastCategory?.() || window.currentCategory || 'Default_Page';
    const list = collectProductsForPreload(products, cat);
    if (!list.length || shouldSkipPreload()) return;

    const urls = [];
    for (const product of list) {
      const primary = ctx.getPrimaryImageUrl?.(product)
        || product?.image
        || (Array.isArray(product?.images) ? product.images[0] : '')
        || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '');
      buildThumbnailUrls(primary).forEach((url) => {
        if (!hasRememberedImage(url, preloadedImages)) urls.push(url);
      });
    }

    if (!urls.length) return;
    const key = `${cat}::${urls.slice(0, getPreloadBudget()).join('|')}`;
    if (preloadProductImages.__lastKey === key && preloadProductImages.__running) return;
    preloadProductImages.__lastKey = key;

    const run = () => {
      preloadProductImages.__running = true;
      preloadUrls(urls.slice(0, getPreloadBudget()), preloadedImages, { concurrency: 3, priority: 'low' });
      setTimeout(() => { preloadProductImages.__running = false; }, 250);
    };

    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 1200);
  }

  window.__SS_MEDIA_RUNTIME__ = {
    preloadProductImages,
    preloadUrls,
    buildThumbnailUrls,
    hasRememberedImage,
    rememberImageElement,
    getMemoryCacheSize() { return imageMemoryCache.size; },
    clearMemoryCache() {
      imageMemoryCache.clear();
      pendingUrls.clear();
    }
  };
})(window);
