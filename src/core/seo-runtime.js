(function (window, document) {
  const SITE_NAME = 'SnagletShop';
  const DEFAULT_DESC = 'Discover useful products at SnagletShop with crawlable category pages, rich product details, and fast browsing.';
  const DEFAULT_IMAGE = '/favicon.png';
  const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  const NOINDEX_ROBOTS = 'noindex,follow';

  function setHtmlLang(lang) {
    try {
      const root = document.documentElement;
      if (root && lang) root.lang = String(lang);
    } catch {}
  }

  function upsertMeta(selector, attrName, attrValue, content) {
    try {
      let el = document.head.querySelector(selector);
      if (!content) {
        if (el) el.remove();
        return;
      }
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', String(content));
    } catch {}
  }

  function setMeta(name, content) {
    upsertMeta(`meta[name="${name}"]`, 'name', name, content);
  }

  function setPropertyMeta(name, content) {
    upsertMeta(`meta[property="${name}"]`, 'property', name, content);
  }

  function setCanonical(href) {
    try {
      let el = document.head.querySelector('link[rel="canonical"]');
      if (!href) {
        if (el) el.remove();
        return;
      }
      if (!el) {
        el = document.createElement('link');
        el.rel = 'canonical';
        document.head.appendChild(el);
      }
      el.href = String(href);
    } catch {}
  }

  function setAlternateHreflang(lang, href) {
    try {
      const selector = `link[rel="alternate"][hreflang="${lang}"]`;
      let el = document.head.querySelector(selector);
      if (!href) {
        if (el) el.remove();
        return;
      }
      if (!el) {
        el = document.createElement('link');
        el.rel = 'alternate';
        el.hreflang = lang;
        document.head.appendChild(el);
      }
      el.href = String(href);
    } catch {}
  }

  function absolutize(value) {
    const raw = String(value || '').trim();
    if (!raw) return `${window.location.origin}${DEFAULT_IMAGE}`;
    try {
      return new URL(raw, window.location.origin).toString();
    } catch {
      return `${window.location.origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
    }
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item';
  }

  function getCanonicalCategoryPath(category) {
    try {
      const path = window.__SS_ROUTER__?.getCanonicalCategoryPath?.(category);
      if (typeof path === 'string' && path.trim()) return path;
    } catch {}
    const slug = slugify(category || 'products');
    return `/category/${encodeURIComponent(slug)}`;
  }

  function getCanonicalProductPath(product) {
    try {
      const path = window.__SS_ROUTER__?.getCanonicalProductPath?.(product, {
        name: product?.name,
        productId: product?.productId || product?.id || ''
      });
      if (typeof path === 'string' && path.trim()) return path;
    } catch {}
    const slug = String(product?.slug || '').trim() || (() => {
      const base = slugify(product?.name || product?.productLink || product?.productId || product?.id || 'product');
      const productId = String(product?.productId || product?.id || '').trim();
      return productId ? `${base}-${productId}` : base;
    })();
    return `/product/${encodeURIComponent(slug)}`;
  }

  function truncate(value, max) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!max || text.length <= max) return text;
    return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
  }

  function getCurrentPathCanonical() {
    try {
      return new URL(window.location.pathname + window.location.search, window.location.origin).toString();
    } catch {
      return `${window.location.origin}/`;
    }
  }

  function applyMeta(payload) {
    try {
      const title = String(payload?.title || SITE_NAME).trim() || SITE_NAME;
      const description = String(payload?.description || DEFAULT_DESC).trim() || DEFAULT_DESC;
      const canonical = String(payload?.canonical || `${window.location.origin}/`).trim() || `${window.location.origin}/`;
      const image = absolutize(payload?.image || DEFAULT_IMAGE);
      const robots = String(payload?.robots || DEFAULT_ROBOTS).trim() || DEFAULT_ROBOTS;
      const ogType = String(payload?.ogType || 'website').trim() || 'website';

      document.title = title;
      setCanonical(canonical);
      setAlternateHreflang('x-default', canonical);
      setAlternateHreflang('en', canonical);

      setMeta('description', description);
      setMeta('robots', robots);
      setMeta('googlebot', robots);
      setMeta('application-name', SITE_NAME);
      setMeta('theme-color', '#ffffff');
      setPropertyMeta('og:site_name', SITE_NAME);
      setPropertyMeta('og:type', ogType);
      setPropertyMeta('og:locale', 'en_US');
      setPropertyMeta('og:title', title);
      setPropertyMeta('og:description', description);
      setPropertyMeta('og:url', canonical);
      setPropertyMeta('og:image', image);
      setPropertyMeta('og:image:secure_url', image);
      setPropertyMeta('og:image:alt', title);
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:title', title);
      setMeta('twitter:description', description);
      setMeta('twitter:image', image);
      setMeta('twitter:image:alt', title);
    } catch {}
  }

  function getRoute() {
    try {
      return window.__SS_ROUTER__?.parseRoute?.(window.location.href) || null;
    } catch {
      return null;
    }
  }

  function findProductForRoute(route) {
    try {
      if (route?.productSlug && typeof window.findProductBySlug === 'function') {
        const hit = window.findProductBySlug(route.productSlug);
        if (hit) return hit;
      }
    } catch {}
    try {
      if (route?.productName && typeof window.findProductByNameParam === 'function') {
        const hit = window.findProductByNameParam(route.productName);
        if (hit) return hit;
      }
    } catch {}
    try {
      if (route?.productId) {
        const flat = typeof window.__ssGetCatalogFlat === 'function' ? window.__ssGetCatalogFlat() : [];
        const norm = typeof window.__ssIdNorm === 'function' ? window.__ssIdNorm : ((value) => String(value || '').trim());
        const wanted = norm(route.productId);
        return (flat || []).find((product) => norm(product?.productId) === wanted) || null;
      }
    } catch {}
    return null;
  }

  function inferProductFromDom() {
    try {
      const heading = document.querySelector('.Product_Name_Heading');
      if (!heading) return null;
      const name = String(heading.dataset?.canonicalName || heading.textContent || '').trim();
      if (!name) return null;
      const description = String(document.querySelector('.Product_Description')?.textContent || '').trim();
      const image = String(document.querySelector('#mainImage, .mainImage, .Product_Images img')?.getAttribute('src') || '').trim();
      const productId = String(document.querySelector('#product-page-price')?.dataset?.productId || '').trim();
      return { name, description, image, productId };
    } catch {
      return null;
    }
  }

  function applyHome() {
    applyMeta({
      title: `${SITE_NAME} | Discover trending products with free shipping`,
      description: DEFAULT_DESC,
      canonical: `${window.location.origin}/`,
      image: DEFAULT_IMAGE,
      robots: DEFAULT_ROBOTS,
      ogType: 'website'
    });
  }

  function applyCategory(category) {
    const name = String(category || '').trim() || 'Products';
    applyMeta({
      title: `${name} | ${SITE_NAME}`,
      description: truncate(`Browse ${name} products at ${SITE_NAME}. Compare prices, see images, and open detailed product pages with current store content.`, 155),
      canonical: `${window.location.origin}${getCanonicalCategoryPath(name)}`,
      image: DEFAULT_IMAGE,
      robots: DEFAULT_ROBOTS,
      ogType: 'website'
    });
  }

  function applyProduct(product) {
    if (!product) return;
    const name = String(product.name || 'Product').trim() || 'Product';
    const description = truncate(product.description || DEFAULT_DESC, 155) || DEFAULT_DESC;
    const image = product.image || (Array.isArray(product.images) ? product.images[0] : '') || DEFAULT_IMAGE;
    applyMeta({
      title: `${name} | ${SITE_NAME}`,
      description,
      canonical: `${window.location.origin}${getCanonicalProductPath(product)}`,
      image,
      robots: DEFAULT_ROBOTS,
      ogType: 'product'
    });
    const price = Number(product.price || product.priceEUR || product.basePrice || product.sellPrice || 0) || 0;
    setPropertyMeta('product:price:amount', price > 0 ? String(price) : '');
    setPropertyMeta('product:price:currency', price > 0 ? 'EUR' : '');
    setPropertyMeta('product:availability', product.enabled === false ? 'out of stock' : 'in stock');
  }

  function applySearch(query) {
    const q = String(query || '').trim();
    applyMeta({
      title: q ? `${q} | Search | ${SITE_NAME}` : `${SITE_NAME} | Search`,
      description: q ? `Search results for ${q} at ${SITE_NAME}.` : `Search ${SITE_NAME} products.`,
      canonical: getCurrentPathCanonical(),
      image: DEFAULT_IMAGE,
      robots: NOINDEX_ROBOTS,
      ogType: 'website'
    });
  }

  function applyUtility(title, description) {
    applyMeta({
      title: `${title} | ${SITE_NAME}`,
      description: description || DEFAULT_DESC,
      canonical: getCurrentPathCanonical(),
      image: DEFAULT_IMAGE,
      robots: NOINDEX_ROBOTS,
      ogType: 'website'
    });
  }

  function syncFromRoute() {
    try {
      setHtmlLang('en');
      const route = getRoute();
      if (route?.orderId) {
        applyUtility('Order status', 'Track your order status at SnagletShop.');
        return;
      }
      if (route?.view === 'cart') {
        applyUtility('Basket', 'Review your basket at SnagletShop.');
        return;
      }
      if (route?.view === 'settings') {
        applyUtility('Settings', 'Manage your storefront preferences.');
        return;
      }
      if (route?.query) {
        applySearch(route.query);
        return;
      }
      if (route?.productId || route?.productName || route?.productSlug || String(route?.path || '').startsWith('/product/') || String(route?.path || '').startsWith('/p/')) {
        applyProduct(findProductForRoute(route) || inferProductFromDom() || {
          name: route?.productName || 'Product',
          slug: route?.productSlug || '',
          productId: route?.productId || ''
        });
        return;
      }
      if (route?.category || route?.categorySlug || String(route?.path || '').startsWith('/category/')) {
        applyCategory(route?.category || route?.categorySlug || 'Products');
        return;
      }
      applyHome();
    } catch {}
  }

  let syncTimer = 0;
  let historyInstalled = false;

  function scheduleSync() {
    try {
      if (syncTimer) window.clearTimeout(syncTimer);
    } catch {}
    syncTimer = window.setTimeout(() => {
      syncTimer = 0;
      try { syncFromRoute(); } catch {}
      try { window.setTimeout(syncFromRoute, 250); } catch {}
      try { window.setTimeout(syncFromRoute, 900); } catch {}
    }, 0);
  }

  function installHistorySync() {
    if (historyInstalled) return;
    historyInstalled = true;
    try {
      const originalPushState = window.history.pushState.bind(window.history);
      const originalReplaceState = window.history.replaceState.bind(window.history);
      window.history.pushState = function pushStatePatched() {
        const out = originalPushState.apply(window.history, arguments);
        scheduleSync();
        return out;
      };
      window.history.replaceState = function replaceStatePatched() {
        const out = originalReplaceState.apply(window.history, arguments);
        scheduleSync();
        return out;
      };
    } catch {}
    try { window.addEventListener('popstate', scheduleSync, { passive: true }); } catch {}
  }

  function installLinkInterception() {
    document.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      try {
        const target = String(a.getAttribute('target') || '').toLowerCase();
        if (target === '_blank' || a.hasAttribute('download')) return;
        const u = new URL(a.href, window.location.href);
        if (u.origin !== window.location.origin) return;
        const m = u.pathname.match(/^\/(product|category)\/([^/?#]+)/);
        if (!m) return;
        e.preventDefault();
        if (m[1] === 'product') {
          const decoded = decodeURIComponent(m[2]).replace(/-/g, ' ');
          const product = window.findProductBySlug?.(m[2]) || window.findProductByName?.(decoded);
          if (product) {
            const image = String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '');
            const data = [product.name, product.price, product.description, image, product.productId || null, null];
            return typeof window.navigate === 'function' ? window.navigate('GoToProductPage', data) : window.GoToProductPage?.(...data);
          }
        }
        if (m[1] === 'category') {
          const raw = decodeURIComponent(m[2]);
          const resolved = window.__SS_ROUTER__?.resolveCategoryKey?.(raw) || raw.replace(/-/g, '_');
          return typeof window.navigate === 'function'
            ? window.navigate('loadProducts', [resolved, localStorage.getItem('defaultSort') || 'NameFirst', window.currentSortOrder || 'asc'])
            : window.loadProducts?.(resolved);
        }
        window.location.href = u.href;
      } catch {}
    });
  }

  const api = {
    applyHome,
    applyCategory,
    applyProduct,
    applySearch,
    applyUtility,
    syncFromRoute,
    scheduleSync,
    installLinkInterception,
    installHistorySync
  };

  try {
    document.addEventListener('DOMContentLoaded', () => {
      installLinkInterception();
      installHistorySync();
      scheduleSync();
    }, { once: true });
  } catch {}

  window.__SS_SEO_RUNTIME__ = api;
})(window, document);
