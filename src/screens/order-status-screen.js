(function (window) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }

  function open(prefill = {}) {
    const run =
      getResolver()?.resolve?.('domain.orders', window.__SS_ORDERS__ || null)?.openOrderStatusModal ||
      window.openOrderStatusModal;
    if (typeof run === 'function') return run(prefill || {});
    return null;
  }

  function openFromLocation() {
    try {
      const sp = new URLSearchParams(window.location.search || '');
      const path = String(window.location.pathname || '');
      let orderIdFromPath = '';
      if (path.startsWith('/order-status/')) {
        orderIdFromPath = decodeURIComponent(path.slice('/order-status/'.length).split('/')[0] || '');
      }
      const orderId = orderIdFromPath || (sp.get('orderId') || '');
      const token = sp.get('token') || '';
      if (orderId && token && (orderIdFromPath || sp.has('orderId'))) {
        open({ orderId, token, fromLocation: true, autoRun: true });
        return true;
      }
    } catch {}
    return false;
  }

  const api = { open, openFromLocation };
  try { getResolver()?.expose?.('screen.orderStatus', api, ['__SS_ORDER_STATUS_SCREEN__']); } catch { window.__SS_ORDER_STATUS_SCREEN__ = api; }
})(window);
