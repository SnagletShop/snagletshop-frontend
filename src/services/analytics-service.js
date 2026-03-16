(function (window) {
  'use strict';

  const api = () => window.__SS_API__;

  async function sendEvent(body, options = {}) {
    try {
      await api().request('/analytics/event', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        keepalive: !!options.keepalive
      });
      return true;
    } catch {
      return false;
    }
  }

  window.__SS_ANALYTICS_SERVICE__ = { sendEvent };
})(window);
