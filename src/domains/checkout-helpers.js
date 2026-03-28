(function (window) {
  async function refreshFxSnapshotForCheckoutRetry() {
    try {
      if (typeof window.__ssResetSettingsPreloadState === 'function') {
        window.__ssResetSettingsPreloadState({ clearSettingsCache: true, clearRates: true });
      } else if (window.__SS_SETTINGS_RUNTIME__?.clearSettingsCache) {
        window.__SS_SETTINGS_RUNTIME__.clearSettingsCache({
          SETTINGS_CACHE_KEY: window.SETTINGS_CACHE_KEY || 'preloadedSettings'
        });
      } else {
        try { localStorage.removeItem(window.SETTINGS_CACHE_KEY || 'preloadedSettings'); } catch {}
        try { window.exchangeRatesFetchedAt = 0; } catch {}
      }

      try {
        if (typeof window.fetchExchangeRatesFromServer === 'function') {
          const ratesData = await window.fetchExchangeRatesFromServer();
          const safeTs = Number(ratesData?.fetchedAt || window.preloadedData?.ratesFetchedAt || 0) || 0;
          if (safeTs > 0) {
            try { window.exchangeRatesFetchedAt = safeTs; } catch {}
            try { if (typeof window.__ssSetExchangeRatesFetchedAt === 'function') window.__ssSetExchangeRatesFetchedAt(safeTs); } catch {}
          }
        }
      } catch {}
      try {
        if (typeof window.fetchTariffs === 'function') {
          await window.fetchTariffs();
        }
      } catch {}
      try {
        if (typeof window.preloadSettingsData === 'function') {
          await window.preloadSettingsData({ forceRefresh: true });
        }
      } catch {}
    } catch {}
  }

  function computeExpectedClientTotalForServer(fullCart, currency, countryCode) {
    const cur = String(currency || "EUR").toUpperCase();
    const cc = String(countryCode || "").toUpperCase();
    const resolveUnitPrice = window.__SS_CHECKOUT_RUNTIME__?.resolveCheckoutUnitPriceEUR;

    const baseEUR = (fullCart || []).reduce((sum, i) => {
      const qty = Math.max(1, parseInt(i?.quantity ?? 1, 10) || 1);
      const unit = (typeof resolveUnitPrice === 'function')
        ? Number(resolveUnitPrice(i) || 0)
        : window.__ssParsePriceEUR(i?.unitPriceEUR ?? i?.price ?? 0);
      return sum + unit * qty;
    }, 0);

    const inc = window.__ssComputeCartIncentivesClient(baseEUR, fullCart);
    let totalEUR = Number(inc?.totalWithShippingEUR ?? inc?.subtotalAfterDiscountsEUR ?? baseEUR) || baseEUR;

    if (typeof window.getApplyTariffFlag === 'function' && window.getApplyTariffFlag()) {
      const tariff = Number(window.tariffMultipliers?.[cc] ?? 0) || 0;
      totalEUR = totalEUR * (1 + tariff);
    }

    const rate = cur === "EUR" ? 1 : (Number(window.exchangeRates?.[cur] ?? 0) || 0);
    const totalInCurrency = cur === "EUR" ? totalEUR : (rate ? totalEUR * rate : 0);
    return (typeof window.round2 === 'function' ? window.round2(totalInCurrency) : Math.round(totalInCurrency * 100) / 100);
  }

  function buildStripeOrderSummary(stripeCart) {
    return (stripeCart || [])
      .map((item) => {
        const name = String(item?.name || "");
        const shortName = name.length > 30 ? name.slice(0, 30) + "…" : name;
        const sel = window.__SS_PRODUCT_OPTIONS__.__ssNormalizeSelectedOptions(item?.selectedOptions || []);
        const opt = sel.length ? ` (${window.__SS_PRODUCT_OPTIONS__.__ssFormatSelectedOptionsDisplay(sel).slice(0, 80)})` :
          (item?.selectedOption ? ` (${String(item.selectedOption).slice(0, 40)})` : "");
        const qty = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);
        return `${qty}x ${shortName}${opt}`;
      })
      .join(", ")
      .slice(0, 499);
  }

  function isCheckoutDebugEnabled() {
    try {
      return String(localStorage.getItem("ss_checkout_debug") || "") === "1";
    } catch {
      return false;
    }
  }

  function persistCheckoutDebugSnapshot(key, value) {
    try {
      if (!isCheckoutDebugEnabled()) {
        sessionStorage.removeItem(key);
        return;
      }
      sessionStorage.setItem(key, JSON.stringify(value || {}));
    } catch {}
  }

  function redactPiRequestForDebug(payload) {
    const clone = { ...(payload || {}) };
    if (clone.turnstileToken) clone.turnstileToken = "[redacted]";
    return clone;
  }

  async function syncRecoDiscountsForCheckout(fullCart, stripeCart) {
    const currentFullCart = Array.isArray(fullCart) ? fullCart : [];
    const currentStripeCart = Array.isArray(stripeCart) ? stripeCart : [];
    const hasRecoToken = currentFullCart.some((item) => String(item?.recoDiscountToken || '').trim());
    if (!hasRecoToken) return { fullCart: currentFullCart, stripeCart: currentStripeCart };

    const rt = window.__SS_CHECKOUT_RUNTIME__ || {};

    try {
      const basketObj = JSON.parse(localStorage.getItem('basket') || '{}');
      const entries = Object.entries((basketObj && typeof basketObj === 'object') ? basketObj : {});
      if (entries.length && typeof window.__ssValidateRecoDiscountsInBasketBestEffort === 'function') {
        await window.__ssValidateRecoDiscountsInBasketBestEffort(entries);
      }
    } catch {}

    let nextFullCart = currentFullCart;
    let nextStripeCart = currentStripeCart;
    try {
      nextFullCart = (typeof rt.buildFullCartFromBasket === 'function')
        ? (rt.buildFullCartFromBasket() || [])
        : currentFullCart;
      nextStripeCart = (typeof rt.buildStripeSafeCart === 'function')
        ? (rt.buildStripeSafeCart({}, nextFullCart) || [])
        : currentStripeCart;
    } catch {
      nextFullCart = currentFullCart;
      nextStripeCart = currentStripeCart;
    }

    try {
      const quoteRecommendations = window.__SS_RECOMMENDATIONS__?.quoteRecommendations;
      const storePut = window.__SS_RECOMMENDATIONS__?.__ssRecoDiscountStorePut;
      if (typeof quoteRecommendations === 'function') {
        const reqItems = [];
        const fullByToken = new Map();
        for (const item of (nextFullCart || [])) {
          const tok = String(item?.recoDiscountToken || '').trim();
          if (!tok) continue;
          const pid = String(item?.productId || item?.pid || item?.id || '').trim();
          reqItems.push({ token: tok, productId: pid });
          const bucket = fullByToken.get(tok) || [];
          bucket.push(item);
          fullByToken.set(tok, bucket);
        }

        if (reqItems.length) {
          const quoteData = await quoteRecommendations(reqItems);
          if (quoteData && quoteData.ok && Array.isArray(quoteData.quotes)) {
            const quotesByToken = new Map();
            for (const q of quoteData.quotes) {
              const tok = String(q?.token || '').trim();
              if (tok) quotesByToken.set(tok, q);
            }

            let changed = false;
            for (const [tok, items] of fullByToken.entries()) {
              const q = quotesByToken.get(tok);
              if (!q) continue;

              if (!q.valid) {
                for (const item of items) {
                  const orig = Number(item?.unitPriceOriginalEUR || item?.originalUnitPriceEUR || item?.price || item?.unitPriceEUR || 0) || 0;
                  if (orig > 0) {
                    item.price = orig;
                    item.unitPriceEUR = orig;
                  }
                  delete item.recoDiscountToken;
                  delete item.recoDiscountPct;
                  delete item.unitPriceOriginalEUR;
                  delete item.originalUnitPriceEUR;
                  changed = true;
                }
                continue;
              }

              const nextPct = Number(q?.discountPct || 0) || 0;
              const nextOrig = Number(q?.originalPrice || 0) || 0;
              const nextDisc = Number(q?.discountedPrice || 0) || 0;
              if (!(nextOrig > 0) || !(nextDisc > 0)) continue;

              try {
                if (typeof storePut === 'function') {
                  storePut(tok, {
                    productId: String(q?.productId || items[0]?.productId || '').trim(),
                    discountPct: nextPct,
                    discountedPrice: nextDisc,
                    originalPrice: nextOrig
                  });
                }
              } catch {}

              for (const item of items) {
                if (
                  Number(item?.price || 0) !== nextDisc ||
                  Number(item?.unitPriceEUR || 0) !== nextDisc ||
                  Number(item?.recoDiscountPct || 0) !== nextPct ||
                  Number(item?.unitPriceOriginalEUR || item?.originalUnitPriceEUR || 0) !== nextOrig
                ) {
                  item.price = nextDisc;
                  item.unitPriceEUR = nextDisc;
                  item.recoDiscountPct = nextPct;
                  item.unitPriceOriginalEUR = nextOrig;
                  item.originalUnitPriceEUR = nextOrig;
                  changed = true;
                }
              }
            }

            if (changed) {
              try {
                const rawBasket = JSON.parse(localStorage.getItem('basket') || '{}');
                let basketChanged = false;
                for (const it of Object.values((rawBasket && typeof rawBasket === 'object') ? rawBasket : {})) {
                  const tok = String(it?.recoDiscountToken || '').trim();
                  if (!tok) continue;
                  const q = quotesByToken.get(tok);
                  if (!q) continue;
                  if (!q.valid) {
                    const orig = Number(it?.unitPriceOriginalEUR || it?.originalUnitPriceEUR || it?.price || it?.unitPriceEUR || 0) || 0;
                    if (orig > 0) {
                      it.price = orig;
                      it.unitPriceEUR = orig;
                    }
                    delete it.recoDiscountToken;
                    delete it.recoDiscountPct;
                    delete it.unitPriceOriginalEUR;
                    delete it.originalUnitPriceEUR;
                    basketChanged = true;
                    continue;
                  }

                  const nextPct = Number(q?.discountPct || 0) || 0;
                  const nextOrig = Number(q?.originalPrice || 0) || 0;
                  const nextDisc = Number(q?.discountedPrice || 0) || 0;
                  if (!(nextOrig > 0) || !(nextDisc > 0)) continue;
                  if (
                    Number(it?.price || 0) !== nextDisc ||
                    Number(it?.unitPriceEUR || 0) !== nextDisc ||
                    Number(it?.recoDiscountPct || 0) !== nextPct ||
                    Number(it?.unitPriceOriginalEUR || it?.originalUnitPriceEUR || 0) !== nextOrig
                  ) {
                    it.price = nextDisc;
                    it.unitPriceEUR = nextDisc;
                    it.recoDiscountPct = nextPct;
                    it.unitPriceOriginalEUR = nextOrig;
                    it.originalUnitPriceEUR = nextOrig;
                    basketChanged = true;
                  }
                }
                if (basketChanged) {
                  localStorage.setItem('basket', JSON.stringify(rawBasket));
                  localStorage.setItem('basket_rev', String(Date.now()));
                  try { window.basket = rawBasket; } catch {}
                  try { basket = rawBasket; } catch {}
                }
              } catch {}

              nextStripeCart = (typeof rt.buildStripeSafeCart === 'function')
                ? (rt.buildStripeSafeCart({}, nextFullCart) || nextStripeCart)
                : nextStripeCart;
            }
          }
        }
      }
    } catch {}

    return { fullCart: nextFullCart, stripeCart: nextStripeCart };
  }

  async function createPaymentIntentOnServer({ websiteOrigin, currency, country, fullCart, stripeCart }) {
    let syncedFullCart = Array.isArray(fullCart) ? fullCart : [];
    let syncedStripeCart = Array.isArray(stripeCart) ? stripeCart : [];
    let forcedClientAmountCents = 0;
    for (let attempt = 1; attempt <= 2; attempt++) {
      await window.preloadSettingsData();

      ({ fullCart: syncedFullCart, stripeCart: syncedStripeCart } = await syncRecoDiscountsForCheckout(syncedFullCart, syncedStripeCart));

      const computedExpectedClientTotal = computeExpectedClientTotalForServer(syncedFullCart, currency, country);
      const computedClientAmountCents = Math.round((Number(computedExpectedClientTotal || 0) || 0) * 100);
      const clientAmountCents = (forcedClientAmountCents > 0) ? forcedClientAmountCents : computedClientAmountCents;
      const expectedClientTotal = clientAmountCents / 100;
      const order_summary = buildStripeOrderSummary(syncedStripeCart);

      const fxFetchedAt =
        (typeof window.exchangeRatesFetchedAt !== "undefined" && Number(window.exchangeRatesFetchedAt) > 0)
          ? Number(window.exchangeRatesFetchedAt)
          : null;

      const turnstileToken = await window.snagletGetTurnstileToken({ forceFresh: true });

      const payload = {
        checkoutId: window.latestCheckoutId || null,
        checkoutToken: window.latestCheckoutPublicToken || null,
        websiteOrigin,
        currency,
        country,
        products: syncedStripeCart,
        productsFull: syncedFullCart,
        expectedClientTotal,
        clientAmountCents,
        applyTariff: window.getApplyTariffFlag(),
        metadata: { order_summary },
        fxFetchedAt,
        turnstileToken,
        experiments: (typeof window.__ssGetExperiments === "function" ? window.__ssGetExperiments() : null)
      };

      try {
        window.__LAST_PI_REQUEST__ = payload;
        persistCheckoutDebugSnapshot("__LAST_PI_REQUEST__", redactPiRequestForDebug(payload));
      } catch {}

      let data;
      let status = 200;
      try {
        data = await window.__SS_CHECKOUT_API__.createPaymentIntent(payload);
        try {
          window.__LAST_PI_RESPONSE__ = { status: 200, ok: true, data };
          persistCheckoutDebugSnapshot("__LAST_PI_RESPONSE__", window.__LAST_PI_RESPONSE__);
        } catch {}
        return data;
      } catch (err) {
        data = err?.payload || {};
        status = Number(err?.status || 500) || 500;
        try {
          window.__LAST_PI_RESPONSE__ = { status, ok: false, data };
          persistCheckoutDebugSnapshot("__LAST_PI_RESPONSE__", window.__LAST_PI_RESPONSE__);
        } catch {}
      }

      const code = data?.error || data?.code;

      if (attempt === 1 && (status === 404 || status === 400) && code === "CHECKOUT_NOT_FOUND") {
        try {
          window.latestCheckoutId = null;
          window.latestCheckoutPublicToken = null;
        } catch {}
        continue;
      }

      if (attempt === 1 && status === 401) {
        try {
          window.latestCheckoutId = null;
          window.latestCheckoutPublicToken = null;
        } catch {}
        continue;
      }

      if (status === 409 && attempt === 1 && (code === "FX_SNAPSHOT_NOT_FOUND" || code === "TOTAL_MISMATCH")) {
        if (code === "TOTAL_MISMATCH") {
          const serverAmountCents = Number(data?.serverAmountCents || 0) || 0;
          if (serverAmountCents > 0) {
            forcedClientAmountCents = serverAmountCents;
          }
        }
        await refreshFxSnapshotForCheckoutRetry();
        continue;
      }

      if (status === 409 && code === "FX_SNAPSHOT_NOT_FOUND") {
        const err = new Error(data?.message || "Exchange rate snapshot expired. Please refresh and try again.");
        err.code = "FX_SNAPSHOT_NOT_FOUND";
        err.details = data;
        throw err;
      }

      if (status === 409 && code === "TOTAL_MISMATCH") {
        const err = new Error(data?.message || "Pricing changed. Please refresh and try again.");
        err.code = "TOTAL_MISMATCH";
        err.details = data;
        throw err;
      }

      throw new Error(data?.error || data?.message || `Failed to create payment intent (${status})`);
    }
  }

  function _fnv1a32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  function _getStripePublishableKeyFingerprint() {
    const raw = String(window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE || "").trim();
    if (!raw) return "";
    return _fnv1a32(raw);
  }

  function _stableCartForSig(stripeCart) {
    const items = Array.isArray(stripeCart) ? stripeCart : [];
    const norm = items.map(it => {
      const pid = String(it?.productId ?? it?.id ?? "").trim();
      const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
      const opt = String(it?.selectedOptionId ?? it?.optionId ?? it?.variantId ?? it?.variant ?? it?.option ?? "").trim();
      const sku = String(it?.sku ?? "").trim();
      return { pid, qty, opt, sku };
    }).filter(x => x.pid);
    norm.sort((a, b) => {
      const ak = `${a.pid}|${a.opt}|${a.sku}`;
      const bk = `${b.pid}|${b.opt}|${b.sku}`;
      return ak < bk ? -1 : ak > bk ? 1 : (a.qty - b.qty);
    });
    return norm;
  }

  function _buildPiSig({ currency, country, stripeCart, expectedTotalCents, publishableKeyFingerprint = "" }) {
    const cur = String(currency || "").toUpperCase();
    const cty = String(country || "").toUpperCase();
    const payload = { cur, cty, amt: (Number(expectedTotalCents || 0) || 0), pk: String(publishableKeyFingerprint || ""), items: _stableCartForSig(stripeCart) };
    return `pi_${_fnv1a32(JSON.stringify(payload))}`;
  }

  function _getPiCacheStore() {
    try {
      const raw = sessionStorage.getItem("ss_pi_cache_v1");
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === "object") ? obj : {};
    } catch {
      return (window.__ssPiCacheMem && typeof window.__ssPiCacheMem === "object") ? window.__ssPiCacheMem : {};
    }
  }

  function _setPiCacheStore(obj) {
    try {
      sessionStorage.setItem("ss_pi_cache_v1", JSON.stringify(obj || {}));
    } catch {
      window.__ssPiCacheMem = obj || {};
    }
  }

  function _getCachedPI(sig) {
    const store = _getPiCacheStore();
    const row = store?.[sig];
    if (!row || typeof row !== "object") return null;
    const createdAt = Number(row.createdAt || 0) || 0;
    const ttlMs = Math.max(60_000, Number(window.STRIPE_PI_CACHE_TTL_MS || 30 * 60 * 1000) || (30 * 60 * 1000));
    if (!createdAt || (Date.now() - createdAt) > ttlMs) return null;
    if (!row.clientSecret || !row.paymentIntentId) return null;
    const currentPkFingerprint = _getStripePublishableKeyFingerprint();
    if (currentPkFingerprint && String(row.publishableKeyFingerprint || "") !== currentPkFingerprint) return null;
    const cid = row.checkoutId || null;
    const tok = row.checkoutPublicToken || row.checkoutToken || null;
    if (!cid || !tok) return null;
    if (!row.checkoutPublicToken && row.checkoutToken) row.checkoutPublicToken = row.checkoutToken;
    return row;
  }

  function _putCachedPI(sig, row) {
    const store = _getPiCacheStore();
    store[sig] = { ...(row || {}), createdAt: Date.now() };
    const keys = Object.keys(store);
    if (keys.length > 12) {
      keys.sort((a, b) => Number(store[a]?.createdAt || 0) - Number(store[b]?.createdAt || 0));
      for (let i = 0; i < keys.length - 12; i++) delete store[keys[i]];
    }
    _setPiCacheStore(store);
  }

  function _invalidatePiCache(sig) {
    const store = _getPiCacheStore();
    if (sig && store[sig]) {
      delete store[sig];
      _setPiCacheStore(store);
      return;
    }
    if (!sig) _setPiCacheStore({});
  }

  async function getOrCreatePaymentIntentRecycled({ websiteOrigin, currency, country, fullCart, stripeCart }) {
    await window.preloadSettingsData();
    ({ fullCart, stripeCart } = await syncRecoDiscountsForCheckout(fullCart, stripeCart));
    const expectedClientTotal = computeExpectedClientTotalForServer(fullCart, currency, country);
    const expectedTotalCents = Math.round((Number(expectedClientTotal || 0) || 0) * 100);
    const publishableKeyFingerprint = _getStripePublishableKeyFingerprint();
    const sig = _buildPiSig({ currency, country, stripeCart, expectedTotalCents, publishableKeyFingerprint });

    const cached = _getCachedPI(sig);
    if (cached) {
      return { ...cached, _reused: true, _sig: sig };
    }

    const data = await createPaymentIntentOnServer({ websiteOrigin, currency, country, fullCart, stripeCart });
    if (data && data.free) return { ...data, _reused: false, _sig: sig };

    try {
      _putCachedPI(sig, {
        clientSecret: data?.clientSecret || null,
        paymentIntentId: data?.paymentIntentId || null,
        amountCents: data?.amountCents ?? null,
        currency: data?.currency ?? currency,
        checkoutId: data?.checkoutId ?? null,
        checkoutPublicToken: data?.checkoutPublicToken ?? null,
        publishableKeyFingerprint
      });
    } catch {}

    return { ...data, _reused: false, _sig: sig };
  }

  window.__SS_CHECKOUT_HELPERS__ = {
    computeExpectedClientTotalForServer,
    buildStripeOrderSummary,
    createPaymentIntentOnServer,
    getOrCreatePaymentIntentRecycled,
    _invalidatePiCache
  };
})(window);
