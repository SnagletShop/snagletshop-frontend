'use strict';

const express = require('express');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireEmailMarketingRuntime,
  handleGetUnsubscribe,
  handleGetEmailMarketingConfig,
  handlePutEmailMarketingConfig,
  handleDeleteEmailMarketingConfig,
  handleGetEmailMarketingStats,
  handlePostEmailMarketingSendTest,
} = require('./emailMarketing.service');

function mountEmailMarketingRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireEmailMarketingRuntime, 'requireAdmin');
  app.get('/email/unsubscribe', handleGetUnsubscribe);
  app.get('/admin/email-marketing/config', runtimeAuth, handleGetEmailMarketingConfig);
  app.put('/admin/email-marketing/config', runtimeAuth, express.json({ limit: '1mb' }), handlePutEmailMarketingConfig);
  app.delete('/admin/email-marketing/config', runtimeAuth, handleDeleteEmailMarketingConfig);
  app.get('/admin/email-marketing/stats', runtimeAuth, handleGetEmailMarketingStats);
  app.post('/admin/email-marketing/send-test', runtimeAuth, express.json({ limit: '1mb' }), handlePostEmailMarketingSendTest);
}

module.exports = { mountEmailMarketingRoutes };
