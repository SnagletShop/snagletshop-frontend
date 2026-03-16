'use strict';

const { domain, requireValue } = require('../../lib/runtimeResolver');

function requireControlPlaneRuntime() {
  const controlPlane = domain('controlPlane') || {};
  const runtime = {
    requireAdmin: controlPlane.requireAdmin,
    _getFeatureFlagsConfig: controlPlane._getFeatureFlagsConfig,
    _setFeatureFlagsConfig: controlPlane._setFeatureFlagsConfig,
    _saveConfigHistory: controlPlane._saveConfigHistory,
    FeatureFlagsConfig: controlPlane.FeatureFlagsConfig,
    DEFAULT_FEATURE_FLAGS: controlPlane.DEFAULT_FEATURE_FLAGS,
    _resetFeatureFlagsConfig: controlPlane._resetFeatureFlagsConfig,
    ConfigHistory: controlPlane.ConfigHistory,
    OpsAlert: controlPlane.OpsAlert,
    _getProfitConfigRuntime: controlPlane._getProfitConfigRuntime,
    _getIncentivesConfigRuntime: controlPlane._getIncentivesConfigRuntime,
    _getEmailMarketingConfigRuntime: controlPlane._getEmailMarketingConfigRuntime,
    _setProfitConfig: controlPlane._setProfitConfig,
    _setIncentivesConfig: controlPlane._setIncentivesConfig,
    _setEmailMarketingConfig: controlPlane._setEmailMarketingConfig,
  };
  [
    'requireAdmin',
    '_getFeatureFlagsConfig',
    '_setFeatureFlagsConfig',
    '_saveConfigHistory',
    'FeatureFlagsConfig',
    'DEFAULT_FEATURE_FLAGS',
    '_resetFeatureFlagsConfig',
    'ConfigHistory',
    'OpsAlert',
    '_getProfitConfigRuntime',
    '_getIncentivesConfigRuntime',
    '_getEmailMarketingConfigRuntime',
    '_setProfitConfig',
    '_setIncentivesConfig',
    '_setEmailMarketingConfig',
  ].forEach((label) => requireValue(`CONTROL_PLANE_RUNTIME_NOT_READY:${label}`, runtime[label]));
  return runtime;
}

async function handleGetFeatureFlagsConfig(_req, res) {
  try {
    const runtime = requireControlPlaneRuntime();
    const cfg = await runtime._getFeatureFlagsConfig();
    return res.json({ ok: true, config: cfg });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handlePutFeatureFlagsConfig(req, res) {
  try {
    const runtime = requireControlPlaneRuntime();
    const prev = await runtime._getFeatureFlagsConfig().catch(() => null);
    if (prev) await runtime._saveConfigHistory('featureFlags', prev, req.user?.sub || '', 'update');
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const cfg = await runtime._setFeatureFlagsConfig(body);
    return res.json({ ok: true, config: cfg });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handleDeleteFeatureFlagsConfig(_req, res) {
  try {
    const runtime = requireControlPlaneRuntime();
    await runtime.FeatureFlagsConfig.deleteOne({ key: 'global' });
    await runtime._resetFeatureFlagsConfig();
    return res.json({ ok: true, config: runtime.DEFAULT_FEATURE_FLAGS });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handleGetConfigHistory(req, res) {
  try {
    const runtime = requireControlPlaneRuntime();
    const type = String(req.query.type || '').trim();
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50) || 50));
    if (!type) return res.status(400).json({ ok: false, error: 'missing type' });
    const items = await runtime.ConfigHistory.find({ type }).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handlePostConfigRollback(req, res) {
  try {
    const runtime = requireControlPlaneRuntime();
    const { type, historyId } = req.body || {};
    const t = String(type || '').trim();
    const id = String(historyId || '').trim();
    if (!t || !id) return res.status(400).json({ ok: false, error: 'missing type/historyId' });
    const h = await runtime.ConfigHistory.findById(id).lean();
    if (!h || h.type !== t) return res.status(404).json({ ok: false, error: 'history not found' });

    if (t === 'featureFlags') await runtime._saveConfigHistory('featureFlags', await runtime._getFeatureFlagsConfig(), req.user?.sub || '', 'rollback');
    if (t === 'profit') await runtime._saveConfigHistory('profit', await runtime._getProfitConfigRuntime(), req.user?.sub || '', 'rollback');
    if (t === 'incentives') await runtime._saveConfigHistory('incentives', await runtime._getIncentivesConfigRuntime(), req.user?.sub || '', 'rollback');
    if (t === 'emailMarketing') await runtime._saveConfigHistory('emailMarketing', await runtime._getEmailMarketingConfigRuntime(), req.user?.sub || '', 'rollback');

    let applied = null;
    if (t === 'featureFlags') applied = await runtime._setFeatureFlagsConfig(h.data || {});
    else if (t === 'profit') applied = await runtime._setProfitConfig(h.data || {});
    else if (t === 'incentives') applied = await runtime._setIncentivesConfig(h.data || {});
    else if (t === 'emailMarketing') applied = await runtime._setEmailMarketingConfig(h.data || {});
    else return res.status(400).json({ ok: false, error: 'unknown type' });

    return res.json({ ok: true, config: applied });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handleGetOpsAlerts(req, res) {
  try {
    const runtime = requireControlPlaneRuntime();
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100) || 100));
    const includeAck = String(req.query.includeAck || '').toLowerCase() === 'true' || String(req.query.includeAck || '') === '1';
    const q = includeAck ? {} : { ackAt: null };
    const items = await runtime.OpsAlert.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

async function handlePostOpsAlertAck(req, res) {
  try {
    const runtime = requireControlPlaneRuntime();
    const id = String(req.params.id || '');
    const a = await runtime.OpsAlert.findByIdAndUpdate(
      id,
      { $set: { ackAt: new Date(), ackBy: String(req.user?.sub || '') } },
      { new: true }
    ).lean();
    if (!a) return res.status(404).json({ ok: false, error: 'not found' });
    return res.json({ ok: true, item: a });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

module.exports = {
  requireControlPlaneRuntime,
  handleGetFeatureFlagsConfig,
  handlePutFeatureFlagsConfig,
  handleDeleteFeatureFlagsConfig,
  handleGetConfigHistory,
  handlePostConfigRollback,
  handleGetOpsAlerts,
  handlePostOpsAlertAck,
};
