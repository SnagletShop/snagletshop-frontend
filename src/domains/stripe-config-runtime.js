(function (window) {
  'use strict';

  async function ensureStripePublishableKey(ctx = {}) {
    if (window.STRIPE_PUBLISHABLE_KEY && String(window.STRIPE_PUBLISHABLE_KEY).trim()) {
      return String(window.STRIPE_PUBLISHABLE_KEY).trim();
    }
    try {
      const data = await ctx.getPublicConfig?.();
      const key = data && data.stripePublishableKey ? String(data.stripePublishableKey).trim() : '';
      if (key) {
        window.STRIPE_PUBLISHABLE_KEY = key;
        return key;
      }
    } catch {}
    return '';
  }

  function showStripeConfigError(msg) {
    try { alert(msg); } catch {}
    const payBtn = document.getElementById('payButton') || document.getElementById('payBtn');
    if (payBtn) payBtn.disabled = true;
  }

  window.__SS_STRIPE_CONFIG_RUNTIME__ = { ensureStripePublishableKey, showStripeConfigError };
})(window);
