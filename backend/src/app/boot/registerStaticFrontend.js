'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

function getFrontendDirCandidates() {
  const envDir = process.env.FRONTEND_DIR || process.env.SNAGLETSHOP_FRONTEND_DIR || '';
  return [
    envDir,
    path.resolve(__dirname, '../../..', 'frontend'),
    path.resolve(process.cwd(), 'frontend'),
    path.resolve(process.cwd(), '../frontend')
  ].filter(Boolean);
}

function getFrontendDir() {
  return getFrontendDirCandidates().find((dir) => {
    try { return fs.existsSync(dir) && fs.statSync(dir).isDirectory(); } catch { return false; }
  }) || path.resolve(__dirname, '../../..', 'frontend');
}

function shouldServeSpaFallback(req) {
  if (!req || req.method !== 'GET') return false;
  const accept = String(req.headers?.accept || '');
  if (!accept.includes('text/html')) return false;
  const p = String(req.path || '/');
  if (p === '/' || p === '/index.html') return true;
  if (p.includes('.')) return false;
  const blockedPrefixes = [
    '/api/', '/health', '/catalog', '/public-config', '/ab/', '/tariffs', '/countries', '/storefront-config',
    '/create-payment-intent', '/finalize-order', '/store-user-details', '/order-status/', '/order-by-payment-intent/',
    '/payment-intent-status/', '/send-message', '/analytics/', '/recs', '/smart-reco/', '/products/'
  ];
  return !blockedPrefixes.some((prefix) => p === prefix.replace(/\/$/, '') || p.startsWith(prefix));
}

function registerStaticFrontend(app) {
  if (!app || typeof app.use !== 'function') return false;
  const frontendDir = getFrontendDir();
  if (!fs.existsSync(frontendDir)) return false;
  app.use(express.static(frontendDir));
  app.get(/.*/, (req, res, next) => {
    if (!shouldServeSpaFallback(req)) return next();
    return res.sendFile(path.join(frontendDir, 'index.html'));
  });
  return true;
}

module.exports = { registerStaticFrontend, getFrontendDir, getFrontendDirCandidates, shouldServeSpaFallback };
