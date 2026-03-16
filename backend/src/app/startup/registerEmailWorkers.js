'use strict';

const { patchBootState } = require('../boot/bootState');
const { getRuntime } = require('../runtime/runtimeContainer');

let started = false;

function getFns() {
  const email = getRuntime()?.emailMarketing || {};
  return {
    processQueue: typeof email._processEmailQueueOnce === 'function' ? email._processEmailQueueOnce : null,
    scheduleAbandoned: typeof email._scheduleAbandonedCartEmails === 'function' ? email._scheduleAbandonedCartEmails : null,
    schedulePostPurchase: typeof email._schedulePostPurchaseEmails === 'function' ? email._schedulePostPurchaseEmails : null,
  };
}

async function maybeRun(kind) {
  const fn = getFns()[kind];
  if (typeof fn !== 'function') return;
  await fn();
}

async function registerEmailWorkers() {
  const { processQueue, scheduleAbandoned, schedulePostPurchase } = getFns();
  const available = [processQueue, scheduleAbandoned, schedulePostPurchase].some((fn) => typeof fn === 'function');
  patchBootState({ emailWorkersAvailable: available });
  if (started || !available) return null;
  started = true;
  setInterval(() => { maybeRun('processQueue').catch(() => {}); }, 30 * 1000);
  setInterval(() => { maybeRun('scheduleAbandoned').catch(() => {}); }, 5 * 60 * 1000);
  setInterval(() => { maybeRun('schedulePostPurchase').catch(() => {}); }, 15 * 60 * 1000);
  patchBootState({ emailWorkersStarted: true, emailWorkersStartedAt: new Date().toISOString() });
  return true;
}

module.exports = { registerEmailWorkers };
