(function(window, document){
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getQuantityControls() {
    return getResolver()?.resolve?.('component.quantityControls', window.__SS_QUANTITY_CONTROLS__ || null) || null;
  }
  function parseMaybeJson(value) {
    if (typeof value !== 'string') return value;
    const s = value.trim();
    if (!s) return value;
    if (!(s.startsWith('{') || s.startsWith('['))) return value;
    try { return JSON.parse(s); } catch { return value; }
  }
  function parseLoosePrice(value) {
    try {
      if (typeof window.__ssParsePriceEUR === 'function') return window.__ssParsePriceEUR(value);
    } catch {}
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;
    let s = value.trim();
    if (!s) return 0;
    s = s.replace(/[^0-9,.\-]/g, '');
    if (!s) return 0;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
      else s = s.replace(/,/g, '');
    } else if (hasComma) {
      s = s.replace(/,/g, '.');
    }
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function createCartButton(label, onClick) {
    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'add-to-cart';
    addToCartBtn.type = 'button';
    addToCartBtn.innerHTML = `
      <span class="product-card__cart-label">
        ${label}
        <svg class="cart-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>`;
    addToCartBtn.addEventListener('click', (e) => { try { e.preventDefault(); e.stopPropagation(); } catch {} onClick?.(); });
    return addToCartBtn;
  }

  function getProductIdentity(product, opts = {}) {
    return {
      productId: String(product?.productId || product?.id || opts.productId || '').trim(),
      name: String(product?.name || opts.displayName || opts.productName || '').trim()
    };
  }

  function collectPositivePrice(out, value) {
    const num = parseLoosePrice(value);
    if (Number.isFinite(num) && num > 0) out.push(num);
  }

  function collectNestedPriceCandidates(out, value, depth = 0, seen = null) {
    if (depth > 6 || value == null) return;
    value = parseMaybeJson(value);
    if (Array.isArray(value)) {
      value.forEach((entry) => collectNestedPriceCandidates(out, entry, depth + 1, seen));
      return;
    }
    if (typeof value === 'object') {
      if (typeof WeakSet !== 'undefined') {
        seen = seen || new WeakSet();
        if (seen.has(value)) return;
        seen.add(value);
      }
      collectPositivePrice(out, value.price);
      collectPositivePrice(out, value.priceEUR);
      collectPositivePrice(out, value.basePrice);
      collectPositivePrice(out, value.sellPrice);
      collectPositivePrice(out, value.priceB);
      collectPositivePrice(out, value.addPrice);
      Object.values(value).forEach((entry) => collectNestedPriceCandidates(out, entry, depth + 1, seen));
      return;
    }
    collectPositivePrice(out, value);
  }

  function getResolvedPrice(product, opts = {}) {
    const prices = [];
    const identity = getProductIdentity(product, opts);
    collectPositivePrice(prices, opts.priceValue);
    collectPositivePrice(prices, product?.price);
    collectPositivePrice(prices, product?.priceEUR);
    collectPositivePrice(prices, product?.basePrice);
    collectPositivePrice(prices, product?.sellPrice);
    collectPositivePrice(prices, product?.priceB);
    collectNestedPriceCandidates(prices, product?.variantPrices);
    collectNestedPriceCandidates(prices, product?.variantPricesB);
    collectNestedPriceCandidates(prices, product?.variants);
    collectNestedPriceCandidates(prices, product?.options);
    const resolved = prices.length ? Math.min(...prices) : 0;
    if (resolved > 0) {
      try { window.__ssRememberProductPrice?.(identity, resolved); } catch {}
      return resolved;
    }
    try {
      const remembered = Number(window.__ssGetRememberedProductPrice?.(identity) || 0);
      if (Number.isFinite(remembered) && remembered > 0) return remembered;
    } catch {}
    return 0;
  }

  function buildProductHref(product, opts = {}) {
    try {
      const productId = String(opts.productId || product?.productId || product?.id || '').trim();
      const data = [
        opts.displayName || product?.name || '',
        opts.priceValue ?? product?.price ?? product?.priceEUR ?? product?.basePrice ?? product?.sellPrice ?? 0,
        opts.displayDescription || product?.description || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || '',
        String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || ''),
        productId || null,
        null
      ];
      const href = window.__SS_ROUTER__?.buildUrlForState?.({ action: 'GoToProductPage', data });
      if (typeof href === 'string' && href.trim()) return href;
    } catch {}
    return `${window.location.origin}/?product=${encodeURIComponent(product?.name || '')}`;
  }

  function parseLooseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;
    let text = value.trim();
    if (!text) return 0;
    text = text.replace(/\/\s*5\b/gi, '');
    text = text.replace(/[^\d.,+\-]/g, '');
    if (!text) return 0;
    if (text.includes(',') && text.includes('.')) {
      if (text.lastIndexOf(',') > text.lastIndexOf('.')) text = text.replace(/\./g, '').replace(/,/g, '.');
      else text = text.replace(/,/g, '');
    } else if (text.includes(',')) {
      text = text.replace(/,/g, '.');
    }
    text = text.replace(/\+/g, '');
    const parsed = Number.parseFloat(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeRatingValue(value) {
    const parsed = parseLooseNumber(value);
    return Math.max(0, Math.min(5, Math.round(parsed * 10) / 10));
  }

  function normalizeSoldCount(value) {
    const parsed = parseLooseNumber(value);
    return Math.max(0, Math.round(parsed));
  }

  function formatSoldCountLabel(value) {
    const soldCount = normalizeSoldCount(value);
    if (!(soldCount > 0)) return null;
    const compact = soldCount >= 1000 ? Math.floor(soldCount / 100) * 100 : soldCount;
    const formatted = new Intl.NumberFormat('en-US').format(compact);
    return {
      value: `${formatted}${soldCount >= 1000 ? '+' : ''}`,
      suffix: ' sold'
    };
  }

  function buildRatingStars(ratingValue) {
    const fullStars = Math.max(0, Math.min(5, Math.floor(normalizeRatingValue(ratingValue))));
    let markup = '';
    for (let i = 0; i < 5; i += 1) {
      markup += `<span class="product-rating-star${i < fullStars ? ' is-filled' : ''}" aria-hidden="true">${i < fullStars ? '★' : '☆'}</span>`;
    }
    return markup;
  }

  function buildPreciseRatingStars(ratingValue) {
    const normalized = normalizeRatingValue(ratingValue);
    let markup = '';
    for (let i = 0; i < 5; i += 1) {
      const fill = Math.max(0, Math.min(1, normalized - i));
      const fillPct = Math.round(fill * 100);
      markup += `<span class="product-rating-star product-rating-star--precise" style="--star-fill:${fillPct}%;" aria-hidden="true"><span class="product-rating-star__base">★</span><span class="product-rating-star__fill">★</span></span>`;
    }
    return markup;
  }

  function createProductSocialProof(product) {
      const ratingValue = normalizeRatingValue(product?.ratingValue ?? product?.starsRating ?? product?.rating ?? product?.ratingOutOf5);
      const soldLabel = formatSoldCountLabel(product?.soldCount ?? product?.purchasedCount ?? product?.purchasesCount ?? product?.purchaseCount);
      if (!(ratingValue > 0) && !soldLabel) return null;

      const meta = document.createElement('div');
      meta.className = 'product-rating-meta';

      const primary = document.createElement('span');
      primary.className = 'product-rating-primary product-card-rating-primary';

      const secondary = document.createElement('span');
      secondary.className = 'product-rating-secondary product-card-rating-secondary';

      const stars = document.createElement('span');
      stars.className = 'product-rating-stars product-card-rating-stars';
      stars.innerHTML = buildPreciseRatingStars(ratingValue);
      primary.appendChild(stars);

      if (ratingValue > 0) {
        const rating = document.createElement('span');
        rating.className = 'product-rating-value product-card-rating-value';
        rating.textContent = ratingValue.toFixed(1);
        primary.appendChild(rating);
      }

      if (soldLabel) {
        if (ratingValue > 0) {
          const separator = document.createElement('span');
          separator.className = 'product-rating-separator product-card-rating-separator';
          separator.textContent = '|';
          secondary.appendChild(separator);
        }
        const sold = document.createElement('span');
        sold.className = 'product-sold-count product-card-sold-count';
        sold.innerHTML = `<span class="product-sold-count__value product-card-sold-count__value">${soldLabel.value}</span><span class="product-sold-count__suffix product-card-sold-count__suffix">${soldLabel.suffix}</span>`;
        secondary.appendChild(sold);
      }

      if (primary.childNodes.length) meta.appendChild(primary);
      if (secondary.childNodes.length) meta.appendChild(secondary);

      return meta;
    }

  function shouldHandleInAppNavigation(event) {
    return !(event?.defaultPrevented || event?.button !== 0 || event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey);
  }

  function createProductCard(product, opts = {}) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');
    const identity = getProductIdentity(product, opts);
    if (identity.productId) productDiv.dataset.productId = identity.productId;
    if (identity.name) productDiv.dataset.productName = identity.name;

    const card = document.createElement('div');
    card.className = 'product-card';
    if (identity.productId) card.dataset.productId = identity.productId;
    if (identity.name) card.dataset.productName = identity.name;

    const nameLink = document.createElement('a');
    nameLink.className = 'product-name product-name-link';
    nameLink.textContent = opts.displayName || product?.name || '';
    nameLink.href = opts.href || buildProductHref(product, opts);
    nameLink.addEventListener('click', (e) => {
      if (!shouldHandleInAppNavigation(e)) return;
      e.preventDefault();
      try { e.stopPropagation(); } catch {}
      opts.onOpenProduct?.(product);
    });

    const mediaFrame = document.createElement('div');
    mediaFrame.className = 'product-media-frame';
    mediaFrame.addEventListener('click', () => opts.onOpenProduct?.(product));

    const img = document.createElement('img');
    img.className = 'Clickable_Image';
    const resolvedPrice = getResolvedPrice(product, opts);
    img.src = product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '';
    img.alt = product?.name || '';
    img.dataset.name = product?.name || '';
    img.dataset.price = String(resolvedPrice || '');
    img.dataset.imageurl = product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '';
    img.dataset.description = opts.displayDescription || product?.description || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || '';
    img.addEventListener('click', () => opts.onOpenProduct?.(product));
    mediaFrame.appendChild(img);

    const priceP = document.createElement('p');
    priceP.className = 'product-price';
    priceP.dataset.eur = String(resolvedPrice || 0);
    if (identity.productId) priceP.dataset.productId = identity.productId;
    if (identity.name) priceP.dataset.productName = identity.name;
    const fallbackPriceText = (() => {
      try {
        const formatted = window.__ssFormatDisplayPrice?.(resolvedPrice);
        if (typeof formatted === 'string' && formatted.trim()) return formatted;
      } catch {}
      return `${resolvedPrice}${opts.currencySymbol || '€'}`;
    })();
    priceP.textContent = opts.priceText || fallbackPriceText;

    const qtyUi = getQuantityControls()?.createCatalogQuantityControls?.(product, {
      onDecrease: opts.onDecrease,
      onIncrease: opts.onIncrease,
    });
    const socialProof = createProductSocialProof(product);

    const addToCartBtn = createCartButton(window.TEXTS?.PRODUCT_SECTION?.ADD_TO_CART || 'Add to cart', () => opts.onAddToCart?.(product));
    qtyUi?.quantityContainer?.appendChild(addToCartBtn);

    card.append(nameLink, mediaFrame, priceP);
    if (socialProof) card.appendChild(socialProof);
    card.append(qtyUi?.quantityContainer || document.createElement('div'));
    productDiv.appendChild(card);
    return productDiv;
  }

  const api = { createProductCard, createProductSocialProof };
  try { getResolver()?.expose?.('component.productCard', api, ['__SS_PRODUCT_CARD__']); } catch { window.__SS_PRODUCT_CARD__ = api; }
})(window, document);
