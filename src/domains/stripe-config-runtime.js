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

  function normalizeStripeMode(raw) {
    const mode = String(raw || '').trim().toLowerCase();
    return (mode === 'test' || mode === 'live') ? mode : '';
  }

  function extractStripeConfig(data) {
    const key = repairLegacyPublishableKey(
      data?.stripePublishableKey ||
      data?.publishableKey ||
      data?.config?.stripePublishableKey ||
      data?.config?.publishableKey
    );
    const stripeMode = normalizeStripeMode(
      data?.stripeMode ||
      data?.config?.stripeMode ||
      data?.meta?.stripeMode ||
      ''
    );
    return { key, stripeMode };
  }

  function getWindowStripeMode() {
    return normalizeStripeMode(
      window.__SS_STRIPE_MODE ||
      window.preloadedData?.publicConfig?.stripeMode ||
      window.preloadedData?.storefrontConfig?.stripeMode ||
      window.preloadedData?.publicConfig?.config?.stripeMode ||
      window.preloadedData?.storefrontConfig?.config?.stripeMode ||
      window.storefrontCfg?.stripeMode ||
      window.storefrontCfg?.config?.stripeMode ||
      window.document?.querySelector?.('meta[name="stripe-mode"]')?.content ||
      ''
    );
  }

  function rememberStripeConfig(key, stripeMode) {
    const safeKey = repairLegacyPublishableKey(key);
    const mode = normalizeStripeMode(stripeMode);
    if (safeKey) {
      window.STRIPE_PUBLISHABLE_KEY = safeKey;
      window.STRIPE_PUBLISHABLE = safeKey;
    }
    if (mode) window.__SS_STRIPE_MODE = mode;
    return safeKey;
  }

  function assertPublishableKeySafe(pk, opts = {}) {
    const key = repairLegacyPublishableKey(pk);
    const stripeMode = normalizeStripeMode(opts.stripeMode || getWindowStripeMode());
    if (!key || key === '__STRIPE_PUBLISHABLE_KEY__') {
      throw new Error('Stripe publishable key is not configured. Set <meta name="stripe-publishable-key" content="pk_live_..."/> or provide it from the backend public config.');
    }
    if (key.startsWith('sk_')) {
      throw new Error('Stripe secret key was supplied to the storefront. Use a Stripe publishable key (pk_...) instead.');
    }
    if (key.startsWith('pk_test_')) {
      const isProductionHost = PRODUCTION_HOST_RE.test(String(window.location?.hostname || ''));
      const backendExplicitlyTest = stripeMode === 'test';
      if (isProductionHost && !backendExplicitlyTest) {
        throw new Error('A Stripe TEST publishable key was supplied on a production host. Fix the backend/public config before enabling checkout.');
      }
      try {
        console.warn(backendExplicitlyTest
          ? '[stripe][config] Backend explicitly enabled Stripe TEST mode on this host.'
          : '[stripe][config] Using a Stripe TEST publishable key on this domain.');
      } catch {}
    }
    return key;
  }

  async function ensureStripePublishableKey(ctx = {}) {
    const fromWindow = repairLegacyPublishableKey(window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE);
    if (fromWindow) {
      const stripeMode = getWindowStripeMode();
      const safe = assertPublishableKeySafe(fromWindow, { stripeMode });
      return rememberStripeConfig(safe, stripeMode);
    }

    const fromMeta = repairLegacyPublishableKey(window.document?.querySelector?.('meta[name="stripe-publishable-key"]')?.content);
    if (fromMeta) {
      const stripeMode = normalizeStripeMode(window.document?.querySelector?.('meta[name="stripe-mode"]')?.content);
      const safe = assertPublishableKeySafe(fromMeta, { stripeMode });
      return rememberStripeConfig(safe, stripeMode);
    }

    const preloaded = extractStripeConfig(
      window.preloadedData?.publicConfig ||
      window.preloadedData?.storefrontConfig ||
      window.storefrontCfg
    );
    if (preloaded.key) {
      const safe = assertPublishableKeySafe(preloaded.key, { stripeMode: preloaded.stripeMode });
      return rememberStripeConfig(safe, preloaded.stripeMode);
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
        const cfg = extractStripeConfig(data);
        if (!cfg.key) continue;
        const safe = assertPublishableKeySafe(cfg.key, { stripeMode: cfg.stripeMode });
        return rememberStripeConfig(safe, cfg.stripeMode);
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
