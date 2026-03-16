'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'app', 'bootstrapApp.js');
const src = fs.readFileSync(file, 'utf8');

if (src.includes("require('./boot/loadLegacyBridge')")) {
  throw new Error('bootstrapApp.js must not require ./boot/loadLegacyBridge after legacy bridge removal');
}
if (src.includes("require('../domains/legacy/bridge')")) {
  throw new Error('bootstrapApp.js should not eagerly require ../domains/legacy/bridge');
}
if (src.includes("require('./boot/loadLegacyDomainRuntime')")) {
  throw new Error('bootstrapApp.js should not require ./boot/loadLegacyDomainRuntime');
}

console.log('bootstrapApp composition verified.');
