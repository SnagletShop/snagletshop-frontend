(function(window, document){
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getQuantityControls() {
    return getResolver()?.resolve?.('component.quantityControls', window.__SS_QUANTITY_CONTROLS__ || null) || null;
  }

  function createBasketRow(key, item, product, handlers = {}) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('Basket_Item_Container');

    const safeName = window.__ssEscHtml ? window.__ssEscHtml(item?.name || '') : String(item?.name || '');
    const safeDesc = window.__ssEscHtml ? window.__ssEscHtml(item?.description || '') : String(item?.description || '');
    const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);
    const encName = encodeURIComponent(String(item?.name || ''));
    const recoTok = String(item?.recoDiscountToken || '').trim();
    const recoQ = recoTok ? `&reco=${encodeURIComponent(recoTok)}` : '';
    const optionChipsHTML = window.__ssBuildOptionChipsHTML ? window.__ssBuildOptionChipsHTML(window.__ssGetSelectedOptionsForDisplay ? window.__ssGetSelectedOptionsForDisplay(item, product) : [], false) : '';

    const basketItem = document.createElement('div');
    basketItem.className = 'Basket-Item';

    const imgLink = document.createElement('a');
    imgLink.href = `${window.location.origin}/?product=${encName}${recoQ}`;
        
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
    titleLink.href = `${window.location.origin}/?product=${encName}${recoQ}`;
            titleLink.className = 'BasketText';
    titleLink.innerHTML = `<strong class="BasketText BasketTitle">${safeName}</strong>`;

    const chipsWrap = document.createElement('div');
    chipsWrap.innerHTML = optionChipsHTML;

    const desc = document.createElement('p');
    desc.className = 'BasketTextDescription';
    desc.textContent = safeDesc;

    details.append(titleLink, chipsWrap);
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
