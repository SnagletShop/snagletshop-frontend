(function (window, document) {
  function ensureStyles() {
    return true;
  }

  function closeToast(el) {
    try { el?.remove(); } catch {}
  }

  function showBasketToastAddToCart({ qty, productName, optMsg, imageUrl, itemKey }) {
    ensureStyles();
    const existing = document.querySelector('.ss-basket-toast');
    if (existing) closeToast(existing);
    const toast = document.createElement('div');
    toast.className = 'ss-basket-toast';
    const title = `${Math.max(1, parseInt(qty, 10) || 1)} × ${String(productName || '').trim()} added to basket`;
    const subtitle = String(optMsg || '').trim() || 'Your basket has been updated.';
    toast.innerHTML = `
      ${imageUrl ? `<img class="ss-basket-toast__img" src="${String(imageUrl).replace(/"/g, '&quot;')}" alt="">` : ''}
      <div class="ss-basket-toast__body">
        <div class="ss-basket-toast__title">${title}</div>
        <div class="ss-basket-toast__sub">${subtitle}</div>
        <div class="ss-basket-toast__actions">
          <button type="button" class="ss-basket-toast__btn" data-action="close">OK</button>
          <button type="button" class="ss-basket-toast__btn" data-action="open">Open basket</button>
        </div>
      </div>`;
    toast.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'open') {
        try { if (typeof window.GoToCart === 'function') window.GoToCart(); } catch {}
      }
      closeToast(toast);
    });
    (document.body || document.documentElement).appendChild(toast);
    setTimeout(() => closeToast(toast), 3500);
    return { itemKey: String(itemKey || ''), close: () => closeToast(toast) };
  }

  window.__SS_BASKET_TOAST__ = { showBasketToastAddToCart };
})(window, document);
