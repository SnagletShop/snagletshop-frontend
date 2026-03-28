(function (window, document) {
  const EXP_CACHE_KEY = '__ss_experiments_v1';
  const UID_KEY = '__ss_ab_uid_v1';
  const CLICK_TOKEN_KEY = '__ss_recent_click_token_v1';
  const VIEW_SESSION_KEY = '__ss_view_session_v1';
  const ANALYTICS_SESSION_KEY = '__ss_analytics_session_v1';
  const LAST_PURCHASE_TRACK_KEY = '__ss_last_purchase_track_v1';

  function __ssAbFNV1a32(str) {
    let h = 0x811c9dc5;
    const s = String(str || '');
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function __ssToken(prefix = 't') {
    const rand = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now().toString(36)}_${rand}`;
  }

  function __ssSafeSessionStorage() {
    try { return window.sessionStorage; } catch { return null; }
  }

  function __ssSafeLocalStorage() {
    try { return window.localStorage; } catch { return null; }
  }

  function __ssAbGetUid() {
    try {
      const existing = localStorage.getItem(UID_KEY);
      if (existing) return existing;
      const uid = __ssToken('ab');
      localStorage.setItem(UID_KEY, uid);
      return uid;
    } catch {
      return __ssToken('ab');
    }
  }

  function __ssAbChooseBucket(expKey) {
    const uid = __ssAbGetUid();
    const hash = __ssAbFNV1a32(`${uid}:${String(expKey || '')}`);
    return (hash % 2) === 0 ? 'A' : 'B';
  }

  function __ssGetExperiments() {
    try {
      const raw = localStorage.getItem(EXP_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  async function __ssFetchServerExperiments() {
    try {
      const data = await window.__SS_CATALOG_API__?.getAssignments?.();
      const out = (data && typeof data === 'object' && data.assignments && typeof data.assignments === 'object')
        ? data.assignments
        : (data && typeof data === 'object' ? data : {});
      try { localStorage.setItem(EXP_CACHE_KEY, JSON.stringify(out || {})); } catch {}
      return out || {};
    } catch {
      const fallback = __ssGetExperiments();
      if (Object.keys(fallback).length) return fallback;
      const seeded = { pn: __ssAbChooseBucket('pn'), pd: __ssAbChooseBucket('pd'), dl: __ssAbChooseBucket('dl') };
      try { localStorage.setItem(EXP_CACHE_KEY, JSON.stringify(seeded)); } catch {}
      return seeded;
    }
  }

  function __ssABIsB(key) {
    const exps = __ssGetExperiments();
    const value = exps && exps[key];
    if (typeof value === 'string') return value.toUpperCase() === 'B';
    if (value && typeof value === 'object' && typeof value.bucket === 'string') return value.bucket.toUpperCase() === 'B';
    return __ssAbChooseBucket(key) === 'B';
  }

  function __ssABGetTextVariants(product, field) {
    if (!product || typeof product !== 'object') return [];
    const raw = Array.isArray(product[`${field}Variants`]) ? product[`${field}Variants`] : [];
    const primary = String((raw.length ? raw[0] : product[field]) || '').trim();
    const legacy = String(product[`${field}B`] || '').trim();
    const out = [];
    const seen = new Set();
    const push = (value) => {
      const next = String(value || '').trim();
      if (!next || seen.has(next)) return;
      seen.add(next);
      out.push(next);
    };
    push(primary);
    raw.forEach(push);
    push(legacy);
    return out;
  }

  function __ssABResolveVariantIndex(product, field, length) {
    const explicit = Number(product?.[`${field}VariantIndex`]);
    if (Number.isInteger(explicit) && explicit >= 0 && explicit < Number(length || 0)) return explicit;
    const key = `${String(product?.productId || product?.id || product?.productLink || product?.name || field)}:${field}`;
    return Number(length || 0) > 0 ? (__ssAbFNV1a32(`${__ssAbGetUid()}:${key}`) % Number(length || 1)) : 0;
  }

  function __ssABGetProductName(product) {
    if (!product || typeof product !== 'object') return '';
    const variants = __ssABGetTextVariants(product, 'name');
    if (!variants.length) return String(product.name || '').trim();
    return String(variants[__ssABResolveVariantIndex(product, 'name', variants.length)] || variants[0] || '').trim();
  }

  function __ssABGetProductDescription(product) {
    if (!product || typeof product !== 'object') return '';
    const variants = __ssABGetTextVariants(product, 'description');
    if (!variants.length) return String(product.description || '').trim();
    return String(variants[__ssABResolveVariantIndex(product, 'description', variants.length)] || variants[0] || '').trim();
  }

  function __ssABGetDeliveryText(product) {
    if (!product || typeof product !== 'object') return '';
    return String(product.deliveryText || product.shippingText || '').trim();
  }

  function __ssShipFreeText() {
    return 'Free shipping';
  }

  function __ssEnsureABUiStyles() {
    return true;
  }

  function __ssABGetPrimaryImageUrl(product) {
    if (!product || typeof product !== 'object') return '';
    if (Array.isArray(product.imagesB) && product.imagesB[0]) return String(product.imagesB[0]);
    if (Array.isArray(product.images) && product.images[0]) return String(product.images[0]);
    return String(product.image || '');
  }

  function __ssRememberClickToken(token) {
    try {
      localStorage.setItem(CLICK_TOKEN_KEY, JSON.stringify({ token: String(token || ''), at: Date.now() }));
    } catch {}
    return token;
  }

  function __ssConsumeRecentClickToken(maxAgeMs = 15_000) {
    try {
      const raw = localStorage.getItem(CLICK_TOKEN_KEY);
      if (!raw) return null;
      localStorage.removeItem(CLICK_TOKEN_KEY);
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.token) return null;
      if ((Date.now() - Number(parsed.at || 0)) > Number(maxAgeMs || 15_000)) return null;
      return String(parsed.token);
    } catch {
      return null;
    }
  }

  function __ssGetAnalyticsSessionId() {
    try {
      const winValue = String(window.__ssSessionId || '').trim();
      if (winValue) return winValue;
    } catch {}

    try {
      if (typeof window.__ssRecoGetSessionId === 'function') {
        const shared = String(window.__ssRecoGetSessionId() || '').trim();
        if (shared) {
          window.__ssSessionId = shared;
          return shared;
        }
      }
    } catch {}

    try {
      const store = __ssSafeSessionStorage();
      const existing = String(store?.getItem?.(ANALYTICS_SESSION_KEY) || '').trim();
      if (existing) {
        window.__ssSessionId = existing;
        return existing;
      }
      const next = __ssToken('sess');
      store?.setItem?.(ANALYTICS_SESSION_KEY, next);
      window.__ssSessionId = next;
      return next;
    } catch {}

    const fallback = __ssToken('sess');
    try { window.__ssSessionId = fallback; } catch {}
    return fallback;
  }

  function __ssGetCurrentAnalyticsPath() {
    try {
      return String(window.location?.pathname || '/').trim() || '/';
    } catch {
      return '/';
    }
  }

  function __ssBuildAnalyticsProductObject(productName, override = {}) {
    return {
      productId: String(override.productId || override.pid || override.id || '').trim(),
      name: String(productName || override.productName || override.name || '').trim(),
      category: String(override.category || '').trim(),
      productLink: String(override.productLink || override.link || '').trim(),
      priceEUR: Number(override.priceEUR || 0) || 0,
      currency: String(override.currency || '').trim().toUpperCase(),
    };
  }

  function __ssStartProductViewSession() {
    const session = { token: __ssToken('view'), at: Date.now() };
    try { __ssSafeSessionStorage()?.setItem?.(VIEW_SESSION_KEY, JSON.stringify(session)); } catch {}
    window.__ssCurrentViewToken = session.token;
    return session.token;
  }

  function __ssEndProductViewSessionSend(productName, productLink, extra = {}) {
    try {
      const store = __ssSafeSessionStorage();
      const raw = store?.getItem?.(VIEW_SESSION_KEY) || '';
      const parsed = raw ? JSON.parse(raw) : null;
      const token = String(window.__ssCurrentViewToken || parsed?.token || '').trim();
      const startedAt = Number(parsed?.at || 0) || 0;
      window.__ssCurrentViewToken = null;
      try { store?.removeItem?.(VIEW_SESSION_KEY); } catch {}
      if (!token) return false;
      const durationMs = Math.max(1, Date.now() - startedAt);
      return sendAnalyticsEvent('product_time', {
        ...buildAnalyticsProductPayload(productName || window.__ssCurrentViewedProductName, {
          productLink: productLink || window.__ssCurrentViewedProductLink || '',
        }),
        extra: {
          viewToken: token,
          durationMs,
          ...((extra && typeof extra === 'object') ? extra : {}),
        }
      }, { keepalive: true });
    } catch {
      return false;
    }
  }

  function buildAnalyticsProductPayload(productName, override = {}) {
    const product = __ssBuildAnalyticsProductObject(productName, override);
    const payload = {
      product,
      productName: product.name,
      priceEUR: product.priceEUR,
      productLink: product.productLink,
      extra: { ...(override.extra || {}) }
    };
    if (product.productId) payload.productId = product.productId;
    if (product.category) payload.category = product.category;
    if (product.currency) payload.currency = product.currency;
    return payload;
  }

  async function sendAnalyticsEvent(type, payload = {}, options = {}) {
    const product = (payload?.product && typeof payload.product === 'object')
      ? payload.product
      : __ssBuildAnalyticsProductObject(payload?.productName || payload?.name, payload || {});
    const body = {
      type: String(type || '').trim(),
      at: new Date().toISOString(),
      uid: __ssAbGetUid(),
      sessionId: __ssGetAnalyticsSessionId(),
      path: __ssGetCurrentAnalyticsPath(),
      websiteOrigin: window.location?.origin || '',
      experiments: __ssGetExperiments(),
      ...payload,
      product,
    };
    try {
      return await window.__SS_ANALYTICS__?.sendEvent?.(body, options);
    } catch {
      return false;
    }
  }

  function __ssReadBasketSnapshot() {
    try {
      if (typeof window.readBasket === 'function') {
        const basket = window.readBasket() || {};
        if (basket && typeof basket === 'object') return basket;
      }
    } catch {}
    try {
      return JSON.parse(localStorage.getItem('basket') || '{}') || {};
    } catch {
      return {};
    }
  }

  function __ssNormalizePurchaseItems(basket) {
    return Object.values(basket || {}).map((item) => ({
      productId: String(item?.productId || item?.pid || item?.id || '').trim(),
      name: String(item?.displayName || item?.name || '').trim(),
      productLink: String(item?.productLink || '').trim(),
      quantity: Math.max(1, Number(item?.quantity ?? item?.qty ?? 1) || 1),
      unitPriceEUR: Number(item?.price ?? item?.unitPriceEUR ?? 0) || 0,
      unitPriceOriginalEUR: item?.unitPriceOriginalEUR == null ? null : (Number(item?.unitPriceOriginalEUR || 0) || 0),
      recoDiscountToken: String(item?.recoDiscountToken || '').trim(),
      recoDiscountPct: Number(item?.recoDiscountPct || 0) || 0,
      recoTrackingToken: String(item?.recoTrackingToken || '').trim(),
      recoWidgetId: String(item?.recoWidgetId || '').trim(),
      recoSourceProductId: String(item?.recoSourceProductId || '').trim(),
      recoPosition: item?.recoPosition == null ? null : (Number(item?.recoPosition || 0) || 0),
      smartRecoToken: String(item?.smartRecoToken || '').trim(),
      smartRecoItemKey: String(item?.smartRecoItemKey || item?.productId || item?.name || '').trim(),
      smartRecoPlacement: String(item?.smartRecoPlacement || '').trim(),
    })).filter((item) => item.name || item.productId || item.productLink);
  }

  function __ssShouldSkipTrackedPurchase(key) {
    if (!key) return false;
    try {
      const store = __ssSafeSessionStorage();
      const raw = store?.getItem?.(LAST_PURCHASE_TRACK_KEY) || '';
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (String(parsed?.key || '') !== String(key)) return false;
      return (Date.now() - Number(parsed?.at || 0)) < (10 * 60 * 1000);
    } catch {
      return false;
    }
  }

  function __ssRememberTrackedPurchase(key) {
    if (!key) return;
    try {
      __ssSafeSessionStorage()?.setItem?.(LAST_PURCHASE_TRACK_KEY, JSON.stringify({ key: String(key), at: Date.now() }));
    } catch {}
  }

  async function __ssTrackSuccessfulPurchase(meta = {}, basketOverride = null) {
    try {
      const orderId = String(meta?.orderId || window.latestOrderId || '').trim();
      const paymentIntentId = String(meta?.paymentIntentId || window.latestPaymentIntentId || '').trim();
      const dedupeKey = orderId || paymentIntentId || '';
      if (__ssShouldSkipTrackedPurchase(dedupeKey)) return false;

      const basket = (basketOverride && typeof basketOverride === 'object') ? basketOverride : __ssReadBasketSnapshot();
      const items = __ssNormalizePurchaseItems(basket);
      if (!items.length) return false;

      const currency = String(localStorage.getItem('selectedCurrency') || window.selectedCurrency || meta?.currency || 'EUR').trim().toUpperCase();
      const totalEUR = items.reduce((sum, item) => sum + ((Number(item?.unitPriceEUR || 0) || 0) * (Number(item?.quantity || 1) || 1)), 0);
      const sessionId = __ssGetAnalyticsSessionId();

      __ssRememberTrackedPurchase(dedupeKey);

      await Promise.allSettled([
        sendAnalyticsEvent('purchase', {
          extra: {
            orderId: orderId || null,
            paymentIntentId: paymentIntentId || null,
            currency,
            itemsCount: items.length,
            totalEUR: Math.round(totalEUR * 100) / 100,
            items: items.map((item) => ({
              productId: item.productId || null,
              name: item.name || '',
              productLink: item.productLink || '',
              quantity: item.quantity,
              unitPriceEUR: item.unitPriceEUR,
              unitPriceOriginalEUR: item.unitPriceOriginalEUR,
              recoDiscountPct: item.recoDiscountPct || 0,
              smartRecoPlacement: item.smartRecoPlacement || '',
            })),
          }
        }, { keepalive: true }),
        ...items
          .filter((item) => item.recoTrackingToken && item.productId)
          .map((item) => window.__SS_RECOMMENDATIONS_SERVICE__?.sendRecoEvent?.({
            type: 'purchase',
            widgetId: item.recoWidgetId || '',
            token: item.recoTrackingToken,
            sourceProductId: item.recoSourceProductId || '',
            targetProductId: item.productId,
            position: item.recoPosition || 0,
            sessionId,
            extra: {
              orderId: orderId || null,
              paymentIntentId: paymentIntentId || null,
            }
          })),
        ...items
          .filter((item) => item.smartRecoToken && item.smartRecoItemKey)
          .map((item) => window.__SS_RECOMMENDATIONS_SERVICE__?.sendSmartRecoEvent?.({
            type: 'purchase',
            token: item.smartRecoToken,
            itemKey: item.smartRecoItemKey,
            sessionId,
          })),
      ]);

      return true;
    } catch {
      return false;
    }
  }

  (function __ssBindAnalyticsLifecycle() {
    if (window.__ssAnalyticsLifecycleBound === true) return;
    window.__ssAnalyticsLifecycleBound = true;
    window.addEventListener('pagehide', () => {
      try {
        __ssEndProductViewSessionSend(window.__ssCurrentViewedProductName, window.__ssCurrentViewedProductLink, { endReason: 'pagehide' });
      } catch {}
    }, { capture: true });
  })();

  window.__SS_ANALYTICS_HELPERS__ = {
    __ssAbFNV1a32,
    __ssAbGetUid,
    __ssAbChooseBucket,
    __ssFetchServerExperiments,
    __ssGetExperiments,
    __ssABIsB,
    __ssABGetProductName,
    __ssABGetProductDescription,
    __ssABGetDeliveryText,
    __ssShipFreeText,
    __ssEnsureABUiStyles,
    __ssABGetPrimaryImageUrl,
    sendAnalyticsEvent,
    __ssToken,
    __ssRememberClickToken,
    __ssConsumeRecentClickToken,
    __ssGetAnalyticsSessionId,
    __ssStartProductViewSession,
    __ssEndProductViewSessionSend,
    __ssTrackSuccessfulPurchase,
    buildAnalyticsProductPayload
  };
})(window, document);
