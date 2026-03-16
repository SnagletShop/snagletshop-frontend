'use strict';

const { domain, text, requireValue } = require('../../lib/runtimeResolver');

function requireEmailMarketingRuntime() {
  const emailMarketing = domain('emailMarketing') || {};
  const runtime = {
    requireAdmin: emailMarketing.requireAdmin,
    _getEmailMarketingConfig: emailMarketing._getEmailMarketingConfig,
    EmailMarketingConfig: emailMarketing.EmailMarketingConfig,
    EmailJob: emailMarketing.EmailJob,
    EmailSubscriber: emailMarketing.EmailSubscriber,
    Order: emailMarketing.Order,
    DraftOrder: emailMarketing.DraftOrder,
    _verifyHmacToken: emailMarketing._verifyHmacToken,
    _normEmail: emailMarketing._normEmail,
    _upsertSubscriberFromCustomer: emailMarketing._upsertSubscriberFromCustomer,
    _buildUnsubUrl: emailMarketing._buildUnsubUrl,
    _renderEmailShell: emailMarketing._renderEmailShell,
    _enqueueEmail: emailMarketing._enqueueEmail,
    _saveConfigHistory: emailMarketing._saveConfigHistory,
    STORE_PUBLIC_ORIGIN: text(emailMarketing.STORE_PUBLIC_ORIGIN || ''),
  };
  [
    'requireAdmin',
    '_getEmailMarketingConfig',
    'EmailMarketingConfig',
    'EmailJob',
    'EmailSubscriber',
    'Order',
    'DraftOrder',
    '_verifyHmacToken',
    '_normEmail',
    '_upsertSubscriberFromCustomer',
    '_buildUnsubUrl',
    '_renderEmailShell',
    '_enqueueEmail',
    '_saveConfigHistory',
  ].forEach((label) => requireValue(`EMAIL_MARKETING_RUNTIME_NOT_READY:${label}`, runtime[label]));
  return runtime;
}

function safeBool(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

function safeStr(v, n) {
  return String(v == null ? '' : v).trim().slice(0, n);
}

function safeNum(v, d) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}

function safeArrNums(a) {
  return Array.isArray(a)
    ? a.map((x) => safeNum(x, 0)).filter((x) => x > 0 && x < 720).slice(0, 6)
    : [];
}

function buildEmailMarketingConfig(body) {
  return {
    key: 'global',
    enabled: safeBool(body?.enabled),
    sendingEnabled: body?.sendingEnabled == null ? true : safeBool(body?.sendingEnabled),
    softOptInEnabled: safeBool(body?.softOptInEnabled),
    fromName: safeStr(body?.fromName, 80),
    fromEmail: safeStr(body?.fromEmail, 120),
    replyTo: safeStr(body?.replyTo, 120),
    abandonedCart: {
      enabled: safeBool(body?.abandonedCart?.enabled),
      delaysHours: safeArrNums(body?.abandonedCart?.delaysHours),
      stepEnabled: Array.isArray(body?.abandonedCart?.stepEnabled)
        ? body.abandonedCart.stepEnabled.map(safeBool).slice(0, 6)
        : undefined,
      maxEmailsPerDraft: Math.max(1, Math.min(3, Math.floor(safeNum(body?.abandonedCart?.maxEmailsPerDraft, 2)))),
      includeIncentivePct: Math.max(0, Math.min(50, safeNum(body?.abandonedCart?.includeIncentivePct, 0))),
    },
    postPurchase: {
      enabled: safeBool(body?.postPurchase?.enabled),
      delayDays: Math.max(1, Math.min(30, Math.floor(safeNum(body?.postPurchase?.delayDays, 3)))),
      includeIncentivePct: Math.max(0, Math.min(50, safeNum(body?.postPurchase?.includeIncentivePct, 0))),
    },
  };
}

