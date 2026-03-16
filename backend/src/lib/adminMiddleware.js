'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function requireAdminCode(req) {
  const adminCode = String(process.env.ADMIN_CODE || '').trim();
  if (!adminCode) return true;
  const hdr = (req && typeof req.get === 'function' ? req.get('X-Admin-Code') : '') || req?.headers?.['x-admin-code'] || '';
  return String(hdr || '').trim() === adminCode;
}

function authMiddleware(req, res, next) {
  if (!requireAdminCode(req)) return res.status(401).json({ error: 'Missing or invalid admin code' });
  const hdr = (req && typeof req.get === 'function' ? req.get('Authorization') : '') || req?.headers?.authorization || '';
  const m = String(hdr).match(/^Bearer (.+)$/i);
  if (!m) return res.status(401).json({ error: 'Missing token' });
  const secret = String(process.env.JWT_SECRET || 'change_me').trim();
  try {
    const decoded = jwt.verify(m[1], secret);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  return authMiddleware(req, res, () => {
    const role = req.user && typeof req.user === 'object' ? String(req.user.role || '').trim().toLowerCase() : '';
    if (!role || role === 'admin') return next();
    return res.status(403).json({ error: 'Forbidden' });
  });
}

function agentWebhookAuth(req, res, next) {
  const secret = String(process.env.AGENT_WEBHOOK_SECRET || '').trim();
  if (secret) {
    const got = String(req.headers['x-webhook-secret'] || req.headers['x-agent-webhook-secret'] || '').trim();
    if (!got || got !== secret) return res.status(401).json({ error: 'invalid webhook secret' });
    return next();
  }
  return authMiddleware(req, res, next);
}

function verifyOrderCreatedWebhook(req, res, next) {
  try {
    const secret = String(process.env.ORDER_CREATED_WEBHOOK_SECRET || '').trim();
    if (!secret) return res.status(500).json({ error: 'webhook secret not configured' });

    const sig = (req && typeof req.get === 'function' ? req.get('X-Order-Signature') : '') || req?.headers?.['x-order-signature'] || '';
    const ts = (req && typeof req.get === 'function' ? req.get('X-Order-Timestamp') : '') || req?.headers?.['x-order-timestamp'] || '';
    const now = Date.now();
    const tsMs = Number(ts);
    if (!Number.isFinite(tsMs)) return res.status(401).json({ error: 'missing timestamp' });
    if (Math.abs(now - tsMs) > 5 * 60 * 1000) return res.status(401).json({ error: 'stale timestamp' });

    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}), 'utf8');
    const expected = crypto.createHmac('sha256', secret).update(`${ts}.`).update(raw).digest('hex');
    if (!timingSafeEqualStr(sig, expected)) return res.status(401).json({ error: 'bad signature' });
    return next();
  } catch {
    return res.status(401).json({ error: 'signature verification failed' });
  }
}

module.exports = {
  requireAdminCode,
  authMiddleware,
  requireAdmin,
  agentWebhookAuth,
  verifyOrderCreatedWebhook,
};
