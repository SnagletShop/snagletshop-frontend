'use strict';

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { mergeRuntime } = require('../runtime/runtimeContainer');

function parseCorsOrigins() {
  const frontendOrigin = String(process.env.FRONTEND_ORIGIN || '').trim();
  const fromEnv = String(process.env.CORS_ORIGINS || frontendOrigin || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    'https://snagletshop.com',
    'https://www.snagletshop.com',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ];
  return Array.from(new Set([...defaults, ...fromEnv])).map((o) => o.replace(/\/+$/, ''));
}

function buildRequestSecurityState() {
  const allowedOrigins = new Set(parseCorsOrigins());
  const allowNullOrigin = ['true', '1'].includes(String(process.env.ALLOW_NULL_ORIGIN || '').trim().toLowerCase())
    || String(process.env.ALLOW_NULL_ORIGIN || '').trim() === '1';
  const publicTokenSalt = String(process.env.PUBLIC_TOKEN_SALT || '').trim();
  return { allowedOrigins, allowNullOrigin, publicTokenSalt };
}

function syncBaseHttpRuntime() {
  const next = buildRequestSecurityState();
  mergeRuntime({
    requestSecurity: {
      allowedOrigins: next.allowedOrigins,
      allowNullOrigin: next.allowNullOrigin,
    },
    security: {
      publicTokenSalt: next.publicTokenSalt || '',
    },
  });
  return next;
}

function registerBaseHttpMiddleware(app) {
  const { allowedOrigins, allowNullOrigin } = syncBaseHttpRuntime();

  app.use('/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
  const jsonParser = express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  });
  app.use((req, res, next) => {
    if (req.path === '/webhook') return next();
    return jsonParser(req, res, next);
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  }));

  app.use((req, res, next) => {
    if (
      req.path.startsWith('/products')
      || req.path.startsWith('/catalog')
      || req.path.startsWith('/config')
      || req.path.startsWith('/storefront-config')
      || req.path.startsWith('/tariffs')
      || req.path.startsWith('/countries')
      || req.path.startsWith('/recs')
      || req.path.startsWith('/smart-reco')
    ) {
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.removeHeader('Cross-Origin-Opener-Policy');
    }
    next();
  });

  app.use(compression({ threshold: 1024 }));

  const corsOpts = {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      const normalized = String(origin).replace(/\/+$/, '');
      if (normalized === 'null' && allowNullOrigin) return cb(null, true);
      if (allowedOrigins.has(normalized)) return cb(null, true);
      console.warn('CORS blocked for origin:', origin);
      return cb(new Error('CORS blocked'), false);
    },
    credentials: true,
  };

  app.use(cors(corsOpts));
  app.options('*', cors(corsOpts));
}

module.exports = {
  parseCorsOrigins,
  buildRequestSecurityState,
  syncBaseHttpRuntime,
  registerBaseHttpMiddleware,
};
