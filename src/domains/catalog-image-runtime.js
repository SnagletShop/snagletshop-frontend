(function (window) {
  'use strict';

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

  window.__SS_CATALOG_IMAGE_RUNTIME__ = { fixImageUrl, normalizeCatalogImages };
})(window);
