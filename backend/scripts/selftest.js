'use strict';
const { execSync } = require('child_process');

execSync('node scripts/verify-backend-structure.js', { stdio: 'inherit' });
execSync('node scripts/check-boot-files.js', { stdio: 'inherit' });
execSync('node scripts/check-route-manifest.js', { stdio: 'inherit' });
execSync('node scripts/check-bootstrap-app-composition.js', { stdio: 'inherit' });
execSync('node scripts/check-thin-legacy-sync-imports.js', { stdio: 'inherit' });
execSync('node scripts/check-modular-only-boot.js', { stdio: 'inherit' });
execSync('node scripts/check-runtime-global-footprint.js', { stdio: 'inherit' });
execSync('node scripts/check-nonlegacy-global-footprint.js', { stdio: 'inherit' });
execSync('node scripts/check-no-legacy-artifacts.js', { stdio: 'inherit' });
console.log('Selftest OK');
