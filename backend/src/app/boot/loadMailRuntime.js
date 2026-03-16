'use strict';

const nodemailer = require('nodemailer');
const { mergeRuntime, getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('./bootState');

function createTransport(user, pass) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: (user && pass) ? { user, pass } : undefined,
    connectionTimeout: 10000,
  });
}

function loadMailRuntime() {
  const existingEmail = getRuntime()?.emailMarketing || {};
  const existingPlatform = getRuntime()?.platform || {};
  const SHOP_SMTP_USER = String(process.env.SHOP_EMAIL || process.env.STORE_EMAIL || existingEmail.SHOP_SMTP_USER || '').trim();
  const SHOP_SMTP_PASS = String(process.env.SHOP_EMAIL_PASSWORD || existingEmail.SHOP_SMTP_PASS || '').trim();
  const CONTACT_SMTP_USER = String(process.env.SUPPORT_EMAIL || existingPlatform.CONTACT_SMTP_USER || '').trim();
  const CONTACT_SMTP_PASS = String(process.env.SUPPORT_EMAIL_PASSWORD || existingPlatform.CONTACT_SMTP_PASS || '').trim();
  const SUPPORT_TO_EMAIL =
    String(process.env.SUPPORT_EMAIL || '').trim() ||
    String(process.env.ADMIN_EMAIL || '').trim() ||
    String(existingPlatform.SUPPORT_TO_EMAIL || '').trim() ||
    'snagletshophelp@gmail.com';
  const CONTACT_FROM =
    process.env.CONTACT_FROM ||
    existingPlatform.CONTACT_FROM ||
    (CONTACT_SMTP_USER
      ? `Contact Form <${CONTACT_SMTP_USER}>`
      : (SHOP_SMTP_USER ? `Contact Form <${SHOP_SMTP_USER}>` : 'Contact Form <no-reply@snagletshop.com>'));

  const confirmationTransporter = existingEmail.confirmationTransporter || createTransport(SHOP_SMTP_USER, SHOP_SMTP_PASS);
  const supportTransporter = existingPlatform.supportTransporter || createTransport(CONTACT_SMTP_USER, CONTACT_SMTP_PASS);

  mergeRuntime({
    emailMarketing: {
      confirmationTransporter,
      SHOP_SMTP_USER,
      SHOP_SMTP_PASS,
    },
    platform: {
      CONTACT_SMTP_USER,
      CONTACT_SMTP_PASS,
      CONTACT_FROM,
      SUPPORT_TO_EMAIL,
      supportTransporter,
    },
  });

  patchBootState({
    mailRuntimeLoaded: true,
    mailRuntimeLoadedAt: new Date().toISOString(),
    mailRuntimeShopConfigured: !!(SHOP_SMTP_USER && SHOP_SMTP_PASS),
    mailRuntimeSupportConfigured: !!(CONTACT_SMTP_USER && CONTACT_SMTP_PASS),
  });

  return {
    confirmationTransporter,
    supportTransporter,
    SHOP_SMTP_USER,
    SHOP_SMTP_PASS,
    CONTACT_SMTP_USER,
    CONTACT_SMTP_PASS,
    CONTACT_FROM,
    SUPPORT_TO_EMAIL,
  };
}

module.exports = { loadMailRuntime };
