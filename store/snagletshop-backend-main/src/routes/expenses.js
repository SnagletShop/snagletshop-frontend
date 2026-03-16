'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch { }
}

function safeWriteJson(filepath, obj) {
  ensureDir(path.dirname(filepath));
  const tmp = filepath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, filepath);
}

async function mirrorExpensesToFile({ Expense, mirrorPath }) {
  try {
    const expenses = await Expense.find({}).sort({ date: -1 }).lean();
    safeWriteJson(mirrorPath, { updatedAt: new Date().toISOString(), expenses });
  } catch (e) {
    // best-effort mirror; never crash API
    console.warn('[expenses] mirror failed:', e && e.message ? e.message : e);
  }
}

function registerExpensesRoutes(app, { requireAdmin, Expense, dataDir }) {
  if (!app) throw new Error('registerExpensesRoutes: app is required');
  if (!requireAdmin) throw new Error('registerExpensesRoutes: requireAdmin is required');
  if (!Expense) throw new Error('registerExpensesRoutes: Expense model is required');

  const EXPENSES_DIR = path.join(dataDir || path.join(process.cwd(), 'data'), 'expenses');
  ensureDir(EXPENSES_DIR);

  const mirrorPath = path.join(EXPENSES_DIR, 'expenses.mirror.json');

  const expenseUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, EXPENSES_DIR),
      filename: (_req, file, cb) => {
        const safeBase = (file.originalname || 'attachment')
          .replace(/[^a-zA-Z0-9._-]+/g, '_')
          .slice(0, 120);
        cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${safeBase}`);
      }
    }),
    limits: { fileSize: 8 * 1024 * 1024 } // 8MB per file
  });

  // ===== Expenses endpoints (same paths as before) =====
  app.get("/admin/expenses", requireAdmin, async (req, res) => {
    const from = req.query.from ? new Date(req.query.from) : new Date("1970-01-01");
    const to = req.query.to ? new Date(req.query.to) : new Date("2999-12-31");
    const expenses = await Expense.find({ date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean();
    res.json({ expenses });
  });

  app.post("/admin/expenses", requireAdmin, async (req, res) => {
    const { date, vendor, description, category, amountEUR, orderId } = req.body || {};
    if (!date || !amountEUR) return res.status(400).json({ error: "missing date or amountEUR" });
    const exp = await Expense.create({
      date: new Date(date),
      vendor: vendor || "",
      description: description || "",
      category: category || "",
      amountEUR: Number(amountEUR),
      orderId: orderId || null,
      attachments: []
    });
    await mirrorExpensesToFile({ Expense, mirrorPath });
    res.json({ ok: true, expense: exp });
  });

  // Update expense (used by management UI edit flows)
  app.patch("/admin/expenses/:id", requireAdmin, async (req, res) => {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: "not found" });

    const { date, vendor, description, category, amountEUR, orderId } = req.body || {};

    if (date != null) exp.date = new Date(date);
    if (vendor != null) exp.vendor = String(vendor);
    if (description != null) exp.description = String(description);
    if (category != null) exp.category = String(category);
    if (amountEUR != null) exp.amountEUR = Number(amountEUR);
    if (orderId !== undefined) exp.orderId = orderId || null;

    await exp.save();
    await mirrorExpensesToFile({ Expense, mirrorPath });
    res.json({ ok: true, expense: exp });
  });

  app.delete("/admin/expenses/:id", requireAdmin, async (req, res) => {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: "not found" });
    // best-effort delete stored files
    for (const a of (exp.attachments || [])) {
      try { fs.unlinkSync(a.storagePath); } catch { }
    }
    await Expense.deleteOne({ _id: exp._id });
    await mirrorExpensesToFile({ Expense, mirrorPath });
    res.json({ ok: true });
  });

  app.post("/admin/expenses/:id/attachments", requireAdmin, expenseUpload.array("files", 5), async (req, res) => {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: "not found" });
    const files = req.files || [];
    for (const f of files) {
      exp.attachments.push({
        id: crypto.randomBytes(8).toString("hex"),
        filename: f.originalname,
        mime: f.mimetype,
        size: f.size,
        storagePath: f.path,
        uploadedAt: new Date()
      });
    }
    await exp.save();
    await mirrorExpensesToFile({ Expense, mirrorPath });
    res.json({ ok: true, expense: exp });
  });

  app.delete("/admin/expenses/:id/attachments/:attId", requireAdmin, async (req, res) => {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: "not found" });
    const att = (exp.attachments || []).find(a => a.id === req.params.attId);
    if (!att) return res.status(404).json({ error: "attachment not found" });
    try { fs.unlinkSync(att.storagePath); } catch { }
    exp.attachments = (exp.attachments || []).filter(a => a.id !== req.params.attId);
    await exp.save();
    await mirrorExpensesToFile({ Expense, mirrorPath });
    res.json({ ok: true, expense: exp });
  });

  app.get("/admin/expenses/:id/attachments/:attId", requireAdmin, async (req, res) => {
    const exp = await Expense.findById(req.params.id).lean();
    if (!exp) return res.status(404).json({ error: "not found" });
    const att = (exp.attachments || []).find(a => a.id === req.params.attId);
    if (!att) return res.status(404).json({ error: "attachment not found" });

    // safety: ensure attachment path stays within EXPENSES_DIR
    try {
      const resolved = path.resolve(String(att.storagePath || ""));
      const baseDir = path.resolve(EXPENSES_DIR);
      const within = resolved.startsWith(baseDir + path.sep) || resolved === baseDir;
      if (!within) return res.status(400).json({ error: "invalid attachment path" });
    } catch {
      return res.status(400).json({ error: "invalid attachment path" });
    }

    res.setHeader("Content-Type", att.mime || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${(att.filename || "attachment").replace(/"/g, "")}"`);
    fs.createReadStream(att.storagePath).pipe(res);
  });

  // create mirror at startup (best effort)
  mirrorExpensesToFile({ Expense, mirrorPath });
}

module.exports = { registerExpensesRoutes };
