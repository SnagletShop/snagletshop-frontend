(function (window) {
  async function storeUserDetails(payload = {}) {
    const svc = window.__SS_CHECKOUT_SERVICE__;
    if (svc?.storeUserDetails) return svc.storeUserDetails(payload);
    return window.__SS_API__.json('/store-user-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }
  async function createPaymentIntent(payload = {}) {
    const svc = window.__SS_CHECKOUT_SERVICE__;
    if (svc?.createPaymentIntent) return svc.createPaymentIntent(payload);
    return window.__SS_API__.json('/create-payment-intent', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }
  async function finalizeOrder(payload = {}) {
    const svc = window.__SS_CHECKOUT_SERVICE__;
    if (svc?.finalizeOrder) return svc.finalizeOrder(payload);
    return window.__SS_API__.json('/finalize-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }
  window.__SS_CHECKOUT_API__ = { storeUserDetails, createPaymentIntent, finalizeOrder };
})(window);
