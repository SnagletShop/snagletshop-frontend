'use strict';

const { domain, text, prefer, mergeDomain } = require('./runtimeResolver');

function syncSecurityRuntimeFromGlobals() {
  const runtime = domain('security') || {};
  mergeDomain('security', {
    publicTokenSalt: text(prefer(runtime.publicTokenSalt, process.env.PUBLIC_TOKEN_SALT, '')),
  });
  return domain('security');
}

function getSecurityState() {
  const runtime = domain('security') || {};
  return {
    publicTokenSalt: text(runtime.publicTokenSalt || process.env.PUBLIC_TOKEN_SALT || ''),
  };
}

module.exports = { getSecurityState, syncSecurityRuntimeFromGlobals };
