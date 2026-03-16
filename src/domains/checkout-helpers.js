(function (window) {
  function computeExpectedClientTotalForServer(fullCart, currency, countryCode) {
    const cur = String(currency || "EUR").toUpperCase();
    const cc = String(countryCode || "").toUpperCase();

    const baseEUR = (fullCart || []).reduce((sum, i) => {
      const qty = Math.max(1, parseInt(i?.quantity ?? 1, 10) || 1);
      const unit = window.__ssParsePriceEUR(i?.unitPriceEUR ?? i?.price ?? 0);
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

  async function createPaymentIntentOnServer({ websiteOrigin, currency, country, fullCart, stripeCart }) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      await window.preloadSettingsData();

      const expectedClientTotal = computeExpectedClientTotalForServer(fullCart, currency, country);
      const order_summary = buildStripeOrderSummary(stripeCart);

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
        products: stripeCart,
        productsFull: fullCart,
        expectedClientTotal,
        applyTariff: window.getApplyTariffFlag(),
        metadata: { order_summary },
        fxFetchedAt,
        turnstileToken,
        experiments: (typeof window.__ssGetExperiments === "function" ? window.__ssGetExperiments() : null)
      };

      try {
        window.__LAST_PI_REQUEST__ = payload;
        localStorage.setItem("__LAST_PI_REQUEST__", JSON.stringify(payload));
      } catch {}

      let data;
      let status = 200;
      try {
        data = await window.__SS_CHECKOUT_API__.createPaymentIntent(payload);
        try {
          window.__LAST_PI_RESPONSE__ = { status: 200, ok: true, data };
          localStorage.setItem("__LAST_PI_RESPONSE__", JSON.stringify(window.__LAST_PI_RESPONSE__));
        } catch {}
        return data;
      } catch (err) {
        data = err?.payload || {};
        status = Number(err?.status || 500) || 500;
        try {
          window.__LAST_PI_RESPONSE__ = { status, ok: false, data };
          localStorage.setItem("__LAST_PI_RESPONSE__", JSON.stringify(window.__LAST_PI_RESPONSE__));
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
        try { localStorage.removeItem(window.SETTINGS_CACHE_KEY || 'snaglet_settings_cache'); } catch {}
        window.exchangeRatesFetchedAt = 0;
        try { window._preloadSettingsPromise = null; } catch {}
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

  function _buildPiSig({ currency, country, stripeCart, expectedTotalCents }) {
    const cur = String(currency || "").toUpperCase();
    const cty = String(country || "").toUpperCase();
    const payload = { cur, cty, amt: (Number(expectedTotalCents || 0) || 0), items: _stableCartForSig(stripeCart) };
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

  async function getOrCreatePaymentIntentRecycled({ websiteOrigin, currency, country, fullCart, stripeCart }) {
    await window.preloadSettingsData();
    const expectedClientTotal = computeExpectedClientTotalForServer(fullCart, currency, country);
    const expectedTotalCents = Math.round((Number(expectedClientTotal || 0) || 0) * 100);
    const sig = _buildPiSig({ currency, country, stripeCart, expectedTotalCents });

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
        checkoutPublicToken: data?.checkoutPublicToken ?? null
      });
    } catch {}

    return { ...data, _reused: false, _sig: sig };
  }

  window.__SS_CHECKOUT_HELPERS__ = {
    computeExpectedClientTotalForServer,
    buildStripeOrderSummary,
    createPaymentIntentOnServer,
    getOrCreatePaymentIntentRecycled
  };
})(window);
