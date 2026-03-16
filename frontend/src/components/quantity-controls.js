(function(window, document){
  'use strict';

  function getTexts() {
    return window.TEXTS || {};
  }

  function createCatalogQuantityControls(product, handlers = {}) {
    const productKey = product?.productId || product?.id || product?.name;
    const quantityContainer = document.createElement('div');
    quantityContainer.className = 'quantity-container';

    const quantityControls = document.createElement('div');
    quantityControls.className = 'quantity-controls';

    const decBtn = document.createElement('button');
    decBtn.className = 'Button';
    decBtn.type = 'button';
    decBtn.textContent = getTexts()?.BASKET?.BUTTONS?.DECREASE || '-';
    decBtn.addEventListener('click', () => handlers.onDecrease?.(productKey, product));

    const quantitySpan = document.createElement('span');
    quantitySpan.className = 'WhiteText';
    quantitySpan.id = `quantity-${window.__ssGetQtyKey ? window.__ssGetQtyKey(productKey) : String(productKey || '')}`;
    quantitySpan.textContent = String(window.__ssGetQtyValue ? window.__ssGetQtyValue(productKey) : 1);

    const incBtn = document.createElement('button');
    incBtn.className = 'Button';
    incBtn.type = 'button';
    incBtn.textContent = getTexts()?.BASKET?.BUTTONS?.INCREASE || '+';
    incBtn.addEventListener('click', () => handlers.onIncrease?.(productKey, product));

    quantityControls.append(decBtn, quantitySpan, incBtn);
    quantityContainer.appendChild(quantityControls);
    return { quantityContainer, quantityControls, decBtn, quantitySpan, incBtn };
  }

  function createBasketQuantityControls(key, qty, handlers = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'Quantity-Controls-Basket';

    const decBtn = document.createElement('button');
    decBtn.className = 'BasketChangeQuantityButton';
    decBtn.type = 'button';
    decBtn.dataset.key = encodeURIComponent(String(key || ''));
    decBtn.dataset.delta = '-1';
    decBtn.textContent = getTexts()?.BASKET?.BUTTONS?.DECREASE || '-';
    decBtn.addEventListener('click', () => handlers.onChange?.(key, -1));

    const quantitySpan = document.createElement('span');
    quantitySpan.className = 'BasketChangeQuantityText';
    quantitySpan.textContent = String(Math.max(1, parseInt(qty || 1, 10) || 1));

    const incBtn = document.createElement('button');
    incBtn.className = 'BasketChangeQuantityButton';
    incBtn.type = 'button';
    incBtn.dataset.key = encodeURIComponent(String(key || ''));
    incBtn.dataset.delta = '1';
    incBtn.textContent = getTexts()?.BASKET?.BUTTONS?.INCREASE || '+';
    incBtn.addEventListener('click', () => handlers.onChange?.(key, 1));

    wrap.append(decBtn, quantitySpan, incBtn);
    return wrap;
  }

  const api = { createCatalogQuantityControls, createBasketQuantityControls };
  try { window.__SS_RESOLVE__?.expose?.('component.quantityControls', api, ['__SS_QUANTITY_CONTROLS__']); } catch { window.__SS_QUANTITY_CONTROLS__ = api; }
})(window, document);
