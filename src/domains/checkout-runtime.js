(function (window, document) {
  'use strict';

  function valById(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function collectUserDetails() {
    const v = valById;
    const name = v('Name');
    const surname = v('Surname');
    const email = v('email');
    const street = v('Street');
    const city = v('City');
    const postalCode = v('Postal_Code');
    const country = v('Country');
    const phone = v('Phone');
    const region = v('State') || v('Region');
    const address2 = v('AddressLine2');
    const orderNote = v('OrderNote');
    return { name, surname, email, phone, street, address2, city, region, postalCode, country, orderNote };
  }

  function getApiBase(ctx = {}) {
    const apiBase = ctx.API_BASE;
    return (typeof apiBase !== 'undefined' && apiBase) ? apiBase : '';
  }

  function parseCheckoutPriceEUR(v) {
    try {
      if (typeof window.__ssParsePriceEUR === 'function') {
        return Number(window.__ssParsePriceEUR(v) || 0) || 0;
      }
    } catch {}
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^0-9,.-]/g, '').replace(',', '.');
      const num = Number.parseFloat(cleaned);
      return Number.isFinite(num) ? num : 0;
    }
    return 0;
  }

  function resolveCheckoutUnitPriceEUR(item) {
    const it = item || {};
    const token = String(it?.recoDiscountToken || it?.discountToken || '').trim();
    const pid = String(it?.productId || it?.pid || it?.id || '').trim();
    const priceNow = parseCheckoutPriceEUR(it?.price);
    const unitStored = parseCheckoutPriceEUR(it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price);
    const orig = parseCheckoutPriceEUR(
      it?.unitPriceOriginalEUR ??
      it?.originalUnitPriceEUR ??
      it?.compareAtPriceEUR ??
      it?.originalPriceEUR ??
      it?.originalPriceEur
    );
    const pct = Number(it?.recoDiscountPct || it?.discountPct || 0) || 0;

    if (token) {
      try {
        const storeGet = window.__SS_RECOMMENDATIONS__?.__ssRecoDiscountStoreGet;
        const entry = (typeof storeGet === 'function') ? storeGet(token) : null;
        const entryPid = String(entry?.productId || '').trim();
        const entryMatches = !pid || !entryPid || entryPid === pid;
        const discountedStored = parseCheckoutPriceEUR(entry?.discountedPrice);
        if (entryMatches && discountedStored > 0) return round2(discountedStored);
      } catch {}

      if (orig > 0 && priceNow > 0 && priceNow < (orig - 1e-9)) return round2(priceNow);
      if (orig > 0 && unitStored > 0 && unitStored < (orig - 1e-9)) return round2(unitStored);

      const base = orig > 0 ? orig : Math.max(unitStored, priceNow, 0);
      if (pct > 0 && base > 0) {
        const discounted = round2(base * (1 - (pct / 100)));
        if (discounted > 0) return discounted;
      }
    }

    return round2(priceNow || unitStored || 0);
  }

  function buildStripeSafeCart(ctx = {}, fullCart) {
    const normalizeSelectedOptions = ctx.normalizeSelectedOptions || ((v) => Array.isArray(v) ? v : []);
    const resolveUnitPrice = ctx.resolveCheckoutUnitPriceEUR || resolveCheckoutUnitPriceEUR;
    return (fullCart || []).map((i) => {
      const out = {
        name: i.name,
        quantity: i.quantity,
        productId: i.productId || '',
        price: resolveUnitPrice(i),
        selectedOption: i.selectedOption || '',
        selectedOptions: normalizeSelectedOptions(i.selectedOptions || []),
        recoDiscountToken: i.recoDiscountToken || ''
      };
      if (i.productId) out.productId = String(i.productId).trim();
      if (i.productLink) out.productLink = String(i.productLink).trim();
      return out;
    });
  }

  function buildFullCartFromBasketObject(basketObj) {
    try {
      const resolveUnitPrice = resolveCheckoutUnitPriceEUR;
      const items = Object.values(basketObj || {});
      return items.map(it => {
        const out = { ...it };
        out.productId = it?.productId || it?.id || it?.pid || '';
        out.quantity = it?.quantity ?? it?.qty ?? 1;
        if (out.unitPriceOriginalEUR == null) {
          out.unitPriceOriginalEUR = it?.unitPriceOriginalEUR ?? it?.originalUnitPriceEUR ?? it?.compareAtPriceEUR ?? it?.originalPriceEUR ?? it?.originalPriceEur ?? 0;
        }
        if (out.originalUnitPriceEUR == null) out.originalUnitPriceEUR = out.unitPriceOriginalEUR ?? 0;
        out.unitPriceEUR = resolveUnitPrice(out);
        out.price = out.unitPriceEUR;
        return out;
      });
    } catch {
      return [];
    }
  }

  function buildFullCartFromBasket(ctx = {}) {
    const basketObj = (typeof ctx.readBasket === 'function') ? ctx.readBasket() : (() => {
      try { return JSON.parse(localStorage.getItem('basket') || '{}'); } catch { return {}; }
    })();

    const items = Object.values(basketObj || {});
    ctx.ensureContributionProducts?.();
    const contributionCache = ctx.getContributionCache?.() || {};
    const catalogFlat = Array.isArray(ctx.getCatalogFlat?.()) ? ctx.getCatalogFlat() : [];
    const contributionFlat = Array.isArray(contributionCache.items) && contributionCache.items.length
      ? contributionCache.items.map(x => ({
          name: x.name,
          price: x.price,
          unitPriceEUR: x.unitPriceEUR ?? x.price,
          images: x.images || [],
          productLink: x.productLink || '',
          productId: x.productId || x.id || '',
          expectedPurchasePrice: x.expectedPurchasePrice || 0,
          description: x.description || '',
          image: x.image || (Array.isArray(x.images) ? (x.images[0] || '') : '')
        }))
      : [];
    const flat = catalogFlat.length
      ? catalogFlat.concat(contributionFlat.filter((item) => {
          const pid = String(item?.productId || '').trim();
          if (pid && catalogFlat.some((prod) => String(prod?.productId || '').trim() === pid)) return false;
          const link = String(item?.productLink || '').trim();
          if (link && catalogFlat.some((prod) => String(prod?.productLink || '').trim() === link)) return false;
          return true;
        }))
      : contributionFlat;

    const normalizeSelectedOptions = ctx.normalizeSelectedOptions || ((v) => Array.isArray(v) ? v : []);
    const resolveVariantPriceEUR = ctx.resolveVariantPriceEUR || (() => 0);
    const canonicalizeProductLink = ctx.canonicalizeProductLink || ((v) => String(v || ''));
    const resolveUnitPrice = ctx.resolveCheckoutUnitPriceEUR || resolveCheckoutUnitPriceEUR;

    return items
      .map((item) => {
        const qty = Math.max(1, parseInt(item?.quantity ?? 1, 10) || 1);
        const sel = normalizeSelectedOptions(item?.selectedOptions || []);
        const legacySel = String(item?.selectedOption || '').trim();
        const pid = String(item?.productId || '').trim();
        const canon = canonicalizeProductLink(item?.productLink || '');
        const prod =
          (pid ? flat.find(p => String(p?.productId || '').trim() === pid) : null) ||
          (canon ? flat.find(p => canonicalizeProductLink(p?.productLink || '') === canon) : null) ||
          (item?.name ? flat.find(p => String(p?.name || '').trim() === String(item.name).trim()) : null) ||
          null;

        const unitEURFromBasket = resolveUnitPrice(item);
        const unitEUR = Number((unitEURFromBasket || resolveVariantPriceEUR(prod || {}, sel, legacySel) || 0).toFixed(2));
        const expectedFromBasket = Number(parseFloat(item?.expectedPurchasePrice ?? 0) || 0);
        const expectedFromProd = Number(parseFloat(prod?.expectedPurchasePrice ?? 0) || 0);
        const expected = Number(((expectedFromProd || expectedFromBasket || unitEUR) || 0).toFixed(2));

        const out = {
          name: String(item?.name || prod?.name || '').slice(0, 120),
          productId: String(item?.productId || '').slice(0, 80),
          quantity: qty,
          unitPriceEUR: unitEUR,
          recoDiscountToken: String(item?.recoDiscountToken || '').slice(0, 500),
          recoDiscountPct: Number(item?.recoDiscountPct || 0) || 0,
          unitPriceOriginalEUR: (item?.unitPriceOriginalEUR != null ? Number(item.unitPriceOriginalEUR) : null),
          price: unitEUR,
          expectedPurchasePrice: expected,
          productLink: String(item?.productLink || prod?.productLink || 'N/A').slice(0, 800),
          image: String(item?.image || prod?.image || '').slice(0, 800),
          description: String(item?.description || prod?.description || '').slice(0, 2000)
        };

        const outPid = String(pid || prod?.productId || '').trim();
        if (outPid) out.productId = outPid;
        if (legacySel) out.selectedOption = String(legacySel).slice(0, 120);
        if (sel.length) out.selectedOptions = sel;
        return out;
      })
      .filter((x) => x && x.name && x.quantity > 0);
  }

  function getFullCartPreferred(ctx = {}) {
    try {
      const preservedBuilder = ctx.getPreservedBuilder?.();
      const fromBuilder = typeof preservedBuilder === 'function' ? preservedBuilder() : [];
      if (Array.isArray(fromBuilder) && fromBuilder.length) return fromBuilder;
    } catch {}

    try {
      const basket = ctx.getBasket?.();
      if (basket && typeof basket === 'object' && Object.keys(basket).length) {
        const out = buildFullCartFromBasketObject(basket);
        if (out.length) return out;
      }
    } catch {}

    try {
      if (typeof ctx.readBasket === 'function') {
        const out = buildFullCartFromBasketObject(ctx.readBasket());
        if (out.length) return out;
      }
    } catch {}

    return [];
  }

  function getSelectedCountryCode() {
    const v =
      document.getElementById('countrySelect')?.value ||
      localStorage.getItem('detectedCountry') ||
      'US';
    return String(v).trim().toUpperCase();
  }

  function getApplyTariffFlag(ctx = {}) {
    if (typeof ctx.serverApplyTariff === 'boolean') return ctx.serverApplyTariff;
    const v = localStorage.getItem('applyTariff');
    if (v == null) return true;
    return v === 'true';
  }

  function round2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round(x * 100) / 100;
  }

  window.__SS_CHECKOUT_RUNTIME__ = {
    valById,
    collectUserDetails,
    getApiBase,
    buildStripeSafeCart,
    buildFullCartFromBasket,
    buildFullCartFromBasketObject,
    resolveCheckoutUnitPriceEUR,
    getFullCartPreferred,
    getSelectedCountryCode,
    getApplyTariffFlag,
    round2
  };
})(window, document);
