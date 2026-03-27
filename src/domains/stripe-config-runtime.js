(function (window) {
  'use strict';

  const LEGACY_TRUNCATED_TEST_PK = 'pk_test_51QvljKCvmsp7wkrwLSpmOlOkbs1QzlXX2noHpkmqTzB27Qb4ggzYi75F7rIyEPDGf5cuH28ogLDSQOdwlbvrZ9oC00J6B9';
  const LEGACY_MONOLITH_TEST_PK = 'pk_test_51QvljKCvmsp7wkrwLSpmOlOkbs1QzlXX2noHpkmqTzB27Qb4ggzYi75F7rIyEPDGf5cuH28ogLDSQOdwlbvrZ9oC00J6B9lZLi';
  const PRODUCTION_HOST_RE = /(^|\.)snagletshop\.com$/i;

  function normalizePublishableKey(raw) {
    return String(raw || '').trim();
  }

  function repairLegacyPublishableKey(raw) {
    const key = normalizePublishableKey(raw);
    if (!key) return '';
    if (key === LEGACY_TRUNCATED_TEST_PK) return LEGACY_MONOLITH_TEST_PK;
    return key;
  }

  function extractPublishableKey(data) {
    return repairLegacyPublishableKey(
      data?.stripePublishableKey ||
      data?.publishableKey ||
      data?.config?.stripePublishableKey ||
      data?.config?.publishableKey
    );
  }

  function assertPublishableKeySafe(pk) {
    const key = repairLegacyPublishableKey(pk);
    if (!key || key === '__STRIPE_PUBLISHABLE_KEY__') {
      throw new Error('Stripe publishable key is not configured. Set <meta name="stripe-publishable-key" content="pk_live_..."/> or provide it from the backend public config.');
    }
    if (key.startsWith('sk_')) {
      throw new Error('Stripe secret key was supplied to the storefront. Use a Stripe publishable key (pk_...) instead.');
    }
    if (key.startsWith('pk_test_')) {
      if (PRODUCTION_HOST_RE.test(String(window.location?.hostname || ''))) {
        throw new Error('A Stripe TEST publishable key was supplied on a production host. Fix the backend/public config before enabling checkout.');
      }
      try { console.warn('[stripe][config] Using a Stripe TEST publishable key on this domain.'); } catch {}
    }
    return key;
  }

  async function ensureStripePublishableKey(ctx = {}) {
    const fromWindow = repairLegacyPublishableKey(window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE);
    if (fromWindow) {
      const safe = assertPublishableKeySafe(fromWindow);
      window.STRIPE_PUBLISHABLE_KEY = safe;
      window.STRIPE_PUBLISHABLE = safe;
      return safe;
    }

    const fromMeta = repairLegacyPublishableKey(window.document?.querySelector?.('meta[name="stripe-publishable-key"]')?.content);
    if (fromMeta) {
      const safe = assertPublishableKeySafe(fromMeta);
      window.STRIPE_PUBLISHABLE_KEY = safe;
      window.STRIPE_PUBLISHABLE = safe;
      return safe;
    }

    const fromPreloaded = extractPublishableKey(
      window.preloadedData?.publicConfig ||
      window.preloadedData?.storefrontConfig ||
      window.storefrontCfg
    );
    if (fromPreloaded) {
      const safe = assertPublishableKeySafe(fromPreloaded);
      window.STRIPE_PUBLISHABLE_KEY = safe;
      window.STRIPE_PUBLISHABLE = safe;
      return safe;
    }

    const loaders = [
      () => ctx.getPublicConfig?.(),
      () => window.__SS_CATALOG_API__?.getPublicConfig?.(),
      () => window.__SS_CATALOG_SERVICE__?.getPublicConfig?.(),
      () => window.__SS_PRICING_SERVICE__?.getStorefrontConfig?.(),
      () => window.__SS_API__?.json?.('/public-config', { method: 'GET' }),
      () => window.__SS_API__?.json?.('/storefront-config', { method: 'GET', credentials: 'include' })
    ];
    for (const load of loaders) {
      try {
        const data = await load?.();
        const key = extractPublishableKey(data);
        if (!key) continue;
        const safe = assertPublishableKeySafe(key);
        window.STRIPE_PUBLISHABLE_KEY = safe;
        window.STRIPE_PUBLISHABLE = safe;
        return safe;
      } catch {}
    }

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
