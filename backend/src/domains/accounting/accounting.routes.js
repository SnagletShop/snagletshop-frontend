'use strict';

const { buildAccountingSummary, computeOrderFinancials } = require('./accounting.service');
const { getAccountingState } = require('../../lib/accountingState');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');

function parseDateOrFallback(value, fallback) {
  const d = value ? new Date(value) : new Date(fallback);
  return Number.isNaN(d.getTime()) ? new Date(fallback) : d;
}

function ensureAccountingState(res) {
  try {
    return getAccountingState();
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'ACCOUNTING_RUNTIME_NOT_READY' });
    return null;
  }
}

function mountAccountingRoutes(app) {
  const runtimeAdmin = lazyRuntimeMiddleware(getAccountingState, 'requireAdmin');

  app.get('/admin/accounting/summary', runtimeAdmin, async (req, res) => {
    const state = ensureAccountingState(res);
    if (!state) return;
    try {
      const from = parseDateOrFallback(req.query.from, '1970-01-01');
      const to = parseDateOrFallback(req.query.to, '2999-12-31');
      const payload = await buildAccountingSummary({ Order: state.Order, Expense: state.Expense, from, to });
      const { paidOrders, expenseRows, ...response } = payload;
      res.json(response);
    } catch (err) {
      console.error('[accounting] summary failed:', err && err.stack ? err.stack : err);
      res.status(500).json({ ok: false, error: 'ACCOUNTING_SUMMARY_FAILED' });
    }
  });

  app.get('/admin/accounting/export.csv', runtimeAdmin, async (req, res) => {
    const state = ensureAccountingState(res);
    if (!state) return;
    try {
      const from = parseDateOrFallback(req.query.from, '1970-01-01');
      const to = parseDateOrFallback(req.query.to, '2999-12-31');
      const payload = await buildAccountingSummary({ Order: state.Order, Expense: state.Expense, from, to });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=accounting_export.csv');
      res.write('rowType,refId,date,grossRevenue,refunds,netRevenue,fees,shipping,cogs,otherOrderCosts,otherExpenses,net\n');
      for (const o of payload.paidOrders) {
        const f = computeOrderFinancials(o);
        res.write(`order,${o.orderId || o._id},${new Date(o.createdAt).toISOString()},${f.gross},${f.refunds},${f.netRevenue},${f.fees},${f.shipping},${f.cogs},${f.other},,${f.net}\n`);
      }
      for (const e of payload.expenseRows) {
        const amt = Number(e.amountEUR || 0) || 0;
        res.write(`expense,${e._id},${new Date(e.date).toISOString()},,,,,,,,,${amt},${-amt}\n`);
      }
      res.end();
    } catch (err) {
      console.error('[accounting] export failed:', err && err.stack ? err.stack : err);
      res.status(500).json({ ok: false, error: 'ACCOUNTING_EXPORT_FAILED' });
    }
  });
}

module.exports = { mountAccountingRoutes };
