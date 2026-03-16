'use strict';

const { getRuntime, mergeRuntime } = require('../app/runtime/runtimeContainer');

function runtime() {
  return getRuntime() || {};
}

function domain(name) {
  return runtime()[name] || null;
}

function hasValue(value) {
  return typeof value !== 'undefined' && value !== null;
}

function prefer(...values) {
  for (const value of values) {
    if (hasValue(value)) return value;
  }
  return undefined;
}

function legacy(_name, fallback) {
  return fallback;
}

function model(name, fallback) {
  const value = runtime().models?.[name];
  return hasValue(value) ? value : legacy(name, fallback);
}

function middleware(name, fallback) {
  const value = runtime().middleware?.[name];
  return hasValue(value) ? value : legacy(name, fallback);
}

function fn(value, fallback) {
  return typeof value === 'function' ? value : fallback;
}

function text(value, fallback = '') {
  const picked = prefer(value, fallback);
  return String(picked || '').trim();
}

function bool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  return !!fallback;
}

function number(value, fallback = 0) {
  const n = Number(prefer(value, fallback) || 0);
  return Number.isFinite(n) ? n : Number(fallback || 0) || 0;
}

function object(value, fallback = {}) {
  return value && typeof value === 'object' ? value : fallback;
}

function array(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function requireValue(label, ...values) {
  const value = prefer(...values);
  if (!hasValue(value)) {
    const err = new Error(`${label}`);
    err.code = String(label || 'RUNTIME_VALUE_MISSING');
    throw err;
  }
  return value;
}

function mergeDomain(name, patch) {
  mergeRuntime({ [name]: patch || {} });
  return domain(name);
}

function assignLegacy(_name, value) {
  return value;
}

module.exports = {
  runtime,
  domain,
  hasValue,
  prefer,
  legacy,
  model,
  middleware,
  fn,
  text,
  bool,
  number,
  object,
  array,
  requireValue,
  mergeDomain,
  assignLegacy,
};
