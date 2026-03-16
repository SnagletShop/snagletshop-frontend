(function (window) {
  'use strict';
  function getBasketButtonEl() {
    const candidates = Array.from(document.querySelectorAll('#BasketButtonDesktop, #BasketButtonMobile, .BasketButton, .mobileBasketButton'));
    const visible = candidates.find((el) => {
      try {
        const r = el.getBoundingClientRect();
        return el && el.offsetParent !== null && r.width > 0 && r.height > 0;
      } catch { return false; }
    });
    return visible || candidates[0] || null;
  }
  function getBasketCounts(ctx = {}) {
    const b = (ctx.basket && typeof ctx.basket === 'object') ? ctx.basket : (window.basket || {});
    let totalQty = 0, distinct = 0;
    for (const it of Object.values(b)) {
      if (!it) continue;
      distinct += 1;
      totalQty += Math.max(0, parseInt(it.quantity || 0, 10) || 0);
    }
    return { totalQty, distinct };
  }
  function updateBasketHeaderIndicator(ctx = {}) {
    const { totalQty } = getBasketCounts(ctx);
    const buttons = Array.from(document.querySelectorAll('.BasketButton, .mobileBasketButton, #BasketButtonDesktop, #BasketButtonMobile'));
    for (const btn of buttons) {
      if (!btn) continue;
      let badge = btn.querySelector('.ss-cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'ss-cart-badge';
        badge.setAttribute('aria-hidden', 'true');
        btn.appendChild(badge);
      }
      if (totalQty > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = totalQty > 99 ? '99+' : String(totalQty);
        btn.classList.add('ss-has-items');
        btn.setAttribute('aria-label', `Basket (${totalQty} items)`);
      } else {
        badge.style.display = 'none';
        btn.classList.remove('ss-has-items');
        btn.setAttribute('aria-label', 'Basket');
      }
    }
  }
  function closeActiveBasketToast(state) {
    try { if (state?.activeToast) state.activeToast.remove(); } catch {}
    if (state) {
      state.activeToast = null;
      try { for (const t of state.activeToastTimers || []) clearTimeout(t); } catch {}
      state.activeToastTimers = [];
    }
  }
  function undoAddToCart(itemKey, qty, ctx = {}) {
    const key = String(itemKey || '');
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const basket = ctx.basket || window.basket;
    if (!key || !basket || !basket[key]) return;
    const nextQty = (parseInt(basket[key].quantity || 0, 10) || 0) - q;
    if (nextQty <= 0) delete basket[key]; else basket[key].quantity = nextQty;
    try {
      if (typeof ctx.persistBasket === 'function') ctx.persistBasket('undo_add_to_cart');
      else if (typeof window.persistBasket === 'function') window.persistBasket('undo_add_to_cart');
      else localStorage.setItem('basket', JSON.stringify(basket));
    } catch {
      try { localStorage.setItem('basket', JSON.stringify(basket)); } catch {}
    }
    try {
      if (typeof ctx.refreshBasketUIIfOpen === 'function') ctx.refreshBasketUIIfOpen();
      else if (typeof window.refreshBasketUIIfOpen === 'function') window.refreshBasketUIIfOpen();
    } catch {}
  }
  function showBasketToastAddToCart(payload) {
    return window.__SS_BASKET_TOAST__?.showBasketToastAddToCart?.(payload);
  }
  function refreshBasketUIIfOpen(ctx = {}) {
    if (document.getElementById('Basket_Viewer') && typeof ctx.updateBasket === 'function') {
      ctx.updateBasket();
    }
  }
  function notifyAddToCart(payload, options = {}) {
    const q = Math.max(1, parseInt(payload?.qty, 10) || 1);
    const name = String(payload?.productName || '').trim();
    if (options.useBasketToast) {
      try { return showBasketToastAddToCart({ qty: q, productName: name, optMsg: payload?.optMsg || '', imageUrl: payload?.imageUrl || '', itemKey: payload?.itemKey || '' }); } catch {}
    }
    if (options.useLegacyAlert) { try { alert(`${q} x ${name}${payload?.optMsg || ''} added to cart!`); } catch {} }
  }
  window.__SS_BASKET_RUNTIME__ = { getBasketButtonEl, getBasketCounts, updateBasketHeaderIndicator, closeActiveBasketToast, undoAddToCart, showBasketToastAddToCart, refreshBasketUIIfOpen, notifyAddToCart };
})(window);
