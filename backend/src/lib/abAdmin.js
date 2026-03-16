'use strict';

const { abClamp01 } = require('./growth');

const AB_KEY_RE = /^[a-z0-9_-]+$/i;

function normalizeActor(user) {
  return String((user && user.email) || user?.id || user?.sub || 'admin').slice(0, 120);
}

function normalizeAbKey(value) {
  return String(value || '').trim();
}

function isValidAbKey(key) {
  return !!key && key.length <= 16 && AB_KEY_RE.test(key);
}

function assertValidAbKey(key) {
  const normalized = normalizeAbKey(key);
  if (!isValidAbKey(normalized)) {
    const err = new Error('invalid key');
    err.status = 400;
    throw err;
  }
  return normalized;
}

function mergeAbExperimentConfigs(defaults, configs) {
  const cfgs = configs || {};
  const defs = defaults || {};
  const keys = Array.from(new Set([...Object.keys(defs), ...Object.keys(cfgs)]));
  return keys.map((key) => {
    const def = defs[key] || { enabled: true, bWeight: 0.5 };
    const cfg = cfgs[key] || {};
    return {
      key,
      name: String(cfg.name || ''),
      description: String(cfg.description || ''),
      enabled: (cfg.enabled != null) ? !!cfg.enabled : !!def.enabled,
      bWeight: (cfg.bWeight != null) ? abClamp01(cfg.bWeight, def.bWeight) : abClamp01(def.bWeight, 0.5),
      updatedAt: cfg.updatedAt || null,
      updatedBy: String(cfg.updatedBy || '')
    };
  });
}

function buildAbUpsertPayload(body, user) {
  return {
    key: assertValidAbKey(body?.key),
    update: {
      name: String(body?.name || '').slice(0, 120),
      description: String(body?.description || '').slice(0, 2000),
      enabled: !!body?.enabled,
      bWeight: abClamp01(body?.bWeight, 0.5),
      updatedBy: normalizeActor(user)
    }
  };
}

function buildAbPatchPayload(keyInput, body, user) {
  const key = assertValidAbKey(keyInput);
  const set = {};
  if (body?.name != null) set.name = String(body.name || '').slice(0, 120);
  if (body?.description != null) set.description = String(body.description || '').slice(0, 2000);
  if (body?.enabled != null) set.enabled = !!body.enabled;
  if (body?.bWeight != null) set.bWeight = abClamp01(body.bWeight, 0.5);
  set.updatedBy = normalizeActor(user);
  return { key, set };
}

module.exports = {
  normalizeActor,
  normalizeAbKey,
  isValidAbKey,
  assertValidAbKey,
  mergeAbExperimentConfigs,
  buildAbUpsertPayload,
  buildAbPatchPayload
};
