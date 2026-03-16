'use strict';

const { getFxRuntimeState } = require('./fx');

const round2Warned = new Set();

function parseDecimalLoose(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  let s = String(value).trim();
  if (!s) return NaN;
  s = s.replace(/\s+/g, '');
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function round2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) {
    try {
      const err = new Error('round2 received non-finite');
      const key = String(err.stack || '').split('\n').slice(2, 4).join('|');
      if (!round2Warned.has(key)) {
        round2Warned.add(key);
        console.error('[round2][non-finite]', { value: n, callsite: key });
      }
    } catch {}
    return 0;
  }
  return Math.round(x * 100) / 100;
}

function round2Strict(n, ctx = 'value') {
  const x = Number(n);
  if (!Number.isFinite(x)) throw new Error(`[round2Strict] non-finite ${ctx}: ${String(n)}`);
  return Math.round(x * 100) / 100;
}

function toEUR(amount, currency) {
  const num = parseDecimalLoose(amount);
  if (!Number.isFinite(num)) return 0;
  const cur = String(currency || 'EUR').trim().toUpperCase();
  if (!cur || cur === 'EUR') return round2(num);
  const { cachedRates } = getFxRuntimeState();
  const rates = cachedRates;
  const rate = Number(rates && rates[cur]);
  if (!Number.isFinite(rate) || rate <= 0) return round2(num);
  return round2(num / rate);
}

module.exports = { parseDecimalLoose, round2, round2Strict, toEUR };
