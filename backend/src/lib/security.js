'use strict';

const crypto = require('crypto');
const { getSecurityState } = require('./securityState');

function publicTokenHash(token, salt = getSecurityState().publicTokenSalt) {
  return crypto.createHash('sha256').update(String(token) + '|' + String(salt || ''), 'utf8').digest('hex');
}

function timingSafeEqualHex(aHex, bHex) {
  const a = Buffer.from(String(aHex || ''), 'utf8');
  const b = Buffer.from(String(bHex || ''), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { publicTokenHash, timingSafeEqualHex };
