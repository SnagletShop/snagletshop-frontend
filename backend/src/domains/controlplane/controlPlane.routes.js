'use strict';

const express = require('express');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  requireControlPlaneRuntime,
  handleGetFeatureFlagsConfig,
  handlePutFeatureFlagsConfig,
  handleDeleteFeatureFlagsConfig,
  handleGetConfigHistory,
  handlePostConfigRollback,
  handleGetOpsAlerts,
  handlePostOpsAlertAck,
} = require('./controlPlane.service');

function mountControlPlaneRoutes(app) {
  const runtimeAuth = lazyRuntimeMiddleware(requireControlPlaneRuntime, 'requireAdmin');
  app.get('/admin/feature-flags/config', runtimeAuth, handleGetFeatureFlagsConfig);
  app.put('/admin/feature-flags/config', runtimeAuth, express.json({ limit: '1mb' }), handlePutFeatureFlagsConfig);
  app.delete('/admin/feature-flags/config', runtimeAuth, handleDeleteFeatureFlagsConfig);
  app.get('/admin/config-history', runtimeAuth, handleGetConfigHistory);
  app.post('/admin/config-rollback', runtimeAuth, express.json({ limit: '1mb' }), handlePostConfigRollback);
  app.get('/admin/ops/alerts', runtimeAuth, handleGetOpsAlerts);
  app.post('/admin/ops/alerts/:id/ack', runtimeAuth, handlePostOpsAlertAck);
}

module.exports = { mountControlPlaneRoutes };
