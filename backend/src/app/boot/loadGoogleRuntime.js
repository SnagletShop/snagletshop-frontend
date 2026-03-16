'use strict';

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { patchBootState } = require('./bootState');
const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');

function loadGoogleServiceAccount() {
  try {
    const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (rawJson && rawJson.trim()) return JSON.parse(rawJson);

    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
    if (b64 && b64.trim()) {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    }

    const p = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (p && p.trim()) {
      const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
      const file = fs.readFileSync(abs, 'utf8');
      return JSON.parse(file);
    }
  } catch (e) {
    console.error('Failed to load GOOGLE_SERVICE_ACCOUNT_* credentials:', e?.message || e);
  }
  return null;
}

function createLegacyMarketingTransport() {
  const user = String(process.env.EMAIL_USER || '').trim();
  const pass = String(process.env.EMAIL_PASS || '').trim();
  if (!user || !pass) return null;
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  } catch {
    return null;
  }
}

function loadGoogleRuntime() {
  const existingStartup = getRuntime()?.startup || {};
  const existingEmail = getRuntime()?.emailMarketing || {};
  const serviceAccount = loadGoogleServiceAccount() || existingStartup.googleServiceAccount || null;
  const scopes = existingStartup.SCOPES || [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
  ];

  const googleAuth = serviceAccount
    ? (existingStartup.googleAuth || new google.auth.GoogleAuth({ credentials: serviceAccount, scopes }))
    : null;

  const drive = googleAuth ? (existingStartup.drive || google.drive({ version: 'v3', auth: googleAuth })) : null;
  const sheets = googleAuth ? (existingStartup.sheets || google.sheets({ version: 'v4', auth: googleAuth })) : null;
  const legacyMarketingTransporter = existingEmail.legacyMarketingTransporter || createLegacyMarketingTransport();
  const EMAIL_USER = String(process.env.EMAIL_USER || existingEmail.EMAIL_USER || '').trim();
  const EMAIL_PASS = String(process.env.EMAIL_PASS || existingEmail.EMAIL_PASS || '').trim();

  mergeRuntime({
    startup: {
      googleServiceAccount: serviceAccount,
      googleAuth,
      drive,
      sheets,
      SCOPES: scopes,
    },
    emailMarketing: {
      legacyMarketingTransporter,
      EMAIL_USER,
      EMAIL_PASS,
    },
  });

  patchBootState({
    googleRuntimeLoaded: true,
    googleRuntimeDriveConfigured: !!drive,
    googleRuntimeSheetsConfigured: !!sheets,
    googleRuntimeServiceAccountConfigured: !!serviceAccount,
    legacyMarketingTransportLoaded: !!legacyMarketingTransporter,
  });

  return { serviceAccount, googleAuth, drive, sheets, legacyMarketingTransporter, scopes };
}

module.exports = { loadGoogleRuntime, loadGoogleServiceAccount };
