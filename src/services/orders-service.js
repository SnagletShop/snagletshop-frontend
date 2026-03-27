(function (window) {
  'use strict';

  const api = () => window.__SS_API__;

  async function getOrderStatus(orderId, token, options = {}) {
    const oid = String(orderId || '').trim();
    const t = String(token || '').trim();
    if (!oid || !t) throw new Error('Missing orderId or token.');
    const turnstileToken = String(options?.turnstileToken || '').trim();
    const path = turnstileToken
      ? `/order-status/${encodeURIComponent(oid)}?token=${encodeURIComponent(t)}&turnstileToken=${encodeURIComponent(turnstileToken)}`
      : `/order-status/${encodeURIComponent(oid)}?token=${encodeURIComponent(t)}`;
    return api().json(path, {
      cache: 'no-store',
      headers: turnstileToken ? { 'x-turnstile-token': turnstileToken } : undefined
    });
  }

  async function getPaymentIntentStatus(paymentIntentId, clientSecret) {
    const piid = String(paymentIntentId || '').trim();
    if (!piid) throw new Error('Missing paymentIntentId.');
    const cs = clientSecret ? String(clientSecret).trim() : '';
    const path = cs
      ? `/payment-intent-status/${encodeURIComponent(piid)}?clientSecret=${encodeURIComponent(cs)}`
      : `/payment-intent-status/${encodeURIComponent(piid)}`;
    const res = await api().request(path, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  async function getOrderByPaymentIntent(paymentIntentId, clientSecret) {
    const piid = String(paymentIntentId || '').trim();
    const cs = String(clientSecret || '').trim();
    if (!piid || !cs) throw new Error('Missing paymentIntentId or clientSecret.');
    const res = await api().request(`/order-by-payment-intent/${encodeURIComponent(piid)}?clientSecret=${encodeURIComponent(cs)}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  window.__SS_ORDERS_SERVICE__ = { getOrderStatus, getPaymentIntentStatus, getOrderByPaymentIntent };
})(window);
