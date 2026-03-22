(function (window, document) {
  function __ssEscHtml(input) {
    const s = String(input ?? "");
    return s.replace(/[&<>"'`]/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "`": "&#96;"
    }[ch] || ch));
  }

  function __ssParseMaybeJson(value) {
    if (typeof value !== "string") return value;
    const s = value.trim();
    if (!s) return value;
    if (!(s.startsWith("{") || s.startsWith("["))) return value;
    try { return JSON.parse(s); } catch { return value; }
  }

  function __ssParseLoosePrice(value) {
    try {
      if (typeof window.__ssParsePriceEUR === "function") return window.__ssParsePriceEUR(value);
    } catch {}
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;
    let s = value.trim();
    if (!s) return 0;
    s = s.replace(/[^0-9,.\-]/g, "");
    if (!s) return 0;
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");
    if (hasComma && hasDot) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(/,/g, ".");
      else s = s.replace(/,/g, "");
    } else if (hasComma) {
      s = s.replace(/,/g, ".");
    }
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function __ssGetCatalogFlat() {
    try {
      if (Array.isArray(window.productsFlatFromServer) && window.productsFlatFromServer.length) return window.productsFlatFromServer;
      const base = (typeof window.products !== 'undefined' && window.products) ? window.products :
        ((typeof window.productsDatabase !== 'undefined' && window.productsDatabase) ? window.productsDatabase : (window.products || {}));
      return Object.values(base || {}).flat();
    } catch {
      return [];
    }
  }

  function __ssExtractOptionGroups(product) {
    const p = product || {};
    const optionGroups = __ssParseMaybeJson(p.optionGroups);
    if (Array.isArray(optionGroups) && optionGroups.length) {
      return optionGroups.map((g, idx) => {
        const label = String(g?.label ?? g?.name ?? `Option ${idx + 1}`).trim().replace(/:$/, "");
        const options = Array.isArray(g?.options) ? g.options.map(x => String(x).trim()).filter(Boolean) : [];
        const imageByOptionRaw = __ssParseMaybeJson(g?.imageByOption);
        const imageByOption = (imageByOptionRaw && typeof imageByOptionRaw === "object" && !Array.isArray(imageByOptionRaw)) ? imageByOptionRaw : null;
        const key = String(g?.key ?? label.toLowerCase().replace(/\s+/g, "_") ?? `opt${idx + 1}`);
        return { key, label, options, imageByOption };
      }).filter(g => g.options.length > 0);
    }
    const groups = [];
    for (let i = 1; i <= 10; i++) {
      const k = (i === 1) ? "productOptions" : `productOptions${i}`;
      const arr = __ssParseMaybeJson(p[k]);
      if (!Array.isArray(arr) || arr.length < 2) continue;
      const [labelRaw, ...optsRaw] = arr;
      const label = String(labelRaw ?? `Option ${i}`).trim().replace(/:$/, "");
      const options = optsRaw.map(x => String(x).trim()).filter(Boolean);
      if (!options.length) continue;
      const mapRaw = (i === 1) ? (p.productOptionImageMap || p.productOptionImageMap1 || null) : (p[`productOptionImageMap${i}`] || null);
      const map = __ssParseMaybeJson(mapRaw);
      groups.push({ key: label.toLowerCase().replace(/\s+/g, "_") || `opt${i}`, label, options, imageByOption: (map && typeof map === "object" && !Array.isArray(map)) ? map : null });
    }
    return groups;
  }

  function __ssNormalizeSelectedOptions(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const x of raw) {
      const label = String(x?.label ?? "").trim().replace(/:$/, "");
      const value = String(x?.value ?? "").trim();
      if (!label || !value) continue;
      out.push({ label, value });
      if (out.length >= 10) break;
    }
    return out;
  }

  function __ssDefaultSelectedOptions(groups) {
    return (groups || []).map(g => ({ label: String(g.label || "Option").trim().replace(/:$/, ""), value: String(g.options?.[0] ?? "").trim() })).filter(o => o.label && o.value);
  }

  function __ssFormatSelectedOptionsDisplay(selectedOptions) {
    return __ssNormalizeSelectedOptions(selectedOptions).map(o => `${o.label}: ${o.value}`).join(", ");
  }

  function __ssFormatSelectedOptionsKey(selectedOptions) {
    return __ssNormalizeSelectedOptions(selectedOptions).map(o => `${o.label}=${o.value}`).join(" | ");
  }

  function __ssCollectPositivePrice(out, value) {
    const num = __ssParseLoosePrice(value);
    if (Number.isFinite(num) && num > 0) out.push(num);
  }

  function __ssCollectNestedPriceCandidates(out, value, depth = 0, seen = null) {
    if (depth > 6 || value == null) return;
    value = __ssParseMaybeJson(value);
    if (Array.isArray(value)) {
      value.forEach((entry) => __ssCollectNestedPriceCandidates(out, entry, depth + 1, seen));
      return;
    }
    if (typeof value === "object") {
      if (typeof WeakSet !== "undefined") {
        seen = seen || new WeakSet();
        if (seen.has(value)) return;
        seen.add(value);
      }
      __ssCollectPositivePrice(out, value.price);
      __ssCollectPositivePrice(out, value.priceEUR);
      __ssCollectPositivePrice(out, value.basePrice);
      __ssCollectPositivePrice(out, value.sellPrice);
      __ssCollectPositivePrice(out, value.priceB);
      __ssCollectPositivePrice(out, value.addPrice);
      Object.values(value).forEach((entry) => __ssCollectNestedPriceCandidates(out, entry, depth + 1, seen));
      return;
    }
    __ssCollectPositivePrice(out, value);
  }

  function __ssResolvePositivePriceCandidate(value) {
    const prices = [];
    __ssCollectNestedPriceCandidates(prices, value);
    return prices.length ? window.__ssRound2(Math.min(...prices)) : 0;
  }

  function __ssCollectPositivePriceMap(out, map) {
    __ssCollectNestedPriceCandidates(out, map);
  }

  function __ssCollectPositivePriceArray(out, list) {
    __ssCollectNestedPriceCandidates(out, list);
  }

  function __ssInferBasePriceEUR(product, preferB = false) {
    const prices = [];
    const variantPrices = __ssParseMaybeJson(product?.variantPrices);
    const variantPricesB = __ssParseMaybeJson(product?.variantPricesB);
    if (preferB) {
      __ssCollectPositivePrice(prices, product?.priceB);
      __ssCollectPositivePriceMap(prices, variantPricesB);
    } else {
      __ssCollectPositivePrice(prices, product?.price);
      __ssCollectPositivePrice(prices, product?.priceEUR);
      __ssCollectPositivePrice(prices, product?.basePrice);
      __ssCollectPositivePrice(prices, product?.sellPrice);
      __ssCollectPositivePriceMap(prices, variantPrices);
    }
    __ssCollectPositivePriceArray(prices, __ssParseMaybeJson(product?.variants));
    __ssCollectPositivePriceArray(prices, __ssParseMaybeJson(product?.options));
    if (!prices.length && preferB) return __ssInferBasePriceEUR(product, false);
    return prices.length ? window.__ssRound2(Math.min(...prices)) : 0;
  }

  function __ssResolveVariantPriceEUR(product, selectedOptions, legacySelectedOption = "") {
    const ex = (typeof window.__ssGetExperiments === "function") ? window.__ssGetExperiments() : null;
    const useB = ex && String(ex.pr || "").toUpperCase() === "B";
    const baseA = __ssInferBasePriceEUR(product, false);
    const baseB = __ssInferBasePriceEUR(product, true);
    const base = (useB && Number.isFinite(baseB) && baseB > 0) ? baseB : baseA;
    const mapA = (product && typeof product === "object") ? __ssParseMaybeJson(product.variantPrices) : null;
    const mapB = (product && typeof product === "object") ? __ssParseMaybeJson(product.variantPricesB) : null;
    const map = (useB && mapB && typeof mapB === "object" && !Array.isArray(mapB)) ? mapB : mapA;
    if (!map || typeof map !== "object" || Array.isArray(map)) return window.__ssRound2(base);
    const sel = __ssNormalizeSelectedOptions(selectedOptions || []);
    const candidates = [];
    const fullKey = sel.length ? __ssFormatSelectedOptionsKey(sel) : "";
    if (fullKey) candidates.push(fullKey);
    if (sel.length) {
      const vOnly = sel.map(o => String(o.value || "").trim()).filter(Boolean).join(" | ");
      if (vOnly && vOnly !== fullKey) candidates.push(vOnly);
    }
    if (sel.length === 1) {
      const l = String(sel[0].label || "").trim();
      const v = String(sel[0].value || "").trim();
      if (l && v) candidates.push(`${l}=${v}`);
      if (v) candidates.push(v);
    }
    const legacy = String(legacySelectedOption || "").trim();
    if (legacy) candidates.push(legacy);
    for (const k of candidates) {
      const num = __ssResolvePositivePriceCandidate(map[String(k || "").trim()]);
      if (Number.isFinite(num) && num > 0) return window.__ssRound2(num);
    }
    return window.__ssRound2(base);
  }

  function __ssCleanOptionLabel(label) {
    return String(label ?? "").trim().replace(/\s*[:\-–—]\s*$/, "");
  }

  function __ssEnsureOptionChipStyles() {
    if (document.getElementById("__ss-option-chip-styles")) return;
    const style = document.createElement("style");
    style.id = "__ss-option-chip-styles";
    style.textContent = `
  .BasketSelectedOption{display:none !important;}
  .Basket-Item,.Basket_Item_Container{aspect-ratio:auto !important;}
  .Basket-Item{width:min(1000px,100%) !important;max-width:2000px !important;align-items:flex-start !important;padding:16px 18px !important;gap:18px !important;}
  .Basket_Item_Container{width:min(1000px,100%) !important;max-width:2000px !important;}
  .BasketTitle{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .BasketTextDescription{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
  .Quantity-Controls-Basket .BasketChangeQuantityButton:hover{background:rgba(0,0,0,0.06);}
  .Quantity-Controls-Basket .BasketChangeQuantityText{font-family:'Afacad',sans-serif;font-size:20px;line-height:1;margin:0;padding:0;min-width:1.5em;text-align:center;}
  .BasketOptionChips{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start;align-items:flex-start;}
  .BasketOptionChip{display:inline-flex;align-items:center;padding:6px 12px;border-radius:9999px;background:rgba(0,0,0,0.045);white-space:nowrap;font-family:'Afacad',sans-serif;font-size:16px;}
  .Basket-Item-Pay{display:block !important;width:min(1000px,100%) !important;}
  .ReceiptTable{width:100% !important;border-collapse:collapse;}
  .ReceiptTable td{vertical-align:top;padding:6px 8px;}
  .ReceiptItemName{display:block;}
  .ReceiptOptionChips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;}
  .ReceiptOptionChips .BasketOptionChip{padding:5px 10px;font-size:15px;}
  @media (max-width: 700px){
    .Quantity-Controls-Basket .BasketChangeQuantityButton{width:38px;height:38px;font-size:22px;}
    .Quantity-Controls-Basket .BasketChangeQuantityText{font-size:18px;}
    .Basket-Item{padding:12px 12px !important;gap:12px !important;}
    .BasketOptionChip{font-size:14px;padding:5px 10px;}
    .BasketTextDescription{-webkit-line-clamp:2;}
    .ReceiptOptionChips .BasketOptionChip{font-size:13px;}
  }`;
    document.head.appendChild(style);
  }

  function __ssGetSelectedOptionsForDisplay(item, product) {
    const multi = __ssNormalizeSelectedOptions(item?.selectedOptions || []);
    const out = [];
    if (multi.length) {
      multi.forEach(o => {
        const label = __ssCleanOptionLabel(o.label || o.key || "Option");
        const value = String(o.value ?? "").trim();
        if (!value) return;
        out.push({ label, value });
      });
      return out;
    }
    if (item?.selectedOption) {
      let label = "Option";
      if (product?.optionGroups && Array.isArray(product.optionGroups) && product.optionGroups.length && product.optionGroups[0]?.label) label = product.optionGroups[0].label;
      else if (product?.productOptions && product.productOptions.length > 1) label = product.productOptions[0];
      label = __ssCleanOptionLabel(label);
      const value = String(item.selectedOption ?? "").trim();
      if (value) out.push({ label, value });
    }
    return out;
  }

  function __ssBuildOptionChipsHTML(displayOptions, isReceipt) {
    if (!Array.isArray(displayOptions) || displayOptions.length === 0) return "";
    const cls = isReceipt ? "BasketOptionChips ReceiptOptionChips" : "BasketOptionChips";
    return `<div class="${cls}">` + displayOptions.map(o => {
      const label = __ssEscHtml(__ssCleanOptionLabel(o.label || "Option"));
      const value = __ssEscHtml(String(o.value ?? "").trim());
      return `<span class="BasketOptionChip">${label}: ${value}</span>`;
    }).join("") + `</div>`;
  }

  function __ssApplyOptionImageMapping(group, optionValue, validImages) {
    const rawMap = __ssParseMaybeJson(group?.imageByOption);
    const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : null;
    if (!map) return false;
    const mapped = map[optionValue];
    if (mapped === undefined || mapped === null || mapped === "") return false;
    const imgs = Array.isArray(validImages) ? validImages : (window.currentProductImages || []);
    const main = document.getElementById("mainImage");
    if (typeof mapped === "number" && Number.isFinite(mapped)) {
      const idx = Math.max(0, Math.min(imgs.length - 1, Math.floor(mapped)));
      if (imgs[idx]) {
        window.currentIndex = idx;
        if (typeof window.updateImage === 'function') window.updateImage();
        return true;
      }
      return false;
    }
    const url = String(mapped).trim();
    if (!url) return false;
    const idx = imgs.indexOf(url);
    if (idx !== -1) {
      window.currentIndex = idx;
      if (typeof window.updateImage === 'function') window.updateImage();
      return true;
    }
    if (main) {
      main.src = url;
      return true;
    }
    return false;
  }

  function __ssSetSelectedOptions(sel) {
    const norm = __ssNormalizeSelectedOptions(sel);
    window.selectedProductOptions = norm;
    window.selectedProductOption = norm?.[0]?.value || "";
  }

  function __ssGetSelectedOptions() {
    return __ssNormalizeSelectedOptions(window.selectedProductOptions || []);
  }

  window.__SS_PRODUCT_OPTIONS__ = {
    __ssEscHtml,
    __ssGetCatalogFlat,
    __ssExtractOptionGroups,
    __ssNormalizeSelectedOptions,
    __ssDefaultSelectedOptions,
    __ssFormatSelectedOptionsDisplay,
    __ssFormatSelectedOptionsKey,
    __ssInferBasePriceEUR,
    __ssResolveVariantPriceEUR,
    __ssCleanOptionLabel,
    __ssEnsureOptionChipStyles,
    __ssGetSelectedOptionsForDisplay,
    __ssBuildOptionChipsHTML,
    __ssApplyOptionImageMapping,
    __ssSetSelectedOptions,
    __ssGetSelectedOptions,
  };
})(window, document);
