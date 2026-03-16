'use strict';

const { round2 } = require('./money');

function envBool(name, defVal) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return defVal;
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return defVal;
}

function parseJsonEnv(name, fallback) {
  try {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed == null) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function normPct(p) {
  const x = Number(p || 0) || 0;
  if (!Number.isFinite(x) || x <= 0) return 0;
  if (x > 0 && x <= 1) return x * 100;
  return x;
}

function buildIncentivesFromEnv() {
  const enabled = envBool('CART_INCENTIVES_ENABLED', true);
  const freeShipping = {
    enabled: envBool('FREE_SHIPPING_ENABLED', true),
    thresholdEUR: Math.max(0, Number(process.env.FREE_SHIPPING_THRESHOLD_EUR || 0) || 0),
    shippingFeeEUR: Math.max(0, Number(process.env.SHIPPING_FEE_EUR || 0) || 0),
  };
  const tierDiscount = {
    enabled: envBool('TIER_DISCOUNT_ENABLED', true),
    applyToDiscountedItems: envBool('TIER_DISCOUNT_APPLY_TO_DISCOUNTED_ITEMS', false),
    tiers: (() => {
      const def = [
        { minEUR: 25, pct: 3 },
        { minEUR: 40, pct: 6 },
        { minEUR: 60, pct: 10 },
      ];
      const arr = parseJsonEnv('TIER_DISCOUNT_TIERS_JSON', def);
      const norm = Array.isArray(arr) ? arr : def;
      return norm
        .map((t) => ({
          minEUR: Math.max(0, Number(t?.minEUR || 0) || 0),
          pct: Math.max(0, Math.min(80, normPct(t?.pct))),
        }))
        .filter((t) => Number.isFinite(t.minEUR) && Number.isFinite(t.pct))
        .sort((a, b) => a.minEUR - b.minEUR)
        .slice(0, 50);
    })(),
  };
  const bundles = {
    enabled: envBool('BUNDLE_DISCOUNT_ENABLED', false),
    bundles: (() => {
      const def = [];
      const arr = parseJsonEnv('BUNDLE_DISCOUNT_BUNDLES_JSON', def);
      const norm = Array.isArray(arr) ? arr : def;
      return norm
        .map((b) => ({
          id: String(b?.id || '').slice(0, 64),
          title: String(b?.title || '').slice(0, 120),
          pct: Math.max(0, Math.min(80, normPct(b?.pct))),
          productIds: (Array.isArray(b?.productIds) ? b.productIds : []).map((x) => String(x || '').trim()).filter(Boolean).slice(0, 50),
        }))
        .filter((b) => b.id && b.pct > 0 && b.productIds.length >= 2);
    })(),
  };
  const topup = {
    maxItems: Math.max(0, Math.min(50, Number(process.env.TOPUP_MAX_ITEMS || 8) || 8)),
    maxPriceDeltaPct: Math.max(0, Math.min(1000, Number(process.env.TOPUP_MAX_PRICE_DELTA_PCT || 30) || 30)),
  };
  return { enabled, freeShipping, tierDiscount, bundles, topup };
}

function normalizeIncentivesConfig(cfg) {
  const env = buildIncentivesFromEnv();
  const c = (cfg && typeof cfg === 'object') ? cfg : {};
  const enabled = (c.enabled != null) ? !!c.enabled : env.enabled;
  const freeShipping = {
    enabled: (c.freeShipping?.enabled != null) ? !!c.freeShipping.enabled : env.freeShipping.enabled,
    thresholdEUR: Math.max(0, Number(c.freeShipping?.thresholdEUR ?? env.freeShipping.thresholdEUR) || 0),
    shippingFeeEUR: Math.max(0, Number(c.freeShipping?.shippingFeeEUR ?? env.freeShipping.shippingFeeEUR) || 0),
  };
  const tierDiscount = {
    enabled: (c.tierDiscount?.enabled != null) ? !!c.tierDiscount.enabled : env.tierDiscount.enabled,
    applyToDiscountedItems: (c.tierDiscount?.applyToDiscountedItems != null)
      ? !!c.tierDiscount.applyToDiscountedItems
      : env.tierDiscount.applyToDiscountedItems,
    tiers: Array.isArray(c.tierDiscount?.tiers) ? c.tierDiscount.tiers : env.tierDiscount.tiers,
  };
  tierDiscount.tiers = (Array.isArray(tierDiscount.tiers) ? tierDiscount.tiers : [])
    .map((t) => ({
      minEUR: Math.max(0, Number(t?.minEUR || 0) || 0),
      pct: Math.max(0, Math.min(80, normPct(t?.pct))),
    }))
    .filter((t) => Number.isFinite(t.minEUR) && Number.isFinite(t.pct))
    .sort((a, b) => a.minEUR - b.minEUR)
    .slice(0, 50);
  const bundles = {
    enabled: (c.bundles?.enabled != null) ? !!c.bundles.enabled : env.bundles.enabled,
    bundles: Array.isArray(c.bundles?.bundles) ? c.bundles.bundles : env.bundles.bundles,
  };
  bundles.bundles = (Array.isArray(bundles.bundles) ? bundles.bundles : [])
    .map((b) => ({
      id: String(b?.id || '').slice(0, 64),
      title: String(b?.title || '').slice(0, 120),
      pct: Math.max(0, Math.min(80, normPct(b?.pct))),
      productIds: (Array.isArray(b?.productIds) ? b.productIds : []).map((x) => String(x || '').trim()).filter(Boolean).slice(0, 50),
    }))
    .filter((b) => b.id && b.pct > 0 && b.productIds.length >= 2)
    .slice(0, 50);
  const topup = {
    maxItems: Math.max(0, Math.min(50, Number(c.topup?.maxItems ?? env.topup.maxItems) || 0)),
    maxPriceDeltaPct: Math.max(0, Math.min(1000, Number(c.topup?.maxPriceDeltaPct ?? env.topup.maxPriceDeltaPct) || 0)),
  };
  return { enabled, freeShipping, tierDiscount, bundles, topup };
}

function getProfitEnvDefaults() {
  return {
    enabled: envBool('PROFIT_CFG_ENABLED', true),
    fees: {
      pct: Math.max(0, Number(process.env.PROFIT_FEES_PCT ?? 0.029) || 0.029),
      fixedEUR: Math.max(0, Number(process.env.PROFIT_FEES_FIXED_EUR ?? 0.30) || 0.30),
    },
    avgShippingCostEUR: Math.max(0, Number(process.env.PROFIT_AVG_SHIP_COST_EUR ?? 3.50) || 3.50),
    minOrderMarginPct: Math.max(0, Math.min(0.9, Number(process.env.PROFIT_MIN_ORDER_MARGIN_PCT ?? 0.18) || 0.18)),
    minOrderContributionEUR: Number(process.env.PROFIT_MIN_ORDER_CONTRIB_EUR ?? 2.0),
    refundPenaltyWeight: Math.max(0, Number(process.env.PROFIT_REFUND_PENALTY_WEIGHT ?? 0.8) || 0.8),
    fraud: {
      enabled: envBool('PROFIT_FRAUD_ENABLED', true),
      maxPaymentIntentsPerIPPerHour: Math.max(1, Number(process.env.FRAUD_MAX_PI_PER_IP_HOUR ?? 20) || 20),
      maxFinalizePerIPPerHour: Math.max(1, Number(process.env.FRAUD_MAX_FINALIZE_PER_IP_HOUR ?? 30) || 30),
    },
  };
}

function estimateProcessorFeesEUR(totalPaidEUR, profitCfg) {
  const pct = Number(profitCfg?.fees?.pct || 0) || 0;
  const fixed = Number(profitCfg?.fees?.fixedEUR || 0) || 0;
  return round2(Math.max(0, totalPaidEUR) * pct + fixed);
}

module.exports = {
  envBool,
  parseJsonEnv,
  normPct,
  buildIncentivesFromEnv,
  normalizeIncentivesConfig,
  getProfitEnvDefaults,
  estimateProcessorFeesEUR,
};
