'use strict';

const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const { patchBootState } = require('../boot/bootState');
const { syncStartupRuntimeFromGlobals, getStartupState } = require('../../lib/startupState');

let started = false;

async function runDailyReportOnce() {
  syncStartupRuntimeFromGlobals();
  const { sendAdminEmail, buildDbSnapshotZip, projectRoot } = getStartupState();
  if (typeof sendAdminEmail !== 'function' || typeof buildDbSnapshotZip !== 'function') {
    throw new Error('DAILY_REPORT_NOT_READY');
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('sk-SK').split('.').join('-');
  const baseDir = String(projectRoot || process.cwd());
  const ordersDir = path.join(baseDir, 'orders');

  const attachments = [];
  const dayTxt = path.join(ordersDir, `day-orders-${dateStr}.txt`);
  const dayXlsx = path.join(ordersDir, `day-orders-${dateStr}.xlsx`);

  if (fs.existsSync(dayTxt)) attachments.push({ filename: `day-orders-${dateStr}.txt`, path: dayTxt });
  if (fs.existsSync(dayXlsx)) attachments.push({ filename: `day-orders-${dateStr}.xlsx`, path: dayXlsx });

  const dbSnapZip = await buildDbSnapshotZip({ dateStr, outDir: baseDir });
  if (dbSnapZip && fs.existsSync(dbSnapZip)) {
    attachments.push({ filename: `db-snapshot-${dateStr}.zip`, path: dbSnapZip });
  }

  const emailBody =
    `Krásny deň Ti prajem, Majko,

` +
    `V prílohe sú denné súbory objednávok za ${dateStr} a kompletný DB snapshot (orders + products).

` +
    `S pozdravom,
SnagletBot`;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;
  if (!adminEmail) {
    console.warn('⚠ [daily-report] ADMIN_EMAIL/STORE_EMAIL not set; skipping daily report email');
    return false;
  }

  await sendAdminEmail({
    to: adminEmail,
    subject: `Denné reporty objednávok - ${dateStr}`,
    text: emailBody,
    attachments,
  });
  return true;
}

async function registerDailyReportScheduler() {
  syncStartupRuntimeFromGlobals();
  const { sendAdminEmail, buildDbSnapshotZip } = getStartupState();
  const available = typeof sendAdminEmail === 'function' && typeof buildDbSnapshotZip === 'function';
  patchBootState({
    dailyReportSchedulerStarted: started,
    dailyReportSchedulerAvailable: available,
    dailyReportCron: '0 0 * * *',
  });
  if (started || !available) return false;

  schedule.scheduleJob('0 0 * * *', async () => {
    try {
      await runDailyReportOnce();
      patchBootState({ dailyReportLastSuccessAt: new Date().toISOString(), dailyReportLastError: null });
    } catch (e) {
      patchBootState({ dailyReportLastError: e?.message || String(e), dailyReportLastErrorAt: new Date().toISOString() });
      console.warn('[daily-report] scheduler run failed:', e?.message || e);
    }
  });

  started = true;
  patchBootState({
    dailyReportSchedulerStarted: true,
    dailyReportSchedulerAvailable: true,
    dailyReportSchedulerAt: new Date().toISOString(),
  });
  return true;
}

module.exports = { registerDailyReportScheduler, runDailyReportOnce };