async function handleGetUnsubscribe(req, res) {
  try {
    const runtime = requireEmailMarketingRuntime();
    const token = String(req.query?.token || '');
    const obj = runtime._verifyHmacToken(token);
    const email = runtime._normEmail(obj?.email);
    const exp = Number(obj?.exp || 0) || 0;
    if (!obj || obj.t !== 'unsub' || !email || (exp && Date.now() > exp)) {
      return res.status(400).send('Invalid unsubscribe link.');
    }
    const unsubAt = new Date();
    await runtime.EmailSubscriber.findOneAndUpdate(
      { email },
      { $set: { unsubscribedAt: unsubAt, updatedAt: unsubAt }, $setOnInsert: { createdAt: unsubAt, email } },
      { upsert: true }
    );
    await runtime.Order.updateMany({ 'customer.email': email }, { $set: { 'customer.marketingUnsubscribedAt': unsubAt } }).catch(() => {});
    await runtime.DraftOrder.updateMany({ 'customer.email': email }, { $set: { 'customer.marketingUnsubscribedAt': unsubAt } }).catch(() => {});
    return res.status(200).send('You have been unsubscribed.');
  } catch (_e) {
    return res.status(500).send('Error.');
  }
}

async function handleGetEmailMarketingConfig(_req, res) {
  try {
    const runtime = requireEmailMarketingRuntime();
    const cfg = await runtime._getEmailMarketingConfig();
    return res.json({ ok: true, config: cfg });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handlePutEmailMarketingConfig(req, res) {
  try {
    const runtime = requireEmailMarketingRuntime();
    const prev = await runtime._getEmailMarketingConfig().catch(() => null);
    if (prev) await runtime._saveConfigHistory('emailMarketing', prev, req.user?.sub || '', 'update');
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const next = buildEmailMarketingConfig(body);
    const cfg = await runtime.EmailMarketingConfig.findOneAndUpdate(
      { key: 'global' },
      { $set: next, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );
    return res.json({ ok: true, config: cfg });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handleDeleteEmailMarketingConfig(_req, res) {
  try {
    const runtime = requireEmailMarketingRuntime();
    await runtime.EmailMarketingConfig.deleteOne({ key: 'global' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handleGetEmailMarketingStats(req, res) {
  try {
    const runtime = requireEmailMarketingRuntime();
    const sinceDays = Math.max(1, Math.min(180, Number(req.query?.days || 30) || 30));
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const sent = await runtime.EmailJob.countDocuments({ status: 'SENT', sentAt: { $gte: since } });
    const pending = await runtime.EmailJob.countDocuments({ status: 'PENDING' });
    const subs = await runtime.EmailSubscriber.countDocuments({ unsubscribedAt: null });
    const unsub = await runtime.EmailSubscriber.countDocuments({ unsubscribedAt: { $ne: null } });
    return res.json({ ok: true, sentLastDays: sent, pending, subscribersActive: subs, subscribersUnsubscribed: unsub });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handlePostEmailMarketingSendTest(req, res) {
  try {
    const runtime = requireEmailMarketingRuntime();
    const email = runtime._normEmail(req.body?.email);
    if (!email) return res.status(400).json({ ok: false, error: 'INVALID_EMAIL' });
    await runtime._upsertSubscriberFromCustomer({ email, explicitOptIn: true, origin: 'admin_test', meta: {} });
    const unsub = runtime._buildUnsubUrl({ email, origin: runtime.STORE_PUBLIC_ORIGIN || '' });
    const html = runtime._renderEmailShell({
      title: 'Test email',
      bodyHtml: '<div style="font-size:14px;line-height:1.5"><p style="margin:0 0 10px 0">This is a test email from your marketing automations.</p></div>',
      footerHtml: unsub ? `Unsubscribe: <a href="${unsub}">Unsubscribe</a>` : '',
    });
    await runtime._enqueueEmail({
      type: 'admin_test',
      to: email,
      subject: 'Test email',
      html,
      scheduledAt: new Date(Date.now() + 1500),
      meta: { key: `test:${Date.now()}` },
    });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

module.exports = {
  requireEmailMarketingRuntime,
  handleGetUnsubscribe,
  handleGetEmailMarketingConfig,
  handlePutEmailMarketingConfig,
  handleDeleteEmailMarketingConfig,
  handleGetEmailMarketingStats,
  handlePostEmailMarketingSendTest,
};
