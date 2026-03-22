(function (window) {
  'use strict';

  const api = () => window.__SS_API__;
  const cfg = () => window.__SS_CONFIG__ || {};

  async function getTariffs() {
    const res = await api().request('/tariffs', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`Failed to fetch tariffs (${res.status})`);
    return data;
  }

  async function getCountries() {
    const res = await api().request('/countries', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`Failed to fetch countries (${res.status})`);
    return data;
  }

  async function getStorefrontConfig() {
    let res = null;
    let data = null;
    try {
      res = await api().request('/storefront-config', { cache: 'no-store', credentials: 'include' });
      data = await res.json().catch(() => null);
      if (res.ok) return data;
    } catch {}

    try {
      const fallback = await api().request('/public-config', { cache: 'no-store' });
      const fallbackData = await fallback.json().catch(() => null);
      if (fallback.ok && fallbackData && typeof fallbackData === 'object') {
        return fallbackData;
      }
    } catch {}

    throw new Error(`Failed to fetch storefront config (${res?.status || 500})`);
  }

  async function getExchangeRates() {
    let res = null;
    try {
      res = await api().request('/api/proxy-rates', { cache: 'no-store' });
      if (!res.ok) res = null;
    } catch {
      res = null;
    }
    if (!res) res = await api().request('/rates', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`Failed to fetch exchange rates (${res.status})`);
    return data;
  }

  async function detectGeoCurrency() {
    const url = String(cfg().GEO_IP_URL || 'https://ipapi.co/json/');
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`Failed geo currency lookup (${res.status})`);
    return data;
  }

  window.__SS_PRICING_SERVICE__ = {
    getTariffs,
    getCountries,
    getStorefrontConfig,
    getExchangeRates,
    detectGeoCurrency
  };
})(window);
