'use strict';

const fs = require('fs');
const crypto = require('crypto');
const { patchBootState } = require('../boot/bootState');
const { mergeRuntime } = require('../runtime/runtimeContainer');
const { getTariffsAdminState, syncPlatformStateFromGlobals } = require('../../lib/platformState');
const { getCatalogFileMode } = require('../../lib/catalogFileMode');

let started = false;
let reloadTimer = null;
let watcherPath = '';

function normalizeTariffsObject(value) {
  const src = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const out = Object.create(null);
  for (const [k, v] of Object.entries(src)) {
    const code = String(k || '').trim().toUpperCase();
    if (!code) continue;
    out[code] = Number(v) || 0;
  }
  return out;
}

function buildTariffsJsonCache(obj) {
  return JSON.stringify(obj || Object.create(null));
}

function buildTariffsETag(json) {
  return 'W/"' + crypto.createHash('sha1').update(String(json || '{}')).digest('hex') + '"';
}

function applyTariffsObject(nextTariffs, reason) {
  const { setTariffsInMemory } = getTariffsAdminState();
  const normalized = normalizeTariffsObject(nextTariffs);
  if (typeof setTariffsInMemory === 'function') {
    setTariffsInMemory(normalized, reason || 'registerTariffsAutoRefresh');
    syncPlatformStateFromGlobals();
    return normalized;
  }
  const json = buildTariffsJsonCache(normalized);
  let tariffsLocalMtimeMs = 0;
  try {
    tariffsLocalMtimeMs = watcherPath ? Number(fs.statSync(watcherPath).mtimeMs || 0) || 0 : 0;
  } catch {
    tariffsLocalMtimeMs = 0;
  }
  mergeRuntime({
    platform: {
      tariffsData: normalized,
      tariffsJsonCache: json,
      tariffsETag: buildTariffsETag(json),
      tariffsLocalMtimeMs,
    },
  });
  syncPlatformStateFromGlobals();
  return normalized;
}

function readTariffsFromDisk(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return normalizeTariffsObject(parsed);
}

function reloadTariffsFromDisk(reason) {
  if (!watcherPath) return;
  try {
    const nextTariffs = readTariffsFromDisk(watcherPath);
    applyTariffsObject(nextTariffs, reason || 'watchFile change');
  } catch (e) {
    console.warn('[tariffs] modular reload failed; keeping last known good:', e?.message || e);
  }
}

function scheduleReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    try {
      if (getCatalogFileMode() !== 'products_js') return;
      const runtimeState = getTariffsAdminState();
      const knownMtime = Number(runtimeState.tariffsLocalMtimeMs || 0) || 0;
      const mtime = Number(fs.statSync(runtimeState.LOCAL_TARIFFS_PATH || watcherPath).mtimeMs || 0) || 0;
      if (mtime && knownMtime && mtime === knownMtime) return;
    } catch {}
    reloadTariffsFromDisk('watchFile change');
  }, 250);
}

async function registerTariffsAutoRefresh() {
  const state = getTariffsAdminState();
  watcherPath = String(state.LOCAL_TARIFFS_PATH || '').trim();
  if (started) {
    patchBootState({ tariffsAutoRefreshStarted: true, tariffsAutoRefreshPath: watcherPath || null });
    return;
  }
  if (!watcherPath) {
    patchBootState({ tariffsAutoRefreshStarted: false, tariffsAutoRefreshPath: null });
    return;
  }
  started = true;
  try {
    const dir = String(state.TARIFFS_DIR || '').trim();
    if (dir) fs.mkdirSync(dir, { recursive: true });
  } catch {}

  try {
    if (typeof state.initialiseTariffsStore === 'function') {
      state.initialiseTariffsStore();
    } else {
      const nextTariffs = readTariffsFromDisk(watcherPath);
      applyTariffsObject(nextTariffs, 'boot');
    }
  } catch (e) {
    console.warn('[tariffs] modular init failed; using empty tariffs:', e?.message || e);
    applyTariffsObject(Object.create(null), 'boot fallback');
  }

  try {
    fs.watchFile(watcherPath, { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      scheduleReload();
    });
    patchBootState({
      tariffsAutoRefreshStarted: true,
      tariffsAutoRefreshPath: watcherPath,
    });
    console.log(`[tariffs] modular auto-refresh enabled (watching ${watcherPath})`);
  } catch (e) {
    patchBootState({ tariffsAutoRefreshStarted: false, tariffsAutoRefreshPath: watcherPath });
    console.warn('[tariffs] failed to start modular auto-refresh:', e?.message || e);
  }
}

module.exports = { registerTariffsAutoRefresh };
