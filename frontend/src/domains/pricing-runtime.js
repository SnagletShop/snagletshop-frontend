(function (window, document) {
  'use strict';

  function getState(ctx) {
    return {
      selectedCurrency: ctx?.getSelectedCurrency?.() || 'EUR',
      exchangeRates: ctx?.getExchangeRates?.() || {},
      tariffMultipliers: ctx?.getTariffMultipliers?.() || {},
      currencySymbols: ctx?.currencySymbols || {},
      getApplyTariffFlag: ctx?.getApplyTariffFlag || (() => false)
    };
  }

  function convertPriceNumber(ctx, priceInEur) {
    const { selectedCurrency, exchangeRates, tariffMultipliers, getApplyTariffFlag } = getState(ctx);
    const eur = Number(priceInEur);
    const rate = Number(exchangeRates?.[selectedCurrency] ?? 1);
    let converted = (Number.isFinite(eur) ? eur : 0) * (Number.isFinite(rate) && rate > 0 ? rate : 1);

    const selectedCountry = localStorage.getItem('detectedCountry') || 'US';
    const tariff = Number(tariffMultipliers?.[selectedCountry] ?? 0) || 0;

    if (getApplyTariffFlag()) {
      converted *= (1 + tariff);
    }

    return Math.round(converted * 100) / 100;
  }

  function convertPrice(ctx, priceInEur) {
    return convertPriceNumber(ctx, priceInEur).toFixed(2);
  }

  function updateAllPrices(ctx, rootEl) {
    const { selectedCurrency, currencySymbols } = getState(ctx);
    const root = (rootEl || document);

    root.querySelectorAll('.price, .product-price, .basket-item-price, #product-page-price').forEach((element) => {
      const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
      const eur = parseFloat(element.dataset.eur);
      const eurOrig = parseFloat(element.dataset.eurOriginal);
      const pct = Number(element.dataset.recoDiscountPct || element.dataset.discountPct || 0);

      if (!isNaN(eurOrig) && eurOrig > 0 && !isNaN(eur) && eur > 0 && eurOrig > eur) {
        const convOrig = convertPrice(ctx, eurOrig);
        const convDisc = convertPrice(ctx, eur);
        const html = `<span style="text-decoration:line-through;opacity:.65;margin-right:4px">${currencySymbol}${convOrig}</span> <span style="font-weight:700">${currencySymbol}${convDisc}</span> `;
        if (element.innerHTML !== html) element.innerHTML = html;
        return;
      }

      if (!isNaN(eur)) {
        element.textContent = `${currencySymbol}${convertPrice(ctx, eur)}`;
      }
    });

    root.querySelectorAll('.ss-ci-amt[data-eur]').forEach((el) => {
      const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
      const minEurRaw = el.dataset.ciMinEur;
      const baseEurRaw = el.dataset.ciBaseEur;
      if (minEurRaw != null && baseEurRaw != null) {
        const minEUR = parseFloat(minEurRaw);
        const baseEUR = parseFloat(baseEurRaw);
        if (!isNaN(minEUR) && !isNaN(baseEUR)) {
          const need = Math.max(0, Math.round((convertPriceNumber(ctx, minEUR) - convertPriceNumber(ctx, baseEUR)) * 100) / 100);
          el.textContent = `${currencySymbol}${need.toFixed(2)}`;
          return;
        }
      }
      const eur = parseFloat(el.dataset.eur);
      if (isNaN(eur)) return;
      el.textContent = `${currencySymbol}${convertPrice(ctx, eur)}`;
    });

    root.querySelectorAll('.ss-ci-badge[data-eur]').forEach((el) => {
      const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
      const eur = parseFloat(el.dataset.eur);
      if (isNaN(eur)) return;
      const kind = String(el.dataset.badgeKind || '').toLowerCase();
      const val = `${currencySymbol}${convertPrice(ctx, Math.abs(eur))}`;
      if (kind === 'saved') el.textContent = `Saved ${val}`;
      else if (kind === 'bundle') el.textContent = `Bundle -${val}`;
      else el.textContent = val;
    });

    const totalElement = document.getElementById('basket-total');
    if (totalElement) {
      const baseTotal = parseFloat(totalElement.dataset.eur);
      if (!isNaN(baseTotal)) {
        totalElement.textContent = `Total: ${convertPrice(ctx, baseTotal)} ${selectedCurrency}`;
      }
    }
  }

  function initializePrices(ctx) {
    document.querySelectorAll('.price, .product-price, .basket-item-price, #product-page-price, .productPrice').forEach((element) => {
      const basePrice = parseFloat(String(element.textContent || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(basePrice)) element.dataset.eur = basePrice;
    });

    const totalElement = document.getElementById('basket-total');
    if (totalElement) {
      const baseTotal = parseFloat(String(totalElement.textContent || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(baseTotal)) totalElement.dataset.eur = baseTotal;
    }
  }

  function observeNewProducts(ctx) {
    const target = document.getElementById('Viewer') || document.body;
    let pending = false;

    const schedule = () => {
      if (pending) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        try {
          const root = document.getElementById('Viewer') || document.body;
          ctx?.updateAllPrices?.(root);
        } catch {}
      }, 80);
    };

    const shouldIgnoreNode = (node) => {
      try {
        if (!node) return false;
        if (node.nodeType === 3) node = node.parentElement;
        if (!node || !node.closest) return false;
        return !!node.closest('#Basket_Viewer, .payment-modal, .payment-modal-overlay, .payment-modal-card, .__PrivateStripeElement, iframe');
      } catch { return false; }
    };

    const observer = new MutationObserver((mutations) => {
      let allIgnored = true;
      for (const m of mutations) {
        if (m.type === 'childList') {
          if ((m.addedNodes && m.addedNodes.length) || (m.removedNodes && m.removedNodes.length)) {
            if (!shouldIgnoreNode(m.target)) { allIgnored = false; break; }
          }
        } else if (!shouldIgnoreNode(m.target)) {
          allIgnored = false; break;
        }
      }
      if (allIgnored || window.__ssSuppressPriceObserver) return;

      try {
        const root = document.getElementById('Viewer') || document.body;
        root.querySelectorAll('.price, .product-price, .basket-item-price, #product-page-price, .productPrice').forEach((el) => {
          if (!el.dataset.eur) {
            const base = parseFloat(String(el.textContent || '').replace(/[^0-9.]/g, ''));
            if (!isNaN(base)) el.dataset.eur = String(base);
          }
        });
      } catch {}

      schedule();
    });

    observer.observe(target, { childList: true, subtree: true });
    window.__ssPriceObserver = observer;
    return observer;
  }

  const api = { convertPriceNumber, convertPrice, updateAllPrices, initializePrices, observeNewProducts };
  window.__SS_PRICING_RUNTIME__ = api;
})(window, document);
