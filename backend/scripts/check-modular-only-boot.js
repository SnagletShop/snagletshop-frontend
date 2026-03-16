'use strict';

const { shouldLoadLegacy, getRequestedBootMode } = require('../src/app/boot/shouldLoadLegacy');

delete process.env.SNAGLET_BOOT_MODE;
delete process.env.SNAGLET_MODULAR_ONLY;
delete process.env.SNAGLET_LOAD_LEGACY;

if (shouldLoadLegacy()) throw new Error('Expected shouldLoadLegacy() to default to false');
if (getRequestedBootMode() != 'modular-only') throw new Error('Expected modular-only boot mode by default');

process.env.SNAGLET_MODULAR_ONLY = '1';
process.env.SNAGLET_LOAD_LEGACY = '0';
if (shouldLoadLegacy()) throw new Error('Expected shouldLoadLegacy() to be false in modular-only mode');
if (getRequestedBootMode() !== 'modular-only') throw new Error('Expected modular-only boot mode');
console.log('Modular-only boot policy OK');
