'use strict';

const { getRuntime } = require('../runtime/runtimeContainer');
const { patchBootState } = require('../boot/bootState');

let started = false;

function getDeps() {
  const runtime = getRuntime() || {};
  const control = runtime.controlPlane || {};
  const models = runtime.models || {};
  return {
    getFeatureFlagsConfig: typeof control._getFeatureFlagsConfig === 'function' ? control._getFeatureFlagsConfig : null,
    DEFAULT_FEATURE_FLAGS: control.DEFAULT_FEATURE_FLAGS || {},
    getProfitConfigRuntime: typeof control._getProfitConfigRuntime === 'function' ? control._getProfitConfigRuntime : null,
    OpsAlert: control.OpsAlert || models.OpsAlert || null,
    ProductProfitStats: models.ProductProfitStats || null,
    Order: models.Order || null,
  };
}

async function runOpsMonitorOnce(deps) {
  const { getFeatureFlagsConfig, DEFAULT_FEATURE_FLAGS, getProfitConfigRuntime, OpsAlert, ProductProfitStats, Order } = deps;
  if (!OpsAlert || !ProductProfitStats || !Order) return;
  try {
    await (typeof getFeatureFlagsConfig === 'function' ? getFeatureFlagsConfig().catch(() => DEFAULT_FEATURE_FLAGS) : Promise.resolve(DEFAULT_FEATURE_FLAGS));
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);
    const profitCfg = await (typeof getProfitConfigRuntime === 'function' ? getProfitConfigRuntime().catch(() => null) : Promise.resolve(null));
    const minMarginPct = Number(profitCfg?.minOrderMarginPct ?? 18) || 18;

    const stats = await ProductProfitStats.find({}).lean().catch(() => []);
    const worst = stats
      .map((s) => {
        const sold = Number(s?.soldQty || 0) || 0;
        const revenue = Number(s?.revenueEUR || 0) || 0;
        const cogs = Number(s?.cogsEUR || 0) || 0;
        const ship = Number(s?.shippingEUR || 0) || 0;
        const fees = Number(s?.feesEUR || 0) || 0;
        const contrib = revenue - cogs - ship - fees;
        const marginPct = revenue > 0 ? (contrib / revenue) * 100 : 0;
        return { productId: s.productId, sold, revenue, contrib, marginPct };
      })
      .filter((x) => x.sold > 5 && x.revenue > 50)
      .sort((a, b) => a.marginPct - b.marginPct)
      .slice(0, 5);

    for (const w of worst) {
      if (w.marginPct < minMarginPct - 5) {
        await OpsAlert.create({
          type: 'margin_floor',
          severity: w.marginPct < 0 ? 'critical' : 'warn',
          message: `Low margin: ${w.productId} (${w.marginPct.toFixed(1)}%)`,
          data: w,
        }).catch(() => {});
      }
    }

    const paid24h = await Order.countDocuments({ paidAt: { $gte: since24h } }).catch(() => 0);
    const refunded24h = await Order.countDocuments({ refundedAt: { $gte: since24h } }).catch(() => 0);
    if (paid24h >= 10) {
      const rate = paid24h > 0 ? (refunded24h / paid24h) : 0;
      if (rate > 0.10 || refunded24h >= 3) {
        await OpsAlert.create({
          type: 'refund_spike',
          severity: rate > 0.20 ? 'critical' : 'warn',
          message: `Refund spike in last 24h: ${(rate * 100).toFixed(1)}% (${refunded24h}/${paid24h})`,
          data: { paid24h, refunded24h, rate },
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('ops monitor error', e?.message || e);
  }
}

async function registerOpsMonitor() {
  const deps = getDeps();
  const available = !!(deps.OpsAlert && deps.ProductProfitStats && deps.Order);
  patchBootState({ opsMonitorAvailable: available });
  if (started || !available) return null;
  started = true;
  setInterval(() => { runOpsMonitorOnce(getDeps()).catch(() => {}); }, 10 * 60 * 1000);
  runOpsMonitorOnce(deps).catch(() => {});
  patchBootState({ opsMonitorStarted: true, opsMonitorStartedAt: new Date().toISOString() });
  return true;
}

module.exports = { registerOpsMonitor, runOpsMonitorOnce };
