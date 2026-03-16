'use strict';

const { getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('../boot/bootState');

let mongoBootStarted = false;

function resolveMongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snagletshop';
}

async function registerMongoConnection() {
  if (mongoBootStarted) {
    return patchBootState({ mongoStartupStarted: true, mongoStartupAlreadyStarted: true });
  }
  mongoBootStarted = true;

  const runtime = getRuntime() || {};
  const db = runtime.db || {};
  const startup = runtime.startup || {};
  const mongoose = db.mongoose || null;
  const connection = db.connection || (mongoose && mongoose.connection) || null;
  const connect = typeof db.connect === 'function' ? db.connect : null;
  const ensureDbIndexes = typeof startup.ensureDbIndexes === 'function' ? startup.ensureDbIndexes : null;
  const mongoUri = typeof db.mongoUri === 'string' && db.mongoUri.trim() ? db.mongoUri.trim() : resolveMongoUri();

  patchBootState({
    mongoStartupStarted: true,
    mongoStartupAvailable: !!(mongoose && connect),
    mongoStartupUriConfigured: !!mongoUri,
    mongoStartupAt: new Date().toISOString(),
  });

  if (!mongoose || !connect) return patchBootState({ mongoStartupConnected: false });

  mongoose.set('strictQuery', true);

  if (ensureDbIndexes && connection && !connection.__SNAGLET_INDEX_HOOK_ATTACHED__) {
    connection.__SNAGLET_INDEX_HOOK_ATTACHED__ = true;
    connection.on('connected', () => {
      Promise.resolve(ensureDbIndexes()).catch((e) => {
        console.warn('[mongo] index ensure failed (hook):', e && e.message ? e.message : e);
      });
    });
  }

  const readyState = Number(connection && connection.readyState || 0) || 0;
  if (readyState === 1) {
    if (ensureDbIndexes) await ensureDbIndexes();
    return patchBootState({ mongoStartupConnected: true, mongoStartupReadyState: readyState });
  }
  if (readyState === 2) {
    return patchBootState({
      mongoStartupConnected: false,
      mongoStartupReadyState: readyState,
      mongoStartupConnecting: true,
    });
  }

  await connect(mongoUri);
  if (ensureDbIndexes) await ensureDbIndexes();
  return patchBootState({
    mongoStartupConnected: true,
    mongoStartupReadyState: Number(connection && connection.readyState || 0) || 0,
  });
}

module.exports = { registerMongoConnection };
