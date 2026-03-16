(function (window, document) {
  const EXP_CACHE_KEY = '__ss_experiments_v1';
  const UID_KEY = '__ss_ab_uid_v1';
  const CLICK_TOKEN_KEY = '__ss_recent_click_token_v1';
  const VIEW_SESSION_KEY = '__ss_view_session_v1';

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

  function __ssABGetProductName(product) {
    if (!product || typeof product !== 'object') return '';
    return String(product.name || '').trim();
  }

  function __ssABGetProductDescription(product) {
    if (!product || typeof product !== 'object') return '';
    return String(product.description || '').trim();
  }

  function __ssABGetDeliveryText(product) {
    if (!product || typeof product !== 'object') return '';
    return String(product.deliveryText || product.shippingText || '').trim();
  }

  function __ssShipFreeText() {
    return 'Free shipping';
  }

  function __ssEnsureABUiStyles() {
    if (document.getElementById('__ss_ab_ui_styles')) return;
    const style = document.createElement('style');
    style.id = '__ss_ab_ui_styles';
    style.textContent = '.ss-ab-hidden{display:none !important;}';
    document.head.appendChild(style);
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

  function __ssConsumeRecentClickToken(maxAgeMs = 15000) {
    try {
      const raw = localStorage.getItem(CLICK_TOKEN_KEY);
      if (!raw) return null;
      localStorage.removeItem(CLICK_TOKEN_KEY);
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.token) return null;
      if ((Date.now() - Number(parsed.at || 0)) > Number(maxAgeMs || 15000)) return null;
      return String(parsed.token);
    } catch {
      return null;
    }
  }

  function __ssStartProductViewSession() {
    const session = { token: __ssToken('view'), at: Date.now() };
    try { sessionStorage.setItem(VIEW_SESSION_KEY, JSON.stringify(session)); } catch {}
    window.__ssCurrentViewToken = session.token;
    return session.token;
  }

  function __ssEndProductViewSessionSend(productName, productLink) {
    try {
      const token = window.__ssCurrentViewToken || null;
      window.__ssCurrentViewToken = null;
      try { sessionStorage.removeItem(VIEW_SESSION_KEY); } catch {}
      if (!token) return false;
      return sendAnalyticsEvent('product_view_end', {
        ...buildAnalyticsProductPayload(productName, { productLink }),
        extra: { viewToken: token }
      }, { keepalive: true });
    } catch {
      return false;
    }
  }

  function buildAnalyticsProductPayload(productName, override = {}) {
    const payload = {
      productName: String(productName || override.productName || '').trim(),
      priceEUR: Number(override.priceEUR || 0) || 0,
      productLink: String(override.productLink || '').trim(),
      extra: { ...(override.extra || {}) }
    };
    if (override.productId) payload.productId = String(override.productId);
    if (override.currency) payload.currency = String(override.currency);
    return payload;
  }

  async function sendAnalyticsEvent(type, payload = {}, options = {}) {
    const body = {
      type: String(type || '').trim(),
      at: new Date().toISOString(),
      uid: __ssAbGetUid(),
      experiments: __ssGetExperiments(),
      ...payload
    };
    try {
      return await window.__SS_ANALYTICS__?.sendEvent?.(body, options);
    } catch {
      return false;
    }
  }

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
    __ssStartProductViewSession,
    __ssEndProductViewSessionSend,
    buildAnalyticsProductPayload
  };
})(window, document);
