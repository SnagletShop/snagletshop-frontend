(function (window, document) {
let __ssSmartCartRecoCache = { sig: "", desired: 0, token: "", items: [] };
let __ssSmartRecoRerenderTimer = null;
let __ssBasketRenderInProgress = false;
let __ssBasketNeedsRerender = false;
let __ssBasketRerenderQueued = false;
let __ssContributionCache = { at: 0, items: null };
let __ssAddonPoolSortedCache = { src: "", ref: null, len: 0, sorted: [] };
window.__ssSmartCartRecoCache = window.__ssSmartCartRecoCache || __ssSmartCartRecoCache;
window.__ssSmartRecoRerenderTimer = window.__ssSmartRecoRerenderTimer || __ssSmartRecoRerenderTimer;
window.__ssBasketRenderInProgress = !!window.__ssBasketRenderInProgress;
window.__ssBasketNeedsRerender = !!window.__ssBasketNeedsRerender;
window.__ssBasketRerenderQueued = !!window.__ssBasketRerenderQueued;
window.__ssContributionCache = window.__ssContributionCache || __ssContributionCache;
window.__ssAddonPoolSortedCache = window.__ssAddonPoolSortedCache || __ssAddonPoolSortedCache;

function __ssGetCartIncentivesConfig() {
  const cfg = window?.preloadedData?.storefrontConfig?.cartIncentives;
  if (cfg && typeof cfg === "object") return cfg;
  return {
    enabled: true,
    freeShipping: { enabled: false, thresholdEUR: 0, shippingFeeEUR: 0 },
    tierDiscount: { enabled: true, applyToDiscountedItems: false, tiers: [{ minEUR: 25, pct: 3 }, { minEUR: 40, pct: 6 }, { minEUR: 60, pct: 10 }] },
    bundles: { enabled: false, bundles: [] }
  };
}
function __ssDbgTierEnabled() { try { return localStorage.getItem('ss_debug_tier') === '1'; } catch { return false; } }
function __ssTierDbgGroup(label, fn) {
  if (!__ssDbgTierEnabled()) return fn(0);
  const runId = (window.__ssTierDbgRunId = (window.__ssTierDbgRunId || 0) + 1);
  console.groupCollapsed(`[tier][dbg] ${label} #${runId}`);
  try { return fn(runId); } catch (e) { console.error('[tier][dbg] ERROR', e); throw e; } finally { console.groupEnd(); }
}
function __ssRequestBasketRerender() {
  try {
    if (__ssBasketRenderInProgress) { __ssBasketNeedsRerender = true; return; }
    if (__ssBasketRerenderQueued) return;
    __ssBasketRerenderQueued = true;
    setTimeout(() => { __ssBasketRerenderQueued = false; try { if (typeof updateBasket === 'function') updateBasket(); } catch {} }, 0);
  } catch {}
}
function __ssParsePriceEUR(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  let s = v.trim(); if (!s) return 0;
  s = s.replace(/[^0-9,\.\-]/g, ""); if (!s) return 0;
  const hasComma = s.indexOf(",") >= 0; const hasDot = s.indexOf(".") >= 0;
  if (hasComma && hasDot) { if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(/,/g, "."); else s = s.replace(/,/g, ""); }
  else if (hasComma && !hasDot) s = s.replace(/,/g, ".");
  const n = parseFloat(s); return Number.isFinite(n) ? n : 0;
}
function __ssComputeCartIncentivesClient(baseTotalEUR, fullCart) {
  if (window.__ssComputingIncentives) return window.__ssLastIncentives || null;
  window.__ssComputingIncentives = true;
  try {
    const cfg = __ssGetCartIncentivesConfig();
    const enabled = !!cfg?.enabled;
    const out = { enabled, baseTotalEUR: round2(baseTotalEUR), tierPct: 0, tierDiscountEUR: 0, bundlePct: 0, bundleDiscountEUR: 0, shippingFeeEUR: 0, freeShippingEligible: false, subtotalAfterDiscountsEUR: round2(baseTotalEUR), totalWithShippingEUR: round2(baseTotalEUR) };
    if (!enabled) return out;
    let subtotal = Number(baseTotalEUR) || 0;
    let tierEligibleSubtotal = 0;
    const items = Array.isArray(fullCart) ? fullCart : [];
    const __tierDiscMap = {};
    for (const it of items) {
      const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
      const unit = __ssParsePriceEUR(it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? 0);
      const line = unit * qty; if (!(line > 0)) continue;
      const recoPct = Number(it?.recoDiscountPct || 0) || 0;
      const hasTok = !!it?.recoDiscountToken;
      const u0 = __ssParsePriceEUR(it?.unitPriceOriginalEUR ?? it?.unitPriceOriginalEur ?? it?.originalUnitPriceEUR ?? it?.compareAtPriceEUR ?? NaN);
      const u1 = __ssParsePriceEUR(it?.unitPriceEUR ?? it?.priceEUR ?? it?.priceEur ?? it?.unitPrice ?? it?.price ?? NaN);
      const looksDiscounted = (Number.isFinite(u0) && Number.isFinite(u1) && u0 > u1 + 1e-9);
      const isDiscountedItem = (recoPct > 0) || hasTok || looksDiscounted;
      try {
        const __pid = String(it?.productId || it?.pid || it?.id || '').trim();
        if (__pid) __tierDiscMap[__pid] = (__tierDiscMap[__pid] || false) || !!isDiscountedItem;
        window.__ssTierDiscMap = __tierDiscMap;
      } catch {}
      if (!isDiscountedItem) tierEligibleSubtotal += line;
    }
    const bcfg = cfg?.bundles;
    if (bcfg?.enabled && Array.isArray(bcfg?.bundles) && bcfg.bundles.length) {
      const ids = new Set(items.map(i => String(i?.productId || "").trim()).filter(Boolean));
      let best = null;
      for (const b of bcfg.bundles) {
        const pids = Array.isArray(b?.productIds) ? b.productIds.map(x => String(x || "").trim()).filter(Boolean) : [];
        if (pids.length < 2) continue;
        if (!pids.every(pid => ids.has(pid))) continue;
        const pct = Math.max(0, Math.min(80, Number(b?.pct || 0) || 0));
        if (!best || pct > best.pct) best = { pct };
      }
      if (best && best.pct > 0) {
        out.bundlePct = best.pct; out.bundleDiscountEUR = round2(subtotal * (best.pct / 100)); subtotal -= out.bundleDiscountEUR;
        if (tierEligibleSubtotal > 0) tierEligibleSubtotal *= (1 - (best.pct / 100));
      }
    }
    const tcfg = cfg?.tierDiscount;
    if (tcfg?.enabled && Array.isArray(tcfg?.tiers) && tcfg.tiers.length) {
      let pct = 0;
      for (const t of tcfg.tiers) { const min = Math.max(0, Number(t?.minEUR || 0) || 0); const p = Math.max(0, Math.min(80, Number(t?.pct || 0) || 0)); if (min > 0 && p > 0 && subtotal >= min) pct = Math.max(pct, p); }
      out.tierPct = pct;
      const applyToDiscounted = (tcfg?.applyToDiscountedItems === true);
      const tierBase = applyToDiscounted ? subtotal : Math.max(0, Number(tierEligibleSubtotal) || 0);
      out.tierDiscountEUR = pct > 0 ? round2(tierBase * (pct / 100)) : 0;
      subtotal -= out.tierDiscountEUR;
    }
    subtotal = Math.max(0, round2(subtotal));
    out.subtotalAfterDiscountsEUR = subtotal;
    const ship = cfg?.freeShipping; const enabledShip = !!ship?.enabled; const fee = Math.max(0, Number(ship?.shippingFeeEUR || 0) || 0); const thr = Math.max(0, Number(ship?.thresholdEUR || 0) || 0);
    if (enabledShip && fee > 0 && thr > 0) { out.freeShippingEligible = subtotal >= thr; out.shippingFeeEUR = out.freeShippingEligible ? 0 : round2(fee); out.totalWithShippingEUR = round2(subtotal + out.shippingFeeEUR); }
    else { out.freeShippingEligible = true; out.shippingFeeEUR = 0; out.totalWithShippingEUR = subtotal; }
    window.__ssLastIncentives = out;
    return out;
  } finally { window.__ssComputingIncentives = false; }
}
function __ssEnsureCartIncentiveStyles() {
  if (document.getElementById('__ssCartIncentiveStyles')) return;
  const s = document.createElement('style'); s.id='__ssCartIncentiveStyles';
  s.textContent = `.ss-ci-title{font-weight:700;font-size:.95rem}.ss-ci-sub{font-size:.86rem;opacity:.85}.ss-ci-ticks-title{margin-top:6px;font-size:.78rem;opacity:.75;text-align:center}.ss-ci-bar{position:relative;width:100%;height:10px;border-radius:999px;background:rgba(0,0,0,.08);overflow:visible;margin-top:8px}html.dark-mode .ss-ci-bar{background:rgba(255,255,255,.12)}.ss-ci-fill{position:absolute;inset:0;width:0%;background:var(--Accent,#2563eb);border-radius:999px}.ss-ci-ticks{position:absolute;inset:0;pointer-events:none}.ss-ci-tick{position:absolute;top:50%;width:8px;height:8px;border-radius:999px;transform:translate(-50%,-50%);background:rgba(255,255,255,.9);border:1px solid rgba(0,0,0,.18);box-shadow:0 1px 2px rgba(0,0,0,.12)}html.dark-mode .ss-ci-tick{background:rgba(0,0,0,.35);border-color:rgba(255,255,255,.35);box-shadow:none}.ss-ci-ticklbl{position:absolute;top:-18px;font-size:.72rem;font-weight:600;opacity:.8;transform:translateX(-50%);white-space:nowrap}.ss-ci-badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.ss-ci-badge{padding:6px 10px;border-radius:999px;font-size:.82rem;border:1px solid rgba(0,0,0,.10);background:rgba(255,255,255,.75)}html.dark-mode .ss-ci-badge{border-color:rgba(255,255,255,.14);background:rgba(0,0,0,.25)}@media (max-width:520px){.ss-ci-addons{grid-template-columns:1fr}}.ss-ci-card{display:flex;gap:10px;align-items:center;padding:10px;border-radius:14px;border:1px solid rgba(0,0,0,.10);background:rgba(255,255,255,.85)}.ss-ci-card,.ss-ci-card *{color:rgba(0,0,0,.92)}html.dark-mode .ss-ci-card,html.dark-mode .ss-ci-card *{color:rgba(255,255,255,.92)}html.dark-mode .ss-ci-card{border-color:rgba(255,255,255,.14);background:rgba(0,0,0,.25)}.ss-ci-img{width:44px;height:44px;border-radius:10px;object-fit:cover;flex:0 0 auto;background:rgba(0,0,0,.05)}.ss-ci-name{font-weight:650;font-size:.9rem;line-height:1.15}.ss-ci-price{font-size:.86rem;opacity:.85}.ss-ci-btn{margin-left:auto;padding:8px 10px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:rgba(0,0,0,.03);cursor:pointer;font-weight:650}html.dark-mode .ss-ci-btn{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit}.ss-ci-btn:hover{filter:brightness(1.02)}`;
  document.head.appendChild(s);
}
function __ssCartSigForSmartReco() { try { const names = Object.values(basket || {}).map(i => String(i?.name || '').trim()).filter(Boolean).sort(); return btoa(unescape(encodeURIComponent(names.join('|')))).slice(0,64); } catch { return ''; } }
async function __ssFetchSmartCartRecs({ desiredEUR = 0, limit = 4 } = {}) {
  try {
    const sig = __ssCartSigForSmartReco(); const desired = Math.max(0, Number(desiredEUR || 0) || 0); const desiredKey = Math.round(desired * 100) / 100;
    if (__ssSmartCartRecoCache.sig === sig && Math.abs((__ssSmartCartRecoCache.desired || 0) - desiredKey) < 0.01 && Array.isArray(__ssSmartCartRecoCache.items) && __ssSmartCartRecoCache.items.length) return __ssSmartCartRecoCache;
    const cartItems = Object.values(basket || {}).map(i => ({ name: String(i?.name || '').trim() })).filter(x => x.name);
    const body = { placement:'cart_topup_v1', sessionId:String(window.__ssSessionId || ''), cartItems, desiredEUR:desired, limit:Math.max(1, Math.min(12, Number(limit || 4) || 4)), context:{ lang:String(window.currentLanguage || ''), device:(window.innerWidth <= 700 ? 'mobile' : 'desktop'), page:'cart', strictMaxPrice:true, optimization:'profit_popular', profitTieEUR:0.05, enableRecoDiscounts:true } };
    const data = await window.__SS_RECOMMENDATIONS__.getSmartRecommendations(body);
    if (!data || !data.ok || !Array.isArray(data.items)) return null;
    __ssSmartCartRecoCache = { sig, desired: desiredKey, token: String(data.token || ''), items: data.items || [] }; window.__ssSmartCartRecoCache = __ssSmartCartRecoCache;
    return __ssSmartCartRecoCache;
  } catch { return null; }
}
function __ssEnsureSmartCartRecs({ desiredEUR = 0, limit = 4 } = {}) {
  try {
    const sig = __ssCartSigForSmartReco(); const desired = Math.max(0, Number(desiredEUR || 0) || 0); const desiredKey = Math.round(desired * 100) / 100;
    const cacheValid = __ssSmartCartRecoCache && __ssSmartCartRecoCache.sig === sig && Math.abs((__ssSmartCartRecoCache.desired || 0) - desiredKey) < 0.01 && Array.isArray(__ssSmartCartRecoCache.items) && __ssSmartCartRecoCache.items.length;
    if (cacheValid) return;
    const sigBefore = sig;
    __ssFetchSmartCartRecs({ desiredEUR, limit }).then((cache) => {
      if (!cache) return; const sigAfter = __ssCartSigForSmartReco(); if (sigBefore !== sigAfter) return;
      try { if (__ssSmartRecoRerenderTimer) clearTimeout(__ssSmartRecoRerenderTimer); } catch {}
      __ssSmartRecoRerenderTimer = setTimeout(() => { try { if (__ssCartSigForSmartReco() !== sigBefore) return; __ssRequestBasketRerender(); } catch {} }, 180); window.__ssSmartRecoRerenderTimer = __ssSmartRecoRerenderTimer;
    }).catch(() => {});
  } catch {}
}
async function __ssSmartRecoEvent(type, itemKey) { return window.__SS_RECOMMENDATIONS__.__ssSmartRecoEvent.apply(this, arguments); }
function __ssLowerBoundByPrice(arr, price) { let lo=0, hi=arr.length; while (lo < hi) { const mid=(lo+hi)>>1; if ((arr[mid]?.price || 0) < price) lo = mid + 1; else hi = mid; } return lo; }
function __ssGetAddonPoolSorted() {
  __ssEnsureContributionProducts();
  const useContrib = (Array.isArray(__ssContributionCache.items) && __ssContributionCache.items.length);
  const src = useContrib ? 'contrib' : 'catalog'; const ref = useContrib ? __ssContributionCache.items : null; const len = useContrib ? __ssContributionCache.items.length : 0;
  if (src === 'contrib' && __ssAddonPoolSortedCache.src === src && __ssAddonPoolSortedCache.ref === ref && __ssAddonPoolSortedCache.len === len && Array.isArray(__ssAddonPoolSortedCache.sorted) && __ssAddonPoolSortedCache.sorted.length) return __ssAddonPoolSortedCache.sorted;
  if (src === 'catalog' && __ssAddonPoolSortedCache.src === src && Array.isArray(__ssAddonPoolSortedCache.sorted) && __ssAddonPoolSortedCache.sorted.length) return __ssAddonPoolSortedCache.sorted;
  const raw = useContrib ? __ssContributionCache.items.map(x => ({ key:String(x.itemKey || x.productId || x.id || x.productLink || x.name || '').trim(), name:String(x.name || '').trim(), price:Number(x.price || 0) || 0, image:String(x.image || x.imageUrl || (Array.isArray(x.images) ? x.images[0] : '') || '').trim(), productLink:String(x.productLink || x.url || x.link || '').trim(), description:String(x.description || x.desc || '').trim(), productId:String(x.productId || x.id || '').trim() })) : (__ssGetCatalogFlat ? __ssGetCatalogFlat() : []);
  const seen = new Set(), cleaned=[];
  for (const p of raw) { const k = String(p?.key || p?.productId || p?.id || p?.productLink || p?.name || '').trim(); if (!k || seen.has(k)) continue; seen.add(k); const obj = { key:k, productId:String(p?.productId || '').trim(), name:String(p?.name || '').trim(), price:Number(p?.price || 0) || 0, image:String(p?.image || '').trim(), productLink:String(p?.productLink || '').trim(), description:String(p?.description || '').trim(), discountPct:Number(p?.discountPct || 0) || 0, discountedPrice:Number(p?.discountedPrice || 0) || 0, discountToken:String(p?.discountToken || '').trim() }; if (!obj.name || !(obj.price > 0) || !obj.image) continue; cleaned.push(obj); }
  cleaned.sort((a,b) => a.price - b.price); __ssAddonPoolSortedCache = { src, ref: src === 'contrib' ? ref : null, len: src === 'contrib' ? len : 0, sorted: cleaned }; window.__ssAddonPoolSortedCache = __ssAddonPoolSortedCache; return cleaned;
}
function __ssCartPickAddonProducts({ desiredEUR, limit = 4 } = {}) {
  const desired = Math.max(0, Number(desiredEUR || 0) || 0); const maxN = Math.max(0, Number(limit || 4) || 4); const basketNames = new Set(Object.values(basket || {}).map(i => String(i?.name || '').trim()).filter(Boolean));
  let smart=[];
  try {
    const sig = __ssCartSigForSmartReco(); const desiredKey = Math.round(desired * 100) / 100;
    if (__ssSmartCartRecoCache && __ssSmartCartRecoCache.sig === sig && Math.abs((__ssSmartCartRecoCache.desired || 0) - desiredKey) < 0.01 && Array.isArray(__ssSmartCartRecoCache.items) && __ssSmartCartRecoCache.items.length) {
      const seenSmart = new Set();
      smart = __ssSmartCartRecoCache.items.map(it => __ssNormalizeRecoItem(it) || it).map(x => ({ key:String(x?.key || x?.itemKey || x?.productId || x?.id || x?.productLink || x?.name || '').trim(), productId:String(x?.productId || x?.id || '').trim(), discountToken:String(x?.discountToken || '').trim(), discountPct:Number(x?.discountPct || 0) || 0, discountedPrice:Number(x?.discountedPrice || 0) || 0, name:String(x?.name || x?.title || x?.productName || '').trim(), price:Number(x?.price || x?.priceEUR || x?.eurPrice || 0) || 0, image:String(x?.image || x?.imageUrl || (Array.isArray(x?.images) ? x.images[0] : '') || '').trim(), productLink:String(x?.productLink || x?.url || x?.link || '').trim(), description:String(x?.description || x?.desc || '').trim() })).filter(x => x && x.key && x.name && (Number(x.price) > 0) && x.image && !basketNames.has(x.name)).filter(x => { if (seenSmart.has(x.key)) return false; seenSmart.add(x.key); return true; }).slice(0, maxN);
    }
  } catch {}
  const cfg = __ssGetCartIncentivesConfig(); const top = cfg?.topup || {}; const pct = Math.max(0, Math.min(200, Number(top?.maxPriceDeltaPct || 25) || 25)); const maxPrice = desired > 0 ? desired * (1 + (pct / 100)) : Infinity;
  const out=[]; const seen = new Set(); for (const s of smart) { const k=String(s.key || '').trim(); if (!k || seen.has(k)) continue; seen.add(k); out.push(s); if (out.length >= maxN) return out; }
  const pool = __ssGetAddonPoolSorted();
  if (!(desired > 0)) { for (const p of pool) { if (out.length >= maxN) break; if (!p || !p.key || seen.has(p.key) || basketNames.has(p.name)) continue; seen.add(p.key); out.push(p); } return out; }
  const idx = __ssLowerBoundByPrice(pool, desired); let l = idx - 1, r = idx;
  while (out.length < maxN && (l >= 0 || r < pool.length)) { const left = (l >= 0) ? pool[l] : null; const right = (r < pool.length) ? pool[r] : null; const dl = left ? Math.abs((left.price || 0) - desired) : Infinity; const dr = right ? Math.abs((right.price || 0) - desired) : Infinity; const takeLeft = dl <= dr; const cand = takeLeft ? left : right; if (takeLeft) l--; else r++; if (!cand || !cand.key || seen.has(cand.key) || basketNames.has(cand.name)) continue; if (cand.price > Math.max(30, maxPrice)) continue; seen.add(cand.key); out.push(cand); }
  return out;
}
function __ssRenderCartIncentivesHTML(totalSumEUR, opts = {}) {
  try {
    const cfg0 = __ssGetCartIncentivesConfig(); if (!cfg0?.enabled) return ''; __ssEnsureCartIncentiveStyles();
    const fullCart = (opts && Array.isArray(opts.fullCart)) ? opts.fullCart : (__ssGetFullCartPreferred());
    const inc = (opts && opts.inc) ? opts.inc : __ssComputeCartIncentivesClient(totalSumEUR, fullCart);
    const cfg = __ssGetCartIncentivesConfig(); const tiers = (cfg?.tierDiscount?.enabled && Array.isArray(cfg?.tierDiscount?.tiers)) ? cfg.tierDiscount.tiers : []; const base = Number(inc.baseTotalEUR || totalSumEUR) || 0;
    let nextTier = null; let currentTierPct = Number(inc.tierPct || 0) || 0; for (const t of tiers) { const min = Math.max(0, Number(t?.minEUR || 0) || 0); const pct = Math.max(0, Number(t?.pct || 0) || 0); if (min > base && pct > 0) { nextTier = { min, pct }; break; } }
    const tierText = nextTier ? (() => { const needEUR = Math.max(0, (nextTier.min - base)); return `Add <span class="ss-ci-amt" data-eur="${needEUR.toFixed(2)}" data-ci-min-eur="${nextTier.min.toFixed(2)}" data-ci-base-eur="${base.toFixed(2)}">${needEUR.toFixed(2)}€</span> to unlock ${nextTier.pct}% OFF`; })() : (currentTierPct > 0 ? `Unlocked ${currentTierPct}% OFF` : `Add more to unlock a discount`);
    const tierScaleMax = (() => { const mins = tiers.map(t => Math.max(0, Number(t?.minEUR || 0) || 0)).filter(v => v > 0); const max = mins.length ? Math.max(...mins) : (nextTier ? nextTier.min : 0); return max > 0 ? max : (base > 0 ? base : 1); })();
    const tierProgressGlobal = Math.max(0, Math.min(100, (base / tierScaleMax) * 100));
    const tierTicksHTML = (() => { if (!tiers.length) return ''; const parts=[]; for (const t of tiers) { const min=Math.max(0, Number(t?.minEUR || 0) || 0); const pct=Math.max(0, Number(t?.pct || 0) || 0); if (!min || !pct) continue; const left=Math.max(0, Math.min(100, (min / tierScaleMax) * 100)); parts.push(`<span class="ss-ci-tick" style="left:${left.toFixed(2)}%"></span>`); parts.push(`<span class="ss-ci-ticklbl" style="left:${left.toFixed(2)}%">${pct}%</span>`); } return parts.length ? `<div class="ss-ci-ticks">${parts.join('')}</div>` : ''; })();
    const shipCfg = cfg?.freeShipping || {}; const shipEnabled = !!shipCfg?.enabled && Number(shipCfg?.shippingFeeEUR || 0) > 0 && Number(shipCfg?.thresholdEUR || 0) > 0; const shipThr = Math.max(0, Number(shipCfg?.thresholdEUR || 0) || 0);
    const shipText = shipEnabled ? (base >= shipThr ? 'Free shipping unlocked' : (() => { const needEUR = Math.max(0, (shipThr - base)); return `Add <span class="ss-ci-amt" data-eur="${needEUR.toFixed(2)}" data-ci-min-eur="${shipThr.toFixed(2)}" data-ci-base-eur="${base.toFixed(2)}">${needEUR.toFixed(2)}€</span> for free shipping`; })()) : '';
    const desired = nextTier ? Math.max(3, nextTier.min - base) : 0; const topCfg = (cfg?.topup && typeof cfg.topup === 'object') ? cfg.topup : { maxItems: 4, maxPriceDeltaPct: 25 }; const maxItems = Math.max(0, Math.min(12, Number(topCfg.maxItems || 4) || 4));
    __ssEnsureSmartCartRecs({ desiredEUR: desired, limit: maxItems }); const addons = __ssCartPickAddonProducts({ desiredEUR: desired, limit: maxItems });
    const badges=[]; if (Number(inc.tierDiscountEUR || 0) > 0) badges.push({ kind:'saved', eur:Number(inc.tierDiscountEUR) || 0 }); if (Number(inc.bundleDiscountEUR || 0) > 0) badges.push({ kind:'bundle', eur:Number(inc.bundleDiscountEUR) || 0 }); if (shipEnabled && base >= shipThr) badges.push({ kind:'text', text:'Free shipping' });
    const addonHTML = addons.length ? `<div class="ss-ci-sub" style="margin-top:10px;">Frequently added with your items:</div><div class="ss-ci-addons">${addons.map(p => { const price = Number(p?.price || 0) || 0; const hasDisc = (Number(p?.discountPct || 0) > 0 && Number(p?.discountedPrice || 0) > 0 && Number(p?.discountedPrice || 0) < price); const eur = hasDisc ? Number(p.discountedPrice || 0) : price; const eurOrig = hasDisc ? price : null; const pct = hasDisc ? Number(p.discountPct || 0) : 0; const nameEnc = encodeURIComponent(String(p?.name || '')); const recoQ = hasDisc && String(p?.discountToken || '') ? `&reco=${encodeURIComponent(String(p.discountToken))}` : ''; const href = `${window.location.origin}/?product=${nameEnc}${recoQ}`; if (hasDisc && String(p?.discountToken || '')) { try { __ssRecoDiscountStorePut(String(p.discountToken), { productId: __ssIdNorm(p?.productId || ''), discountPct: pct, discountedPrice: eur }); } catch {} } return `<div class="ss-ci-card" data-ss-addon-pid="${__ssEscHtml(String(p?.productId || ''))}" data-ss-addon-token="${__ssEscHtml(String(p?.discountToken || ''))}"><a href="${href}" style="display:block;"><img class="ss-ci-img" src="${__ssEscHtml(p?.image || '')}" alt="${__ssEscHtml(p?.name || '')}"></a><div style="min-width:0;"><a href="${href}" style="text-decoration:none;color:inherit;"><div class="ss-ci-name">${__ssEscHtml(p?.name || '')}</div></a>${hasDisc ? `<div class="ss-ci-price basket-item-price" data-eur="${eur.toFixed(2)}" data-eur-original="${eurOrig.toFixed(2)}" data-discount-pct="${pct}">${eur.toFixed(2)}€</div>` : `<div class="ss-ci-price basket-item-price" data-eur="${eur.toFixed(2)}">${eur.toFixed(2)}€</div>`}</div><button class="ss-ci-btn" type="button" data-ss-quickadd="${__ssEscHtml(p?.name || '')}" data-ss-quickadd-pid="${__ssEscHtml(String(p?.productId || ''))}" data-ss-quickadd-token="${__ssEscHtml(String(p?.discountToken || ''))}" data-ss-quickadd-pct="${__ssEscHtml(String(p?.discountPct || ''))}" data-ss-quickadd-orig="${__ssEscHtml(String(price))}" data-ss-quickadd-disc="${__ssEscHtml(String(eur))}">Add</button></div>`; }).join('')}</div>` : '';
    const badgesHtml = badges.length ? `<div class="ss-ci-badges">${badges.map(b => b.kind === 'text' ? `<span class="ss-ci-badge">${__ssEscHtml(b.text || '')}</span>` : `<span class="ss-ci-badge basket-item-price" data-eur="${Number(b.eur || 0).toFixed(2)}">Saved ${Number(b.eur || 0).toFixed(2)}€</span>`).join('')}</div>` : '';
    return `<div class="ss-ci-wrap"><div class="ss-ci-title">Boost your savings</div><div class="ss-ci-sub">${tierText}</div><div class="ss-ci-bar">${tierTicksHTML}<div class="ss-ci-fill" style="width:${tierProgressGlobal.toFixed(2)}%"></div></div>${shipText ? `<div class="ss-ci-sub" style="margin-top:8px;">${shipText}</div>` : ''}${badgesHtml}${addonHTML}</div>`;
  } catch { return ''; }
}
function __ssBindCartIncentives(rootEl) {
  const root = rootEl || document; if (!root || root.__ssCartIncBound) return; root.__ssCartIncBound = true;
  root.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('[data-ss-quickadd]'); if (!btn) return; e.preventDefault(); const name = String(btn.getAttribute('data-ss-quickadd') || '').trim(); if (!name) return;
    const p = __ssGetCatalogFlat().find(pp => String(pp?.name || '').trim() === name); if (!p) return;
    const groups = __ssExtractOptionGroups(p); const sel = __ssDefaultSelectedOptions(groups); __ssSmartRecoEvent('add_to_cart', String(p.productId || p.name || name));
    try {
      const tok = String(btn.getAttribute('data-ss-quickadd-token') || '').trim(); const pct = Number(btn.getAttribute('data-ss-quickadd-pct') || 0) || 0; const orig = Number(btn.getAttribute('data-ss-quickadd-orig') || 0) || 0; const disc = Number(btn.getAttribute('data-ss-quickadd-disc') || 0) || 0;
      if (tok && pct > 0 && disc > 0) {
        __ssRecoSaveRecentClick({ widgetId:'smart_cart_addons_v1', token:String(__ssSmartCartRecoCache?.token || ''), sessionId:String(window.__ssSessionId || ''), sourceProductId:'', targetProductId:String(p.productId || ''), position:0, discountToken:tok, discountPct:pct, originalPrice:(orig > 0 ? orig : Number(p.price || 0) || 0), discountedPrice:disc, productId:String(p.productId || '') });
      }
    } catch {}
    addToCart(p.name, Number(p.price || 0) || 0, p.image || '', p.expectedPurchasePrice || 0, p.productLink || '', p.description || '', '', sel, (p.productId || null));
    try { updateBasket(); } catch {}
  }, { passive:false });
}
async function __ssValidateRecoDiscountsInBasketBestEffort(entries) {
  try {
    const toks=[]; const byTok = new Map();
    for (const [k, it] of (entries || [])) { const tok = String(it?.recoDiscountToken || '').trim(); if (!tok) continue; const pid = String(it?.productId || '').trim(); toks.push({ token:tok, productId:pid }); byTok.set(tok, { key:k, item:it }); }
    if (!toks.length) return;
    const data = await window.__SS_RECOMMENDATIONS__.quoteRecommendations(toks);
    if (!data || !data.ok || !Array.isArray(data.quotes)) return;
    let changed = false;
    for (const q of data.quotes) {
      const tok = String(q?.token || '').trim(); if (!tok) continue; const ref = byTok.get(tok); if (!ref) continue;
      if (!q.valid) { const it=ref.item; const orig=Number(it?.unitPriceOriginalEUR || 0) || 0; if (orig > 0 && Number(it?.price || 0) > 0 && Number(it?.price || 0) < orig) { it.price=orig; delete it.recoDiscountToken; delete it.recoDiscountPct; delete it.unitPriceOriginalEUR; changed = true; } continue; }
      if (q.valid && Number(q.discountedPrice || 0) > 0) { const it=ref.item; const nextDisc=Number(q.discountedPrice || 0) || 0; const nextPct=Number(q.discountPct || it?.recoDiscountPct || 0) || 0; if (nextDisc > 0 && Number(it?.price || 0) !== nextDisc) { if (!(Number(it?.unitPriceOriginalEUR || 0) > 0)) it.unitPriceOriginalEUR = Number(it?.price || 0) || 0; it.price = nextDisc; if (nextPct > 0) it.recoDiscountPct = nextPct; changed = true; } }
    }
    if (changed) { try { persistBasket('reco_quote_revalidated'); } catch {} try { updateBasket(); } catch {} }
  } catch {}
}
window.__SS_CART_INCENTIVES__ = {
  __ssGetCartIncentivesConfig, __ssDbgTierEnabled, __ssTierDbgGroup, __ssComputeCartIncentivesClient,
  __ssEnsureCartIncentiveStyles, __ssCartSigForSmartReco, __ssFetchSmartCartRecs, __ssEnsureSmartCartRecs,
  __ssLowerBoundByPrice, __ssGetAddonPoolSorted, __ssCartPickAddonProducts, __ssRenderCartIncentivesHTML,
  __ssBindCartIncentives, __ssValidateRecoDiscountsInBasketBestEffort
};
})(window, document);
