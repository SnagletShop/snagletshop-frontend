'use strict';
const express = require('express');
const { registerBaseMiddleware } = require('./boot/registerBaseMiddleware');
const { registerBaseHttpMiddleware } = require('./boot/registerBaseHttpMiddleware');
const { registerStaticFrontend } = require('./boot/registerStaticFrontend');
const { registerRouteLoggingPatch } = require('./boot/registerRouteLoggingPatch');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  registerBaseMiddleware(app);
  registerBaseHttpMiddleware(app);
  registerStaticFrontend(app);
  registerRouteLoggingPatch(app);
  return app;
}

module.exports = { createApp };
