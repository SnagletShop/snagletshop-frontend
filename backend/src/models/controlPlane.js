'use strict';

const mongoose = require('mongoose');

const FeatureFlagsConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: Object, default: {} },
}, { timestamps: true });

const ConfigHistorySchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: () => new Date(), index: true },
  adminEmail: { type: String, default: '' },
  note: { type: String, default: '' },
});

const OpsAlertSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  severity: { type: String, default: 'info', index: true },
  message: { type: String, default: '' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: () => new Date() },
  ackAt: { type: Date, default: null },
  ackBy: { type: String, default: '' },
});
OpsAlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

const FeatureFlagsConfig = mongoose.models.FeatureFlagsConfig || mongoose.model('FeatureFlagsConfig', FeatureFlagsConfigSchema);
const ConfigHistory = mongoose.models.ConfigHistory || mongoose.model('ConfigHistory', ConfigHistorySchema);
const OpsAlert = mongoose.models.OpsAlert || mongoose.model('OpsAlert', OpsAlertSchema);

module.exports = {
  FeatureFlagsConfigSchema,
  ConfigHistorySchema,
  OpsAlertSchema,
  FeatureFlagsConfig,
  ConfigHistory,
  OpsAlert,
};
