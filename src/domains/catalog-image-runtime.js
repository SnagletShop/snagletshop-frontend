(function (window) {
  'use strict';

  function fixImageUrl(u) {
    try {
      let s = String(u || '').trim();
      if (!s) return s;
      if (/^\/\//.test(s)) return window.location.protocol + s;
      if (/^(?:https?:|data:image\/)/i.test(s)) {
        if (s.includes('raw.githubusercontent.com/') && s.includes('/refs/heads/')) {
          s = s.replace('/refs/heads/', '/');
        }
        const rawMatch = s.match(/^https:\/\/raw\.githubusercontent\.com\/SnagletShop\/snagletshop-frontend\/main\/(.+)$/i);
        if (rawMatch && rawMatch[1]) {
          const decodedPath = decodeURIComponent(rawMatch[1]);
          return `https://cdn.jsdelivr.net/gh/SnagletShop/snagletshop-frontend@main/${decodedPath}`;
        }
        const ghBlob = s.match(/^https:\/\/github\.com\/SnagletShop\/snagletshop-frontend\/(?:blob|raw)\/main\/(.+)$/i);
        if (ghBlob && ghBlob[1]) {
          const decodedPath = decodeURIComponent(ghBlob[1]);
          return `https://cdn.jsdelivr.net/gh/SnagletShop/snagletshop-frontend@main/${decodedPath}`;
        }
        return s;
      }
      s = s.replace(/^\.\//, '');
      if (s.startsWith('/')) return window.location.origin + s;
      return new URL(s, window.location.origin + '/').href;
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
          if (Array.isArray(p.images)) p.images = p.images.map(fixImageUrl).filter(Boolean);
          if (Array.isArray(p.imagesB)) p.imagesB = p.imagesB.map(fixImageUrl).filter(Boolean);
          if (p.image) p.image = fixImageUrl(p.image);
          if (!p.image) p.image = p.images?.[0] || p.imagesB?.[0] || '';
        }
      }
    } catch {}
    return catalogObj;
  }

  window.__SS_CATALOG_IMAGE_RUNTIME__ = { fixImageUrl, normalizeCatalogImages };
})(window);
