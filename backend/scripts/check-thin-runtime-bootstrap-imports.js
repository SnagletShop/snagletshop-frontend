'use strict';

const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'app', 'boot', 'bootstrapRuntime.js');
const text = fs.readFileSync(target, 'utf8');

function fail(message) {
  console.error(`[check-thin-runtime-bootstrap-imports] ${message}`);
  process.exit(1);
}

if (!text.includes("require('./getRuntimeBootstrapSteps')")) {
  fail('bootstrapRuntime.js must lazy-require ./getRuntimeBootstrapSteps');
}

const banned = [
  "require('./loadEnv')",
  "require('./loadStripeRuntime')",
  "require('./loadDbRuntime')",
  "require('./safetyChecks')",
];

for (const needle of banned) {
  if (text.includes(needle)) fail(`bootstrapRuntime.js should not eagerly import ${needle}`);
}

console.log('[check-thin-runtime-bootstrap-imports] OK');
