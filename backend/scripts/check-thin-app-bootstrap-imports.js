'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'app', 'bootstrapApp.js');
const src = fs.readFileSync(file, 'utf8');

function fail(msg) {
  console.error(`[check-thin-app-bootstrap-imports] ${msg}`);
  process.exit(1);
}

if (!src.includes("require('./boot/getAppBootstrapSteps')")) {
  fail('bootstrapApp.js must lazy-require ./boot/getAppBootstrapSteps');
}

const forbidden = [
  "require('./createApp')",
  "require('./boot/shouldLoadLegacy')",
  "require('./router/registerRoutes')",
  "require('./router/adminGateRouter')",
];

for (const needle of forbidden) {
  if (src.includes(needle)) fail(`bootstrapApp.js still eagerly imports ${needle}`);
}

console.log('[check-thin-app-bootstrap-imports] ok');
