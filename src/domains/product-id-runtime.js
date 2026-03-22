(function(){
  const api = {
    normalizeProductKey(s) {
      return String(s || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    getAllProductsFlatSafe(ctx = {}) {
      if (Array.isArray(window.productsFlatFromServer) && window.productsFlatFromServer.length) {
        return window.productsFlatFromServer.filter(p => p && typeof p === 'object' && !Array.isArray(p) && typeof p.name === 'string' && p.name.trim());
      }
      const byIdValues = Object.values(window.productsById || {}).filter(p => p && typeof p === 'object' && !Array.isArray(p) && typeof p.name === 'string' && p.name.trim());
      if (byIdValues.length) return byIdValues;
      const db = (window.products && typeof window.products === 'object' && window.products) ||
        (typeof ctx.getProducts === 'function' && ctx.getProducts()) || {};
      const out = [];
      for (const v of Object.values(db)) {
        if (Array.isArray(v)) out.push(...v);
      }
      return out.filter(p => p && typeof p === 'object' && typeof p.name === 'string' && p.name.trim());
    },
    findProductByNameParam(ctx = {}, productParam) {
      const target = api.normalizeProductKey(productParam);
      const all = typeof ctx.getAllProductsFlatSafe === 'function' ? ctx.getAllProductsFlatSafe() : api.getAllProductsFlatSafe(ctx);
      let p = all.find(x => api.normalizeProductKey(x.name) === target);
      if (p) return p;
      p = all.find(x => api.normalizeProductKey(x.name).includes(target) || target.includes(api.normalizeProductKey(x.name)));
      return p || null;
    },
    idNorm(v) {
      if (v == null) return '';
      if (typeof Set !== 'undefined' && v instanceof Set) {
        for (const x of v) {
          const s = String(x ?? '').trim();
          if (s) return s;
        }
        return '';
      }
      if (Array.isArray(v)) {
        for (const x of v) {
          const s = String(x ?? '').trim();
          if (s) return s;
        }
        return '';
      }
      return String(v).trim();
    },
    idEq(a,b){ const aa=api.idNorm(a), bb=api.idNorm(b); return !!aa && !!bb && aa===bb; },
    isBadId(v){ const s=String(v ?? '').trim(); return !s || /^\[object\s+/.test(s); },
    resolvePidFromCatalogByName(ctx = {}, name) {
      const nRaw = String(name ?? '').trim();
      if (!nRaw) return '';
      const nLower = nRaw.toLowerCase();
      try {
        const flat = typeof ctx.getCatalogFlat === 'function' ? ctx.getCatalogFlat() : [];
        let hit = (flat || []).find(p => String(p?.name ?? '').trim() === nRaw);
        if (!hit) hit = (flat || []).find(p => String(p?.name ?? '').trim().toLowerCase() === nLower);
        const pid = api.idNorm(hit?.productId || '');
        return api.isBadId(pid) ? '' : pid;
      } catch { return ''; }
    },
    resolvePidForRecs(ctx = {}, product) {
      try {
        const pid = api.idNorm(product?.productId || '');
        if (pid && !api.isBadId(pid) && !/\s/.test(pid)) return pid;
        if (pid && !api.isBadId(pid) && /\s/.test(pid)) {
          const rp = api.resolvePidFromCatalogByName(ctx, pid);
          if (rp) return rp;
        }
      } catch {}
      try {
        const path = String(location.pathname || '');
        const mm = path.match(/^\/p\/([^\/]+)\/?$/);
        if (mm && mm[1]) {
          const pid = api.idNorm(decodeURIComponent(mm[1]));
          if (pid && !api.isBadId(pid) && !/\s/.test(pid)) return pid;
          if (pid && !api.isBadId(pid) && /\s/.test(pid)) {
            const rp = api.resolvePidFromCatalogByName(ctx, pid);
            if (rp) return rp;
          }
        }
      } catch {}
      try {
        const pid = api.idNorm(window.__ssCurrentProductId || '');
        if (pid && !api.isBadId(pid) && !/\s/.test(pid)) return pid;
        if (pid && !api.isBadId(pid) && /\s/.test(pid)) {
          const rp = api.resolvePidFromCatalogByName(ctx, pid);
          if (rp) return rp;
        }
      } catch {}
      try {
        const d = JSON.parse(sessionStorage.getItem('ss_reco_pdp_discount_v1') || 'null');
        const pid = api.idNorm(d?.productId || d?.targetProductId || '');
        if (pid && !api.isBadId(pid) && !/\s/.test(pid)) return pid;
        if (pid && !api.isBadId(pid) && /\s/.test(pid)) {
          const rp = api.resolvePidFromCatalogByName(ctx, pid);
          if (rp) return rp;
        }
      } catch {}
      try {
        const name = String(product?.name ?? product?.title ?? '').trim();
        const rp = api.resolvePidFromCatalogByName(ctx, name);
        if (rp) return rp;
      } catch {}
      return '';
    },
    getCurrentPidFallback(ctx = {}) {
      try {
        const path = String(location.pathname || '');
        const mm = path.match(/^\/p\/([^\/]+)\/?$/);
        if (mm && mm[1]) {
          const pid = api.idNorm(decodeURIComponent(mm[1]));
          if (!api.isBadId(pid)) {
            if (/\s/.test(pid)) {
              const rp = api.resolvePidFromCatalogByName(ctx, pid);
              if (rp) return rp;
            }
            return pid;
          }
        }
      } catch {}
      try {
        const params = new URLSearchParams(String(location.search || ''));
        const qp = params.get('p') || params.get('pid') || params.get('productId');
        if (qp) {
          const pid = api.idNorm(qp);
          if (!api.isBadId(pid)) return pid;
        }
      } catch {}
      try {
        const pid = api.idNorm(window.__ssCurrentProductId || '');
        if (!api.isBadId(pid)) {
          if (/\s/.test(pid)) {
            const rp = api.resolvePidFromCatalogByName(ctx, pid);
            if (rp) return rp;
          }
          return pid;
        }
      } catch {}
      try {
        const d = JSON.parse(sessionStorage.getItem('ss_reco_pdp_discount_v1') || 'null');
        const pid = api.idNorm(d?.productId || d?.targetProductId || '');
        if (!api.isBadId(pid)) {
          if (/\s/.test(pid)) {
            const rp = api.resolvePidFromCatalogByName(ctx, pid);
            if (rp) return rp;
          }
          return pid;
        }
      } catch {}
      return '';
    }
  };
  window.__SS_PRODUCT_ID_RUNTIME__ = api;
})();
