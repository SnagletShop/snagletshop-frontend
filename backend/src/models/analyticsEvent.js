'use strict';

const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now, index: true },
  type: { type: String, required: true },
  sessionId: { type: String, index: true },
  path: String,
  websiteOrigin: String,
  product: {
    name: String,
    category: String,
    productLink: String,
    priceEUR: Number,
  },
  userAgent: String,
  referrer: String,
  ip: String,
  extra: mongoose.Schema.Types.Mixed,
}, { minimize: false });

const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

module.exports = { AnalyticsEvent, AnalyticsEventSchema };
