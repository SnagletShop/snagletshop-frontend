(function(window, document){
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getQuantityControls() {
    return getResolver()?.resolve?.('component.quantityControls', window.__SS_QUANTITY_CONTROLS__ || null) || null;
  }

  function buildProductHref(item, product) {
    try {
      const data = [
        item?.name || product?.name || '',
        item?.price ?? product?.price ?? product?.priceEUR ?? product?.basePrice ?? product?.sellPrice ?? 0,
        item?.description || product?.description || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || '',
        item?.image || product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '',
        String(item?.productId || product?.productId || product?.id || '').trim() || null,
        (String(item?.recoDiscountToken || '').trim()) ? { discountToken: String(item.recoDiscountToken).trim() } : null
      ];
      const href = window.__SS_ROUTER__?.buildUrlForState?.({ action: 'GoToProductPage', data });
      if (typeof href === 'string' && href.trim()) return href;
    } catch {}
    try {
      const fallbackPath = window.__SS_ROUTER__?.getCanonicalProductPath?.(product || item || {}, {
        name: item?.name || product?.name || '',
        productId: String(item?.productId || product?.productId || product?.id || '').trim(),
        productLink: item?.productLink || product?.productLink || ''
      });
      if (typeof fallbackPath === 'string' && fallbackPath.trim()) {
        const recoTok = String(item?.recoDiscountToken || '').trim();
        const recoQ = recoTok ? `?reco=${encodeURIComponent(recoTok)}` : '';
        return `${window.location.origin}${fallbackPath}${recoQ}`;
      }
    } catch {}
    const fallbackSlug = String(item?.name || product?.name || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'product';
    const recoTok = String(item?.recoDiscountToken || '').trim();
    const recoQ = recoTok ? `?reco=${encodeURIComponent(recoTok)}` : '';
    return `${window.location.origin}/product/${encodeURIComponent(fallbackSlug)}${recoQ}`;
  }

  function shouldHandleInAppNavigation(event) {
    return !(event?.defaultPrevented || event?.button !== 0 || event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey);
  }

  function openBasketItemProduct(event, item, product) {
    try {
      if (!shouldHandleInAppNavigation(event)) return;
      event?.preventDefault?.();
      const image = String(item?.image || product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || (Array.isArray(product?.imagesB) ? product.imagesB[0] : '') || '');
      const discount = String(item?.recoDiscountToken || '').trim() ? { discountToken: String(item.recoDiscountToken).trim() } : null;
      const data = [item?.name || product?.name || '', item?.price ?? product?.price ?? 0, item?.description || product?.description || '', image, String(item?.productId || product?.productId || product?.id || '').trim() || null, discount];
      if (typeof window.navigate === 'function') return window.navigate('GoToProductPage', data);
      if (typeof window.GoToProductPage === 'function') return window.GoToProductPage(...data);
    } catch {}
  }

  function createBasketRow(key, item, product, handlers = {}) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('Basket_Item_Container');

    const safeName = window.__ssEscHtml ? window.__ssEscHtml(item?.name || '') : String(item?.name || '');
    const safeDesc = window.__ssEscHtml ? window.__ssEscHtml(item?.description || '') : String(item?.description || '');
    const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);
    let optionLabel = '';
    try {
      const selected = window.__ssGetSelectedOptionsForDisplay ? window.__ssGetSelectedOptionsForDisplay(item, product) : [];
      optionLabel = selected && selected.length && window.__ssFormatSelectedOptionsDisplay
        ? String(window.__ssFormatSelectedOptionsDisplay(selected) || '').trim()
        : String(item?.selectedOption || '').trim();
    } catch {}

    const basketItem = document.createElement('div');
    basketItem.className = 'Basket-Item';

    const imgLink = document.createElement('a');
    imgLink.href = buildProductHref(item, product);
    imgLink.className = 'BasketImageLink';

    const img = document.createElement('img');
    img.className = 'Basket_Image';
    img.src = item?.image || '';
    img.alt = item?.name || '';
    img.dataset.name = item?.name || '';
    img.dataset.price = String(item?.price ?? '');
    img.dataset.description = item?.description || '';
    img.dataset.imageurl = item?.image || '';
    imgLink.appendChild(img);

    const details = document.createElement('div');
    details.className = 'Item-Details';
    const titleLink = document.createElement('a');
    titleLink.href = buildProductHref(item, product);
    titleLink.className = 'BasketText';
    titleLink.innerHTML = `<strong class="BasketText BasketTitle">${safeName}</strong>`;

    const optionMeta = document.createElement('div');
    optionMeta.className = 'BasketVariantMeta';
    optionMeta.textContent = optionLabel;

    const desc = document.createElement('p');
    desc.className = 'BasketTextDescription';
    desc.textContent = safeDesc;

    imgLink.addEventListener('click', (event) => openBasketItemProduct(event, item, product));
    titleLink.addEventListener('click', (event) => openBasketItemProduct(event, item, product));

    details.appendChild(titleLink);
    if (optionLabel) details.appendChild(optionMeta);
    details.appendChild(desc);

    const qtyControls = getQuantityControls()?.createBasketQuantityControls?.(key, qty, {
      onChange: handlers.onChangeQuantity,
    }) || document.createElement('div');

    basketItem.append(imgLink, details, qtyControls);
    productDiv.appendChild(basketItem);
    return productDiv;
  }

  const api = { createBasketRow };
  try { getResolver()?.expose?.('component.basketRow', api, ['__SS_BASKET_ROW__']); } catch { window.__SS_BASKET_ROW__ = api; }
})(window, document);
