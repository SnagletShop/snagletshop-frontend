(function (window) {
  'use strict';

  const DEFAULT_IMAGE_RESIZER_BASE = 'https://wsrv.nl/';

  function fixImageUrl(u) {
    try {
      let s = String(u || '').trim();
      if (!s) return s;
      if (s.includes('raw.githubusercontent.com/') && s.includes('/refs/heads/')) {
        s = s.replace('/refs/heads/', '/');
      }
      const m = s.match(/^https:\/\/raw\.githubusercontent\.com\/SnagletShop\/snagletshop-frontend\/main\/(.+)$/);
      if (m && m[1]) {
        const decodedPath = decodeURIComponent(m[1]);
        return `https://cdn.jsdelivr.net/gh/SnagletShop/snagletshop-frontend@main/${decodedPath}`;
      }
      return s;
    } catch {
      return String(u || '');
    }
  }

  function getImageResizerBase() {
    try {
      const configured = String(
        window.IMAGE_RESIZER_BASE ||
        window.__SS_CONFIG__?.IMAGE_RESIZER_BASE ||
        window.document?.querySelector?.('meta[name="image-resizer-base"]')?.content ||
        DEFAULT_IMAGE_RESIZER_BASE
      ).trim();
      if (!configured || /^(off|false|none)$/i.test(configured)) return '';
      return configured;
    } catch {}
    return DEFAULT_IMAGE_RESIZER_BASE;
  }

  function clampInt(value, fallback, min, max) {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  function canResizeImageUrl(src) {
    const s = String(src || '').trim();
    if (!/^https?:\/\//i.test(s)) return false;
    if (/^https:\/\/wsrv\.nl\/\?/i.test(s) || /^https:\/\/images\.weserv\.nl\/\?/i.test(s)) return false;
    if (/\.(svg)(\?|#|$)/i.test(s)) return false;
    return true;
  }

  function buildResizedImageUrl(src, options = {}) {
    const original = fixImageUrl(src);
    if (!canResizeImageUrl(original)) return original;
    const base = getImageResizerBase();
    if (!base) return original;

    try {
      const width = clampInt(options.width ?? options.w, 320, 40, 1600);
      const height = clampInt(options.height ?? options.h, 0, 0, 1600);
      const quality = clampInt(options.quality ?? options.q, 68, 25, 95);
      const dpr = clampInt(options.dpr, Math.min(2, Math.ceil(window.devicePixelRatio || 1)), 1, 3);
      const output = String(options.output || 'webp').trim().toLowerCase();
      const fit = String(options.fit || (height ? 'cover' : 'inside')).trim().toLowerCase();
      const url = new URL(base, window.location?.origin || 'https://snagletshop.com');
      url.searchParams.set('url', original);
      url.searchParams.set('w', String(width));
      if (height > 0) url.searchParams.set('h', String(height));
      if (dpr > 1) url.searchParams.set('dpr', String(dpr));
      if (fit) url.searchParams.set('fit', fit);
      if (output) url.searchParams.set('output', output);
      url.searchParams.set('q', String(quality));
      url.searchParams.set('we', '1');
      url.searchParams.set('default', '1');
      return url.toString();
    } catch {
      return original;
    }
  }

  function buildThumbnailSrcSet(src, options = {}) {
    const width = clampInt(options.width ?? options.w, 320, 40, 1600);
    const oneX = buildResizedImageUrl(src, { ...options, width, dpr: 1 });
    const twoX = buildResizedImageUrl(src, { ...options, width, dpr: 2 });
    if (!oneX || oneX === twoX) return '';
    return `${oneX} 1x, ${twoX} 2x`;
  }

  function normalizeCatalogImages(catalogObj) {
    try {
      if (!catalogObj || typeof catalogObj !== 'object') return catalogObj;
      for (const cat of Object.keys(catalogObj)) {
        const list = catalogObj[cat];
        if (!Array.isArray(list)) continue;
        for (const p of list) {
          if (!p || typeof p !== 'object') continue;
          if (p.image) p.image = fixImageUrl(p.image);
          if (Array.isArray(p.images)) p.images = p.images.map(fixImageUrl);
          if (Array.isArray(p.imagesB)) p.imagesB = p.imagesB.map(fixImageUrl);
        }
      }
    } catch {}
    return catalogObj;
  }

  window.__SS_CATALOG_IMAGE_RUNTIME__ = {
    fixImageUrl,
    normalizeCatalogImages,
    buildResizedImageUrl,
    buildThumbnailSrcSet,
    canResizeImageUrl
  };
})(window);
