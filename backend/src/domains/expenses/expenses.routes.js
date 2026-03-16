'use strict';

const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { getRuntime } = require('../../app/runtime/runtimeContainer');
const { lazyRuntimeMiddleware } = require('../../app/router/lazyRuntime');
const {
  parseExpenseDateRange,
  normalizeExpensePayload,
  normalizeExpensePatch,
  getExpensesDir,
  mirrorExpensesToFile,
  buildExpenseUploadFilename,
  assertAttachmentPathWithinExpensesDir,
  applyExpensePatch,
} = require('./expenses.service');

function getRequireAdmin() {
  return getRuntime()?.middleware?.requireAdmin || null;
}

function getExpenseModel() {
  return getRuntime()?.models?.Expense || null;
}

function getExpensesDataDir() {
  return getRuntime()?.catalog?.DATA_DIR || require('path').join(process.cwd(), 'data');
}

function resolveExpenseModel(res) {
  const ExpenseModel = getExpenseModel();
  if (!ExpenseModel) {
    res.status(503).json({ error: 'RUNTIME_EXPENSE_MODEL_UNAVAILABLE' });
    return null;
  }
  return ExpenseModel;
}

function mountExpensesRoutes(app) {
  const runtimeAdmin = lazyRuntimeMiddleware(getRequireAdmin, 'requireAdmin');
  const expenseUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, getExpensesDir(getExpensesDataDir())),
      filename: (_req, file, cb) => cb(null, buildExpenseUploadFilename(file)),
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
  });

  app.get('/admin/expenses', runtimeAdmin, async (req, res) => {
    try {
      const ExpenseModel = resolveExpenseModel(res); if (!ExpenseModel) return;
      const { from, to } = parseExpenseDateRange(req.query || {});
      const expenses = await ExpenseModel.find({ date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean();
      return res.json({ expenses });
    } catch (error) {
      const status = Number(error?.status || 500) || 500;
      return res.status(status).json({ error: String(error?.message || error || 'Failed to load expenses') });
    }
  });

  app.post('/admin/expenses', runtimeAdmin, async (req, res) => {
    try {
      const ExpenseModel = resolveExpenseModel(res); if (!ExpenseModel) return;
      const payload = normalizeExpensePayload(req.body || {});
      const expense = await ExpenseModel.create({ ...payload, attachments: [] });
      await mirrorExpensesToFile({ ExpenseModel, dataDir: getExpensesDataDir() });
      return res.json({ ok: true, expense });
    } catch (error) {
      const status = Number(error?.status || 500) || 500;
      return res.status(status).json({ error: String(error?.message || error || 'Failed to create expense') });
    }
  });

  app.patch('/admin/expenses/:id', runtimeAdmin, async (req, res) => {
    try {
      const ExpenseModel = resolveExpenseModel(res); if (!ExpenseModel) return;
      const expense = await ExpenseModel.findById(req.params.id);
      if (!expense) return res.status(404).json({ error: 'not found' });
      applyExpensePatch(expense, normalizeExpensePatch(req.body || {}));
      await expense.save();
      await mirrorExpensesToFile({ ExpenseModel, dataDir: getExpensesDataDir() });
      return res.json({ ok: true, expense });
    } catch (error) {
      const status = Number(error?.status || 500) || 500;
      return res.status(status).json({ error: String(error?.message || error || 'Failed to update expense') });
    }
  });

  app.delete('/admin/expenses/:id', runtimeAdmin, async (req, res) => {
    try {
      const ExpenseModel = resolveExpenseModel(res); if (!ExpenseModel) return;
      const expense = await ExpenseModel.findById(req.params.id);
      if (!expense) return res.status(404).json({ error: 'not found' });
      for (const attachment of (expense.attachments || [])) {
        try { fs.unlinkSync(attachment.storagePath); } catch {}
      }
      await ExpenseModel.deleteOne({ _id: expense._id });
      await mirrorExpensesToFile({ ExpenseModel, dataDir: getExpensesDataDir() });
      return res.json({ ok: true });
    } catch (error) {
      const status = Number(error?.status || 500) || 500;
      return res.status(status).json({ error: String(error?.message || error || 'Failed to delete expense') });
    }
  });

  app.post('/admin/expenses/:id/attachments', runtimeAdmin, expenseUpload.array('files', 5), async (req, res) => {
    try {
      const ExpenseModel = resolveExpenseModel(res); if (!ExpenseModel) return;
      const expense = await ExpenseModel.findById(req.params.id);
      if (!expense) return res.status(404).json({ error: 'not found' });
      const files = Array.isArray(req.files) ? req.files : [];
      for (const file of files) {
        expense.attachments.push({
          id: crypto.randomBytes(8).toString('hex'),
          filename: file.originalname,
          mime: file.mimetype,
          size: file.size,
          storagePath: file.path,
          uploadedAt: new Date(),
        });
      }
      await expense.save();
      await mirrorExpensesToFile({ ExpenseModel, dataDir: getExpensesDataDir() });
      return res.json({ ok: true, expense });
    } catch (error) {
      const status = Number(error?.status || 500) || 500;
      return res.status(status).json({ error: String(error?.message || error || 'Failed to upload attachments') });
    }
  });

  app.delete('/admin/expenses/:id/attachments/:attId', runtimeAdmin, async (req, res) => {
    try {
      const ExpenseModel = resolveExpenseModel(res); if (!ExpenseModel) return;
      const expense = await ExpenseModel.findById(req.params.id);
      if (!expense) return res.status(404).json({ error: 'not found' });
      const attachment = (expense.attachments || []).find((item) => item.id === req.params.attId);
      if (!attachment) return res.status(404).json({ error: 'attachment not found' });
      try { fs.unlinkSync(attachment.storagePath); } catch {}
      expense.attachments = (expense.attachments || []).filter((item) => item.id !== req.params.attId);
      await expense.save();
      await mirrorExpensesToFile({ ExpenseModel, dataDir: getExpensesDataDir() });
      return res.json({ ok: true, expense });
    } catch (error) {
      const status = Number(error?.status || 500) || 500;
      return res.status(status).json({ error: String(error?.message || error || 'Failed to delete attachment') });
    }
  });

  app.get('/admin/expenses/:id/attachments/:attId', runtimeAdmin, async (req, res) => {
    try {
      const ExpenseModel = resolveExpenseModel(res); if (!ExpenseModel) return;
      const expense = await ExpenseModel.findById(req.params.id).lean();
      if (!expense) return res.status(404).json({ error: 'not found' });
      const attachment = (expense.attachments || []).find((item) => item.id === req.params.attId);
      if (!attachment) return res.status(404).json({ error: 'attachment not found' });
      assertAttachmentPathWithinExpensesDir(attachment.storagePath, getExpensesDataDir());
      res.setHeader('Content-Type', attachment.mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${String(attachment.filename || 'attachment').replace(/"/g, '')}"`);
      fs.createReadStream(attachment.storagePath).pipe(res);
    } catch (error) {
      const status = Number(error?.status || 500) || 500;
      return res.status(status).json({ error: String(error?.message || error || 'Failed to read attachment') });
    }
  });

  const ExpenseModel = getExpenseModel();
  if (ExpenseModel) mirrorExpensesToFile({ ExpenseModel, dataDir: getExpensesDataDir() });
  return app;
}

module.exports = { mountExpensesRoutes };
