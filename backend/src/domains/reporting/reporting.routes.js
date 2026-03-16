'use strict';

const {
  buildOrdersExportCsv,
  buildOrdersWorkbookBuffer,
  buildMonthlyCsv,
  buildOssSummaryCsv,
  buildReconcilePayouts,
  buildReconcileUnmatched,
  streamBackupZip,
  buildProfitAnalytics,
} = require('./reporting.service');
const { getReportingState } = require('../../lib/reportingState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');

function runtime() {
  return getReportingState();
}

function requireReady(res, deps) {
  for (const [name, value] of Object.entries(deps)) {
    if (!value) {
      res.status(500).json({ ok: false, error: `REPORTING_STATE_NOT_READY:${name}` });
      return false;
    }
  }
  return true;
}

function getRequireAdmin() {
  return runtime().requireAdmin || null;
}

function mountReportingRoutes(app) {
  const admin = lazyRuntimeMiddleware(getRequireAdmin, 'requireAdmin');

  app.get('/admin/orders/export.csv', admin, async (req, res) => {
    const rt = runtime();
    if (!requireReady(res, { Order: rt.Order })) return;
    try {
      const csv = await buildOrdersExportCsv({ Order: rt.Order, query: req.query || {} });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
      res.end(csv);
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  app.get('/admin/export/orders.xlsx', admin, async (req, res) => {
    const rt = runtime();
    if (!requireReady(res, { Order: rt.Order })) return;
    try {
      const buf = await buildOrdersWorkbookBuffer({ Order: rt.Order, query: req.query || {} });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');
      res.send(buf);
    } catch (e) {
      console.error('[reporting] orders xlsx failed:', e && e.stack ? e.stack : e);
      res.status(500).json({ error: 'export failed' });
    }
  });

  app.get('/admin/export/monthly.csv', admin, async (req, res) => {
    const rt = runtime();
    if (!requireReady(res, { Order: rt.Order })) return;
    try {
      const month = String(req.query.month || '').trim();
      const csv = await buildMonthlyCsv({ Order: rt.Order, month });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="orders-${month}.csv"`);
      res.send(csv);
    } catch (e) {
      const status = /month must be YYYY-MM/.test(String(e?.message || '')) ? 400 : 500;
      res.status(status).json({ error: status === 400 ? 'month must be YYYY-MM' : 'export failed' });
    }
  });

  app.get('/admin/export/oss-summary.csv', admin, async (req, res) => {
    const rt = runtime();
    if (!requireReady(res, { Order: rt.Order })) return;
    try {
      const year = Number(req.query.year || 0);
      const csv = await buildOssSummaryCsv({ Order: rt.Order, year });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="oss-summary-${year}.csv"`);
      res.send(csv);
    } catch (e) {
      const status = /year must be YYYY/.test(String(e?.message || '')) ? 400 : 500;
      res.status(status).json({ error: status === 400 ? 'year must be YYYY' : 'export failed' });
    }
  });

  app.get('/admin/reconcile/payouts', admin, async (req, res) => {
    try {
      const payload = await buildReconcilePayouts({ query: req.query || {} });
      res.json(payload);
    } catch (e) {
      const status = e?.statusCode || 500;
      res.status(status).json({ error: String(e?.message || e) });
    }
  });

  app.get('/admin/reconcile/unmatched', admin, async (req, res) => {
    const rt = runtime();
    if (!requireReady(res, { Order: rt.Order })) return;
    try {
      const payload = await buildReconcileUnmatched({ Order: rt.Order, query: req.query || {} });
      res.json(payload);
    } catch (e) {
      const status = e?.statusCode || 500;
      res.status(status).json({ error: String(e?.message || e) });
    }
  });

  app.get('/admin/backup/export.zip', admin, async (req, res) => {
    const rt = runtime();
    if (!requireReady(res, { Order: rt.Order, Expense: rt.Expense })) return;
    try {
      const includeAttachments = String(req.query.includeAttachments || '0') === '1';
      await streamBackupZip({ res, Order: rt.Order, Expense: rt.Expense, includeAttachments });
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: String(e?.message || e) });
    }
  });

  app.get('/admin/analytics/profit', admin, async (req, res) => {
    const rt = runtime();
    if (!requireReady(res, { Order: rt.Order })) return;
    try {
      const payload = await buildProfitAnalytics({ Order: rt.Order, query: req.query || {} });
      res.json(payload);
    } catch (e) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}

module.exports = { mountReportingRoutes };
