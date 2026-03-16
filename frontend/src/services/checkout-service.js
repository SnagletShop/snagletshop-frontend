(function (window) {
  'use strict';

  const api = () => window.__SS_API__;

  async function storeUserDetails(payload = {}) {
    return api().json('/store-user-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }

  async function createPaymentIntent(payload = {}) {
    return api().json('/create-payment-intent', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }

  async function finalizeOrder(payload = {}) {
    return api().json('/finalize-order', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }

  window.__SS_CHECKOUT_SERVICE__ = { storeUserDetails, createPaymentIntent, finalizeOrder };
})(window);
