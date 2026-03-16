'use strict';

function validateTariffsObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('tariffs.json must be a JSON object of { "US": 0.6, ... }');
  }
  const out = Object.create(null);
  for (const [k, v] of Object.entries(obj)) {
    const code = String(k || '').trim().toUpperCase();
    if (!code) continue;
    if (code.length < 2 || code.length > 10) {
      throw new Error(`Invalid country code key "${k}" in tariffs.json`);
    }
    if (v == null) continue;
    const num = Number(v);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error(`Invalid tariff value for "${code}": ${v}`);
    }
    out[code] = num;
  }
  return out;
}

function parseTariffsFromJsonText(txt) {
  if (typeof txt !== 'string' || !txt.trim()) throw new Error('Empty tariffs payload');
  let parsed;
  try {
    parsed = JSON.parse(txt);
  } catch {
    throw new Error('Invalid JSON (tariffs.json)');
  }
  return validateTariffsObject(parsed);
}

function timestampSafe() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureDir(fs, dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJsonAtomic(fs, file, obj) {
  const json = JSON.stringify(obj, null, 2) + '\n';
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, file);
}

function sendJsonWithCacheHeaders(res, jsonText, { etag, lastModifiedUtc } = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (etag) res.setHeader('ETag', etag);
  if (lastModifiedUtc) res.setHeader('Last-Modified', lastModifiedUtc);
  res.send(jsonText);
}

module.exports = {
  validateTariffsObject,
  parseTariffsFromJsonText,
  timestampSafe,
  ensureDir,
  writeJsonAtomic,
  sendJsonWithCacheHeaders,
};
