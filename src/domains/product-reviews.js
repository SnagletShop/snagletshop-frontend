(function (window, document) {
  'use strict';

  const MAX_IMAGE_BYTES_TOTAL = 10 * 1024 * 1024;
  const REVIEWS_PAGE_SIZE = 3;
  let lastProductKey = '';

  function api() { return window.__SS_API__ || null; }
  function auth() { return window.__SS_CUSTOMER_AUTH__ || null; }
  function viewer() { return document.getElementById('Viewer'); }
  function clearSort() {
    try { window.removeSortContainer?.(); } catch {}
  }
  function esc(value) {
    try { return window.__ssSafeEscHtml?.(value) || ''; } catch {}
    return String(value == null ? '' : value).replace(/[&<>"]/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]));
  }
  function productCard() { return window.__SS_PRODUCT_CARD__ || null; }
  function formatDate(value) {
    try {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return '';
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {}
    return '';
  }
  function formatBytes(value) {
    let num = Number(value || 0) || 0;
    const units = ['B', 'KB', 'MB'];
    let idx = 0;
    while (num >= 1024 && idx < units.length - 1) {
      num /= 1024;
      idx += 1;
    }
    return `${num.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
  }

  function productIdOf(product) {
    return String(product?.productId || product?.id || window.__ssCurrentProductId || '').trim();
  }

  function reviewRouteUrl(product) {
    const productId = productIdOf(product);
    if (productId) return `/?view=review&productId=${encodeURIComponent(productId)}`;
    const productName = String(product?.name || product?.productName || '').trim();
    if (productName) return `/?view=review&product=${encodeURIComponent(productName)}`;
    return '/?view=review';
  }

  function openReviewRoute(product) {
    try {
      const state = window.__SS_ROUTER__?.createReviewState?.(product || {}, {});
      if (state && typeof window.navigate === 'function') {
        window.navigate(state.action, state.data);
        return;
      }
    } catch {}
    try {
      const href = window.__SS_ROUTER__?.buildUrlForState?.(
        window.__SS_ROUTER__?.createReviewState?.(product || {}, {}) || null
      );
      if (typeof href === 'string' && href.trim()) {
        window.location.assign(href);
        return;
      }
    } catch {}
    try { window.location.assign(reviewRouteUrl(product)); } catch {}
  }

  function openProductRoute(product) {
    const payload = [
      String(product?.name || '').trim(),
      Number(product?.price ?? product?.priceEUR ?? product?.basePrice ?? product?.sellPrice ?? 0) || 0,
      String(product?.description || '').trim(),
      String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '').trim(),
      String(product?.productId || product?.id || '').trim() || null,
      null
    ];
    try {
      if (typeof window.navigate === 'function') {
        window.navigate('GoToProductPage', payload);
        return;
      }
    } catch {}
    try {
      const href = window.__SS_ROUTER__?.buildUrlForState?.({ action: 'GoToProductPage', data: payload });
      if (typeof href === 'string' && href.trim()) {
        window.location.assign(href);
        return;
      }
    } catch {}
    try { window.location.assign('/'); } catch {}
  }

  function catalogProducts() {
    try {
      if (typeof window.getAllProductsFlatSafe === 'function') return window.getAllProductsFlatSafe() || [];
    } catch {}
    try {
      if (typeof window.__ssGetCatalogFlat === 'function') return window.__ssGetCatalogFlat() || [];
    } catch {}
    return [];
  }

  function resolveReviewProduct(payload = {}) {
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const candidate = data[0] && typeof data[0] === 'object' ? data[0] : (payload?.product && typeof payload.product === 'object' ? payload.product : null);
    const routeProductId = String(candidate?.productId || candidate?.id || payload?.productId || '').trim();
    const routeProductName = String(candidate?.name || payload?.productName || '').trim();
    const eq = typeof window.__ssIdEq === 'function'
      ? window.__ssIdEq
      : ((a, b) => String(a ?? '').trim() === String(b ?? '').trim());
    if (routeProductId) {
      const found = catalogProducts().find((entry) => eq(entry?.productId, routeProductId));
      if (found) return { ...found, ...(candidate || {}) };
      return {
        ...(candidate || {}),
        productId: routeProductId,
        ...(routeProductName ? { name: routeProductName } : {})
      };
    }
    if (routeProductName) {
      const foundByName = catalogProducts().find((entry) => String(entry?.name || '').trim() === routeProductName);
      if (foundByName) return { ...foundByName, ...(candidate || {}) };
    }
    return candidate;
  }

  function productImageOf(product) {
    return String(product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '').trim();
  }

  function createStars(value) {
    const normalized = Math.max(0, Math.min(5, Number(value || 0) || 0));
    return Array.from({ length: 5 }).map((_, index) => {
      const fill = Math.max(0, Math.min(1, normalized - index));
      const fillPct = Math.round(fill * 100);
      return `<span class="ss-review-star" style="--star-fill:${fillPct}%"><span class="ss-review-star__base">â˜…</span><span class="ss-review-star__fill">â˜…</span></span>`;
    }).join('');
  }

  function reviewDistributionMarkup(reviews, summary) {
    const list = Array.isArray(reviews) ? reviews : [];
    const total = Math.max(0, Number(summary?.reviewCount || 0) || list.length || 0);
    if (total < 1) return '';
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach((review) => {
      const bucket = Math.max(1, Math.min(5, Math.round(Number(review?.starRating || 0) || 0)));
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return `
      <div class="ss-review-summary-distribution">
        ${[5, 4, 3, 2, 1].map((star) => {
          const count = Number(buckets[star] || 0) || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return `
            <div class="ss-review-summary-row">
              <span class="ss-review-summary-row-label">${star}</span>
              <span class="ss-review-summary-row-bar"><span style="width:${pct}%"></span></span>
              <span class="ss-review-summary-row-value">${pct}%</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  function reviewSummaryMarkup(summary, reviews) {
    const count = Math.max(0, Number(summary?.reviewCount || 0) || 0);
    const avg = Math.max(0, Math.min(5, Number(summary?.avgRating || 0) || 0));
    if (count < 1 || avg <= 0) {
      return `
      <div class="ss-review-summary ss-review-summary--empty">
        <div class="ss-review-summary-kicker">Verified reviews</div>
        <div class="ss-review-summary-empty-title">No reviews yet</div>
        <div class="ss-review-summary-count">The first verified customer review will appear here.</div>
      </div>`;
    }
    return `
      <div class="ss-review-summary">
        <div class="ss-review-summary-inline">
          <div class="ss-review-summary-score">${avg > 0 ? avg.toFixed(1) : 'â€”'}</div>
          <div class="ss-review-summary-meta">
            <div class="ss-review-summary-stars">${createStars(avg)}</div>
            <div class="ss-review-summary-count">${count.toLocaleString()} rating${count === 1 ? '' : 's'}</div>
          </div>
        </div>
        <div class="ss-review-summary-kicker">Based on ${count.toLocaleString()} verified review${count === 1 ? '' : 's'}.</div>
        ${reviewDistributionMarkup(reviews, summary)}
      </div>`;
  }

  function emptyReviewsMarkup(message) {
    return `
      <div class="ss-review-empty">
        <div class="ss-review-empty-icon" aria-hidden="true">â˜†</div>
        <div class="ss-review-empty-body">
          <div class="ss-review-empty-title">No published reviews yet</div>
          <div class="ss-review-empty-copy">${esc(message || 'Once verified customers share feedback on this item, it will show up here.')}</div>
        </div>
      </div>`;
  }

  function reviewCountOf(payload) {
    const explicit = Number(payload?.summary?.reviewCount || 0) || 0;
    if (explicit > 0) return explicit;
    return Array.isArray(payload?.reviews) ? payload.reviews.length : 0;
  }

  function reviewCardMarkup(review) {
    const images = Array.isArray(review?.images) ? review.images : [];
    const reviewDate = formatDate(review?.reviewDate || review?.createdAt);
    const reviewerName = esc(review?.reviewerName || 'Verified customer');
    const selectedPurchaseLabel = String(review?.selectedPurchaseLabel || '').trim();
    return `
      <article class="ss-review-card">
        <header class="ss-review-card-head">
          <div class="ss-review-card-topline">
            <div class="ss-review-card-stars">${createStars(review?.starRating)}</div>
            <div class="ss-review-card-identity">
              <span class="ss-review-card-name">${reviewerName}</span>
              ${reviewDate ? `<span class="ss-review-card-dot">â€¢</span><span class="ss-review-card-date">${reviewDate}</span>` : ''}
            </div>
          </div>
          ${selectedPurchaseLabel ? `<div class="ss-review-card-variant">${esc(selectedPurchaseLabel)}</div>` : ''}
        </header>
        <div class="ss-review-card-text">${esc(review?.text || '').replace(/\n/g, '<br/>')}</div>
        ${images.length ? `<div class="ss-review-card-images">${images.map((image) => `<a class="ss-review-card-image" href="${esc(image?.url || '')}" target="_blank" rel="noopener noreferrer"><img alt="${esc(image?.filename || 'Review image')}" src="${esc(image?.url || '')}"/></a>`).join('')}</div>` : ''}
      </article>`;
  }

  function reviewSummaryPublicMarkup(summary, reviews) {
    const count = Math.max(0, Number(summary?.reviewCount || 0) || 0);
    const avg = Math.max(0, Math.min(5, Number(summary?.avgRating || 0) || 0));
    if (count < 1 || avg <= 0) return reviewSummaryMarkup(summary, reviews);
    const list = Array.isArray(reviews) ? reviews : [];
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach((review) => {
      const bucket = Math.max(1, Math.min(5, Math.round(Number(review?.starRating || 0) || 0)));
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return `
      <div class="ss-review-summary ss-review-summary--desktop-public">
        <div class="ss-review-summary-score">${avg.toFixed(1)}</div>
        <div class="ss-review-summary-stars">${createStars(avg)}</div>
        <div class="ss-review-summary-count">Based on ${count.toLocaleString()} review${count === 1 ? '' : 's'}</div>
        <div class="ss-review-summary-distribution">
          ${[5, 4, 3, 2, 1].map((star) => {
            const rowCount = Number(buckets[star] || 0) || 0;
            const pct = count > 0 ? Math.round((rowCount / count) * 100) : 0;
            return `
              <div class="ss-review-summary-row">
                <span class="ss-review-summary-row-label">${star}<span aria-hidden="true">★</span></span>
                <span class="ss-review-summary-row-bar"><span style="width:${pct}%"></span></span>
                <span class="ss-review-summary-row-value">${pct}%</span>
              </div>`;
          }).join('')}
        </div>
        <div class="ss-review-summary-footer">
          <button class="ss-review-btn ss-review-summary-action" data-review-write="1" type="button">Write a review</button>
        </div>
      </div>`;
  }

  function reviewCardPublicMarkup(review) {
    const images = Array.isArray(review?.images) ? review.images.slice(0, 3) : [];
    const reviewDate = formatDate(review?.reviewDate || review?.createdAt);
    const reviewerName = esc(review?.reviewerName || 'Verified customer');
    const selectedPurchaseLabel = String(review?.selectedPurchaseLabel || '').trim();
    const avatarUrl = esc(review?.reviewerAvatarUrl || review?.profilePictureLink || review?.avatarUrl || '');
    return `
      <article class="ss-review-card ss-review-card--desktop-public">
        <header class="ss-review-card-head">
          <div class="ss-review-card-author">
            <div class="ss-review-card-avatar">
              ${avatarUrl ? `<img alt="${reviewerName}" src="${avatarUrl}"/>` : `<span aria-hidden="true">${reviewerName.charAt(0).toUpperCase()}</span>`}
              <span class="ss-review-card-avatar-badge" aria-hidden="true">✓</span>
            </div>
            <div class="ss-review-card-meta">
              <div class="ss-review-card-header-row">
                <div class="ss-review-card-identity-main">
                  <span class="ss-review-card-name">${reviewerName}</span>
                  <div class="ss-review-card-stars">${createStars(review?.starRating)}</div>
                  <span class="ss-review-card-verified">Verified Purchase</span>
                </div>
                <span class="ss-review-card-menu" aria-hidden="true">•••</span>
              </div>
              <div class="ss-review-card-purchase-line">
                ${reviewDate ? `<span class="ss-review-card-date">${reviewDate}</span>` : ''}
                ${reviewDate && selectedPurchaseLabel ? `<span class="ss-review-card-dot">•</span>` : ''}
                ${selectedPurchaseLabel ? `<span class="ss-review-card-variant">${esc(selectedPurchaseLabel)}</span>` : ''}
              </div>
            </div>
          </div>
        </header>
        <div class="ss-review-card-text">${esc(review?.text || '').replace(/\n/g, '<br/>')}</div>
        ${images.length ? `<div class="ss-review-card-images">${images.map((image) => `<a class="ss-review-card-image" href="${esc(image?.url || '')}" target="_blank" rel="noopener noreferrer"><img alt="${esc(image?.filename || 'Review image')}" src="${esc(image?.url || '')}"/></a>`).join('')}</div>` : ''}
      </article>`;
  }

  function reviewGalleryCount(reviews) {
    const list = Array.isArray(reviews) ? reviews : [];
    return list.reduce((sum, review) => sum + (Array.isArray(review?.images) ? review.images.length : 0), 0);
  }

  function reviewEntryProductMarkup(product) {
    const socialNode = productCard()?.createProductSocialProof?.(product) || null;
    const socialMarkup = socialNode ? socialNode.outerHTML.replace('product-card-rating-meta', 'product-card-rating-meta ss-review-entry-social-proof') : '';
    const imageUrl = productImageOf(product);
    return `
      <div class="ss-review-entry-product">
        ${imageUrl ? `<div class="ss-review-entry-product-media"><img alt="${esc(product?.name || 'Product')}" src="${esc(imageUrl)}"/></div>` : ''}
        <div class="ss-review-entry-product-body">
          <div class="ss-review-entry-product-kicker">Product</div>
          <div class="ss-review-entry-product-name">${esc(product?.name || 'Selected product')}</div>
          ${socialMarkup}
        </div>
      </div>`;
  }

  function reviewEntryEmptyMarkup(message, title) {
    return `
      <div class="ss-auth-page ss-review-entry-page">
        <div class="ss-auth-card ss-review-entry-card">
          <div class="ss-auth-copy">
            <div class="ss-auth-kicker">Verified review</div>
            <h2>${esc(title || 'Review this product')}</h2>
            <p>${esc(message || 'This review page is temporarily unavailable.')}</p>
          </div>
        </div>
      </div>`;
  }

  function collectReviewGalleryImages(reviews, maxItems = 4) {
    const out = [];
    const list = Array.isArray(reviews) ? reviews : [];
    for (const review of list) {
      const images = Array.isArray(review?.images) ? review.images : [];
      for (const image of images) {
        const url = String(image?.url || '').trim();
        if (!url) continue;
        out.push({
          url,
          filename: String(image?.filename || 'Review image').trim() || 'Review image',
          reviewerName: String(review?.reviewerName || 'Reviewer').trim() || 'Reviewer'
        });
        if (out.length >= maxItems) return out;
      }
    }
    return out;
  }

  function reviewGalleryMarkup(reviews) {
    const images = collectReviewGalleryImages(reviews, 4);
    if (!images.length) return '';
    const imageCount = reviewGalleryCount(reviews);
    return `
      <section class="ss-review-gallery">
        <div class="ss-review-gallery-head">
          <div class="ss-review-gallery-title">Review gallery</div>
          <div class="ss-review-gallery-meta">See all (${imageCount.toLocaleString()})</div>
        </div>
        <div class="ss-review-gallery-strip">
          ${images.map((image) => `<a class="ss-review-gallery-item" href="${esc(image.url)}" target="_blank" rel="noopener noreferrer"><img alt="${esc(image.filename || image.reviewerName || 'Review image')}" src="${esc(image.url)}"/></a>`).join('')}
        </div>
      </section>`;
  }

  function visibleCountOf(section, total) {
    const raw = Number(section?.dataset?.reviewVisibleCount || REVIEWS_PAGE_SIZE) || REVIEWS_PAGE_SIZE;
    return Math.max(REVIEWS_PAGE_SIZE, Math.min(Math.max(0, Number(total || 0) || 0), raw));
  }

  function authPromptMarkup() {
    return `
      <div class="ss-review-authprompt">
        <div>
          <div class="ss-review-block-title">Verified reviews only</div>
          <div class="ss-review-muted">Create an account with the email you used for your order to leave a review after the waiting period.</div>
        </div>
        <div class="ss-review-inline-actions">
          <button class="ss-review-btn ss-review-btn-primary" data-review-auth="login" type="button">Login</button>
          <button class="ss-review-btn" data-review-auth="register" type="button">Register</button>
        </div>
      </div>`;
  }

  function eligibilityListMarkup(eligibility) {
    const purchases = Array.isArray(eligibility?.purchases) ? eligibility.purchases : [];
    if (!purchases.length) {
      return `<div class="ss-review-empty">No eligible purchases were found for this account and product yet.</div>`;
    }
    return `
      <div class="ss-review-purchases">
        ${purchases.map((purchase) => `
          <div class="ss-review-purchase ${purchase.canReview && !purchase.alreadyReviewed ? 'is-ready' : ''}">
            <div class="ss-review-purchase-title">${esc(purchase.selectedPurchaseLabel || 'Ordered variant')}</div>
            <div class="ss-review-purchase-meta">
              <span>Order ${esc(purchase.orderId || '')}</span>
              <span>â€¢</span>
              <span>Purchased ${formatDate(purchase.purchasedAt)}</span>
            </div>
            <div class="ss-review-purchase-state">
              ${purchase.alreadyReviewed ? 'Review already submitted' : purchase.canReview ? 'Eligible to review' : `Available ${formatDate(purchase.eligibleAt)}`}
            </div>
          </div>`).join('')}
      </div>`;
  }

  function formMarkup(eligibility) {
    const purchases = (Array.isArray(eligibility?.purchases) ? eligibility.purchases : []).filter((entry) => entry.canReview && !entry.alreadyReviewed);
    return `
      <form class="ss-review-form" id="ssReviewForm">
        <div class="ss-review-form-grid">
          <label class="ss-review-field">
            <span>Purchased variant</span>
            <select id="ssReviewPurchaseKey" required>
              <option value="">Choose the purchased variant</option>
              ${purchases.map((purchase) => `<option value="${esc(purchase.selectedPurchaseKey)}">${esc(purchase.selectedPurchaseLabel || 'Ordered variant')}</option>`).join('')}
            </select>
          </label>
          <label class="ss-review-field">
            <span>Star rating</span>
            <select id="ssReviewRating" required>
              <option value="">Select rating</option>
              <option value="5">5.0 / 5</option>
              <option value="4.5">4.5 / 5</option>
              <option value="4">4.0 / 5</option>
              <option value="3.5">3.5 / 5</option>
              <option value="3">3.0 / 5</option>
              <option value="2.5">2.5 / 5</option>
              <option value="2">2.0 / 5</option>
              <option value="1.5">1.5 / 5</option>
              <option value="1">1.0 / 5</option>
            </select>
          </label>
        </div>
        <label class="ss-review-field">
          <span>Your review</span>
          <textarea id="ssReviewText" maxlength="2000" placeholder="Tell other customers what the product was like in real use." required></textarea>
        </label>
        <label class="ss-review-field">
          <span>Photos (optional, max 10 MB total)</span>
          <input id="ssReviewImages" accept="image/*" multiple type="file"/>
        </label>
        <div class="ss-review-upload-meta" id="ssReviewUploadMeta">No images selected</div>
        <div class="ss-review-inline-actions">
          <button class="ss-review-btn ss-review-btn-primary" id="ssReviewSubmit" type="submit">Submit review</button>
        </div>
        <div class="ss-review-status" id="ssReviewStatus" aria-live="polite"></div>
      </form>`;
  }

  async function loadReviews(productId) {
    return api()?.json?.(`/products/${encodeURIComponent(productId)}/reviews?limit=30`);
  }

  async function loadEligibility(productId) {
    return api()?.json?.(`/products/${encodeURIComponent(productId)}/review-eligibility`, {
      headers: auth()?.authHeaders?.(false) || {},
    });
  }

  function selectedFilesTotal(input) {
    const files = Array.from(input?.files || []);
    return files.reduce((sum, file) => sum + (Number(file?.size || 0) || 0), 0);
  }

  function updateUploadMeta(host) {
    const input = host.querySelector('#ssReviewImages');
    const out = host.querySelector('#ssReviewUploadMeta');
    if (!input || !out) return;
    const files = Array.from(input.files || []);
    if (!files.length) {
      out.textContent = 'No images selected';
      out.dataset.tone = 'neutral';
      return;
    }
    const total = selectedFilesTotal(input);
    out.textContent = `${files.length} image${files.length === 1 ? '' : 's'} selected â€¢ ${formatBytes(total)}`;
    out.dataset.tone = total > MAX_IMAGE_BYTES_TOTAL ? 'error' : 'neutral';
  }

  function openAuthRoute(mode) {
    try { auth()?.rememberRedirect?.(window.location.href); } catch {}
    try { window.navigate?.(mode === 'register' ? 'GoToRegister' : 'GoToLogin', []); } catch {}
  }

  async function submitReview(productId, host, eligibility) {
    const form = host.querySelector('#ssReviewForm');
    const status = host.querySelector('#ssReviewStatus');
    const purchaseKey = String(host.querySelector('#ssReviewPurchaseKey')?.value || '').trim();
    const text = String(host.querySelector('#ssReviewText')?.value || '').trim();
    const starRating = String(host.querySelector('#ssReviewRating')?.value || '').trim();
    const fileInput = host.querySelector('#ssReviewImages');
    const purchases = (Array.isArray(eligibility?.purchases) ? eligibility.purchases : []);
    const purchase = purchases.find((entry) => String(entry?.selectedPurchaseKey || '').trim() === purchaseKey) || null;
    const totalBytes = selectedFilesTotal(fileInput);

    if (!purchase || !purchase.canReview || purchase.alreadyReviewed) {
      status.textContent = 'Please choose an eligible purchased variant.';
      status.dataset.tone = 'error';
      return;
    }
    if (!text) {
      status.textContent = 'Please add your review text.';
      status.dataset.tone = 'error';
      return;
    }
    if (totalBytes > MAX_IMAGE_BYTES_TOTAL) {
      status.textContent = 'The selected images are over 10 MB total.';
      status.dataset.tone = 'error';
      return;
    }

    status.textContent = 'Submitting reviewâ€¦';
    status.dataset.tone = 'neutral';

    const formData = new FormData();
    formData.set('selectedPurchaseKey', purchase.selectedPurchaseKey);
    formData.set('selectedPurchaseLabel', purchase.selectedPurchaseLabel || '');
    formData.set('starRating', starRating);
    formData.set('text', text);
    (purchase.selectedOptions || []).forEach((entry, index) => {
      formData.set(`selectedOptions[${index}][label]`, String(entry?.label || ''));
      formData.set(`selectedOptions[${index}][value]`, String(entry?.value || ''));
    });
    if (purchase.selectedOption) formData.set('selectedOption', purchase.selectedOption);
    Array.from(fileInput?.files || []).forEach((file) => formData.append('images', file, file.name || 'review.jpg'));

    try {
      await api()?.request?.(`/products/${encodeURIComponent(productId)}/reviews`, {
        method: 'POST',
        headers: auth()?.authHeaders?.(false) || {},
        body: formData,
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(data?.error || `Review submit failed (${response.status})`);
          Object.assign(error, data || {});
          throw error;
        }
        return data;
      });
      status.textContent = 'Review submitted. Thank you!';
      status.dataset.tone = 'success';
      if (host?.dataset?.reviewUiMode === 'entry') {
        await mountReviewPageInto(host, { product: host.__reviewRenderState?.product || { productId }, force: true });
        return;
      }
      await mount(host.closest('.ss-product-reviews'), { product: { productId }, force: true });
    } catch (error) {
      status.textContent = String(error?.message || 'Review submission failed');
      status.dataset.tone = 'error';
    }
  }

  function bindForm(host, productId, eligibility) {
    host.querySelectorAll('[data-review-auth]').forEach((button) => {
      button.addEventListener('click', () => openAuthRoute(button.getAttribute('data-review-auth')));
    });
    host.querySelectorAll('[data-review-write]').forEach((button) => {
      button.addEventListener('click', () => openReviewRoute(host.__reviewRenderState?.product || { productId }));
    });
    host.querySelectorAll('[data-review-open-product]').forEach((button) => {
      button.addEventListener('click', () => openProductRoute(host.__reviewRenderState?.product || { productId }));
    });
    const fileInput = host.querySelector('#ssReviewImages');
    if (fileInput) fileInput.addEventListener('change', () => updateUploadMeta(host));
    const form = host.querySelector('#ssReviewForm');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitReview(productId, host, eligibility);
      });
    }
    host.querySelectorAll('[data-review-load-more]').forEach((button) => {
      button.addEventListener('click', () => {
        const shell = host.closest('.ss-product-reviews');
        if (!shell || !shell.__reviewRenderState) return;
        const current = visibleCountOf(shell, shell.__reviewRenderState.reviews?.reviews?.length || 0);
        shell.dataset.reviewVisibleCount = String(current + REVIEWS_PAGE_SIZE);
        renderInto(shell, shell.__reviewRenderState.product, shell.__reviewRenderState);
      });
    });
  }

  function renderEntryInto(section, product, state) {
    const eligibility = state.eligibility || null;
    const canReview = !!eligibility?.canReview;
    section.dataset.reviewUiMode = 'entry';
    section.__reviewRenderState = { product, eligibility };
    section.innerHTML = `
      <div class="ss-auth-page ss-review-entry-page">
        <div class="ss-auth-card ss-review-entry-card">
          <div class="ss-review-entry-head">
            <div class="ss-auth-copy">
              <div class="ss-auth-kicker">Verified review</div>
              <h2 class="ss-review-entry-title">Review your purchase</h2>
              <p>Only customers who ordered this product with the same account email can leave a review. Reviews open 5 days after purchase and only the variants you actually bought can be selected.</p>
            </div>
            <button class="ss-review-btn" data-review-open-product="1" type="button">Back to product</button>
          </div>
          ${reviewEntryProductMarkup(product)}
          <div class="ss-review-entry-body">
            ${canReview ? formMarkup(eligibility) : eligibilityListMarkup(eligibility)}
          </div>
        </div>
      </div>`;
    bindForm(section, productIdOf(product), eligibility);
  }

  async function renderInto(section, product, state) {
    const summary = state.reviews?.summary || { reviewCount: 0, avgRating: 0 };
    const reviews = Array.isArray(state.reviews?.reviews) ? state.reviews.reviews : [];
    const mode = String(state.mode || 'public').trim().toLowerCase();
    const isDesktopPublic = mode === 'public' && !__ssIsMobileViewport();
    const account = auth()?.getAccount?.() || null;
    const eligibility = state.eligibility || null;
    const canReview = !!eligibility?.canReview;
    const visibleCount = visibleCountOf(section, reviews.length);
    const visibleReviews = reviews.slice(0, visibleCount);
    section.__reviewRenderState = { product, reviews: state.reviews, eligibility, mode };

    section.innerHTML = `
      <section class="ss-product-reviews-shell ss-product-reviews-shell--${esc(mode)}">
        <div class="ss-product-reviews-head">
          <div>
            <h3 class="ss-product-reviews-title">${mode === 'public' ? 'Customer Reviews' : 'Customer reviews'}</h3>
            <div class="ss-review-muted">${mode === 'public' ? 'All from verified purchases' : 'Only verified customers with completed orders can leave a review for this product.'}</div>
          </div>
          ${isDesktopPublic ? reviewSummaryPublicMarkup(summary, reviews) : reviewSummaryMarkup(summary, reviews)}
        </div>
        ${mode === 'public' && !isDesktopPublic ? reviewGalleryMarkup(reviews) : ''}
        ${mode === 'public' ? '' : `<div class="ss-product-reviews-compose">
          ${!account ? authPromptMarkup() : canReview ? formMarkup(eligibility) : eligibilityListMarkup(eligibility)}
        </div>`}
        <div class="ss-product-reviews-list ${reviews.length ? '' : 'is-empty'}">
          ${reviews.length ? visibleReviews.map((review) => isDesktopPublic ? reviewCardPublicMarkup(review) : reviewCardMarkup(review)).join('') : emptyReviewsMarkup()}
        </div>
        ${reviews.length > visibleCount ? `<div class="ss-review-more"><button class="ss-review-btn" data-review-load-more="1" type="button">Load 3 more reviews</button></div>` : ''}
      </section>`;
    bindForm(section, productIdOf(product), eligibility);
  }

  async function mount(section, options = {}) {
    const product = options?.product || null;
    const productId = productIdOf(product);
    const mode = String(options?.mode || 'public').trim().toLowerCase();
    if (!section || !productId) return false;
    if (!options?.force && lastProductKey === `${productId}:${mode}` && section.dataset.reviewReady === '1') return true;

    section.classList.add('ss-product-reviews');
    section.innerHTML = `<div class="ss-review-loading">Loading reviewsâ€¦</div>`;
    section.dataset.reviewReady = '0';
    section.dataset.reviewMode = mode;
    lastProductKey = `${productId}:${mode}`;

    try {
      const [reviews, eligibility] = await Promise.all([
        loadReviews(productId),
        mode === 'public' ? Promise.resolve(null) : (auth()?.isLoggedIn?.() ? loadEligibility(productId).catch(() => null) : Promise.resolve(null)),
      ]);
      if (mode === 'public' && reviewCountOf(reviews) < 1) {
        try { section.remove(); } catch { try { section.innerHTML = ''; section.style.display = 'none'; } catch {} }
        return true;
      }
      if (!options?.force && !section.dataset.reviewVisibleCount) {
        section.dataset.reviewVisibleCount = String(REVIEWS_PAGE_SIZE);
      }
      if (options?.force) {
        section.dataset.reviewVisibleCount = String(REVIEWS_PAGE_SIZE);
      }
      await renderInto(section, product, { reviews, eligibility, mode });
      section.dataset.reviewReady = '1';
      return true;
    } catch (error) {
      section.innerHTML = emptyReviewsMarkup('Reviews are temporarily unavailable. Please try again in a moment.');
      return false;
    }
  }

  async function mountReviewPageInto(section, options = {}) {
    const product = options?.product || null;
    const productId = productIdOf(product);
    if (!section || !productId) {
      if (section) section.innerHTML = reviewEntryEmptyMarkup('Open the product again and use its rating block to start the review flow.', 'Product not found');
      return false;
    }

    clearSort();
    section.dataset.reviewUiMode = 'entry';
    section.__reviewRenderState = { product, eligibility: null };

    if (!auth()?.isLoggedIn?.()) {
      section.innerHTML = reviewEntryEmptyMarkup('You need to log in with the same email you used for your order. Redirecting you nowâ€¦', 'Login required');
      try { auth()?.rememberRedirect?.(reviewRouteUrl(product)); } catch {}
      try {
        window.setTimeout(() => {
          try { window.navigate?.('GoToLogin', []); } catch {}
        }, 80);
      } catch {}
      return true;
    }

    section.innerHTML = reviewEntryEmptyMarkup('Loading your purchased variantsâ€¦', 'Review your purchase');
    try {
      const eligibility = await loadEligibility(productId);
      renderEntryInto(section, product, { eligibility });
      return true;
    } catch {
      section.innerHTML = reviewEntryEmptyMarkup('We could not load your review eligibility right now. Please try again in a moment.', 'Review unavailable');
      return false;
    }
  }

  function mountReviewPage(payload = {}) {
    const node = viewer();
    if (!node) return function cleanupReviewPage() {};
    const product = resolveReviewProduct(payload);
    void mountReviewPageInto(node, { product, force: payload?.force });
    return function cleanupReviewPage() {};
  }

  const service = { mount, mountReviewPage, mountReviewPageInto };
  window.__SS_PRODUCT_REVIEWS__ = service;
})(window, document);

