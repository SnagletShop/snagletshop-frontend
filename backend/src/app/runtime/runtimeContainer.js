'use strict';

let currentRuntime = null;

function setRuntime(runtime) {
  currentRuntime = runtime || null;
  return currentRuntime;
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function deepMerge(base, extra) {
  if (!isPlainObject(base)) return isPlainObject(extra) ? { ...extra } : extra;
  if (!isPlainObject(extra)) return { ...base };
  const out = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isPlainObject(value) && isPlainObject(out[key])) out[key] = deepMerge(out[key], value);
    else out[key] = value;
  }
  return out;
}

function mergeRuntime(...parts) {
  currentRuntime = parts.reduce((acc, part) => deepMerge(acc || {}, part || {}), currentRuntime || {});
  return currentRuntime;
}

function getRuntime() {
  return currentRuntime;
}


function buildRuntime() {
  currentRuntime = deepMerge({}, currentRuntime || {});
  return currentRuntime;
}


function getRuntimeContainer() {
  return {
    get: getRuntime,
    set: setRuntime,
    merge: (...parts) => mergeRuntime(...parts),
    has: hasRuntime,
    clear: clearRuntime,
  };
}

function hasRuntime() {
  return !!currentRuntime;
}

function clearRuntime() {
  currentRuntime = null;
}

module.exports = {
  setRuntime,
  getRuntime,
  getRuntimeContainer,
  hasRuntime,
  clearRuntime,
  mergeRuntime,
  buildRuntime,
};
