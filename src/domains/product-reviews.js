(function (window, document) {
  'use strict';

  const MAX_IMAGE_BYTES_TOTAL = 10 * 1024 * 1024;
  let lastProductKey = '';

  function api() { return window.__SS_API__ || null; }
  function auth() { return window.__SS_CUSTOMER_AUTH__ || null; }
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

  function createStars(value) {
    const normalized = Math.max(0, Math.min(5, Number(value || 0) || 0));
    return Array.from({ length: 5 }).map((_, index) => {
      const fill = Math.max(0, Math.min(1, normalized - index));
      const fillPct = Math.round(fill * 100);
      return `<span class="ss-review-star" style="--star-fill:${fillPct}%"><span class="ss-review-star__base">★</span><span class="ss-review-star__fill">★</span></span>`;
    }).join('');
  }

  function reviewSummaryMarkup(summary) {
    const count = Math.max(0, Number(summary?.reviewCount || 0) || 0);
    const avg = Math.max(0, Math.min(5, Number(summary?.avgRating || 0) || 0));
    return `
      <div class="ss-review-summary">
        <div class="ss-review-summary-score">${avg > 0 ? avg.toFixed(1) : '—'}</div>
        <div class="ss-review-summary-stars">${createStars(avg)}</div>
        <div class="ss-review-summary-count">${count.toLocaleString()} review${count === 1 ? '' : 's'}</div>
      </div>`;
  }

  function reviewCardMarkup(review) {
    const images = Array.isArray(review?.images) ? review.images : [];
    return `
      <article class="ss-review-card">
        <header class="ss-review-card-head">
          <div class="ss-review-card-author">
            <div class="ss-review-card-avatar">${review?.reviewerAvatarUrl ? `<img alt="${esc(review.reviewerName || 'Reviewer')}" src="${esc(review.reviewerAvatarUrl)}"/>` : `<span>${esc(String(review?.reviewerName || 'A').slice(0, 1).toUpperCase())}</span>`}</div>
            <div>
              <div class="ss-review-card-name">${esc(review?.reviewerName || 'Verified customer')}</div>
              <div class="ss-review-card-meta">
                <span>${formatDate(review?.createdAt)}</span>
                ${review?.selectedPurchaseLabel ? `<span>•</span><span>${esc(review.selectedPurchaseLabel)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="ss-review-card-rating">
            <div class="ss-review-card-stars">${createStars(review?.starRating)}</div>
            <div class="ss-review-card-score">${Number(review?.starRating || 0).toFixed(1)}</div>
          </div>
        </header>
        <div class="ss-review-card-text">${esc(review?.text || '').replace(/\n/g, '<br/>')}</div>
        ${images.length ? `<div class="ss-review-card-images">${images.map((image) => `<a class="ss-review-card-image" href="${esc(image?.url || '')}" target="_blank" rel="noopener noreferrer"><img alt="${esc(image?.filename || 'Review image')}" src="${esc(image?.url || '')}"/></a>`).join('')}</div>` : ''}
      </article>`;
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
              <span>•</span>
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
    out.textContent = `${files.length} image${files.length === 1 ? '' : 's'} selected • ${formatBytes(total)}`;
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

    status.textContent = 'Submitting review…';
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
    const fileInput = host.querySelector('#ssReviewImages');
    if (fileInput) fileInput.addEventListener('change', () => updateUploadMeta(host));
    const form = host.querySelector('#ssReviewForm');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitReview(productId, host, eligibility);
      });
    }
  }

  async function renderInto(section, product, state) {
    const summary = state.reviews?.summary || { reviewCount: 0, avgRating: 0 };
    const reviews = Array.isArray(state.reviews?.reviews) ? state.reviews.reviews : [];
    const account = auth()?.getAccount?.() || null;
    const eligibility = state.eligibility || null;
    const canReview = !!eligibility?.canReview;

    section.innerHTML = `
      <section class="ss-product-reviews-shell">
        <div class="ss-product-reviews-head">
          <div>
            <h3 class="ss-product-reviews-title">Customer reviews</h3>
            <div class="ss-review-muted">Only verified customers with completed orders can leave a review for this product.</div>
          </div>
          ${reviewSummaryMarkup(summary)}
        </div>
        <div class="ss-product-reviews-compose">
          ${!account ? authPromptMarkup() : canReview ? formMarkup(eligibility) : eligibilityListMarkup(eligibility)}
        </div>
        <div class="ss-product-reviews-list ${reviews.length ? '' : 'is-empty'}">
          ${reviews.length ? reviews.map(reviewCardMarkup).join('') : '<div class="ss-review-empty">No published reviews yet.</div>'}
        </div>
      </section>`;
    bindForm(section, productIdOf(product), eligibility);
  }

  async function mount(section, options = {}) {
    const product = options?.product || null;
    const productId = productIdOf(product);
    if (!section || !productId) return false;
    if (!options?.force && lastProductKey === productId && section.dataset.reviewReady === '1') return true;

    section.classList.add('ss-product-reviews');
    section.innerHTML = `<div class="ss-review-loading">Loading reviews…</div>`;
    section.dataset.reviewReady = '0';
    lastProductKey = productId;

    try {
      const [reviews, eligibility] = await Promise.all([
        loadReviews(productId),
        auth()?.isLoggedIn?.() ? loadEligibility(productId).catch(() => null) : Promise.resolve(null),
      ]);
      await renderInto(section, product, { reviews, eligibility });
      section.dataset.reviewReady = '1';
      return true;
    } catch (error) {
      section.innerHTML = `<div class="ss-review-empty">Reviews are temporarily unavailable.</div>`;
      return false;
    }
  }

  const service = { mount };
  window.__SS_PRODUCT_REVIEWS__ = service;
})(window, document);
