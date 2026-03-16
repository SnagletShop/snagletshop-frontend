'use strict';

const express = require('express');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireAnalyticsRuntime,
  handleGetMetricsDimensions,
  handleGetMetricsTimeseries,
  handleGetAnalyticsSettings,
  handlePostAnalyticsSettings,
  handleGetAnalyticsEvents,
  handleGetAnalyticsEngagementSummary,
  handleGetAnalyticsEngagementTopProducts,
  handleGetAnalyticsEngagementEvents,
  handlePostAnalyticsEvent,
} = require('./analytics.service');

function mountAnalyticsRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireAnalyticsRuntime, 'authMiddleware');
  const runtimeAnalyticsLimiter = lazyRuntimeMiddleware(requireAnalyticsRuntime, 'analyticsLimiter');
  app.get('/admin/metrics/dimensions', runtimeAuth, handleGetMetricsDimensions);
  app.get('/admin/metrics/timeseries', runtimeAuth, handleGetMetricsTimeseries);
  app.get('/admin/analytics/settings', runtimeAuth, handleGetAnalyticsSettings);
  app.post('/admin/analytics/settings', runtimeAuth, express.json({ limit: '1mb' }), handlePostAnalyticsSettings);
  app.get('/admin/analytics/events', runtimeAuth, handleGetAnalyticsEvents);
  app.get('/admin/analytics/engagement/summary', runtimeAuth, handleGetAnalyticsEngagementSummary);
  app.get('/admin/analytics/engagement/top-products', runtimeAuth, handleGetAnalyticsEngagementTopProducts);
  app.get('/admin/analytics/engagement/events', runtimeAuth, handleGetAnalyticsEngagementEvents);
  app.post('/analytics/event', runtimeAnalyticsLimiter, express.json({ limit: '256kb' }), handlePostAnalyticsEvent);
}

module.exports = { mountAnalyticsRoutes };
