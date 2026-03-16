'use strict';

function sanitizeNoCRLF(v, maxLen) {
  const s = String(v ?? '').replace(/[\r\n]/g, ' ').trim();
  return Number.isFinite(maxLen) && s.length > maxLen ? s.slice(0, maxLen) : s;
}

function sanitizeMessage(v, maxLen) {
  let s = String(v ?? '');
  s = s.replace(/\u0000/g, '');
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  s = s.trim();
  if (Number.isFinite(maxLen) && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function isValidEmail(email) {
  if (!email) return false;
  if (email.length > 200) return false;
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

module.exports = {
  sanitizeNoCRLF,
  sanitizeMessage,
  isValidEmail,
};
