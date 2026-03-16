
(function (window) {
  const cfg = () => window.__SS_CONFIG__ || {};
  async function request(path, options = {}) {
    const base = String(cfg().API_BASE || '').replace(/\/+$/, '');
    const url = /^https?:\/\//i.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await fetch(url, options);
    return res;
  }
  window.__SS_API__ = {
    request,
    async json(path, options = {}) {
      const res = await request(path, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
        err.status = res.status;
        err.payload = data;
        throw err;
      }
      return data;
    }
  };
})(window);
