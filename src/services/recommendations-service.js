(function (window) {
  'use strict';

  const api = () => window.__SS_API__;

  async function getRecommendations(urlOrPath) {
    const res = await api().request(urlOrPath, { method: 'GET', credentials: 'include' });
    return res.json().catch(() => null);
  }

  async function sendRecoEvent(body) {
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(body || {})], { type: 'application/json' });
        navigator.sendBeacon(`${String((window.__SS_CONFIG__ || {}).API_BASE || '').replace(/\/+$/, '')}/recs/event`, blob);
        return true;
      }
    } catch {}
    try {
      await api().request('/recs/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        keepalive: true
      });
      return true;
    } catch {
      return false;
    }
  }

  async function sendSmartRecoEvent(body) {
    try {
      await api().request('/smart-reco/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        credentials: 'include'
      });
      return true;
    } catch {
      return false;
    }
  }

  async function getContributionProducts(limit = 40) {
    const res = await api().request(`/products/contribution?limit=${encodeURIComponent(limit)}`, { credentials: 'include' });
    return res.json().catch(() => null);
  }

  window.__SS_RECOMMENDATIONS_SERVICE__ = {
    getRecommendations,
    sendRecoEvent,
    sendSmartRecoEvent,
    getContributionProducts
  };
})(window);
