'use strict';

const fs = require('fs');
const path = require('path');
const { parseTariffsFromJsonText, validateTariffsObject, timestampSafe, ensureDir, writeJsonAtomic } = require('./tariffs');
const { getTariffsState, getTariffsAdminState, syncTariffsStateFromGlobals } = require('./platformState');


function readLocalTariffsJson() {
  const rt = getTariffsAdminState();
  if (rt.initialiseTariffsStore) rt.initialiseTariffsStore();
  const p = rt.LOCAL_TARIFFS_PATH;
  if (!p || !fs.existsSync(p)) {
    const err = new Error('Local tariffs.json not found');
    err.status = 404;
    throw err;
  }
  return fs.readFileSync(p, 'utf8');
}

function replaceLocalTariffs(payload) {
  const rt = getTariffsAdminState();
  if (rt.initialiseTariffsStore) rt.initialiseTariffsStore();

  let nextTariffs;
  if (typeof payload === 'string') nextTariffs = parseTariffsFromJsonText(payload);
  else if (payload && typeof payload === 'object') nextTariffs = validateTariffsObject(payload);
  else {
    const err = new Error('Missing tariffs payload (send JSON object or text/plain JSON)');
    err.status = 400;
    throw err;
  }

  ensureDir(fs, rt.TARIFFS_DIR);
  if (fs.existsSync(rt.LOCAL_TARIFFS_PATH)) {
    const backupPath = path.join(rt.TARIFFS_DIR, `tariffs.backup.${timestampSafe()}.json`);
    fs.copyFileSync(rt.LOCAL_TARIFFS_PATH, backupPath);
  }

  writeJsonAtomic(fs, rt.LOCAL_TARIFFS_PATH, nextTariffs);
  rt.setTariffsInMemory(nextTariffs, 'admin/tariffs/replace');
  syncTariffsStateFromGlobals();
  const { tariffsData } = getTariffsState();
  return {
    ok: true,
    message: 'Local tariffs.json replaced',
    keys: Object.keys(tariffsData || {}).length,
  };
}

module.exports = {
  readLocalTariffsJson,
  replaceLocalTariffs,
};
