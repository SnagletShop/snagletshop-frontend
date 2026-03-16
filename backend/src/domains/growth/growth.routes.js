'use strict';

const express = require('express');
const { getGrowthRouteState } = require('../../lib/middlewareState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const svc = require('./growth.service');
const { handlePublicRecs } = require('../../lib/publicRecs');

function mountGrowthRoutes(app) {
  const runtimeAdmin = lazyRuntimeMiddleware(getGrowthRouteState, 'admin');
  app.get('/admin/ab/experiments', runtimeAdmin, svc.handleAdminAbList);
  app.post('/admin/ab/experiments', runtimeAdmin, express.json({ limit: '256kb' }), svc.handleAdminAbUpsert);
  app.patch('/admin/ab/experiments/:key', runtimeAdmin, express.json({ limit: '256kb' }), svc.handleAdminAbPatch);
  app.get('/ab/assignments', svc.handleAbAssignments);
  app.get('/recs', handlePublicRecs);
  app.post('/recs/event', express.json({ limit: '128kb' }), svc.handleRecoEvent);
  app.post('/recs/quote', express.json({ limit: '128kb' }), svc.handleRecoQuote);
  app.post('/smart-reco/get', express.json({ limit: '256kb' }), svc.handleSmartRecoGet);
  app.post('/smart-reco/event', express.json({ limit: '128kb' }), svc.handleSmartRecoEvent);
  app.get('/admin/recs/overview', runtimeAdmin, svc.handleAdminRecsOverview);
  app.get('/admin/recs/source/:sourceProductId', runtimeAdmin, svc.handleAdminRecsSource);
  app.patch('/admin/recs/source/:sourceProductId/target/:targetProductId', runtimeAdmin, express.json({ limit: '128kb' }), svc.handleAdminRecsAdjust);
  app.post('/admin/recs/exclusions', runtimeAdmin, express.json({ limit: '128kb' }), svc.handleAdminRecsExclusions);
  app.get('/admin/recs/config', runtimeAdmin, svc.handleAdminRecsConfigGet);
  app.delete('/admin/recs/config', runtimeAdmin, svc.handleAdminRecsConfigDelete);
  app.put('/admin/recs/config', runtimeAdmin, express.json({ limit: '512kb' }), svc.handleAdminRecsConfigPut);
  app.get('/admin/incentives/config', runtimeAdmin, svc.handleGetIncentivesConfig);
  app.put('/admin/incentives/config', runtimeAdmin, express.json({ limit: '256kb' }), svc.handlePutIncentivesConfig);
  app.delete('/admin/incentives/config', runtimeAdmin, svc.handleDeleteIncentivesConfig);
  app.get('/admin/profit/config', runtimeAdmin, svc.handleGetProfitConfig);
  app.put('/admin/profit/config', runtimeAdmin, express.json({ limit: '256kb' }), svc.handlePutProfitConfig);
  app.delete('/admin/profit/config', runtimeAdmin, svc.handleDeleteProfitConfig);
  app.get('/admin/profit/report', runtimeAdmin, svc.handleProfitReport);
  app.post('/admin/login', express.json({ limit: '64kb' }), svc.handleAdminLogin);
}

module.exports = { mountGrowthRoutes };
