'use strict';

const crypto = require('crypto');
const { timingSafeEqualHex } = require('./security');
const { recoSha256 } = require('./growth');

const RECO_LIST_SECRET = String(process.env.RECO_LIST_SECRET || process.env.JWT_SECRET || 'dev_reco_list_secret').trim();

function recoListB64UrlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function recoListB64UrlDecode(str) {
  const ss = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = ss.length % 4 ? '='.repeat(4 - (ss.length % 4)) : '';
  return Buffer.from(ss + pad, 'base64');
}

function recoMakeTrackingToken({ widgetId, sourceProductId, itemIds, ts, defaultWidgetId = 'default' }) {
  const wid = String(widgetId || defaultWidgetId).trim() || defaultWidgetId;
  const sourcePid = String(sourceProductId || '').trim();
  const t = Number(ts || Date.now());
  const list = (Array.isArray(itemIds) ? itemIds : []).map(String).join(',');
  const sig = recoSha256(`${wid}|${sourcePid}|${t}|${list}`);
  return `${wid}.${sourcePid}.${t}.${sig}`;
}

function recoMakeListToken({ widgetId, sourceProductId, itemIds, ttlMinutes = 60, defaultWidgetId = 'default' }) {
  const wid = String(widgetId || defaultWidgetId).trim() || defaultWidgetId;
  const sourcePid = String(sourceProductId || '').trim();
  const ttl = Math.max(5, Math.min(1440, Number(ttlMinutes || 60) || 60));
  const exp = Date.now() + ttl * 60 * 1000;
  const ids = (Array.isArray(itemIds) ? itemIds : []).map((x) => String(x || '').trim()).filter(Boolean).slice(0, 300);
  const payload = { wid, sourcePid, ids, exp };
  const body = recoListB64UrlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = crypto.createHmac('sha256', RECO_LIST_SECRET).update(body).digest();
  return `${body}.${recoListB64UrlEncode(sig)}`;
}

function recoParseListToken(token, { defaultWidgetId = 'default' } = {}) {
  try {
    const t = String(token || '').trim();
    if (!t.includes('.')) return null;
    const [body, sig] = t.split('.', 2);
    if (!body || !sig) return null;
    const sigCalc = crypto.createHmac('sha256', RECO_LIST_SECRET).update(body).digest();
    const sigCalcB64 = recoListB64UrlEncode(sigCalc);
    if (!timingSafeEqualHex(recoSha256(sig), recoSha256(sigCalcB64))) return null;
    const payload = JSON.parse(recoListB64UrlDecode(body).toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    const exp = Number(payload.exp || 0);
    if (!exp || exp < Date.now()) return null;
    return {
      widgetId: String(payload.wid || '').trim() || defaultWidgetId,
      sourceProductId: String(payload.sourcePid || '').trim(),
      itemIds: Array.isArray(payload.ids) ? payload.ids.map((x) => String(x || '').trim()).filter(Boolean) : [],
      exp,
    };
  } catch {
    return null;
  }
}

module.exports = {
  recoMakeTrackingToken,
  recoMakeListToken,
  recoParseListToken,
};
