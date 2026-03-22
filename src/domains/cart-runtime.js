(function (window) {
  'use strict';

  function addToCartCore(ctx = {}, productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = '', options = {}) {
    if (options.withAnalytics) {
      try {
        const payload = ctx.buildAnalyticsProductPayload?.(productName, { priceEUR: price, productLink }) || {};
        payload.extra = { selectedOption: selectedOption || '' };
        ctx.sendAnalyticsEvent?.('add_to_cart', {
          ...payload,
          extra: {
            ...(payload.extra || {}),
            viewToken: ctx.getCurrentViewToken?.() || null,
            clickToken: ctx.consumeRecentClickToken?.() || null,
            experiments: ctx.getExperiments?.() || null
          }
        });
      } catch {}
    }

    const quantity = (ctx.cart?.[productName] || 1);
    if (ctx.cart) ctx.cart[productName] = 1;
    const key = selectedOption ? `${productName} - ${selectedOption}` : productName;

    if (quantity > 0) {
      if (ctx.basket && ctx.basket[key]) {
        ctx.basket[key].quantity += quantity;
      } else if (ctx.basket) {
        const safeDisplayName = String(options.displayName || productName || '').trim();
        const safeDisplayDescription = String(options.displayDescription || productDescription || '').trim();
        ctx.basket[key] = {
          name: productName,
          displayName: safeDisplayName,
          displayDescription: safeDisplayDescription,
          price,
          image: imageUrl,
          quantity,
          expectedPurchasePrice,
          productLink,
          description: productDescription,
          ...(selectedOption && { selectedOption })
        };
      }

      if (options.persistBasket && typeof ctx.persistBasket === 'function') ctx.persistBasket(options.persistReason || 'add_to_cart');
      else {
        try { localStorage.setItem('basket', JSON.stringify(ctx.basket || {})); } catch {}
      }

      try { ctx.notifyAddToCart?.({ qty: quantity, productName, optMsg: selectedOption ? ` (${selectedOption})` : '', imageUrl, itemKey: key }); } catch {}
    } else {
      window.alert('Please select at least one item.');
    }
  }

  function changeQuantity(ctx = {}, itemKey, amount) {
    if (!ctx.basket || !ctx.basket[itemKey]) return;
    const currentQty = Number(ctx.basket[itemKey].quantity) || 0;
    const nextQty = currentQty + (Number(amount) || 0);
    if (nextQty <= 0) delete ctx.basket[itemKey]; else ctx.basket[itemKey].quantity = nextQty;
    if (typeof ctx.persistBasket === 'function') ctx.persistBasket('qty_change');
    else {
      try { localStorage.setItem('basket', JSON.stringify(ctx.basket)); } catch {}
    }
    try { ctx.updateBasket?.(); } catch {}
  }

  function updateLastChanceOfferUI(ctx = {}) {
    const el = document.getElementById('ss-last-chance');
    if (!el) return;
    try {
      let fullCart = ctx.getFullCartPreferred?.() || [];
      try {
        const basket = ctx.getBasket?.();
        if ((!Array.isArray(fullCart) || fullCart.length === 0) && basket && typeof basket === 'object' && Object.keys(basket).length) {
          fullCart = Object.values(basket).map((it) => ({
            ...it,
            productId: it?.productId || it?.id || it?.pid || '',
            quantity: it?.quantity ?? it?.qty ?? it?.count ?? 1,
            unitPriceEUR: it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? 0,
            originalUnitPriceEUR: it?.originalUnitPriceEUR ?? it?.originalPriceEUR ?? it?.compareAtPriceEUR ?? it?.originalPrice ?? 0
          }));
        }
      } catch {}

      const base = (fullCart || []).reduce((s, i) => s + (ctx.parsePriceEUR?.(i?.unitPriceEUR ?? i?.price ?? 0) || 0) * (Math.max(1, parseInt(i?.quantity ?? 1, 10) || 1)), 0);
      const inc = ctx.computeCartIncentivesClient?.(base, fullCart);
      const cfg = ctx.getCartIncentivesConfig?.() || {};
      const tiers = (cfg?.tierDiscount?.enabled && Array.isArray(cfg?.tierDiscount?.tiers)) ? cfg.tierDiscount.tiers : [];
      let nextTier = null;
      for (const t of tiers) {
        const min = Math.max(0, Number(t?.minEUR || 0) || 0);
        const pct = Math.max(0, Number(t?.pct || 0) || 0);
        if (min > base && pct > 0) { nextTier = { min, pct }; break; }
      }

      const desired = nextTier ? Math.max(3, nextTier.min - base) : 0;
      const pick = ctx.cartPickAddonProducts?.({ desiredEUR: desired, limit: 1 })?.[0];
      if (!pick) {
        el.innerHTML = '';
        return;
      }

      const price = Number(pick?.price || 0) || 0;
      const headline = nextTier ? `Last chance: add ${(nextTier.min - base).toFixed(2)}€ to unlock ${nextTier.pct}% OFF` : 'Last chance: frequently added';
      el.innerHTML = `
        <div class="ss-lc-sub ss-lc-title">${ctx.escHtml?.(headline) || headline}</div>
        <div class="ss-lc-row">
          <img class="ss-lc-img" src="${ctx.escHtml?.(pick?.image || '') || ''}" alt="${ctx.escHtml?.(pick?.name || '') || ''}">
          <div class="ss-lc-row-body">
            <div class="ss-lc-name">${ctx.escHtml?.(pick?.name || '') || ''}</div>
            <div class="ss-lc-sub">${price.toFixed(2)}€</div>
          </div>
          <button class="ss-lc-btn" type="button" data-ss-lc-add="${ctx.escHtml?.(pick?.name || '') || ''}">Add</button>
        </div>`;

      if (!el.dataset.bound) {
        el.dataset.bound = '1';
        el.addEventListener('click', async (e) => {
          const btn = e.target?.closest?.('[data-ss-lc-add]');
          if (!btn) return;
          e.preventDefault();
          const name = String(btn.getAttribute('data-ss-lc-add') || '').trim();
          const p = ctx.getCatalogFlat?.().find((pp) => String(pp?.name || '').trim() === name);
          if (!p) return;
          const resolvedPrice = Number(ctx.resolveVariantPriceEUR?.(p, [], '') || pick?.price || p?.price || 0) || 0;
          const groups = ctx.extractOptionGroups?.(p) || [];
          const sel = ctx.defaultSelectedOptions?.(groups) || [];
          const firstSelected = Array.isArray(sel) && sel.length ? String(sel[0]?.value || '').trim() : '';
          ctx.addToCart?.(p.name, resolvedPrice, p.image || '', p.expectedPurchasePrice || 0, p.productLink || '', p.description || '', firstSelected, sel, (p.productId || null));
          try { ctx.updateBasket?.(); } catch {}
          try { await ctx.setupCheckoutFlow?.(ctx.getSelectedCurrency?.()); } catch {}
          try { updateLastChanceOfferUI(ctx); } catch {}
        }, { passive: false });
      }

      return inc;
    } catch {
      el.innerHTML = '';
    }
  }

  window.__SS_CART_RUNTIME__ = { addToCart: addToCartCore, addToCartWithAnalytics: addToCartCore, changeQuantity, updateLastChanceOfferUI };
})(window);
