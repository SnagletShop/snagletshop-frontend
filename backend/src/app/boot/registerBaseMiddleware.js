'use strict';

const express = require('express');

function registerBaseMiddleware(app) {
  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  return app;
}

module.exports = { registerBaseMiddleware };
