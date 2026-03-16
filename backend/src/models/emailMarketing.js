'use strict';

const mongoose = require('mongoose');

const EmailMarketingConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'global', index: true, unique: true },
  enabled: { type: Boolean, default: false },
  fromName: { type: String, default: 'SnagletShop' },
  replyTo: { type: String, default: '' },
  unsubscribeBaseUrl: { type: String, default: '' },
  abandonedCartEnabled: { type: Boolean, default: false },
  abandonedCartDelayHours: { type: Number, default: 24 },
  abandonedCartSecondDelayHours: { type: Number, default: 72 },
  postPurchaseEnabled: { type: Boolean, default: false },
  postPurchaseDelayDays: { type: Number, default: 14 },
  campaignEnabled: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { minimize: false });

EmailMarketingConfigSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });

const EmailSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: 'subscribed', index: true },
  source: { type: String, default: '' },
  unsubscribedAt: { type: Date, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

EmailSubscriberSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });

const EmailJobSchema = new mongoose.Schema({
  status: { type: String, default: 'PENDING', index: true },
  type: { type: String, default: '' },
  to: { type: String, required: true, index: true },
  subject: { type: String, default: '' },
  html: { type: String, default: '' },
  text: { type: String, default: '' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  tries: { type: Number, default: 0 },
  lastError: { type: String, default: '' },
  scheduledAt: { type: Date, default: Date.now, index: true },
  sentAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

EmailJobSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });
EmailJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const EmailSendLogSchema = new mongoose.Schema({
  type: { type: String, default: '', index: true },
  to: { type: String, default: '', index: true },
  key: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false });

EmailSendLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });
EmailSendLogSchema.index({ key: 1 }, { unique: true });

const EmailMarketingConfig = mongoose.models.EmailMarketingConfig || mongoose.model('EmailMarketingConfig', EmailMarketingConfigSchema);
const EmailSubscriber = mongoose.models.EmailSubscriber || mongoose.model('EmailSubscriber', EmailSubscriberSchema);
const EmailJob = mongoose.models.EmailJob || mongoose.model('EmailJob', EmailJobSchema);
const EmailSendLog = mongoose.models.EmailSendLog || mongoose.model('EmailSendLog', EmailSendLogSchema);

module.exports = {
  EmailMarketingConfigSchema,
  EmailSubscriberSchema,
  EmailJobSchema,
  EmailSendLogSchema,
  EmailMarketingConfig,
  EmailSubscriber,
  EmailJob,
  EmailSendLog,
};
