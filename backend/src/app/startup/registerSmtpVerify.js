'use strict';

const { getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('../boot/bootState');

let started = false;

async function verifyTransport(label, transporter, identity) {
  if (!transporter || typeof transporter.verify !== 'function') return false;
  try {
    await transporter.verify();
    console.log(`[smtp] ${label} AUTH OK as`, identity || '(configured)');
    return true;
  } catch (e) {
    console.error(`[smtp] ${label} AUTH FAILED as`, identity || '(configured)', e?.message || e);
    return false;
  }
}

async function registerSmtpVerify() {
  const runtime = getRuntime() || {};
  const emailMarketing = runtime.emailMarketing || {};
  const platform = runtime.platform || {};

  const confirmationTransporter = emailMarketing.confirmationTransporter || null;
  const shopUser = String(emailMarketing.SHOP_SMTP_USER || '').trim();
  const shopPass = String(emailMarketing.SHOP_SMTP_PASS || '').trim();

  const supportTransporter = platform.supportTransporter || null;
  const contactUser = String(platform.CONTACT_SMTP_USER || '').trim();
  const contactPass = String(platform.CONTACT_SMTP_PASS || '').trim();

  const available = !!(
    (confirmationTransporter && typeof confirmationTransporter.verify === 'function') ||
    (supportTransporter && typeof supportTransporter.verify === 'function')
  );

  patchBootState({
    smtpVerifyAvailable: available,
    smtpVerifyStarted: started,
    smtpVerifyShopConfigured: !!(shopUser && shopPass),
    smtpVerifySupportConfigured: !!(contactUser && contactPass),
  });

  if (started) {
    patchBootState({ smtpVerifyAlreadyStarted: true });
    return false;
  }

  started = true;
  patchBootState({
    smtpVerifyStarted: true,
    smtpVerifyAlreadyStarted: false,
    smtpVerifyAt: new Date().toISOString(),
  });

  const results = { shop: false, support: false };

  if (shopUser && shopPass) {
    results.shop = await verifyTransport('shop', confirmationTransporter, shopUser);
  } else {
    console.warn('⚠ [smtp] shop mailer disabled: set SHOP_EMAIL and SHOP_EMAIL_PASSWORD');
  }

  if (contactUser && contactPass) {
    results.support = await verifyTransport('support', supportTransporter, contactUser);
  } else {
    console.warn('⚠ [smtp] support mailer disabled: set SUPPORT_EMAIL and SUPPORT_EMAIL_PASSWORD');
  }

  patchBootState({
    smtpVerifyShopOk: !!results.shop,
    smtpVerifySupportOk: !!results.support,
  });

  return results;
}

module.exports = { registerSmtpVerify };
