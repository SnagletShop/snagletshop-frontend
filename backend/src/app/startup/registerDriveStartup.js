'use strict';

const { getRuntime } = require('../runtime/runtimeContainer');

async function maybeRun(fn, ...args) {
  if (typeof fn !== 'function') return;
  await fn(...args);
}

async function registerDriveStartup() {
  const runtime = getRuntime() || {};
  const startup = runtime.startup || {};

  const enableDriveStartup = String(process.env.ENABLE_DRIVE_STARTUP || '').toLowerCase() === 'true';
  if (!enableDriveStartup) return { started: false, reason: 'disabled' };

  const fileId = String(
    process.env.GOOGLE_DRIVE_FILE_ID ||
    process.env.GOOGLE_SHEET_ID ||
    process.env.GOOGLE_SPREADSHEET_ID ||
    ''
  ).trim();
  const shareEmail = String(
    process.env.DRIVE_SHARE_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.STORE_EMAIL ||
    ''
  ).trim();

  try {
    await maybeRun(startup.debugListDriveFiles, fileId);
  } catch (e) {
    console.warn('⚠️ debugListDriveFiles failed:', e?.message || e);
  }

  try {
    if (fileId && shareEmail) await maybeRun(startup.shareFileWithUser, fileId, shareEmail);
  } catch (e) {
    console.warn('⚠️ shareFileWithUser failed:', e?.message || e);
  }

  return {
    started: true,
    available: {
      debugListDriveFiles: typeof startup.debugListDriveFiles === 'function',
      shareFileWithUser: typeof startup.shareFileWithUser === 'function',
    },
    fileIdConfigured: !!fileId,
    shareEmailConfigured: !!shareEmail,
  };
}

module.exports = { registerDriveStartup };
