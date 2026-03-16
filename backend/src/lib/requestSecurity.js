'use strict';

const axios = require('axios');

const contactLastSent = new Map();
const { getRequestSecurityState } = require('./requestSecurityState');

function getAllowedOrigins() {
  const { allowedOrigins: raw } = getRequestSecurityState();
  if (raw instanceof Set) return raw;
  if (Array.isArray(raw)) return new Set(raw.map((x) => String(x).replace(/\/+$/, '')));
  return new Set();
}

function originIsAllowed(req) {
  const origin = req && typeof req.get === 'function' ? req.get('Origin') : (req?.headers?.origin || req?.headers?.Origin);
  if (!origin) return true;
  const normalized = String(origin).replace(/\/+$/, '');
  if (normalized === 'null' && !!getRequestSecurityState().allowNullOrigin) return true;
  return getAllowedOrigins().has(normalized);
}

function isCoolingDown(ip, email) {
  const key = `${ip || 'unknown'}|${String(email || '').toLowerCase()}`;
  const now = Date.now();
  const last = contactLastSent.get(key) || 0;
  const cooldownMs = Number(process.env.CONTACT_COOLDOWN_MS || 60_000);
  if (now - last < cooldownMs) return true;
  contactLastSent.set(key, now);
  if (contactLastSent.size > 5000) {
    for (const [k, t] of contactLastSent) {
      if (now - t > 6 * 60 * 60 * 1000) contactLastSent.delete(k);
    }
  }
  return false;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: 'missing token' };
  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  if (ip) params.append('remoteip', ip);
  try {
    const { data } = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 }
    );
    return { ok: !!data?.success, reason: data };
  } catch (e) {
    return { ok: false, reason: e?.message || 'verify failed' };
  }
}

module.exports = { originIsAllowed, isCoolingDown, verifyTurnstile };
