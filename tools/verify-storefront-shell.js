#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const scriptPath = path.join(root, 'script.js');
const requiredScripts = [
  'src/app/create-app.js',
  'src/app/router.js',
  'src/app/main.js',
  'src/app/diagnostics.js',
  'src/app/public-api.js',
  'src/state/runtime-store.js',
  'src/core/shared-data.js',
  'src/services/catalog-service.js',
  'src/screens/index.js',
  'src/domains/catalog-runtime.js',
  'src/domains/catalog-image-runtime.js',
  'src/domains/checkout-runtime.js',
  'src/domains/stripe-config-runtime.js',
  'src/domains/checkout-ui.js',
  'src/domains/modal-runtime.js',
  'src/domains/basket-runtime.js',
  'src/domains/settings-country-runtime.js',
  'src/domains/cart-runtime.js',
  'src/core/utils-runtime.js',
  'src/core/storage-runtime.js',
  'src/domains/product-id-runtime.js',
  'src/app/loader-runtime.js',
  'src/app/boot-runtime.js'
];

function fail(msg) {
  console.error('FAIL:', msg);
  process.exitCode = 1;
}

function ok(msg) {
  console.log('OK:', msg);
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const scriptJs = fs.readFileSync(scriptPath, 'utf8');

for (const rel of requiredScripts) {
  if (!indexHtml.includes(rel)) fail(`index.html missing script include: ${rel}`);
  else ok(`script include present: ${rel}`);
}

const fnMatches = [...scriptJs.matchAll(/^function\s+([A-Za-z0-9_]+)\s*\(/gm)].map((m) => m[1]);
const counts = new Map();
for (const name of fnMatches) counts.set(name, (counts.get(name) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
if (duplicates.length) fail(`duplicate top-level functions found: ${duplicates.map(([name, count]) => `${name}x${count}`).join(', ')}`);
else ok('no duplicate top-level functions in script.js');

const requiredMarkers = [
  'renderCatalogProducts',
  'renderSettingsScreen',
  '__ssSyncCentralState'
];
for (const marker of requiredMarkers) {
  if (!scriptJs.includes(marker)) fail(`script.js missing expected migration marker: ${marker}`);
  else ok(`marker present: ${marker}`);
}

const lineCount = scriptJs.split(/\r?\n/).length;
console.log('INFO: script.js lines =', lineCount);
if (lineCount > 3000) fail('script.js grew past 5200 lines after hardening pass');
else ok('script.js stayed within expected hardening threshold');



const wsCount = (indexHtml.match(/new WebSocket\(/g) || []).length;
if (wsCount !== 0) fail(`index.html still contains ${wsCount} WebSocket live-reload snippet(s)`);
else ok('no live-reload websocket snippets remain in index.html');

if (process.exitCode) process.exit(process.exitCode);
console.log('verify-storefront-shell: OK');

if (indexHtml.includes('basket.html') || scriptJs.includes('basket.html')) fail('legacy basket.html path still referenced in runtime');
else ok('no basket.html runtime references remain');
