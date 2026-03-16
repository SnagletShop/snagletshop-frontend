'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
  return p;
}

function safeWriteJson(filepath, obj) {
  ensureDir(path.dirname(filepath));
  const tmp = `${filepath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, filepath);
}

function isValidDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function parseExpenseDateRange({ from, to }) {
  const fromDate = from ? new Date(from) : new Date('1970-01-01T00:00:00.000Z');
  const toDate = to ? new Date(to) : new Date('2999-12-31T23:59:59.999Z');
  if (!isValidDate(fromDate) || !isValidDate(toDate)) {
    const err = new Error('Invalid from/to date range. Use ISO-8601 values.');
    err.status = 400;
    throw err;
  }
  if (fromDate > toDate) {
    const err = new Error('Invalid date range: from must be before or equal to to.');
    err.status = 400;
    throw err;
  }
  return { from: fromDate, to: toDate };
}

function normalizeExpensePayload(body) {
  const payload = body && typeof body === 'object' ? body : {};
  const date = payload.date != null ? new Date(payload.date) : null;
  const amountEUR = payload.amountEUR != null ? Number(payload.amountEUR) : null;
  if (!date || !isValidDate(date)) {
    const err = new Error('missing or invalid date');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(amountEUR)) {
    const err = new Error('missing or invalid amountEUR');
    err.status = 400;
    throw err;
  }
  return {
    date,
    vendor: String(payload.vendor || ''),
    description: String(payload.description || ''),
    category: String(payload.category || ''),
    amountEUR,
    orderId: payload.orderId ? String(payload.orderId) : null,
  };
}

function normalizeExpensePatch(body) {
  const payload = body && typeof body === 'object' ? body : {};
  const patch = {};
  if (payload.date != null) {
    const date = new Date(payload.date);
    if (!isValidDate(date)) {
      const err = new Error('invalid date');
      err.status = 400;
      throw err;
    }
    patch.date = date;
  }
  if (payload.vendor != null) patch.vendor = String(payload.vendor);
  if (payload.description != null) patch.description = String(payload.description);
  if (payload.category != null) patch.category = String(payload.category);
  if (payload.amountEUR != null) {
    const amountEUR = Number(payload.amountEUR);
    if (!Number.isFinite(amountEUR)) {
      const err = new Error('invalid amountEUR');
      err.status = 400;
      throw err;
    }
    patch.amountEUR = amountEUR;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'orderId')) patch.orderId = payload.orderId ? String(payload.orderId) : null;
  return patch;
}

function getExpensesDir(dataDir) {
  return ensureDir(path.join(dataDir || path.join(process.cwd(), 'data'), 'expenses'));
}

function getExpensesMirrorPath(dataDir) {
  return path.join(getExpensesDir(dataDir), 'expenses.mirror.json');
}

async function mirrorExpensesToFile({ ExpenseModel, dataDir }) {
  try {
    const expenses = await ExpenseModel.find({}).sort({ date: -1 }).lean();
    safeWriteJson(getExpensesMirrorPath(dataDir), { updatedAt: new Date().toISOString(), expenses });
  } catch (e) {
    console.warn('[expenses] mirror failed:', e && e.message ? e.message : e);
  }
}

function buildExpenseUploadFilename(file) {
  const safeBase = String(file?.originalname || 'attachment')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 120);
  return `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${safeBase}`;
}

function assertAttachmentPathWithinExpensesDir(storagePath, dataDir) {
  try {
    const resolved = path.resolve(String(storagePath || ''));
    const baseDir = path.resolve(getExpensesDir(dataDir));
    const within = resolved.startsWith(baseDir + path.sep) || resolved === baseDir;
    if (!within) {
      const err = new Error('invalid attachment path');
      err.status = 400;
      throw err;
    }
    return resolved;
  } catch (error) {
    if (error && error.status) throw error;
    const err = new Error('invalid attachment path');
    err.status = 400;
    throw err;
  }
}

function applyExpensePatch(expense, patch) {
  for (const [key, value] of Object.entries(patch || {})) expense[key] = value;
  return expense;
}

module.exports = {
  parseExpenseDateRange,
  normalizeExpensePayload,
  normalizeExpensePatch,
  getExpensesDir,
  getExpensesMirrorPath,
  mirrorExpensesToFile,
  buildExpenseUploadFilename,
  assertAttachmentPathWithinExpensesDir,
  applyExpensePatch,
};
