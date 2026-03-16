'use strict';

const fs = require('fs');

const forbidden = [
  'server.legacy.js',
  'src/app/boot/loadLegacyBridge.js',
  'src/app/boot/loadLegacyDomainRuntime.js',
  'src/app/runtime/buildLegacyRuntime.js',
  'src/domains/legacy/bridge.js',
  'src/domains/legacy/bridgeState.js',
  'src/domains/legacy/legacyFootprint.js',
  'src/domains/legacy/legacyRouteAudit.js',
  'scripts/check-legacy-bridge-boot.js',
  'scripts/check-legacy-footprint.js',
  'scripts/check-legacy-route-audit.js',
  'src/app/startup/runLegacyStandaloneStartup.js',
  'src/app/startup/runLegacyStandaloneOnServerStart.js',
];

const present = forbidden.filter((file) => fs.existsSync(file));
if (present.length) {
  throw new Error(`Forbidden legacy cleanup artifacts still present: ${present.join(', ')}`);
}
console.log('Legacy cleanup artifacts verified absent.');
