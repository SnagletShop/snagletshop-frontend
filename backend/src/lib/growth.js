'use strict';

const crypto = require('crypto');
const { timingSafeEqualHex } = require('./security');

const SMART_RECO_SECRET = String(process.env.SMART_RECO_SECRET || process.env.JWT_SECRET || 'smart_reco_secret').trim();
const RECO_WIDGET_DEFAULT_FALLBACK = 'product_page_recs_v1';
const RECO_DISCOUNT_SECRET = String(process.env.RECO_DISCOUNT_SECRET || process.env.JWT_SECRET || 'dev_reco_discount_secret').trim();

function abClamp01(x, defVal = 0.5) {
  const n = Number(x);
  if (!Number.isFinite(n)) return defVal;
  return Math.max(0, Math.min(1, n));
}

function recoNow() {
  return new Date();
}

function recoSha256(s) {
  try {
    return crypto.createHash('sha256').update(String(s || ''), 'utf8').digest('hex');
  } catch {
    return '';
  }
}

function recoClamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function recoParseTrackingToken(token) {
  try {
    const s = String(token || '');
    const parts = s.split('.');
    if (parts.length < 4) return null;
    return {
      widgetId: parts[0],
      sourceProductId: parts[1],
      ts: Number(parts[2]) || 0,
      sig: parts.slice(3).join('.'),
    };
  } catch {
    return null;
  }
}

function b64UrlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64UrlDecode(str) {
  const s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return Buffer.from(s + pad, 'base64');
}

function recoParseDiscountToken(token) {
  try {
    const t = String(token || '').trim();
    if (!t.includes('.')) return null;
    const [body, sig] = t.split('.', 2);
    if (!body || !sig) return null;

    const sigCalc = crypto.createHmac('sha256', RECO_DISCOUNT_SECRET).update(body).digest();
    const sigCalcB64 = b64UrlEncode(sigCalc);
    if (!timingSafeEqualHex(recoSha256(sig), recoSha256(sigCalcB64))) return null;

    const payload = JSON.parse(b64UrlDecode(body).toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    const exp = Number(payload.exp || 0);
    if (!exp || exp < Date.now()) return null;

    return {
      widgetId: String(payload.wid || '').trim() || RECO_WIDGET_DEFAULT_FALLBACK,
      sourceProductId: String(payload.sourcePid || '').trim(),
      targetProductId: String(payload.targetPid || '').trim(),
      pct: Number(payload.pct || 0),
      exp,
    };
  } catch {
    return null;
  }
}

function recoDiscountTokenHash(token) {
  return recoSha256(String(token || ''));
}

function srParseToken(token) {
  try {
    const t = String(token || '');
    const [base, sig] = t.split('.');
    if (!base || !sig) return null;
    const exp = crypto.createHmac('sha256', SMART_RECO_SECRET).update(base).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
    const obj = JSON.parse(Buffer.from(base, 'base64url').toString('utf8'));
    return obj && typeof obj === 'object' ? obj : null;
  } catch {
    return null;
  }
}

function normalizeProfitConfig(body) {
  const b = (body && typeof body === 'object') ? body : {};
  return {
    enabled: !!(b.enabled ?? true),
    fees: {
      pct: Math.max(0, Math.min(0.2, Number(b?.fees?.pct ?? 0.029) || 0.029)),
      fixedEUR: Math.max(0, Math.min(10, Number(b?.fees?.fixedEUR ?? 0.30) || 0.30)),
    },
    avgShippingCostEUR: Math.max(0, Math.min(200, Number(b.avgShippingCostEUR ?? 3.50) || 3.50)),
    minOrderMarginPct: Math.max(0, Math.min(0.9, Number(b.minOrderMarginPct ?? 0.18) || 0.18)),
    minOrderContributionEUR: Number(b.minOrderContributionEUR ?? 2.0),
    refundPenaltyWeight: Math.max(0, Math.min(10, Number(b.refundPenaltyWeight ?? 0.8) || 0.8)),
    fraud: {
      enabled: !!(b?.fraud?.enabled ?? true),
      maxPaymentIntentsPerIPPerHour: Math.max(1, Math.min(5000, Number(b?.fraud?.maxPaymentIntentsPerIPPerHour ?? 20) || 20)),
      maxFinalizePerIPPerHour: Math.max(1, Math.min(5000, Number(b?.fraud?.maxFinalizePerIPPerHour ?? 30) || 30)),
    },
  };
}

function recoDetRand(str) {
  try {
    const h = crypto.createHash('md5').update(String(str || '')).digest('hex');
    const n = parseInt(h.slice(0, 12), 16);
    return (n % 1000000) / 1000000;
  } catch {
    return Math.random();
  }
}

function recoMakeDiscountToken({ widgetId, sourceProductId, targetProductId, pct, ttlMinutes }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT_FALLBACK).trim() || RECO_WIDGET_DEFAULT_FALLBACK;
  const sourcePid = String(sourceProductId || '').trim();
  const targetPid = String(targetProductId || '').trim();
  const pctNum = Number(pct || 0);
  const ttl = Math.max(1, Math.min(1440, Number(ttlMinutes || 60)));
  const exp = Date.now() + ttl * 60 * 1000;

  const payload = { wid, sourcePid, targetPid, pct: pctNum, exp };
  const body = b64UrlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = crypto.createHmac('sha256', RECO_DISCOUNT_SECRET).update(body).digest();
  const sigB64 = b64UrlEncode(sig);
  return `${body}.${sigB64}`;
}

module.exports = {
  abClamp01,
  recoNow,
  recoSha256,
  recoClamp,
  recoParseTrackingToken,
  recoParseDiscountToken,
  recoDiscountTokenHash,
  recoDetRand,
  recoMakeDiscountToken,
  srParseToken,
  normalizeProfitConfig,
};
