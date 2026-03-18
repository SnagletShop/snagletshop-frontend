(function(window, document){
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getQuantityControls() {
    return getResolver()?.resolve?.('component.quantityControls', window.__SS_QUANTITY_CONTROLS__ || null) || null;
  }

  function createCartButton(label, onClick) {
    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'add-to-cart';
    addToCartBtn.type = 'button';
    addToCartBtn.innerHTML = `
      <span style="display: flex; align-items: center; gap: 6px;">
        ${label}
        <svg class="cart-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>`;
    addToCartBtn.addEventListener('click', () => onClick?.());
    return addToCartBtn;
  }

  function createProductCard(product, opts = {}) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');

    const card = document.createElement('div');
    card.className = 'product-card';

    const nameLink = document.createElement('a');
    nameLink.className = 'product-name';
    nameLink.style.textDecoration = 'none';
    nameLink.textContent = opts.displayName || product?.name || '';
    nameLink.href = opts.href || `${window.location.origin}/?product=${encodeURIComponent(product?.name || '')}`;
        nameLink.addEventListener('click', (e) => {
      e.preventDefault();
      opts.onOpenProduct?.(product);
    });

    const img = document.createElement('img');
    img.className = 'Clickable_Image';
    img.src = product?.image || '';
    img.alt = product?.name || '';
    img.dataset.name = product?.name || '';
    img.dataset.price = String(product?.price ?? '');
    img.dataset.imageurl = product?.image || '';
    img.dataset.description = opts.displayDescription || product?.description || window.TEXTS?.PRODUCT_SECTION?.DESCRIPTION_PLACEHOLDER || '';
    img.addEventListener('click', () => opts.onOpenProduct?.(product));

    const priceP = document.createElement('p');
    priceP.className = 'product-price';
    priceP.textContent = opts.priceText || `${opts.priceValue ?? product?.price ?? 0}${opts.currencySymbol || '€'}`;

    const qtyUi = getQuantityControls()?.createCatalogQuantityControls?.(product, {
      onDecrease: opts.onDecrease,
      onIncrease: opts.onIncrease,
    });

    const addToCartBtn = createCartButton(window.TEXTS?.PRODUCT_SECTION?.ADD_TO_CART || 'Add to cart', () => opts.onAddToCart?.(product));
    qtyUi?.quantityContainer?.appendChild(addToCartBtn);

    card.append(nameLink, img, priceP, qtyUi?.quantityContainer || document.createElement('div'));
    productDiv.appendChild(card);
    return productDiv;
  }

  const api = { createProductCard };
  try { getResolver()?.expose?.('component.productCard', api, ['__SS_PRODUCT_CARD__']); } catch { window.__SS_PRODUCT_CARD__ = api; }
})(window, document);
