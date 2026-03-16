(function(){
  const api = {
    parsePriceEUR(v) {
      try {
        if (v == null) return 0;
        if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
        let s = String(v).trim();
        if (!s) return 0;
        s = s.replace(/\s+/g, '');
        s = s.replace(/[^0-9,\.\-]/g, '');
        const hasComma = s.includes(',');
        const hasDot = s.includes('.');
        if (hasComma && hasDot) {
          const lastComma = s.lastIndexOf(',');
          const lastDot = s.lastIndexOf('.');
          if (lastComma > lastDot) {
            s = s.replace(/\./g, '');
            s = s.replace(/,/g, '.');
          } else {
            s = s.replace(/,/g, '');
          }
        } else if (hasComma && !hasDot) {
          s = s.replace(/,/g, '.');
        }
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : 0;
      } catch {
        return 0;
      }
    },
    canonicalizeProductLink(link) {
      const raw = String(link || '').trim();
      if (!raw) return '';
      try {
        const u = new URL(raw);
        u.search = '';
        u.hash = '';
        const path = u.pathname.replace(/\/+$/, '');
        return `${u.protocol}//${u.host}${path}`;
      } catch {
        return raw.split('?')[0].split('#')[0].replace(/\/+$/, '');
      }
    },
    extractProductIdFromLink(link) {
      const s = api.canonicalizeProductLink(link);
      if (!s) return '';
      const m = s.match(/\/item\/(\d+)\.html/i) || s.match(/\/i\/(\d+)\.html/i);
      if (m && m[1]) return String(m[1]);
      const m2 = s.match(/(\d{10,16})/);
      if (m2 && m2[1]) return String(m2[1]);
      return '';
    },
    normalizeCartItemsForServer(items) {
      const arr = Array.isArray(items) ? items : [];
      return arr.map((it) => {
        const productLink = String(it?.productLink || it?.link || '').trim();
        const canonicalLink = api.canonicalizeProductLink(productLink);
        const productId = String(it?.productId || '').trim();
        const out = { ...it, productLink: canonicalLink || productLink };
        if (productId) out.productId = productId;
        return out;
      });
    }
  };
  window.__SS_UTILS_RUNTIME__ = api;
})();
