(function (window) {
  async function sendEvent(body, options = {}) {
    const svc = window.__SS_ANALYTICS_SERVICE__;
    if (svc?.sendEvent) return svc.sendEvent(body, options);
    try {
      await window.__SS_API__.request('/analytics/event', {
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
  window.__SS_ANALYTICS__ = { sendEvent };
})(window);
