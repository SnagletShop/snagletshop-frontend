'use strict';

function isTruthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function isFalsy(value) {
  return ['0', 'false', 'no', 'off'].includes(String(value || '').trim().toLowerCase());
}

function getExplicitBootMode(env = process.env) {
  const raw = String(env.SNAGLET_BOOT_MODE || '').trim().toLowerCase();
  if (!raw) return '';
  if (['modular', 'modular-only', 'modular_only'].includes(raw)) return 'modular-only';
  return 'modular-only';
}

function shouldLoadLegacy() {
  return false;
}

function getRequestedBootMode() {
  return 'modular-only';
}

function getBootEnvSnapshot(env = process.env) {
  return {
    SNAGLET_BOOT_MODE: String(env.SNAGLET_BOOT_MODE || ''),
    SNAGLET_MODULAR_ONLY: String(env.SNAGLET_MODULAR_ONLY || ''),
    legacyBridgeAvailable: 'false',
  };
}

module.exports = {
  shouldLoadLegacy,
  getRequestedBootMode,
  getBootEnvSnapshot,
  getExplicitBootMode,
  isTruthy,
  isFalsy,
};
