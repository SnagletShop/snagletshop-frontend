'use strict';

const fs = require('fs');
const path = require('path');

function mustRead(rel) {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const server = mustRead('server.js');
assert(server.includes("require('./src/app/boot/refreshRuntimeAfterStartup').refreshRuntimeAfterStartup()"), 'server.js should refresh modular runtime after startup jobs');
assert(!server.includes("loadLegacyBridge"), 'server.js should not reference the removed legacy bridge');
assert(!server.includes("server.legacy"), 'server.js should not reference legacy server files');

const refresher = mustRead('src/app/boot/refreshRuntimeAfterStartup.js');
assert(!refresher.includes("loadLegacyDomainRuntime"), 'refreshRuntimeAfterStartup.js should no longer reference legacy domain runtime sync');
assert(refresher.includes('getRuntimeBootstrapSteps') || refresher.includes('buildRuntime'), 'refreshRuntimeAfterStartup.js should rebuild modular runtime after startup');

const bootstrap = mustRead('src/app/bootstrapApp.js');
assert(!bootstrap.includes('domains/legacy'), 'bootstrapApp.js should not import legacy-domain helpers');

console.log('legacy cleanup sync checks ok');
