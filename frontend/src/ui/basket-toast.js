(function (window, document) {
  function ensureStyles() {
    if (document.getElementById('__ss_basket_toast_styles')) return;
    const style = document.createElement('style');
    style.id = '__ss_basket_toast_styles';
    style.textContent = `
      .ss-basket-toast{position:fixed;right:16px;bottom:16px;z-index:99999;max-width:min(360px,calc(100vw - 24px));padding:12px 14px;border-radius:16px;border:1px solid rgba(0,0,0,.1);background:rgba(255,255,255,.97);box-shadow:0 12px 30px rgba(0,0,0,.18);font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;display:flex;gap:12px;align-items:flex-start}
      html.dark-mode .ss-basket-toast{background:rgba(24,24,27,.96);color:#f5f5f5;border-color:rgba(255,255,255,.12)}
      .ss-basket-toast__img{width:44px;height:44px;border-radius:10px;object-fit:cover;flex:0 0 auto;background:rgba(0,0,0,.06)}
      .ss-basket-toast__title{font-weight:700;margin-bottom:2px}
      .ss-basket-toast__sub{opacity:.82;font-size:13px}
      .ss-basket-toast__actions{display:flex;gap:8px;margin-top:8px}
      .ss-basket-toast__btn{border:0;border-radius:10px;padding:7px 10px;font:inherit;cursor:pointer}
    `;
    document.head.appendChild(style);
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
      <div style="min-width:0;flex:1 1 auto;">
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
