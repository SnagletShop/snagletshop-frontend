(function (window, document) {
  'use strict';

  const PRICE_SELECTOR = '.price, .product-price, .basket-item-price, #product-page-price, .productPrice';

  function isRuntimeCtx(value) {
    return !!value && typeof value === 'object' && (
      typeof value.getSelectedCurrency === 'function' ||
      typeof value.getExchangeRates === 'function' ||
      typeof value.getTariffMultipliers === 'function' ||
      typeof value.getApplyTariffFlag === 'function' ||
      (value.currencySymbols && typeof value.currencySymbols === 'object')
    );
  }

  function isRootNode(value) {
    return value === document || (!!value && typeof value === 'object' && (
      value.nodeType === 1 ||
      value.nodeType === 9 ||
      typeof value.querySelectorAll === 'function'
    ));
  }

  function normalizeValueArgs(firstArg, secondArg) {
    if (isRuntimeCtx(firstArg)) return { ctx: firstArg, value: secondArg };
    return { ctx: null, value: firstArg };
  }

  function normalizeRootArgs(firstArg, secondArg) {
    if (isRuntimeCtx(firstArg)) {
      return { ctx: firstArg, root: isRootNode(secondArg) ? secondArg : document };
    }
    return { ctx: null, root: isRootNode(firstArg) ? firstArg : document };
  }

  function getLegacyPricingState() {
    const shared = window.__SS_SHARED_DATA__ || {};
    const textCurrencies = shared.TEXTS?.CURRENCIES || {};

    let selectedCurrency = 'EUR';
    try {
      selectedCurrency = String(window.selectedCurrency || localStorage.getItem('selectedCurrency') || 'EUR');
    } catch {}

    const exchangeRates = (window.exchangeRates && typeof window.exchangeRates === 'object')
      ? window.exchangeRates
      : ((window.preloadedData?.exchangeRates && typeof window.preloadedData.exchangeRates === 'object')
        ? window.preloadedData.exchangeRates
        : {});

    const tariffMultipliers = (window.tariffMultipliers && typeof window.tariffMultipliers === 'object')
      ? window.tariffMultipliers
      : ((window.preloadedData?.tariffs && typeof window.preloadedData.tariffs === 'object')
        ? window.preloadedData.tariffs
        : {});

    const currencySymbols = (window.currencySymbols && typeof window.currencySymbols === 'object')
      ? window.currencySymbols
      : textCurrencies;

    const getApplyTariffFlag = () => {
      try {
        const runtime = window.__SS_CHECKOUT_RUNTIME__;
        if (runtime && typeof runtime.getApplyTariffFlag === 'function') {
          return !!runtime.getApplyTariffFlag({ serverApplyTariff: window.serverApplyTariff });
        }
      } catch {}
      try {
        const raw = localStorage.getItem('applyTariff');
        if (raw == null) return true;
        return raw === 'true';
      } catch {
        return true;
      }
    };

    return { selectedCurrency, exchangeRates, tariffMultipliers, currencySymbols, getApplyTariffFlag };
  }

  function getState(ctx) {
    const legacy = getLegacyPricingState();
    return {
      selectedCurrency: ctx?.getSelectedCurrency?.() || legacy.selectedCurrency,
      exchangeRates: ctx?.getExchangeRates?.() || legacy.exchangeRates,
      tariffMultipliers: ctx?.getTariffMultipliers?.() || legacy.tariffMultipliers,
      currencySymbols: ctx?.currencySymbols || legacy.currencySymbols,
      getApplyTariffFlag: ctx?.getApplyTariffFlag || legacy.getApplyTariffFlag
    };
  }

  function convertPriceNumber(ctxOrPrice, maybePrice) {
    const { ctx, value: priceInEur } = normalizeValueArgs(ctxOrPrice, maybePrice);
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

  function convertPrice(ctxOrPrice, maybePrice) {
    const { ctx, value: priceInEur } = normalizeValueArgs(ctxOrPrice, maybePrice);
    return convertPriceNumber(ctx, priceInEur).toFixed(2);
  }

  function updateAllPrices(ctxOrRoot, maybeRootEl) {
    const { ctx, root } = normalizeRootArgs(ctxOrRoot, maybeRootEl);
    const { selectedCurrency, currencySymbols } = getState(ctx);

    root.querySelectorAll(PRICE_SELECTOR).forEach((element) => {
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

  function initializePrices(ctxOrRoot, maybeRootEl) {
    const { root } = normalizeRootArgs(ctxOrRoot, maybeRootEl);
    root.querySelectorAll(PRICE_SELECTOR).forEach((element) => {
      const basePrice = parseFloat(String(element.textContent || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(basePrice)) element.dataset.eur = basePrice;
    });

    const totalElement = root.getElementById ? root.getElementById('basket-total') : document.getElementById('basket-total');
    if (totalElement) {
      const baseTotal = parseFloat(String(totalElement.textContent || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(baseTotal)) totalElement.dataset.eur = baseTotal;
    }
  }

  function observeNewProducts(ctxOrRoot, maybeRootEl) {
    const { ctx, root } = normalizeRootArgs(ctxOrRoot, maybeRootEl);
    const target = (root && root !== document) ? root : (document.getElementById('Viewer') || document.body);
    let pending = false;

    const schedule = () => {
      if (pending) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        try {
          const activeRoot = document.getElementById('Viewer') || document.body;
          if (ctx?.updateAllPrices) ctx.updateAllPrices(activeRoot);
          else updateAllPrices(ctx, activeRoot);
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
        root.querySelectorAll(PRICE_SELECTOR).forEach((el) => {
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
