'use strict';

const { domain, bool, prefer, mergeDomain } = require('./runtimeResolver');

function syncRequestSecurityRuntimeFromGlobals() {
  const runtime = domain('requestSecurity') || {};
  mergeDomain('requestSecurity', {
    allowedOrigins: prefer(runtime.allowedOrigins, undefined),
    allowNullOrigin: bool(prefer(runtime.allowNullOrigin, process.env.ALLOW_NULL_ORIGIN), false),
  });
  return domain('requestSecurity');
}

function getRequestSecurityState() {
  const runtime = domain('requestSecurity') || {};
  return {
    allowedOrigins: runtime.allowedOrigins,
    allowNullOrigin: bool(prefer(runtime.allowNullOrigin, process.env.ALLOW_NULL_ORIGIN), false),
  };
}

module.exports = { getRequestSecurityState, syncRequestSecurityRuntimeFromGlobals };
