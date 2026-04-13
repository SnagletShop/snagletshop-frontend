(function (window, document) {
  'use strict';

  const runtimeStore = window.__SS_RESOLVE__?.resolve?.('state.runtime', window.__SS_RUNTIME_STORE__ || null) || window.__SS_RUNTIME_STORE__ || null;
  const basketRowComponent = () => window.__SS_RESOLVE__?.resolve?.('component.basketRow', window.__SS_BASKET_ROW__ || null) || window.__SS_BASKET_ROW__ || null;
  const basketRuntime = () => window.__SS_RESOLVE__?.resolve?.('domain.basketRuntime', window.__SS_BASKET_RUNTIME__ || null) || window.__SS_BASKET_RUNTIME__ || null;

  function readBasketFromStorageSafe() {
    try {
      const raw = localStorage.getItem(BASKET_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function syncBasketFromStorage(reason = 'external') {
    replaceBasketInMemory(readBasketFromStorageSafe());
    refreshBasketUIIfOpen();

    const modal = document.getElementById('paymentModal');
    const modalOpen = modal && modal.style && modal.style.display && modal.style.display !== 'none';
    if (modalOpen && typeof closeModal === 'function') {
      try { closeModal(); } catch {}
    }

    try { __ssUpdateBasketHeaderIndicator(); } catch {}
    try { runtimeStore?.setBasket?.(basket, `sync:${reason}`); } catch {}
  }

  function persistBasket(reason = 'update') {
    try { localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket)); } catch {}
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch {}

    if (basketBC) {
      try { basketBC.postMessage({ type: 'basket_changed', from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch {}
    }

    try { __ssUpdateBasketHeaderIndicator(); } catch {}
    try { runtimeStore?.setBasket?.(basket, `persist:${reason}`); } catch {}
  }

  function clearBasketStorage(reason = 'clear') {
    try { localStorage.removeItem(BASKET_STORAGE_KEY); } catch {}
    try { localStorage.setItem(BASKET_REV_KEY, String(Date.now())); } catch {}

    if (basketBC) {
      try { basketBC.postMessage({ type: 'basket_changed', from: TAB_SYNC_ID, reason, ts: Date.now() }); } catch {}
    }

    try { __ssUpdateBasketHeaderIndicator(); } catch {}
    try { runtimeStore?.setBasket?.({}, `clear:${reason}`); } catch {}
  }

  function clearBasketCompletely() {
    try {
      if (typeof basket === 'object' && basket) {
        for (const k of Object.keys(basket)) delete basket[k];
      }
    } catch {}

    clearBasketStorage('clear_basket');
    refreshBasketUIIfOpen();
  }

  function loadBasket() {
    updateBasket();
  }

  function readBasket() {
    try {
      if (typeof basket === 'object' && basket && Object.keys(basket).length) {
        return JSON.parse(JSON.stringify(basket));
      }
    } catch {}

    try {
      const raw = localStorage.getItem('basket');
      const parsed = raw ? JSON.parse(raw) : {};
      try {
        if (typeof basket === 'object' && basket && !Object.keys(basket).length && parsed && typeof parsed === 'object') {
          for (const k of Object.keys(parsed)) basket[k] = parsed[k];
        }
      } catch {}
      return parsed || {};
    } catch {
      return {};
    }
  }

  function GoToCart() {
    clearCategoryHighlight();
    const viewer = document.getElementById('Viewer');

    if (!viewer) {
      console.error('Viewer element not found.');
      return;
    }

    viewer.innerHTML = '';

    const Basket_Viewer = document.createElement('div');
    Basket_Viewer.id = 'Basket_Viewer';
    Basket_Viewer.classList.add('Basket_Viewer');

    viewer.appendChild(Basket_Viewer);

    try { window.__ssBasketAutoScrolledForOpen = false; } catch {}

    setTimeout(() => {
      updateBasket();

      try {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 520px)').matches;
        if (isMobile && !window.__ssBasketAutoScrolledForOpen) {
          window.__ssBasketAutoScrolledForOpen = true;
          setTimeout(() => {
            try {
              const payBtn = document.querySelector('#Basket_Viewer .PayButton');
              if (payBtn) payBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } catch {}
          }, 220);
        }
      } catch {}
    }, 100);

    removeSortContainer();
  }

  function addToCart(productName, price, imageUrl, expectedPurchasePrice, productLink, productDescription, selectedOption = '', selectedOptions = null, productIdHint = null, explicitRecoMeta = null) {
    let productIdForCart = String(productIdHint || '').trim();

    let pRef = {};
    try {
      if (typeof findProductByNameParam === 'function') pRef = findProductByNameParam(productName) || {};
      else if (typeof findProductByName === 'function') pRef = findProductByName(productName) || {};
    } catch {}
    if (!productIdForCart) productIdForCart = String(pRef.productId || '').trim();

    if (!productIdForCart) {
      const canon = canonicalizeProductLink(productLink || '');
      const found = canon ? __ssGetCatalogFlat().find((pp) => canonicalizeProductLink(pp?.productLink || '') === canon) : null;
      if (found) {
        pRef = found;
        productIdForCart = String(found.productId || '').trim();
      }
    }

    if (!productIdForCart) productIdForCart = null;

    let explicitRecoDisc = null;
    try {
      const src = (explicitRecoMeta && typeof explicitRecoMeta === 'object') ? explicitRecoMeta : null;
      const tok = String(src?.discountToken || '').trim();
      const pct = Math.max(0, Math.min(80, Number(src?.discountPct || 0) || 0));
      const disc = Number(src?.discountedPrice || 0) || 0;
      const orig = Number(src?.originalPrice || 0) || 0;
      if (tok && pct > 0 && disc > 0) {
        explicitRecoDisc = {
          discountToken: tok,
          discountPct: pct,
          discountedPrice: disc,
          originalPrice: orig,
          recoTrackingToken: String(src?.recoTrackingToken || '').trim(),
          recoWidgetId: String(src?.recoWidgetId || '').trim(),
          recoSourceProductId: String(src?.recoSourceProductId || '').trim(),
          recoPosition: (src?.recoPosition == null) ? null : (Number(src?.recoPosition || 0) || 0),
          recoSessionId: String(src?.recoSessionId || '').trim()
        };
      }
    } catch {}

    let recoDisc = explicitRecoDisc;
    if (!recoDisc) {
      try { recoDisc = __ssRecoMaybeAttributeAddToCart(productIdForCart); } catch {}
    } else {
      try {
        __ssRecoSendEvent?.('add_to_cart', {
          widgetId: recoDisc.recoWidgetId,
          token: recoDisc.recoTrackingToken,
          sourceProductId: recoDisc.recoSourceProductId,
          targetProductId: String(productIdForCart || '').trim(),
          position: recoDisc.recoPosition,
          sessionId: recoDisc.recoSessionId
        });
      } catch {}
    }

    let smartRecoMeta = null;
    try {
      const pending = window.__ssPendingSmartRecoAddMeta || null;
      const age = Date.now() - Number(pending?.ts || 0);
      const pendingPid = String(pending?.productId || '').trim();
      const pendingName = String(pending?.name || '').trim();
      const matches = (pendingPid && productIdForCart && pendingPid === String(productIdForCart).trim())
        || (pendingName && pendingName === String(productName || '').trim());
      if (pending && matches && age >= 0 && age <= (30 * 60 * 1000)) {
        smartRecoMeta = {
          smartRecoToken: String(pending?.token || '').trim(),
          smartRecoItemKey: String(pending?.itemKey || productIdForCart || productName || '').trim(),
          smartRecoPlacement: String(pending?.placement || '').trim()
        };
        delete window.__ssPendingSmartRecoAddMeta;
      } else if (pending && age > (30 * 60 * 1000)) {
        delete window.__ssPendingSmartRecoAddMeta;
      }
    } catch {}

    __ssEnsureABUiStyles();
    const pForAB = (pRef && typeof pRef === 'object') ? pRef : { name: productName, description: productDescription, price };
    const displayName = (__ssABGetProductName(pForAB) || String(productName || '')).trim();
    const displayDescription = (String(productDescription || '').trim())
      ? String(productDescription)
      : (String(__ssABGetProductDescription(pForAB) || '')).trim();

    const qtyKeyForCart = productIdForCart || productIdHint || window.__ssCurrentProductId || productName;
    const qty = Math.max(
      1,
      (typeof __ssGetQtyValue === 'function')
        ? __ssGetQtyValue(qtyKeyForCart)
        : ((typeof cart === 'object' && cart && cart[productName]) ? (parseInt(cart[productName], 10) || 1) : 1)
    );
    if (typeof cart === 'object' && cart) cart[productName] = 1;
    try { __ssSetQtyValue(qtyKeyForCart, 1); } catch {}

    let selOpts = __ssNormalizeSelectedOptions(selectedOptions);
    if (!selOpts.length && selectedOption) {
      const p = __ssGetCatalogFlat().find((pp) => pp?.name === productName) || {};
      const groups = __ssExtractOptionGroups(p);
      const label = (groups?.[0]?.label) ? groups[0].label : 'Option';
      selOpts = [{ label, value: String(selectedOption).trim() }];
    }
    if (!selectedOption && selOpts.length) selectedOption = selOpts[0].value;

    const priceEUR = __ssResolveVariantPriceEUR(pRef, selOpts, selectedOption) || (parseFloat(price) || Number(price) || 0);
    price = priceEUR;

    let origPriceBeforeReco = (Number(recoDisc?.originalPrice || 0) > 0)
      ? Number(recoDisc.originalPrice || 0)
      : price;
    const pdpRecoApplied = (productIdForCart && window.__ssRecoPdpDiscountAppliedFor && String(window.__ssRecoPdpDiscountAppliedFor) === String(productIdForCart));

    if (pdpRecoApplied) {
      try {
        const el = document.getElementById('product-page-price');
        const tok = String(el?.dataset?.recoDiscountToken || '');
        const pct = Number(el?.dataset?.recoDiscountPct || 0);
        const orig = Number(el?.dataset?.eurOriginal || 0);
        if (Number.isFinite(orig) && orig > 0) origPriceBeforeReco = orig;
        if ((!recoDisc || !String(recoDisc.discountToken || '')) && tok && pct > 0) {
          recoDisc = { discountToken: tok, discountPct: pct, discountedPrice: Number(el?.dataset?.eur || 0) };
        }
      } catch {}
    }

    if (pdpRecoApplied && recoDisc && Number(recoDisc.discountedPrice || 0) > 0) {
      price = Number(recoDisc.discountedPrice || 0);
    }

    if (recoDisc && Number(recoDisc.discountPct || 0) > 0 && String(recoDisc.discountToken || '')) {
      const pct = Math.max(0, Math.min(80, Number(recoDisc.discountPct || 0)));
      if (!pdpRecoApplied) {
        const explicitDiscounted = Number(recoDisc.discountedPrice || 0) || 0;
        const discounted = (explicitDiscounted > 0)
          ? explicitDiscounted
          : Math.round((price * (1 - pct / 100)) * 100) / 100;
        if (Number.isFinite(discounted) && discounted > 0) {
          price = discounted;
        }
      }
    }

    const key = selOpts.length ? `${productName} - ${__ssFormatSelectedOptionsKey(selOpts)}` : (selectedOption ? `${productName} - ${selectedOption}` : productName);

    if (qty > 0) {
      if (basket && basket[key]) {
        basket[key].quantity += qty;
        basket[key].price = price;
        basket[key].unitPriceEUR = price;
        basket[key].displayName = displayName;
        basket[key].displayDescription = displayDescription;
        if (!basket[key].productId && productIdForCart) basket[key].productId = productIdForCart;
        if (selOpts.length) basket[key].selectedOptions = selOpts;
        if (selectedOption) basket[key].selectedOption = selectedOption;
        if (recoDisc && String(recoDisc.discountToken || '')) {
          basket[key].recoDiscountToken = String(recoDisc.discountToken || '');
          basket[key].recoDiscountPct = Number(recoDisc.discountPct || 0);
          basket[key].unitPriceOriginalEUR = Number(origPriceBeforeReco);
          if (String(recoDisc.recoTrackingToken || '')) basket[key].recoTrackingToken = String(recoDisc.recoTrackingToken || '');
          if (String(recoDisc.recoWidgetId || '')) basket[key].recoWidgetId = String(recoDisc.recoWidgetId || '');
          if (String(recoDisc.recoSourceProductId || '')) basket[key].recoSourceProductId = String(recoDisc.recoSourceProductId || '');
          if (recoDisc.recoPosition != null) basket[key].recoPosition = Number(recoDisc.recoPosition || 0) || 0;
          if (String(recoDisc.recoSessionId || '')) basket[key].recoSessionId = String(recoDisc.recoSessionId || '');
        }
        if (smartRecoMeta && String(smartRecoMeta.smartRecoToken || '')) {
          basket[key].smartRecoToken = String(smartRecoMeta.smartRecoToken || '');
          basket[key].smartRecoItemKey = String(smartRecoMeta.smartRecoItemKey || '');
          basket[key].smartRecoPlacement = String(smartRecoMeta.smartRecoPlacement || '');
        }
      } else {
        basket[key] = {
          name: productName,
          displayName,
          displayDescription,
          price,
          unitPriceEUR: price,
          image: imageUrl,
          quantity: qty,
          productId: productIdForCart,
          expectedPurchasePrice,
          productLink,
          description: productDescription,
          ...(selectedOption ? { selectedOption } : {}),
          ...(selOpts.length ? { selectedOptions: selOpts } : {}),
          ...((recoDisc && String(recoDisc.discountToken || '')) ? {
            recoDiscountToken: String(recoDisc.discountToken || ''),
            recoDiscountPct: Number(recoDisc.discountPct || 0),
            unitPriceOriginalEUR: Number(origPriceBeforeReco),
            recoTrackingToken: String(recoDisc.recoTrackingToken || ''),
            recoWidgetId: String(recoDisc.recoWidgetId || ''),
            recoSourceProductId: String(recoDisc.recoSourceProductId || ''),
            recoPosition: (recoDisc.recoPosition == null) ? null : (Number(recoDisc.recoPosition || 0) || 0),
            recoSessionId: String(recoDisc.recoSessionId || '')
          } : {}),
          ...((smartRecoMeta && String(smartRecoMeta.smartRecoToken || '')) ? {
            smartRecoToken: String(smartRecoMeta.smartRecoToken || ''),
            smartRecoItemKey: String(smartRecoMeta.smartRecoItemKey || ''),
            smartRecoPlacement: String(smartRecoMeta.smartRecoPlacement || '')
          } : {})
        };
      }

      try {
        if (typeof persistBasket === 'function') persistBasket('add_to_cart');
        else localStorage.setItem('basket', JSON.stringify(basket));
      } catch {
        try { localStorage.setItem('basket', JSON.stringify(basket)); } catch {}
      }

      try {
        const payload = buildAnalyticsProductPayload(productName, { priceEUR: price, productLink, productId: productIdForCart });
        payload.extra = { selectedOption: selectedOption || '', selectedOptions: selOpts || null, qty };
        sendAnalyticsEvent('add_to_cart', {
          ...payload,
          extra: {
            ...(payload.extra || {}),
            viewToken: (typeof __ssCurrentViewToken !== 'undefined' ? __ssCurrentViewToken : null),
            clickToken: __ssConsumeRecentClickToken(),
            experiments: (typeof __ssGetExperiments === 'function' ? __ssGetExperiments() : null)
          }
        });
      } catch {}

      const optMsg = selOpts.length ? ` (${__ssFormatSelectedOptionsDisplay(selOpts)})` : (selectedOption ? ` (${selectedOption})` : '');
      __ssNotifyAddToCart({ qty, productName, optMsg, imageUrl, itemKey: key });
    } else {
      alert('Please select at least one item.');
    }
  }

  function updateBasket() {
    let fullCart = [];
    let prevWinY = 0;
    let prevContainerY = 0;
    let hasContainerScroll = false;

    try {
      prevWinY = (typeof window.scrollY === 'number') ? window.scrollY : (document.documentElement.scrollTop || 0);
    } catch {}

    if (window.__ssUpdatingBasket) return;
    window.__ssUpdatingBasket = true;
    window.__ssBasketRenderInProgress = true;

    try {
      const basketContainer = document.getElementById('Basket_Viewer');
      if (!basketContainer) return;

      try {
        prevContainerY = Number(basketContainer.scrollTop || 0) || 0;
        const st = window.getComputedStyle ? getComputedStyle(basketContainer) : null;
        const oy = String(st?.overflowY || '').toLowerCase();
        hasContainerScroll = (oy === 'auto' || oy === 'scroll');
      } catch {}

      basketContainer.innerHTML = '';

      try { __ssEnsureOptionChipStyles(); } catch {}

      if (!basket || Object.keys(basket).length === 0) {
        basketContainer.innerHTML = `<p class="EmptyBasketMessage">${__ssEscHtml(TEXTS?.BASKET?.EMPTY || 'The basket is empty!')}</p>`;
        return;
      }

      const entries = Object.entries(basket);
      try { __ssValidateRecoDiscountsInBasketBestEffort(entries); } catch {}

      const itemCount = entries.reduce((sum, [, item]) => sum + Math.max(1, parseInt(item?.quantity || 1, 10) || 1), 0);

      const basketHeader = document.createElement('div');
      basketHeader.className = 'BasketPageHeader';
      basketHeader.innerHTML = `
        <div class="BasketPageHeaderMain">
          <h2 class="BasketPageTitle">Your Cart <span class="BasketPageCount">(${itemCount})</span></h2>
          <p class="BasketPageSubtitle">Review your items and proceed to checkout.</p>
        </div>
        <button type="button" class="BasketContinueButton">&lsaquo; Continue Shopping</button>
      `;

      const continueButton = basketHeader.querySelector('.BasketContinueButton');
      continueButton?.addEventListener('click', () => {
        try {
          if (window.history.length > 1) {
            window.history.back();
            return;
          }
        } catch {}
        try { window.trackedGoHome?.(); } catch {}
      });

      const basketLayout = document.createElement('div');
      basketLayout.className = 'BasketLayout';

      const basketMain = document.createElement('div');
      basketMain.className = 'BasketLayoutMain';

      const basketAside = document.createElement('aside');
      basketAside.className = 'BasketLayoutAside';

      basketLayout.append(basketMain, basketAside);
      basketContainer.append(basketHeader, basketLayout);

      let totalSum = 0;
      for (const [, item] of entries) {
        const unit = Number(parseFloat(item?.price) || 0);
        const qty = Math.max(1, parseInt(item?.quantity || 1, 10) || 1);
        totalSum += unit * qty;
      }

      let inc = null;
      let totalAfter = round2(totalSum);
      let discountEUR = 0;

      try {
        fullCart = __ssGetFullCartPreferred();
        inc = __ssComputeCartIncentivesClient(totalSum, fullCart);
        totalAfter = round2(Number(inc?.subtotalAfterDiscountsEUR ?? totalSum) || totalSum);
        discountEUR = round2((Number(inc?.tierDiscountEUR || 0) || 0) + (Number(inc?.bundleDiscountEUR || 0) || 0));
        window.__ssLastCartIncentives = inc;
        try { localStorage.setItem('ss_cart_incentives_last_v1', JSON.stringify({ t: Date.now(), inc })); } catch {}
      } catch {}

      let productByName = null;
      try {
        productByName = new Map();
        const groups = (typeof products === 'object' && products) ? Object.values(products) : [];
        for (const g of groups) {
          if (Array.isArray(g)) {
            for (const p of g) {
              const n = p && p.name;
              if (n && !productByName.has(n)) productByName.set(n, p);
            }
          }
        }
      } catch { productByName = null; }

      for (const [key, item] of entries) {
        const product = productByName ? (productByName.get(item?.name || '') || null) : null;
        const productDiv = basketRowComponent()?.createBasketRow?.(key, item, product) || document.createElement('div');
        basketMain.appendChild(productDiv);
      }

      let incentivesHTML = '';
      try { incentivesHTML = __ssRenderCartIncentivesHTML(totalSum, { inc, fullCart }) || ''; } catch { incentivesHTML = ''; }
      if (String(incentivesHTML || '').trim()) {
        const incentivesDiv = document.createElement('div');
        incentivesDiv.className = 'BasketIncentivesRail';
        incentivesDiv.innerHTML = incentivesHTML;
        basketMain.appendChild(incentivesDiv);
      }

      const freeShippingThreshold = Number(inc?.freeShippingThresholdEUR || inc?.freeShippingThreshold || 50) || 50;
      const freeShippingUnlocked = !!(inc?.freeShippingEligible || inc?.hasFreeShipping || totalAfter >= freeShippingThreshold);
      const shippingLine = freeShippingUnlocked ? 'Free shipping unlocked' : 'Calculated at checkout';
      const saveLine = discountEUR > 0
        ? `<div class="BasketSummaryLine BasketSummaryLine--save"><span class="BasketSummaryLabel">You Save</span><span class="BasketSummaryValue BasketSummaryValue--accent" data-eur="${discountEUR.toFixed(2)}">- ${discountEUR.toFixed(2)}&euro;</span></div>`
        : '';
      const freeShippingText = `Free shipping on orders over ${freeShippingThreshold.toFixed(2)}&euro;`;
      const receiptDiv = document.createElement('div');
      receiptDiv.className = 'BasketReceipt';

      receiptDiv.innerHTML = `
        <div class="BasketSummaryCard">
          <div class="BasketSummaryHeader">
            <h3 class="BasketSummaryTitle">Order Summary</h3>
          </div>
          <div class="BasketSummaryLines">
            <div class="BasketSummaryLine">
              <span class="BasketSummaryLabel">Subtotal (${itemCount} item${itemCount === 1 ? '' : 's'})</span>
              <span class="BasketSummaryValue" data-eur="${round2(totalSum).toFixed(2)}">${round2(totalSum).toFixed(2)}&euro;</span>
            </div>
            ${saveLine}
            <div class="BasketSummaryDivider"></div>
            <div class="BasketSummaryLine">
              <span class="BasketSummaryLabel">Shipping</span>
              <span class="BasketSummaryValue BasketSummaryValue--muted">${shippingLine}</span>
            </div>
          </div>
          <div class="BasketSummaryTotalRow">
            <span class="BasketSummaryTotalLabel">Total</span>
            <strong class="PayTotalText" id="basket-total" data-eur="${totalAfter.toFixed(2)}">
              ${discountEUR > 0 && totalAfter < totalSum
                ? `<span class="ss-price-old--muted">${totalSum.toFixed(2)}&euro;</span> <span>${totalAfter.toFixed(2)}&euro;</span>`
                : `${totalAfter.toFixed(2)}&euro;`}
            </strong>
          </div>
          <div class="ReceiptFooter">
            <button class="PayButton">${__ssEscHtml(TEXTS?.PRODUCT_SECTION?.BUY_NOW || 'Buy now')}</button>
          </div>
          <div class="BasketSummaryNote">
            <span class="BasketSummaryNoteTitle">Checkout note</span>
            <span class="BasketSummaryNoteText">Your cart stays saved while you review shipping, payment, and the final total at checkout.</span>
          </div>
          <div class="BasketSummaryBenefits">
            <div class="BasketSummaryBenefit">
              <span class="BasketSummaryBenefitTitle">Free Shipping</span>
              <span class="BasketSummaryBenefitText">${freeShippingText}</span>
            </div>
            <div class="BasketSummaryBenefit">
              <span class="BasketSummaryBenefitTitle">30-Day Guarantee</span>
              <span class="BasketSummaryBenefitText">Shop with extra peace of mind.</span>
            </div>
            <div class="BasketSummaryBenefit">
              <span class="BasketSummaryBenefitTitle">24/7 Support</span>
              <span class="BasketSummaryBenefitText">We are here if you need help.</span>
            </div>
          </div>
          <div class="BasketSummaryTrust">
            <div class="BasketSummaryTrustItem">
              <span class="BasketSummaryTrustTitle">Secure Checkout</span>
              <span class="BasketSummaryTrustText">SSL encrypted</span>
            </div>
            <div class="BasketSummaryTrustItem">
              <span class="BasketSummaryTrustTitle">Trusted Store</span>
              <span class="BasketSummaryTrustText">Thousands of customers</span>
            </div>
          </div>
        </div>`;
      basketAside.appendChild(receiptDiv);

      try {
        const restore = () => {
          try {
            if (hasContainerScroll) {
              basketContainer.scrollTop = prevContainerY;
            } else if (prevWinY > 0) {
              window.scrollTo(0, prevWinY);
            }
          } catch {}
        };
        requestAnimationFrame(() => requestAnimationFrame(restore));
      } catch {}

      try {
        window.__ssSuppressPriceObserver = true;
        if (typeof updateAllPrices === 'function') updateAllPrices(basketContainer);
      } catch {}
      finally {
        setTimeout(() => { try { window.__ssSuppressPriceObserver = false; } catch {} }, 250);
      }

      try { (window.__ssBindCartIncentives || __ssBindCartIncentives)?.(basketContainer); } catch {}

      if (!basketContainer.dataset.qtyBound) {
        basketContainer.dataset.qtyBound = '1';
        basketContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('.BasketChangeQuantityButton');
          if (!btn) return;
          e.preventDefault();
          e.stopPropagation();
          const kk = decodeURIComponent(btn.dataset.key || '');
          const delta = parseInt(btn.dataset.delta || '0', 10) || 0;
          try { changeQuantity(kk, delta); } catch {}
        });
      }
    } finally {
      window.__ssUpdatingBasket = false;
      window.__ssBasketRenderInProgress = false;
      if (window.__ssBasketNeedsRerender) {
        window.__ssBasketNeedsRerender = false;
        (window.__ssRequestBasketRerender || __ssRequestBasketRerender)?.('post-render');
      }
    }
  }

  const api = {
    readBasketFromStorageSafe,
    syncBasketFromStorage,
    persistBasket,
    clearBasketStorage,
    clearBasketCompletely,
    loadBasket,
    readBasket,
    GoToCart,
    addToCart,
    updateBasket
  };

  try { window.__SS_RESOLVE__?.expose?.('domain.basket', api, ['__SS_BASKET__']); } catch { window.__SS_BASKET__ = api; }
})(window, document);
