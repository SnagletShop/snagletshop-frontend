(function (window) {
  'use strict';

  function normalizePublishableKey(raw) {
    return String(raw || '').trim();
  }

  function assertPublishableKeySafe(pk) {
    const key = normalizePublishableKey(pk);
    if (!key || key === '__STRIPE_PUBLISHABLE_KEY__') {
      throw new Error('Stripe publishable key is not configured. Set <meta name="stripe-publishable-key" content="pk_live_..."/> or provide it from the backend public config.');
    }
    const host = String(window.location.hostname || '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    if (!isLocal && key.startsWith('pk_test_')) {
      throw new Error('Refusing to run checkout with a Stripe TEST publishable key on a non-localhost domain. Use a pk_live_... key.');
    }
    return key;
  }

  async function ensureStripePublishableKey(ctx = {}) {
    const fromWindow = normalizePublishableKey(window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE);
    if (fromWindow) {
      const safe = assertPublishableKeySafe(fromWindow);
      window.STRIPE_PUBLISHABLE_KEY = safe;
      window.STRIPE_PUBLISHABLE = safe;
      return safe;
    }

    const fromMeta = normalizePublishableKey(window.document?.querySelector?.('meta[name="stripe-publishable-key"]')?.content);
    if (fromMeta) {
      const safe = assertPublishableKeySafe(fromMeta);
      window.STRIPE_PUBLISHABLE_KEY = safe;
      window.STRIPE_PUBLISHABLE = safe;
      return safe;
    }

    try {
      const data = await ctx.getPublicConfig?.();
      const key = normalizePublishableKey(data && data.stripePublishableKey);
      if (key) {
        const safe = assertPublishableKeySafe(key);
        window.STRIPE_PUBLISHABLE_KEY = safe;
        window.STRIPE_PUBLISHABLE = safe;
        return safe;
      }
    } catch {}

    throw new Error('Stripe publishable key is not available yet.');
  }

  function showStripeConfigError(msg) {
    const text = String(msg || 'Stripe configuration error.');
    try { console.error('[stripe][config]', text); } catch {}
    try { alert(text); } catch {}
    const payBtn = document.getElementById('payButton') || document.getElementById('payBtn');
    if (payBtn) payBtn.disabled = true;
  }

  window.__SS_STRIPE_CONFIG_RUNTIME__ = { ensureStripePublishableKey, showStripeConfigError };
})(window);
