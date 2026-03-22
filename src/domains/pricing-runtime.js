(function (window, document) {
  'use strict';

  const PRICE_SELECTOR = '.price, .product-price, .basket-item-price, #product-page-price, .productPrice';
  const PRICE_CACHE_KEY = '__ssRememberedProductPrices';

  function parseLoosePrice(value) {
    try {
      if (typeof window.__ssParsePriceEUR === 'function') return window.__ssParsePriceEUR(value);
    } catch {}
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string') return NaN;
    let s = value.trim();
    if (!s) return NaN;
    s = s.replace(/[^0-9,.\-]/g, '');
    if (!s) return NaN;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
      else s = s.replace(/,/g, '');
    } else if (hasComma) {
      s = s.replace(/,/g, '.');
    }
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function normalizeIdentity(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function getPriceCache() {
    try {
      const existing = window[PRICE_CACHE_KEY];
      if (existing && typeof existing === 'object') {
        if (!existing.byId || typeof existing.byId !== 'object') existing.byId = {};
        if (!existing.byName || typeof existing.byName !== 'object') existing.byName = {};
        return existing;
      }
    } catch {}
    const fresh = { byId: {}, byName: {} };
    try { window[PRICE_CACHE_KEY] = fresh; } catch {}
    return fresh;
  }

  function getIdentityFromProduct(productOrIdentity) {
    if (productOrIdentity && typeof productOrIdentity === 'object' && !Array.isArray(productOrIdentity)) {
      return {
        id: normalizeIdentity(productOrIdentity.productId || productOrIdentity.id || ''),
        name: normalizeIdentity(productOrIdentity.name || productOrIdentity.title || '')
      };
    }
    return { id: '', name: normalizeIdentity(productOrIdentity) };
  }

  function rememberProductPrice(productOrIdentity, rawPrice) {
    const price = parseLoosePrice(rawPrice);
    if (!Number.isFinite(price) || price <= 0) return 0;
    const cache = getPriceCache();
    const identity = getIdentityFromProduct(productOrIdentity);
    if (identity.id) cache.byId[identity.id] = price;
    if (identity.name) cache.byName[identity.name] = price;
    return price;
  }

  function getRememberedProductPrice(productOrIdentity) {
    const cache = getPriceCache();
    const identity = getIdentityFromProduct(productOrIdentity);
    const byId = identity.id ? parseLoosePrice(cache.byId?.[identity.id]) : NaN;
    if (Number.isFinite(byId) && byId > 0) return byId;
    const byName = identity.name ? parseLoosePrice(cache.byName?.[identity.name]) : NaN;
    if (Number.isFinite(byName) && byName > 0) return byName;
    const domPrice = findDomPriceByIdentity(identity);
    if (Number.isFinite(domPrice) && domPrice > 0) {
      rememberProductPrice(identity, domPrice);
      return domPrice;
    }
    return 0;
  }

  function getElementIdentity(element) {
    try {
      const directId = normalizeIdentity(element?.dataset?.productId || element?.dataset?.pid || '');
      const directName = normalizeIdentity(element?.dataset?.productName || element?.dataset?.productKey || '');
      if (directId || directName) return { id: directId, name: directName };

      const scoped = element?.closest?.('[data-product-id], [data-product-name], .product, .product-card, #Product_Viewer, .Product_Detail_Page');
      const scopedId = normalizeIdentity(scoped?.dataset?.productId || scoped?.dataset?.pid || '');
      let scopedName = normalizeIdentity(scoped?.dataset?.productName || scoped?.dataset?.productKey || '');
      if (!scopedName) {
        scopedName = normalizeIdentity(
          scoped?.querySelector?.('[data-name]')?.dataset?.name ||
          scoped?.querySelector?.('.product-name')?.textContent ||
          scoped?.querySelector?.('.Product_Name_Heading')?.dataset?.canonicalName ||
          scoped?.querySelector?.('.Product_Name_Heading')?.textContent ||
          ''
        );
      }
      if (scopedId || scopedName) return { id: scopedId, name: scopedName };

      if (element?.id === 'product-page-price') {
        const heading = document.querySelector('.Product_Name_Heading');
        return {
          id: normalizeIdentity(window.__ssCurrentProductId || ''),
          name: normalizeIdentity(heading?.dataset?.canonicalName || heading?.textContent || window.__ssCurrentViewedProductName || '')
        };
      }
    } catch {}
    return { id: '', name: '' };
  }

  function rememberElementPrice(element, rawPrice) {
    const identity = getElementIdentity(element);
    const remembered = rememberProductPrice(identity, rawPrice);
    if (remembered > 0 && element?.dataset) {
      try {
        if (identity.id && !element.dataset.productId) element.dataset.productId = identity.id;
        if (identity.name && !element.dataset.productName) element.dataset.productName = identity.name;
      } catch {}
    }
    return remembered;
  }

  function findDomPriceByIdentity(identity, root = document) {
    const wantedId = normalizeIdentity(identity?.id || '');
    const wantedName = normalizeIdentity(identity?.name || '');
    if (!wantedId && !wantedName) return 0;
    const scope = isRootNode(root) ? root : document;
    try {
      const elements = scope.querySelectorAll(PRICE_SELECTOR);
      for (const element of elements) {
        const current = getElementIdentity(element);
        const idMatches = !!wantedId && !!current.id && current.id === wantedId;
        const nameMatches = !!wantedName && !!current.name && current.name === wantedName;
        if (!idMatches && !nameMatches) continue;
        const direct = parseLoosePrice(element?.dataset?.eur);
        if (Number.isFinite(direct) && direct > 0) {
          rememberElementPrice(element, direct);
          return direct;
        }
        const fromText = parseLoosePrice(String(element?.textContent || ''));
        if (Number.isFinite(fromText) && fromText > 0) {
          try { element.dataset.eur = String(fromText); } catch {}
          rememberElementPrice(element, fromText);
          return fromText;
        }
      }
    } catch {}
    return 0;
  }

  function primePriceCacheFromDom(root = document) {
    const scope = isRootNode(root) ? root : document;
    try {
      scope.querySelectorAll(PRICE_SELECTOR).forEach((element) => {
        const existing = parseLoosePrice(element?.dataset?.eur);
        if (Number.isFinite(existing) && existing > 0) {
          rememberElementPrice(element, existing);
          return;
        }
        const textPrice = parseLoosePrice(String(element?.textContent || ''));
        if (Number.isFinite(textPrice) && textPrice > 0) {
          try { element.dataset.eur = String(textPrice); } catch {}
          rememberElementPrice(element, textPrice);
        }
      });
    } catch {}
  }

  function recoverElementPrice(element, currentPrice) {
    if (Number.isFinite(currentPrice) && currentPrice > 0) {
      rememberElementPrice(element, currentPrice);
      return currentPrice;
    }
    const remembered = getRememberedProductPrice(getElementIdentity(element));
    if (remembered > 0) {
      try { element.dataset.eur = String(remembered); } catch {}
      return remembered;
    }
    const textPrice = parseLoosePrice(String(element?.textContent || ''));
    if (Number.isFinite(textPrice) && textPrice > 0) {
      try { element.dataset.eur = String(textPrice); } catch {}
      rememberElementPrice(element, textPrice);
      return textPrice;
    }
    return currentPrice;
  }

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
    if (typeof secondArg !== 'undefined') {
      return { ctx: isRuntimeCtx(firstArg) ? firstArg : null, value: secondArg };
    }
    if (isRuntimeCtx(firstArg)) return { ctx: firstArg, value: undefined };
    return { ctx: null, value: firstArg };
  }

  function normalizeRootArgs(firstArg, secondArg) {
    if (typeof secondArg !== 'undefined') {
      return { ctx: isRuntimeCtx(firstArg) ? firstArg : null, root: isRootNode(secondArg) ? secondArg : document };
    }
    if (isRuntimeCtx(firstArg)) {
      return { ctx: firstArg, root: document };
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
    const rawTariff = Number(tariffMultipliers?.[selectedCountry] ?? 0);
    const tariff = (Number.isFinite(rawTariff) && rawTariff >= 0) ? rawTariff : 0;

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
      const eur = recoverElementPrice(element, parseLoosePrice(element.dataset.eur));
      const eurOrig = parseLoosePrice(element.dataset.eurOriginal);
      const pct = Number(element.dataset.recoDiscountPct || element.dataset.discountPct || 0);

      if (!isNaN(eurOrig) && eurOrig > 0 && !isNaN(eur) && eur > 0 && eurOrig > eur) {
        const convOrig = convertPrice(ctx, eurOrig);
        const convDisc = convertPrice(ctx, eur);
        const html = `<span style="text-decoration:line-through;opacity:.65;margin-right:4px">${currencySymbol}${convOrig}</span> <span style="font-weight:700">${currencySymbol}${convDisc}</span> `;
        if (element.innerHTML !== html) element.innerHTML = html;
        return;
      }

      if (!isNaN(eur)) {
        rememberElementPrice(element, eur);
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
      const eur = parseLoosePrice(el.dataset.eur);
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
      const existing = parseLoosePrice(element.dataset.eur);
      if (Number.isFinite(existing) && existing > 0) {
        rememberElementPrice(element, existing);
        return;
      }
      const basePrice = parseLoosePrice(String(element.textContent || ''));
      if (Number.isFinite(basePrice) && basePrice > 0) {
        element.dataset.eur = String(basePrice);
        rememberElementPrice(element, basePrice);
        return;
      }
      const remembered = getRememberedProductPrice(getElementIdentity(element));
      if (remembered > 0) element.dataset.eur = String(remembered);
    });

    const totalElement = root.getElementById ? root.getElementById('basket-total') : document.getElementById('basket-total');
    if (totalElement) {
      const baseTotal = parseLoosePrice(String(totalElement.textContent || ''));
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
          const existing = parseLoosePrice(el.dataset.eur);
          if (Number.isFinite(existing) && existing > 0) {
            rememberElementPrice(el, existing);
            return;
          }
          const base = parseLoosePrice(String(el.textContent || ''));
          if (Number.isFinite(base) && base > 0) {
            el.dataset.eur = String(base);
            rememberElementPrice(el, base);
            return;
          }
          const remembered = getRememberedProductPrice(getElementIdentity(el));
          if (remembered > 0) el.dataset.eur = String(remembered);
        });
      } catch {}

      schedule();
    });

    observer.observe(target, { childList: true, subtree: true });
    window.__ssPriceObserver = observer;
    return observer;
  }

  const api = { convertPriceNumber, convertPrice, updateAllPrices, initializePrices, observeNewProducts, primePriceCacheFromDom };
  try {
    primePriceCacheFromDom(document);
  } catch {}
  try {
    window.__ssPrimePriceCacheFromDom = primePriceCacheFromDom;
    window.__ssRememberProductPrice = rememberProductPrice;
    window.__ssGetRememberedProductPrice = getRememberedProductPrice;
  } catch {}
  window.__SS_PRICING_RUNTIME__ = api;
})(window, document);
