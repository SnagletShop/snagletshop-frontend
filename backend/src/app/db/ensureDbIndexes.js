'use strict';

const mongoose = require('mongoose');
const { getRuntime } = require('../runtime/runtimeContainer');

let indexesEnsured = false;

function pickModel(name) {
  const runtime = getRuntime() || {};
  const models = runtime.models || {};
  return models[name] || (mongoose.models && mongoose.models[name]) || global[name] || null;
}

async function ensureTtlIndex(model, indexName, key, expireAfterSeconds) {
  try {
    if (!model || !model.collection || typeof model.collection.indexes !== 'function') return;
    const col = model.collection;
    const indexes = await col.indexes();
    const existing = (indexes || []).find((i) => i && i.name === indexName);

    const hasTTL = existing && Object.prototype.hasOwnProperty.call(existing, 'expireAfterSeconds');
    const currentTTL = hasTTL ? existing.expireAfterSeconds : null;

    if (existing && currentTTL === expireAfterSeconds) return;

    if (existing) {
      try { await col.dropIndex(indexName); } catch (_) { /* ignore */ }
    }

    await col.createIndex(key, { name: indexName, expireAfterSeconds, background: true });
  } catch (e) {
    console.warn(`[mongo] TTL index ensure failed (${model?.modelName || 'unknown'}.${indexName}):`, e?.message || e);
  }
}

async function ensureDbIndexes() {
  if (indexesEnsured) return;
  indexesEnsured = true;

  const Order = pickModel('Order');
  const DraftOrder = pickModel('DraftOrder');
  const InvoiceCounter = pickModel('InvoiceCounter');
  const CatalogCategory = pickModel('CatalogCategory');
  const RecoConfig = pickModel('RecoConfig');
  const RecoStats = pickModel('RecoStats');
  const RecoGlobalStats = pickModel('RecoGlobalStats');
  const RecoExclusion = pickModel('RecoExclusion');
  const RecoEvent = pickModel('RecoEvent');
  const RecoDiscountRedemption = pickModel('RecoDiscountRedemption');
  const ProductSalesSummary = pickModel('ProductSalesSummary');
  const RecoAdminAction = pickModel('RecoAdminAction');
  const SmartRecoModel = pickModel('SmartRecoModel');
  const SmartRecoImpression = pickModel('SmartRecoImpression');
  const SmartRecoEvent = pickModel('SmartRecoEvent');
  const OpsAlert = pickModel('OpsAlert');
  const ConfigHistory = pickModel('ConfigHistory');
  const EmailMarketingConfig = pickModel('EmailMarketingConfig');
  const EmailSubscriber = pickModel('EmailSubscriber');
  const EmailJob = pickModel('EmailJob');
  const EmailSendLog = pickModel('EmailSendLog');

  try {
    await ensureTtlIndex(Order, 'expiresAt_1', { expiresAt: 1 }, 0);
    await ensureTtlIndex(DraftOrder, 'expiresAt_1', { expiresAt: 1 }, 0);
    await ensureTtlIndex(OpsAlert, 'createdAt_1', { createdAt: 1 }, 60 * 60 * 24 * 60);
    await ensureTtlIndex(EmailJob, 'createdAt_1', { createdAt: 1 }, 60 * 60 * 24 * 90);
    await ensureTtlIndex(EmailSendLog, 'sentAt_1', { sentAt: 1 }, 60 * 60 * 24 * 365);
    await ensureTtlIndex(RecoEvent, 'createdAt_1', { createdAt: 1 }, 60 * 60 * 24 * 90);
    await ensureTtlIndex(SmartRecoImpression, 'createdAt_1', { createdAt: 1 }, 60 * 60 * 24 * 14);
    await ensureTtlIndex(SmartRecoEvent, 'createdAt_1', { createdAt: 1 }, 60 * 60 * 24 * 90);
    await ensureTtlIndex(RecoDiscountRedemption, 'expiresAt_1', { expiresAt: 1 }, 0);

    const models = [
      Order,
      DraftOrder,
      InvoiceCounter,
      CatalogCategory,
      RecoConfig,
      RecoStats,
      RecoGlobalStats,
      RecoExclusion,
      RecoEvent,
      RecoDiscountRedemption,
      ProductSalesSummary,
      RecoAdminAction,
      SmartRecoModel,
      SmartRecoImpression,
      SmartRecoEvent,
      OpsAlert,
      ConfigHistory,
      EmailMarketingConfig,
      EmailSubscriber,
      EmailJob,
      EmailSendLog,
    ].filter(Boolean);

    for (const model of models) {
      if (typeof model.createIndexes === 'function') await model.createIndexes();
    }

    console.log('[mongo] indexes ensured');
  } catch (e) {
    console.warn('[mongo] index ensure failed (continuing):', e?.message || e);
  }
}

module.exports = {
  ensureTtlIndex,
  ensureDbIndexes,
};
