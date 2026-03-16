// ===== Start
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Safe order lookup: accepts either custom orderId string (e.g. ORD_...) or Mongo ObjectId
function buildOrderLookup(id) {
  const sid = String(id || '').trim();
  if (!sid) return { orderId: '__missing__' };
  return mongoose.isValidObjectId(sid)
    ? { $or: [{ orderId: sid }, { _id: sid }] }
    : { orderId: sid };
}

const multer = require('multer');
require('dotenv').config(); // load .env early
// ===== Stripe bootstrap (robust) =====
const STRIPE_TEST_MODE = String(process.env.STRIPE_TEST_MODE || process.env.STRIPE_TEST || "").toLowerCase() === "true"
  || String(process.env.STRIPE_TEST_MODE || process.env.STRIPE_TEST || "") === "1";

const STRIPE_SECRET_KEY =
  (STRIPE_TEST_MODE ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY) ||
  process.env.STRIPE_SECRET_KEY ||
  process.env.STRIPE_API_KEY ||
  "";

const ACTIVE_STRIPE_WEBHOOK_SECRET =
  (STRIPE_TEST_MODE ? process.env.STRIPE_WEBHOOK_SECRET_TEST : process.env.STRIPE_WEBHOOK_SECRET) ||
  process.env.STRIPE_WEBHOOK_SECRET ||
  "";

const SHOP_URL = String(process.env.SHOP_URL || process.env.STORE_URL || "https://www.snagletshop.com").replace(/\/+$/, "");

// Auto-install missing deps only if explicitly enabled (default: enabled)
// Set AUTO_INSTALL_DEPS=0 to disable.
const AUTO_INSTALL_DEPS = ["1", "true", "yes"].includes(String(process.env.AUTO_INSTALL_DEPS || "").toLowerCase());

function _npmInstall(pkgName) {
  const cp = require("child_process");
  const cwd = __dirname;
  const args = ["install", pkgName, "--omit=dev", "--no-audit", "--no-fund"];
  cp.execFileSync("npm", args, { cwd, stdio: "inherit" });
}

function _requireOrInstall(pkgName) {
  try {
    return require(pkgName);
  } catch (e) {
    if (e && e.code === "MODULE_NOT_FOUND" && AUTO_INSTALL_DEPS) {
      console.warn(`[deps] Missing ${pkgName}; installing...`);
      try {
        _npmInstall(pkgName);
      } catch (installErr) {
        console.error(`[deps] Failed to install ${pkgName}:`, installErr?.message || installErr);
        throw e;
      }
      return require(pkgName);
    }
    throw e;
  }
}

let stripe = null;
function initStripe() {
  if (stripe) return stripe;
  if (!STRIPE_SECRET_KEY) return null;
  try {
    const Stripe = _requireOrInstall("stripe");
    stripe = Stripe(STRIPE_SECRET_KEY);
    return stripe;
  } catch (e) {
    console.warn("[stripe] init failed:", e?.message || e);
    return null;
  }
}
// Initialize once at boot (non-fatal if missing key)
stripe = initStripe();

// ===== Express app bootstrap =====
const express = require('express');
function validateCatalogOrThrow(catalog) {
  // Minimal validation to keep boot robust.
  // Throws only on clearly invalid shapes; otherwise returns catalog.
  if (catalog === null || catalog === undefined) {
    throw new Error("catalog is null/undefined");
  }
  // Accept both array-of-products and object { products: [...] } shapes.
  if (Array.isArray(catalog)) return catalog;
  if (typeof catalog === "object") {
    if (Array.isArray(catalog.products)) return catalog;
    // allow split-catalog shapes with categories
    return catalog;
  }
  throw new Error("catalog is not an object/array");
}

function _generateUniqueProductId(prefix = "P") {
  // Generates reasonably unique, URL-safe ids. Not cryptographically secure.
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}_${rnd}`;
}

const __expenseModels = require('./src/models/expense');
let Expense = __expenseModels.Expense || __expenseModels.default || __expenseModels;

// If the module didn't export a mongoose model, try to recover it.
try {
  if (!Expense || typeof Expense !== "function" || !Expense.modelName) {
    Expense = mongoose.model("Expense");
  }
} catch (_) {
  // Define a minimal Expense model as a fallback (only if missing).
  try {
    const ExpenseSchema = new mongoose.Schema({
      date: { type: Date, default: Date.now },
      amount: { type: Number, required: true, default: 0 },
      currency: { type: String, default: "EUR" },
      category: { type: String, default: "" },
      description: { type: String, default: "" },
      vendor: { type: String, default: "" },
      note: { type: String, default: "" },
      tags: { type: [String], default: [] },
      attachments: [{
        attId: { type: String, default: "" },
        filename: { type: String, default: "" },
        mime: { type: String, default: "" },
        size: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now }
      }]
    }, { minimize: false });

    Expense = mongoose.model("Expense", ExpenseSchema);
  } catch (_) { }
}

function _sanitizeVariantPrices(p) {
  // Defensive: normalize any variant/option pricing fields to finite numbers.
  // Supports both legacy "options" arrays and "variants" arrays.
  const toNum = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const clamp2 = (n) => Math.round(n * 100) / 100;

  try {
    if (!p || typeof p !== "object") return p;

    const fixOptionArr = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const o of arr) {
        if (!o || typeof o !== "object") continue;
        // common fields in this project
        if ("price" in o) o.price = clamp2(toNum(o.price));
        if ("sellPrice" in o) o.sellPrice = clamp2(toNum(o.sellPrice));
        if ("purchasePrice" in o) o.purchasePrice = clamp2(toNum(o.purchasePrice));
        if ("addPrice" in o) o.addPrice = clamp2(toNum(o.addPrice));
        if ("shipping" in o) o.shipping = clamp2(toNum(o.shipping));
      }
    };

    // product-level common fields
    if ("price" in p) p.price = clamp2(toNum(p.price));
    if ("sellPrice" in p) p.sellPrice = clamp2(toNum(p.sellPrice));
    if ("purchasePrice" in p) p.purchasePrice = clamp2(toNum(p.purchasePrice));
    if ("shipping" in p) p.shipping = clamp2(toNum(p.shipping));

    // legacy: options can be array or object of arrays by group
    if (Array.isArray(p.options)) {
      fixOptionArr(p.options);
    } else if (p.options && typeof p.options === "object") {
      for (const k of Object.keys(p.options)) fixOptionArr(p.options[k]);
    }

    // variants
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        if (!v || typeof v !== "object") continue;
        if ("price" in v) v.price = clamp2(toNum(v.price));
        if ("sellPrice" in v) v.sellPrice = clamp2(toNum(v.sellPrice));
        if ("purchasePrice" in v) v.purchasePrice = clamp2(toNum(v.purchasePrice));
        if ("shipping" in v) v.shipping = clamp2(toNum(v.shipping));
        // variant-level options
        if ("options" in v) {
          if (Array.isArray(v.options)) fixOptionArr(v.options);
          else if (v.options && typeof v.options === "object") {
            for (const k of Object.keys(v.options)) fixOptionArr(v.options[k]);
          }
        }
      }
    }

    return p;
  } catch {
    return p;
  }
}

function _isLegacyOrUrlDerivedProductId(id) {
  const s = String(id || "").trim();
  if (!s) return false;
  // Guard: corrupted IDs from accidental object stringification
  if (/^\[object\s+\w+\]_/.test(s)) return true;
  // Heuristic: legacy/url-derived ids often contain ':' or '/' or look like full urls / domains
  if (/^https?:\/\//i.test(s)) return true;
  if (/[\/:]/.test(s)) return true;
  if (/\.(com|net|org|sk|cz|de|fr|it|es|co|io)(\/|$)/i.test(s)) return true;
  return false;
}

function _repairProductId(id) {
  const s = String(id || "").trim();
  if (!s) return "";
  // Recover from corrupted strings like "[object Set]_mm3..." by stripping the prefix.
  const m = s.match(/^\[object\s+\w+\]_(.+)$/);
  if (m && m[1]) return String(m[1]).trim();
  return s;
}

function canonicalizeProductLink(url) {
  if (!url) return "";
  try {
    const s = String(url).trim();
    if (!s) return "";
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withScheme);
    u.hash = "";
    const drop = new Set([
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "gclid", "fbclid"
    ]);
    for (const k of [...u.searchParams.keys()]) {
      if (drop.has(k)) u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return String(url).trim();
  }
}

const schedule = require("node-schedule");
const nodemailer = require("nodemailer");
const archiver = require("archiver");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const app = express();


// Needed when behind a reverse proxy (Nginx/Cloudflare) so rate-limit can use X-Forwarded-For safely.
app.set('trust proxy', 1);

// ===== Zod (validation) =====
const { z } = require('zod');

// Minimal cart item schema (passthrough) to avoid breaking validation if payload expands
const CartItemPayloadSchema = z.object({}).passthrough();

function zodBadRequest(res, parsed, message) {
  const details = parsed && parsed.error ? parsed.error.flatten ? parsed.error.flatten() : parsed.error : undefined;
  return res.status(400).json({ ok: false, error: 'BAD_REQUEST', message: message || 'Invalid request', details });
}

// ===== Expenses (admin) =====
const { registerExpensesRoutes } = require('./src/routes/expenses');

// (dedup) archiver already required above

const PDFDocument = require('pdfkit');
const PaymentIntentBodySchema = z.object({
  websiteOrigin: z.string().max(500).optional(),
  checkoutId: z.union([z.string().max(80), z.null()]).optional(),
  checkoutToken: z.union([z.string().max(200), z.null()]).optional(),
  currency: z.string().max(8).optional(),
  country: z.string().max(8).optional(),
  products: z.array(CartItemPayloadSchema).max(200).optional(),
  productsFull: z.array(CartItemPayloadSchema).max(200).optional(),
  expectedClientTotal: z.union([z.number(), z.string()]).optional(),
  applyTariff: z.any().optional(),
  metadata: z.any().optional(),
  fxFetchedAt: z.union([z.number(), z.string(), z.null()]).optional(),
  experiments: z.record(z.string()).optional(),
  turnstileToken: z.string().optional(),
  turnstile: z.string().optional(),
}).passthrough().superRefine((v, ctx) => {
  const a = Array.isArray(v.products) ? v.products.length : 0;
  const b = Array.isArray(v.productsFull) ? v.productsFull.length : 0;
  if (a + b <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["products"], message: "No products provided" });
});

const OrderPatchSchema = z.object({
  status: z.string().max(64).optional(),
  pricing: z.object({
    note: z.string().max(4000).optional(),
    currency: z.string().max(8).optional(),
    totalPaidEUR: z.union([z.number(), z.string()]).optional(),
  }).passthrough().optional(),
  operator: z.object({
    procurementStatus: z.string().max(64).optional(),
    supplierProvider: z.string().max(120).optional(),
    supplierOrderId: z.string().max(200).optional(),
    purchasedAt: z.union([z.string(), z.number(), z.null()]).optional(),
    supplierCostEUR: z.union([z.number(), z.string(), z.null()]).optional(),
    internalNote: z.string().max(4000).optional(),
    deliveredAt: z.union([z.string(), z.number(), z.null()]).optional(),
    doneAt: z.union([z.string(), z.number(), z.null()]).optional(),
    shipping: z.object({
      aliExpress: z.union([z.number(), z.string()]).optional(),
      thirdParty1: z.union([z.number(), z.string()]).optional(),
      thirdParty2: z.union([z.number(), z.string()]).optional(),
    }).passthrough().optional(),
    tracking: z.array(z.object({
      code: z.string().max(120).optional(),
      carrier: z.string().max(120).optional(),
      url: z.string().max(500).optional(),
      addedAt: z.union([z.string(), z.number(), z.null()]).optional(),
    }).passthrough()).max(20).optional(),
  }).passthrough().optional(),
  costs: z.object({
    shippingCostEUR: z.union([z.number(), z.string(), z.null()]).optional(),
    otherCostEUR: z.union([z.number(), z.string(), z.null()]).optional(),
  }).passthrough().optional(),
  accounting: z.object({
    vatScheme: z.string().max(40).optional(),
    customerCountryCode: z.string().max(8).optional(),
    invoiceNumber: z.string().max(64).optional(),
  }).passthrough().optional(),
  emailSentAt: z.union([z.string(), z.number(), z.null()]).optional(),
  itemsPatch: z.array(z.object({
    index: z.union([z.number(), z.string()]),
    expectedPurchase: z.union([z.number(), z.string(), z.null()]).optional(),
    actualPurchaseEUR: z.union([z.number(), z.string(), z.null()]).optional(),
    supplierLink: z.union([z.string(), z.null()]).optional(),
    supplierSku: z.union([z.string(), z.null()]).optional(),
  }).passthrough()).max(200).optional(),
  note: z.string().max(8000).optional(),
}).passthrough();


const CANONICAL_PRODUCTS_PATH = path.join(__dirname, 'ServerProducts.js'); // tracked in Git
const DATA_DIR = path.join(__dirname, 'data');
// Tombstones: track deleted productIds so "sync/import" cannot resurrect deletions.
const DELETED_PRODUCTS_PATH = path.join(DATA_DIR, 'deleted_products.json');
let deletedProductIds = new Set();
try {
  const raw = fs.existsSync(DELETED_PRODUCTS_PATH) ? fs.readFileSync(DELETED_PRODUCTS_PATH, 'utf8') : '';
  const parsed = raw ? JSON.parse(raw) : null;
  const ids = Array.isArray(parsed?.ids) ? parsed.ids : (Array.isArray(parsed) ? parsed : []);
  deletedProductIds = new Set(ids.map(x => String(x || '').trim()).filter(Boolean));
} catch (e) {
  console.warn('[catalog] deleted_products.json load failed:', e?.message || e);
  deletedProductIds = new Set();
}

function persistDeletedProductIds() {
  try {
    fs.mkdirSync(path.dirname(DELETED_PRODUCTS_PATH), { recursive: true });
    const tmp = DELETED_PRODUCTS_PATH + '.tmp';
    const ids = Array.from(deletedProductIds.values()).sort();
    fs.writeFileSync(tmp, JSON.stringify({ updatedAt: new Date().toISOString(), ids }, null, 2), 'utf8');
    fs.renameSync(tmp, DELETED_PRODUCTS_PATH);
  } catch (e) {
    console.warn('[catalog] deleted_products.json persist failed:', e?.message || e);
  }
}

function tombstoneAdd(productId) {
  const id = String(productId || '').trim();
  if (!id) return;
  if (!deletedProductIds.has(id)) {
    deletedProductIds.add(id);
    persistDeletedProductIds();
  }
}

function tombstoneRemove(productId) {
  const id = String(productId || '').trim();
  if (!id) return;
  if (deletedProductIds.delete(id)) persistDeletedProductIds();
}

const LOCAL_PRODUCTS_PATH = path.join(DATA_DIR, 'ServerProducts.js');      // server-owned mirror


// Catalog source: 'db' (MongoDB, per-category documents) or 'file' (data/ServerProducts.js)
const CATALOG_SOURCE = String(process.env.CATALOG_SOURCE || 'db').trim().toLowerCase();
const CATALOG_DISK_MIRROR = String(process.env.CATALOG_DISK_MIRROR || 'true').trim().toLowerCase() !== 'false';
const {
  PORT = 8080,
  MONGO_URI = 'mongodb://127.0.0.1:27017/snagletshop',
  JWT_SECRET = 'change_me',
  ADMIN_USER = 'admin',
  ADMIN_PASS = 'admin',
  ADMIN_CODE = '', // optional
  FRONTEND_ORIGIN = '',
  SMTP_HOST = '',
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER = '',
  SMTP_PASS = '',
  SMTP_FROM = 'SnagletShop <no-reply@snagletshop.com>',
  PUBLIC_TOKEN_SALT = '',
  INVOICE_PREFIX = ''
} = process.env;

// ---- Minimal production safety checks ----
if (String(process.env.NODE_ENV || "").toLowerCase() === "production") {
  if (!JWT_SECRET || JWT_SECRET === "change_me") {
    console.error("❌ JWT_SECRET must be set to a strong value in production.");
    process.exit(1);
  }
  if (!ADMIN_PASS || ADMIN_PASS === "admin") {
    console.error("❌ ADMIN_PASS must be set to a strong value in production.");
    process.exit(1);
  }
  // Optional hardening: require ADMIN_CODE when REQUIRE_ADMIN_CODE=true
  if (!ADMIN_CODE) {
    if (String(process.env.REQUIRE_ADMIN_CODE || "").toLowerCase() === "true" || String(process.env.REQUIRE_ADMIN_CODE || "") === "1") {
      console.error("❌ ADMIN_CODE is required in production when REQUIRE_ADMIN_CODE is enabled.");
      process.exit(1);
    } else {
      console.warn("⚠ ADMIN_CODE is not set; consider setting it to add a shared secret to admin requests.");
    }
  }
  if (!ACTIVE_STRIPE_WEBHOOK_SECRET) {
    console.error(`❌ Active Stripe webhook secret must be set in production. Set ${STRIPE_TEST_MODE ? "STRIPE_WEBHOOK_SECRET_TEST" : "STRIPE_WEBHOOK_SECRET"}.`);
    process.exit(1);
  }
}

// Lightweight status check so the frontend can wait for final state


app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const whSecret = ACTIVE_STRIPE_WEBHOOK_SECRET;
    if (whSecret && sig) {
      const stripeClient = stripe || initStripe();
      if (!stripeClient) {
        throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
      }
      event = stripeClient.webhooks.constructEvent(req.body, sig, whSecret);
    } else if ((process.env.NODE_ENV || "").toLowerCase() !== "production") {
      // Dev-only fallback (no signature verification). Keep production strict.
      event = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || ""));
    } else {
      throw new Error("Missing Stripe webhook secret/signature in production.");
    }
  } catch (err) {
    console.error("⚠️ Invalid signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const type = event.type;
  const pi = event.data?.object;

  const piId = pi?.id;
  if (!piId) return res.json({ received: true });

  try {
    // 1) Prefer an existing finalized Order (idempotency)
    // NOTE: DB schema uses `stripe.paymentIntentId` (not `stripeClient.*`).
    // Using the wrong path prevents webhook finalization and orders won't be saved.
    let order = await Order.findOne({ "stripe.paymentIntentId": piId });

    // 2) If no order exists yet, try to find the DraftOrder checkout record
    let draft = null;
    if (!order) {
      const draftId = pi?.metadata?.draftId ? String(pi.metadata.draftId).trim() : "";
      draft = (draftId && mongoose.Types.ObjectId.isValid(draftId))
        ? await DraftOrder.findById(draftId)
        : await DraftOrder.findOne({ "stripe.paymentIntentId": piId });
    }

    // If neither exists, ignore safely (webhook may arrive after TTL cleanup)
    if (!order && !draft) {
      console.warn("[stripe-webhook] No order/draft found for PI", piId);
      return res.json({ received: true });
    }

    const isAlreadyPaid = !!order?.paidAt || ["PAID", "REFUNDED"].includes(order?.status);

    if (type === "payment_intent.succeeded") {
      // If order doesn't exist yet, finalize from draft
      if (!order) {
        const newOrderId = `ORD_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        order = await Order.create({
          orderId: newOrderId,
          status: "PAID",
          websiteOrigin: draft.websiteOrigin || "",
          customer: draft.customer || {},
          items: draft.items || [],
          pricing: draft.pricing || {},
          fulfillment: {},
          stripe: {
            ...(draft.stripe || {}),
            paymentIntentId: piId,
            currency: (draft.pricing?.currency || (pi.currency ? String(pi.currency).toUpperCase() : "EUR"))
          },
          paidAt: new Date(),
          emailSentAt: null,
          shippedEmailSentAt: null,
          expiresAt: undefined,
          public: draft.public || {},
          operator: {
            procurementStatus: "TO_ORDER",
            shipping: { aliExpress: 0, thirdParty1: 0, thirdParty2: 0 }
          },
          accounting: draft.accounting || {},
          createdAt: draft.createdAt || new Date(),
          updatedAt: new Date(),
          notes: [],
          statusHistory: [{ at: new Date(), from: "CHECKOUT", to: "PAID", by: "stripe-webhook", note: "payment_intent.succeeded" }]
        });

        // Best-effort assign invoice + stripe fees
        try { await ensureInvoiceNumber(order); } catch (e) { console.warn("[invoice] assign failed:", e?.message || e); }
        try { await enrichStripeFeesIfMissing(order); } catch { }
        await order.save();

        // Cleanup draft
        try { await DraftOrder.deleteOne({ _id: draft._id }); } catch { }
      }

      // Existing order update path (idempotent)
      const prevStatus = order.status;

      if (!order.paidAt) order.paidAt = new Date();
      if (!["PLACED_WITH_AGENT", "REFUNDED"].includes(order.status)) {
        order.status = "PAID";
      }

      // Prevent TTL deletion of paid orders
      order.expiresAt = undefined;

      // Persist Stripe info
      order.stripe = order.stripe || {};
      order.stripe.paymentIntentId = piId;
      if (pi.currency) order.stripe.currency = String(pi.currency).toUpperCase();
      if (typeof pi.amount_received === "number") order.stripe.amountMinor = pi.amount_received;
      else if (typeof pi.amount === "number") order.stripe.amountMinor = pi.amount;

      // Initialize operator flow once paid
      order.operator = order.operator || {};
      if (!order.operator.procurementStatus || order.operator.procurementStatus === "AWAITING_PAYMENT") {
        order.operator.procurementStatus = "TO_ORDER";
      }
      order.accounting = order.accounting || {};
      if (!order.accounting.customerCountryCode) {
        order.accounting.customerCountryCode = order.customer?.countryCode || "";
      }

      // Status history (idempotent)
      try {
        if (prevStatus !== order.status) addStatusHistory(order, prevStatus, order.status, "stripe-webhook", "payment_intent.succeeded");
      } catch { }

      // Invoice number + Stripe fees (best effort)
      try { await ensureInvoiceNumber(order); } catch (e) { console.warn("[invoice] assign failed:", e?.message || e); }
      try { await enrichStripeFeesIfMissing(order); } catch { }

      await order.save();

      // Side-effects (idempotent)
      order.sideEffects = order.sideEffects || {};

      // Customer confirmation email
      if (!order.emailSentAt) {
        try {
          await _sendOrderEmailWithCooldown({ order, field: 'emailSentAt', type: 'confirmation', sender: sendConfirmationEmail });
        } catch (e) {
          console.warn("⚠️ sendConfirmationEmail failed:", e?.message || e);
        }
      }

      // Local exports/logging (prevent duplicates on Stripe retries)
      if (!order.sideEffects.fileWrittenAt) {
        try {
          writeOrderToFile(order);
          order.sideEffects.fileWrittenAt = new Date();
          await order.save();
        } catch (e) {
          console.warn("⚠️ writeOrderToFile failed:", e?.message || e);
        }
      }

      if (!order.sideEffects.excelWrittenAt) {
        try {
          await writeOrderToExcel(order);
          order.sideEffects.excelWrittenAt = new Date();
          await order.save();
        } catch (e) {
          console.warn("⚠️ writeOrderToExcel failed:", e?.message || e);
        }
      }

      return res.json({ received: true });
    }

    // Don’t overwrite paid orders with failure/cancel events
    if (isAlreadyPaid) return res.json({ received: true });

    // Failure/cancel events before payment completion: record on draft if possible.
    if (type === "payment_intent.payment_failed") {
      if (draft) {
        draft.status = "PAYMENT_FAILED";
        draft.expiresAt = draft.expiresAt || new Date(Date.now() + 60 * 60 * 1000);

        const lpe = pi.last_payment_error;
        draft.lastPaymentError = lpe
          ? {
            message: lpe.message,
            code: lpe.code,
            declineCode: lpe.decline_code,
            type: lpe.type,
            at: new Date()
          }
          : null;

        await draft.save();
      }

      if (order) {
        order.status = "PAYMENT_FAILED";
        order.expiresAt = order.expiresAt || new Date(Date.now() + 60 * 60 * 1000);

        const lpe = pi.last_payment_error;
        order.lastPaymentError = lpe
          ? {
            message: lpe.message,
            code: lpe.code,
            declineCode: lpe.decline_code,
            type: lpe.type,
            at: new Date()
          }
          : null;

        await order.save();
      }

      return res.json({ received: true });
    }

    if (type === "payment_intent.canceled") {
      if (draft) {
        draft.status = "CANCELED";
        draft.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await draft.save();
      }
      if (order) {
        order.status = "CANCELED";
        order.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await order.save();
      }
      return res.json({ received: true });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Webhook handler failed");
  }
});





// ---- App ----

app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf; // keep raw bytes for HMAC verification (used by secure webhooks)
  }
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
}));

// Ensure API responses can be consumed cross-origin by the storefront (avoid CORP/COOP blocking fetch).
app.use((req, res, next) => {
  if (req.path.startsWith("/products") || req.path.startsWith("/catalog") || req.path.startsWith("/config") || req.path.startsWith("/storefront-config") || req.path.startsWith("/tariffs") || req.path.startsWith("/countries") || req.path.startsWith("/recs") || req.path.startsWith("/smart-reco")) {
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.removeHeader("Cross-Origin-Opener-Policy");
  }
  next();
});

app.use(compression({ threshold: 1024 }));

// CORS allowlist (comma-separated). Example: CORS_ORIGINS=https://snagletshop.com,https://www.snagletshop.com
function parseCorsOrigins() {
  const fromEnv = String(process.env.CORS_ORIGINS || FRONTEND_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
  const defaults = [
    "https://snagletshop.com",
    "https://www.snagletshop.com",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ];
  return Array.from(new Set([...defaults, ...fromEnv])).map(o => o.replace(/\/+$/, ""));
}

const allowedOrigins = new Set(parseCorsOrigins());
const ALLOW_NULL_ORIGIN = String(process.env.ALLOW_NULL_ORIGIN || "").trim().toLowerCase() === "true" || String(process.env.ALLOW_NULL_ORIGIN || "").trim() === "1";

function sanitizeSpreadsheetText(value) {
  // Prevent CSV/XLSX formula injection when values are opened in spreadsheet apps.
  // Only sanitizes text; numbers should be kept as numbers.
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (!s) return "";
  const dangerous = /^[=+\-@]/.test(s) || /^[\t\r\n]/.test(s);
  return dangerous ? ("'" + s) : s;
}

function looksLikeNumberString(s) {
  return /^-?\d+(?:\.\d+)?$/.test(String(s).trim());
}

function parseDecimalLoose(value) {
  // Accept numbers or numeric strings in either "12.34" or "12,34" form.
  // Also tolerates thousands separators like "1,234.56" or "1.234,56".
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  // Keep digits, separators, and minus. Remove currency symbols and spaces.
  let s = raw.replace(/[\s\u00A0]/g, "").replace(/[^0-9,\.\-]/g, "");
  if (!s) return 0;

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  // Pure thousands format: 1,234 or 12,345,678 (no decimals)
  if (hasComma && !hasDot && /^-?\d{1,3}(,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  // Both separators present: treat the last separator as decimal mark.
  if (hasDot && hasComma) {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    const decSep = lastDot > lastComma ? "." : ",";
    const thouSep = decSep === "." ? "," : ".";
    s = s.split(thouSep).join("");
    if (decSep === ",") s = s.replace(/,/g, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  // Only comma present -> treat as decimal separator (69,99 => 69.99)
  if (hasComma && !hasDot) {
    s = s.replace(/,/g, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}




const corsOpts = {
  origin(origin, cb) {
    // Allow non-browser / same-origin tools that don't send Origin
    if (!origin) return cb(null, true);

    const normalized = String(origin).replace(/\/+$/, "");

    // Allow file:// pages (Origin: null) only when explicitly enabled (dev-only).
    if (normalized === "null" && ALLOW_NULL_ORIGIN) return cb(null, true);

    if (allowedOrigins.has(normalized)) return cb(null, true);

    console.warn("CORS blocked for origin:", origin);
    return cb(new Error("CORS blocked"), false);
  },
  credentials: true
};

// Server-side pricing policy
const APPLY_TARIFF_SERVER = String(process.env.APPLY_TARIFF || "true").trim().toLowerCase() !== "false";


// ===== Cart incentives (one-time buyer AOV boosters) =====
// Keep server+client consistent by exposing this via GET /storefront-config
function _parseJsonEnv(name, fallback) {
  try {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed == null) ? fallback : parsed;
  } catch {
    return fallback;
  }
}


// ===== Feature flags runtime config =====
// Central on/off switches for major subsystems (stored in Mongo; ENV fallback)
// This allows you to quickly pause specific features without redeploying.

const FeatureFlagsConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // "global"
  data: { type: Object, default: {} }
}, { timestamps: true });

const FeatureFlagsConfig = mongoose.models.FeatureFlagsConfig || mongoose.model("FeatureFlagsConfig", FeatureFlagsConfigSchema);
// --- Config history + ops alerts (for rollback + anomaly monitoring) ---
const ConfigHistorySchema = new mongoose.Schema({
  type: { type: String, required: true, index: true }, // featureFlags|profit|incentives|emailMarketing
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: () => new Date(), index: true },
  adminEmail: { type: String, default: "" },
  note: { type: String, default: "" }
});
const ConfigHistory = mongoose.models.ConfigHistory || mongoose.model("ConfigHistory", ConfigHistorySchema);

const OpsAlertSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true }, // margin_floor|refund_spike|webhook_errors|bot_spike
  severity: { type: String, default: "info", index: true }, // info|warn|critical
  message: { type: String, default: "" },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  // TTL is defined via schema.index below; do not also set field-level index to avoid duplicates.
  createdAt: { type: Date, default: () => new Date() },
  ackAt: { type: Date, default: null },
  ackBy: { type: String, default: "" }
});
OpsAlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 }); // 60 days TTL
const OpsAlert = mongoose.models.OpsAlert || mongoose.model("OpsAlert", OpsAlertSchema);

async function _saveConfigHistory(type, data, adminEmail, note = "") {
  try {
    await ConfigHistory.create({ type, data, adminEmail: String(adminEmail || ""), note: String(note || "") });
  } catch (e) {
    console.warn("ConfigHistory save failed:", e?.message || e);
  }
}


const DEFAULT_FEATURE_FLAGS = Object.freeze({
  incentives: { enabled: true },
  smartReco: {
    enabled: true,
    placements: { cart_topup_v1: true, cart_crosssell_v1: true, checkout_lastchance_v1: true },
    discount: { enabled: true, minPct: 2, maxPct: 6, ttlMinutes: 120, minMarginPct: 0.15 }
  },
  profitGuardrails: { enabled: true },
  fraudVelocity: { enabled: true },
  analyticsIngest: { enabled: true },
  emailMarketing: { enabled: true }
});

let _featureFlagsCache = null;
let _featureFlagsCacheAt = 0;

function _mergeDeepFlags(base, over) {
  if (!over || typeof over !== "object") return base;
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k of Object.keys(over)) {
    const bv = base ? base[k] : undefined;
    const ov = over[k];
    if (ov && typeof ov === "object" && !Array.isArray(ov) && bv && typeof bv === "object" && !Array.isArray(bv)) {
      out[k] = _mergeDeepFlags(bv, ov);
    } else {
      out[k] = ov;
    }
  }
  return out;
}

async function _getFeatureFlagsConfig() {
  const now = Date.now();
  if (_featureFlagsCache && (now - _featureFlagsCacheAt) < 60_000) return _featureFlagsCache;
  try {
    const doc = await FeatureFlagsConfig.findOne({ key: "global" }).lean();
    const merged = _mergeDeepFlags(DEFAULT_FEATURE_FLAGS, doc?.data || {});
    _featureFlagsCache = merged;
    _featureFlagsCacheAt = now;
    return merged;
  } catch {
    _featureFlagsCache = DEFAULT_FEATURE_FLAGS;
    _featureFlagsCacheAt = now;
    return DEFAULT_FEATURE_FLAGS;
  }
}

// Best-effort sync getter (used in hot paths)
function getFeatureFlagsRuntimeSyncBestEffort() {
  if (_featureFlagsCache) return _featureFlagsCache;
  return DEFAULT_FEATURE_FLAGS;
}

async function _setFeatureFlagsConfig(data) {
  const safeBool = (v) => (v === true || v === "true" || v === 1 || v === "1");
  const toPlacements = (p) => {
    const out = { cart_topup_v1: true, cart_crosssell_v1: true, checkout_lastchance_v1: true };
    if (!p || typeof p !== "object") return out;
    for (const k of Object.keys(out)) out[k] = safeBool(p[k]);
    return out;
  };

  const cleaned = {
    incentives: { enabled: safeBool(data?.incentives?.enabled) },
    smartReco: {
      enabled: safeBool(data?.smartReco?.enabled),
      placements: toPlacements(data?.smartReco?.placements)
    },
    profitGuardrails: { enabled: safeBool(data?.profitGuardrails?.enabled) },
    fraudVelocity: { enabled: safeBool(data?.fraudVelocity?.enabled) },
    analyticsIngest: { enabled: safeBool(data?.analyticsIngest?.enabled) },
    emailMarketing: { enabled: safeBool(data?.emailMarketing?.enabled) }
  };

  await FeatureFlagsConfig.updateOne(
    { key: "global" },
    { $set: { key: "global", data: cleaned } },
    { upsert: true }
  );

  _featureFlagsCache = _mergeDeepFlags(DEFAULT_FEATURE_FLAGS, cleaned);
  _featureFlagsCacheAt = Date.now();
  return _featureFlagsCache;
}

// ===== Cart incentives runtime config =====
// Source of truth:
// 1) MongoDB IncentivesConfig (key="global") if present
// 2) ENV defaults as fallback

function _envBool(name, defVal) {
  const v = String(process.env[name] ?? "").trim().toLowerCase();
  if (!v) return defVal;
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return defVal;
}


function _normPct(p) {
  const x = Number(p || 0) || 0;
  if (!Number.isFinite(x) || x <= 0) return 0;
  // Accept both percent points (e.g. 3) and fractional (e.g. 0.03)
  if (x > 0 && x <= 1) return x * 100;
  return x;
}

function _buildIncentivesFromEnv() {
  const enabled = _envBool("CART_INCENTIVES_ENABLED", true);

  const freeShipping = {
    enabled: _envBool("FREE_SHIPPING_ENABLED", true),
    thresholdEUR: Math.max(0, Number(process.env.FREE_SHIPPING_THRESHOLD_EUR || 0) || 0),
    shippingFeeEUR: Math.max(0, Number(process.env.SHIPPING_FEE_EUR || 0) || 0)
  };

  const tierDiscount = {
    enabled: _envBool("TIER_DISCOUNT_ENABLED", true),
    // If false, tier discount will NOT apply to items that already have an item-level discount (e.g. reco token).
    // Threshold unlock is still based on the full cart subtotal.
    applyToDiscountedItems: _envBool("TIER_DISCOUNT_APPLY_TO_DISCOUNTED_ITEMS", false),
    tiers: (() => {
      const def = [
        { minEUR: 25, pct: 3 },
        { minEUR: 40, pct: 6 },
        { minEUR: 60, pct: 10 }
      ];
      const arr = _parseJsonEnv("TIER_DISCOUNT_TIERS_JSON", def);
      const norm = Array.isArray(arr) ? arr : def;
      return norm
        .map(t => ({
          minEUR: Math.max(0, Number(t?.minEUR || 0) || 0),
          pct: Math.max(0, Math.min(80, _normPct(t?.pct)))
        }))
        .filter(t => Number.isFinite(t.minEUR) && Number.isFinite(t.pct))
        .sort((a, b) => a.minEUR - b.minEUR)
        .slice(0, 50);
    })()
  };

  const bundles = {
    enabled: _envBool("BUNDLE_DISCOUNT_ENABLED", false),
    bundles: (() => {
      const def = [];
      const arr = _parseJsonEnv("BUNDLE_DISCOUNT_BUNDLES_JSON", def);
      const norm = Array.isArray(arr) ? arr : def;
      return norm
        .map(b => ({
          id: String(b?.id || "").slice(0, 64),
          title: String(b?.title || "").slice(0, 120),
          pct: Math.max(0, Math.min(80, _normPct(b?.pct))),
          productIds: (Array.isArray(b?.productIds) ? b.productIds : []).map(x => String(x || "").trim()).filter(Boolean).slice(0, 50)
        }))
        .filter(b => b.id && b.pct > 0 && b.productIds.length >= 2);
    })()
  };

  const topup = {
    maxItems: Math.max(0, Math.min(50, Number(process.env.TOPUP_MAX_ITEMS || 8) || 8)),
    maxPriceDeltaPct: Math.max(0, Math.min(1000, Number(process.env.TOPUP_MAX_PRICE_DELTA_PCT || 30) || 30))
  };

  return { enabled, freeShipping, tierDiscount, bundles, topup };
}

function _normalizeIncentivesConfig(cfg) {
  const env = _buildIncentivesFromEnv();
  const c = (cfg && typeof cfg === "object") ? cfg : {};

  const enabled = (c.enabled != null) ? !!c.enabled : env.enabled;

  const freeShipping = {
    enabled: (c.freeShipping?.enabled != null) ? !!c.freeShipping.enabled : env.freeShipping.enabled,
    thresholdEUR: Math.max(0, Number(c.freeShipping?.thresholdEUR ?? env.freeShipping.thresholdEUR) || 0),
    shippingFeeEUR: Math.max(0, Number(c.freeShipping?.shippingFeeEUR ?? env.freeShipping.shippingFeeEUR) || 0)
  };

  const tierDiscount = {
    enabled: (c.tierDiscount?.enabled != null) ? !!c.tierDiscount.enabled : env.tierDiscount.enabled,
    applyToDiscountedItems: (c.tierDiscount?.applyToDiscountedItems != null)
      ? !!c.tierDiscount.applyToDiscountedItems
      : env.tierDiscount.applyToDiscountedItems,
    tiers: Array.isArray(c.tierDiscount?.tiers) ? c.tierDiscount.tiers : env.tierDiscount.tiers
  };

  tierDiscount.tiers = (Array.isArray(tierDiscount.tiers) ? tierDiscount.tiers : [])
    .map(t => ({
      minEUR: Math.max(0, Number(t?.minEUR || 0) || 0),
      pct: Math.max(0, Math.min(80, _normPct(t?.pct)))
    }))
    .filter(t => Number.isFinite(t.minEUR) && Number.isFinite(t.pct))
    .sort((a, b) => a.minEUR - b.minEUR)
    .slice(0, 50);

  const bundles = {
    enabled: (c.bundles?.enabled != null) ? !!c.bundles.enabled : env.bundles.enabled,
    bundles: Array.isArray(c.bundles?.bundles) ? c.bundles.bundles : env.bundles.bundles
  };

  bundles.bundles = (Array.isArray(bundles.bundles) ? bundles.bundles : [])
    .map(b => ({
      id: String(b?.id || "").slice(0, 64),
      title: String(b?.title || "").slice(0, 120),
      pct: Math.max(0, Math.min(80, _normPct(b?.pct))),
      productIds: (Array.isArray(b?.productIds) ? b.productIds : []).map(x => String(x || "").trim()).filter(Boolean).slice(0, 50)
    }))
    .filter(b => b.id && b.pct > 0 && b.productIds.length >= 2)
    .slice(0, 50);

  const topup = {
    maxItems: Math.max(0, Math.min(50, Number(c.topup?.maxItems ?? env.topup.maxItems) || 0)),
    maxPriceDeltaPct: Math.max(0, Math.min(1000, Number(c.topup?.maxPriceDeltaPct ?? env.topup.maxPriceDeltaPct) || 0))
  };

  return { enabled, freeShipping, tierDiscount, bundles, topup };
}

let __INCENTIVES_RUNTIME = _buildIncentivesFromEnv();
let __INCENTIVES_RUNTIME_AT = 0;

async function refreshIncentivesRuntime({ force = false } = {}) {
  const now = Date.now();
  if (!force && __INCENTIVES_RUNTIME_AT && (now - __INCENTIVES_RUNTIME_AT) < 60_000) return __INCENTIVES_RUNTIME;
  __INCENTIVES_RUNTIME_AT = now;
  try {
    // If DB is not connected yet, keep env config.
    if (!mongoose?.connection?.readyState) return __INCENTIVES_RUNTIME;

    const doc = await IncentivesConfig.findOne({ key: "global" }).lean();
    if (doc) {
      __INCENTIVES_RUNTIME = _normalizeIncentivesConfig(doc);
    } else {
      __INCENTIVES_RUNTIME = _buildIncentivesFromEnv();
    }
  } catch (e) {
    console.error("[incentives] refresh failed, using last config", e);
  }
  return __INCENTIVES_RUNTIME;
}

function getIncentivesRuntimeSync() {
  return (__INCENTIVES_RUNTIME && typeof __INCENTIVES_RUNTIME === "object") ? __INCENTIVES_RUNTIME : _buildIncentivesFromEnv();
}

function computeCartIncentivesServer({ baseTotalEUR, normalizedItems }) {
  const cfg = getIncentivesRuntimeSync();
  const _ff = getFeatureFlagsRuntimeSyncBestEffort();
  const enabled = !!cfg.enabled && !!_ff?.incentives?.enabled;
  const _baseTotalRounded = round2(baseTotalEUR);
  const out = {
    enabled,
    baseTotalEUR: _baseTotalRounded,
    applyToDiscountedItems: (cfg?.tierDiscount?.applyToDiscountedItems !== false),
    tierEligibleSubtotalEUR: 0,
    tierBaseEUR: 0,
    tierPct: 0,
    tierDiscountEUR: 0,
    bundlePct: 0,
    bundleDiscountEUR: 0,
    shippingFeeEUR: 0,
    freeShippingEligible: false,
    subtotalAfterDiscountsEUR: round2(baseTotalEUR),
    totalWithShippingEUR: round2(baseTotalEUR)
  };
  if (!enabled) return out;

  let subtotal = Number(baseTotalEUR) || 0;

  // Eligible subtotal for tier discount when applyToDiscountedItems is false.
  // NOTE: eligibility is based on item-level discount signals (recoDiscountPct/token).
  let tierEligibleSubtotal = 0;
  try {
    const items = Array.isArray(normalizedItems) ? normalizedItems : [];
    for (const it of items) {
      const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
      const unit = Number(it?.unitPriceEUR ?? it?.price ?? 0) || 0;
      const line = unit * qty;
      if (!Number.isFinite(line) || line <= 0) continue;
      const isDiscountedItem = (Number(it?.recoDiscountPct || 0) > 0) || !!it?.recoDiscountToken;
      if (!isDiscountedItem) tierEligibleSubtotal += line;
    }
  } catch { }

  // Bundle discount (all-or-nothing per bundle, max one applied)
  if (cfg.bundles.enabled && cfg.bundles.bundles.length) {
    const cartIds = new Set((normalizedItems || []).map(i => String(i?.productId || "").trim()).filter(Boolean));
    let best = null;
    for (const b of cfg.bundles.bundles) {
      const ok = b.productIds.every(pid => cartIds.has(String(pid)));
      if (!ok) continue;
      if (!best || b.pct > best.pct) best = b;
    }
    if (best) {
      out.bundlePct = best.pct;
      out.bundleDiscountEUR = round2(subtotal * (best.pct / 100));
      subtotal = subtotal - out.bundleDiscountEUR;

      // Keep tierEligibleSubtotal in the same "post-bundle" space by applying the same bundle %.
      // This is a proportional allocation (safe + deterministic, avoids per-item rounding).
      if (Number.isFinite(tierEligibleSubtotal) && tierEligibleSubtotal > 0) {
        tierEligibleSubtotal = tierEligibleSubtotal * (1 - (best.pct / 100));
      }
    }
  }

  // Tiered discount on (post-bundle) subtotal
  if (cfg.tierDiscount.enabled && cfg.tierDiscount.tiers.length) {
    let tierPct = 0;
    for (const t of cfg.tierDiscount.tiers) {
      if (subtotal >= t.minEUR) tierPct = Math.max(tierPct, t.pct);
    }
    out.tierPct = tierPct;

    // Threshold unlock uses the full post-bundle subtotal (subtotal).
    // Discount amount may optionally exclude already-discounted items.
    const applyToDiscounted = (cfg.tierDiscount?.applyToDiscountedItems !== false);
    const tierBase = applyToDiscounted ? subtotal : Math.max(0, Number(tierEligibleSubtotal) || 0);
    out.tierEligibleSubtotalEUR = round2(Math.max(0, Number(tierEligibleSubtotal) || 0));
    out.tierBaseEUR = round2(Math.max(0, Number(tierBase) || 0));
    out.tierDiscountEUR = tierPct > 0 ? round2(tierBase * (tierPct / 100)) : 0;
    subtotal = subtotal - out.tierDiscountEUR;
  }

  // ---- Persist line-level allocations for management UI (deterministic cents allocation) ----
  try {
    const items = Array.isArray(normalizedItems) ? normalizedItems : [];
    const roundCents = (v) => Math.round((Number(v) || 0) * 100);
    const toEUR = (c) => Math.round(Number(c || 0)) / 100;

    const lineCents = items.map(it => {
      const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
      const unit = Number(it?.unitPriceEUR ?? it?.price ?? 0) || 0;
      return roundCents(unit * qty);
    });

    const sumCents = lineCents.reduce((a, b) => a + b, 0);

    function allocProportional(totalCents, weights) {
      totalCents = Math.max(0, Math.round(totalCents || 0));
      const w = (weights || []).map(x => Math.max(0, Math.round(x || 0)));
      const wsum = w.reduce((a, b) => a + b, 0);
      const out = new Array(w.length).fill(0);
      if (totalCents <= 0 || wsum <= 0) return out;

      // first pass floor
      let used = 0;
      const fracs = [];
      for (let i = 0; i < w.length; i++) {
        const raw = totalCents * (w[i] / wsum);
        const flo = Math.floor(raw);
        out[i] = flo;
        used += flo;
        fracs.push({ i, frac: raw - flo });
      }
      let rem = totalCents - used;
      fracs.sort((a, b) => b.frac - a.frac);
      for (let k = 0; k < fracs.length && rem > 0; k++) {
        out[fracs[k].i] += 1;
        rem -= 1;
      }
      return out;
    }

    // Bundle discount is applied across full subtotal (post item discounts) proportionally by line value
    const bundleTotalCents = roundCents(out.bundleDiscountEUR || 0);
    const bundleAlloc = allocProportional(bundleTotalCents, lineCents);

    const applyToDiscounted = (cfg.tierDiscount?.applyToDiscountedItems !== false);
    const eligibleWeights = items.map((it, i) => {
      const isDiscountedItem = (Number(it?.recoDiscountPct || 0) > 0) || !!it?.recoDiscountToken;
      const eligible = applyToDiscounted ? true : !isDiscountedItem;
      // Eligible weight is line value after bundle allocation (same proportional space)
      const afterBundle = Math.max(0, lineCents[i] - (bundleAlloc[i] || 0));
      return eligible ? afterBundle : 0;
    });

    const tierTotalCents = roundCents(out.tierDiscountEUR || 0);
    const tierAlloc = allocProportional(tierTotalCents, eligibleWeights);

    out.itemsEnriched = items.map((it, i) => {
      const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
      const line = lineCents[i] || 0;
      const bDisc = bundleAlloc[i] || 0;
      const tDisc = tierAlloc[i] || 0;
      const after = Math.max(0, line - bDisc - tDisc);
      const unitPaid = toEUR(after / qty);

      const isDiscountedItem = (Number(it?.recoDiscountPct || 0) > 0) || !!it?.recoDiscountToken;
      const tierEligible = applyToDiscounted ? true : !isDiscountedItem;
      return {
        ...it,
        appliedBundlePct: Number(out.bundlePct || 0) || 0,
        bundleDiscountEURLine: toEUR(bDisc),
        appliedTierPct: tierEligible ? (Number(out.tierPct || 0) || 0) : 0,
        tierDiscountEURLine: toEUR(tDisc),
        tierEligibleForThisItem: !!tierEligible,
        unitPricePaidEffectiveEUR: unitPaid,
        totalPaidEffectiveEUR: toEUR(after)
      };
    });
  } catch (e) {
    // fail-open: do not block PI creation if allocation fails
    out.itemsEnriched = Array.isArray(normalizedItems) ? normalizedItems : [];
  }


  // ---- Profit guardrails (avoid discounts that destroy contribution) ----
  try {
    const profitCfg = getProfitConfigRuntimeSyncBestEffort();
    if (profitCfg && profitCfg.enabled && getFeatureFlagsRuntimeSyncBestEffort()?.profitGuardrails?.enabled) {
      const revenueEUR = round2(Number(baseTotalEUR) || 0);
      const costEUR = _estimateOrderCostEUR(normalizedItems);
      const maxDisc = _maxDiscountAllowedEUR({ revenueEUR, costEUR, profitCfg });
      const currentDisc = round2((out.bundleDiscountEUR || 0) + (out.tierDiscountEUR || 0));

      if (maxDisc <= 0) {
        out.tierPct = 0; out.tierDiscountEUR = 0;
        out.bundlePct = 0; out.bundleDiscountEUR = 0;
        subtotal = revenueEUR;
      } else if (currentDisc > maxDisc) {
        let over = currentDisc - maxDisc;
        if (out.tierDiscountEUR > 0) {
          const cut = Math.min(out.tierDiscountEUR, over);
          out.tierDiscountEUR = round2(out.tierDiscountEUR - cut);
          over = round2(over - cut);
          if (out.tierDiscountEUR <= 0) out.tierPct = 0;
        }
        if (over > 0 && out.bundleDiscountEUR > 0) {
          const cut2 = Math.min(out.bundleDiscountEUR, over);
          out.bundleDiscountEUR = round2(out.bundleDiscountEUR - cut2);
          over = round2(over - cut2);
          if (out.bundleDiscountEUR <= 0) out.bundlePct = 0;
        }
        subtotal = round2(revenueEUR - out.bundleDiscountEUR - out.tierDiscountEUR);
      }
    }
  } catch (e) {
    console.warn("[profit-guard] failed:", e?.message || e);
  }

  subtotal = Math.max(0, round2(subtotal));
  out.subtotalAfterDiscountsEUR = subtotal;

  // Optional shipping fee waived at threshold
  const shipFee = cfg.freeShipping.shippingFeeEUR || 0;
  const threshold = cfg.freeShipping.thresholdEUR || 0;
  const shipEnabled = cfg.freeShipping.enabled && shipFee > 0 && threshold > 0;
  if (shipEnabled) {
    out.freeShippingEligible = subtotal >= threshold;
    out.shippingFeeEUR = out.freeShippingEligible ? 0 : round2(shipFee);
    out.totalWithShippingEUR = round2(subtotal + out.shippingFeeEUR);
  } else {
    out.freeShippingEligible = true; // nothing to unlock if fee is 0/disabled
    out.shippingFeeEUR = 0;
    out.totalWithShippingEUR = subtotal;
  }

  return out;
}


// Apply CORS to all routes
app.use(cors(corsOpts));
app.options('*', cors(corsOpts));







// =========================
// Email marketing automations (abandoned cart + post-purchase)
// =========================

const EMAIL_MARKETING_SECRET = String(process.env.EMAIL_MARKETING_SECRET || process.env.SMART_RECO_SECRET || process.env.JWT_SECRET || "").trim();
const STORE_PUBLIC_ORIGIN = String(process.env.STORE_PUBLIC_ORIGIN || "").trim();

const EmailMarketingConfigSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true, index: true },
  enabled: { type: Boolean, default: false },
  // If false, schedulers may still enqueue jobs (depending on per-flow settings) but nothing will be sent.
  sendingEnabled: { type: Boolean, default: true },
  // Default: explicit opt-in required. If enabled, paid customers can receive similar offers with opt-out.
  softOptInEnabled: { type: Boolean, default: false },
  fromName: { type: String, default: "" },
  fromEmail: { type: String, default: "" },
  replyTo: { type: String, default: "" },
  abandonedCart: {
    enabled: { type: Boolean, default: true },
    delaysHours: { type: [Number], default: [1, 24] },
    // Optional per-step enable switches aligned with delaysHours.
    // Backward-compatible: if missing, all steps are treated as enabled.
    stepEnabled: { type: [Boolean], default: [true, true, true] },
    maxEmailsPerDraft: { type: Number, default: 2 },
    includeIncentivePct: { type: Number, default: 0 }
  },
  postPurchase: {
    enabled: { type: Boolean, default: true },
    delayDays: { type: Number, default: 3 },
    includeIncentivePct: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

EmailMarketingConfigSchema.pre("save", function (next) { this.updatedAt = new Date(); next(); });

const EmailSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  consentExplicit: { type: Boolean, default: false },
  consentAt: { type: Date, default: null },
  source: { type: String, default: "" },
  lastSeenAt: { type: Date, default: null },
  lastOrderAt: { type: Date, default: null },
  unsubscribedAt: { type: Date, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

EmailSubscriberSchema.pre("save", function (next) { this.updatedAt = new Date(); next(); });

const EmailJobSchema = new mongoose.Schema({
  status: { type: String, default: "PENDING", index: true }, // PENDING | SENT | ERROR
  type: { type: String, default: "" },
  to: { type: String, required: true, index: true },
  subject: { type: String, default: "" },
  html: { type: String, default: "" },
  text: { type: String, default: "" },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  tries: { type: Number, default: 0 },
  lastError: { type: String, default: "" },
  scheduledAt: { type: Date, default: Date.now, index: true },
  // sentAt TTL index is defined via schema.index below; keep field un-indexed to avoid duplicates.
  sentAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

EmailJobSchema.pre("save", function (next) { this.updatedAt = new Date(); next(); });
EmailJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const EmailSendLogSchema = new mongoose.Schema({
  type: { type: String, default: "", index: true },
  to: { type: String, default: "", index: true },
  // key has a unique index defined below; avoid declaring a second field-level index.
  key: { type: String, default: "" },
  // sentAt TTL index is defined below; avoid duplicates.
  sentAt: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false });

EmailSendLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });
EmailSendLogSchema.index({ key: 1 }, { unique: true });

const EmailMarketingConfig = mongoose.models.EmailMarketingConfig || mongoose.model("EmailMarketingConfig", EmailMarketingConfigSchema);
const EmailSubscriber = mongoose.models.EmailSubscriber || mongoose.model("EmailSubscriber", EmailSubscriberSchema);
const EmailJob = mongoose.models.EmailJob || mongoose.model("EmailJob", EmailJobSchema);
const EmailSendLog = mongoose.models.EmailSendLog || mongoose.model("EmailSendLog", EmailSendLogSchema);

function _normEmail(v) {
  const s = String(v || "").trim().toLowerCase();
  return (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) ? s : "";
}

function _hmacToken(payloadObj) {
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", EMAIL_MARKETING_SECRET || "fallback").update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function _verifyHmacToken(token) {
  try {
    const t = String(token || "");
    const parts = t.split(".");
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = crypto.createHmac("sha256", EMAIL_MARKETING_SECRET || "fallback").update(payload).digest("base64url");
    const a = Buffer.from(String(expected), "utf8");
    const b = Buffer.from(String(sig), "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function _bestStoreOrigin(fallbackOrigin) {
  const o = String(STORE_PUBLIC_ORIGIN || fallbackOrigin || "").trim();
  if (!o) return "";
  try { return new URL(o).origin; } catch { return o; }
}

function _buildUnsubUrl({ email, origin }) {
  const storeOrigin = _bestStoreOrigin(origin);
  if (!storeOrigin) return "";
  const token = _hmacToken({ t: "unsub", email, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  const u = new URL("/email/unsubscribe", storeOrigin);
  u.searchParams.set("token", token);
  return u.toString();
}

function _renderProductCards(items = [], origin) {
  const storeOrigin = _bestStoreOrigin(origin);
  const esc = (s) => String(s || "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const cards = (items || []).slice(0, 6).map((p) => {
    const name = esc(p?.name || "");
    const img = esc(p?.image || "");
    const link = p?.productLink ? esc(p.productLink) : "";
    const href = (storeOrigin && link && !/^https?:/i.test(link)) ? (storeOrigin + (link.startsWith("/") ? link : ("/" + link))) : link;
    const price = Number(p?.price || p?.unitPriceEUR || 0) || 0;
    return `
      <a href="${href}" style="text-decoration:none;color:inherit">
        <div style="border:1px solid #e9e9ef;border-radius:14px;padding:12px;display:flex;gap:12px;align-items:center">
          <img src="${img}" alt="${name}" style="width:72px;height:72px;object-fit:cover;border-radius:12px;background:#f3f4f6" />
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;line-height:1.2">${name}</div>
            <div style="margin-top:6px;font-size:14px;font-weight:800">€${price.toFixed(2)}</div>
          </div>
        </div>
      </a>`;
  }).join("\n");
  return `<div style="display:grid;grid-template-columns:1fr;gap:10px">${cards}</div>`;
}

function _renderEmailShell({ title, bodyHtml, footerHtml }) {
  const esc = (s) => String(s || "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial,sans-serif;background:#f6f7fb;padding:22px">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ececf2;border-radius:18px;overflow:hidden">
      <div style="padding:18px 18px 10px 18px">
        <div style="font-size:18px;font-weight:900;line-height:1.25">${esc(title)}</div>
      </div>
      <div style="padding:0 18px 18px 18px">
        ${bodyHtml || ""}
      </div>
      <div style="padding:14px 18px;background:#fbfbfe;border-top:1px solid #ececf2;color:#6b7280;font-size:12px;line-height:1.35">
        ${footerHtml || ""}
      </div>
    </div>
  </div>`;
}

async function _getEmailMarketingConfig() {
  const cfg = await EmailMarketingConfig.findOne({ key: "global" }).lean();
  return cfg || {
    key: "global",
    enabled: false,
    softOptInEnabled: false,
    fromName: "",
    fromEmail: "",
    replyTo: "",
    abandonedCart: { enabled: true, delaysHours: [1, 24], maxEmailsPerDraft: 2, includeIncentivePct: 0 },
    postPurchase: { enabled: true, delayDays: 3, includeIncentivePct: 0 }
  };
}

function _getMarketingTransporter() {
  const u = String(process.env.MARKETING_EMAIL_USER || "").trim();
  const p = String(process.env.MARKETING_EMAIL_PASS || "").trim();
  if (u && p) {
    return nodemailer.createTransport({ service: "gmail", auth: { user: u, pass: p } });
  }
  return confirmationTransporter || transporter;
}

async function _upsertSubscriberFromCustomer({ email, explicitOptIn, origin, meta }) {
  const e = _normEmail(email);
  if (!e) return null;
  const now = new Date();
  const update = {
    $set: { lastSeenAt: now, updatedAt: now, source: String(origin || "checkout").slice(0, 60) },
    $setOnInsert: { createdAt: now, email: e }
  };
  if (explicitOptIn) {
    update.$set.consentExplicit = true;
    update.$set.consentAt = now;
  }
  if (meta && typeof meta === "object") update.$set.meta = { ...(meta || {}) };
  return EmailSubscriber.findOneAndUpdate({ email: e }, update, { upsert: true, new: true }).lean();
}

async function _enqueueEmail({ type, to, subject, html, text, scheduledAt, meta }) {
  const email = _normEmail(to);
  if (!email) return null;
  return EmailJob.create({
    status: "PENDING",
    type: String(type || "").slice(0, 60),
    to: email,
    subject: String(subject || "").slice(0, 200),
    html: String(html || ""),
    text: String(text || ""),
    meta: (meta && typeof meta === "object") ? meta : {},
    scheduledAt: scheduledAt instanceof Date ? scheduledAt : new Date(Date.now() + 1000),
    tries: 0
  });
}

async function _processEmailQueueOnce() {
  const cfg = await _getEmailMarketingConfig();
  const ff = getFeatureFlagsRuntimeSyncBestEffort();
  if (!ff?.emailMarketing?.enabled) return;
  if (!cfg.enabled || cfg.sendingEnabled === false) return;

  const transporterLocal = _getMarketingTransporter();
  const now = new Date();
  const jobs = await EmailJob.find({ status: "PENDING", scheduledAt: { $lte: now } }).sort({ scheduledAt: 1 }).limit(15);
  if (!jobs.length) return;

  for (const job of jobs) {
    try {
      const sub = await EmailSubscriber.findOne({ email: job.to }).lean();
      if (sub?.unsubscribedAt) {
        job.status = "ERROR";
        job.lastError = "UNSUBSCRIBED";
        job.tries += 1;
        await job.save();
        continue;
      }

      const fromEmail = String(cfg.fromEmail || process.env.MARKETING_EMAIL_USER || process.env.CONFIRMATION_EMAIL_USER || "").trim();
      if (!fromEmail) throw new Error("MARKETING_FROM_EMAIL_MISSING");
      const fromName = String(cfg.fromName || "").trim();
      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
      const replyTo = String(cfg.replyTo || "").trim() || undefined;

      await transporterLocal.sendMail({ from, to: job.to, subject: job.subject, html: job.html, text: job.text || undefined, replyTo });

      job.status = "SENT";
      job.sentAt = new Date();
      job.tries += 1;
      job.lastError = "";
      await job.save();
    } catch (e) {
      job.status = (job.tries >= 2) ? "ERROR" : "PENDING";
      job.tries += 1;
      job.lastError = String(e?.message || e || "ERROR").slice(0, 400);
      job.scheduledAt = new Date(Date.now() + (job.tries * job.tries) * 60 * 1000);
      await job.save();
    }
  }
}

async function _pickEmailOfferProducts({ origin, excludeNames = [] }) {
  const ex = new Set((excludeNames || []).map(s => String(s || "").trim().toLowerCase()).filter(Boolean));
  const list = (productsFlatCache || []).filter(p => {
    const n = String(p?.name || "").trim().toLowerCase();
    if (!n || ex.has(n)) return false;
    const price = Number(p?.price ?? p?.unitPriceEUR ?? p?.priceEUR ?? 0) || 0;
    return price > 0;
  });
  // Prefer items with any built-in popularity field if present
  list.sort((a, b) => (Number(b?.soldCount || b?.sold || b?.sales || 0) || 0) - (Number(a?.soldCount || a?.sold || a?.sales || 0) || 0));
  return list.slice(0, 6);
}

async function _scheduleAbandonedCartEmails() {
  const cfg = await _getEmailMarketingConfig();
  const ff = getFeatureFlagsRuntimeSyncBestEffort();
  if (!ff?.emailMarketing?.enabled) return;
  if (!cfg.enabled || !cfg.abandonedCart?.enabled) return;

  const delays = Array.isArray(cfg.abandonedCart.delaysHours) ? cfg.abandonedCart.delaysHours : [1, 24];
  const stepEnabled = Array.isArray(cfg.abandonedCart.stepEnabled) ? cfg.abandonedCart.stepEnabled : [];
  const now = Date.now();
  const maxPerDraft = Math.max(1, Number(cfg.abandonedCart.maxEmailsPerDraft || 2) || 2);
  const minDelay = Math.min(...delays.map(d => Number(d) || 0).filter(d => d > 0), 1);
  const cutoff = new Date(now - Math.max(10 * 60 * 1000, minDelay * 60 * 60 * 1000));

  const drafts = await DraftOrder.find({
    status: "CHECKOUT",
    updatedAt: { $lte: cutoff },
    "customer.email": { $exists: true, $ne: "" }
  }).sort({ updatedAt: 1 }).limit(60);

  for (const d of drafts) {
    const email = _normEmail(d?.customer?.email);
    if (!email) continue;
    if (d?.customer?.marketingUnsubscribedAt) continue;

    const explicitOptIn = !!d?.customer?.marketingOptIn;
    if (!explicitOptIn) continue; // drafts: require explicit opt-in

    await _upsertSubscriberFromCustomer({ email, explicitOptIn, origin: d.websiteOrigin || "checkout", meta: { country: d?.accounting?.customerCountryCode || "" } });

    for (let i = 0; i < delays.length && i < maxPerDraft; i++) {
      if (stepEnabled.length && stepEnabled[i] === false) continue;
      const h = Math.max(0.25, Number(delays[i] || 0) || 0);
      const dueAt = new Date((d.updatedAt?.getTime?.() || d.createdAt?.getTime?.() || now) + h * 60 * 60 * 1000);
      if (dueAt.getTime() > now) continue;

      const key = `draft:${String(d._id)}:${i + 1}`;
      const already = await EmailSendLog.findOne({ key }).lean();
      if (already) continue;

      const items = (d.items || []).slice(0, 4).map(x => ({ name: x.name, price: x.price, image: x.image, productLink: x.productLink }));
      const offers = await _pickEmailOfferProducts({ origin: d.websiteOrigin, excludeNames: items.map(i2 => i2.name) });
      const unsub = _buildUnsubUrl({ email, origin: d.websiteOrigin });

      const title = (i === 0) ? "You left something in your cart" : "Still thinking it over?";
      const body = `
        <div style="font-size:14px;color:#111827;line-height:1.5">
          <p style="margin:0 0 12px 0">Your cart is still waiting.</p>
          ${items.length ? `<div style="margin:14px 0 10px 0;font-weight:800">Your cart</div>${_renderProductCards(items, d.websiteOrigin)}` : ""}
          <div style="margin:18px 0 8px 0;font-weight:800">Popular picks right now</div>
          ${_renderProductCards(offers, d.websiteOrigin)}
        </div>`;
      const footer = `${unsub ? `Don’t want offers? <a href="${unsub}">Unsubscribe</a>.` : ""}`;
      const html = _renderEmailShell({ title, bodyHtml: body, footerHtml: footer });

      await _enqueueEmail({
        type: `abandoned_cart_${i + 1}`,
        to: email,
        subject: (i === 0) ? "Your cart is waiting" : "Complete your order in a minute",
        html,
        scheduledAt: new Date(Date.now() + 3000),
        meta: { key, draftId: String(d._id), step: i + 1 }
      });
      await EmailSendLog.create({ type: `abandoned_cart_${i + 1}`, to: email, key, meta: { draftId: String(d._id) } }).catch(() => { });
    }
  }
}

async function _schedulePostPurchaseEmails() {
  const cfg = await _getEmailMarketingConfig();
  const ff = getFeatureFlagsRuntimeSyncBestEffort();
  if (!ff?.emailMarketing?.enabled) return;
  if (!cfg.enabled || !cfg.postPurchase?.enabled) return;

  const delayMs = Math.max(6 * 60 * 60 * 1000, (Number(cfg.postPurchase.delayDays || 3) || 3) * 24 * 60 * 60 * 1000);
  const cutoff = new Date(Date.now() - delayMs);

  const orders = await Order.find({
    status: { $in: ["PAID", "FULFILLING", "SHIPPED", "DELIVERED"] },
    createdAt: { $lte: cutoff },
    "customer.email": { $exists: true, $ne: "" }
  }).sort({ createdAt: -1 }).limit(80);

  for (const o of orders) {
    const email = _normEmail(o?.customer?.email);
    if (!email) continue;
    if (o?.customer?.marketingUnsubscribedAt) continue;

    const explicitOptIn = !!o?.customer?.marketingOptIn;
    const eligible = explicitOptIn || cfg.softOptInEnabled;
    if (!eligible) continue;

    await _upsertSubscriberFromCustomer({ email, explicitOptIn, origin: o.websiteOrigin || "order", meta: { country: o?.accounting?.customerCountryCode || "" } });

    const key = `order:${String(o._id)}:post1`;
    const already = await EmailSendLog.findOne({ key }).lean();
    if (already) continue;

    const offers = await _pickEmailOfferProducts({ origin: o.websiteOrigin, excludeNames: (o.items || []).map(i2 => i2.name) });
    const unsub = _buildUnsubUrl({ email, origin: o.websiteOrigin });

    const title = "Recommended add-ons";
    const body = `
      <div style="font-size:14px;color:#111827;line-height:1.5">
        <p style="margin:0 0 12px 0">These items pair well with your recent purchase.</p>
        ${_renderProductCards(offers, o.websiteOrigin)}
      </div>`;
    const footer = `${unsub ? `Don’t want offers? <a href="${unsub}">Unsubscribe</a>.` : ""}`;
    const html = _renderEmailShell({ title, bodyHtml: body, footerHtml: footer });

    await _enqueueEmail({
      type: "post_purchase_1",
      to: email,
      subject: "A few picks that go perfectly together",
      html,
      scheduledAt: new Date(Date.now() + 3000),
      meta: { key, orderId: String(o._id) }
    });
    await EmailSendLog.create({ type: "post_purchase_1", to: email, key, meta: { orderId: String(o._id) } }).catch(() => { });
  }
}

app.get("/email/unsubscribe", async (req, res) => {
  try {
    const token = String(req.query?.token || "");
    const obj = _verifyHmacToken(token);
    const email = _normEmail(obj?.email);
    const exp = Number(obj?.exp || 0) || 0;
    if (!obj || obj.t !== "unsub" || !email || (exp && Date.now() > exp)) {
      return res.status(400).send("Invalid unsubscribe link.");
    }
    await EmailSubscriber.findOneAndUpdate(
      { email },
      { $set: { unsubscribedAt: new Date(), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), email } },
      { upsert: true }
    );
    await Order.updateMany({ "customer.email": email }, { $set: { "customer.marketingUnsubscribedAt": new Date() } }).catch(() => { });
    await DraftOrder.updateMany({ "customer.email": email }, { $set: { "customer.marketingUnsubscribedAt": new Date() } }).catch(() => { });
    return res.status(200).send("You have been unsubscribed.");
  } catch {
    return res.status(500).send("Error.");
  }
});

app.get("/admin/email-marketing/config", requireAdmin, async (req, res) => {
  const cfg = await _getEmailMarketingConfig();
  return res.json({ ok: true, config: cfg });
});

app.put("/admin/email-marketing/config", requireAdmin, async (req, res) => {
  const __prev = await _getEmailMarketingConfigRuntime().catch(() => null);
  if (__prev) await _saveConfigHistory("emailMarketing", __prev, req.user?.sub || "", "update");

  const body = (req.body && typeof req.body === "object") ? req.body : {};
  const safeBool = (v) => (v === true || v === "true" || v === 1 || v === "1");
  const safeStr = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const safeNum = (v, d) => {
    const x = Number(v); return Number.isFinite(x) ? x : d;
  };
  const safeArrNums = (a) => Array.isArray(a) ? a.map(x => safeNum(x, 0)).filter(x => x > 0 && x < 720).slice(0, 6) : [];

  const next = {
    key: "global",
    enabled: safeBool(body.enabled),
    sendingEnabled: (body.sendingEnabled == null) ? true : safeBool(body.sendingEnabled),
    softOptInEnabled: safeBool(body.softOptInEnabled),
    fromName: safeStr(body.fromName, 80),
    fromEmail: safeStr(body.fromEmail, 120),
    replyTo: safeStr(body.replyTo, 120),
    abandonedCart: {
      enabled: safeBool(body?.abandonedCart?.enabled),
      delaysHours: safeArrNums(body?.abandonedCart?.delaysHours),
      stepEnabled: Array.isArray(body?.abandonedCart?.stepEnabled)
        ? body.abandonedCart.stepEnabled.map(safeBool).slice(0, 6)
        : undefined,
      maxEmailsPerDraft: Math.max(1, Math.min(3, Math.floor(safeNum(body?.abandonedCart?.maxEmailsPerDraft, 2)))),
      includeIncentivePct: Math.max(0, Math.min(50, safeNum(body?.abandonedCart?.includeIncentivePct, 0)))
    },
    postPurchase: {
      enabled: safeBool(body?.postPurchase?.enabled),
      delayDays: Math.max(1, Math.min(30, Math.floor(safeNum(body?.postPurchase?.delayDays, 3)))),
      includeIncentivePct: Math.max(0, Math.min(50, safeNum(body?.postPurchase?.includeIncentivePct, 0)))
    }
  };

  const cfg = await EmailMarketingConfig.findOneAndUpdate({ key: "global" }, { $set: next, $setOnInsert: { createdAt: new Date() } }, { upsert: true, new: true });
  return res.json({ ok: true, config: cfg });
});

app.delete("/admin/email-marketing/config", requireAdmin, async (req, res) => {
  await EmailMarketingConfig.deleteOne({ key: "global" });
  return res.json({ ok: true });
});

app.get("/admin/email-marketing/stats", requireAdmin, async (req, res) => {
  const sinceDays = Math.max(1, Math.min(180, Number(req.query?.days || 30) || 30));
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const sent = await EmailJob.countDocuments({ status: "SENT", sentAt: { $gte: since } });
  const pending = await EmailJob.countDocuments({ status: "PENDING" });
  const subs = await EmailSubscriber.countDocuments({ unsubscribedAt: null });
  const unsub = await EmailSubscriber.countDocuments({ unsubscribedAt: { $ne: null } });
  return res.json({ ok: true, sentLastDays: sent, pending, subscribersActive: subs, subscribersUnsubscribed: unsub });
});

app.post("/admin/email-marketing/send-test", requireAdmin, async (req, res) => {
  const email = _normEmail(req.body?.email);
  if (!email) return res.status(400).json({ ok: false, error: "INVALID_EMAIL" });
  await _upsertSubscriberFromCustomer({ email, explicitOptIn: true, origin: "admin_test", meta: {} });
  const unsub = _buildUnsubUrl({ email, origin: STORE_PUBLIC_ORIGIN || "" });
  const html = _renderEmailShell({
    title: "Test email",
    bodyHtml: `<div style="font-size:14px;line-height:1.5"><p style="margin:0 0 10px 0">This is a test email from your marketing automations.</p></div>`,
    footerHtml: (unsub ? `Unsubscribe: <a href="${unsub}">Unsubscribe</a>` : "")
  });
  await _enqueueEmail({ type: "admin_test", to: email, subject: "Test email", html, scheduledAt: new Date(Date.now() + 1500), meta: { key: `test:${Date.now()}` } });
  return res.json({ ok: true });
});


// ===== Feature flags admin API =====
app.get("/admin/feature-flags/config", requireAdmin, async (req, res) => {
  const cfg = await _getFeatureFlagsConfig();
  return res.json({ ok: true, config: cfg });
});

app.put("/admin/feature-flags/config", requireAdmin, async (req, res) => {
  const __prev = await _getFeatureFlagsConfig().catch(() => null);
  if (__prev) await _saveConfigHistory("featureFlags", __prev, req.user?.sub || "", "update");

  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const cfg = await _setFeatureFlagsConfig(body);
    return res.json({ ok: true, config: cfg });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.delete("/admin/feature-flags/config", requireAdmin, async (req, res) => {
  try {
    await FeatureFlagsConfig.deleteOne({ key: "global" }).catch(() => { });
    _featureFlagsCache = DEFAULT_FEATURE_FLAGS;
    _featureFlagsCacheAt = Date.now();
    return res.json({ ok: true, config: DEFAULT_FEATURE_FLAGS });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ===== Config history + rollback =====
app.get("/admin/config-history", requireAdmin, async (req, res) => {
  try {
    const type = String(req.query.type || "").trim();
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50) || 50));
    if (!type) return res.status(400).json({ ok: false, error: "missing type" });
    const items = await ConfigHistory.find({ type }).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/admin/config-rollback", requireAdmin, async (req, res) => {
  try {
    const { type, historyId } = req.body || {};
    const t = String(type || "").trim();
    const id = String(historyId || "").trim();
    if (!t || !id) return res.status(400).json({ ok: false, error: "missing type/historyId" });
    const h = await ConfigHistory.findById(id).lean();
    if (!h || h.type !== t) return res.status(404).json({ ok: false, error: "history not found" });

    // Save current as history before rollback
    if (t === "featureFlags") await _saveConfigHistory("featureFlags", await _getFeatureFlagsConfig(), req.user?.sub || "", "rollback");
    if (t === "profit") await _saveConfigHistory("profit", await _getProfitConfigRuntime(), req.user?.sub || "", "rollback");
    if (t === "incentives") await _saveConfigHistory("incentives", await _getIncentivesConfigRuntime(), req.user?.sub || "", "rollback");
    if (t === "emailMarketing") await _saveConfigHistory("emailMarketing", await _getEmailMarketingConfigRuntime(), req.user?.sub || "", "rollback");

    let applied = null;
    if (t === "featureFlags") applied = await _setFeatureFlagsConfig(h.data || {});
    else if (t === "profit") applied = await _setProfitConfig(h.data || {});
    else if (t === "incentives") applied = await _setIncentivesConfig(h.data || {});
    else if (t === "emailMarketing") applied = await _setEmailMarketingConfig(h.data || {});
    else return res.status(400).json({ ok: false, error: "unknown type" });

    return res.json({ ok: true, config: applied });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ===== Ops alerts =====
app.get("/admin/ops/alerts", requireAdmin, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100) || 100));
    const includeAck = String(req.query.includeAck || "").toLowerCase() === "true" || String(req.query.includeAck || "") === "1";
    const q = includeAck ? {} : { ackAt: null };
    const items = await OpsAlert.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/admin/ops/alerts/:id/ack", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const a = await OpsAlert.findByIdAndUpdate(id, { $set: { ackAt: new Date(), ackBy: String(req.user?.sub || "") } }, { new: true }).lean();
    if (!a) return res.status(404).json({ ok: false, error: "not found" });
    return res.json({ ok: true, item: a });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ===== Ops: accounting export + bulk actions =====
function _csvEscape(v) {
  const s = (v === null || v === undefined) ? "" : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

app.get("/admin/orders/export.csv", requireAdmin, async (req, res) => {
  try {
    const { from, to, status } = req.query || {};
    const q = {};
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(String(from));
      if (to) q.createdAt.$lte = new Date(String(to));
    }
    if (status) q.status = { $in: String(status).split(",").map(s => s.trim()).filter(Boolean) };

    const orders = await Order.find(q).sort({ createdAt: -1 }).limit(20000).lean();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=orders_export.csv");

    const header = [
      "orderId", "createdAt", "paidAt", "status", "currency",
      "grossSaleEUR", "discountTotalEUR", "netPaidEUR",
      "stripeFeeEUR", "shippingCostEUR", "cogsEUR", "contributionEUR",
      "customerEmail", "country", "itemsCount", "items"
    ];
    res.write(header.join(",") + "\n");

    for (const o of orders) {
      const pricing = o.pricing || {};
      const costs = o.costs || {};
      const gross = Number(pricing.grossSaleEUR ?? pricing.grossEUR ?? 0) || 0;
      const net = Number(pricing.totalPaidEUR ?? o.paidEUR ?? 0) || 0;
      const disc = Number(pricing.discountTotalEUR ?? (gross - net) ?? 0) || 0;
      const stripeFee = Number(costs.stripeFeeEUR ?? o.stripeFeeEUR ?? 0) || 0;
      const ship = Number(costs.shippingCostEUR ?? o.shippingCostEUR ?? 0) || 0;
      const items = Array.isArray(o.items) ? o.items : [];
      const cogs = items.reduce((s, it) => s + (Number(it?.expectedPurchasePrice || it?.expectedPurchase || 0) || 0) * (Number(it?.quantity || 1) || 1), 0);
      const contribution = net - stripeFee - ship - cogs;

      const row = [
        o.orderId || o._id,
        o.createdAt ? new Date(o.createdAt).toISOString() : "",
        o.paidAt ? new Date(o.paidAt).toISOString() : "",
        o.status || "",
        pricing.currency || o.currency || "EUR",
        gross.toFixed(2),
        disc.toFixed(2),
        net.toFixed(2),
        stripeFee.toFixed(2),
        ship.toFixed(2),
        cogs.toFixed(2),
        contribution.toFixed(2),
        (o.customer && o.customer.email) || o.email || "",
        (o.customer && o.customer.country) || "",
        items.length,
        JSON.stringify(items).slice(0, 8000)
      ].map(_csvEscape);

      res.write(row.join(",") + "\n");
    }
    return res.end();
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/admin/orders/bulk-fulfill", requireAdmin, async (req, res) => {
  try {
    const { orderIds, trackingUrl, carrier, note } = req.body || {};
    const ids = Array.isArray(orderIds) ? orderIds.map(String).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ ok: false, error: "orderIds required" });

    const upd = {
      $set: {
        status: "FULFILLED",
        fulfilledAt: new Date(),
        fulfillment: {
          trackingUrl: trackingUrl ? String(trackingUrl) : "",
          carrier: carrier ? String(carrier) : "",
          note: note ? String(note) : ""
        }
      }
    };
    const r = await Order.updateMany({ orderId: { $in: ids } }, upd);
    return res.json({ ok: true, matched: r.matchedCount ?? r.n ?? 0, modified: r.modifiedCount ?? r.nModified ?? 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/admin/products/bulk-cost", requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body || {};
    const arr = Array.isArray(updates) ? updates : [];
    let ok = 0;
    for (const u of arr) {
      const productId = String(u?.productId || "").trim();
      if (!productId) continue;
      const val = Number(u?.expectedPurchasePrice || 0) || 0;
      await Product.updateOne({ productId }, { $set: { expectedPurchasePrice: val } }).catch(() => { });
      ok++;
    }
    return res.json({ ok: true, updated: ok });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/admin/products/bulk-enable", requireAdmin, async (req, res) => {
  try {
    const { productIds, enabled } = req.body || {};
    const ids = Array.isArray(productIds) ? productIds.map(String).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ ok: false, error: "productIds required" });
    const en = !!enabled;
    const r = await Product.updateMany({ productId: { $in: ids } }, { $set: { enabled: en } });
    return res.json({ ok: true, matched: r.matchedCount ?? r.n ?? 0, modified: r.modifiedCount ?? r.nModified ?? 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});
// PDF invoice / receipt (simple, accounting-friendly)
app.get("/admin/orders/:orderId/invoice.pdf", requireAdmin, async (req, res) => {
  try {
    const orderId = String(req.params.orderId || "").trim();
    const o = await Order.findOne({ orderId }).lean();
    if (!o) return res.status(404).send("Not found");

    const pricing = o.pricing || {};
    const costs = o.costs || {};
    const items = Array.isArray(o.items) ? o.items : [];

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice_${orderId}.pdf`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text("Receipt / Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Order: ${orderId}`);
    doc.text(`Created: ${o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : ""}`);
    if (o.paidAt) doc.text(`Paid: ${new Date(o.paidAt).toISOString().slice(0, 10)}`);
    doc.moveDown(0.5);

    const cust = o.customer || {};
    doc.fontSize(11).text("Customer", { underline: true });
    doc.fontSize(10).text(`Email: ${cust.email || o.email || ""}`);
    if (cust.country) doc.text(`Country: ${cust.country}`);
    doc.moveDown(0.5);

    doc.fontSize(11).text("Items", { underline: true });
    doc.moveDown(0.25);

    // Table-like output
    doc.fontSize(9);
    doc.text("Name", 40, doc.y, { continued: true });
    doc.text("Qty", 320, doc.y, { continued: true, width: 40, align: "right" });
    doc.text("Unit", 370, doc.y, { continued: true, width: 70, align: "right" });
    doc.text("Line", 440, doc.y, { width: 110, align: "right" });
    doc.moveDown(0.2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    let gross = 0;
    for (const it of items) {
      const name = String(it?.name || "");
      const qty = Number(it?.quantity || 1) || 1;
      const unit = Number(it?.price || it?.salePrice || 0) || 0;
      const line = unit * qty;
      gross += line;

      doc.text(name.slice(0, 60), 40, doc.y, { continued: true, width: 270 });
      doc.text(String(qty), 320, doc.y, { continued: true, width: 40, align: "right" });
      doc.text(unit.toFixed(2) + "€", 370, doc.y, { continued: true, width: 70, align: "right" });
      doc.text(line.toFixed(2) + "€", 440, doc.y, { width: 110, align: "right" });
    }

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    const netPaid = Number(pricing.totalPaidEUR ?? o.paidEUR ?? 0) || 0;
    const discount = Number(pricing.discountTotalEUR ?? (gross - netPaid) ?? 0) || 0;
    const stripeFee = Number(costs.stripeFeeEUR ?? o.stripeFeeEUR ?? 0) || 0;
    const shipCost = Number(costs.shippingCostEUR ?? o.shippingCostEUR ?? 0) || 0;

    doc.fontSize(10);
    doc.text(`Gross items: ${gross.toFixed(2)}€`, { align: "right" });
    if (discount > 0.0001) doc.text(`Discounts: -${discount.toFixed(2)}€`, { align: "right" });
    doc.text(`Total paid: ${netPaid.toFixed(2)}€`, { align: "right" });
    doc.moveDown(0.25);
    doc.fontSize(8).fillColor("gray").text(`(Internal costs: Stripe fee ${stripeFee.toFixed(2)}€, shipping cost ${shipCost.toFixed(2)}€)`, { align: "right" });
    doc.fillColor("black");

    doc.end();
  } catch (e) {
    console.error("invoice pdf error", e);
    return res.status(500).send("error");
  }
});



// Periodic workers (single-node friendly)
let __emailWorkerStarted = false;
function startEmailWorkersOnce() {
  if (__emailWorkerStarted) return;
  __emailWorkerStarted = true;
  setInterval(() => { _processEmailQueueOnce().catch(() => { }); }, 30 * 1000);
  setInterval(() => { _scheduleAbandonedCartEmails().catch(() => { }); }, 5 * 60 * 1000);
  setInterval(() => { _schedulePostPurchaseEmails().catch(() => { }); }, 15 * 60 * 1000);
}
// Ops monitor: anomaly alerts (single-node friendly)
let __opsMonitorStarted = false;
function startOpsMonitorOnce() {
  if (__opsMonitorStarted) return;
  __opsMonitorStarted = true;

  async function runOnce() {
    try {
      const flags = await _getFeatureFlagsConfig().catch(() => DEFAULT_FEATURE_FLAGS);
      // If analytics/ops are disabled, keep alerting minimal (still OK to run)
      const now = Date.now();
      const since24h = new Date(now - 24 * 60 * 60 * 1000);

      // 1) Margin floor violations (top by negative contribution)
      const profitCfg = await _getProfitConfigRuntime().catch(() => null);
      const minMarginPct = Number(profitCfg?.minOrderMarginPct ?? 18) || 18;

      const stats = await ProductProfitStats.find({}).lean().catch(() => []);
      const worst = stats
        .map(s => {
          const sold = Number(s?.soldQty || 0) || 0;
          const revenue = Number(s?.revenueEUR || 0) || 0;
          const cogs = Number(s?.cogsEUR || 0) || 0;
          const ship = Number(s?.shippingEUR || 0) || 0;
          const fees = Number(s?.feesEUR || 0) || 0;
          const contrib = revenue - cogs - ship - fees;
          const marginPct = revenue > 0 ? (contrib / revenue) * 100 : 0;
          return { productId: s.productId, sold, revenue, contrib, marginPct };
        })
        .filter(x => x.sold > 5 && x.revenue > 50)
        .sort((a, b) => a.marginPct - b.marginPct)
        .slice(0, 5);

      for (const w of worst) {
        if (w.marginPct < minMarginPct - 5) {
          await OpsAlert.create({
            type: "margin_floor",
            severity: w.marginPct < 0 ? "critical" : "warn",
            message: `Low margin: ${w.productId} (${w.marginPct.toFixed(1)}%)`,
            data: w
          }).catch(() => { });
        }
      }

      // 2) Refund spike last 24h
      // Simple heuristic: more than 2 refunds in 24h or refund rate > 10% on paid orders.
      const paid24h = await Order.countDocuments({ paidAt: { $gte: since24h } }).catch(() => 0);
      const refunded24h = await Order.countDocuments({ refundedAt: { $gte: since24h } }).catch(() => 0);
      if (paid24h >= 10) {
        const rate = paid24h > 0 ? (refunded24h / paid24h) : 0;
        if (rate > 0.10 || refunded24h >= 3) {
          await OpsAlert.create({
            type: "refund_spike",
            severity: rate > 0.20 ? "critical" : "warn",
            message: `Refund spike in last 24h: ${(rate * 100).toFixed(1)}% (${refunded24h}/${paid24h})`,
            data: { paid24h, refunded24h, rate }
          }).catch(() => { });
        }
      }

    } catch (e) {
      console.warn("ops monitor error", e?.message || e);
    }
  }

  setInterval(() => { runOnce().catch(() => { }); }, 10 * 60 * 1000);
  // initial run
  runOnce().catch(() => { });
}


// Rate limit for admin routes
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use('/admin', adminLimiter);

// Rate limit for public payment status polling
const paymentStatusLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, standardHeaders: true, legacyHeaders: false });

// Rate limit for creating payment intents (protects Stripe + server)
const paymentIntentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PI_MAX_PER_15MIN || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMIT", message: "Too many checkout attempts. Please try again later." }
});


// ---- Extra fraud/abuse velocity limits (best-effort, in-memory) ----
const _fraudWindowMs = 60 * 60 * 1000; // 1 hour
const _piByIP = new Map();       // ip -> [timestamps]
const _finalizeByIP = new Map(); // ip -> [timestamps]

function _fraudPush(map, ip) {
  const now = Date.now();
  const arr = map.get(ip) || [];
  arr.push(now);
  const cutoff = now - _fraudWindowMs;
  while (arr.length && arr[0] < cutoff) arr.shift();
  map.set(ip, arr);
  return arr.length;
}

async function _fraudCheck(req, kind) {
  try {
    const cfg = await getProfitConfigRuntime();
    const ff = getFeatureFlagsRuntimeSyncBestEffort();
    if (!ff?.fraudVelocity?.enabled) return { ok: true };
    if (!cfg?.fraud?.enabled) return { ok: true };
    const ip = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    if (!ip) return { ok: true };

    if (kind === "pi") {
      const n = _fraudPush(_piByIP, ip);
      const envMax = Number(process.env.FRAUD_MAX_PI_PER_IP_PER_HOUR || process.env.FRAUD_VELOCITY_PI_MAX_PER_HOUR || "");
      const max = (Number.isFinite(envMax) && envMax > 0)
        ? envMax
        : Number(cfg.fraud.maxPaymentIntentsPerIPPerHour || 20);
      if (n > max) return { ok: false, code: "FRAUD_VELOCITY_PI" };
    }
    if (kind === "finalize") {
      const n = _fraudPush(_finalizeByIP, ip);
      const envMax = Number(process.env.FRAUD_MAX_FINALIZE_PER_IP_PER_HOUR || process.env.FRAUD_VELOCITY_FINALIZE_MAX_PER_HOUR || "");
      const max = (Number.isFinite(envMax) && envMax > 0)
        ? envMax
        : Number(cfg.fraud.maxFinalizePerIPPerHour || 30);
      if (n > max) return { ok: false, code: "FRAUD_VELOCITY_FINALIZE" };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}


// Rate limit for analytics ingestion (protect DB)
const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.ANALYTICS_MAX_PER_5MIN || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMIT", message: "Too many events. Please try again later." }
});

// ===== Analytics collection settings (persisted) =====
const ANALYTICS_SETTINGS_PATH = path.join(__dirname, "data", "analytics_settings.json");

const DEFAULT_ANALYTICS_SETTINGS = Object.freeze({
  collectionEnabled: true,

  // Engagement time thresholds for product page sessions.
  // Sessions outside this range are treated as accidental clicks or abandoned tabs.
  minEngagedMs: 1000,               // 1s
  maxEngagedMs: 60 * 60 * 1000,     // 60 minutes

  // If true, a product click is considered "valid" only if it led to an engaged product session.
  // (Useful to ignore misclicks.)
  linkClicksToEngagement: true
});

function _loadAnalyticsSettings() {
  try {
    fs.mkdirSync(path.dirname(ANALYTICS_SETTINGS_PATH), { recursive: true });
  } catch { }
  try {
    const raw = fs.readFileSync(ANALYTICS_SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ANALYTICS_SETTINGS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return { ...DEFAULT_ANALYTICS_SETTINGS };
  }
}

function _saveAnalyticsSettings(next) {
  try {
    fs.mkdirSync(path.dirname(ANALYTICS_SETTINGS_PATH), { recursive: true });
  } catch { }
  fs.writeFileSync(ANALYTICS_SETTINGS_PATH, JSON.stringify(next, null, 2), "utf8");
}

let analyticsSettings = _loadAnalyticsSettings();

function _normalizeAnalyticsSettings(body) {
  const b = (body && typeof body === "object") ? body : {};
  const out = { ...analyticsSettings };

  if (typeof b.collectionEnabled === "boolean") out.collectionEnabled = b.collectionEnabled;

  const minMs = Number(b.minEngagedMs ?? b.minEngagedSeconds * 1000);
  const maxMs = Number(b.maxEngagedMs ?? b.maxEngagedSeconds * 1000);

  if (Number.isFinite(minMs)) out.minEngagedMs = Math.max(0, Math.min(minMs, 6 * 60 * 60 * 1000));
  if (Number.isFinite(maxMs)) out.maxEngagedMs = Math.max(0, Math.min(maxMs, 6 * 60 * 60 * 1000));

  if (out.maxEngagedMs > 0 && out.minEngagedMs > out.maxEngagedMs) {
    // swap
    const t = out.minEngagedMs;
    out.minEngagedMs = out.maxEngagedMs;
    out.maxEngagedMs = t;
  }

  if (typeof b.linkClicksToEngagement === "boolean") out.linkClicksToEngagement = b.linkClicksToEngagement;

  return out;
}

// Rate limit for storing customer details (protect DB)
const storeDetailsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: Number(process.env.STORE_DETAILS_MAX_PER_10MIN || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMIT", message: "Too many attempts. Please try again later." }
});



// ---- DB ----
mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI).then(() => {
  console.log('[mongo] connected');
}).catch(e => {
  console.error('[mongo] error', e);
  process.exit(1);
});

// ---- Schemas ----
const SelectedOptionSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    value: { type: String, default: "" }
  },
  { _id: false }
);

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // Legacy single-string selection (kept for backward compatibility)
    selectedOption: { type: String, default: "" },

    // Multi-variant selection: [{label:"Color:", value:"Red"}, {label:"Size:", value:"M"}]
    selectedOptions: { type: [SelectedOptionSchema], default: [] },

    quantity: { type: Number, required: true, min: 1 },
    unitPriceEUR: { type: Number, required: true, min: 0 },
    unitPriceOriginalEUR: { type: Number, default: null, min: 0 },
    recoDiscountPct: { type: Number, default: 0, min: 0, max: 80 },
    recoDiscountToken: { type: String, default: "" },
    // Line-level incentive allocations (persisted so management UI can render exactly what customer paid)
    appliedBundlePct: { type: Number, default: 0, min: 0, max: 80 },
    bundleDiscountEURLine: { type: Number, default: 0, min: 0 },
    appliedTierPct: { type: Number, default: 0, min: 0, max: 80 },
    tierDiscountEURLine: { type: Number, default: 0, min: 0 },
    tierEligibleForThisItem: { type: Boolean, default: null },
    unitPricePaidEffectiveEUR: { type: Number, default: null, min: 0 },
    totalPaidEffectiveEUR: { type: Number, default: null, min: 0 },
    expectedPurchase: { type: Number, default: 0, min: 0 },
    actualPurchaseEUR: { type: Number, default: null, min: 0 },
    supplierLink: { type: String, default: "" },
    supplierSku: { type: String, default: "" },

    // Optional storefront fields (store them so admin/export can use them)
    productLink: { type: String, default: "" },
    image: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  { _id: false, minimize: false }
);

const CustomerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address1: String,
  address2: String,
  city: String,
  region: String,
  postalCode: String,
  countryCode: String,

  // Marketing preferences (explicit opt-in by default; see EmailMarketingConfig)
  marketingOptIn: { type: Boolean, default: false },
  marketingOptInAt: { type: Date, default: null },
  marketingUnsubscribedAt: { type: Date, default: null }
}, { _id: false });

const PricingSchema = new mongoose.Schema(
  {
    currency: { type: String, default: "EUR" },

    // What the customer actually paid (order total after discounts/shipping/tariff, in EUR)
    totalPaidEUR: { type: Number, default: 0 },

    // Item totals in EUR
    baseTotalEUR: { type: Number, default: 0 },                 // original items total (before any discounts)
    itemsTotalBeforeAnyDiscountsEUR: { type: Number, default: 0 }, // alias of baseTotalEUR for clarity
    itemsTotalAfterItemDiscountsEUR: { type: Number, default: 0 }, // after item-level reco discounts, before tier/bundle
    subtotalAfterDiscountsEUR: { type: Number, default: 0 },     // items total after discounts (tier/bundle + any item-level discounts)
    totalDiscountEUR: { type: Number, default: 0 },              // baseTotalEUR - subtotalAfterDiscountsEUR
    effectivePct: { type: Number, default: 0 },                  // (totalDiscountEUR/baseTotalEUR)*100

    // Shipping + tariff breakdown (EUR)
    shippingFeeEUR: { type: Number, default: 0 },
    totalBeforeTariffEUR: { type: Number, default: 0 },
    applyTariff: { type: Boolean, default: false },
    tariffPct: { type: Number, default: 0 },                     // 0.2 = +20%

    // FX snapshot (for non-EUR currencies)
    exchangeRate: { type: Number, default: 1 },                  // currency per 1 EUR
    fxFetchedAt: { type: Number, default: null },                // ms epoch for FX snapshot

    // Stripe charge amount in minor units
    amountCents: { type: Number, default: 0 },

    // Discount metadata (source-of-truth for UIs)
    discounts: {
      applyToDiscountedItems: { type: Boolean, default: true },
      tierPct: { type: Number, default: 0 },
      tierDiscountEUR: { type: Number, default: 0 },
      bundlePct: { type: Number, default: 0 },
      bundleDiscountEUR: { type: Number, default: 0 }
    },

    freeShippingEligible: { type: Boolean, default: false },

    // Optional experiments snapshot for debugging/audits
    experiments: { type: mongoose.Schema.Types.Mixed, default: {} },

    note: { type: String, default: "" }
  },
  { _id: false, minimize: false }
);

const FulfillmentSchema = new mongoose.Schema({
  method: { type: String, enum: ['SELF', 'AGENT'], default: 'SELF' },
  packages: [{ weightKg: Number, lengthCm: Number, widthCm: Number, heightCm: Number }],
  customs: {
    contents: [{ description: String, hsCode: String, originCountry: String, quantity: Number, unitValueEUR: Number }],
    totalValueEUR: Number,
    incoterm: { type: String, default: 'DDP' }
  },
  agent: {
    provider: String,
    orderRef: String,
    status: { type: String, enum: ['NEW', 'PLACED', 'LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'], default: 'NEW' },
    service: String,
    costEUR: Number,
    currency: String,
    labelUrl: String,
    tracking: [{ code: String, carrier: String, url: String }],
    lastEvent: Date,
    raw: mongoose.Schema.Types.Mixed
  },
  self: {
    carrier: String,
    service: String,
    tracking: [{ code: String, carrier: String, url: String }],
    costEUR: Number,
  }
}, { _id: false });

// === Order Schema (canonical) =====================================

const RefundSchema = new mongoose.Schema({
  id: String,
  amountMinor: Number,
  currency: String,
  reason: String,
  status: String,
  createdAt: Date
}, { _id: false });

const StripeInfoSchema = new mongoose.Schema({
  paymentIntentId: { type: String },
  currency: String,
  amountMinor: Number,
  refunds: { type: [RefundSchema], default: [] }
}, { _id: false });

const LastPaymentErrorSchema = new mongoose.Schema({
  message: String,
  code: String,
  declineCode: String,
  type: String,
  at: Date
}, { _id: false });

const SideEffectsSchema = new mongoose.Schema({
  fileWrittenAt: Date,
  excelWrittenAt: Date
}, { _id: false });
// ---- Public order status access (customer-facing) ----
const PublicSchema = new mongoose.Schema({
  tokenHash: { type: String, default: "" },
  createdAt: { type: Date, default: null }
}, { _id: false });

const PROCUREMENT_STATUSES = Object.freeze([
  "AWAITING_PAYMENT",
  "TO_ORDER",
  "ORDERED",
  "IN_TRANSIT",
  "DELIVERED",
  "ISSUE",
  "CANCELED"
]);

const OperatorShippingSchema = new mongoose.Schema({
  aliExpress: { type: Number, default: 0, min: 0 },
  thirdParty1: { type: Number, default: 0, min: 0 },
  thirdParty2: { type: Number, default: 0, min: 0 }
}, { _id: false });

const OperatorTrackingSchema = new mongoose.Schema({
  code: { type: String, default: "" },
  carrier: { type: String, default: "" },
  url: { type: String, default: "" },
  addedAt: { type: Date, default: () => new Date() }
}, { _id: false });

const OperatorSchema = new mongoose.Schema({
  procurementStatus: { type: String, default: "AWAITING_PAYMENT" },
  supplierProvider: { type: String, default: "" },
  supplierOrderId: { type: String, default: "" },
  purchasedAt: { type: Date, default: null },
  supplierCostEUR: { type: Number, default: null, min: 0 },
  tracking: { type: [OperatorTrackingSchema], default: [] },
  shipping: { type: OperatorShippingSchema, default: () => ({}) },
  internalNote: { type: String, default: "" },
  deliveredAt: { type: Date, default: null },
  doneAt: { type: Date, default: null }
}, { _id: false });

const NoteEntrySchema = new mongoose.Schema({
  at: { type: Date, default: () => new Date() },
  by: { type: String, default: "admin" },
  text: { type: String, default: "" }
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  at: { type: Date, default: () => new Date() },
  from: { type: String, default: "" },
  to: { type: String, default: "" },
  by: { type: String, default: "system" },
  note: { type: String, default: "" }
}, { _id: false });

const AccountingSchema = new mongoose.Schema({
  invoiceNumber: { type: String, default: "" },
  invoiceIssuedAt: { type: Date, default: null },
  customerCountryCode: { type: String, default: "" },
  vatScheme: { type: String, default: "" } // e.g. "non-vat", "vat", "oss"
}, { _id: false });

const CostsSchema = new mongoose.Schema({
  stripeFeeMinor: { type: Number, default: null, min: 0 },
  stripeFeeCurrency: { type: String, default: "" },
  stripeFeeEUR: { type: Number, default: null, min: 0 },
  shippingCostEUR: { type: Number, default: null, min: 0 },
  otherCostEUR: { type: Number, default: null, min: 0 }
}, { _id: false });

const InvoiceCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true });

// ensure only one compiled model
const InvoiceCounter = mongoose.models.InvoiceCounter || mongoose.model("InvoiceCounter", InvoiceCounterSchema);



const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },

  status: { type: String, default: "PENDING_PAYMENT", index: true },
  websiteOrigin: { type: String, default: "" },

  customer: { type: CustomerSchema, default: () => ({}) },
  items: { type: [ItemSchema], default: [] },
  pricing: { type: PricingSchema, default: () => ({}) },
  fulfillment: { type: FulfillmentSchema, default: () => ({}) },

  stripe: { type: StripeInfoSchema, default: () => ({}) },
  lastPaymentError: { type: LastPaymentErrorSchema, default: null },

  paidAt: Date,
  emailSentAt: Date,
  shippedEmailSentAt: Date,

  // pending orders get deleted automatically; PAID orders set this to undefined
  expiresAt: { type: Date },

  sideEffects: { type: SideEffectsSchema, default: () => ({}) },


  public: { type: PublicSchema, default: () => ({}) },
  operator: { type: OperatorSchema, default: () => ({}) },
  notes: { type: [NoteEntrySchema], default: [] },
  statusHistory: { type: [StatusHistorySchema], default: [] },
  accounting: { type: AccountingSchema, default: () => ({}) },
  costs: { type: CostsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });

OrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OrderSchema.index({ "stripe.paymentIntentId": 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "operator.procurementStatus": 1, createdAt: -1 });
OrderSchema.index({ "customer.email": 1 });

OrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// ensure only one compiled model
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);


// ===== Draft (cached) checkout records =====
// These are NOT real orders. They exist only during checkout and are
// converted into a real Order AFTER Stripe confirms payment success.
const DraftOrderSchema = new mongoose.Schema({
  status: { type: String, default: "CHECKOUT", index: true },
  websiteOrigin: { type: String, default: "" },

  customer: { type: CustomerSchema, default: () => ({}) },
  items: { type: [ItemSchema], default: [] },
  pricing: { type: PricingSchema, default: () => ({}) },

  stripe: { type: StripeInfoSchema, default: () => ({}) },
  lastPaymentError: { type: LastPaymentErrorSchema, default: null },

  public: { type: PublicSchema, default: () => ({}) },
  accounting: { type: AccountingSchema, default: () => ({}) },

  // TTL for abandoned checkouts
  expiresAt: { type: Date },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });

DraftOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
DraftOrderSchema.index({ "stripe.paymentIntentId": 1 });
DraftOrderSchema.index({ status: 1, createdAt: -1 });

DraftOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const DraftOrder = mongoose.models.DraftOrder || mongoose.model("DraftOrder", DraftOrderSchema);





// ===== Product catalogue in DB =====
const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true, unique: true },
  name: { type: String, default: "" },
  productLink: { type: String, default: null, index: true, unique: true, sparse: true },
  canonicalLink: { type: String, default: null },
  price: { type: Number, default: 0 },
  expectedPurchasePrice: { type: Number, default: 0 },
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  productOptions: { type: mongoose.Schema.Types.Mixed, default: null },
  categories: { type: [String], default: [] },
  updatedFromCatalogAt: { type: Date, default: null }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
// Ensure unique sparse index on productLink to prevent duplicate imports (runtime safeguard).
(async () => {
  try {
    await Product.collection.createIndex({ productLink: 1 }, { unique: true, sparse: true });
  } catch (e) {
    // If this fails with duplicate key, you still have duplicates in DB; dedupe first then restart.
    console.warn('[products] productLink unique index not ensured:', e?.code || e?.message || e);
  }
})();

// ---- Catalog Category (DB-backed; 1 document per category) ----
const CatalogCategorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  icon: { type: String, default: "" },
  order: { type: Number, default: 0 },
  // Array of product objects (Mixed to allow flexible product fields)
  products: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true, minimize: false });

const CatalogCategory = mongoose.models.CatalogCategory || mongoose.model("CatalogCategory", CatalogCategorySchema);
// ===== Recommendations (product-page widget) =====
const { RecoConfig } = require('./src/models/recoConfig');

// ===== Incentives runtime config =====
// Minimal schema to prevent boot-time ReferenceError if schema definition is missing.
// You can extend this schema later to match your incentives feature needs.
const IncentivesConfigSchema = new mongoose.Schema({
  key: { type: String, default: "global", index: true },
  enabled: { type: Boolean, default: false },
  config: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

const IncentivesConfig = mongoose.models.IncentivesConfig || mongoose.model("IncentivesConfig", IncentivesConfigSchema);

// ===== Profit optimization / contribution margin runtime config =====
// Source of truth: Mongo ProfitConfig (key="global") overrides ENV defaults.
// Used for: discount guardrails, recommendation profit bias, alerts, fraud heuristics.

const ProfitConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true, default: "global" },

  enabled: { type: Boolean, default: true },

  // Payment processor fees (approx). Tune in admin.
  fees: {
    pct: { type: Number, default: 0.029, min: 0, max: 0.2 },     // 2.9%
    fixedEUR: { type: Number, default: 0.30, min: 0, max: 10 }
  },

  // Average internal shipping/handling cost per order (guardrail + profit estimate)
  avgShippingCostEUR: { type: Number, default: 3.50, min: 0, max: 200 },

  // Guardrails: discounts must not push below these floors
  minOrderMarginPct: { type: Number, default: 0.18, min: 0, max: 0.9 },
  minOrderContributionEUR: { type: Number, default: 2.00, min: -1000, max: 10000 },

  // Risk penalty: suppress high-refund items from recommendations
  refundPenaltyWeight: { type: Number, default: 0.8, min: 0, max: 10 },

  // Fraud/abuse protection (extra on top of Turnstile + rate limits)
  fraud: {
    enabled: { type: Boolean, default: true },
    maxPaymentIntentsPerIPPerHour: { type: Number, default: 20, min: 1, max: 5000 },
    maxFinalizePerIPPerHour: { type: Number, default: 30, min: 1, max: 5000 }
  }
}, { minimize: false });

const ProfitConfig = mongoose.models.ProfitConfig || mongoose.model("ProfitConfig", ProfitConfigSchema);

// Aggregated profit + refund stats per product (keyed by productId when possible, else name fallback)
const ProductProfitStatsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true }, // productId preferred
  productId: { type: String, default: "" },
  name: { type: String, default: "" },
  productLink: { type: String, default: "" },

  soldQty: { type: Number, default: 0 },
  soldRevenueEUR: { type: Number, default: 0 },
  soldCostEUR: { type: Number, default: 0 },

  refundedQty: { type: Number, default: 0 },
  refundedRevenueEUR: { type: Number, default: 0 },

  lastSoldAt: { type: Date, default: null },
  lastRefundAt: { type: Date, default: null },

  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });

const ProductProfitStats = mongoose.models.ProductProfitStats || mongoose.model("ProductProfitStats", ProductProfitStatsSchema);

// Runtime cache
let _profitCfgCache = { at: 0, cfg: null };

async function getProfitConfigRuntime() {
  const now = Date.now();
  if (_profitCfgCache.cfg && (now - _profitCfgCache.at) < 60_000) return _profitCfgCache.cfg;

  const envDefaults = {
    enabled: _envBool("PROFIT_CFG_ENABLED", true),
    fees: {
      pct: Math.max(0, Number(process.env.PROFIT_FEES_PCT ?? 0.029) || 0.029),
      fixedEUR: Math.max(0, Number(process.env.PROFIT_FEES_FIXED_EUR ?? 0.30) || 0.30)
    },
    avgShippingCostEUR: Math.max(0, Number(process.env.PROFIT_AVG_SHIP_COST_EUR ?? 3.50) || 3.50),
    minOrderMarginPct: Math.max(0, Math.min(0.9, Number(process.env.PROFIT_MIN_ORDER_MARGIN_PCT ?? 0.18) || 0.18)),
    minOrderContributionEUR: Number(process.env.PROFIT_MIN_ORDER_CONTRIB_EUR ?? 2.0),
    refundPenaltyWeight: Math.max(0, Number(process.env.PROFIT_REFUND_PENALTY_WEIGHT ?? 0.8) || 0.8),
    fraud: {
      enabled: _envBool("PROFIT_FRAUD_ENABLED", true),
      maxPaymentIntentsPerIPPerHour: Math.max(1, Number(process.env.FRAUD_MAX_PI_PER_IP_HOUR ?? 20) || 20),
      maxFinalizePerIPPerHour: Math.max(1, Number(process.env.FRAUD_MAX_FINALIZE_PER_IP_HOUR ?? 30) || 30)
    }
  };

  let dbCfg = null;
  try { dbCfg = await ProfitConfig.findOne({ key: "global" }).lean(); } catch { dbCfg = null; }
  const merged = dbCfg ? {
    ...envDefaults,
    ...dbCfg,
    fees: { ...envDefaults.fees, ...(dbCfg.fees || {}) },
    fraud: { ...envDefaults.fraud, ...(dbCfg.fraud || {}) }
  } : envDefaults;

  _profitCfgCache = { at: now, cfg: merged };
  return merged;
}

// Backward-compat alias used by some admin/ops code paths.
// (Older code referenced _getProfitConfigRuntime; keep it to avoid runtime crashes.)
async function _getProfitConfigRuntime() {
  return getProfitConfigRuntime();
}

function getProfitConfigRuntimeSyncBestEffort() {
  const cfg = _profitCfgCache.cfg;
  if (cfg) return cfg;
  return {
    enabled: _envBool("PROFIT_CFG_ENABLED", true),
    fees: { pct: Math.max(0, Number(process.env.PROFIT_FEES_PCT ?? 0.029) || 0.029), fixedEUR: Math.max(0, Number(process.env.PROFIT_FEES_FIXED_EUR ?? 0.30) || 0.30) },
    avgShippingCostEUR: Math.max(0, Number(process.env.PROFIT_AVG_SHIP_COST_EUR ?? 3.50) || 3.50),
    minOrderMarginPct: Math.max(0, Math.min(0.9, Number(process.env.PROFIT_MIN_ORDER_MARGIN_PCT ?? 0.18) || 0.18)),
    minOrderContributionEUR: Number(process.env.PROFIT_MIN_ORDER_CONTRIB_EUR ?? 2.0),
    refundPenaltyWeight: Math.max(0, Number(process.env.PROFIT_REFUND_PENALTY_WEIGHT ?? 0.8) || 0.8),
    fraud: {
      enabled: _envBool("PROFIT_FRAUD_ENABLED", true),
      maxPaymentIntentsPerIPPerHour: Math.max(1, Number(process.env.FRAUD_MAX_PI_PER_IP_HOUR ?? 20) || 20),
      maxFinalizePerIPPerHour: Math.max(1, Number(process.env.FRAUD_MAX_FINALIZE_PER_IP_HOUR ?? 30) || 30)
    }
  };
}

function _estimateProcessorFeesEUR(totalPaidEUR, profitCfg) {
  const pct = Number(profitCfg?.fees?.pct || 0) || 0;
  const fixed = Number(profitCfg?.fees?.fixedEUR || 0) || 0;
  return round2(Math.max(0, totalPaidEUR) * pct + fixed);
}

function _estimateOrderCostEUR(normalizedItems) {
  let cost = 0;
  for (const it of (normalizedItems || [])) {
    const qty = Math.max(1, Number(it?.quantity || 1) || 1);
    const unitCost = Math.max(0, Number(it?.expectedPurchase || 0) || 0);
    cost += qty * unitCost;
  }
  return round2(cost);
}

// Returns max total discount allowed (EUR) to satisfy guardrails.
// If negative => no discounts should be applied.
function _maxDiscountAllowedEUR({ revenueEUR, costEUR, profitCfg }) {
  const feesEUR = _estimateProcessorFeesEUR(revenueEUR, profitCfg);
  const shipEUR = Number(profitCfg?.avgShippingCostEUR || 0) || 0;

  const profitBeforeDiscount = revenueEUR - costEUR - feesEUR - shipEUR;
  const minProfit = Math.max(Number(profitCfg?.minOrderContributionEUR ?? 0) || 0, (Number(profitCfg?.minOrderMarginPct || 0) || 0) * revenueEUR);

  return round2(profitBeforeDiscount - minProfit);
}

// Update aggregated per-product profit stats from an order.
// Called on PAID creation and on full-refund transitions.
async function updateProductProfitStatsFromOrder(order, { isRefund = false } = {}) {
  try {
    if (!order || !Array.isArray(order.items) || !order.items.length) return;

    const prodDocs = await Product.find({}).select({ productId: 1, name: 1, productLink: 1 }).lean();
    const byLink = new Map();
    const byName = new Map();
    for (const p of (prodDocs || [])) {
      if (p.productLink) byLink.set(String(p.productLink).trim(), String(p.productId));
      if (p.name) byName.set(String(p.name).trim().toLowerCase(), String(p.productId));
    }

    const profitCfg = await getProfitConfigRuntime();
    const shipCost = Number(profitCfg?.avgShippingCostEUR || 0) || 0;
    const feeEUR = _estimateProcessorFeesEUR(Number(order?.pricing?.totalPaidEUR || 0) || 0, profitCfg);

    const subtotalAfterDisc = Number(order?.pricing?.subtotalAfterDiscountsEUR ?? order?.pricing?.baseTotalEUR ?? 0) || 0;

    const lines = order.items.map(it => ({
      it,
      qty: Math.max(1, Number(it.quantity || 1) || 1),
      lineEUR: Math.max(0, Number(it.unitPriceEUR || 0) || 0) * Math.max(1, Number(it.quantity || 1) || 1),
      costEUR: Math.max(0, Number(it.actualPurchaseEUR ?? it.expectedPurchase ?? 0) || 0) * Math.max(1, Number(it.quantity || 1) || 1)
    }));
    const sumLines = lines.reduce((s, l) => s + (l.lineEUR || 0), 0) || 1;

    for (const l of lines) {
      const name = String(l.it?.name || "").trim();
      const link = String(l.it?.productLink || "").trim();
      const pid = (link && byLink.get(link)) || (name && byName.get(name.toLowerCase())) || "";
      const key = pid ? pid : `name:${name}`;

      const allocRevenue = round2((l.lineEUR / sumLines) * subtotalAfterDisc);
      const allocCost = round2(l.costEUR);
      const allocFee = round2((l.lineEUR / sumLines) * feeEUR);
      const allocShip = round2((l.lineEUR / sumLines) * shipCost);

      const baseUpdate = { key, productId: pid, name, productLink: link, updatedAt: new Date() };
      const q = { key };
      const upd = { $set: baseUpdate };

      if (!isRefund) {
        upd.$inc = { soldQty: l.qty, soldRevenueEUR: allocRevenue, soldCostEUR: allocCost };
        upd.$set.lastSoldAt = new Date();
      } else {
        upd.$inc = { refundedQty: l.qty, refundedRevenueEUR: allocRevenue };
        upd.$set.lastRefundAt = new Date();
      }

      await ProductProfitStats.updateOne(q, upd, { upsert: true });
    }
  } catch (e) {
    console.warn("[profit-stats] update failed:", e?.message || e);
  }
}


const RecoStatsSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: "product_page_recs_v1" },
  sourceProductId: { type: String, required: true, index: true },
  targetProductId: { type: String, required: true, index: true },

  impressions: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
  addToCarts: { type: Number, default: 0, min: 0 },
  purchases: { type: Number, default: 0, min: 0 },

  alpha: { type: Number, default: 1, min: 0 },
  beta: { type: Number, default: 1, min: 0 },

  scoreAuto: { type: Number, default: 0 },
  manualBoost: { type: Number, default: 0 },
  manualMultiplier: { type: Number, default: 0 },
  scoreFinal: { type: Number, default: 0, index: true },

  lastEventAt: { type: Date, default: null, index: true }
}, { timestamps: true, minimize: false });

RecoStatsSchema.index({ widgetId: 1, sourceProductId: 1, targetProductId: 1 }, { unique: true });
RecoStatsSchema.index({ widgetId: 1, sourceProductId: 1, scoreFinal: -1 });
const RecoStats = mongoose.models.RecoStats || mongoose.model("RecoStats", RecoStatsSchema);

const RecoGlobalStatsSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: "product_page_recs_v1" },
  targetProductId: { type: String, required: true, index: true, unique: true },

  impressions: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
  addToCarts: { type: Number, default: 0, min: 0 },
  purchases: { type: Number, default: 0, min: 0 },

  alpha: { type: Number, default: 1, min: 0 },
  beta: { type: Number, default: 1, min: 0 },

  scoreAuto: { type: Number, default: 0 },
  manualBoost: { type: Number, default: 0 },
  manualMultiplier: { type: Number, default: 0 },
  scoreFinal: { type: Number, default: 0, index: true },

  lastEventAt: { type: Date, default: null, index: true }
}, { timestamps: true, minimize: false });

RecoGlobalStatsSchema.index({ widgetId: 1, scoreFinal: -1 });
const RecoGlobalStats = mongoose.models.RecoGlobalStats || mongoose.model("RecoGlobalStats", RecoGlobalStatsSchema);

const RecoExclusionSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: "product_page_recs_v1" },
  type: { type: String, required: true, index: true, enum: ["global_product_ban", "per_source_ban", "category_ban"] },
  sourceProductId: { type: String, default: null, index: true },
  productId: { type: String, default: null, index: true },
  categoryKey: { type: String, default: null, index: true },
  reason: { type: String, default: "" },
  isActive: { type: Boolean, default: true, index: true },
  updatedBy: { type: String, default: "" }
}, { timestamps: true, minimize: false });

RecoExclusionSchema.index({ widgetId: 1, type: 1, sourceProductId: 1, productId: 1, categoryKey: 1 }, { unique: true, sparse: true });
const RecoExclusion = mongoose.models.RecoExclusion || mongoose.model("RecoExclusion", RecoExclusionSchema);

const RecoEventSchema = new mongoose.Schema({
  widgetId: { type: String, required: true, index: true, default: "product_page_recs_v1" },
  type: { type: String, required: true, index: true, enum: ["impression", "click", "add_to_cart", "purchase"] },
  sessionId: { type: String, default: "", index: true },
  userId: { type: String, default: "" },
  sourceProductId: { type: String, default: "", index: true },
  targetProductId: { type: String, default: "", index: true },
  position: { type: Number, default: null },
  tokenHash: { type: String, default: "", index: true },
  extra: { type: mongoose.Schema.Types.Mixed, default: null },
  // TTL is defined via schema.index below; avoid field-level index duplication.
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });

RecoEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
RecoEventSchema.index({ widgetId: 1, tokenHash: 1, type: 1 }, { unique: true, sparse: true });
const RecoEvent = mongoose.models.RecoEvent || mongoose.model("RecoEvent", RecoEventSchema);

const RecoDiscountRedemptionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  usedAt: { type: Date, default: Date.now },
  // TTL is defined via schema.index below; avoid field-level index duplication.
  expiresAt: { type: Date, required: true }
}, { minimize: false });

RecoDiscountRedemptionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const RecoDiscountRedemption = mongoose.models.RecoDiscountRedemption || mongoose.model("RecoDiscountRedemption", RecoDiscountRedemptionSchema);


const ProductSalesSummarySchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  unitsSold30d: { type: Number, default: 0, min: 0, index: true },
  revenueEUR30d: { type: Number, default: 0, min: 0 },
  purchases30d: { type: Number, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });

ProductSalesSummarySchema.index({ unitsSold30d: -1 });
const ProductSalesSummary = mongoose.models.ProductSalesSummary || mongoose.model("ProductSalesSummary", ProductSalesSummarySchema);

const RecoAdminActionSchema = new mongoose.Schema({
  widgetId: { type: String, default: "product_page_recs_v1", index: true },
  action: { type: String, required: true, index: true },
  actor: { type: String, default: "" },
  sourceProductId: { type: String, default: null, index: true },
  targetProductId: { type: String, default: null, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });

const RecoAdminAction = mongoose.models.RecoAdminAction || mongoose.model("RecoAdminAction", RecoAdminActionSchema);


// ===== Smart Cart/Checkout Recommendations (Contextual Bandit) =====

const SmartRecoModelSchema = new mongoose.Schema({
  placement: { type: String, required: true, unique: true, index: true }, // e.g. "cart_topup_v1", "checkout_lastchance_v1"
  d: { type: Number, default: 8 },
  A: { type: [Number], default: [] }, // flattened d*d row-major
  b: { type: [Number], default: [] }, // length d
  alpha: { type: Number, default: 1.0 }, // LinUCB exploration
  updatedAt: { type: Date, default: Date.now, index: true }
}, { minimize: false });

const SmartRecoModel = mongoose.models.SmartRecoModel || mongoose.model("SmartRecoModel", SmartRecoModelSchema);

const SmartRecoImpressionSchema = new mongoose.Schema({
  placement: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, default: "", index: true },
  cartSig: { type: String, default: "", index: true },
  desiredEUR: { type: Number, default: 0 },
  context: { type: mongoose.Schema.Types.Mixed, default: null },
  items: [{
    key: { type: String, required: true }, // productId or name fallback
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    features: { type: [Number], default: [] } // length d
  }],
  // TTL is defined via schema.index below; avoid field-level index duplication.
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });

SmartRecoImpressionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }); // keep 14 days
const SmartRecoImpression = mongoose.models.SmartRecoImpression || mongoose.model("SmartRecoImpression", SmartRecoImpressionSchema);

const SmartRecoEventSchema = new mongoose.Schema({
  placement: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ["impression", "click", "add_to_cart", "purchase"] },
  sessionId: { type: String, default: "", index: true },
  itemKey: { type: String, default: "", index: true },
  // TTL is defined via schema.index below; avoid field-level index duplication.
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });

SmartRecoEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // keep 90 days
const SmartRecoEvent = mongoose.models.SmartRecoEvent || mongoose.model("SmartRecoEvent", SmartRecoEventSchema);

// --- SmartReco helpers (small-matrix math) ---
function _srMatIdentity(d, scale = 1) {
  const A = new Array(d * d).fill(0);
  for (let i = 0; i < d; i++) A[i * d + i] = scale;
  return A;
}
function _srDot(a, b) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += (Number(a[i] || 0) * Number(b[i] || 0));
  return s;
}
function _srMatVec(A, x, d) {
  const out = new Array(d).fill(0);
  for (let r = 0; r < d; r++) {
    let s = 0;
    for (let c = 0; c < d; c++) s += Number(A[r * d + c] || 0) * Number(x[c] || 0);
    out[r] = s;
  }
  return out;
}
function _srOuterAdd(A, x, d, scale = 1) {
  for (let r = 0; r < d; r++) {
    const xr = Number(x[r] || 0);
    for (let c = 0; c < d; c++) {
      A[r * d + c] = Number(A[r * d + c] || 0) + scale * xr * Number(x[c] || 0);
    }
  }
}
function _srInv(A, d) {
  // Gauss-Jordan inversion for small d (<=8). Returns null if singular.
  const n = d;
  const M = new Array(n);
  for (let r = 0; r < n; r++) {
    M[r] = new Array(2 * n).fill(0);
    for (let c = 0; c < n; c++) M[r][c] = Number(A[r * n + c] || 0);
    M[r][n + r] = 1;
  }
  for (let col = 0; col < n; col++) {
    // pivot
    let pivot = col;
    let best = Math.abs(M[pivot][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > best) { best = v; pivot = r; }
    }
    if (best < 1e-12) return null;
    if (pivot !== col) {
      const tmp = M[col]; M[col] = M[pivot]; M[pivot] = tmp;
    }
    const div = M[col][col];
    for (let c = 0; c < 2 * n; c++) M[col][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (Math.abs(factor) < 1e-12) continue;
      for (let c = 0; c < 2 * n; c++) M[r][c] -= factor * M[col][c];
    }
  }
  const inv = new Array(n * n).fill(0);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) inv[r * n + c] = M[r][n + c];
  }
  return inv;
}

const SMART_RECO_SECRET = String(process.env.SMART_RECO_SECRET || JWT_SECRET || "smart_reco_secret").trim();

function _srMakeToken(payload) {
  const base = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SMART_RECO_SECRET).update(base).digest('base64url');
  return `${base}.${sig}`;
}
function _srParseToken(token) {
  try {
    const t = String(token || "");
    const [base, sig] = t.split('.');
    if (!base || !sig) return null;
    const exp = crypto.createHmac('sha256', SMART_RECO_SECRET).update(base).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
    const obj = JSON.parse(Buffer.from(base, 'base64url').toString('utf8'));
    return obj && typeof obj === "object" ? obj : null;
  } catch { return null; }
}
function _srCartSignature(cartNames) {
  const arr = (cartNames || []).map(x => String(x || "").trim()).filter(Boolean).sort();
  return _recoSha256(arr.join('|')).slice(0, 24);
}

async function _srGetOrCreateModel(placement) {
  const p = String(placement || "").trim() || "cart_topup_v1";
  let doc = await SmartRecoModel.findOne({ placement: p }).lean();
  if (doc && Array.isArray(doc.A) && Array.isArray(doc.b) && doc.A.length && doc.b.length) return doc;
  const d = 6;
  const A = _srMatIdentity(d, 1);
  const b = new Array(d).fill(0);
  doc = await SmartRecoModel.findOneAndUpdate(
    { placement: p },
    { $setOnInsert: { placement: p, d, A, b, alpha: 1.0, updatedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return doc;
}

async function _srUpdateModelFromEvent({ placement, tokenHash, itemKey, reward }) {
  if (!placement || !tokenHash || !itemKey) return;

  const imp = await SmartRecoImpression.findOne({ placement, tokenHash }).lean();
  if (!imp || !Array.isArray(imp.items)) return;

  const it = imp.items.find(x => String(x.key) === String(itemKey));
  if (!it || !Array.isArray(it.features) || !it.features.length) return;

  const model = await _srGetOrCreateModel(placement);
  const d = Math.max(1, Number(model.d || 6) || 6);
  let A = Array.isArray(model.A) && model.A.length === d * d ? model.A.slice() : _srMatIdentity(d, 1);
  let b = Array.isArray(model.b) && model.b.length === d ? model.b.slice() : new Array(d).fill(0);

  const x = it.features.slice(0, d).map(n => Number(n || 0));
  const r = Number(reward || 0);

  _srOuterAdd(A, x, d, 1);
  for (let i = 0; i < d; i++) b[i] = Number(b[i] || 0) + r * Number(x[i] || 0);

  await SmartRecoModel.updateOne({ placement }, { $set: { A, b, updatedAt: new Date() } });
}

async function _srCooccurrenceCounts(cartNames, lookbackDays = 60, limit = 80) {
  const names = (cartNames || []).map(x => String(x || "").trim()).filter(Boolean);
  if (!names.length) return new Map();

  const since = new Date(Date.now() - Math.max(1, lookbackDays) * 24 * 60 * 60 * 1000);
  // Order schema stores items with "name"; use that for co-occurrence
  const pipeline = [
    { $match: { createdAt: { $gte: since }, "items.name": { $in: names } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.name", cnt: { $sum: "$items.quantity" } } },
    { $sort: { cnt: -1 } },
    { $limit: Math.max(10, Math.min(500, limit * 5)) }
  ];

  let rows = [];
  try { rows = await Order.aggregate(pipeline); } catch { rows = []; }

  const out = new Map();
  for (const r of rows) {
    const nm = String(r?._id || "").trim();
    if (!nm) continue;
    if (names.includes(nm)) continue;
    out.set(nm, Number(r?.cnt || 0));
  }
  return out;
}

function _srFeatureVector({ coScore = 0, topup = 0, price = 0, pop = 0, catMatch = 0, marginPct = 0, refundRisk = 0 }) {
  // d=8 (contextual bandit features)
  const lp = Math.log1p(Math.max(0, Number(price || 0)));
  const p = Math.log1p(Math.max(0, Number(pop || 0)));

  const m = Math.max(0, Math.min(1, Number(marginPct || 0)));
  const rr = Math.max(0, Math.min(1, Number(refundRisk || 0)));

  return [
    1,
    Math.max(0, Math.min(1, Number(coScore || 0))),
    Math.max(0, Math.min(1, Number(topup || 0))),
    Math.max(0, Math.min(5, lp)) / 5,
    Math.max(0, Math.min(5, p)) / 5,
    Number(catMatch ? 1 : 0),
    m,
    1 - rr
  ];
}

async function _srBuildSmartRecommendations({ placement, sessionId, cartNames, desiredEUR, limit = 6, context = null }) {
  const pl = String(placement || "").trim() || "cart_topup_v1";
  const cartSet = new Set((cartNames || []).map(x => String(x || "").trim()).filter(Boolean));
  const cartArr = Array.from(cartSet);

  const model = await _srGetOrCreateModel(pl);
  const d = Math.max(1, Number(model.d || 6) || 6);
  const A = Array.isArray(model.A) && model.A.length === d * d ? model.A.slice() : _srMatIdentity(d, 1);
  const b = Array.isArray(model.b) && model.b.length === d ? model.b.slice() : new Array(d).fill(0);
  const alpha = Math.max(0, Number(model.alpha || 1.0) || 1.0);
  const Ainv = _srInv(A, d) || _srMatIdentity(d, 1);

  const theta = _srMatVec(Ainv, b, d);

  const coMap = await _srCooccurrenceCounts(cartArr, 60, 120);
  const maxCo = Math.max(1, ...Array.from(coMap.values()).map(n => Number(n || 0)));

  // Popularity snapshot from ProductSalesSummary (fallback to 0)
  const popDocs = await ProductSalesSummary.find({}).sort({ unitsSold30d: -1 }).limit(500).lean();
  const popByName = new Map((popDocs || []).map(d => [String(d.productId || ""), Number(d.unitsSold30d || 0)]));
  // also map by name via Product lookup later

  // Fetch products
  const products = await Product.find({}).select({ productId: 1, name: 1, price: 1, expectedPurchasePrice: 1, images: 1, categories: 1, productLink: 1 }).lean();

  // Profit/refund stats (best-effort)
  let _refundRateByPid = new Map();
  try {
    const pids = products.map(p => String(p.productId || "").trim()).filter(Boolean);
    if (pids.length) {
      const stats = await ProductProfitStats.find({ productId: { $in: pids } }).select({ productId: 1, soldQty: 1, refundedQty: 1 }).lean();
      for (const s of (stats || [])) {
        const sold = Math.max(0, Number(s.soldQty || 0) || 0);
        const ref = Math.max(0, Number(s.refundedQty || 0) || 0);
        const rate = sold > 0 ? Math.max(0, Math.min(1, ref / sold)) : 0;
        _refundRateByPid.set(String(s.productId || ""), rate);
      }
    }
  } catch { }

  const cartCats = new Set();
  for (const p of products) {
    if (cartSet.has(String(p.name || "").trim())) {
      (p.categories || []).forEach(c => cartCats.add(String(c || "").trim()));
    }
  }

  const desired = Math.max(0, Number(desiredEUR || 0) || 0);
  const strictMax = !!(context && typeof context === "object" && context.strictMaxPrice);
  const maxPrice = desired > 0 ? (strictMax ? desired : Math.max(30, desired * 1.35)) : Infinity;
  const optMode = String((context && typeof context === "object" && context.optimization) ? context.optimization : "").trim();
  const profitTieEUR = Math.max(0, Number((context && typeof context === "object" && context.profitTieEUR) ? context.profitTieEUR : 0.05) || 0.05);


  const candidates = [];
  for (const p of (products || [])) {
    const name = String(p?.name || "").trim();
    if (!name) continue;
    if (cartSet.has(name)) continue;

    const price = Number(p?.price || 0) || 0;
    if (!(price > 0)) continue;
    if (price > maxPrice) continue;

    const co = Number(coMap.get(name) || 0);
    const coScore = co / maxCo;

    const topupCloseness = desired > 0 ? (1 - (Math.min(Math.abs(price - desired), desired) / Math.max(1e-6, desired))) : 0;

    let pop = 0;
    const pid = String(p.productId || "");
    if (pid && popByName.has(pid)) pop = popByName.get(pid);
    // if no productId popularity, approximate from co-occurrence magnitude
    if (!pop) pop = co;

    let catMatch = 0;
    const cats = Array.isArray(p.categories) ? p.categories.map(x => String(x || "").trim()) : [];
    for (const c of cats) { if (cartCats.has(c)) { catMatch = 1; break; } }

    const cost = Math.max(0, Number(p.expectedPurchasePrice || 0) || 0);
    const marginPct = price > 0 ? Math.max(0, Math.min(1, (price - cost) / price)) : 0;
    const refundRisk = _refundRateByPid.get(String(pid || "")) || 0;

    const x = _srFeatureVector({ coScore, topup: topupCloseness, price, pop, catMatch, marginPct, refundRisk });
    const mean = _srDot(theta, x);
    const tmp = _srMatVec(Ainv, x, d);
    const varTerm = Math.max(0, _srDot(x, tmp));
    const ucb = mean + alpha * Math.sqrt(varTerm);

    candidates.push({
      key: pid || name,
      name,
      productId: pid || null,
      price,
      image: Array.isArray(p.images) && p.images.length ? p.images[0] : null,
      productLink: p.productLink || "",
      score: ucb,
      profitEUR: (Number.isFinite(cost) ? (price - cost) : 0),
      popUnits: (Number.isFinite(pop) ? pop : 0),
      closeness: (desired > 0 ? Math.abs(desired - price) : 0),
      features: x
    });
  }

  if (optMode === "profit_popular") {
    candidates.sort((a, b) => {
      const ca = Number(a?.closeness || 0), cb = Number(b?.closeness || 0);
      if (ca !== cb) return ca - cb; // closer to desired first
      const pa = Number(a?.profitEUR || 0), pb = Number(b?.profitEUR || 0);
      const pd = pb - pa;
      if (Math.abs(pd) >= profitTieEUR) return pd; // profit first unless within tie threshold
      const ua = Number(a?.popUnits || 0), ub = Number(b?.popUnits || 0);
      if (ub !== ua) return ub - ua; // prefer more popular when profits are close
      return (Number(b?.score || 0) - Number(a?.score || 0));
    });
  } else {
    candidates.sort((a, b) => (b.score - a.score));
  }
  const chosen = candidates.slice(0, Math.max(1, Math.min(12, Number(limit || 6) || 6)));

  const tokenHash = _recoSha256(`${pl}|${sessionId || ""}|${Date.now()}|${Math.random()}`);
  const token = _srMakeToken({ placement: pl, tokenHash, ts: Date.now() });
  const cartSig = _srCartSignature(cartArr);

  // Persist impression doc (used for learning updates)
  await SmartRecoImpression.create({
    placement: pl,
    tokenHash,
    sessionId: String(sessionId || "").slice(0, 120),
    cartSig,
    desiredEUR: desired,
    context: context || null,
    items: chosen.map((it, idx) => ({
      key: String(it.key),
      name: it.name,
      price: it.price,
      position: idx + 1,
      features: it.features
    })),
    createdAt: new Date()
  });

  // Also store raw impression event (for analytics)
  await SmartRecoEvent.create({
    placement: pl,
    tokenHash,
    type: "impression",
    sessionId: String(sessionId || "").slice(0, 120),
    itemKey: "",
    createdAt: new Date()
  });

  const ffNow = getFeatureFlagsRuntimeSyncBestEffort();
  const discCfg = (ffNow && ffNow.smartReco && typeof ffNow.smartReco === "object") ? (ffNow.smartReco.discount || {}) : {};
  const enableRecoDiscounts = !!(discCfg && discCfg.enabled) && !!(context && typeof context === "object" && context.enableRecoDiscounts);
  const minPct = Math.max(0, Number(discCfg.minPct || 0) || 0);
  const maxPct = Math.max(minPct, Number(discCfg.maxPct || 0) || 0);
  const ttlMinutes = Math.max(5, Number(discCfg.ttlMinutes || 120) || 120);
  const minMarginPct = Math.max(0, Math.min(0.95, Number(discCfg.minMarginPct || 0.15) || 0.15));

  const itemsOut = chosen.map((it, idx) => {
    const base = {
      key: it.key,
      productId: it.productId,
      name: it.name,
      price: it.price,
      image: it.image,
      productLink: it.productLink,
      position: idx + 1
    };

    if (!enableRecoDiscounts) return base;

    const pid = String(it.productId || "").trim();
    const sell = Number(it.price || 0) || 0;
    const cost = Math.max(0, sell - (Number(it.profitEUR || 0) || 0));
    if (!pid || !(sell > 0) || !(maxPct > 0)) return base;

    // Deterministic-ish random to keep stable discounts within a session
    const r = _recoDetRand(`${pl}|${sessionId || ""}|${tokenHash}|${pid}`);
    const pct = Math.min(maxPct, Math.max(minPct, Math.round((minPct + (maxPct - minPct) * r) * 100) / 100));
    if (!(pct > 0)) return base;

    const discounted = Math.round((sell * (1 - pct / 100)) * 100) / 100;
    if (!(discounted > 0) || discounted >= sell) return base;

    if (cost > 0) {
      const marginPct = (discounted - cost) / Math.max(0.01, discounted);
      if (marginPct < minMarginPct) return base;
    }

    return {
      ...base,
      discountPct: pct,
      discountedPrice: discounted,
      discountToken: _recoMakeDiscountToken({ widgetId: `smart_${pl}`, sourceProductId: "cart", targetProductId: pid, pct, ttlMinutes })
    };
  });

  return {
    ok: true,
    placement: pl,
    token,
    items: itemsOut
  };
}

async function ensureTtlIndex(model, indexName, key, expireAfterSeconds = 0) {
  try {
    const col = model.collection;
    const indexes = await col.indexes();
    const existing = (indexes || []).find(i => i && i.name === indexName);

    const hasTTL = existing && Object.prototype.hasOwnProperty.call(existing, "expireAfterSeconds");
    const currentTTL = hasTTL ? existing.expireAfterSeconds : null;

    if (existing && currentTTL === expireAfterSeconds) return;

    if (existing) {
      try { await col.dropIndex(indexName); } catch { /* ignore */ }
    }

    await col.createIndex(key, { name: indexName, expireAfterSeconds, background: true });
  } catch (e) {
    console.warn(`[mongo] TTL index ensure failed (${model?.modelName || "unknown"}.${indexName}):`, e?.message || e);
  }
}


// Ensure important DB indexes exist (safe in production; does NOT drop extra indexes)
let _indexesEnsured = false;
async function ensureDbIndexes() {
  if (_indexesEnsured) return;
  _indexesEnsured = true;
  try {
    // Repair legacy non-TTL expiresAt indexes (prevents "same name different options" warnings)
    await ensureTtlIndex(Order, "expiresAt_1", { expiresAt: 1 }, 0);
    await ensureTtlIndex(DraftOrder, "expiresAt_1", { expiresAt: 1 }, 0);

    // Repair legacy non-TTL createdAt/sentAt indexes where we now expect TTL.
    // This prevents: "An equivalent index already exists with the same name but different options".
    await ensureTtlIndex(OpsAlert, "createdAt_1", { createdAt: 1 }, 60 * 60 * 24 * 60); // 60 days
    await ensureTtlIndex(EmailJob, "createdAt_1", { createdAt: 1 }, 60 * 60 * 24 * 90); // 90 days
    await ensureTtlIndex(EmailSendLog, "sentAt_1", { sentAt: 1 }, 60 * 60 * 24 * 365); // 365 days
    await ensureTtlIndex(RecoEvent, "createdAt_1", { createdAt: 1 }, 60 * 60 * 24 * 90); // 90 days
    await ensureTtlIndex(SmartRecoImpression, "createdAt_1", { createdAt: 1 }, 60 * 60 * 24 * 14); // 14 days
    await ensureTtlIndex(SmartRecoEvent, "createdAt_1", { createdAt: 1 }, 60 * 60 * 24 * 90); // 90 days
    await ensureTtlIndex(RecoDiscountRedemption, "expiresAt_1", { expiresAt: 1 }, 0);

    await Order.createIndexes();
    await DraftOrder.createIndexes();
    await InvoiceCounter.createIndexes();
    await CatalogCategory.createIndexes();
    await RecoConfig.createIndexes();
    await RecoStats.createIndexes();
    await RecoGlobalStats.createIndexes();
    await RecoExclusion.createIndexes();
    await RecoEvent.createIndexes();
    await RecoDiscountRedemption.createIndexes();
    await ProductSalesSummary.createIndexes();
    await RecoAdminAction.createIndexes();
    await SmartRecoModel.createIndexes();
    await SmartRecoImpression.createIndexes();
    await SmartRecoEvent.createIndexes();

    // Ops + email marketing indexes
    await OpsAlert.createIndexes();
    await ConfigHistory.createIndexes();
    await EmailMarketingConfig.createIndexes();
    await EmailSubscriber.createIndexes();
    await EmailJob.createIndexes();
    await EmailSendLog.createIndexes();
    console.log('[mongo] indexes ensured');
  } catch (e) {
    console.warn('[mongo] index ensure failed (continuing):', e?.message || e);
  }
}

// Run once when connected (or immediately if already connected)
mongoose.connection.on('connected', () => { ensureDbIndexes(); });
if (mongoose.connection.readyState === 1) { ensureDbIndexes(); }

// ===== FX cache + 24h history =====
const FX_REFRESH_MS = 60 * 60 * 1000;           // 1 hour
const FX_HISTORY_KEEP_MS = 24 * 60 * 60 * 1000; // keep 24h (latest 12h + previous 12h)

let cachedRates = null; // { rates, base, fetchedAt }
let lastFetched = 0;
let fxHistory = [];     // [{ rates, base, fetchedAt }, ...] oldest->newest
let fxRefreshPromise = null;

function pushFxHistory(snapshot) {
  if (!snapshot || !snapshot.rates || !snapshot.fetchedAt) return;

  fxHistory.push({
    rates: snapshot.rates,
    base: snapshot.base || "EUR",
    fetchedAt: Number(snapshot.fetchedAt),
  });

  fxHistory.sort((a, b) => a.fetchedAt - b.fetchedAt);
  fxHistory = fxHistory.filter((s, i, arr) => i === 0 || s.fetchedAt !== arr[i - 1].fetchedAt);

  const cutoff = Date.now() - FX_HISTORY_KEEP_MS;
  fxHistory = fxHistory.filter((s) => s.fetchedAt >= cutoff);
}

function getFxSnapshotByFetchedAt(fetchedAt) {
  const ts = Number(fetchedAt);
  if (!Number.isFinite(ts) || ts <= 0) return null;
  return fxHistory.find((s) => s.fetchedAt === ts) || null;
}
const AnalyticsEventSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now, index: true },

  type: { type: String, required: true }, // 'page_open', 'product_view', ...
  sessionId: { type: String, index: true },

  path: String,
  websiteOrigin: String,

  product: {
    name: String,
    category: String,
    productLink: String,
    priceEUR: Number
  },

  userAgent: String,
  referrer: String,
  ip: String,

  extra: mongoose.Schema.Types.Mixed
}, { minimize: false });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);


// ---- A/B Experiments (server-side assignments + admin config) ----
// Goal: prevent client tampering (especially for pricing) and enable configurable rollouts.
const AB_SECRET = String(process.env.AB_SECRET || process.env.JWT_SECRET || "").trim();
if (!AB_SECRET) {
  console.warn("[ab] AB_SECRET not set. Set AB_SECRET (or at least JWT_SECRET) for stable assignments.");
}

const AB_COOKIE = "ss_ab"; // value: "<uid>.<sig>"
const AB_COOKIE_MAXAGE_MS = 365 * 24 * 60 * 60 * 1000;

// Default keys used by the storefront today. You can add more keys later (UI + product fields).
const AB_DEFAULTS = {
  pn: { enabled: true, bWeight: 0.5 },  // product name
  pd: { enabled: true, bWeight: 0.5 },  // product description
  pr: { enabled: true, bWeight: 0.5 },  // price variant
  dl: { enabled: true, bWeight: 0.5 },  // delivery copy
  pi: { enabled: false, bWeight: 0.5 }  // (optional) primary image
};

const ABExperimentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  enabled: { type: Boolean, default: false },
  bWeight: { type: Number, default: 0.5 }, // 0..1 share assigned to bucket B
  updatedBy: { type: String, default: "" }
}, { timestamps: true });

const ABExperiment = mongoose.models.ABExperiment || mongoose.model("ABExperiment", ABExperimentSchema);

const _abCache = { at: 0, ttlMs: 60_000, items: null };

function _abClamp01(x, defVal = 0.5) {
  const n = Number(x);
  if (!Number.isFinite(n)) return defVal;
  return Math.max(0, Math.min(1, n));
}

function _abParseCookies(req) {
  const raw = String(req.headers.cookie || "");
  const out = {};
  raw.split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i <= 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) return;
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  });
  return out;
}

function _abBase64Url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function _abSignUid(uid) {
  const secret = AB_SECRET || process.env.JWT_SECRET || "ab_dev_secret";
  const mac = crypto.createHmac("sha256", secret).update(String(uid || ""), "utf8").digest();
  return _abBase64Url(mac.subarray(0, 16)); // 128-bit tag (short cookie)
}

function _abVerify(uid, sig) {
  if (!uid || !sig) return false;
  const expected = _abSignUid(uid);
  return timingSafeEqualStr(String(expected), String(sig));
}

function _abMintUid() {
  return _abBase64Url(crypto.randomBytes(16));
}

// Ensures a stable server-trusted UID via a signed HttpOnly cookie.
function ensureAbUid(req, res) {
  try {
    const c = _abParseCookies(req);
    const raw = String(c[AB_COOKIE] || "");
    const [uid, sig] = raw.split(".");
    if (uid && sig && _abVerify(uid, sig)) return uid;

    const newUid = _abMintUid();
    const newSig = _abSignUid(newUid);
    const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
    res.cookie(AB_COOKIE, `${newUid}.${newSig}`, {
      httpOnly: true,
      sameSite: "Lax",
      secure: isProd,
      maxAge: AB_COOKIE_MAXAGE_MS,
      path: "/"
    });
    return newUid;
  } catch {
    // Worst-case: per-request uid (non-sticky). Still prevents client-forced buckets.
    return _abMintUid();
  }
}

function _abHashToUnit(uid, key) {
  const secret = AB_SECRET || process.env.JWT_SECRET || "ab_dev_secret";
  const h = crypto.createHash("sha256").update(`${uid}|${key}|${secret}`, "utf8").digest();
  const u32 = h.readUInt32BE(0) >>> 0;
  return u32 / 0xFFFFFFFF;
}

async function _abLoadConfigs() {
  const now = Date.now();
  if (_abCache.items && now < _abCache.at + _abCache.ttlMs) return _abCache.items;

  try {
    const docs = await ABExperiment.find({}).lean();
    const map = {};
    for (const d of (docs || [])) {
      const k = String(d?.key || "").trim();
      if (!k) continue;
      map[k] = {
        key: k,
        name: String(d?.name || ""),
        description: String(d?.description || ""),
        enabled: !!d?.enabled,
        bWeight: _abClamp01(d?.bWeight, 0.5),
        updatedBy: String(d?.updatedBy || ""),
        updatedAt: d?.updatedAt || null
      };
    }
    _abCache.items = map;
    _abCache.at = now;
    return map;
  } catch (e) {
    console.warn("[ab] config load failed:", e?.message || e);
    _abCache.items = {};
    _abCache.at = now;
    return _abCache.items;
  }
}

function _abComputeBucket(uid, key, cfg) {
  const def = AB_DEFAULTS[key] || { enabled: true, bWeight: 0.5 };
  const enabled = (cfg && cfg.enabled != null) ? !!cfg.enabled : !!def.enabled;
  if (!enabled) return "A";

  const bWeight = _abClamp01((cfg && cfg.bWeight != null) ? cfg.bWeight : def.bWeight, 0.5);
  if (bWeight <= 0) return "A";
  if (bWeight >= 1) return "B";

  const p = _abHashToUnit(uid, key);
  return (p < bWeight) ? "B" : "A";
}

async function computeAbExperimentsForRequest(req, res) {
  const uid = ensureAbUid(req, res);
  const cfgs = await _abLoadConfigs();
  const keys = Array.from(new Set([...Object.keys(AB_DEFAULTS), ...Object.keys(cfgs || {})]));
  const out = {};
  for (const k of keys) out[k] = _abComputeBucket(uid, k, cfgs[k]);
  return { uid, experiments: out, configs: cfgs };
}

function _abInvalidateCache() {
  _abCache.at = 0;
}

// Admin: list experiment configs (merged with defaults)
app.get('/admin/ab/experiments', authMiddleware, async (req, res) => {
  try {
    const cfgs = await _abLoadConfigs();
    const keys = Array.from(new Set([...Object.keys(AB_DEFAULTS), ...Object.keys(cfgs || {})]));
    const merged = keys.map((k) => {
      const def = AB_DEFAULTS[k] || { enabled: true, bWeight: 0.5 };
      const c = cfgs[k] || {};
      return {
        key: k,
        name: String(c.name || ""),
        description: String(c.description || ""),
        enabled: (c.enabled != null) ? !!c.enabled : !!def.enabled,
        bWeight: (c.bWeight != null) ? _abClamp01(c.bWeight, def.bWeight) : _abClamp01(def.bWeight, 0.5),
        updatedAt: c.updatedAt || null,
        updatedBy: String(c.updatedBy || "")
      };
    });
    return res.json({ ok: true, experiments: merged });
  } catch (e) {
    console.error("[ab] list error", e);
    return res.status(500).json({ error: "list failed" });
  }
});

// Admin: upsert an experiment config
app.post('/admin/ab/experiments', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const key = String(body.key || "").trim();
    if (!key || key.length > 16 || !/^[a-z0-9_-]+$/i.test(key)) {
      return res.status(400).json({ error: "invalid key" });
    }
    const update = {
      name: String(body.name || "").slice(0, 120),
      description: String(body.description || "").slice(0, 2000),
      enabled: !!body.enabled,
      bWeight: _abClamp01(body.bWeight, 0.5),
      updatedBy: String((req.user && req.user.email) || req.user?.id || "admin").slice(0, 120)
    };

    const doc = await ABExperiment.findOneAndUpdate(
      { key },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    _abInvalidateCache();
    return res.json({ ok: true, experiment: doc });
  } catch (e) {
    console.error("[ab] upsert error", e);
    return res.status(500).json({ error: "save failed" });
  }
});

// Admin: patch an experiment config
app.patch('/admin/ab/experiments/:key', authMiddleware, async (req, res) => {
  try {
    const key = String(req.params.key || "").trim();
    if (!key || key.length > 16 || !/^[a-z0-9_-]+$/i.test(key)) return res.status(400).json({ error: "invalid key" });

    const body = req.body || {};
    const set = {};
    if (body.name != null) set.name = String(body.name || "").slice(0, 120);
    if (body.description != null) set.description = String(body.description || "").slice(0, 2000);
    if (body.enabled != null) set.enabled = !!body.enabled;
    if (body.bWeight != null) set.bWeight = _abClamp01(body.bWeight, 0.5);
    set.updatedBy = String((req.user && req.user.email) || req.user?.id || "admin").slice(0, 120);

    const doc = await ABExperiment.findOneAndUpdate(
      { key },
      { $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    _abInvalidateCache();
    return res.json({ ok: true, experiment: doc });
  } catch (e) {
    console.error("[ab] patch error", e);
    return res.status(500).json({ error: "patch failed" });
  }
});

// Public: server-side A/B assignments (storefront should fetch with credentials: 'include')
app.get('/ab/assignments', async (req, res) => {
  try {
    if (!originIsAllowed(req)) return res.status(403).json({ error: "FORBIDDEN" });
    const { experiments } = await computeAbExperimentsForRequest(req, res);
    return res.json({ ok: true, experiments });
  } catch (e) {
    console.error("[ab] assignments error", e);
    return res.status(500).json({ error: "assignments failed" });
  }
});



// ===== Recommendations engine (product-page widget) =====
const RECO_WIDGET_DEFAULT = "product_page_recs_v1";

function _recoNow() { return new Date(); }

function _recoSha256(s) {
  try { return crypto.createHash('sha256').update(String(s || ''), 'utf8').digest('hex'); } catch { return ''; }
}

function _recoClamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function _recoBetaSample(alpha, beta) {
  // Marsaglia and Tsang gamma sampler; then Beta(a,b) = X/(X+Y)
  function gammaSample(k) {
    const kk = Number(k);
    if (!(kk > 0)) return 0;
    if (kk < 1) {
      // boost method
      const u = Math.random();
      return gammaSample(kk + 1) * Math.pow(u, 1 / kk);
    }
    const d = kk - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do {
        // Box-Muller
        const u1 = Math.random() || 1e-12;
        const u2 = Math.random() || 1e-12;
        x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random() || 1e-12;
      if (u < 1 - 0.0331 * (x ** 4)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  const a = Math.max(1e-9, Number(alpha) || 0);
  const b = Math.max(1e-9, Number(beta) || 0);
  const x = gammaSample(a);
  const y = gammaSample(b);
  const denom = x + y;
  if (!(denom > 0)) return 0.5;
  return x / denom;
}

async function _recoResolveConfig({ widgetId, sourceProduct }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const sourcePid = String(sourceProduct?.productId || "").trim();
  const cat = Array.isArray(sourceProduct?.categories) && sourceProduct.categories.length ? String(sourceProduct.categories[0] || "").trim() : "";

  const productCfg = sourcePid ? await RecoConfig.findOne({ widgetId: wid, scope: "product", scopeId: sourcePid }).lean() : null;
  if (productCfg) return productCfg;

  const catCfg = cat ? await RecoConfig.findOne({ widgetId: wid, scope: "category", scopeId: cat }).lean() : null;
  if (catCfg) return catCfg;

  const globalCfg = await RecoConfig.findOne({ widgetId: wid, scope: "global", scopeId: null }).lean();
  if (globalCfg) return globalCfg;

  // default (in case DB empty)
  return {
    widgetId: wid,
    scope: "global",
    scopeId: null,
    stableSlots: 2,
    evolutionSlots: 6,
    globalWinnerSlots: 0,
    globalWinnersEnabled: false,
    allowCrossCategoryGlobalWinners: false,
    candidatePoolRules: { sameCategoryOnly: true, allowedCategoryKeys: [], maxPriceDeltaPct: null },
    exploration: { mode: "thompson", epsilon: 0.2, priorImpressions: 20, priorClicks: 1, priorATC: 1 },
    globalWinnerMinUnitsSold30d: 0,
    globalWinnerMinScore: 0,
    ui: {
      carousel: {
        desktopVisible: 3,
        mobileVisible: 2,
        batchSizeDesktop: 3,
        batchSizeMobile: 2,
        maxBatches: 6,
        maxItems: 24,
        swipeSmallPx: 35,
        swipeBigPx: 120,
        tokenTtlMinutes: 60
      }
    }
  };
}

async function _recoLoadExclusions({ widgetId, sourceProductId }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const q = {
    widgetId: wid,
    isActive: true,
    $or: [
      { type: "global_product_ban" },
      { type: "category_ban" },
      { type: "per_source_ban", sourceProductId: String(sourceProductId || "").trim() }
    ]
  };
  const rows = await RecoExclusion.find(q).lean();
  const bannedProductsGlobal = new Set(rows.filter(r => r.type === "global_product_ban" && r.productId).map(r => String(r.productId)));
  const bannedProductsPerSource = new Set(rows.filter(r => r.type === "per_source_ban" && r.productId).map(r => String(r.productId)));
  const bannedCategoryKeys = new Set(rows.filter(r => r.type === "category_ban" && r.categoryKey).map(r => String(r.categoryKey)));
  return { bannedProductsGlobal, bannedProductsPerSource, bannedCategoryKeys, raw: rows };
}

function _recoIsEligibleProduct(p, { sourceCategories, config, exclusions }) {
  if (!p) return false;
  const pid = String(p.productId || "").trim();
  if (!pid) return false;
  if (exclusions?.bannedProductsGlobal?.has(pid)) return false;
  if (exclusions?.bannedProductsPerSource?.has(pid)) return false;

  // Category ban applies if target is in banned category
  const cats = Array.isArray(p.categories) ? p.categories.map(x => String(x || "").trim()).filter(Boolean) : [];
  for (const c of cats) {
    if (exclusions?.bannedCategoryKeys?.has(c)) return false;
  }

  // Category compatibility
  const rules = config?.candidatePoolRules || {};
  const allow = Array.isArray(rules.allowedCategoryKeys) ? rules.allowedCategoryKeys.map(String) : [];
  if (allow.length) {
    return cats.some(c => allow.includes(c));
  }
  if (rules.sameCategoryOnly) {
    const src = Array.isArray(sourceCategories) ? sourceCategories : [];
    if (!src.length) return true;
    return cats.some(c => src.includes(c));
  }
  return true;
}

function _recoComputeScoreAuto(stats, cfg) {
  const priorImp = _recoClamp(cfg?.exploration?.priorImpressions ?? 20, 0, 1000);
  const priorClk = _recoClamp(cfg?.exploration?.priorClicks ?? 1, 0, 1000);
  const priorAtc = _recoClamp(cfg?.exploration?.priorATC ?? 1, 0, 1000);

  const imp = Number(stats?.impressions || 0);
  const clk = Number(stats?.clicks || 0);
  const atc = Number(stats?.addToCarts || 0);

  const ctr = (clk + priorClk) / Math.max(1, (imp + priorImp));
  const atcPerImp = (atc + priorAtc) / Math.max(1, (imp + priorImp));

  // Weighted; CTR helps surface click-worthy items; ATC/imp is stronger signal.
  return (0.6 * ctr) + (0.4 * atcPerImp);
}

function _recoComputeScoreFinal(scoreAuto, stats) {
  const mm = Number(stats?.manualMultiplier || 0);
  const mb = Number(stats?.manualBoost || 0);
  return (Number(scoreAuto) || 0) * (1 + mm) + mb;
}

async function _recoFetchCandidateProducts(sourceProduct, cfg, exclusions) {
  const sourcePid = String(sourceProduct.productId || "").trim();
  const sourceCats = Array.isArray(sourceProduct.categories) ? sourceProduct.categories.map(x => String(x || "").trim()).filter(Boolean) : [];
  const rules = cfg?.candidatePoolRules || {};

  const q = { productId: { $ne: sourcePid } };

  // Category pool
  const allow = Array.isArray(rules.allowedCategoryKeys) ? rules.allowedCategoryKeys.map(x => String(x || "").trim()).filter(Boolean) : [];
  if (allow.length) q.categories = { $in: allow };
  else if (rules.sameCategoryOnly && sourceCats.length) q.categories = { $in: sourceCats };

  // Only products with a productId and a name
  const rows = await Product.find(q).select({ productId: 1, name: 1, price: 1, description: 1, images: 1, productLink: 1, categories: 1 }).limit(250).lean();

  const eligible = rows.filter(p => _recoIsEligibleProduct(p, { sourceCategories: sourceCats, config: cfg, exclusions }));

  // Optional price proximity
  const maxDelta = rules.maxPriceDeltaPct;
  if (Number.isFinite(Number(maxDelta)) && Number(maxDelta) > 0) {
    const sp = Number(sourceProduct.price || 0);
    const limit = sp > 0 ? sp * (Number(maxDelta) / 100) : null;
    if (limit != null) {
      return eligible.filter(p => Math.abs(Number(p.price || 0) - sp) <= limit);
    }
  }

  return eligible;
}

async function _recoComputeSalesMapLast30d(candidates) {
  const now = _recoNow();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const byName = new Map();
  const byCanon = new Map();

  for (const p of candidates) {
    const pid = String(p.productId || "").trim();
    const nm = String(p.name || "").trim().toLowerCase();
    if (nm) byName.set(nm, pid);
    const cl = String(p.canonicalLink || p.productLink || "").trim();
    if (cl) byCanon.set(cl, pid);
  }

  const orders = await Order.find({ paidAt: { $gte: start } }).select({ items: 1 }).lean();
  const sales = new Map(); // productId -> { units, revenue }

  for (const o of orders) {
    const items = Array.isArray(o?.items) ? o.items : [];
    for (const it of items) {
      const q = Math.max(1, Number(it?.quantity || 1) || 1);
      const nm = String(it?.name || "").trim().toLowerCase();
      const link = String(it?.productLink || "").trim();
      const pid = (link && byCanon.get(link)) || (nm && byName.get(nm)) || null;
      if (!pid) continue;
      const revenue = q * (Number(it?.unitPriceEUR || 0) || 0);
      const cur = sales.get(pid) || { units: 0, revenue: 0 };
      cur.units += q;
      cur.revenue += revenue;
      sales.set(pid, cur);
    }
  }

  return sales;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function _recoBuildRecommendations(opts) {
  const widgetId = opts && (opts.widgetId ?? opts.wid);
  const sourceProductId = opts && (opts.sourceProductId ?? opts.sourcePid ?? opts.sourceId);

  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const sourcePid = String(sourceProductId || "").trim();
  if (!sourcePid) return { ok: false, error: "missing sourceProductId" };

  const _spidRaw = sourcePid;
  const _spidPrefix = String(_spidRaw).split('_')[0].trim();
  // IMPORTANT: productId can contain underscores; always try the full id first.
  let sourceProduct = await Product.findOne({ productId: _spidRaw }).lean();
  if (!sourceProduct && _spidPrefix && _spidPrefix !== _spidRaw) {
    sourceProduct = await Product.findOne({ productId: _spidPrefix }).lean();
  }
  if (!sourceProduct) sourceProduct = await Product.findOne({ name: _spidRaw }).lean();
  if (!sourceProduct && _spidRaw) {
    const esc = escapeRegExp(_spidRaw);
    sourceProduct = await Product.findOne({ name: new RegExp(`^${esc}$`, 'i') }).lean();
  }
  if (!sourceProduct) return { ok: false, error: "source product not found" };

  const cfg = await _recoResolveConfig({ widgetId: wid, sourceProduct });
  const exclusions = await _recoLoadExclusions({ widgetId: wid, sourceProductId: sourcePid });

  const stableSlots = Math.max(0, Math.min(20, Number(cfg?.stableSlots || 0)));
  const evolutionSlots = Math.max(0, Math.min(40, Number(cfg?.evolutionSlots || 0)));
  const globalSlots = (cfg?.globalWinnersEnabled) ? Math.max(0, Math.min(10, Number(cfg?.globalWinnerSlots || 0))) : 0;
  const totalSlots = stableSlots + evolutionSlots;

  // Helper: append the rest of the candidate pool (beyond the configured slots)
  // so the PDP carousel can page further than the initial stable/evolution selection.
  // This avoids "no more items" when the user scrolls past the first batch.
  const _appendTail = (headList, scoredRows, maxTotal = 200) => {
    const head = Array.isArray(headList) ? headList : [];
    const usedIds = new Set(head.map(p => String(p?.productId || "")));
    const tail = Array.isArray(scoredRows)
      ? scoredRows.map(x => x && x.p).filter(Boolean).filter(p => !usedIds.has(String(p.productId || "")))
      : [];
    const out = [...head, ...tail];
    return out.slice(0, Math.max(totalSlots, Math.min(maxTotal, out.length)));
  };

  const sourceCats = Array.isArray(sourceProduct.categories) ? sourceProduct.categories.map(x => String(x || "").trim()).filter(Boolean) : [];

  const candidates = await _recoFetchCandidateProducts(sourceProduct, cfg, exclusions);

  // Sales map (last 30d) for stable selection
  const salesMap = await _recoComputeSalesMapLast30d(candidates);

  // Global winners
  const globalWinners = [];
  if (globalSlots > 0) {
    const pool = Array.from(salesMap.entries())
      .map(([pid, s]) => ({ pid, units: s.units, revenue: s.revenue }))
      .filter(x => x.units >= Number(cfg?.globalWinnerMinUnitsSold30d || 0));

    pool.sort((a, b) => (b.units - a.units) || (b.revenue - a.revenue));

    for (const x of pool) {
      if (globalWinners.length >= globalSlots) break;
      const p = candidates.find(pp => String(pp.productId) === String(x.pid));
      if (!p) continue;
      if (!cfg.allowCrossCategoryGlobalWinners) {
        // keep category compatibility
        if (!_recoIsEligibleProduct(p, { sourceCategories: sourceCats, config: cfg, exclusions })) continue;
      }
      globalWinners.push(p);
    }
  }

  // Stable items (best sellers from candidate pool)
  const stable = [];
  const stablePool = candidates
    .map(p => {
      const s = salesMap.get(String(p.productId)) || { units: 0, revenue: 0 };
      return { p, units: s.units, revenue: s.revenue };
    })
    .sort((a, b) => (b.units - a.units) || (b.revenue - a.revenue));

  for (const row of stablePool) {
    if (stable.length >= stableSlots) break;
    // avoid duplicates with global winners
    if (globalWinners.some(g => String(g.productId) === String(row.p.productId))) continue;
    stable.push(row.p);
  }

  // Evolution list
  const used = new Set([...globalWinners, ...stable].map(p => String(p.productId)));
  const remaining = candidates.filter(p => !used.has(String(p.productId)));

  const statsRows = await RecoStats.find({ widgetId: wid, sourceProductId: sourcePid, targetProductId: { $in: remaining.map(p => p.productId) } }).lean();
  const statsByPid = new Map(statsRows.map(r => [String(r.targetProductId), r]));

  const mode = String(cfg?.exploration?.mode || "thompson").toLowerCase();
  const eps = _recoClamp(cfg?.exploration?.epsilon ?? 0.2, 0, 1);

  const scored = remaining.map(p => {
    const st = statsByPid.get(String(p.productId)) || { impressions: 0, clicks: 0, addToCarts: 0, manualBoost: 0, manualMultiplier: 0 };
    const auto = _recoComputeScoreAuto(st, cfg);
    const finalScore = _recoComputeScoreFinal(auto, st);

    let bandit = finalScore;
    if (mode === "thompson") {
      const priorClk = _recoClamp(cfg?.exploration?.priorClicks ?? 1, 0, 1000);
      const priorAtc = _recoClamp(cfg?.exploration?.priorATC ?? 1, 0, 1000);
      const alpha = (Number(st.addToCarts || 0) + priorAtc);
      const beta = (Math.max(0, Number(st.clicks || 0) - Number(st.addToCarts || 0)) + priorClk);
      bandit = _recoBetaSample(alpha, beta) + (0.15 * finalScore);
    } else {
      // epsilon exploration: add slight noise
      bandit = finalScore;
    }

    return { p, auto, finalScore, bandit };
  });

  if (mode === "epsilon") {
    // exploit: mostly sorted by finalScore
    scored.sort((a, b) => b.finalScore - a.finalScore);
    const top = scored.slice(0, Math.max(1, Math.floor(scored.length * 0.6)));
    const tail = scored.slice(top.length);

    const picked = [];
    while (picked.length < evolutionSlots && (top.length || tail.length)) {
      if (tail.length && Math.random() < eps) {
        const idx = Math.floor(Math.random() * tail.length);
        picked.push(tail.splice(idx, 1)[0]);
      } else if (top.length) {
        picked.push(top.shift());
      } else {
        picked.push(tail.shift());
      }
    }
    const evolution = picked.map(x => x.p);

    const head = [...globalWinners, ...stable, ...evolution].slice(0, totalSlots);
    // scored is already sorted by finalScore for epsilon mode
    const maxTotal = Number(cfg?.ui?.carousel?.maxItems || 200) || 200;
    const items = _appendTail(head, scored, maxTotal);

    return { ok: true, widgetId: wid, config: cfg, sourceProduct, items };
  }

  // thompson: sort by sampled bandit score
  scored.sort((a, b) => b.bandit - a.bandit);
  const evolution = scored.slice(0, evolutionSlots).map(x => x.p);

  const head = [...globalWinners, ...stable, ...evolution].slice(0, totalSlots);
  // scored is bandit-sorted for thompson
  const maxTotal = Number(cfg?.ui?.carousel?.maxItems || 200) || 200;
  const items = _appendTail(head, scored, maxTotal);

  return { ok: true, widgetId: wid, config: cfg, sourceProduct, items };
}

function _recoMakeTrackingToken({ widgetId, sourceProductId, itemIds, ts }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const sourcePid = String(sourceProductId || "").trim();
  const t = Number(ts || Date.now());
  const list = (Array.isArray(itemIds) ? itemIds : []).map(String).join(",");
  const sig = _recoSha256(`${wid}|${sourcePid}|${t}|${list}`);
  return `${wid}.${sourcePid}.${t}.${sig}`;
}

function _recoParseTrackingToken(token) {
  try {
    const s = String(token || "");
    const parts = s.split(".");
    if (parts.length < 4) return null;
    return { widgetId: parts[0], sourceProductId: parts[1], ts: Number(parts[2]) || 0, sig: parts.slice(3).join(".") };
  } catch { return null; }
}


// List token (stable paging across multiple /recs calls)
// Encodes the ordered list of recommended productIds so the client can request next batches
// without the server re-sampling exploration.
const RECO_LIST_SECRET = String(process.env.RECO_LIST_SECRET || process.env.JWT_SECRET || "dev_reco_list_secret").trim();

function _recoListB64UrlEncode(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function _recoListB64UrlDecode(str) {
  const ss = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = ss.length % 4 ? "=".repeat(4 - (ss.length % 4)) : "";
  return Buffer.from(ss + pad, "base64");
}

function _recoMakeListToken({ widgetId, sourceProductId, itemIds, ttlMinutes = 60 }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const sourcePid = String(sourceProductId || "").trim();
  const ttl = Math.max(5, Math.min(1440, Number(ttlMinutes || 60) || 60));
  const exp = Date.now() + ttl * 60 * 1000;

  const ids = (Array.isArray(itemIds) ? itemIds : []).map(x => String(x || "").trim()).filter(Boolean).slice(0, 300);
  const payload = { wid, sourcePid, ids, exp };
  const body = _recoListB64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = crypto.createHmac("sha256", RECO_LIST_SECRET).update(body).digest();
  const sigB64 = _recoListB64UrlEncode(sig);
  return `${body}.${sigB64}`;
}


// Deterministic pseudo-random number in [0,1) from a string (stable per listToken)
function _recoDetRand(str) {
  try {
    const h = crypto.createHash('md5').update(String(str || '')).digest('hex');
    const n = parseInt(h.slice(0, 12), 16);
    return (n % 1000000) / 1000000;
  } catch {
    return Math.random();
  }
}

function _recoParseListToken(token) {
  try {
    const t = String(token || "").trim();
    if (!t.includes(".")) return null;
    const [body, sig] = t.split(".", 2);
    if (!body || !sig) return null;

    const sigCalc = crypto.createHmac("sha256", RECO_LIST_SECRET).update(body).digest();
    const sigCalcB64 = _recoListB64UrlEncode(sigCalc);
    if (!timingSafeEqualHex(_recoSha256(sig), _recoSha256(sigCalcB64))) return null;

    const payload = JSON.parse(_recoListB64UrlDecode(body).toString("utf8"));
    if (!payload || typeof payload !== "object") return null;
    const exp = Number(payload.exp || 0);
    if (!exp || exp < Date.now()) return null;

    return {
      widgetId: String(payload.wid || "").trim() || RECO_WIDGET_DEFAULT,
      sourceProductId: String(payload.sourcePid || "").trim(),
      itemIds: Array.isArray(payload.ids) ? payload.ids.map(x => String(x || "").trim()).filter(Boolean) : [],
      exp
    };
  } catch {
    return null;
  }
}

const RECO_DISCOUNT_SECRET = String(process.env.RECO_DISCOUNT_SECRET || process.env.JWT_SECRET || "dev_reco_discount_secret").trim();

function _recoB64UrlEncode(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function _recoB64UrlDecode(str) {
  const s = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Buffer.from(s + pad, "base64");
}

function _recoMakeDiscountToken({ widgetId, sourceProductId, targetProductId, pct, ttlMinutes }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const sourcePid = String(sourceProductId || "").trim();
  const targetPid = String(targetProductId || "").trim();
  const pctNum = Number(pct || 0);
  const ttl = Math.max(1, Math.min(1440, Number(ttlMinutes || 60)));
  const exp = Date.now() + ttl * 60 * 1000;

  const payload = { wid, sourcePid, targetPid, pct: pctNum, exp };
  const body = _recoB64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = crypto.createHmac("sha256", RECO_DISCOUNT_SECRET).update(body).digest();
  const sigB64 = _recoB64UrlEncode(sig);
  return `${body}.${sigB64}`;
}

function _recoParseDiscountToken(token) {
  try {
    const t = String(token || "").trim();
    if (!t.includes(".")) return null;
    const [body, sig] = t.split(".", 2);
    if (!body || !sig) return null;

    const sigCalc = crypto.createHmac("sha256", RECO_DISCOUNT_SECRET).update(body).digest();
    const sigCalcB64 = _recoB64UrlEncode(sigCalc);
    if (!timingSafeEqualHex(_recoSha256(sig), _recoSha256(sigCalcB64))) return null;

    const payload = JSON.parse(_recoB64UrlDecode(body).toString("utf8"));
    if (!payload || typeof payload !== "object") return null;
    const exp = Number(payload.exp || 0);
    if (!exp || exp < Date.now()) return null;

    return {
      widgetId: String(payload.wid || "").trim() || RECO_WIDGET_DEFAULT,
      sourceProductId: String(payload.sourcePid || "").trim(),
      targetProductId: String(payload.targetPid || "").trim(),
      pct: Number(payload.pct || 0),
      exp
    };
  } catch {
    return null;
  }
}

function _recoDiscountTokenHash(token) {
  return _recoSha256(String(token || ""));
}

async function _recoUpsertStatsAndRecompute({ widgetId, sourceProductId, targetProductId, delta }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const src = String(sourceProductId || "").trim();
  const tgt = String(targetProductId || "").trim();
  if (!src || !tgt) return;

  const upd = { $setOnInsert: { widgetId: wid, sourceProductId: src, targetProductId: tgt }, $inc: {}, $set: { lastEventAt: _recoNow() } };
  if (delta?.impressions) upd.$inc.impressions = Number(delta.impressions);
  if (delta?.clicks) upd.$inc.clicks = Number(delta.clicks);
  if (delta?.addToCarts) upd.$inc.addToCarts = Number(delta.addToCarts);
  if (delta?.purchases) upd.$inc.purchases = Number(delta.purchases);

  const doc = await RecoStats.findOneAndUpdate(
    { widgetId: wid, sourceProductId: src, targetProductId: tgt },
    upd,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  const sourceProduct = await Product.findOne({ productId: src }).lean();
  const cfg = sourceProduct ? await _recoResolveConfig({ widgetId: wid, sourceProduct }) : null;
  const auto = _recoComputeScoreAuto(doc, cfg);
  const finalScore = _recoComputeScoreFinal(auto, doc);

  const priorClk = _recoClamp(cfg?.exploration?.priorClicks ?? 1, 0, 1000);
  const priorAtc = _recoClamp(cfg?.exploration?.priorATC ?? 1, 0, 1000);
  const alpha = (Number(doc.addToCarts || 0) + priorAtc);
  const beta = (Math.max(0, Number(doc.clicks || 0) - Number(doc.addToCarts || 0)) + priorClk);

  await RecoStats.updateOne(
    { _id: doc._id },
    { $set: { scoreAuto: auto, scoreFinal: finalScore, alpha, beta } }
  );
}

async function _recoUpsertGlobalStatsAndRecompute({ widgetId, targetProductId, delta }) {
  const wid = String(widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
  const tgt = String(targetProductId || "").trim();
  if (!tgt) return;

  const upd = { $setOnInsert: { widgetId: wid, targetProductId: tgt }, $inc: {}, $set: { lastEventAt: _recoNow() } };
  if (delta?.impressions) upd.$inc.impressions = Number(delta.impressions);
  if (delta?.clicks) upd.$inc.clicks = Number(delta.clicks);
  if (delta?.addToCarts) upd.$inc.addToCarts = Number(delta.addToCarts);
  if (delta?.purchases) upd.$inc.purchases = Number(delta.purchases);

  const doc = await RecoGlobalStats.findOneAndUpdate(
    { widgetId: wid, targetProductId: tgt },
    upd,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  // global score uses same formula, with default config priors
  const cfg = await RecoConfig.findOne({ widgetId: wid, scope: "global", scopeId: null }).lean();
  const auto = _recoComputeScoreAuto(doc, cfg);
  const finalScore = _recoComputeScoreFinal(auto, doc);

  const priorClk = _recoClamp(cfg?.exploration?.priorClicks ?? 1, 0, 1000);
  const priorAtc = _recoClamp(cfg?.exploration?.priorATC ?? 1, 0, 1000);
  const alpha = (Number(doc.addToCarts || 0) + priorAtc);
  const beta = (Math.max(0, Number(doc.clicks || 0) - Number(doc.addToCarts || 0)) + priorClk);

  await RecoGlobalStats.updateOne(
    { _id: doc._id },
    { $set: { scoreAuto: auto, scoreFinal: finalScore, alpha, beta } }
  );
}

// Public: fetch recommendations for a product page
app.get('/recs', async (req, res) => {
  try {
    if (!originIsAllowed(req)) return res.status(403).json({ error: "FORBIDDEN" });

    const widgetId = String(req.query.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const _normRecoId = (v) => {
      if (v == null) return "";
      let s = String(v).trim();
      if (s.startsWith("[object Set]_")) s = s.slice("[object Set]_".length);
      if (s === "[object Set]") return "";
      if (s.startsWith("[object Array]_")) s = s.slice("[object Array]_".length);
      if (s === "[object Array]") return "";
      return s;
    };

    const sourceProductId = _normRecoId(req.query.sourceProductId || "");
    const device = (String(req.query.device || "").trim().toLowerCase() === "mobile") ? "mobile" : "desktop";

    const offset = Math.max(0, Number(req.query.offset || 0) || 0);
    const limitReq = (req.query.limit != null && String(req.query.limit).trim() !== "") ? Math.max(1, Number(req.query.limit || 0) || 0) : null;

    const listTokenIn = String(req.query.listToken || "").trim();
    let listTok = listTokenIn ? _recoParseListToken(listTokenIn) : null;

    if (!sourceProductId) return res.status(400).json({ error: "missing sourceProductId" });

    // Optional exclusions (CSV). Frontend uses this to exclude the currently viewed PDP item.
    const excludeCsv = String(req.query.exclude || req.query.excludeProductId || "").trim();
    const excludeIds = new Set(
      excludeCsv
        ? excludeCsv.split(",").map(_normRecoId).filter(Boolean)
        : []
    );
    excludeIds.add(_normRecoId(sourceProductId));
    if (req.query.currentProductId) excludeIds.add(_normRecoId(req.query.currentProductId));

    const __recsDebug = String(req.query.debug || "").trim();
    const __recsDebugOn = (__recsDebug === "1" || __recsDebug.toLowerCase() === "true" || __recsDebug.toLowerCase() === "yes");
    const __recsDebugEnv = (String(process.env.RECS_DEBUG || "").trim() === "1");
    const __recsDbg = (__recsDebugOn || __recsDebugEnv);
    if (__recsDbg) {
      console.log("[recs] IN", {
        t: new Date().toISOString(),
        widgetId,
        device,
        sourceProductId,
        currentProductId: _normRecoId(req.query.currentProductId || ""),
        offset,
        limit: (limitReq != null ? limitReq : undefined),
        exclude: excludeCsv,
        excludeCount: excludeIds.size,
        listTokenIn,
        ua: String(req.headers["user-agent"] || "").slice(0, 140),
      });
    }

    // Build/resolve the ordered list once (listToken), then slice for paging.
    let orderedIds = [];
    let cfg = null;

    // Resolve source product: prefer DB, fall back to in-memory catalog bundle.
    let sourceProduct = await Product.findOne({ productId: sourceProductId }).lean();
    let sourceFromCatalog = null;
    if (!sourceProduct) {
      const idx = catalogIndexCache || rebuildCatalogIndexes(productsData || {});
      if (!catalogIndexCache) { catalogIndexCache = idx; catalogIndexCacheAt = Date.now(); }
      sourceFromCatalog = idx && idx.productsById ? idx.productsById[sourceProductId] : null;
      if (sourceFromCatalog) {
        const cat = (idx.idToCategory && idx.idToCategory[sourceProductId]) ? String(idx.idToCategory[sourceProductId]) : "";
        sourceProduct = {
          productId: String(sourceProductId),
          name: sourceFromCatalog.name,
          price: sourceFromCatalog.price,
          description: sourceFromCatalog.description,
          images: sourceFromCatalog.images,
          productLink: sourceFromCatalog.productLink,
          expectedPurchasePrice: sourceFromCatalog.expectedPurchasePrice,
          categories: cat ? [cat] : (Array.isArray(sourceFromCatalog.categories) ? sourceFromCatalog.categories : []),
        };
      }
      if (__recsDbg) {
        console.log("[recs] source resolve", {
          sourceProductId,
          dbFound: false,
          catalogFound: !!sourceFromCatalog,
          catalogCacheAt: catalogIndexCacheAt || undefined
        });
      }
    } else if (__recsDbg) {
      console.log("[recs] source resolve", { sourceProductId, dbFound: true });
    }
    if (!sourceProduct) {
      return res.status(404).json({ error: "source product not found", sourceProductId });
    }

    cfg = await _recoResolveConfig({ widgetId, sourceProduct });


    if (listTok && (String(listTok.widgetId) !== String(widgetId) || String(listTok.sourceProductId) !== String(sourceProductId))) {
      // token doesn't match this request; ignore
      listTok = null;
    }

    if (listTok && Array.isArray(listTok.itemIds) && listTok.itemIds.length) {
      orderedIds = listTok.itemIds.slice(0, 300);
    } else {
      // If the source product isn't in DB, we still can serve recs using the in-memory catalog bundle.
      if (sourceFromCatalog) {
        const idx = catalogIndexCache || rebuildCatalogIndexes(productsData || {});
        if (!catalogIndexCache) { catalogIndexCache = idx; catalogIndexCacheAt = Date.now(); }
        const cat = (idx.idToCategory && idx.idToCategory[sourceProductId]) ? String(idx.idToCategory[sourceProductId]) : "";
        const pool = (cat && idx.categoryIdLists && Array.isArray(idx.categoryIdLists[cat]))
          ? idx.categoryIdLists[cat]
          : Object.keys(idx.productsById || {});
        orderedIds = (pool || []).map(_normRecoId).filter(Boolean).slice(0, 300);

        const ttl = Number(cfg?.ui?.carousel?.tokenTtlMinutes || 60) || 60;
        listTok = _recoParseListToken(_recoMakeListToken({ widgetId, sourceProductId, itemIds: orderedIds, ttlMinutes: ttl }));

        if (__recsDbg) {
          console.log("[recs] built from catalog", { sourceProductId, cat, poolSize: pool?.length || 0, orderedSize: orderedIds.length });
        }
      } else {
        const out = await _recoBuildRecommendations({ widgetId, sourceProductId });
        if (!out.ok) return res.status(400).json(out);
        cfg = out.config || cfg;
        orderedIds = (out.items || []).map(p => String(p.productId || "").trim()).filter(Boolean).slice(0, 300);

        const ttl = Number(cfg?.ui?.carousel?.tokenTtlMinutes || 60) || 60;
        listTok = _recoParseListToken(_recoMakeListToken({ widgetId, sourceProductId, itemIds: orderedIds, ttlMinutes: ttl }));
      }
    }


    // Dedupe orderedIds (normalized) to prevent repeats caused by mixed id representations.
    try {
      const __seen = new Set();
      const __uniq = [];
      for (const __id of (orderedIds || [])) {
        const __n = _normRecoId(__id);
        if (!__n) continue;
        if (__seen.has(__n)) continue;
        __seen.add(__n);
        __uniq.push(__n);
      }
      orderedIds = __uniq;
      // Ensure token contains the deduped list (keeps pagination stable)
      if (listTok) {
        listTok.itemIds = orderedIds.slice(0, 300);
      }
    } catch { }

    // Best performers: allow sparse repeats client-side (never current/source).
    let bestPerformerIds = [];
    try {
      const bestCount = (cfg && cfg.globalWinnersEnabled ? Number(cfg.globalWinnerSlots || 0) : 0) + Number(cfg && cfg.stableSlots || 0);
      bestPerformerIds = (orderedIds || []).slice(0, Math.max(0, bestCount | 0)).filter(id => !excludeIds.has(_normRecoId(id)));
    } catch { }
    // Never recommend excluded ids (includes source product and any frontend-provided exclusions)
    orderedIds = orderedIds.filter(id => !excludeIds.has(_normRecoId(id)));
    const car = (cfg && cfg.ui && cfg.ui.carousel && typeof cfg.ui.carousel === "object") ? cfg.ui.carousel : {};
    const visible = device === "mobile" ? Number(car.mobileVisible || 2) : Number(car.desktopVisible || 3);
    const batchSize = device === "mobile" ? Number(car.batchSizeMobile || visible) : Number(car.batchSizeDesktop || visible);
    const maxItemsCfg = device === "mobile"
      ? (Number(car.maxItemsMobile ?? car.maxItems ?? 0) || 0)
      : (Number(car.maxItemsDesktop ?? car.maxItems ?? 0) || 0);

    const maxBatchesCfg = device === "mobile"
      ? (Number(car.maxBatchesMobile ?? car.maxBatches ?? 6) || 6)
      : (Number(car.maxBatchesDesktop ?? car.maxBatches ?? 6) || 6);

    const prefetchThresholdItems = device === "mobile" ? Number(car.prefetchThresholdMobile || 3) : Number(car.prefetchThresholdDesktop || 6);
    const appendCountDefault = device === "mobile" ? Number(car.appendCountMobile || visible) : Number(car.appendCountDesktop || batchSize);


    const prefetch = (String(req.query.prefetch || "").trim() === "1");
    const remainingItems = Math.max(0, Number(req.query.remainingItems || 0) || 0);

    let limitBase = (limitReq != null ? limitReq : batchSize);
    if (prefetch && (limitReq == null)) {
      if (remainingItems <= Math.max(0, prefetchThresholdItems)) {
        limitBase = appendCountDefault;
      }
    }

    const limit = Math.max(1, Math.min(30, limitBase));
    const totalAllowed = Math.min(orderedIds.length, (maxItemsCfg > 0 ? maxItemsCfg : orderedIds.length));

    const idsAllowed = orderedIds.slice(0, totalAllowed);

    // Load full list (<=60 by default) so discounts and positions are stable.
    const prods = await Product.find({ productId: { $in: idsAllowed } })
      .select({ productId: 1, name: 1, price: 1, description: 1, images: 1, productLink: 1, expectedPurchasePrice: 1 })
      .lean();

    const byId = new Map((prods || []).map(p => [String(p.productId), p]));
    // Fallback: if DB doesn't have these products yet, hydrate from in-memory catalog bundle.
    if ((!prods || !prods.length) && catalogIndexCache && catalogIndexCache.productsById) {
      for (const pid of (idsAllowed || [])) {
        const pp = catalogIndexCache.productsById[String(pid)];
        if (!pp) continue;
        if (!byId.has(String(pid))) {
          byId.set(String(pid), {
            productId: String(pid),
            name: pp.name,
            price: pp.price,
            description: pp.description,
            images: pp.images,
            productLink: pp.productLink,
            expectedPurchasePrice: pp.expectedPurchasePrice,
          });
        }
      }
      if (__recsDbg) console.log("[recs] hydrate fallback from catalog", { requested: idsAllowed?.length || 0, hydrated: byId.size });
    }
    let itemsFull = idsAllowed.map((pid, idx) => {
      const p = byId.get(String(pid));
      if (!p) return null;
      return {
        productId: _normRecoId(p.productId),
        name: p.name,
        price: p.price,
        description: p.description,
        image: Array.isArray(p.images) && p.images.length ? p.images[0] : null,
        productLink: p.productLink || "",
        expectedPurchasePrice: (p.expectedPurchasePrice != null ? Number(p.expectedPurchasePrice) : null),
        position: idx + 1
      };
    }).filter(Boolean);

    // Safety: apply exclusion again after hydrate (in case idsAllowed had missing products / normalization differences)
    if (excludeIds && excludeIds.size) {
      itemsFull = itemsFull.filter(it => !excludeIds.has(_normRecoId(it.productId)));
    }

    // Optional: attach small auto-applied discounts to a few recommended items (server decides via config + performance guardrails).
    const discountCfg = (cfg && cfg.discount && typeof cfg.discount === "object") ? cfg.discount : {};
    const discountEnabled = !!discountCfg.enabled;

    // Normalize discount params once so they're available to both the main-discount and exploration-discount blocks.
    let minClicks = Math.max(0, Number(discountCfg.minImpressions || 0) || 0);
    let minPct = Math.max(0, Number(discountCfg.minPct || 0) || 0);
    let maxPct = Math.max(minPct, Number(discountCfg.maxPct || 0) || 0);
    let maxAtcPerClick = Math.max(0, Math.min(1, Number(discountCfg.maxAtcPerClick || 0.10) || 0.10));
    let minMarginPct = Math.max(0, Math.min(0.99, Number(discountCfg.minMarginPct || 0.20) || 0.20));
    let ttlMinutes = Math.max(1, Math.min(1440, Number(discountCfg.ttlMinutes || 60) || 60));
    let maxItemsPerWidget = Math.max(0, Math.min(20, Number(discountCfg.maxItemsPerWidget || 0) || 0));

    if (discountEnabled && itemsFull.length) {
      const stableSlots = Number(cfg?.stableSlots || 0) || 0;
      const globalSlots = Number(cfg?.globalWinnerSlots || 0) || 0;
      const onlyEvolution = (discountCfg.onlyEvolutionSlots !== false);


      const eligible = itemsFull.filter(it => {
        if (onlyEvolution) {
          const evoStart = globalSlots + stableSlots + 1;
          if (Number(it.position || 0) < evoStart) return false;
        }
        return true;
      });

      if (maxItemsPerWidget > 0 && eligible.length) {
        const ids = eligible.map(x => String(x.productId));
        const stats = await RecoStats.find({ widgetId, sourceProductId, targetProductId: { $in: ids } }).lean();
        const byStatId = new Map((stats || []).map(s => [String(s.targetProductId), s]));

        const scored = eligible.map(it => {
          const st = byStatId.get(String(it.productId)) || {};
          const clicks = Number(st.clicks || 0);
          const atc = Number(st.addToCarts || 0);
          const atcPerClick = atc / Math.max(1, clicks);
          return { it, clicks, atcPerClick };
        }).filter(x => x.clicks >= minClicks && x.atcPerClick <= maxAtcPerClick);

        scored.sort((a, b) => (a.atcPerClick - b.atcPerClick) || (b.clicks - a.clicks));

        const chosen = scored.slice(0, maxItemsPerWidget);

        for (const c of chosen) {
          const frac = (maxAtcPerClick > 0) ? (1 - (c.atcPerClick / maxAtcPerClick)) : 0;
          const pct = Math.min(maxPct, Math.max(minPct, round2(minPct + (maxPct - minPct) * frac)));

          if (!pct || pct <= 0) continue;

          const sell = Number(c.it.price || 0);
          const purchase = Number(c.it.expectedPurchasePrice || 0);
          if (sell > 0 && purchase > 0) {
            const discounted = sell * (1 - pct / 100);
            const marginPct = (discounted - purchase) / Math.max(0.01, discounted);
            if (marginPct < minMarginPct) continue;
          }

          const discountedPrice = round2(sell * (1 - pct / 100));
          if (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice >= sell) continue;

          c.it.discountPct = pct;
          c.it.discountedPrice = discountedPrice;
          c.it.discountToken = _recoMakeDiscountToken({ widgetId, sourceProductId, targetProductId: String(c.it.productId), pct, ttlMinutes });
        }
      }
    }

    itemsFull = itemsFull.map(({ expectedPurchasePrice, ...rest }) => rest);


    let slice = itemsFull.slice(offset, offset + limit).map((it, idx) => ({
      ...it,
      position: offset + idx + 1
    }));

    // Optional exploration discounts (deterministic per listToken): can apply small random discounts to test demand.
    if (discountEnabled && slice.length) {
      const strategy = String(discountCfg.strategy || "bestSellers").toLowerCase();
      const randomChance = Math.max(0, Math.min(1, Number(discountCfg.randomChance || 0) || 0));
      const maxRandomPerBatch = Math.max(0, Math.min(10, Number(discountCfg.maxRandomPerBatch || 0) || 0));

      if ((strategy === "random" || strategy === "mixed") && randomChance > 0 && maxRandomPerBatch > 0) {
        const seedBase = String(listTokenIn || _recoMakeListToken({ widgetId, sourceProductId, itemIds: idsAllowed, ttlMinutes: Number(car.tokenTtlMinutes || 60) || 60 })) + "|" + String(offset);
        let applied = 0;
        for (const it of slice) {
          if (applied >= maxRandomPerBatch) break;
          if (it.discountPct) continue;
          const r = _recoDetRand(seedBase + "|" + String(it.productId));
          if (r >= randomChance) continue;

          const pct = Math.min(maxPct, Math.max(minPct, round2(minPct + (maxPct - minPct) * r)));
          if (!pct || pct <= 0) continue;

          const sell = Number(it.price || 0);
          const purchase = Number(byId.get(String(it.productId))?.expectedPurchasePrice || 0);
          if (sell > 0 && purchase > 0) {
            const discounted = sell * (1 - pct / 100);
            const marginPct = (discounted - purchase) / Math.max(0.01, discounted);
            if (marginPct < minMarginPct) continue;
          }

          const discountedPrice = round2(sell * (1 - pct / 100));
          if (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice >= sell) continue;

          it.discountPct = pct;
          it.discountedPrice = discountedPrice;
          it.discountToken = _recoMakeDiscountToken({ widgetId, sourceProductId, targetProductId: String(it.productId), pct, ttlMinutes });
          applied += 1;
        }
      }
    }

    const hasMore = (offset + limit) < itemsFull.length;
    const token = _recoMakeTrackingToken({ widgetId, sourceProductId, itemIds: idsAllowed, ts: Date.now() });

    return res.json({
      ok: true,
      widgetId,
      sourceProductId,
      token,
      listToken: _recoMakeListToken({ widgetId, sourceProductId, itemIds: idsAllowed, ttlMinutes: Number(car.tokenTtlMinutes || 60) || 60 }),
      bestPerformerIds,
      ui: {
        device,
        visibleCount: Math.max(1, visible),
        batchSize: Math.max(1, (limitReq != null ? limitReq : batchSize)),
        maxBatches: Math.max(1, Number(car.maxBatches || 6) || 6),
        maxItems: Math.max(0, Number(car.maxItems || 0) || 0),
        swipeSmallPx: Math.max(5, Number(car.swipeSmallPx || 35) || 35),
        swipeBigPx: Math.max(20, Number(car.swipeBigPx || 120) || 120)
      },
      config: {
        stableSlots: cfg?.stableSlots,
        evolutionSlots: cfg?.evolutionSlots,
        globalWinnerSlots: cfg?.globalWinnerSlots,
        globalWinnersEnabled: cfg?.globalWinnersEnabled
      },
      total: itemsFull.length,
      offset,
      limit,
      hasMore,
      appendCount: Math.max(1, Number(appendCountDefault || 1) || 1),
      items: slice
    });
  } catch (e) {
    console.error('[recs] fetch error', e);
    return res.status(500).json({ error: 'recs failed' });
  }
});

// Public: record recommendation events
app.post('/recs/event', express.json({ limit: '128kb' }), async (req, res) => {
  try {
    if (!originIsAllowed(req)) return res.status(403).json({ error: "FORBIDDEN" });

    const body = req.body || {};
    const type = String(body.type || "").trim();
    const widgetId = String(body.widgetId || "").trim() || RECO_WIDGET_DEFAULT;
    const token = String(body.token || "").trim();
    const parsed = _recoParseTrackingToken(token);

    const sourceProductId = String(body.sourceProductId || parsed?.sourceProductId || "").trim();
    const targetProductId = String(body.targetProductId || "").trim();

    if (!type || !["impression", "click", "add_to_cart", "purchase"].includes(type)) return res.status(400).json({ error: "bad type" });
    if (!sourceProductId) return res.status(400).json({ error: "missing sourceProductId" });
    if (type !== "impression" && !targetProductId) return res.status(400).json({ error: "missing targetProductId" });

    const sessionId = String(body.sessionId || "").trim().slice(0, 120);
    const position = (body.position != null) ? Number(body.position) : null;

    // Dedupe key: session+token+type+target+position
    const tokenHash = _recoSha256(`${sessionId}|${token}|${type}|${targetProductId}|${position ?? ''}`);

    try {
      await RecoEvent.create({
        widgetId,
        type,
        sessionId,
        userId: String(body.userId || "").trim().slice(0, 120),
        sourceProductId,
        targetProductId,
        position,
        tokenHash,
        extra: body.extra || null,
        createdAt: _recoNow()
      });
    } catch (e) {
      // Duplicate = already counted; return ok.
      if (String(e?.code) !== '11000') {
        console.warn('[recs] event write failed', e?.message || e);
      }
    }

    const delta = { impressions: 0, clicks: 0, addToCarts: 0, purchases: 0 };
    if (type === "impression") delta.impressions = 1;
    if (type === "click") delta.clicks = 1;
    if (type === "add_to_cart") delta.addToCarts = 1;
    if (type === "purchase") delta.purchases = 1;

    if (type === "impression") {
      // Impression doesn't tie to a single target unless client sends list; keep only raw event.
      // (You can later attribute impressions per-target via token/list if you want.)
      return res.json({ ok: true });
    }

    await _recoUpsertStatsAndRecompute({ widgetId, sourceProductId, targetProductId, delta });
    await _recoUpsertGlobalStatsAndRecompute({ widgetId, targetProductId, delta });

    return res.json({ ok: true });
  } catch (e) {
    console.error('[recs] event error', e);
    return res.status(500).json({ error: 'event failed' });
  }
});

// Public: validate recommendation discount tokens (used by cart/basket rendering)
app.post('/recs/quote', express.json({ limit: '128kb' }), async (req, res) => {
  try {
    if (!originIsAllowed(req)) return res.status(403).json({ error: "FORBIDDEN" });

    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const out = [];

    for (const it of items) {
      const token = String(it?.token || it?.discountToken || "").trim();
      if (!token) continue;
      const parsed = _recoParseDiscountToken(token);
      if (!parsed?.targetProductId || !parsed?.pct) {
        out.push({ token, ok: false, valid: false, reason: "invalid" });
        continue;
      }

      // Optional: if client provides productId, enforce match
      const wantPid = String(it?.productId || "").trim();
      if (wantPid && String(parsed.targetProductId) !== wantPid) {
        out.push({ token, ok: false, valid: false, reason: "mismatch", productId: String(parsed.targetProductId) });
        continue;
      }

      out.push({
        token,
        ok: true,
        valid: true,
        widgetId: parsed.widgetId,
        sourceProductId: parsed.sourceProductId,
        productId: String(parsed.targetProductId),
        discountPct: Number(parsed.pct || 0),
        discountedPrice: Number(parsed.discountedPrice || 0),
        exp: Number(parsed.exp || 0)
      });
    }

    return res.json({ ok: true, quotes: out });
  } catch (e) {
    console.error('[recs] quote error', e);
    return res.status(500).json({ error: 'quote failed' });
  }
});




// ===== Smart recommendations (cart/checkout) =====

// POST /smart-reco/get
// Body: { placement, sessionId, cartItems:[{name}], desiredEUR, limit, context }
app.post('/smart-reco/get', express.json({ limit: '256kb' }), async (req, res) => {
  try {
    if (!originIsAllowed(req)) return res.status(403).json({ error: "FORBIDDEN" });

    const ff = getFeatureFlagsRuntimeSyncBestEffort();
    const placementReq = String((req.body || {}).placement || "cart_topup_v1").trim();
    if (!ff?.smartReco?.enabled || ff?.smartReco?.placements?.[placementReq] === false) {
      return res.json({ ok: true, placement: placementReq, token: null, items: [], disabled: true });
    }

    const b = req.body || {};
    const placement = String(b.placement || "cart_topup_v1").trim();
    const sessionId = String(b.sessionId || "").trim().slice(0, 120);
    const desiredEUR = Number(b.desiredEUR || 0) || 0;
    const limit = Math.max(1, Math.min(12, Number(b.limit || 6) || 6));

    const cartItems = Array.isArray(b.cartItems) ? b.cartItems : [];
    const cartNames = cartItems.map(it => String(it?.name || it?.productName || "").trim()).filter(Boolean);

    const context = (b.context && typeof b.context === "object") ? b.context : null;

    const out = await _srBuildSmartRecommendations({ placement, sessionId, cartNames, desiredEUR, limit, context });
    return res.json(out);
  } catch (e) {
    console.error('[smart-reco] get error', e);
    return res.status(500).json({ error: "smart-reco failed" });
  }
});

// POST /smart-reco/event
// Body: { type, token, itemKey, sessionId }
app.post('/smart-reco/event', express.json({ limit: '128kb' }), async (req, res) => {
  try {
    if (!originIsAllowed(req)) return res.status(403).json({ error: "FORBIDDEN" });

    const ff = getFeatureFlagsRuntimeSyncBestEffort();
    const parsedToken = _srParseToken(String((req.body || {}).token || ""));
    const placementTok = parsedToken?.placement || String((req.body || {}).placement || "").trim();
    if (!ff?.smartReco?.enabled || (placementTok && ff?.smartReco?.placements?.[placementTok] === false)) {
      return res.json({ ok: true, disabled: true });
    }

    const b = req.body || {};
    const type = String(b.type || "").trim();
    if (!["click", "add_to_cart", "purchase"].includes(type)) return res.status(400).json({ error: "bad type" });

    const token = String(b.token || "").trim();
    const parsed = _srParseToken(token);
    if (!parsed?.placement || !parsed?.tokenHash) return res.status(400).json({ error: "bad token" });

    const placement = String(parsed.placement);
    const tokenHash = String(parsed.tokenHash);
    const sessionId = String(b.sessionId || "").trim().slice(0, 120);
    const itemKey = String(b.itemKey || b.productId || b.name || "").trim();
    if (!itemKey) return res.status(400).json({ error: "missing itemKey" });

    // Write raw event (analytics)
    await SmartRecoEvent.create({
      placement,
      tokenHash,
      type,
      sessionId,
      itemKey,
      createdAt: new Date()
    });

    // Update model only for learning signals
    let reward = 0;
    if (type === "click") reward = 0.1;
    if (type === "add_to_cart") reward = 1.0;
    if (type === "purchase") reward = 3.0;

    if (reward > 0) await _srUpdateModelFromEvent({ placement, tokenHash, itemKey, reward });

    return res.json({ ok: true });
  } catch (e) {
    console.error('[smart-reco] event error', e);
    return res.status(500).json({ error: "event failed" });
  }
});

// ===== Admin: recommendations analytics + controls =====

// GET /admin/recs/overview?widgetId=
app.get('/admin/recs/overview', authMiddleware, async (req, res) => {
  try {
    const widgetId = String(req.query.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const topGlobal = await RecoGlobalStats.find({ widgetId }).sort({ scoreFinal: -1 }).limit(50).lean();
    const totalsAgg = await RecoGlobalStats.aggregate([
      { $match: { widgetId } },
      { $group: { _id: null, impressions: { $sum: "$impressions" }, clicks: { $sum: "$clicks" }, addToCarts: { $sum: "$addToCarts" }, purchases: { $sum: "$purchases" } } }
    ]);
    const totals = totalsAgg && totalsAgg[0] ? totalsAgg[0] : { impressions: 0, clicks: 0, addToCarts: 0, purchases: 0 };
    return res.json({ ok: true, widgetId, totals, topGlobal });
  } catch (e) {
    console.error('[admin][recs] overview error', e);
    return res.status(500).json({ error: 'overview failed' });
  }
});

// GET /admin/recs/source/:sourceProductId?widgetId=
app.get('/admin/recs/source/:sourceProductId', authMiddleware, async (req, res) => {
  try {
    const widgetId = String(req.query.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const sourceProductId = String(req.params.sourceProductId || "").trim();
    const sourceProduct = await Product.findOne({ productId: sourceProductId }).lean();
    if (!sourceProduct) return res.status(404).json({ error: "source not found" });

    const cfg = await _recoResolveConfig({ widgetId, sourceProduct });
    const exclusions = await _recoLoadExclusions({ widgetId, sourceProductId });

    const rows = await RecoStats.find({ widgetId, sourceProductId }).sort({ scoreFinal: -1 }).limit(500).lean();
    const productIds = rows.map(r => r.targetProductId);
    const prodDocs = await Product.find({ productId: { $in: productIds } }).select({ productId: 1, name: 1, price: 1, images: 1, categories: 1 }).lean();
    const byId = new Map(prodDocs.map(p => [String(p.productId), p]));

    const items = rows.map(r => ({
      ...r,
      target: byId.get(String(r.targetProductId)) || null
    }));

    return res.json({ ok: true, widgetId, sourceProduct, config: cfg, exclusions: exclusions.raw, items });
  } catch (e) {
    console.error('[admin][recs] source error', e);
    return res.status(500).json({ error: 'source failed' });
  }
});

// PATCH /admin/recs/source/:sourceProductId/target/:targetProductId
app.patch('/admin/recs/source/:sourceProductId/target/:targetProductId', authMiddleware, async (req, res) => {
  try {
    const widgetId = String(req.query.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const sourceProductId = String(req.params.sourceProductId || "").trim();
    const targetProductId = String(req.params.targetProductId || "").trim();

    const body = req.body || {};
    const set = {};
    if (body.manualBoost != null) set.manualBoost = Number(body.manualBoost) || 0;
    if (body.manualMultiplier != null) set.manualMultiplier = Number(body.manualMultiplier) || 0;

    const doc = await RecoStats.findOneAndUpdate(
      { widgetId, sourceProductId, targetProductId },
      { $set: set, $setOnInsert: { widgetId, sourceProductId, targetProductId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const sourceProduct = await Product.findOne({ productId: sourceProductId }).lean();
    const cfg = sourceProduct ? await _recoResolveConfig({ widgetId, sourceProduct }) : null;
    const auto = _recoComputeScoreAuto(doc, cfg);
    const finalScore = _recoComputeScoreFinal(auto, doc);

    await RecoStats.updateOne({ _id: doc._id }, { $set: { scoreAuto: auto, scoreFinal: finalScore } });

    await RecoAdminAction.create({ widgetId, action: "adjust_score", actor: String(req.user?.sub || "admin"), sourceProductId, targetProductId, payload: set });

    return res.json({ ok: true });
  } catch (e) {
    console.error('[admin][recs] adjust error', e);
    return res.status(500).json({ error: 'adjust failed' });
  }
});

// POST /admin/recs/exclusions
app.post('/admin/recs/exclusions', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const widgetId = String(body.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const type = String(body.type || "").trim();
    if (!type || !["global_product_ban", "per_source_ban", "category_ban"].includes(type)) return res.status(400).json({ error: "bad type" });

    const doc = await RecoExclusion.findOneAndUpdate(
      {
        widgetId,
        type,
        sourceProductId: body.sourceProductId != null ? String(body.sourceProductId || "").trim() : null,
        productId: body.productId != null ? String(body.productId || "").trim() : null,
        categoryKey: body.categoryKey != null ? String(body.categoryKey || "").trim() : null
      },
      {
        $set: {
          reason: String(body.reason || "").slice(0, 500),
          isActive: body.isActive !== false,
          updatedBy: String(req.user?.sub || "admin").slice(0, 120)
        },
        $setOnInsert: { createdAt: _recoNow() }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    await RecoAdminAction.create({ widgetId, action: "exclusion_upsert", actor: String(req.user?.sub || "admin"), payload: doc });

    return res.json({ ok: true, exclusion: doc });
  } catch (e) {
    console.error('[admin][recs] exclusion error', e);
    return res.status(500).json({ error: 'exclusion failed' });
  }
});

// GET /admin/recs/config?widgetId=&scope=&scopeId=
app.get('/admin/recs/config', authMiddleware, async (req, res) => {
  try {
    const widgetId = String(req.query.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const scope = String(req.query.scope || "global").trim();
    const scopeId = (req.query.scopeId != null && String(req.query.scopeId).trim() !== "") ? String(req.query.scopeId).trim() : null;

    const doc = await RecoConfig.findOne({ widgetId, scope, scopeId }).lean();
    return res.json({ ok: true, config: doc || null });
  } catch (e) {
    console.error('[admin][recs] config get error', e);
    return res.status(500).json({ error: 'config get failed' });
  }
});

// PUT /admin/recs/config

// DELETE /admin/recs/config?widgetId=&scope=&scopeId=
app.delete('/admin/recs/config', authMiddleware, async (req, res) => {
  try {
    const widgetId = String(req.query.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const scope = String(req.query.scope || "global").trim();
    const scopeId = (req.query.scopeId != null && String(req.query.scopeId).trim() !== "") ? String(req.query.scopeId).trim() : null;
    if (!scope || !["global", "category", "product"].includes(scope)) return res.status(400).json({ error: "bad scope" });
    const r = await RecoConfig.deleteOne({ widgetId, scope, scopeId });
    return res.json({ ok: true, deleted: r?.deletedCount || 0 });
  } catch (e) {
    return res.status(500).json({ error: "config delete failed" });
  }
});

app.put('/admin/recs/config', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const widgetId = String(body.widgetId || RECO_WIDGET_DEFAULT).trim() || RECO_WIDGET_DEFAULT;
    const scope = String(body.scope || "global").trim();
    const scopeId = (body.scopeId != null && String(body.scopeId).trim() !== "") ? String(body.scopeId).trim() : null;

    if (!scope || !["global", "category", "product"].includes(scope)) return res.status(400).json({ error: "bad scope" });

    const set = {
      stableSlots: _recoClamp(body.stableSlots ?? 2, 0, 60),
      evolutionSlots: _recoClamp(body.evolutionSlots ?? 6, 0, 120),
      globalWinnerSlots: _recoClamp(body.globalWinnerSlots ?? 0, 0, 10),
      globalWinnersEnabled: !!body.globalWinnersEnabled,
      allowCrossCategoryGlobalWinners: !!body.allowCrossCategoryGlobalWinners,
      globalWinnerMinUnitsSold30d: _recoClamp(body.globalWinnerMinUnitsSold30d ?? 0, 0, 1000000),
      globalWinnerMinScore: _recoClamp(body.globalWinnerMinScore ?? 0, 0, 1000000),
      updatedBy: String(req.user?.sub || "admin").slice(0, 120)
    };

    // candidatePoolRules
    set.candidatePoolRules = {
      sameCategoryOnly: body.candidatePoolRules?.sameCategoryOnly !== false,
      allowedCategoryKeys: Array.isArray(body.candidatePoolRules?.allowedCategoryKeys)
        ? body.candidatePoolRules.allowedCategoryKeys.map(x => String(x || "").trim()).filter(Boolean).slice(0, 50)
        : [],
      maxPriceDeltaPct: (body.candidatePoolRules?.maxPriceDeltaPct != null && Number.isFinite(Number(body.candidatePoolRules.maxPriceDeltaPct)))
        ? Number(body.candidatePoolRules.maxPriceDeltaPct)
        : null
    };

    // exploration
    set.exploration = {
      mode: String(body.exploration?.mode || "thompson").toLowerCase() === "epsilon" ? "epsilon" : "thompson",
      epsilon: _recoClamp(body.exploration?.epsilon ?? 0.2, 0, 1),
      priorImpressions: _recoClamp(body.exploration?.priorImpressions ?? 20, 0, 1000),
      priorClicks: _recoClamp(body.exploration?.priorClicks ?? 1, 0, 1000),
      priorATC: _recoClamp(body.exploration?.priorATC ?? 1, 0, 1000)
    };


    // discount (optional)
    if (body.discount && typeof body.discount === "object") {
      set.discount = {
        enabled: !!body.discount.enabled,
        strategy: String(body.discount.strategy || "mixed"),
        minPct: _recoClamp(body.discount.minPct ?? 2, 0, 50),
        maxPct: _recoClamp(body.discount.maxPct ?? 5, 0, 80),
        randomChance: _recoClamp(body.discount.randomChance ?? 0.25, 0, 1),
        maxRandomPerBatch: _recoClamp(body.discount.maxRandomPerBatch ?? 1, 0, 50),
        maxItemsPerWidget: _recoClamp(body.discount.maxItemsPerWidget ?? 2, 0, 20),
        onlyEvolutionSlots: body.discount.onlyEvolutionSlots !== false,
        minImpressions: _recoClamp(body.discount.minImpressions ?? 80, 0, 100000),
        minCtr: _recoClamp(body.discount.minCtr ?? 0.03, 0, 1),
        maxAtcPerClick: _recoClamp(body.discount.maxAtcPerClick ?? 0.10, 0, 1),
        minMarginPct: _recoClamp(body.discount.minMarginPct ?? 0.20, 0, 0.99),
        ttlMinutes: _recoClamp(body.discount.ttlMinutes ?? 60, 1, 1440)
      };
    }


    // ui (carousel behavior / paging)
    const car = (body.ui && typeof body.ui === "object" && body.ui.carousel && typeof body.ui.carousel === "object") ? body.ui.carousel : {};
    set.ui = {
      carousel: {
        desktopVisible: _recoClamp(car.desktopVisible ?? 3, 1, 6),
        mobileVisible: _recoClamp(car.mobileVisible ?? 2, 1, 4),
        batchSizeDesktop: _recoClamp(car.batchSizeDesktop ?? (car.desktopVisible ?? 3), 1, 12),
        batchSizeMobile: _recoClamp(car.batchSizeMobile ?? (car.mobileVisible ?? 2), 1, 8),

        // device-specific caps
        maxBatchesDesktop: _recoClamp(car.maxBatchesDesktop ?? car.maxBatches ?? 10, 1, 50),
        maxBatchesMobile: _recoClamp(car.maxBatchesMobile ?? car.maxBatches ?? 6, 1, 50),
        maxItemsDesktop: _recoClamp(car.maxItemsDesktop ?? car.maxItems ?? 0, 0, 300),
        maxItemsMobile: _recoClamp(car.maxItemsMobile ?? car.maxItems ?? 0, 0, 300),

        // legacy mirrors (keep in sync for older clients)
        maxBatches: _recoClamp(car.maxBatches ?? car.maxBatchesDesktop ?? 10, 1, 50),
        maxItems: _recoClamp(car.maxItems ?? car.maxItemsDesktop ?? 0, 0, 300),

        // paging hints
        prefetchThresholdDesktop: _recoClamp(car.prefetchThresholdDesktop ?? 6, 0, 50),
        prefetchThresholdMobile: _recoClamp(car.prefetchThresholdMobile ?? 3, 0, 50),
        appendCountDesktop: _recoClamp(car.appendCountDesktop ?? (car.batchSizeDesktop ?? car.desktopVisible ?? 3), 1, 30),
        appendCountMobile: _recoClamp(car.appendCountMobile ?? (car.mobileVisible ?? 2), 1, 30),

        swipeSmallPx: _recoClamp(car.swipeSmallPx ?? 35, 5, 200),
        swipeBigPx: _recoClamp(car.swipeBigPx ?? 120, 20, 400),
        tokenTtlMinutes: _recoClamp(car.tokenTtlMinutes ?? 60, 5, 1440)
      }
    };

    const doc = await RecoConfig.findOneAndUpdate(
      { widgetId, scope, scopeId },
      { $set: set, $setOnInsert: { widgetId, scope, scopeId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    await RecoAdminAction.create({ widgetId, action: "config_upsert", actor: String(req.user?.sub || "admin"), payload: doc });

    return res.json({ ok: true, config: doc });
  } catch (e) {
    console.error('[admin][recs] config put error', e);
    return res.status(500).json({ error: 'config put failed' });
  }
});

// ===== Admin: cart incentives config =====
app.get('/admin/incentives/config', authMiddleware, async (req, res) => {
  try {
    await refreshIncentivesRuntime({ force: true });
    const doc = await IncentivesConfig.findOne({ key: "global" }).lean();
    return res.json({ ok: true, config: doc || null, runtime: getIncentivesRuntimeSync() });
  } catch (e) {
    console.error('[admin][incentives] get error', e);
    return res.status(500).json({ error: 'incentives config get failed' });
  }
});

app.put('/admin/incentives/config', authMiddleware, async (req, res) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const normalized = _normalizeIncentivesConfig(body);
    normalized.updatedBy = String(req.user?.sub || "admin").slice(0, 120);

    const doc = await IncentivesConfig.findOneAndUpdate(
      { key: "global" },
      { $set: { ...normalized, key: "global" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    __INCENTIVES_RUNTIME = _normalizeIncentivesConfig(doc || normalized);
    __INCENTIVES_RUNTIME_AT = Date.now();

    return res.json({ ok: true, config: doc, runtime: __INCENTIVES_RUNTIME });
  } catch (e) {
    console.error('[admin][incentives] put error', e);
    return res.status(500).json({ error: 'incentives config save failed' });
  }
});

app.delete('/admin/incentives/config', authMiddleware, async (req, res) => {
  try {
    await IncentivesConfig.deleteOne({ key: "global" });
    __INCENTIVES_RUNTIME = _buildIncentivesFromEnv();
    __INCENTIVES_RUNTIME_AT = Date.now();
    return res.json({ ok: true, runtime: __INCENTIVES_RUNTIME });
  } catch (e) {
    console.error('[admin][incentives] delete error', e);
    return res.status(500).json({ error: 'incentives config delete failed' });
  }
});


// ===== Admin: profit configuration + analytics =====
function _normalizeProfitConfig(body) {
  const b = (body && typeof body === "object") ? body : {};
  const out = {
    enabled: !!(b.enabled ?? true),
    fees: {
      pct: Math.max(0, Math.min(0.2, Number(b?.fees?.pct ?? 0.029) || 0.029)),
      fixedEUR: Math.max(0, Math.min(10, Number(b?.fees?.fixedEUR ?? 0.30) || 0.30))
    },
    avgShippingCostEUR: Math.max(0, Math.min(200, Number(b.avgShippingCostEUR ?? 3.50) || 3.50)),
    minOrderMarginPct: Math.max(0, Math.min(0.9, Number(b.minOrderMarginPct ?? 0.18) || 0.18)),
    minOrderContributionEUR: Number(b.minOrderContributionEUR ?? 2.0),
    refundPenaltyWeight: Math.max(0, Math.min(10, Number(b.refundPenaltyWeight ?? 0.8) || 0.8)),
    fraud: {
      enabled: !!(b?.fraud?.enabled ?? true),
      maxPaymentIntentsPerIPPerHour: Math.max(1, Math.min(5000, Number(b?.fraud?.maxPaymentIntentsPerIPPerHour ?? 20) || 20)),
      maxFinalizePerIPPerHour: Math.max(1, Math.min(5000, Number(b?.fraud?.maxFinalizePerIPPerHour ?? 30) || 30))
    }
  };
  return out;
}

app.get('/admin/profit/config', authMiddleware, async (req, res) => {
  try {
    await getProfitConfigRuntime();
    const doc = await ProfitConfig.findOne({ key: "global" }).lean();
    return res.json({ ok: true, config: doc || null, runtime: _profitCfgCache.cfg || null });
  } catch (e) {
    console.error('[admin][profit] get error', e);
    return res.status(500).json({ error: 'profit config get failed' });
  }
});

app.put('/admin/profit/config', authMiddleware, async (req, res) => {
  try {
    const normalized = _normalizeProfitConfig(req.body || {});
    normalized.updatedBy = String(req.user?.sub || "admin").slice(0, 120);

    const doc = await ProfitConfig.findOneAndUpdate(
      { key: "global" },
      { $set: { ...normalized, key: "global" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    _profitCfgCache = { at: Date.now(), cfg: { ...(_profitCfgCache.cfg || {}), ...doc, fees: doc.fees, fraud: doc.fraud } };
    return res.json({ ok: true, config: doc, runtime: _profitCfgCache.cfg });
  } catch (e) {
    console.error('[admin][profit] put error', e);
    return res.status(500).json({ error: 'profit config save failed' });
  }
});

app.delete('/admin/profit/config', authMiddleware, async (req, res) => {
  try {
    await ProfitConfig.deleteOne({ key: "global" });
    _profitCfgCache = { at: 0, cfg: null };
    await getProfitConfigRuntime();
    return res.json({ ok: true, runtime: _profitCfgCache.cfg });
  } catch (e) {
    console.error('[admin][profit] delete error', e);
    return res.status(500).json({ error: 'profit config delete failed' });
  }
});

// Profit report: per-product contribution, refund rate, alerts
app.get('/admin/profit/report', authMiddleware, async (req, res) => {
  try {
    const limit = Math.max(50, Math.min(2000, Number(req.query.limit || 500) || 500));
    const sort = String(req.query.sort || "contribution").toLowerCase();

    const stats = await ProductProfitStats.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
    const cfg = await getProfitConfigRuntime();

    const products = await Product.find({}).select({ productId: 1, name: 1, price: 1, expectedPurchasePrice: 1, productLink: 1 }).lean();
    const byPid = new Map();
    for (const p of (products || [])) byPid.set(String(p.productId || ""), p);

    const rows = (stats || []).map(s => {
      const pid = String(s.productId || s.key || "");
      const p = byPid.get(pid) || null;
      const price = Number(p?.price || 0) || 0;
      const cost = Number(p?.expectedPurchasePrice || 0) || 0;
      const estMarginPct = price > 0 ? Math.max(-1, Math.min(1, (price - cost) / price)) : 0;

      const soldRev = Number(s.soldRevenueEUR || 0) || 0;
      const soldCost = Number(s.soldCostEUR || 0) || 0;
      const fees = _estimateProcessorFeesEUR(soldRev, cfg);
      const ship = Number(cfg?.avgShippingCostEUR || 0) || 0;
      const contribution = round2(soldRev - soldCost - fees - ship);

      const soldQty = Number(s.soldQty || 0) || 0;
      const refundedQty = Number(s.refundedQty || 0) || 0;
      const refundRate = soldQty > 0 ? round2(refundedQty / soldQty) : 0;

      const lossLeader = (soldQty >= 3 && contribution < 0) || (price > 0 && estMarginPct < 0.05);
      return {
        key: s.key,
        productId: s.productId || "",
        name: p?.name || s.name || "",
        price,
        expectedPurchasePrice: cost,
        estMarginPct: round2(estMarginPct),
        soldQty,
        soldRevenueEUR: round2(soldRev),
        refundedQty,
        refundRate,
        contributionEUR: contribution,
        lossLeader: !!lossLeader,
        updatedAt: s.updatedAt
      };
    });

    if (sort === "refund") rows.sort((a, b) => (b.refundRate - a.refundRate));
    else if (sort === "sold") rows.sort((a, b) => (b.soldQty - a.soldQty));
    else rows.sort((a, b) => (b.contributionEUR - a.contributionEUR));

    return res.json({ ok: true, cfg, rows });
  } catch (e) {
    console.error('[admin][profit] report error', e);
    return res.status(500).json({ error: 'profit report failed' });
  }
});


// ---- Auth ----
function requireAdminCode(req) {
  if (!ADMIN_CODE) return true; // no code enforced
  const hdr = req.get('X-Admin-Code') || '';
  return hdr && hdr === ADMIN_CODE;
}

function agentWebhookAuth(req, res, next) {
  const secret = process.env.AGENT_WEBHOOK_SECRET;
  if (secret) {
    const got = String(req.headers["x-webhook-secret"] || req.headers["x-agent-webhook-secret"] || "").trim();
    if (!got || got !== secret) return res.status(401).json({ error: "invalid webhook secret" });
    return next();
  }
  // If no webhook secret is configured, fall back to admin auth (so you can test locally),
  // but strongly recommend setting AGENT_WEBHOOK_SECRET in production.
  return authMiddleware(req, res, next);
}

function authMiddleware(req, res, next) {
  if (!requireAdminCode(req)) return res.status(401).json({ error: 'Missing or invalid admin code' });
  const hdr = req.get('Authorization') || '';
  const m = hdr.match(/^Bearer (.+)$/i);
  if (!m) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(m[1], JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  return authMiddleware(req, res, () => {
    // Back-compat: if role is missing, treat as admin.
    const role = req.user && typeof req.user === "object" ? String(req.user.role || "").trim().toLowerCase() : "";
    if (!role || role === "admin") return next();
    return res.status(403).json({ error: "Forbidden" });
  });
}

// Register split-out routes (registered later once models are available)


// POST /admin/login
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password, adminCode } = req.body || {};
    if (ADMIN_CODE && adminCode !== ADMIN_CODE) {
      return res.status(401).json({ error: 'Bad admin code' });
    }
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const expiresIn = 3600; // seconds
    const token = jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn });
    return res.json({ token, expiresIn });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'login failed' });
  }
});

// ---- Admin APIs ----

// GET /admin/orders?from=ISO&to=ISO&limit=1000
app.get('/admin/orders', authMiddleware, async (req, res) => {
  try {
    const { from, to, limit = 1000, includeUnpaid, status } = req.query;

    const q = {};

    // Default behavior: show only PAID/finalized orders (paidAt set).
    // This prevents showing "checkout drafts" or unpaid attempts as real orders.
    const includeAll = String(includeUnpaid || '').toLowerCase() === 'true' || String(includeUnpaid || '') === '1';
    if (!includeAll) {
      q.paidAt = { $ne: null };
    }

    // Optional explicit status filter (comma-separated)
    if (status) {
      const arr = String(status)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 25);
      if (arr.length) q.status = { $in: arr };
    }

    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    const lim = Math.max(1, Math.min(5000, Number(limit)));
    const rows = await Order.find(q).sort({ createdAt: -1 }).limit(lim).lean();
    return res.json(rows.map(r => ({
      ...r,
      id: r.orderId || r._id
    })));
  } catch (e) {
    console.error('orders list error', e);
    return res.status(500).json({ error: 'list failed' });
  }
});
app.get("/payment-intent-status/:paymentIntentId", paymentStatusLimiter, async (req, res) => {
  try {
    const id = String(req.params.paymentIntentId || "").trim();
    if (!id.startsWith("pi_")) return res.status(400).json({ error: "Invalid paymentIntentId" });

    const clientSecret = String(req.query.clientSecret || "").trim();
    // Require clientSecret to prevent leaking status of arbitrary PaymentIntents
    if (!clientSecret || !clientSecret.includes("_secret_")) {
      return res.status(400).json({ error: "clientSecret is required" });
    }

    const stripeClient = initStripe();
    if (!stripeClient) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });

    const pi = await stripeClient.paymentIntents.retrieve(id);

    const serverSecret = String(pi?.client_secret || "");
    if (!serverSecret) {
      return res.status(500).json({ error: "client_secret missing on PaymentIntent" });
    }

    const a = Buffer.from(serverSecret, "utf8");
    const b = Buffer.from(clientSecret, "utf8");
    const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);

    if (!ok) return res.status(401).json({ error: "Unauthorized" });

    return res.json({
      id: pi.id,
      status: pi.status,
      amount: pi.amount,
      currency: pi.currency
    });
  } catch (err) {
    console.error("payment-intent-status error:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch payment status" });
  }
});


// Resolve finalized orderId from a PaymentIntent after success.
// Requires clientSecret to avoid leaking cross-customer information.
app.get("/order-by-payment-intent/:paymentIntentId", paymentStatusLimiter, async (req, res) => {
  try {
    const id = String(req.params.paymentIntentId || "").trim();
    if (!id.startsWith("pi_")) return res.status(400).json({ error: "Invalid paymentIntentId" });

    const clientSecret = String(req.query.clientSecret || "").trim();
    if (!clientSecret || !clientSecret.includes("_secret_")) {
      return res.status(400).json({ error: "clientSecret is required" });
    }

    const stripeClient = initStripe();
    if (!stripeClient) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });

    const pi = await stripeClient.paymentIntents.retrieve(id);

    const serverSecret = String(pi?.client_secret || "");
    if (!serverSecret) {
      return res.status(500).json({ error: "client_secret missing on PaymentIntent" });
    }

    const a = Buffer.from(serverSecret, "utf8");
    const b = Buffer.from(clientSecret, "utf8");
    const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);
    if (!ok) return res.status(401).json({ error: "Unauthorized" });

    const order = await Order.findOne({ "stripe.paymentIntentId": id }).lean();
    if (order && order.orderId) {
      return res.json({ ok: true, orderId: order.orderId, status: order.status || null });
    }

    // Still pending: either webhook not processed yet, or the checkout draft exists.
    const draft = await DraftOrder.findOne({ "stripe.paymentIntentId": id }).lean();
    if (draft) {
      return res.status(202).json({ ok: false, pending: true, status: draft.status || "CHECKOUT" });
    }

    return res.status(404).json({ ok: false, error: "Not found" });
  } catch (err) {
    console.error("order-by-payment-intent error:", err?.message || err);
    return res.status(500).json({ error: "Failed to resolve order" });
  }
});
function coerceOptionsFromBody(body) {
  const src = body || {};

  const parseMaybeJson = (v) => {
    if (typeof v !== "string") return v;
    const s = v.trim();
    if (!s) return v;
    if (!(s.startsWith("{") || s.startsWith("["))) return v;
    try { return JSON.parse(s); } catch { return v; }
  };

  const normalizeOptionGroups = (raw) => {
    const v = parseMaybeJson(raw);

    // Preferred format:
    // [{ key, label, options: [...] , imageByOption? }]
    if (Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && !Array.isArray(v[0])) {
      const out = [];
      for (const g of v.slice(0, 10)) {
        const label = String(g?.label ?? g?.name ?? "").trim().replace(/:$/, "");
        const opts = Array.isArray(g?.options) ? g.options : [];
        const options = opts.map(x => String(x ?? "").trim()).filter(Boolean).slice(0, 200);
        if (!label || !options.length) continue;

        const keyBase = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_\-]/g, "");
        const key = String(g?.key ?? keyBase ?? `opt${out.length + 1}`).trim().slice(0, 64) || `opt${out.length + 1}`;

        const imageByOption =
          g?.imageByOption && typeof g.imageByOption === "object" && !Array.isArray(g.imageByOption)
            ? g.imageByOption
            : undefined;

        out.push({
          key,
          label,
          options,
          ...(imageByOption ? { imageByOption } : {})
        });
      }
      return out;
    }

    // Legacy single-group format:
    // ["Color:", "Red", "Blue"]
    if (Array.isArray(v) && (v.length === 0 || typeof v[0] === "string")) {
      const arr = v.map(x => String(x ?? "").trim()).filter(Boolean);
      if (arr.length < 2) return [];
      const label = String(arr[0] || "Option").replace(/:$/, "").trim();
      const options = arr.slice(1);
      return [{ key: label.toLowerCase().replace(/\s+/g, "_"), label, options }];
    }

    // Legacy multi-group format:
    // [["Color", "Red", "Blue"], ["Size", "S", "M"]]
    if (Array.isArray(v) && v.length && Array.isArray(v[0])) {
      const out = [];
      for (const a of v.slice(0, 10)) {
        const arr = Array.isArray(a) ? a : [];
        const [labelRaw, ...optsRaw] = arr;
        const label = String(labelRaw ?? "Option").trim().replace(/:$/, "");
        const options = optsRaw.map(x => String(x ?? "").trim()).filter(Boolean).slice(0, 200);
        if (!label || !options.length) continue;
        out.push({ key: label.toLowerCase().replace(/\s+/g, "_"), label, options });
      }
      return out;
    }

    return [];
  };

  const normalizeLegacyProductOptions = (raw) => {
    const v = parseMaybeJson(raw);
    if (v == null) return null;
    if (!Array.isArray(v)) return null;

    const arr = v.map(x => String(x ?? "").trim()).filter(Boolean).slice(0, 300);
    return arr;
  };

  const hasOptionGroups = Object.prototype.hasOwnProperty.call(src, "optionGroups");
  const hasProductOptions = Object.prototype.hasOwnProperty.call(src, "productOptions");

  let optionGroups = undefined;
  let productOptions = undefined;

  if (hasOptionGroups) {
    if (src.optionGroups === null) optionGroups = null;
    else optionGroups = normalizeOptionGroups(src.optionGroups);
  }

  if (hasProductOptions) {
    if (src.productOptions === null) productOptions = null;
    else productOptions = normalizeLegacyProductOptions(src.productOptions);
  }

  // If only optionGroups were sent, derive legacy productOptions from first group
  if (hasOptionGroups && !hasProductOptions && optionGroups !== null) {
    const g = Array.isArray(optionGroups) ? optionGroups[0] : null;
    if (g && typeof g === "object") {
      const labelRaw = String(g.label ?? g.name ?? "Option").trim().replace(/:$/, "");
      const label = labelRaw ? `${labelRaw}:` : "Option:";
      const opts = Array.isArray(g.options) ? g.options.map(x => String(x ?? "").trim()).filter(Boolean) : [];
      productOptions = opts.length ? [label, ...opts] : [];
    } else {
      productOptions = [];
    }
  }

  // If only productOptions were sent, derive one optionGroups entry
  if (hasProductOptions && !hasOptionGroups && productOptions !== null) {
    const arr = Array.isArray(productOptions) ? productOptions : [];
    if (arr.length >= 2) {
      const label = String(arr[0] || "Option").replace(/:$/, "").trim();
      const options = arr.slice(1).map(x => String(x ?? "").trim()).filter(Boolean);
      optionGroups = label && options.length
        ? [{ key: label.toLowerCase().replace(/\s+/g, "_"), label, options }]
        : [];
    } else {
      optionGroups = [];
    }
  }

  return { optionGroups, productOptions };
}


// Fallback finalization endpoint (useful in dev/test if webhook delivery is delayed).
// Creates a real Order from the DraftOrder only if Stripe confirms PI is succeeded.
app.post("/finalize-order", paymentStatusLimiter, async (req, res) => {
  try {
    const { paymentIntentId, clientSecret, checkoutId, token } = req.body || {};
    const { draftId, free } = req.body || {};
    const isFree = (free === true || free === "true");
    const did = String(draftId || checkoutId || "").trim();

    if (isFree) {
      if (!did) return res.status(400).json({ error: "draftId is required" });

      const fraud = await _fraudCheck(req, "finalize");
      if (!fraud.ok) return res.status(429).json({ error: fraud.code || "FRAUD_VELOCITY" });

      const draft = await DraftOrder.findById(did);
      if (!draft) return res.status(404).json({ error: "DRAFT_NOT_FOUND" });

      // Validate public token (required)
      const t = String(token || "").trim();
      if (!t) return res.status(401).json({ error: "INVALID_TOKEN" });
      const th = publicTokenHash(t);
      if (!draft?.public?.tokenHash || th !== String(draft.public.tokenHash)) {
        return res.status(401).json({ error: "INVALID_TOKEN" });
      }
      const totalPaid = Number(draft?.pricing?.totalPaidEUR ?? draft?.pricing?.totalPaid ?? 0);
      if (!Number.isFinite(totalPaid) || totalPaid !== 0) {
        return res.status(400).json({ error: "NOT_FREE_ORDER" });
      }

      // Idempotency: if an orderId was already assigned, return it
      if (draft.orderId) {
        return res.json({ ok: true, orderId: String(draft.orderId) });
      }

      const newOrderId = `ORD_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const order = await Order.create({
        orderId: newOrderId,
        status: "PAID",
        websiteOrigin: draft.websiteOrigin || "",
        customer: draft.customer || {},
        items: draft.items || [],
        pricing: draft.pricing || {},
        accounting: draft.accounting || {},
        stripe: { paymentIntentId: null, free: true },
        paidAt: new Date()
      });

      draft.status = "COMPLETE";
      draft.orderId = newOrderId;
      draft.completedAt = new Date();
      await draft.save();

      if (!order.emailSentAt) {
        try {
          await _sendOrderEmailWithCooldown({ order, field: 'emailSentAt', type: 'confirmation', sender: sendConfirmationEmail });
        } catch (e) {
          console.warn("⚠️ sendConfirmationEmail after finalize-order free failed:", e?.message || e);
        }
      }

      return res.json({ ok: true, orderId: order.orderId, free: true });
    }

    const piid = String(paymentIntentId || "").trim();
    if (!piid.startsWith("pi_")) return res.status(400).json({ error: "Invalid paymentIntentId" });

    const fraud = await _fraudCheck(req, "finalize");
    if (!fraud.ok) {
      return res.status(429).json({ error: fraud.code || "FRAUD_VELOCITY" });
    }

    const cs = String(clientSecret || "").trim();
    if (!cs || !cs.includes("_secret_")) return res.status(400).json({ error: "clientSecret is required" });

    // Verify PI secret
    const stripeClient = initStripe();
    if (!stripeClient) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });

    const pi = await stripeClient.paymentIntents.retrieve(piid);
    const serverSecret = String(pi?.client_secret || "");
    if (!serverSecret) return res.status(500).json({ error: "client_secret missing on PaymentIntent" });
    const a = Buffer.from(serverSecret, "utf8");
    const b = Buffer.from(cs, "utf8");
    const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);
    if (!ok) return res.status(401).json({ error: "Unauthorized" });

    // If already finalized, return it
    const existing = await Order.findOne({ "stripe.paymentIntentId": piid }).lean();
    if (existing?.orderId) return res.json({ ok: true, orderId: existing.orderId, status: existing.status || null });

    if (String(pi.status || "") !== "succeeded") {
      return res.status(409).json({ ok: false, error: "PAYMENT_NOT_SUCCEEDED", status: pi.status || null });
    }

    // Find draft (by checkoutId or by PI id)
    let draft = null;
    const cid = checkoutId ? String(checkoutId).trim() : "";
    if (cid && mongoose.Types.ObjectId.isValid(cid)) {
      draft = await DraftOrder.findById(cid);
      if (draft) {
        const providedToken = String(token || "").trim();
        if (!providedToken) return res.status(401).json({ error: "Unauthorized" });
        const hash = publicTokenHash(providedToken);
        const stored = draft.public?.tokenHash || "";
        if (!stored || !timingSafeEqualHex(hash, stored)) {
          return res.status(401).json({ error: "Unauthorized" });
        }
      }
    }
    if (!draft) {
      draft = await DraftOrder.findOne({ "stripe.paymentIntentId": piid });
    }
    if (!draft) return res.status(404).json({ error: "CHECKOUT_NOT_FOUND" });
    // Validate country used for tariff against Stripe shipping/billing country (best-effort).
    // Prevents client-side country spoofing from affecting tariff totals.
    try {
      const normCC2 = (v) => (v ? String(v).trim().toUpperCase() : "");
      const draftCC = normCC2(draft?.customer?.countryCode || draft?.accounting?.customerCountryCode || "");
      let stripeCC = normCC2(pi?.shipping?.address?.country || "");

      if (!stripeCC && pi?.latest_charge) {
        try {
          const ch = await stripeClient.charges.retrieve(String(pi.latest_charge));
          stripeCC = normCC2(ch?.shipping?.address?.country || ch?.billing_details?.address?.country || "");
        } catch { }
      }

      if (draftCC && stripeCC && draftCC !== stripeCC) {
        // Persist the observed Stripe country for ops visibility
        try {
          draft.accounting = draft.accounting || {};
          draft.accounting.stripeCountryCode = stripeCC;
          await draft.save();
        } catch { }
        return res.status(409).json({
          ok: false,
          error: "COUNTRY_MISMATCH",
          message: "Shipping country mismatch. Please refresh and try again.",
          draftCountryCode: draftCC,
          stripeCountryCode: stripeCC
        });
      }

      if (stripeCC) {
        try {
          draft.accounting = draft.accounting || {};
          draft.accounting.stripeCountryCode = stripeCC;
          await draft.save();
        } catch { }
      }
    } catch { }


    const newOrderId = `ORD_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const order = await Order.create({
      orderId: newOrderId,
      status: "PAID",
      websiteOrigin: draft.websiteOrigin || "",
      customer: draft.customer || {},
      items: draft.items || [],
      pricing: draft.pricing || {},
      fulfillment: {},
      stripe: {
        ...(draft.stripe || {}),
        paymentIntentId: piid,
        currency: (draft.pricing?.currency || (pi.currency ? String(pi.currency).toUpperCase() : "EUR"))
      },
      paidAt: new Date(),
      emailSentAt: null,
      shippedEmailSentAt: null,
      expiresAt: undefined,
      public: draft.public || {},
      operator: {
        procurementStatus: "TO_ORDER",
        shipping: { aliExpress: 0, thirdParty1: 0, thirdParty2: 0 }
      },
      accounting: draft.accounting || {},
      createdAt: draft.createdAt || new Date(),
      updatedAt: new Date(),
      notes: [],
      statusHistory: [{ at: new Date(), from: "CHECKOUT", to: "PAID", by: "finalize-order", note: "payment_intent.succeeded" }]
    });

    try { await ensureInvoiceNumber(order); } catch (e) { console.warn("[invoice] assign failed:", e?.message || e); }
    try { await enrichStripeFeesIfMissing(order); } catch { }
    await order.save();
    try { await updateProductProfitStatsFromOrder(order, { isRefund: false }); } catch { }

    if (!order.emailSentAt) {
      try {
        await _sendOrderEmailWithCooldown({ order, field: 'emailSentAt', type: 'confirmation', sender: sendConfirmationEmail });
      } catch (e) {
        console.warn("⚠️ sendConfirmationEmail after finalize-order failed:", e?.message || e);
      }
    }

    // Cleanup draft
    try { await DraftOrder.deleteOne({ _id: draft._id }); } catch { }

    return res.json({ ok: true, orderId: order.orderId, status: order.status });
  } catch (err) {
    console.error("finalize-order error:", err?.message || err);
    return res.status(500).json({ error: "Failed to finalize order" });
  }
});

// GET /order-status/:orderId?token=...
// Public, token-protected order status for customers (minimal fields).
app.get("/order-status/:orderId", paymentStatusLimiter, async (req, res) => {
  try {
    const orderId = String(req.params.orderId || "").trim();
    const token = String(req.query.token || "").trim();

    if (!orderId || !token) {
      return res.status(400).json({ error: "Missing orderId or token" });
    }

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: "Not found" });

    const hash = publicTokenHash(token);
    const stored = order.public?.tokenHash || "";
    if (!stored || !timingSafeEqualHex(hash, stored)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.json({
      ok: true,
      orderId: order.orderId,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      procurementStatus: order.operator?.procurementStatus || null,
      deliveredAt: order.operator?.deliveredAt || null,
      tracking: Array.isArray(order.operator?.tracking) ? order.operator.tracking : [],
      items: (order.items || []).map(it => ({
        name: it.name,
        quantity: it.quantity,
        selectedOption: it.selectedOption || "",
        selectedOptions: Array.isArray(it.selectedOptions) ? it.selectedOptions : []
      }))
    });
  } catch (err) {
    console.error("order-status error:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch order status" });
  }
});

// PATCH /admin/orders/:id
// Supports:
//  - status, pricing.note/currency/totalPaidEUR, emailSentAt
//  - operator: procurement + shipping + supplier fields + tracking
//  - costs: internal costs (shipping/other)
//  - accounting: vatScheme/customerCountryCode/invoiceNumber
//  - itemsPatch: [{ index, expectedPurchase, actualPurchaseEUR, supplierLink, supplierSku }]
//  - note: append to notes[]
app.patch('/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const parsedPatch = OrderPatchSchema.safeParse(payload);
    if (!parsedPatch.success) return zodBadRequest(res, parsedPatch, "Invalid order patch payload");

    const order = await Order.findOne(buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Not found' });

    const prevStatus = order.status;

    // status (financial / high-level)
    if (payload.status != null) {
      order.status = String(payload.status);
    }

    // pricing
    if (payload.pricing && typeof payload.pricing === 'object') {
      order.pricing = order.pricing || {};
      if (payload.pricing.note != null) order.pricing.note = String(payload.pricing.note);

      // Strict: prevent accidental corruption of paid totals / currency from admin UI.
      // Enable only for emergency manual corrections.
      const allowFinancialOverrides = String(process.env.ADMIN_ALLOW_FINANCIAL_OVERRIDES || "").toLowerCase();
      const allow = (allowFinancialOverrides === "1" || allowFinancialOverrides === "true" || allowFinancialOverrides === "yes");

      if (allow) {
        if (payload.pricing.currency != null) order.pricing.currency = String(payload.pricing.currency);
        if (payload.pricing.totalPaidEUR != null) order.pricing.totalPaidEUR = Number(payload.pricing.totalPaidEUR) || 0;
      }
    }

    // operator (procurement / internal)
    if (payload.operator && typeof payload.operator === "object") {
      order.operator = order.operator || {};
      if (payload.operator.procurementStatus != null) {
        const s = String(payload.operator.procurementStatus);
        if (PROCUREMENT_STATUSES.includes(s)) order.operator.procurementStatus = s;
      }
      if (payload.operator.supplierProvider != null) order.operator.supplierProvider = String(payload.operator.supplierProvider).slice(0, 120);
      if (payload.operator.supplierOrderId != null) order.operator.supplierOrderId = String(payload.operator.supplierOrderId).slice(0, 200);
      if (payload.operator.purchasedAt !== undefined) order.operator.purchasedAt = payload.operator.purchasedAt ? new Date(payload.operator.purchasedAt) : null;
      if (payload.operator.supplierCostEUR !== undefined) {
        const v = payload.operator.supplierCostEUR;
        order.operator.supplierCostEUR = (v === null || v === "") ? null : (Number(v) || 0);
      }
      if (payload.operator.internalNote != null) order.operator.internalNote = String(payload.operator.internalNote).slice(0, 2000);
      if (payload.operator.deliveredAt !== undefined) order.operator.deliveredAt = payload.operator.deliveredAt ? new Date(payload.operator.deliveredAt) : null;
      if (payload.operator.doneAt !== undefined) order.operator.doneAt = payload.operator.doneAt ? new Date(payload.operator.doneAt) : null;

      if (payload.operator.shipping && typeof payload.operator.shipping === "object") {
        order.operator.shipping = order.operator.shipping || {};
        for (const k of ["aliExpress", "thirdParty1", "thirdParty2"]) {
          if (payload.operator.shipping[k] != null) {
            order.operator.shipping[k] = Number(payload.operator.shipping[k]) || 0;
          }
        }
      }

      if (Array.isArray(payload.operator.tracking)) {
        order.operator.tracking = payload.operator.tracking.slice(0, 20).map(t => ({
          code: String(t?.code || "").slice(0, 120),
          carrier: String(t?.carrier || "").slice(0, 120),
          url: String(t?.url || "").slice(0, 500),
          addedAt: t?.addedAt ? new Date(t.addedAt) : new Date()
        }));
      }
    }

    // costs (internal accounting)
    if (payload.costs && typeof payload.costs === "object") {
      order.costs = order.costs || {};
      if (payload.costs.shippingCostEUR !== undefined) order.costs.shippingCostEUR = payload.costs.shippingCostEUR === null ? null : (Number(payload.costs.shippingCostEUR) || 0);
      if (payload.costs.otherCostEUR !== undefined) order.costs.otherCostEUR = payload.costs.otherCostEUR === null ? null : (Number(payload.costs.otherCostEUR) || 0);
    }

    // accounting
    if (payload.accounting && typeof payload.accounting === "object") {
      order.accounting = order.accounting || {};
      if (payload.accounting.vatScheme != null) order.accounting.vatScheme = String(payload.accounting.vatScheme).slice(0, 40);
      if (payload.accounting.customerCountryCode != null) order.accounting.customerCountryCode = String(payload.accounting.customerCountryCode).slice(0, 2).toUpperCase();
      if (payload.accounting.invoiceNumber != null) order.accounting.invoiceNumber = String(payload.accounting.invoiceNumber).slice(0, 64);
    }

    if (payload.emailSentAt) order.emailSentAt = new Date(payload.emailSentAt);

    // items patch
    if (Array.isArray(payload.itemsPatch)) {
      for (const p of payload.itemsPatch.slice(0, 200)) {
        const idx = Number(p?.index);
        if (!Number.isInteger(idx) || idx < 0 || idx >= (order.items || []).length) continue;
        const it = order.items[idx];
        if (p.expectedPurchase !== undefined) it.expectedPurchase = Number(p.expectedPurchase) || 0;
        if (p.actualPurchaseEUR !== undefined) it.actualPurchaseEUR = (p.actualPurchaseEUR === null || p.actualPurchaseEUR === "") ? null : (Number(p.actualPurchaseEUR) || 0);
        if (p.supplierLink !== undefined) it.supplierLink = String(p.supplierLink || "").slice(0, 500);
        if (p.supplierSku !== undefined) it.supplierSku = String(p.supplierSku || "").slice(0, 120);
      }
    }

    // note append
    if (payload.note != null) {
      addNote(order, payload.note, req.user?.sub || "admin");
    }

    // status history
    if (prevStatus !== order.status) {
      addStatusHistory(order, prevStatus, order.status, req.user?.sub || "admin", "admin patch");
    }

    // If marking delivered, set deliveredAt automatically when missing
    if (order.operator?.procurementStatus === "DELIVERED" && !order.operator.deliveredAt) {
      order.operator.deliveredAt = new Date();
    }
    if (order.operator?.procurementStatus !== "DELIVERED") {
      // keep deliveredAt for history, but allow user to clear it explicitly via operator.deliveredAt
    }

    // Ensure invoice number if already paid and missing
    if ((order.status === "PAID" || order.paidAt) && (!order.accounting || !order.accounting.invoiceNumber)) {
      try { await ensureInvoiceNumber(order); } catch { }
    }

    await order.save();

    return res.json({ ok: true, order: { ...order.toObject(), id: order.orderId || order._id } });
  } catch (e) {
    console.error('patch error', e);
    return res.status(500).json({ error: 'patch failed' });
  }
});

// POST /admin/orders/bulk
// Body: { ids: [orderId...], patch: { ...same as PATCH payload... } }
app.post('/admin/orders/bulk', authMiddleware, async (req, res) => {
  try {
    const parsedBulk = z.object({
      ids: z.array(z.string().min(1).max(128)).max(200),
      patch: OrderPatchSchema
    }).passthrough().safeParse(req.body || {});
    if (!parsedBulk.success) return zodBadRequest(res, parsedBulk, "Invalid bulk patch payload");

    const ids = parsedBulk.data.ids || [];
    const patch = parsedBulk.data.patch || {};
    const out = [];
    for (const id of ids.slice(0, 200)) {
      const order = await Order.findOne(buildOrderLookup(id));
      if (!order) continue;
      // reuse handler logic by faking req/res? Keep it simple: apply subset
      const prevStatus = order.status;

      if (patch.status != null) order.status = String(patch.status);
      if (patch.operator && typeof patch.operator === "object") {
        order.operator = order.operator || {};
        if (patch.operator.procurementStatus != null) {
          const s = String(patch.operator.procurementStatus);
          if (PROCUREMENT_STATUSES.includes(s)) order.operator.procurementStatus = s;
        }
      }
      if (patch.operator.doneAt !== undefined) order.operator.doneAt = patch.operator.doneAt ? new Date(patch.operator.doneAt) : null;
      if (prevStatus !== order.status) addStatusHistory(order, prevStatus, order.status, req.user?.sub || "admin", "bulk patch");
      if (patch.note != null) addNote(order, patch.note, req.user?.sub || "admin");
      await order.save();
      out.push(order.orderId);
    }
    return res.json({ ok: true, updated: out });
  } catch (e) {
    console.error('bulk patch error', e);
    return res.status(500).json({ error: 'bulk patch failed' });
  }
});

// POST /admin/orders/:id/note
app.post('/admin/orders/:id/note', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Missing text" });
    const order = await Order.findOne(buildOrderLookup(id));
    if (!order) return res.status(404).json({ error: 'Not found' });
    addNote(order, text, req.user?.sub || "admin");
    await order.save();
    return res.json({ ok: true });
  } catch (e) {
    console.error('note error', e);
    return res.status(500).json({ error: 'note failed' });
  }
});

// Mailer (optional)
function buildTransport() {
  // Prefer explicit SMTP_* config (e.g., custom provider)
  if (SMTP_HOST) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: String(SMTP_SECURE).toLowerCase() === 'true',
      auth: (SMTP_USER && SMTP_PASS) ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      connectionTimeout: 10000
    });
  }

  // Fallback: Gmail "shop" account (SHOP_EMAIL / SHOP_EMAIL_PASSWORD)
  const user = String(process.env.SHOP_EMAIL || process.env.STORE_EMAIL || "").trim();
  const pass = String(process.env.SHOP_EMAIL_PASSWORD || "").trim();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
    connectionTimeout: 10000
  });
}

function _emailMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function _emailCurrencySymbol(code) {
  const c = String(code || "EUR").toUpperCase();
  const m = {
    EUR: "€", USD: "$", GBP: "£", CAD: "CA$", AUD: "A$", CHF: "CHF", CZK: "Kč", PLN: "zł",
    SEK: "kr", NOK: "kr", DKK: "kr", HUF: "Ft", RON: "lei", BGN: "лв.", RUB: "₽", UAH: "₴",
    JPY: "¥", CNY: "CN¥", INR: "₹", KRW: "₩", IDR: "Rp", MYR: "RM", PHP: "₱", THB: "฿",
    VND: "₫", PKR: "₨", BDT: "৳", ZAR: "R", NGN: "₦", KES: "KSh", EGP: "E£", GHS: "GH₵",
    TZS: "TSh", NZD: "NZ$", FJD: "FJ$", PGK: "K", AED: "د.إ", SAR: "ر.س", ILS: "₪",
    TRY: "₺", IRR: "﷼", BRL: "R$", ARS: "$", CLP: "$", COP: "$", PEN: "S/", VES: "Bs.",
    MXN: "$", JMD: "$", DOP: "RD$"
  };
  return m[c] || c;
}

function _emailCurrencyLocale(code) {
  const c = String(code || "EUR").toUpperCase();
  const m = {
    EUR: "fr-FR", USD: "en-US", GBP: "en-GB", CAD: "en-CA", AUD: "en-AU", CHF: "de-CH",
    CZK: "cs-CZ", PLN: "pl-PL", SEK: "sv-SE", NOK: "nb-NO", DKK: "da-DK", HUF: "hu-HU",
    RON: "ro-RO", BGN: "bg-BG", RUB: "ru-RU", UAH: "uk-UA", JPY: "ja-JP", CNY: "zh-CN",
    INR: "en-IN", KRW: "ko-KR", IDR: "id-ID", MYR: "ms-MY", PHP: "en-PH", THB: "th-TH",
    VND: "vi-VN", PKR: "en-PK", BDT: "bn-BD", ZAR: "en-ZA", NGN: "en-NG", KES: "sw-KE",
    EGP: "ar-EG", GHS: "en-GH", TZS: "sw-TZ", NZD: "en-NZ", FJD: "en-FJ", PGK: "en-PG",
    AED: "ar-AE", SAR: "ar-SA", ILS: "he-IL", TRY: "tr-TR", IRR: "fa-IR", BRL: "pt-BR",
    ARS: "es-AR", CLP: "es-CL", COP: "es-CO", PEN: "es-PE", VES: "es-VE", MXN: "es-MX",
    JMD: "en-JM", DOP: "es-DO"
  };
  return m[c] || "en-US";
}

function _emailFormatCurrency(amount, currency) {
  const cur = String(currency || "EUR").toUpperCase();
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(_emailCurrencyLocale(cur), {
      style: "currency",
      currency: cur,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safe);
  } catch {
    const sym = _emailCurrencySymbol(cur);
    const suffixCurrencies = new Set(["EUR", "PLN", "CZK", "SEK", "NOK", "DKK", "HUF", "RON", "BGN", "RUB", "UAH", "VND", "BDT", "EGP", "AED", "SAR", "ILS"]);
    return suffixCurrencies.has(cur) ? `${_emailMoney(safe)} ${sym}` : `${sym}${_emailMoney(safe)}`;
  }
}

function _emailComputePaidItems(order) {
  // Returns per-item prices AFTER all discounts (item-level + tier/bundle), in EUR.
  const items = Array.isArray(order?.items) ? order.items : [];
  const pricing = order?.pricing || {};
  const disc = pricing?.discounts || {};
  const applyToDiscountedItems = disc?.applyToDiscountedItems ?? true;

  const tierDiscEUR = Number(disc?.tierDiscountEUR || 0);
  const bundleDiscEUR = Number(disc?.bundleDiscountEUR || 0);
  const totalOrderLevelDiscCents = Math.max(0, Math.round((tierDiscEUR + bundleDiscEUR) * 100));

  // base line totals AFTER item-level discounts (e.g. reco), before tier/bundle
  const rows = items.map((it, idx) => {
    const qty = Math.max(1, parseInt(it?.quantity ?? 1, 10) || 1);
    const unitAfterItem = Number(it?.unitPriceEUR ?? it?.price ?? 0);
    const lineAfterItemCents = Math.max(0, Math.round(unitAfterItem * 100)) * qty;

    const orig = Number(it?.unitPriceOriginalEUR ?? 0);
    const recoPct = Number(it?.recoDiscountPct ?? 0);
    const hasItemDiscount =
      (Number.isFinite(orig) && orig > 0 && unitAfterItem + 1e-9 < orig) ||
      (Number.isFinite(recoPct) && recoPct > 0);

    const eligible = applyToDiscountedItems ? true : !hasItemDiscount;

    return {
      idx,
      it,
      qty,
      unitAfterItem,
      lineAfterItemCents,
      eligible,
      allocCents: 0,
      linePaidCents: lineAfterItemCents
    };
  });

  const eligibleRows = rows.filter(r => r.eligible && r.lineAfterItemCents > 0);
  const eligibleSum = eligibleRows.reduce((a, r) => a + r.lineAfterItemCents, 0);

  if (totalOrderLevelDiscCents > 0 && eligibleSum > 0) {
    // Largest-remainder allocation in cents to make totals exact.
    const parts = eligibleRows.map(r => {
      const raw = (totalOrderLevelDiscCents * r.lineAfterItemCents) / eligibleSum;
      const flo = Math.floor(raw);
      return { r, flo, rem: raw - flo };
    });

    let used = parts.reduce((a, p) => a + p.flo, 0);
    let left = Math.max(0, totalOrderLevelDiscCents - used);

    parts.sort((a, b) => b.rem - a.rem);
    for (let i = 0; i < parts.length && left > 0; i++, left--) {
      parts[i].flo += 1;
    }

    for (const p of parts) {
      p.r.allocCents = p.flo;
      p.r.linePaidCents = Math.max(0, p.r.lineAfterItemCents - p.flo);
    }
  }

  return rows.map(r => {
    const unitPaidEUR = (r.linePaidCents / 100) / r.qty;
    const linePaidEUR = r.linePaidCents / 100;
    return {
      it: r.it,
      qty: r.qty,
      unitPaidEUR,
      linePaidEUR,
      unitAfterItemEUR: r.unitAfterItem,
      lineAfterItemEUR: r.lineAfterItemCents / 100,
      allocOrderLevelEUR: r.allocCents / 100
    };
  });
}

function _emailFmtAmount({ eur, currency, exchangeRate }) {
  const cur = String(currency || "EUR").toUpperCase();
  const rate = Number(exchangeRate || 1);

  if (cur === "EUR" || !Number.isFinite(rate) || rate <= 0) {
    return { main: _emailFormatCurrency(eur, "EUR"), secondary: "" };
  }
  const inCur = Number(eur) * rate;
  return {
    main: _emailFormatCurrency(inCur, cur),
    secondary: ""
  };
}

function _emailCleanUrl(u) {
  const raw = String(u || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, SHOP_URL || "https://www.snagletshop.com");
    if (!/^https?:$/i.test(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function _emailCountryName(v) {
  const raw = String(v || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
        const dn = new Intl.DisplayNames(['en'], { type: 'region' });
        const label = dn.of(upper);
        if (label && String(label).toUpperCase() != upper) return String(label);
      }
    } catch {}
    const fallback = {
      SK: 'Slovakia', CZ: 'Czech Republic', PL: 'Poland', HU: 'Hungary', AT: 'Austria', DE: 'Germany',
      FR: 'France', IT: 'Italy', ES: 'Spain', PT: 'Portugal', NL: 'Netherlands', BE: 'Belgium',
      LU: 'Luxembourg', IE: 'Ireland', DK: 'Denmark', SE: 'Sweden', NO: 'Norway', FI: 'Finland',
      CH: 'Switzerland', GB: 'United Kingdom', UK: 'United Kingdom', US: 'United States', CA: 'Canada',
      AU: 'Australia', NZ: 'New Zealand', RO: 'Romania', BG: 'Bulgaria', HR: 'Croatia', SI: 'Slovenia',
      EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania', GR: 'Greece'
    };
    return fallback[upper] || upper;
  }
  return raw;
}

function _emailProductLink(it) {
  const base = String(SHOP_URL || "https://www.snagletshop.com").replace(/\/+$/, "");
  const explicit = _emailCleanUrl(it?.productLink || it?.url || it?.link || "");

  // Keep explicit links only when they already point back to this store.
  if (explicit) {
    try {
      const explicitUrl = new URL(explicit);
      const shopUrl = new URL(base);
      if (explicitUrl.origin === shopUrl.origin) return explicit;
    } catch {}
  }

  // Orders often persist supplier/AliExpress links in item.productLink.
  // For customer emails we want the product page on this store instead.
  try {
    const hit = getCatalogProductRef(it);
    const pid = String(hit?.productId || hit?.id || "").trim();
    if (pid) return `${base}/?p=${encodeURIComponent(pid)}`;

    const hitName = String(hit?.name || "").trim();
    if (hitName) return `${base}/?product=${encodeURIComponent(hitName)}`;
  } catch {}

  const name = String(it?.name || "").trim();
  if (!name) return _emailCleanUrl(base);
  return `${base}/?product=${encodeURIComponent(name)}`;
}

function _emailProductImage(it) {
  const candidates = [
    it?.image,
    it?.imageUrl,
    it?.imageURL,
    it?.img,
    Array.isArray(it?.images) ? it.images[0] : "",
    Array.isArray(it?.Images) ? it.Images[0] : ""
  ];
  for (const c of candidates) {
    const u = _emailCleanUrl(c);
    if (u) return u;
  }
  return "";
}

function _emailProductDescription(it) {
  const raw = String(it?.description || it?.shortDescription || it?.desc || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  return raw.length > 68 ? `${raw.slice(0, 65).trim()}...` : raw;
}

function _emailBuildItemsPatternHtml({ itemsPaid, paidCurrency, exchangeRate, esc }) {
  return (itemsPaid || []).map(({ it, qty, linePaidEUR }) => {
    const name = esc(it?.name || "");
    const desc = esc(_emailProductDescription(it));
    const link = esc(_emailProductLink(it));
    const image = esc(_emailProductImage(it));
    const totalFmt = _emailFmtAmount({ eur: linePaidEUR, currency: paidCurrency, exchangeRate });
    const qtyTxt = qty > 1 ? ` <span style="color:#6b7280;font-weight:400;">× ${qty}</span>` : "";
    const priceTxt = `${totalFmt.main}${totalFmt.secondary ? ` ${totalFmt.secondary}` : ""}`;

    const imageCell = image
      ? `<a href="${link}" style="text-decoration:none;"><img src="${image}" alt="${name}" style="display:block;width:96px;max-width:96px;height:96px;object-fit:cover;border-radius:6px;border:0;"></a>`
      : `<a href="${link}" class="ss-image-placeholder" style="text-decoration:none;display:block;width:96px;max-width:96px;height:96px;border-radius:6px;background:#e5e7eb;"></a>`;

    return `
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:10px">
        <tr>
          <td style="width:96px;padding:10px 10px 10px 0;vertical-align:top">${imageCell}</td>
          <td style="padding:10px 0 10px 12px;vertical-align:top">
            <p style="margin:0;font-weight:bold;font-size:15px;line-height:1.15"><a href="${link}" class="ss-link" style="color:#2563eb;text-decoration:none;">${name}</a>${qtyTxt}</p>
            ${desc ? `<p class="ss-item-desc" style="margin:4px 0 0;font-size:12px;color:#6b7280;line-height:1.28;">${desc}</p>` : ``}
            <p class="ss-price" style="margin:5px 0 0;font-weight:bold;font-size:14px;color:#111827;">${priceTxt}</p>
          </td>
        </tr>
      </table>`;
  }).join("");
}

function _emailBuildPatternShell({ esc, greetingName, headline, subheadline, orderId, sectionTitle, itemsHtml, totalLine, addressLines, footerText, extraHtml = "" }) {
  const safeGreeting = esc(greetingName || "there");
  const safeSubheadline = subheadline || "";
  const safeOrderId = esc(orderId || "");
  const safeSectionTitle = esc(sectionTitle || "Order details");
  const safeFooterText = footerText || "Thank you for shopping with us.<br>Your Store Team";
  const shipToHtml = (addressLines || []).map(l => `<p class="ss-address" style="margin:0;color:#2563eb;line-height:1.45;">${l}</p>`).join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>SnagletShop</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
    }
    @media (prefers-color-scheme: dark) {
      body,
      .ss-wrap,
      .ss-container {
        background: #1f1f1f !important;
        color: #dbe5ff !important;
      }
      .ss-brand,
      .ss-heading,
      .ss-total,
      .ss-shipto,
      .ss-price,
      .ss-track-title {
        color: #ffffff !important;
      }
      .ss-muted,
      .ss-footer,
      .ss-order-id-label,
      .ss-item-desc,
      .ss-qty {
        color: #babdc5 !important;
      }
      .ss-order-id-value { color: #9ae5b5 !important; }
      .ss-rule,
      .ss-section-rule { border-color: #303030 !important; }
      .ss-link,
      .ss-address,
      .ss-track-link { color: #9ab0e5 !important; }
      .ss-image-placeholder { background: #2a2a2a !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#111827;">
  <div class="ss-wrap" style="margin:0;padding:0;background:#ffffff;color:#111827;">
    <div class="ss-container" style="max-width:720px;margin:0 auto;padding:24px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#ffffff;color:#111827;">
      <div style="text-align:center;padding-bottom:20px;">
        <h2 class="ss-brand" style="margin:0;color:#111827;font-size:32px;line-height:1.2;font-weight:800;">SnagletShop</h2>
        <h2 class="ss-heading" style="margin:10px 0 0;color:#111827;font-size:28px;line-height:1.2;font-weight:800;">Hi, ${safeGreeting}!</h2>
        <p class="ss-muted" style="margin:10px 0 0;color:#6b7280;font-size:18px;line-height:1.4;">${safeSubheadline}</p>
        <p class="ss-order-id-label" style="color:#9ca3af;margin:8px 0 0;font-size:18px;line-height:1.4;">Order ID: <strong class="ss-order-id-value" style="color:#16a34a;">${safeOrderId}</strong></p>
      </div>

      <h3 class="ss-heading ss-section-rule" style="border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin:0;color:#111827;font-size:18px;line-height:1.3;font-weight:800;">${safeSectionTitle}</h3>
      ${extraHtml || ""}
      ${itemsHtml || ""}

      <div class="ss-total" style="text-align:right;font-size:16px;font-weight:bold;padding-top:20px;color:#111827;">
        Total: ${totalLine}
      </div>

      <div style="padding-top:20px;">
        <h4 class="ss-shipto" style="margin:0 0 6px;color:#111827;font-size:16px;font-weight:800;">Ship To:</h4>
        ${shipToHtml}
      </div>

      <hr class="ss-rule" style="margin-top:30px;border:0;border-top:1px solid #e5e7eb;">
      <p class="ss-footer" style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">${safeFooterText}</p>
    </div>
  </div>
</body>
</html>`;
}

const ORDER_EMAIL_COOLDOWN_MS = 60 * 1000;
const __orderEmailInFlight = new Map();

function _mailAddrTrim(v) {
  return String(v == null ? "" : v).trim();
}

function _mailCooldownRemainingMs(order, field) {
  try {
    const last = order?.[field] ? new Date(order[field]).getTime() : 0;
    if (!Number.isFinite(last) || last <= 0) return 0;
    const rem = (last + ORDER_EMAIL_COOLDOWN_MS) - Date.now();
    return rem > 0 ? rem : 0;
  } catch {
    return 0;
  }
}

async function _sendOrderEmailWithCooldown({ order, field, type, sender }) {
  if (!order) throw new Error('Missing order');
  const orderId = String(order.orderId || order._id || '').trim();
  const key = `${type}:${orderId}`;

  const remaining = _mailCooldownRemainingMs(order, field);
  if (remaining > 0) {
    return { ok: true, skipped: true, cooldown: true, remainingMs: remaining, sentAt: order[field] || null };
  }

  if (__orderEmailInFlight.has(key)) {
    return { ok: true, skipped: true, inFlight: true, remainingMs: ORDER_EMAIL_COOLDOWN_MS, sentAt: order[field] || null };
  }

  const run = (async () => {
    const info = await sender(order);
    order[field] = new Date();
    await order.save();
    return { ok: true, sent: true, info, sentAt: order[field] };
  })();

  __orderEmailInFlight.set(key, run);
  try {
    return await run;
  } finally {
    __orderEmailInFlight.delete(key);
  }
}

async function sendConfirmationEmail(order) {
  const tx = buildTransport();
  if (!tx) {
    console.log('[mail] SMTP not configured, skipping send');
    return { skipped: true };
  }

  const to = _mailAddrTrim(order?.customer?.email);
  if (!to) throw new Error('Order has no customer email');

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\'/g, "&#39;");

  const orderId = String(order?.orderId || "");
  const c = order?.customer || {};
  const items = Array.isArray(order?.items) ? order.items : [];

  const paidCurrency = String(order?.pricing?.currency || order?.stripe?.currency || "EUR").toUpperCase();
  const amountMinor =
    (order?.stripe?.amountMinor != null) ? Number(order.stripe.amountMinor) :
      (order?.pricing?.amountCents != null) ? Number(order.pricing.amountCents) :
        null;

  const paidInCurrency = (amountMinor != null && Number.isFinite(amountMinor)) ? (amountMinor / 100) : null;
  const exchangeRate = Number(order?.pricing?.exchangeRate || 1);
  const paidEUR = Number(order?.pricing?.totalPaidEUR || 0);
  const baseEUR = Number(order?.pricing?.baseTotalEUR || 0);
  const tariffPct = Number(order?.pricing?.tariffPct || 0);
  const applyTariff = !!order?.pricing?.applyTariff;

  const money = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0.00";
    return x.toFixed(2);
  };

  const symbolByCurrency = { EUR: "€", USD: "$", GBP: "£", CAD: "CA$", AUD: "A$", CHF: "CHF", CZK: "Kč", PLN: "zł" };
  const curSymbol = symbolByCurrency[paidCurrency] || paidCurrency;

  const addressLines = [
    `${esc(c.firstName || "")} ${esc(c.lastName || "")}`.trim(),
    esc(c.address1 || ""),
    esc(c.address2 || ""),
    `${esc(c.postalCode || "")} ${esc(c.city || "")}`.trim(),
    esc(c.region || ""),
    esc(_emailCountryName(c.countryCode || c.country || "")),
  ].filter(Boolean);

  const itemsPaid = _emailComputePaidItems(order);

  const itemsRows = itemsPaid.map(({ it, qty, unitPaidEUR, linePaidEUR }) => {
    const name = esc(it?.name || "");
    const sel = esc(formatSelectedOptions(it?.selectedOptions, it?.selectedOption));
    const u = _emailFmtAmount({ eur: unitPaidEUR, currency: paidCurrency, exchangeRate });
    const l = _emailFmtAmount({ eur: linePaidEUR, currency: paidCurrency, exchangeRate });

    return `
    <tr>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;">
        <div style="font-weight:600;color:#111;line-height:1.2;">${name}</div>
        ${sel ? `<div style="margin-top:4px;color:#6b7280;font-size:12px;">${sel}</div>` : ``}
      </td>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;text-align:center;color:#111;">${qty}</td>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;text-align:right;color:#111;">
        ${u.main} ${u.secondary || ""}
      </td>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;text-align:right;color:#111;">
        ${l.main} ${l.secondary || ""}
      </td>
    </tr>
  `;
  }).join("");

  const paidLine =
    (paidCurrency === "EUR" || paidInCurrency == null)
      ? _emailFormatCurrency(paidEUR, "EUR")
      : _emailFormatCurrency(paidInCurrency, paidCurrency);

  const tariffLine =
    applyTariff ? `${(tariffPct * 100).toFixed(1)}%` : `0.0%`;

  const fromAddr = _mailAddrTrim((process.env.STORE_EMAIL || process.env.SHOP_EMAIL)
    ? `SnagletShop <${process.env.STORE_EMAIL || process.env.SHOP_EMAIL}>`
    : SMTP_FROM);

  const subject = `Order confirmation — ${orderId}`;

  const orderTotalFmt = _emailFmtAmount({ eur: paidEUR, currency: paidCurrency, exchangeRate });
  const itemsHtml = _emailBuildItemsPatternHtml({ itemsPaid, paidCurrency, exchangeRate, esc });
  const html = _emailBuildPatternShell({
    esc,
    greetingName: c.firstName || c.email || "there",
    headline: "Order confirmation",
    subheadline: "Your order has been registered 📦",
    orderId,
    sectionTitle: "Order Details",
    itemsHtml,
    totalLine: `${orderTotalFmt.main}${orderTotalFmt.secondary ? ` ${orderTotalFmt.secondary}` : ""}`,
    addressLines,
    footerText: "Thank you for shopping with us.<br>Your Store Team"
  });

  const textLines = [];
  textLines.push(`Order confirmation: ${orderId}`);
  textLines.push(`Hi ${c.firstName || ""}, thanks for your order.`);
  textLines.push("");
  for (const row of itemsPaid) {
    const it = row.it;
    const qty = row.qty;
    const name = String(it?.name || "");
    const sel = formatSelectedOptions(it?.selectedOptions, it?.selectedOption);

    const amt = _emailFmtAmount({ eur: row.unitPaidEUR, currency: paidCurrency, exchangeRate });
    const unitTxt = amt.main;

    textLines.push(`- ${qty}× ${name}${sel ? ` (${sel})` : ""} — ${unitTxt}`);
  }
  textLines.push("");
  if (paidCurrency !== "EUR" && paidInCurrency != null) {
    textLines.push(`Paid: ${_emailFormatCurrency(paidInCurrency, paidCurrency)}`);
  } else {
    textLines.push(`Paid: ${_emailFormatCurrency(paidEUR, "EUR")}`);
  }
  textLines.push("");
  textLines.push("Shipping:");
  for (const l of addressLines) textLines.push(String(l).replace(/<[^>]+>/g, ""));
  textLines.push("");
  textLines.push("Thanks, SnagletShop");

  const info = await tx.sendMail({
    from: fromAddr,
    to,
    subject,
    html,
    text: textLines.join("\n"),
    headers: { 'X-Entity-Ref-ID': orderId }
  });

  return info;
}

async function sendShippedEmail(order) {
  const tx = buildTransport();
  if (!tx) {
    console.log('[mail] SMTP not configured, skipping send');
    return { skipped: true };
  }

  const to = _mailAddrTrim(order?.customer?.email);
  if (!to) throw new Error('Order has no customer email');

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\'/g, "&#39;");

  const orderId = String(order?.orderId || "");
  const c = order?.customer || {};
  const items = Array.isArray(order?.items) ? order.items : [];

  const paidCurrency = String(order?.pricing?.currency || order?.stripe?.currency || "EUR").toUpperCase();
  const amountMinor =
    (order?.stripe?.amountMinor != null) ? Number(order.stripe.amountMinor) :
      (order?.pricing?.amountCents != null) ? Number(order.pricing.amountCents) :
        null;

  const paidInCurrency = (amountMinor != null && Number.isFinite(amountMinor)) ? (amountMinor / 100) : null;
  const exchangeRate = Number(order?.pricing?.exchangeRate || 1);
  const paidEUR = Number(order?.pricing?.totalPaidEUR || 0);
  const baseEUR = Number(order?.pricing?.baseTotalEUR || 0);
  const tariffPct = Number(order?.pricing?.tariffPct || 0);
  const applyTariff = !!order?.pricing?.applyTariff;

  const money = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0.00";
    return x.toFixed(2);
  };

  const symbolByCurrency = { EUR: "€", USD: "$", GBP: "£", CAD: "CA$", AUD: "A$", CHF: "CHF", CZK: "Kč", PLN: "zł" };
  const curSymbol = symbolByCurrency[paidCurrency] || paidCurrency;

  const addressLines = [
    `${esc(c.firstName || "")} ${esc(c.lastName || "")}`.trim(),
    esc(c.address1 || ""),
    esc(c.address2 || ""),
    `${esc(c.postalCode || "")} ${esc(c.city || "")}`.trim(),
    esc(c.region || ""),
    esc(_emailCountryName(c.countryCode || c.country || "")),
  ].filter(Boolean);

  const itemsPaid = _emailComputePaidItems(order);

  const itemsRows = itemsPaid.map(({ it, qty, unitPaidEUR, linePaidEUR }) => {
    const name = esc(it?.name || "");
    const sel = esc(formatSelectedOptions(it?.selectedOptions, it?.selectedOption));
    const u = _emailFmtAmount({ eur: unitPaidEUR, currency: paidCurrency, exchangeRate });
    const l = _emailFmtAmount({ eur: linePaidEUR, currency: paidCurrency, exchangeRate });

    return `
    <tr>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;">
        <div style="font-weight:600;color:#111;line-height:1.2;">${name}</div>
        ${sel ? `<div style="margin-top:4px;color:#6b7280;font-size:12px;">${sel}</div>` : ``}
      </td>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;text-align:center;color:#111;">${qty}</td>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;text-align:right;color:#111;">
        ${u.main} ${u.secondary || ""}
      </td>
      <td style="padding:12px 0;border-top:1px solid #eaeaea;text-align:right;color:#111;">
        ${l.main} ${l.secondary || ""}
      </td>
    </tr>
  `;
  }).join("");

  const paidLine =
    (paidCurrency === "EUR" || paidInCurrency == null)
      ? _emailFormatCurrency(paidEUR, "EUR")
      : _emailFormatCurrency(paidInCurrency, paidCurrency);

  const tariffLine = applyTariff ? `${(tariffPct * 100).toFixed(1)}%` : `0.0%`;

  const tracking = Array.isArray(order?.operator?.tracking) ? order.operator.tracking : [];
  const trackingItems = tracking
    .map(t => ({
      code: String(t?.code || "").trim(),
      carrier: String(t?.carrier || "").trim(),
      url: String(t?.url || "").trim()
    }))
    .filter(t => t.code || t.url);

  const trackingHtml = trackingItems.length ? `
    <div style="margin-top:14px;">
      <div style="font-weight:700;color:#111;">Tracking</div>
      <div style="margin-top:6px;color:#374151;font-size:14px;line-height:1.45;">
        ${trackingItems.map(t => {
    const label = [t.carrier, t.code].filter(Boolean).join(" • ");
    const safeLabel = esc(label || "Tracking");
    const safeUrl = esc(t.url);
    if (t.url) {
      return `<div style="margin-top:6px;"><a href="${safeUrl}" style="color:#111827;font-weight:700;text-decoration:underline;">${safeLabel}</a></div>`;
    }
    return `<div style="margin-top:6px;"><span style="font-weight:700;">${safeLabel}</span></div>`;
  }).join("")}
      </div>
    </div>
  ` : "";

  const fromAddr = _mailAddrTrim((process.env.STORE_EMAIL || process.env.SHOP_EMAIL)
    ? `SnagletShop <${process.env.STORE_EMAIL || process.env.SHOP_EMAIL}>`
    : SMTP_FROM);

  const subject = `Your order has been shipped — ${orderId}`;

  const orderTotalFmt = _emailFmtAmount({ eur: paidEUR, currency: paidCurrency, exchangeRate });
  const itemsHtml = _emailBuildItemsPatternHtml({ itemsPaid, paidCurrency, exchangeRate, esc });
  const trackingBlock = trackingItems.length ? `
      <div style="padding-top:16px;">
        <h4 class="ss-track-title" style="margin:0 0 6px;color:#111827;">Tracking:</h4>
        ${trackingItems.map(t => {
          const label = [t.carrier, t.code].filter(Boolean).join(" • ");
          const safeLabel = esc(label || "Tracking");
          const safeUrl = esc(t.url);
          return t.url
            ? `<p style="margin:0 0 6px;"><a href="${safeUrl}" class="ss-track-link" style="color:#2563eb;text-decoration:none;">${safeLabel}</a></p>`
            : `<p class="ss-track-link" style="margin:0 0 6px;color:#2563eb;">${safeLabel}</p>`;
        }).join("")}
      </div>` : "";
  const html = _emailBuildPatternShell({
    esc,
    greetingName: c.firstName || c.email || "there",
    headline: "Order shipped",
    subheadline: "Your package has been sent 🚚",
    orderId,
    sectionTitle: "Package Details",
    itemsHtml,
    totalLine: `${orderTotalFmt.main}${orderTotalFmt.secondary ? ` ${orderTotalFmt.secondary}` : ""}`,
    addressLines,
    footerText: "Thank you for shopping with us.<br>Your Store Team",
    extraHtml: trackingBlock
  });

  const textLines = [];
  textLines.push(`Order shipped: ${orderId}`);
  textLines.push(`Hi ${c.firstName || ""}, your order has been shipped and is on the way.`);
  textLines.push("");
  if (trackingItems.length) {
    textLines.push("Tracking:");
    for (const t of trackingItems) {
      const label = [t.carrier, t.code].filter(Boolean).join(" • ");
      textLines.push(`- ${label || "Tracking"}${t.url ? ` — ${t.url}` : ""}`);
    }
    textLines.push("");
  }
  for (const row of itemsPaid) {
    const it = row.it;
    const qty = row.qty;
    const name = String(it?.name || "");
    const sel = formatSelectedOptions(it?.selectedOptions, it?.selectedOption);

    const amt = _emailFmtAmount({ eur: row.unitPaidEUR, currency: paidCurrency, exchangeRate });
    const unitTxt = amt.main;

    textLines.push(`- ${qty}× ${name}${sel ? ` (${sel})` : ""} — ${unitTxt}`);
  }
  textLines.push("");
  if (paidCurrency !== "EUR" && paidInCurrency != null) {
    textLines.push(`Paid: ${_emailFormatCurrency(paidInCurrency, paidCurrency)}`);
  } else {
    textLines.push(`Paid: ${_emailFormatCurrency(paidEUR, "EUR")}`);
  }
  textLines.push("");
  textLines.push("Shipping:");
  for (const l of addressLines) textLines.push(String(l).replace(/<[^>]+>/g, ""));
  textLines.push("");
  textLines.push("Thanks, SnagletShop");

  const info = await tx.sendMail({
    from: fromAddr,
    to,
    subject,
    html,
    text: textLines.join("\n"),
    headers: { 'X-Entity-Ref-ID': orderId }
  });

  return info;
}



// POST /admin/orders/:id/resend-confirmation
app.post('/admin/orders/:id/resend-confirmation', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Order.findOne(buildOrderLookup(id));
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const result = await _sendOrderEmailWithCooldown({
      order: doc,
      field: 'emailSentAt',
      type: 'confirmation',
      sender: sendConfirmationEmail
    });

    return res.json({ ok: true, ...result, emailSentAt: doc.emailSentAt || result.sentAt || null });
  } catch (e) {
    console.error('resend error', e);
    return res.status(500).json({ error: e?.message || 'resend failed' });
  }
});

// POST /admin/orders/:id/send-shipped-email
app.post('/admin/orders/:id/send-shipped-email', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Order.findOne(buildOrderLookup(id));
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const result = await _sendOrderEmailWithCooldown({
      order: doc,
      field: 'shippedEmailSentAt',
      type: 'shipped',
      sender: sendShippedEmail
    });

    return res.json({ ok: true, mailSent: !!result.sent, ...result, shippedEmailSentAt: doc.shippedEmailSentAt || result.sentAt || null });
  } catch (e) {
    console.error('send shipped email error', e);
    return res.status(500).json({ ok: false, mailSent: false, error: e?.message || 'send shipped email failed' });
  }
});


// POST /admin/orders/:id/refund
// Body: { amount, reason, note }
//   - amount: optional decimal (e.g. 19.99) in the original payment currency
//             If omitted, Stripe will refund the full remaining amount.
//   - reason: optional string; if it is one of ['duplicate','fraudulent','requested_by_customer'],
//             it will be passed through to Stripe. Otherwise it is only stored in our order document.
//   - note:   optional free-text note stored in order.stripe.refunds[].reason
app.post('/admin/orders/:id/refund', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const amount = payload.amount;
    const reason = payload.reason;
    const note = payload.note;

    const order = await Order.findOne(buildOrderLookup(id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const paymentIntentId = order?.stripe?.paymentIntentId;
    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Order has no stored Stripe paymentIntentId; refunds are only available for newer orders.'
      });
    }

    // Prepare refund params
    const refundParams = {
      payment_intent: paymentIntentId
    };

    // If amount provided, convert decimal to minor units
    if (amount != null) {
      const num = Number(amount);
      if (!Number.isFinite(num) || num <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      const minor = Math.round(num * 100);
      if (!Number.isFinite(minor) || minor <= 0) {
        return res.status(400).json({ error: 'Invalid amount after conversion' });
      }
      refundParams.amount = minor;
    }

    // Pass Stripe's limited reason values if recognized
    const allowedStripeReasons = ['duplicate', 'fraudulent', 'requested_by_customer'];
    if (reason && allowedStripeReasons.includes(String(reason))) {
      refundParams.reason = String(reason);
    }

    // Optional note stored as Stripe metadata only (safe, not required)
    if (note) {
      refundParams.metadata = {
        orderId: order.orderId,
        note: String(note).slice(0, 500)
      };
    }

    // Create refund in Stripe
    const stripeClient = initStripe();
    if (!stripeClient) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });

    const refund = await stripeClient.refunds.create(refundParams);
    console.log('[refund] Created refund', refund.id, 'for order', order.orderId);

    // ---- Update order.stripe.refunds and status ----
    const stripeInfo = order.stripe || {};
    const refunds = Array.isArray(stripeInfo.refunds) ? stripeInfo.refunds : [];

    refunds.push({
      id: refund.id,
      amountMinor: refund.amount,
      currency: (refund.currency || stripeInfo.currency || '').toUpperCase(),
      status: refund.status,
      createdAt: new Date(refund.created * 1000),
      reason: note || reason || ''
    });

    stripeInfo.refunds = refunds;

    // Make sure base payment snapshot is not lost
    if (!stripeInfo.paymentIntentId) {
      stripeInfo.paymentIntentId = paymentIntentId;
    }
    if (!stripeInfo.currency && refund.currency) {
      stripeInfo.currency = refund.currency.toUpperCase();
    }
    if (!stripeInfo.amountMinor &&
      typeof order?.pricing?.totalPaidEUR === 'number' &&
      (stripeInfo.currency === 'EUR' || !stripeInfo.currency)) {
      // Best-effort backfill when currency is EUR
      stripeInfo.amountMinor = Math.round(order.pricing.totalPaidEUR * 100);
    }

    // Determine if fully refunded
    try {
      const totalPaidMinor = stripeInfo.amountMinor;
      const totalRefundedMinor = refunds.reduce((sum, r) => sum + (r.amountMinor || 0), 0);
      if (Number.isFinite(totalPaidMinor) && totalRefundedMinor >= totalPaidMinor) {
        order.status = 'REFUNDED';
      }
    } catch (e) {
      console.warn('[refund] Could not compute full-refund status:', e.message);
    }

    order.stripe = stripeInfo;
    await order.save();

    if (order.status === 'REFUNDED') {
      try { await updateProductProfitStatsFromOrder(order, { isRefund: true }); } catch { }
    }

    return res.json({
      ok: true,
      refund: {
        id: refund.id,
        status: refund.status,
        amountMinor: refund.amount,
        currency: refund.currency,
        paymentIntentId
      },
      order: {
        id: order.orderId,
        status: order.status,
        stripe: order.stripe
      }
    });
  } catch (e) {
    console.error('[refund] error while creating refund', e);
    // Stripe errors often contain a .raw.message
    if (e && e.raw && e.raw.message) {
      return res.status(400).json({ error: e.raw.message });
    }
    return res.status(500).json({ error: 'refund failed' });
  }
});


// POST /admin/orders/:id/chargeback
// Manual admin action: mark order as chargeback/disputed.
app.post('/admin/orders/:id/chargeback', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const parsed = z.object({
      reason: z.string().max(120).optional(),
      note: z.string().max(1000).optional()
    }).safeParse(payload);

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.issues });
    }

    const { reason, note } = parsed.data;

    const order = await Order.findOne(buildOrderLookup(id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const prevStatus = String(order.status || '');

    // Update status + history
    if (prevStatus !== 'CHARGEBACK') {
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.statusHistory.push({
        from: prevStatus,
        to: 'CHARGEBACK',
        by: String(req.user?.username || 'admin'),
        note: String(reason || note || '')
      });
    }

    order.status = 'CHARGEBACK';
    order.updatedAt = new Date();

    // Store a note for auditability
    order.notes = Array.isArray(order.notes) ? order.notes : [];
    const parts = [];
    if (reason) parts.push(`Reason: ${reason}`);
    if (note) parts.push(`Note: ${note}`);
    order.notes.push({
      by: String(req.user?.username || 'admin'),
      text: parts.length ? `Chargeback marked. ${parts.join(' | ')}` : 'Chargeback marked.'
    });

    await order.save();
    return res.json({ ok: true, orderId: order.orderId, status: order.status });
  } catch (e) {
    console.error('chargeback mark error', e);
    return res.status(500).json({ error: 'chargeback mark failed' });
  }
});

// GET /admin/export/orders.xlsx
app.get('/admin/export/orders.xlsx', authMiddleware, async (req, res) => {
  try {
    const { from, to, limit = 10000 } = req.query;
    const q = {};
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }
    const lim = Math.max(1, Math.min(100000, Number(limit)));
    const rows = await Order.find(q).sort({ createdAt: -1 }).limit(lim).lean();

    const data = [];
    data.push([
      'Order ID', 'Created', 'Status',
      'First name', 'Last name', 'Email', 'Phone',
      'Address1', 'Address2', 'City', 'Region', 'Postal', 'Country',
      'Currency', 'Total Paid EUR', 'Email sent at',
      'Items (name × qty @ unit EUR)'
    ]);
    for (const o of rows) {
      const itemsText = (o.items || []).map(it => {
        const sel = formatSelectedOptionSummary(it.selectedOptions, it.selectedOption);
        const selTxt = sel ? ` (${sel})` : '';
        return `${it.name}${selTxt} × ${it.quantity} @ ${it.unitPriceEUR}`;
      }).join(' | ');

      data.push([
        sanitizeSpreadsheetText(o.orderId),
        sanitizeSpreadsheetText(new Date(o.createdAt).toISOString()),
        sanitizeSpreadsheetText(o.status || ''),
        sanitizeSpreadsheetText(o.customer?.firstName || ''),
        sanitizeSpreadsheetText(o.customer?.lastName || ''),
        sanitizeSpreadsheetText(o.customer?.email || ''),
        sanitizeSpreadsheetText(o.customer?.phone || ''),
        sanitizeSpreadsheetText(o.customer?.address1 || ''),
        sanitizeSpreadsheetText(o.customer?.address2 || ''),
        sanitizeSpreadsheetText(o.customer?.city || ''),
        sanitizeSpreadsheetText(o.customer?.region || ''),
        sanitizeSpreadsheetText(o.customer?.postalCode || ''),
        sanitizeSpreadsheetText(o.customer?.countryCode || ''),
        sanitizeSpreadsheetText(o.pricing?.currency || 'EUR'),
        Number(o.pricing?.totalPaidEUR || 0),
        sanitizeSpreadsheetText(o.emailSentAt ? new Date(o.emailSentAt).toISOString() : ''),
        sanitizeSpreadsheetText(itemsText)
      ]);
    }

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, 'Orders');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');
    return res.send(buf);
  } catch (e) {
    console.error('export error', e);
    return res.status(500).json({ error: 'export failed' });
  }
});



// GET /admin/export/monthly.csv?month=YYYY-MM
// Export per-order rows for accounting.
app.get('/admin/export/monthly.csv', authMiddleware, async (req, res) => {
  try {
    const month = String(req.query.month || '').trim(); // YYYY-MM
    if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) {
      return res.status(400).json({ error: 'month must be YYYY-MM' });
    }
    const [y, m] = month.split('-').map(n => Number(n));
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));

    const rows = await Order.find({
      paidAt: { $gte: start, $lt: end }
    }).sort({ paidAt: 1 }).lean();

    const header = [
      'orderId', 'paidAt', 'status',
      'invoiceNumber',
      'customerCountry',
      'currency', 'exchangeRate',
      'totalPaidEUR', 'tariffPct', 'baseTotalEUR', 'tariffEUR',
      'stripeFeeEUR',
      'expectedPurchaseEUR', 'actualPurchaseEUR',
      'operatorShippingEUR',
      'operatorSupplierCostEUR',
      'otherCostEUR',
      'grossMarginEUR'
    ];


    function csvEscape(v) {
      if (v === null || v === undefined) return '';
      // Prevent CSV formula injection for text cells, but keep numeric cells numeric (including negatives).
      let s = String(v);
      const trimmed = s.trim();
      if (!looksLikeNumberString(trimmed)) {
        if (/^[=+\-@]/.test(trimmed) || /^[\t\r\n]/.test(trimmed)) s = "'" + s;
      }
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }

    const lines = [header.join(',')];

    for (const o of rows) {
      const items = Array.isArray(o.items) ? o.items : [];
      const expectedPurchase = items.reduce((sum, it) => sum + (Number(it.expectedPurchase || 0) * Number(it.quantity || 1)), 0);
      const actualPurchase = items.reduce((sum, it) => sum + (Number(it.actualPurchaseEUR || 0) * Number(it.quantity || 1)), 0);

      const opShip = (o.operator?.shipping?.aliExpress || 0) + (o.operator?.shipping?.thirdParty1 || 0) + (o.operator?.shipping?.thirdParty2 || 0);
      const supplierCost = (o.operator?.supplierCostEUR != null) ? Number(o.operator.supplierCostEUR) : null;

      const totalPaidEUR = Number(o?.pricing?.totalPaidEUR || 0);
      const stripeFeeEUR = (o?.costs?.stripeFeeEUR != null) ? Number(o.costs.stripeFeeEUR) : null;
      const otherCostEUR = (o?.costs?.otherCostEUR != null) ? Number(o.costs.otherCostEUR) : null;

      const purchaseUsed = (actualPurchase > 0) ? actualPurchase : expectedPurchase;
      const margin = totalPaidEUR
        - (purchaseUsed || 0)
        - (opShip || 0)
        - (stripeFeeEUR || 0)
        - (supplierCost || 0)
        - (otherCostEUR || 0);

      lines.push([
        o.orderId,
        o.paidAt ? new Date(o.paidAt).toISOString() : '',
        o.status || '',
        o.accounting?.invoiceNumber || '',
        o.accounting?.customerCountryCode || o.customer?.countryCode || '',
        o.pricing?.currency || 'EUR',
        o.pricing?.exchangeRate || 1,
        totalPaidEUR.toFixed(2),
        o.pricing?.tariffPct != null ? Number(o.pricing.tariffPct).toFixed(4) : '',
        o.pricing?.baseTotalEUR != null ? Number(o.pricing.baseTotalEUR).toFixed(2) : '',
        o.pricing?.tariffEUR != null ? Number(o.pricing.tariffEUR).toFixed(2) : '',
        stripeFeeEUR != null ? stripeFeeEUR.toFixed(2) : '',
        expectedPurchase.toFixed(2),
        actualPurchase.toFixed(2),
        Number(opShip || 0).toFixed(2),
        supplierCost != null ? supplierCost.toFixed(2) : '',
        otherCostEUR != null ? otherCostEUR.toFixed(2) : '',
        Number(margin || 0).toFixed(2)
      ].map(csvEscape).join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${month}.csv"`);
    return res.send(lines.join('\n'));
  } catch (e) {
    console.error('monthly export error', e);
    return res.status(500).json({ error: 'export failed' });
  }
});

// GET /admin/export/oss-summary.csv?year=YYYY
// Summarize sales by customer country (useful for VAT OSS once you register for VAT/OSS).
app.get('/admin/export/oss-summary.csv', authMiddleware, async (req, res) => {
  try {
    const year = Number(req.query.year || 0);
    if (!year || year < 2000 || year > 2100) return res.status(400).json({ error: 'year must be YYYY' });

    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

    const rows = await Order.find({ paidAt: { $gte: start, $lt: end } }).lean();

    const byCountry = new Map();
    for (const o of rows) {
      const cc = (o.accounting?.customerCountryCode || o.customer?.countryCode || '').toUpperCase();
      if (!cc) continue;
      const totalPaidEUR = Number(o?.pricing?.totalPaidEUR || 0);
      byCountry.set(cc, (byCountry.get(cc) || 0) + totalPaidEUR);
    }

    const header = ['countryCode', 'salesEUR'];
    const lines = [header.join(',')];
    const entries = Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1]);
    for (const [cc, sum] of entries) {
      lines.push([cc, sum.toFixed(2)].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="oss-summary-${year}.csv"`);
    return res.send(lines.join('\n'));
  } catch (e) {
    console.error('oss export error', e);
    return res.status(500).json({ error: 'export failed' });
  }
});

// ---- Admin metrics / graphs ----
const METRICS_TZ = String(process.env.METRICS_TZ || process.env.TZ || "Europe/Bratislava");
// Admin: delete product by productId (removes from all categories + persists)
app.delete('/admin/products/:productId', authMiddleware, async (req, res) => {
  const id = String(req.params.productId || '').trim();
  if (!id) return res.status(400).json({ error: 'productId required' });

  let removed = 0;
  for (const [cat, arr] of Object.entries(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    const kept = [];
    for (const p of arr) {
      if (!p || typeof p !== 'object') { kept.push(p); continue; }
      if (String(p.productId || '').trim() === id) { removed++; continue; }
      kept.push(p);
    }
    productsData[cat] = kept;
  }

  if (!removed) return res.status(404).json({ error: 'product not found' });

  // record tombstone so sync/import cannot resurrect this productId
  tombstoneAdd(id);

  try {
    // ✅ Persist correctly (DB mode writes to Mongo; file mode writes to disk)
    await saveProducts(productsData, `admin:product_delete_${id}`);
  } catch (e) {
    if (e && e.code === "INVALID_CATALOG") {
      return res.status(400).json({ error: "INVALID_CATALOG", issues: (e.issues || []).slice(0, 50) });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }

  return res.json({ ok: true, removed });
});

app.get('/admin/metrics/catalog', authMiddleware, async (req, res) => {
  return res.json({
    ok: true,
    timezone: METRICS_TZ,
    metrics: [
      // Orders
      { dataset: "orders", id: "orders_count", label: "Orders (count)" },
      { dataset: "orders", id: "revenue_eur", label: "Revenue (EUR)" },
      { dataset: "orders", id: "base_revenue_eur", label: "Revenue excl. tariff (EUR)" },
      { dataset: "orders", id: "tariff_eur", label: "Tariff collected (EUR)" },
      { dataset: "orders", id: "items_qty", label: "Items sold (qty)" },
      { dataset: "orders", id: "profit_eur", label: "Gross profit (EUR)" },

      // Analytics
      { dataset: "analytics", id: "events_count", label: "Events (count)" },
      { dataset: "analytics", id: "unique_sessions", label: "Unique sessions" }
    ],
    datasets: [
      { id: "orders", groupBy: ["", "status", "country"], filters: ["paidOnly", "status", "country", "minPaidEUR"] },
      { id: "analytics", groupBy: ["", "type", "path", "websiteOrigin", "productLink"], filters: ["type", "path", "websiteOrigin", "sessionId", "productLink"] }
    ]
  });
});

app.get('/admin/metrics/dimensions', authMiddleware, async (req, res) => {
  try {
    const dataset = String(req.query.dataset || "orders");
    const key = String(req.query.key || "");
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from && !isNaN(from.valueOf())) match.createdAt.$gte = from;
      if (to && !isNaN(to.valueOf())) match.createdAt.$lte = to;
    }

    let values = [];
    if (dataset === "orders") {
      if (key === "status") values = await Order.distinct("status", match);
      else if (key === "country") values = await Order.distinct("customer.countryCode", match);
      else return res.status(400).json({ error: "Unsupported key" });
    } else if (dataset === "analytics") {
      if (key === "type") values = await AnalyticsEvent.distinct("type", match);
      else if (key === "path") values = await AnalyticsEvent.distinct("path", match);
      else if (key === "websiteOrigin") values = await AnalyticsEvent.distinct("websiteOrigin", match);
      else if (key === "sessionId") values = await AnalyticsEvent.distinct("sessionId", match);
      else if (key === "productLink") values = await AnalyticsEvent.distinct("product.productLink", match);
      else return res.status(400).json({ error: "Unsupported key" });
    } else {
      return res.status(400).json({ error: "Unsupported dataset" });
    }

    values = (values || []).filter(v => v != null && String(v).trim() !== "").map(v => String(v)).sort();
    return res.json({ ok: true, values });
  } catch (e) {
    console.error("[metrics] dimensions error", e);
    return res.status(500).json({ error: "dimensions failed" });
  }
});

function metricsBucketExpr(interval) {
  const unit = ["hour", "day", "week", "month"].includes(String(interval)) ? String(interval) : "day";
  // Use $dateTrunc for timezone-aware bucket alignment.
  return {
    $dateToString: {
      date: { $dateTrunc: { date: "$createdAt", unit, timezone: METRICS_TZ } },
      format: (unit === "hour") ? "%Y-%m-%d %H:00" : (unit === "month") ? "%Y-%m" : "%Y-%m-%d",
      timezone: METRICS_TZ
    }
  };
}

app.get('/admin/metrics/timeseries', authMiddleware, async (req, res) => {
  try {
    const dataset = String(req.query.dataset || "orders");
    const metric = String(req.query.metric || "orders_count");
    const interval = String(req.query.interval || "day");
    const groupBy = String(req.query.groupBy || "");
    const topN = Math.max(1, Math.min(25, Number(req.query.topN || 5)));

    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from && !isNaN(from.valueOf())) match.createdAt.$gte = from;
      if (to && !isNaN(to.valueOf())) match.createdAt.$lte = to;
    }

    const bucket = metricsBucketExpr(interval);

    let Model;
    if (dataset === "orders") Model = Order;
    else if (dataset === "analytics") Model = AnalyticsEvent;
    else return res.status(400).json({ error: "Unsupported dataset" });

    // Dataset-specific filters
    if (dataset === "orders") {
      const paidOnly = String(req.query.paidOnly || "").toLowerCase() === "true";
      const status = String(req.query.status || "").trim();
      const country = String(req.query.country || "").trim();
      const minPaidEUR = Number(req.query.minPaidEUR || 0);

      if (paidOnly) {
        match.$or = [
          { paidAt: { $ne: null } },
          { status: { $in: ["PAID", "PLACED_WITH_AGENT", "REFUNDED"] } }
        ];
      }
      if (status) match.status = status;
      if (country) match["customer.countryCode"] = country;
      if (Number.isFinite(minPaidEUR) && minPaidEUR > 0) match["pricing.totalPaidEUR"] = { $gte: minPaidEUR };
    } else if (dataset === "analytics") {
      const type = String(req.query.type || "").trim();
      const pathQ = String(req.query.path || "").trim();
      const websiteOrigin = String(req.query.websiteOrigin || "").trim();
      const sessionId = String(req.query.sessionId || "").trim();
      const productLink = String(req.query.productLink || "").trim();

      if (type) match.type = type;
      if (pathQ) match.path = pathQ;
      if (websiteOrigin) match.websiteOrigin = websiteOrigin;
      if (sessionId) match.sessionId = sessionId;
      if (productLink) match["product.productLink"] = productLink;
    }

    // Group key expression
    let groupKeyExpr = "all";
    if (dataset === "orders") {
      if (groupBy === "status") groupKeyExpr = "$status";
      else if (groupBy === "country") groupKeyExpr = "$customer.countryCode";
    } else if (dataset === "analytics") {
      if (groupBy === "type") groupKeyExpr = "$type";
      else if (groupBy === "path") groupKeyExpr = "$path";
      else if (groupBy === "websiteOrigin") groupKeyExpr = "$websiteOrigin";
      else if (groupBy === "productLink") groupKeyExpr = "$product.productLink";
    }

    const needsUnwindItems = (dataset === "orders") && (metric === "items_qty" || metric === "profit_eur");

    const pipeline = [
      { $match: match }
    ];

    if (needsUnwindItems) pipeline.push({ $unwind: "$items" });

    // compute value per doc/line
    const addFields = { bucket, groupKey: (groupKeyExpr === "all") ? "all" : groupKeyExpr };

    if (dataset === "orders") {
      if (metric === "orders_count") addFields.value = 1;
      else if (metric === "revenue_eur") addFields.value = { $ifNull: ["$pricing.totalPaidEUR", 0] };
      else if (metric === "base_revenue_eur") addFields.value = { $ifNull: ["$pricing.baseTotalEUR", 0] };
      else if (metric === "tariff_eur") addFields.value = {
        $multiply: [
          { $ifNull: ["$pricing.baseTotalEUR", 0] },
          { $ifNull: ["$pricing.tariffPct", 0] }
        ]
      };
      else if (metric === "items_qty") addFields.value = { $ifNull: ["$items.quantity", 0] };
      else if (metric === "profit_eur") addFields.value = {
        $multiply: [
          { $subtract: [{ $ifNull: ["$items.unitPriceEUR", 0] }, { $ifNull: ["$items.expectedPurchase", 0] }] },
          { $ifNull: ["$items.quantity", 0] }
        ]
      };
      else return res.status(400).json({ error: "Unsupported metric" });
    } else if (dataset === "analytics") {
      if (metric === "events_count") addFields.value = 1;
      // unique_sessions handled below via $addToSet
      else if (metric !== "unique_sessions") return res.status(400).json({ error: "Unsupported metric" });
    }

    pipeline.push({ $addFields: addFields });

    if (dataset === "analytics" && metric === "unique_sessions") {
      pipeline.push({
        $group: {
          _id: { bucket: "$bucket", groupKey: "$groupKey" },
          sessions: { $addToSet: "$sessionId" }
        }
      });
      pipeline.push({
        $project: {
          _id: 1,
          value: { $size: { $setDifference: ["$sessions", [null, ""]] } }
        }
      });
    } else {
      pipeline.push({
        $group: {
          _id: { bucket: "$bucket", groupKey: "$groupKey" },
          value: { $sum: "$value" }
        }
      });
    }

    pipeline.push({ $sort: { "_id.bucket": 1 } });

    const rows = await Model.aggregate(pipeline).allowDiskUse(true);

    // Build series (and select topN for groupBy)
    const byKey = new Map();
    for (const r of rows || []) {
      const gk = String(r?._id?.groupKey ?? "all");
      const bucketStr = String(r?._id?.bucket ?? "");
      const valueNum = Number(r?.value || 0);
      if (!byKey.has(gk)) byKey.set(gk, []);
      byKey.get(gk).push({ bucket: bucketStr, value: valueNum });
    }

    let keys = Array.from(byKey.keys());
    if (groupBy) {
      // pick topN by total
      keys.sort((a, b) => {
        const sa = (byKey.get(a) || []).reduce((s, p) => s + Number(p.value || 0), 0);
        const sb = (byKey.get(b) || []).reduce((s, p) => s + Number(p.value || 0), 0);
        return sb - sa;
      });
      keys = keys.slice(0, topN);
    }

    const series = keys.map(k => ({
      key: k,
      label: (k === "all") ? "All" : k,
      points: (byKey.get(k) || [])
    }));

    return res.json({ ok: true, series });
  } catch (e) {
    console.error("[metrics] timeseries error", e);
    return res.status(500).json({ error: "timeseries failed" });
  }
});

// ---- Admin analytics settings ----
app.get('/admin/analytics/settings', authMiddleware, async (req, res) => {
  return res.json({ ok: true, settings: analyticsSettings });
});

app.post('/admin/analytics/settings', authMiddleware, async (req, res) => {
  try {
    const next = _normalizeAnalyticsSettings(req.body || {});
    analyticsSettings = next;
    _saveAnalyticsSettings(next);
    return res.json({ ok: true, settings: analyticsSettings });
  } catch (e) {
    console.error("[analytics] settings save error", e);
    return res.status(500).json({ error: "settings save failed" });
  }
});

// ---- Admin analytics listing (for management UI) ----
app.get('/admin/analytics/events', authMiddleware, async (req, res) => {
  try {
    const { from, to, limit = 200, skip = 0 } = req.query;
    const q = {};
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    for (const k of ["type", "path", "websiteOrigin", "sessionId"]) {
      if (req.query[k]) q[k] = String(req.query[k]).trim();
    }
    if (req.query.productLink) q["product.productLink"] = String(req.query.productLink).trim();

    const lim = Math.max(1, Math.min(5000, Number(limit)));
    const sk = Math.max(0, Number(skip) || 0);

    const rows = await AnalyticsEvent.find(q).sort({ createdAt: -1 }).skip(sk).limit(lim).lean();
    return res.json({ ok: true, events: rows });
  } catch (e) {
    console.error("[analytics] list error", e);
    return res.status(500).json({ error: "list failed" });
  }
});



// ---- Admin engagement analytics (derived from AnalyticsEvent) ----
// Derives "faulty" vs "engaged" sessions using analyticsSettings thresholds.
// By default, aggregates exclude faulty sessions. Use ?includeFaulty=1 to include them.

function _bucketKey(d, bucket) {
  const dt = new Date(d);
  if (bucket === "month") return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
  if (bucket === "week") {
    // ISO week approx in UTC
    const tmp = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }
  // day
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

async function _loadEngagementWindow(from, to) {
  const q = { createdAt: {} };
  if (from) q.createdAt.$gte = new Date(from);
  if (to) q.createdAt.$lte = new Date(to);

  // Only fetch relevant event types
  q.type = { $in: ["product_click", "product_open", "product_time", "add_to_cart"] };

  const rows = await AnalyticsEvent.find(q).sort({ createdAt: 1 }).lean();
  return rows || [];
}

function _deriveEngagement(rows) {
  const minMs = Number(analyticsSettings.minEngagedMs || 0);
  const maxMs = Number(analyticsSettings.maxEngagedMs || 0);

  const timeByView = new Map(); // viewToken -> {durationMs, faulty, reason}
  for (const ev of rows) {
    if (ev.type !== "product_time") continue;
    const vt = ev?.extra?.viewToken;
    if (!vt) continue;
    const dur = Number(ev?.extra?.durationMs ?? 0);
    if (!Number.isFinite(dur) || dur <= 0) continue;

    let faulty = false;
    let reason = "";
    if (minMs > 0 && dur < minMs) { faulty = true; reason = "too_short"; }
    if (maxMs > 0 && dur > maxMs) { faulty = true; reason = "too_long"; }

    // keep the last duration for the viewToken
    timeByView.set(String(vt), { durationMs: dur, faulty, reason });
  }

  const engagedViews = new Set();
  const faultyViews = new Set();
  for (const [vt, info] of timeByView.entries()) {
    if (info.faulty) faultyViews.add(vt);
    else engagedViews.add(vt);
  }

  // clickToken -> engaged? (if click led to an engaged view)
  const clickToEngaged = new Map();
  for (const ev of rows) {
    if (ev.type !== "product_open") continue;
    const vt = String(ev?.extra?.viewToken || "");
    const ct = String(ev?.extra?.clickToken || "");
    if (!ct || !vt) continue;
    clickToEngaged.set(ct, engagedViews.has(vt));
  }

  return { timeByView, engagedViews, faultyViews, clickToEngaged };
}

function _eventDerivedQuality(ev, derived) {
  const vt = String(ev?.extra?.viewToken || "");
  const ct = String(ev?.extra?.clickToken || "");

  // If linked to viewToken duration, use it
  if (vt && derived.timeByView.has(vt)) {
    const info = derived.timeByView.get(vt);
    return {
      isFaulty: !!info.faulty,
      faultyReason: info.faulty ? info.reason : "",
      durationMs: info.durationMs || 0
    };
  }

  // For product_click, optionally tie to engagement
  if (ev.type === "product_click" && analyticsSettings.linkClicksToEngagement && ct) {
    if (derived.clickToEngaged.has(ct)) {
      const ok = !!derived.clickToEngaged.get(ct);
      return { isFaulty: !ok, faultyReason: ok ? "" : "unengaged_click", durationMs: 0 };
    }
  }

  // Unknown quality (no duration) -> treat as faulty in aggregates, but keep visible in raw.
  return { isFaulty: true, faultyReason: "no_duration", durationMs: 0 };
}

app.get('/admin/analytics/engagement/summary', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    const bucket = String(req.query.bucket || "day").toLowerCase();
    const includeFaulty = String(req.query.includeFaulty || "0") === "1";

    const rows = await _loadEngagementWindow(from, to);
    const derived = _deriveEngagement(rows);

    const byBucket = new Map(); // key -> {views, clicks, addToCart, avgTimeSum, avgTimeN, faultyViews}
    function ensure(k) {
      if (!byBucket.has(k)) byBucket.set(k, { views: 0, clicks: 0, addToCart: 0, avgTimeSum: 0, avgTimeN: 0, faultyViews: 0 });
      return byBucket.get(k);
    }

    for (const ev of rows) {
      const k = _bucketKey(ev.createdAt || ev.ts || Date.now(), bucket);
      const agg = ensure(k);
      const q = _eventDerivedQuality(ev, derived);

      const countable = includeFaulty ? true : !q.isFaulty;

      if (ev.type === "product_open") {
        if (countable) agg.views += 1;
        else agg.faultyViews += 1;
      } else if (ev.type === "product_click") {
        if (countable) agg.clicks += 1;
      } else if (ev.type === "add_to_cart") {
        if (countable) agg.addToCart += 1;
      } else if (ev.type === "product_time") {
        // product_time itself represents duration; average on engaged views only
        if (!q.isFaulty && q.durationMs > 0) {
          agg.avgTimeSum += q.durationMs;
          agg.avgTimeN += 1;
        } else if (includeFaulty && q.durationMs > 0) {
          // includeFaulty: still expose avgTime across all durations
          agg.avgTimeSum += q.durationMs;
          agg.avgTimeN += 1;
        }
      }
    }

    const keys = Array.from(byBucket.keys()).sort();
    const series = keys.map(k => {
      const a = byBucket.get(k);
      const avgTimeMs = a.avgTimeN ? Math.round(a.avgTimeSum / a.avgTimeN) : 0;
      return { bucket: k, views: a.views, clicks: a.clicks, addToCart: a.addToCart, avgTimeMs, faultyViews: a.faultyViews };
    });

    // Totals
    const totals = series.reduce((acc, p) => {
      acc.views += p.views;
      acc.clicks += p.clicks;
      acc.addToCart += p.addToCart;
      acc.faultyViews += p.faultyViews;
      acc.avgTimeSum += (p.avgTimeMs * (p.views || 1)); // coarse; good enough for header display
      return acc;
    }, { views: 0, clicks: 0, addToCart: 0, faultyViews: 0, avgTimeSum: 0 });

    return res.json({
      ok: true,
      settings: analyticsSettings,
      totals: {
        views: totals.views,
        clicks: totals.clicks,
        addToCart: totals.addToCart,
        faultyViews: totals.faultyViews
      },
      series
    });
  } catch (e) {
    console.error("[analytics] engagement summary error", e);
    return res.status(500).json({ error: "engagement summary failed" });
  }
});

app.get('/admin/analytics/engagement/top-products', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    const metric = String(req.query.metric || "views").toLowerCase();
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 30)));
    const includeFaulty = String(req.query.includeFaulty || "0") === "1";

    const rows = await _loadEngagementWindow(from, to);
    const derived = _deriveEngagement(rows);

    const byPid = new Map(); // productLink or name -> stats
    function keyFor(ev) {
      const p = ev.product || {};
      return String(p.productLink || p.name || ev?.extra?.productId || "").trim() || "unknown";
    }
    function ensure(k, ev) {
      if (!byPid.has(k)) byPid.set(k, { key: k, name: ev?.product?.name || "", productLink: ev?.product?.productLink || "", views: 0, clicks: 0, addToCart: 0, avgTimeSum: 0, avgTimeN: 0, faultyViews: 0 });
      return byPid.get(k);
    }

    for (const ev of rows) {
      const k = keyFor(ev);
      const s = ensure(k, ev);
      const q = _eventDerivedQuality(ev, derived);
      const countable = includeFaulty ? true : !q.isFaulty;

      if (ev.type === "product_open") {
        if (countable) s.views += 1;
        else s.faultyViews += 1;
      } else if (ev.type === "product_click") {
        if (countable) s.clicks += 1;
      } else if (ev.type === "add_to_cart") {
        if (countable) s.addToCart += 1;
      } else if (ev.type === "product_time") {
        if ((!q.isFaulty || includeFaulty) && q.durationMs > 0) {
          s.avgTimeSum += q.durationMs;
          s.avgTimeN += 1;
        }
      }
    }

    const rowsOut = Array.from(byPid.values()).map(r => ({
      ...r,
      avgTimeMs: r.avgTimeN ? Math.round(r.avgTimeSum / r.avgTimeN) : 0
    }));

    const sortKey = (metric === "clicks") ? "clicks"
      : (metric === "addtocart" || metric === "add_to_cart") ? "addToCart"
        : (metric === "time") ? "avgTimeMs"
          : "views";

    rowsOut.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
    return res.json({ ok: true, settings: analyticsSettings, products: rowsOut.slice(0, limit) });
  } catch (e) {
    console.error("[analytics] top products error", e);
    return res.status(500).json({ error: "top products failed" });
  }
});

app.get('/admin/analytics/engagement/events', authMiddleware, async (req, res) => {
  try {
    const { from, to, limit = 500, skip = 0 } = req.query;
    const includeFaulty = String(req.query.includeFaulty || "0") === "1";

    const rows = await _loadEngagementWindow(from, to);
    const derived = _deriveEngagement(rows);

    // Apply pagination after sort (rows already sorted)
    const sk = Math.max(0, Number(skip) || 0);
    const lim = Math.max(1, Math.min(5000, Number(limit)));

    const slice = rows.slice(Math.max(0, rows.length - (sk + lim)), rows.length - sk); // newest-first slice
    const enriched = slice.map(ev => {
      const q = _eventDerivedQuality(ev, derived);
      return { ...ev, derived: q };
    }).filter(ev => includeFaulty ? true : !ev.derived.isFaulty);

    // return newest first
    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ ok: true, settings: analyticsSettings, events: enriched });
  } catch (e) {
    console.error("[analytics] engagement events error", e);
    return res.status(500).json({ error: "events failed" });
  }
});

app.post('/analytics/event', analyticsLimiter, async (req, res) => {
  try {
    const ff = getFeatureFlagsRuntimeSyncBestEffort();
    if (!ff?.analyticsIngest?.enabled || !analyticsSettings.collectionEnabled) return res.json({ ok: true, disabled: true });
    const { type, sessionId, path, websiteOrigin, product, extra } = req.body || {};
    const cleanStr = (v, max = 500) => String(v == null ? "" : v).trim().slice(0, max);

    function sanitizeMixed(v, depth = 0) {
      if (v == null) return undefined;
      if (depth > 4) return undefined;
      const t = typeof v;
      if (t === "string") return v.slice(0, 800);
      if (t === "number") return Number.isFinite(v) ? v : undefined;
      if (t === "boolean") return v;
      if (Array.isArray(v)) {
        return v.slice(0, 50).map(x => sanitizeMixed(x, depth + 1)).filter(x => x !== undefined);
      }
      if (t === "object") {
        const out = {};
        const keys = Object.keys(v).slice(0, 50);
        for (const k of keys) {
          const kk = String(k).slice(0, 60);
          const vv = sanitizeMixed(v[k], depth + 1);
          if (vv !== undefined) out[kk] = vv;
        }
        return out;
      }
      return undefined;
    }

    const safeType = cleanStr(type, 80);
    const safeSessionId = cleanStr(sessionId, 120) || null;
    const safePath = cleanStr(path || req.path, 300);
    const safeOrigin = cleanStr(websiteOrigin, 200) || null;

    const safeProduct = (product && typeof product === "object") ? {
      name: cleanStr(product.name, 200),
      category: cleanStr(product.category, 120),
      productLink: cleanStr(product.productLink, 500),
      priceEUR: (product.priceEUR == null) ? undefined : (parseDecimalLoose(product.priceEUR) || 0)
    } : undefined;

    let safeExtraFinal = sanitizeMixed(extra, 0);

    // Server-side A/B assignments for consistent analytics (client payload can be spoofed).
    try {
      const ab = await computeAbExperimentsForRequest(req, res);
      const ex = (ab && ab.experiments && typeof ab.experiments === "object") ? ab.experiments : {};
      if (safeExtraFinal && typeof safeExtraFinal === "object" && !Array.isArray(safeExtraFinal)) {
        const prev = (safeExtraFinal.experiments && typeof safeExtraFinal.experiments === "object") ? safeExtraFinal.experiments : {};
        safeExtraFinal.experiments = { ...prev, ...ex };
      } else {
        safeExtraFinal = { experiments: ex };
      }
    } catch { }

    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    await AnalyticsEvent.create({
      type: safeType,
      sessionId: safeSessionId,
      path: safePath,
      websiteOrigin: safeOrigin,
      product: safeProduct,
      userAgent: req.get('user-agent') || '',
      referrer: req.get('referer') || '',
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '',
      extra: safeExtraFinal
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('[analytics] create error', e);
    return res.status(500).json({ error: 'analytics failed' });
  }
});
function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyOrderCreatedWebhook(req, res, next) {
  try {
    const secret = process.env.ORDER_CREATED_WEBHOOK_SECRET;
    if (!secret) return res.status(500).json({ error: 'webhook secret not configured' });

    const sig = req.get('X-Order-Signature') || '';
    const ts = req.get('X-Order-Timestamp') || '';

    // basic replay protection (5 minutes)
    const now = Date.now();
    const tsMs = Number(ts);
    if (!Number.isFinite(tsMs)) return res.status(401).json({ error: 'missing timestamp' });
    if (Math.abs(now - tsMs) > 5 * 60 * 1000) return res.status(401).json({ error: 'stale timestamp' });

    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}), 'utf8');

    // Sign: HMAC_SHA256( `${ts}.${rawBody}` )
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${ts}.`)
      .update(raw)
      .digest('hex');

    if (!timingSafeEqualStr(sig, expected)) return res.status(401).json({ error: 'bad signature' });
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'signature verification failed' });
  }
}

const orderCreatedWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // adjust as you like
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/webhook/order-created', orderCreatedWebhookLimiter, verifyOrderCreatedWebhook, async (req, res) => {
  try {
    const payload = req.body || {};
    const orderId = String(payload.orderId || '').trim();
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    // Prevent duplicates
    const exists = await Order.findOne({ orderId });
    if (exists) return res.json({ ok: true, id: exists.orderId, duplicated: true });

    // Sanitize inputs (don’t trust arbitrary shape/sizes)
    const safeCustomer = (payload.customer && typeof payload.customer === 'object') ? payload.customer : {};
    const safeItems = Array.isArray(payload.items) ? payload.items.slice(0, 200) : [];
    const safePricing = (payload.pricing && typeof payload.pricing === 'object') ? payload.pricing : {};

    // IMPORTANT: do NOT accept status from the webhook caller
    const doc = await Order.create({
      orderId,
      customer: safeCustomer,
      items: safeItems,
      pricing: safePricing,
      status: 'NEW'
    });

    return res.json({ ok: true, id: doc.orderId });
  } catch (e) {
    console.error('webhook error', e);
    return res.status(500).json({ error: 'insert failed' });
  }
});


// Health
app.get('/healthz', (req, res) => res.json({ ok: true }));


function toEUR(amount, currency) {
  const amt = Number(amount || 0);
  const code = String(currency || "EUR").toUpperCase();
  if (code === "EUR") return amt;

  const rate = cachedRates?.rates?.[code];
  if (Number.isFinite(rate) && rate > 0) {
    return amt / rate;
  }

  // fallback (only really meaningful for USD if you set it)
  const fallbackUsd = Number(process.env.EUR_RATE_USD || 1.08);
  if (code === "USD" && Number.isFinite(fallbackUsd) && fallbackUsd > 0) {
    return amt / fallbackUsd;
  }

  // last-resort: treat unknown currency as already-EUR
  return amt;
}

function mapAgentStatus(s) {
  const t = String(s || '').toLowerCase();
  if (['placed', 'accepted', 'created'].includes(t)) return 'PLACED';
  if (['label_created', 'label', 'ready'].includes(t)) return 'LABEL_CREATED';
  if (['in_transit', 'transit', 'shipped', 'pickup'].includes(t)) return 'IN_TRANSIT';
  if (['delivered', 'complete'].includes(t)) return 'DELIVERED';
  if (['cancelled', 'canceled'].includes(t)) return 'CANCELLED';
  if (['failed', 'error', 'rejected'].includes(t)) return 'FAILED';
  return 'PLACED';
}

// Generic agent HTTP client (adjust paths to your provider when you choose one)
async function agentQuote({ to, packages, customs }) {
  const base = process.env.AGENT_URL?.replace(/\/+$/, '');
  const r = await axios.post(`${base}/quote`, { to, packages, customs }, {
    headers: { Authorization: `Bearer ${process.env.AGENT_API_KEY}` }, timeout: 15000
  });
  const d = r.data || {};
  return { amount: d.amount, currency: d.currency || 'EUR', service: d.service || 'DDP', raw: d };
}

async function agentPlaceOrder(order, { packages, customs }) {
  const base = process.env.AGENT_URL?.replace(/\/+$/, '');
  const to = {
    name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
    address1: order.customer?.address1 || '',
    city: order.customer?.city || '',
    postalCode: order.customer?.postalCode || '',
    country: order.customer?.countryCode || '',
    phone: order.customer?.phone || '',
    email: order.customer?.email || ''
  };
  const items = (order.items || []).map(it => ({ description: it.name, quantity: it.quantity, unitValueEUR: it.unitPriceEUR }));
  const payload = {
    externalId: order.orderId,
    to, packages,
    customs: customs && customs.contents ? customs : { contents: items, totalValueEUR: (order.pricing?.totalPaidEUR || 0), incoterm: 'DDP' }
  };
  const r = await axios.post(`${base}/orders`, payload, {
    headers: { Authorization: `Bearer ${process.env.AGENT_API_KEY}` }, timeout: 20000
  });
  const d = r.data || {};
  return {
    orderRef: d.id || d.reference || d.orderRef || `AG-${order.orderId}`,
    status: mapAgentStatus(d.status || 'PLACED'),
    service: d.service || 'DDP',
    amount: d.amount || d.price || 0,
    currency: d.currency || 'EUR',
    labelUrl: d.labelUrl || '',
    tracking: d.tracking ? [{ code: d.tracking.code || d.tracking, carrier: d.tracking.carrier || '', url: d.tracking.url || '' }] : [],
    raw: d
  };
}

async function agentCancel(orderRef) {
  try {
    const base = process.env.AGENT_URL?.replace(/\/+$/, '');
    const r = await axios.post(`${base}/orders/${encodeURIComponent(orderRef)}/cancel`, {}, {
      headers: { Authorization: `Bearer ${process.env.AGENT_API_KEY}` }, timeout: 15000
    });
    return !!(r.data?.ok ?? true);
  } catch {
    return false;
  }
}
// GET fulfillment snapshot for an order
app.get('/admin/orders/:id/fulfillment', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const doc = await Order.findOne(buildOrderLookup(id), { fulfillment: 1, customer: 1 }).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc.fulfillment || {});
});

// PATCH fulfillment editable fields (method/packages/customs/self)
app.patch('/admin/orders/:id/fulfillment', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  const set = {};
  if (payload.method) set['fulfillment.method'] = String(payload.method).toUpperCase();
  if (payload.packages) set['fulfillment.packages'] = Array.isArray(payload.packages) ? payload.packages : [];
  if (payload.customs) set['fulfillment.customs'] = payload.customs;
  if (payload.self) set['fulfillment.self'] = payload.self;
  const doc = await Order.findOneAndUpdate(buildOrderLookup(id), { $set: set, $currentDate: { updatedAt: true } }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true, fulfillment: doc.fulfillment });
});

// Quote (AGENT or simulated) or SELF (always 0 server-side)
app.post('/admin/orders/:id/fulfillment/quote', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { method = 'AGENT', packages = [], customs = {} } = req.body || {};
  const order = await Order.findOne(buildOrderLookup(id)).lean();
  if (!order) return res.status(404).json({ error: 'Not found' });

  const to = {
    name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
    address1: order.customer?.address1 || '',
    city: order.customer?.city || '',
    postalCode: order.customer?.postalCode || '',
    country: order.customer?.countryCode || '',
    phone: order.customer?.phone || '',
    email: order.customer?.email || ''
  };

  try {
    let quote;
    if (String(method).toUpperCase() === 'SELF') {
      quote = { method: 'SELF', currency: 'EUR', amount: 0, provider: null };
    } else if (process.env.AGENT_URL && process.env.AGENT_API_KEY) {
      quote = await agentQuote({ to, packages, customs });
    } else {
      // simulated quote if no agent configured
      const totalWeight = (packages || []).reduce((s, p) => s + Number(p.weightKg || 0), 0);
      quote = { method: 'AGENT', provider: process.env.AGENT_NAME || 'ddp-agent', currency: 'EUR', amount: +(6.5 * totalWeight + 12).toFixed(2), simulated: true };
    }
    res.json({ ok: true, quote });
  } catch (e) {
    res.status(500).json({ error: 'quote failed' });
  }
});

// Place shipment (SELF or AGENT)
app.post('/admin/orders/:id/fulfillment/place', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { method = 'AGENT', packages = [], customs = {}, self = {} } = req.body || {};
  const order = await Order.findOne(buildOrderLookup(id));
  if (!order) return res.status(404).json({ error: 'Not found' });

  try {
    if (String(method).toUpperCase() === 'SELF') {
      order.fulfillment = order.fulfillment || {};
      order.fulfillment.method = 'SELF';
      order.fulfillment.self = { carrier: self.carrier || '', service: self.service || '', tracking: self.tracking || [], costEUR: toEUR(self.cost, self.currency || 'EUR') };
      order.status = 'PLACED_WITH_AGENT'; // or any status you prefer for “placed”
      await order.save();
      return res.json({ ok: true, fulfillment: order.fulfillment });
    }

    if (!(process.env.AGENT_URL && process.env.AGENT_API_KEY)) {
      // simulate agent placement
      const tracking = [{ code: `MOCK${Date.now().toString().slice(-6)}`, carrier: 'MockCarrier', url: '' }];
      order.fulfillment = {
        method: 'AGENT',
        packages, customs,
        agent: { provider: process.env.AGENT_NAME || 'ddp-agent', orderRef: `SIM-${order.orderId}`, status: 'PLACED', service: 'DDP', costEUR: 25.00, currency: 'EUR', tracking, lastEvent: new Date(), raw: { simulated: true } }
      };
      order.status = 'PLACED_WITH_AGENT';
      await order.save();
      return res.json({ ok: true, fulfillment: order.fulfillment, simulated: true });
    }

    const placed = await agentPlaceOrder(order, { packages, customs });
    order.fulfillment = order.fulfillment || {};
    order.fulfillment.method = 'AGENT';
    order.fulfillment.packages = packages;
    order.fulfillment.customs = customs;
    order.fulfillment.agent = {
      provider: process.env.AGENT_NAME || 'ddp-agent',
      orderRef: placed.orderRef,
      status: placed.status || 'PLACED',
      service: placed.service || 'DDP',
      costEUR: toEUR(placed.amount, placed.currency || 'EUR'),
      currency: placed.currency || 'EUR',
      labelUrl: placed.labelUrl || '',
      tracking: placed.tracking || [],
      lastEvent: new Date(),
      raw: placed.raw || {}
    };
    order.status = 'PLACED_WITH_AGENT';
    await order.save();
    res.json({ ok: true, fulfillment: order.fulfillment });
  } catch (e) {
    res.status(500).json({ error: 'place failed' });
  }
});

// Cancel agent order (best-effort)
app.post('/admin/orders/:id/fulfillment/cancel', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne(buildOrderLookup(id));
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (order.fulfillment?.method !== 'AGENT' || !order.fulfillment?.agent?.orderRef) {
    return res.status(400).json({ error: 'not an agent order' });
  }
  let ok = true;
  if (process.env.AGENT_URL && process.env.AGENT_API_KEY) ok = await agentCancel(order.fulfillment.agent.orderRef);
  order.fulfillment.agent.status = 'CANCELLED';
  await order.save();
  res.json({ ok });
});
app.post('/admin/agents/:provider/webhook', agentWebhookAuth, async (req, res) => {
  try {
    const secret = String(process.env.AGENT_WEBHOOK_SECRET || '').trim();
    if (!secret) return res.status(503).send('webhook not configured');

    const sig = String(req.get('X-Agent-Signature') || '').trim();

    const raw =
      (req.rawBody && Buffer.isBuffer(req.rawBody)) ? req.rawBody :
        (req.rawBody ? Buffer.from(req.rawBody) :
          (Buffer.isBuffer(req.body) ? req.body :
            Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8')
          )
        );

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (!sig || !timingSafeEqualHex(sig, expected)) return res.status(401).send('bad signature');

    const text = raw.toString('utf8');
    let payload; try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    const ref = payload.orderRef || payload.id || payload.reference;
    if (!ref) return res.status(400).json({ error: 'no order ref' });

    const order = await Order.findOne({ 'fulfillment.agent.orderRef': ref });
    if (!order) return res.status(404).json({ error: 'order not found' });

    const status = mapAgentStatus(payload.status || payload.event || '');
    order.fulfillment = order.fulfillment || { method: 'AGENT', agent: {} };
    order.fulfillment.agent = order.fulfillment.agent || {};
    order.fulfillment.agent.status = status || order.fulfillment.agent.status || 'PLACED';
    order.fulfillment.agent.lastEvent = new Date();

    if (payload.trackingCode) {
      const t = { code: payload.trackingCode, carrier: payload.carrier || '', url: payload.trackingUrl || '' };
      const arr = order.fulfillment.agent.tracking || [];
      if (!arr.find(x => x.code === t.code)) arr.push(t);
      order.fulfillment.agent.tracking = arr;
    }

    await order.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'webhook failed' });
  }
});
// DEBUG_ROUTES wrapper removed (cleanup)
/* ===================== Tariffs store (disk → RAM cache) ===================== *
 * Goal:
 *  - Keep tariffs.json in a dedicated folder (created automatically)
 *  - Load once into RAM + precompute JSON payload (so requests are fast)
 *  - Auto-refresh RAM when the file changes (watchFile polling)
 *  - Allow admin upload/replace via management frontend
 */
const CANONICAL_TARIFFS_PATH = path.join(__dirname, 'tariffs.json'); // optional seed (tracked in Git)
const TARIFFS_DIR = path.join(DATA_DIR, 'tariffs');
const LOCAL_TARIFFS_PATH = path.join(TARIFFS_DIR, 'tariffs.json');

let tariffsData = Object.create(null);   // canonical in-memory object
let tariffsJsonCache = '{}\n';           // precomputed JSON string for fast responses
let tariffsETag = null;                 // hash of tariffsJsonCache
let tariffsLocalMtimeMs = 0;            // last known mtime for LOCAL_TARIFFS_PATH
let _tariffsReloadTimer = null;

function ensureTariffsDir() {
  ensureDataDir();
  if (!fs.existsSync(TARIFFS_DIR)) fs.mkdirSync(TARIFFS_DIR, { recursive: true });
}

function _validateTariffsObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('tariffs.json must be a JSON object of { "US": 0.6, ... }');
  }
  const out = Object.create(null);
  for (const [k, v] of Object.entries(obj)) {
    const code = String(k || '').trim().toUpperCase();
    if (!code) continue;

    // Allow 2-letter country codes, or longer ("EU", "UK", etc.)
    if (code.length < 2 || code.length > 10) {
      throw new Error(`Invalid country code key "${k}" in tariffs.json`);
    }

    // Allow numbers only (including 0); treat null/undefined as absent
    if (v == null) continue;
    const num = Number(v);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error(`Invalid tariff value for "${code}": ${v}`);
    }
    out[code] = num;
  }
  return out;
}

function _parseTariffsFromJsonText(txt) {
  if (typeof txt !== 'string' || !txt.trim()) throw new Error('Empty tariffs payload');
  let parsed;
  try {
    parsed = JSON.parse(txt);
  } catch {
    throw new Error('Invalid JSON (tariffs.json)');
  }
  return _validateTariffsObject(parsed);
}

function writeTariffsJson(file, obj) {
  ensureTariffsDir();
  const json = JSON.stringify(obj, null, 2) + '\n';
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, file); // atomic on same filesystem
}

function setTariffsInMemory(obj, reason = 'setTariffsInMemory') {
  const validated = _validateTariffsObject(obj);
  tariffsData = validated;
  tariffsJsonCache = JSON.stringify(validated) + '\n';
  tariffsETag = crypto.createHash('sha1').update(tariffsJsonCache).digest('hex');

  try {
    tariffsLocalMtimeMs = fs.existsSync(LOCAL_TARIFFS_PATH) ? fs.statSync(LOCAL_TARIFFS_PATH).mtimeMs : 0;
  } catch { /* ignore */ }

  console.log(`[tariffs] RAM cache refreshed (${reason}) keys=${Object.keys(tariffsData).length}`);
}

function loadTariffsFromDisk() {
  ensureTariffsDir();

  // First boot seed: copy canonical (root tariffs.json) if present, else create empty
  if (!fs.existsSync(LOCAL_TARIFFS_PATH)) {
    if (fs.existsSync(CANONICAL_TARIFFS_PATH)) {
      const buf = fs.readFileSync(CANONICAL_TARIFFS_PATH, 'utf8');
      const seeded = _parseTariffsFromJsonText(buf);
      writeTariffsJson(LOCAL_TARIFFS_PATH, seeded);
    } else {
      writeTariffsJson(LOCAL_TARIFFS_PATH, Object.create(null));
    }
  }

  const raw = fs.readFileSync(LOCAL_TARIFFS_PATH, 'utf8');
  return _parseTariffsFromJsonText(raw);
}

function reloadTariffsFromDisk(reason = 'reloadTariffsFromDisk') {
  try {
    const mtime = fs.statSync(LOCAL_TARIFFS_PATH).mtimeMs;
    if (mtime && mtime === tariffsLocalMtimeMs) return; // no change
  } catch { /* ignore */ }

  try {
    const obj = loadTariffsFromDisk();
    setTariffsInMemory(obj, reason);
  } catch (e) {
    console.warn('[tariffs] reload failed; keeping last known good:', e?.message || e);
  }
}

function startTariffsAutoRefresh() {
  try {
    ensureTariffsDir();

    // Ensure exists, then start watcher
    if (!fs.existsSync(LOCAL_TARIFFS_PATH)) {
      setTariffsInMemory(loadTariffsFromDisk(), 'startTariffsAutoRefresh seed');
    }

    // watchFile (polling) is usually more reliable than fs.watch on servers/containers
    fs.watchFile(LOCAL_TARIFFS_PATH, { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      if (getCatalogFileMode() !== "products_js") return;

      if (_tariffsReloadTimer) clearTimeout(_tariffsReloadTimer);
      _tariffsReloadTimer = setTimeout(() => {
        try {
          const mtime = fs.statSync(LOCAL_TARIFFS_PATH).mtimeMs;
          if (mtime === tariffsLocalMtimeMs) return;
        } catch { /* ignore */ }
        reloadTariffsFromDisk('watchFile change');
      }, 250);
    });

    console.log(`[tariffs] auto-refresh enabled (watching ${LOCAL_TARIFFS_PATH})`);
  } catch (e) {
    console.warn('[tariffs] failed to start auto-refresh:', e?.message || e);
  }
}

function initialiseTariffsStore() {
  ensureTariffsDir();
  // Seed + warm RAM on boot
  try {
    const obj = loadTariffsFromDisk();
    setTariffsInMemory(obj, 'boot');
  } catch (e) {
    console.warn('[tariffs] init failed; using empty tariffs:', e?.message || e);
    setTariffsInMemory(Object.create(null), 'boot fallback');
  }
}

function getTariffPctForCountry(countryCode) {
  const code = (countryCode ? String(countryCode).trim().toUpperCase() : '');
  if (!code) return 0;
  const v = tariffsData?.[code];
  return (v == null) ? 0 : (Number(v) || 0);
}

function sendTariffsJson(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (tariffsETag) res.setHeader('ETag', tariffsETag);
  if (tariffsLocalMtimeMs) res.setHeader('Last-Modified', new Date(tariffsLocalMtimeMs).toUTCString());
  res.send(tariffsJsonCache);
}



const VERIFY_PRODUCTS = String(process.env.VERIFY_PRODUCTS).toLowerCase() === "true";
let google = null;
try {
  ({ google } = require("googleapis"));
} catch (e) {
  if (e && e.code === "MODULE_NOT_FOUND") {
    console.warn("⚠️ googleapis not installed; Google Drive/Sheets features disabled.");
  } else {
    throw e;
  }
}


const WAIT_FOR_STRIPE_CONFIRMATION = process.env.WAIT_FOR_STRIPE_CONFIRMATION === "true";


// --- Google API (Drive/Sheets) credentials ---
// IMPORTANT: never hardcode service-account keys in source.
// Configure via:
//   - GOOGLE_SERVICE_ACCOUNT_JSON (stringified JSON)
//   - GOOGLE_SERVICE_ACCOUNT_B64  (base64 of JSON)
//   - GOOGLE_SERVICE_ACCOUNT_PATH (absolute/relative file path to JSON)
function loadGoogleServiceAccount() {
  try {
    const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (rawJson && rawJson.trim()) return JSON.parse(rawJson);

    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
    if (b64 && b64.trim()) {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      return JSON.parse(decoded);
    }

    const p = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (p && p.trim()) {
      const abs = path.isAbsolute(p) ? p : path.join(__dirname, p);
      const file = fs.readFileSync(abs, "utf8");
      return JSON.parse(file);
    }
  } catch (e) {
    console.error("❌ Failed to load GOOGLE_SERVICE_ACCOUNT_* credentials:", e?.message || e);
  }
  return null;
}

const googleServiceAccount = loadGoogleServiceAccount();

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

const googleAuth = googleServiceAccount
  ? new google.auth.GoogleAuth({ credentials: googleServiceAccount, scopes: SCOPES })
  : null;

const drive = googleAuth ? google.drive({ version: 'v3', auth: googleAuth }) : null;
const sheets = googleAuth ? google.sheets({ version: 'v4', auth: googleAuth }) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ---- Product Catalog (file-backed) ----
const productsFilePath = path.join(__dirname, 'ServerProducts.js');

// ---- Product Catalog (file-backed; LOCAL mirror is the source of truth) ----

// ===== Catalog file source + versioning =====
const CATALOG_DIR = path.join(__dirname, "data", "catalog");
const CATALOG_FILE = path.join(CATALOG_DIR, "catalog.json");
const CATALOG_VERSIONS_DIR = path.join(CATALOG_DIR, "versions");
try { fs.mkdirSync(CATALOG_DIR, { recursive: true }); } catch { }
try { fs.mkdirSync(CATALOG_VERSIONS_DIR, { recursive: true }); } catch { }

// ===== Split catalog (two-file) storage =====
// Folder will contain:
//  - ProductCatalog.json  (productsById)
//  - CategoryCatalog.json (categories -> { icon?, productIds[] })
// plus a small mode file to choose file-backed source of truth.
const CATALOG_SPLIT_DIR = path.join(__dirname, "data", "catalog_split");
const CATALOG_SPLIT_PRODUCTS_FILE = path.join(CATALOG_SPLIT_DIR, "ProductCatalog.json");
const CATALOG_SPLIT_CATEGORIES_FILE = path.join(CATALOG_SPLIT_DIR, "CategoryCatalog.json");
const CATALOG_FILEMODE_PATH = path.join(CATALOG_SPLIT_DIR, "filemode.json"); // { mode: "products_js" | "split_json" }

try { fs.mkdirSync(CATALOG_SPLIT_DIR, { recursive: true }); } catch { }

let CATALOG_FILE_MODE = "products_js";
try {
  if (fs.existsSync(CATALOG_FILEMODE_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(CATALOG_FILEMODE_PATH, "utf-8"));
    const m = String(parsed?.mode || "").trim();
    if (m === "split_json" || m === "products_js") CATALOG_FILE_MODE = m;
  } else {
    fs.writeFileSync(CATALOG_FILEMODE_PATH, JSON.stringify({ mode: CATALOG_FILE_MODE, updatedAt: new Date().toISOString() }, null, 2), "utf-8");
  }
} catch { }

function nowStamp() {
  // YYYYMMDD_HHMMSS
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function snapshotCatalog(reason = "change") {
  const stamp = nowStamp();
  const jsonPath = path.join(CATALOG_VERSIONS_DIR, `catalog_${stamp}.json`);
  const dbPath = path.join(CATALOG_VERSIONS_DIR, `db_products_${stamp}.json`);
  const metaPath = path.join(CATALOG_VERSIONS_DIR, `meta_${stamp}.json`);

  // JSON snapshot
  try {
    fs.writeFileSync(jsonPath, catalogBundleJsonCache || "{}", "utf-8");
  } catch { }

  // DB snapshot (products only)
  try {
    const products = await Product.find({}).lean();
    fs.writeFileSync(dbPath, JSON.stringify({ exportedAt: new Date().toISOString(), count: products.length, products }, null, 2), "utf-8");
    fs.writeFileSync(metaPath, JSON.stringify({
      stamp,
      reason,
      createdAt: new Date().toISOString(),
      jsonFile: path.basename(jsonPath),
      dbFile: path.basename(dbPath),
      products: products.length
    }, null, 2), "utf-8");
  } catch {
    // still write meta if possible
    try {
      fs.writeFileSync(metaPath, JSON.stringify({ stamp, reason, createdAt: new Date().toISOString(), jsonFile: path.basename(jsonPath), dbFile: path.basename(dbPath), products: null }, null, 2), "utf-8");
    } catch { }
  }

  return { stamp, jsonPath, dbPath, metaPath };
}

function listCatalogVersions() {
  const files = fs.readdirSync(CATALOG_VERSIONS_DIR).filter(f => f.startsWith("meta_") && f.endsWith(".json"));
  const items = [];
  for (const f of files) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(CATALOG_VERSIONS_DIR, f), "utf-8"));
      items.push(meta);
    } catch { }
  }
  items.sort((a, b) => String(b.stamp || "").localeCompare(String(a.stamp || "")));
  return items;
}

async function syncCatalogToDb(bundle) {
  const productsById = bundle?.productsById || {};
  const categories = bundle?.categories || {};

  // build reverse categories map: productId -> categories[]
  const catMap = {};
  for (const [cat, ids] of Object.entries(categories)) {
    for (const id of (ids || [])) {
      const pid = String(id || "").trim();
      if (!pid) continue;
      if (!catMap[pid]) catMap[pid] = [];
      catMap[pid].push(String(cat));
    }
  }

  const normLink = (u) => {
    const s = String(u || "").trim();
    if (!s) return "";
    return s.split("#")[0].split("?")[0].trim();
  };

  const extractAliExpressItemId = (u) => {
    const s = String(u || "");
    if (!s) return "";
    let m = s.match(/\/item\/(\d+)\.html/i);
    if (m && m[1]) return m[1];
    m = s.match(/\/i\/(\d+)\.html/i);
    if (m && m[1]) return m[1];
    m = s.match(/(?:^|[^0-9])(\d{10,})(?:[^0-9]|$)/);
    return (m && m[1]) ? m[1] : "";
  };

  // Prefetch existing docs by productLink so we reuse the same productId across repeated imports.
  const allLinks = [];
  for (const [, p] of Object.entries(productsById)) {
    const link = normLink(p?.productLink || p?.canonicalLink || "");
    if (link) allLinks.push(link);
  }

  const existingByLink = Object.create(null);
  if (allLinks.length) {
    const existing = await Product.find(
      { productLink: { $in: allLinks } },
      { productId: 1, productLink: 1 }
    ).lean();

    for (const e of existing) {
      const k = normLink(e?.productLink || "");
      if (k) existingByLink[k] = String(e?.productId || "");
    }
  }

  const ops = [];
  for (const [pid, p] of Object.entries(productsById)) {
    const rawPid = String(pid || "").trim();
    const productLink = normLink(p?.productLink || "");
    const canonicalLink = normLink(p?.canonicalLink || "");
    const linkKey = productLink || canonicalLink;

    // Stable productId strategy:
    // 1) If an existing product with same productLink exists => reuse its productId (prevents dupes forever)
    // 2) Else if we can extract AliExpress numeric item id from link => use that
    // 3) Else fallback to catalog key pid
    const existingPid = linkKey ? (existingByLink[linkKey] || "") : "";
    const aliId = extractAliExpressItemId(linkKey);
    const stablePid = existingPid || aliId || rawPid;

    const doc = {
      productId: String(stablePid),
      name: String(p?.name || ""),
      productLink: productLink ? String(productLink) : undefined,
      canonicalLink: canonicalLink ? String(canonicalLink) : undefined,
      price: parseDecimalLoose(p?.price),
      expectedPurchasePrice: parseDecimalLoose(p?.expectedPurchasePrice),
      description: String(p?.description || ""),
      images: Array.isArray(p?.images) ? p.images : (Array.isArray(p?.imageLinks) ? p.imageLinks : []),
      productOptions: p?.productOptions ?? null,
      categories: catMap[rawPid] || catMap[stablePid] || [],
      updatedFromCatalogAt: new Date()
    };

    // Prefer productId when we have an existingPid (stable with current unique index).
    // Otherwise, match by productLink when present (requires/uses unique sparse index on productLink).
    const filter = (existingPid || !linkKey)
      ? { productId: doc.productId }
      : { productLink: linkKey };

    ops.push({
      updateOne: {
        filter,
        update: { $set: doc, $setOnInsert: { productId: doc.productId } },
        upsert: true
      }
    });
  }

  if (ops.length) {
    await Product.bulkWrite(ops, { ordered: false });
  }
}

function validateCatalogBundle(bundle) {
  if (!bundle || typeof bundle !== "object") return "bundle must be an object";
  if (!bundle.productsById || typeof bundle.productsById !== "object") return "productsById missing";
  if (!bundle.categories || typeof bundle.categories !== "object") return "categories missing";
  return null;
}

function loadCatalogBundleFromDisk() {
  if (!fs.existsSync(CATALOG_FILE)) return null;
  try {
    const raw = fs.readFileSync(CATALOG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const err = validateCatalogBundle(parsed);
    if (err) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCatalogBundleToDisk(bundle) {
  try { fs.writeFileSync(CATALOG_FILE, JSON.stringify(bundle, null, 2), "utf-8"); } catch { }
}

function _isValidCatalogFileMode(m) {
  return m === "products_js" || m === "split_json";
}
function getCatalogFileMode() {
  return CATALOG_FILE_MODE;
}
function setCatalogFileMode(mode) {
  const m = String(mode || "").trim();
  if (!_isValidCatalogFileMode(m)) throw new Error("Invalid catalog file mode");
  CATALOG_FILE_MODE = m;
  try { fs.mkdirSync(CATALOG_SPLIT_DIR, { recursive: true }); } catch { }
  try {
    fs.writeFileSync(CATALOG_FILEMODE_PATH, JSON.stringify({ mode: CATALOG_FILE_MODE, updatedAt: new Date().toISOString() }, null, 2), "utf-8");
  } catch { }
}

function _extractIconMetaFromCategoryArr(arr) {
  const items = Array.isArray(arr) ? arr : [];
  for (const p of items) {
    const looksLikeIconMeta =
      p && typeof p === 'object' &&
      typeof p.icon === 'string' && String(p.icon).trim() &&
      (!p.productLink || !String(p.productLink).trim()) &&
      (!p.name || !String(p.name).trim());
    if (looksLikeIconMeta) return String(p.icon || '').trim();
  }
  return "";
}

function writeSplitCatalogFilesFromLegacy(data) {
  try { fs.mkdirSync(CATALOG_SPLIT_DIR, { recursive: true }); } catch { }
  const idx = rebuildCatalogIndexes(data);
  // cache for fast /recs resolution without DB
  catalogIndexCache = idx;
  catalogIndexCacheAt = Date.now();
  const categoriesMeta = {};
  for (const cat of Object.keys(idx.categoryIdLists || {})) {
    const icon = _extractIconMetaFromCategoryArr(data?.[cat]);
    categoriesMeta[cat] = { icon: icon || undefined, productIds: (idx.categoryIdLists[cat] || []).map(x => String(x)) };
  }
  const stamp = new Date().toISOString();
  try {
    fs.writeFileSync(CATALOG_SPLIT_PRODUCTS_FILE, JSON.stringify({ schema: 1, updatedAt: stamp, productsById: idx.productsById }, null, 2), "utf-8");
  } catch { }
  try {
    fs.writeFileSync(CATALOG_SPLIT_CATEGORIES_FILE, JSON.stringify({ schema: 1, updatedAt: stamp, categories: categoriesMeta }, null, 2), "utf-8");
  } catch { }
  return { productsById: idx.productsById, categoriesMeta, categoryIdLists: idx.categoryIdLists };
}

function loadSplitCatalogFromDisk() {
  if (!fs.existsSync(CATALOG_SPLIT_PRODUCTS_FILE) || !fs.existsSync(CATALOG_SPLIT_CATEGORIES_FILE)) return null;
  try {
    const pRaw = JSON.parse(fs.readFileSync(CATALOG_SPLIT_PRODUCTS_FILE, "utf-8"));
    const cRaw = JSON.parse(fs.readFileSync(CATALOG_SPLIT_CATEGORIES_FILE, "utf-8"));

    const productsById = (pRaw && typeof pRaw === "object" && pRaw.productsById && typeof pRaw.productsById === "object")
      ? pRaw.productsById
      : (pRaw && typeof pRaw === "object" ? pRaw : {});

    const catsObj = (cRaw && typeof cRaw === "object" && cRaw.categories && typeof cRaw.categories === "object")
      ? cRaw.categories
      : (cRaw && typeof cRaw === "object" ? cRaw : {});

    const categoryIdLists = {};
    const originalForIcons = {};

    for (const [cat0, v] of Object.entries(catsObj || {})) {
      const cat = String(cat0 || "").trim();
      if (!cat) continue;

      let ids = [];
      let icon = "";

      if (Array.isArray(v)) {
        ids = v;
      } else if (v && typeof v === "object") {
        if (Array.isArray(v.productIds)) ids = v.productIds;
        else if (Array.isArray(v.ids)) ids = v.ids;
        else if (Array.isArray(v.products)) ids = v.products;
        icon = String(v.icon || "").trim();
      }

      categoryIdLists[cat] = (ids || []).map(x => String(x));
      if (icon) originalForIcons[cat] = [{ icon }];
    }

    return { productsById, categoryIdLists, originalForIcons };
  } catch {
    return null;
  }
}

function reloadCatalogFromSplitDisk(source = "disk:split") {
  const parsed = loadSplitCatalogFromDisk();
  if (!parsed) throw new Error("Split catalog files not found or invalid");
  const legacy = buildLegacyCatalogFromIds(parsed.productsById || {}, parsed.categoryIdLists || {}, parsed.originalForIcons || {});
  const normalized = normalizeCatalog(legacy);
  validateCatalogOrThrow(normalized, source);
  setCatalogInMemory(normalized, source);
  try {
    const m = normalized && normalized.__meta;
    if (m && ((m.productIdMigrated || 0) + (m.productIdGenerated || 0) + (m.productIdCollisionFixed || 0) > 0)) {
      saveCatalogToDiskFireAndForget(normalized, `id_migration:${source}`);
    }
  } catch { }
  return normalized;
}

async function saveCatalogToDisk(data, reason = "change") {
  // Ensure data directory exists
  try { fs.mkdirSync(path.dirname(LOCAL_PRODUCTS_PATH), { recursive: true }); } catch { }

  // Keep existing JS module mirror for backward compatibility
  const js = "module.exports = " + JSON.stringify(data, null, 2) + ";\n";
  fs.writeFileSync(LOCAL_PRODUCTS_PATH, js, "utf-8");

  // New canonical JSON mirrors
  const idx = rebuildCatalogIndexes(data);
  const bundle = {
    productsById: idx.productsById,
    categories: idx.categoryIdLists,
    config: { applyTariff: APPLY_TARIFF_SERVER }
  };

  // Primary source of truth on server (no GitHub)
  saveCatalogBundleToDisk(bundle);

  // Convenience mirrors
  fs.writeFileSync(path.join(path.dirname(LOCAL_PRODUCTS_PATH), "ProductCatalog.json"), JSON.stringify(bundle.productsById, null, 2), "utf-8");
  fs.writeFileSync(path.join(path.dirname(LOCAL_PRODUCTS_PATH), "CategoryLists.json"), JSON.stringify(bundle.categories, null, 2), "utf-8");

  // Split catalog folder mirrors (two-file storage)
  try { writeSplitCatalogFilesFromLegacy(data); } catch { }

  // Update RAM caches
  catalogBundleJsonCache = JSON.stringify(bundle);
  catalogBundleETag = `"${crypto.createHash('sha1').update(catalogBundleJsonCache).digest('hex')}"`;

  // Keep /products legacy cache in sync
  const legacy = buildLegacyCatalogFromIds(idx.productsById, idx.categoryIdLists, data);
  productsJsonCache = JSON.stringify({ catalog: legacy, config: { applyTariff: APPLY_TARIFF_SERVER }, applyTariff: APPLY_TARIFF_SERVER });
  productsETag = `"${crypto.createHash('sha1').update(productsJsonCache).digest('hex')}"`;

  productsFlatCache = buildFlatCatalog(data);
  productsFlatJsonCache = JSON.stringify(productsFlatCache);
  productsFlatETag = `"${crypto.createHash('sha1').update(productsFlatJsonCache).digest('hex')}"`;

  rebuildLookupMapsFromFlat();
  // DB sync + version snapshots
  await syncCatalogToDb(bundle);
  await snapshotCatalog(reason);
}


function normalizeCatalog(obj) {
  const out = {};
  const takenIds = new Set();
  const identityToId = new Map();
  let migrated = 0;
  let generated = 0;
  let collisionFixed = 0;

  // Prime takenIds with any existing ids (even legacy), so random generation can't collide.
  for (const arr of Object.values(obj || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== "object") continue;
      const id = String(p.productId || "").trim();
      if (id) takenIds.add(id);
    }
  }

  for (const [rawCat, rawArr] of Object.entries(obj || {})) {
    const cat = String(rawCat || "").trim();
    if (!cat) continue;

    const arr = Array.isArray(rawArr) ? rawArr : [];
    const normalizedArr = arr.map(p => {
      if (!p || typeof p !== 'object') return p;

      // Preserve category icon meta row
      const looksLikeIconMeta =
        typeof p.icon === 'string' && String(p.icon).trim() &&
        (!p.productLink || !String(p.productLink).trim()) &&
        (!p.name || !String(p.name).trim());

      if (looksLikeIconMeta) return { ...p, icon: String(p.icon || '').trim() };

      const productLink = String(p.productLink || p.link || "").trim();
      const canonicalLink = canonicalizeProductLink(productLink);

      const identityKey =
        (canonicalLink || productLink || "").trim() ||
        String(p.name || "").trim();

      // Remove variantPrices from the spread so we can sanitize it
      const { variantPrices: _vp, variantPricesB: _vpB, ...rest } = p;

      let productId = _repairProductId(p.productId);

      // If we've already assigned an ID for this identityKey in this normalization pass, reuse it.
      if (identityKey && identityToId.has(identityKey)) {
        productId = identityToId.get(identityKey);
      } else {
        const legacy = _isLegacyOrUrlDerivedProductId(productId, productLink, canonicalLink);

        // Fix collisions where different identities share the same id
        const collision = productId && takenIds.has(productId) && identityKey && identityToId.size && !identityToId.has(identityKey);
        if (legacy || !productId) {
          const had = !!productId;
          productId = _generateUniqueProductId(takenIds);
          if (had) migrated++;
          else generated++;
        } else if (collision) {
          // Different identity trying to reuse an existing id: mint a new one.
          productId = _generateUniqueProductId(takenIds);
          collisionFixed++;
        } else {
          // Keep as-is; reserve it.
          takenIds.add(productId);
        }

        if (identityKey) identityToId.set(identityKey, productId);
      }

      const vps = _sanitizeVariantPrices(_vp);
      const vpsB = _sanitizeVariantPrices(_vpB);

      const normalized = {
        ...rest,
        name: String(p.name || "").trim(),
        productLink,
        canonicalLink,
        productId,
        price: parseDecimalLoose(p.price),
        expectedPurchasePrice: parseDecimalLoose(p.expectedPurchasePrice),
        ...(vps !== undefined ? { variantPrices: vps } : {}),
        ...(vpsB !== undefined ? { variantPricesB: vpsB } : {})
      };

      return normalized;
    });

    if (!out[cat]) out[cat] = [];
    out[cat].push(...normalizedArr);
  }

  // Attach non-enumerable meta for callers that want to persist migrations.
  try {
    Object.defineProperty(out, "__meta", {
      value: { productIdMigrated: migrated, productIdGenerated: generated, productIdCollisionFixed: collisionFixed },
      enumerable: false
    });
  } catch { }

  return out;
}

function saveCatalogToDiskFireAndForget(data, reason = "change") {
  saveCatalogToDisk(data, reason).catch((e) => {
    try { console.error("saveCatalogToDisk failed:", e?.message || e); } catch { }
  });
}


function refreshProductsCache() {
  // Flat list
  productsFlatCache = buildFlatCatalog(productsData);
  productsFlatJsonCache = JSON.stringify(productsFlatCache);
  productsFlatETag = `"${crypto.createHash('sha1').update(productsFlatJsonCache).digest('hex')}"`;

  rebuildLookupMapsFromFlat();
  // Canonical bundle (IDs) + legacy catalog (resolved arrays)
  const idx = rebuildCatalogIndexes(productsData);
  const legacy = buildLegacyCatalogFromIds(idx.productsById, idx.categoryIdLists, productsData);

  productsJsonCache = JSON.stringify({ catalog: legacy, config: { applyTariff: APPLY_TARIFF_SERVER }, applyTariff: APPLY_TARIFF_SERVER });
  productsETag = `"${crypto.createHash('sha1').update(productsJsonCache).digest('hex')}"`;

  catalogBundleJsonCache = JSON.stringify({
    productsById: idx.productsById,
    categories: idx.categoryIdLists,
    config: { applyTariff: APPLY_TARIFF_SERVER }
  });
  catalogBundleETag = `"${crypto.createHash('sha1').update(catalogBundleJsonCache).digest('hex')}"`;
}


// ===== Catalog RAM cache + precomputed payloads =====

let catalogBundleJsonCache = '{}';  // precomputed JSON for GET /catalog
let catalogBundleETag = null;       // strong ETag for /catalog
let productsByIdCache = {};         // productId -> product object
let categoryIdListsCache = {};      // category -> [productId...]

let productsData = {};               // normalized catalog in RAM (source for admin edits)
let productsFlatCache = [];          // precomputed flat list in RAM
let productsJsonCache = '{}';        //
let catalogIndexCache = null;         // { productsById, categoryIdLists, idToCategory }
let catalogIndexCacheAt = 0;          // ms timestamp
// precomputed JSON for GET /products
let productsFlatJsonCache = '[]';    // precomputed JSON for GET /products/flat
let productsETag = null;             // strong ETag for /products
let productsFlatETag = null;         // strong ETag for /products/flat
let productsLocalMtimeMs = 0;        // last loaded mtime of LOCAL_PRODUCTS_PATH




function buildFlatCatalog(data) {
  const flat = [];
  const takenIds = new Set();
  const identityToId = new Map();

  for (const [rawCat, arr] of Object.entries(data || {})) {
    const cat = String(rawCat || "").trim();
    if (!cat || !Array.isArray(arr)) continue;

    for (const p of arr) {
      if (!p || typeof p !== "object") continue;

      // Skip icon meta row
      const looksLikeIconMeta =
        typeof p.icon === 'string' && String(p.icon).trim() &&
        (!p.productLink || !String(p.productLink).trim()) &&
        (!p.name || !String(p.name).trim());
      if (looksLikeIconMeta) continue;

      const productLink = String(p.productLink || p.link || "").trim();
      const canonicalLink = String(p.canonicalLink || canonicalizeProductLink(productLink)).trim();

      const identityKey =
        (canonicalLink || productLink || "").trim() ||
        String(p.name || "").trim();

      let productId = String(p.productId || "").trim();

      if (identityKey && identityToId.has(identityKey)) {
        productId = identityToId.get(identityKey);
      } else {
        const legacy = _isLegacyOrUrlDerivedProductId(productId, productLink, canonicalLink);
        if (!productId || legacy || takenIds.has(productId)) {
          productId = _generateUniqueProductId(takenIds);
        } else {
          takenIds.add(productId);
        }
        if (identityKey) identityToId.set(identityKey, productId);
      }

      const canonP = {
        ...p,
        category: String(p.category || cat).trim(),
        categoryKey: cat,
        name: String(p.name || "").trim(),
        productLink,
        canonicalLink,
        productId
      };

      flat.push(canonP);
    }
  }
  return flat;
}

function rebuildCatalogIndexes(data) {
  const productsById = {};
  const categoryIdLists = {};
  const idToCategory = {};

  for (const [cat, arr] of Object.entries(data || {})) {
    const list = [];
    const items = Array.isArray(arr) ? arr : [];
    for (const p of items) {
      // keep icon meta rows out of ID lists
      const looksLikeIconMeta =
        p && typeof p === 'object' &&
        typeof p.icon === 'string' && String(p.icon).trim() &&
        (!p.productLink || !String(p.productLink).trim()) &&
        (!p.name || !String(p.name).trim());
      if (looksLikeIconMeta) continue;

      if (!p || typeof p !== 'object') continue;
      const id = _repairProductId(p.productId);
      if (id && String(p.productId || '').trim() !== id) p.productId = id;
      if (!id) continue;
      productsById[id] = p
      if (!idToCategory[id]) idToCategory[id] = String(cat);
      if (!Array.isArray(p.categories) || !p.categories.length) p.categories = [String(cat)];;
      list.push(id);
    }
    categoryIdLists[cat] = list;
  }

  productsByIdCache = productsById;
  categoryIdListsCache = categoryIdLists;
  return { productsById, categoryIdLists, idToCategory };
}

function buildLegacyCatalogFromIds(productsById, categoryIdLists, originalData) {
  const out = {};
  for (const [cat, ids] of Object.entries(categoryIdLists || {})) {
    // preserve icon meta rows from originalData if present
    const originalArr = Array.isArray(originalData?.[cat]) ? originalData[cat] : [];
    const iconMeta = originalArr.filter(p =>
      p && typeof p === 'object' &&
      typeof p.icon === 'string' && String(p.icon).trim() &&
      (!p.productLink || !String(p.productLink).trim()) &&
      (!p.name || !String(p.name).trim())
    );
    const resolved = [];
    for (const id of (ids || [])) {
      const p = productsById[id];
      if (p) resolved.push(p);
    }
    out[cat] = [...iconMeta, ...resolved];
  }
  return out;
}



function rebuildLookupMapsFromFlat() {
  productsByLink = new Map();
  productsByCanonLink = new Map();
  productsById = new Map();
  productsByName = new Map();

  for (const p of (productsFlatCache || [])) {
    if (!p || typeof p !== "object") continue;

    const link = String(p.productLink || "").trim();
    const canon = String(p.canonicalLink || (link ? canonicalizeProductLink(link) : "")).trim();
    const id = String(p.productId || "").trim();
    const name = String(p.name || "").trim();

    if (id) productsById.set(id, p);
    if (canon) productsByCanonLink.set(canon, p);
    if (link) productsByLink.set(link, p);
    if (name && !productsByName.has(name)) productsByName.set(name, p);
  }
}

function setCatalogInMemory(newData, _source = "setCatalogInMemory") {
  productsData = (newData && typeof newData === 'object') ? newData : {};

  // Precompute payloads + ETags + id/category caches
  try {
    refreshProductsCache();
  } catch (e) {
    try { console.error('[catalog] refreshProductsCache failed:', e?.message || e); } catch { }
    // Minimal safe fallbacks so endpoints still respond.
    productsFlatCache = buildFlatCatalog(productsData);
    productsFlatJsonCache = JSON.stringify(productsFlatCache);
    productsJsonCache = JSON.stringify({ catalog: productsData, config: { applyTariff: APPLY_TARIFF_SERVER }, applyTariff: APPLY_TARIFF_SERVER });
    productsETag = `"${crypto.createHash('sha1').update(productsJsonCache).digest('hex')}"`;
    productsFlatETag = `"${crypto.createHash('sha1').update(productsFlatJsonCache).digest('hex')}"`;
    rebuildLookupMapsFromFlat();
    catalogBundleJsonCache = JSON.stringify({ productsById: productsByIdCache || {}, categories: categoryIdListsCache || {}, config: { applyTariff: APPLY_TARIFF_SERVER } });
    catalogBundleETag = `"${crypto.createHash('sha1').update(catalogBundleJsonCache).digest('hex')}"`;
  }

  // Rebuild lookup maps used by checkout + admin operations
  rebuildLookupMapsFromFlat();
}



// ---- Catalog DB helpers (per-category documents) ----
function _splitCategoryMeta(arr) {
  const a = Array.isArray(arr) ? arr : [];
  const first = a[0];
  const looksLikeIconMeta =
    first && typeof first === 'object' &&
    typeof first.icon === 'string' && first.icon.trim() &&
    (!first.productLink || !String(first.productLink).trim()) &&
    (!first.name || !String(first.name).trim());

  const icon = looksLikeIconMeta ? String(first.icon || '').trim() : '';
  const products = looksLikeIconMeta ? a.slice(1) : a.slice(0);
  return { icon, products };
}

function _catalogObjectFromDbDocs(docs) {
  const out = {};
  for (const d of (docs || [])) {
    const key = String(d.key || '').trim();
    if (!key) continue;
    const arr = [];
    if (d.icon && String(d.icon).trim()) arr.push({ icon: String(d.icon).trim() });
    if (Array.isArray(d.products)) arr.push(...d.products);
    out[key] = arr;
  }
  return out;
}

async function readCatalogFromDb() {
  const docs = await CatalogCategory.find({}).sort({ order: 1, key: 1 }).lean();
  return _catalogObjectFromDbDocs(docs);
}

async function persistCatalogToDb(catalogObj, { replace = true } = {}) {
  const obj = catalogObj && typeof catalogObj === 'object' ? catalogObj : {};
  const keys = Object.keys(obj);

  const ops = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const arr = obj[key];
    const { icon, products } = _splitCategoryMeta(arr);

    ops.push({
      updateOne: {
        filter: { key },
        update: {
          $set: {
            key,
            icon,
            order: i,
            products: Array.isArray(products) ? products : []
          }
        },
        discount: {
          enabled: { type: Boolean, default: false },
          // Percent discount applied to eligible recommended items (auto-applied; no coupon field)
          minPct: { type: Number, default: 2, min: 0, max: 50 },
          maxPct: { type: Number, default: 5, min: 0, max: 80 },
          maxItemsPerWidget: { type: Number, default: 2, min: 0, max: 20 },
          onlyEvolutionSlots: { type: Boolean, default: true },
          minImpressions: { type: Number, default: 80, min: 0, max: 100000 },
          minCtr: { type: Number, default: 0.03, min: 0, max: 1 },
          maxAtcPerClick: { type: Number, default: 0.10, min: 0, max: 1 }, // if ATC/click is already high, do not discount
          minMarginPct: { type: Number, default: 0.20, min: 0, max: 0.99 }, // guardrail using expectedPurchasePrice
          ttlMinutes: { type: Number, default: 60, min: 1, max: 1440 }
        },
        upsert: true
      }
    });
  }

  if (ops.length) {
    await CatalogCategory.bulkWrite(ops, { ordered: false });
  }

  if (replace) {
    await CatalogCategory.deleteMany({ key: { $nin: keys } });
  }
}

async function reloadCatalogFromDb(source = 'db') {
  const raw = await readCatalogFromDb();
  const normalized = normalizeCatalog(raw);
  try {
    validateCatalogOrThrow(normalized, source);
    setCatalogInMemory(normalized, source);
    try {
      const m = normalized && normalized.__meta;
      if (m && ((m.productIdMigrated || 0) + (m.productIdGenerated || 0) + (m.productIdCollisionFixed || 0) > 0)) {
        saveCatalogToDiskFireAndForget(normalized, `id_migration:${source}`);
      }
    } catch { }
  } catch (e) {
    if (e && e.code === "INVALID_CATALOG") {
      console.error('[catalog] invalid catalog loaded from DB - keeping previous in memory:', e.issues?.[0] || e.message);
      return normalized;
    }
    throw e;
  }
  return normalized;
}

async function ensureDbCatalogSeeded() {
  const count = await CatalogCategory.countDocuments({});
  if (count > 0) return { seeded: false, count };

  // Seed DB from local mirror if available, otherwise canonical.
  let seedObj = {};
  try {
    if (fs.existsSync(LOCAL_PRODUCTS_PATH)) seedObj = requireFresh(LOCAL_PRODUCTS_PATH) || {};
  } catch { /* ignore */ }

  if (!seedObj || Object.keys(seedObj).length === 0) {
    try {
      if (fs.existsSync(CANONICAL_PRODUCTS_PATH)) seedObj = requireFresh(CANONICAL_PRODUCTS_PATH) || {};
    } catch { /* ignore */ }
  }

  const normalized = normalizeCatalog(seedObj || {});
  validateCatalogOrThrow(normalized, 'ensureDbCatalogSeeded');
  await persistCatalogToDb(normalized, { replace: true });

  return { seeded: true, count: Object.keys(normalized || {}).length };
}


function parseProductsModuleFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const txt = String(raw || "").replace(/^\uFEFF/, "").trim();
    if (!txt) return null;

    // Pure JSON file
    if (txt[0] === "{" || txt[0] === "[") {
      return JSON.parse(txt);
    }

    // module.exports = <json>;
    const me = txt.indexOf("module.exports");
    if (me !== -1) {
      const eq = txt.indexOf("=", me);
      if (eq !== -1) {
        let body = txt.slice(eq + 1).trim();
        if (body.endsWith(";")) body = body.slice(0, -1).trim();
        return JSON.parse(body);
      }
    }

    // Fallback: extract the first {...} block
    const a = txt.indexOf("{");
    const b = txt.lastIndexOf("}");
    if (a !== -1 && b !== -1 && b > a) {
      return JSON.parse(txt.slice(a, b + 1));
    }
  } catch { }
  return null;
}

function loadProducts() {
  // Prefer local mirror; fall back to canonical. (Used in file-backed mode)
  if (fs.existsSync(LOCAL_PRODUCTS_PATH)) {
    try { productsLocalMtimeMs = fs.statSync(LOCAL_PRODUCTS_PATH).mtimeMs || 0; } catch { }

    try {
      return requireFresh(LOCAL_PRODUCTS_PATH) || {};
    } catch (e) {
      const recovered = parseProductsModuleFile(LOCAL_PRODUCTS_PATH);
      if (recovered && typeof recovered === "object") {
        try { console.warn("[catalog] loadProducts local require failed; recovered by JSON parse:", e?.message || e); } catch { }
        // Best-effort rewrite a clean JS mirror to prevent future crashes
        try { writeProductsJs(LOCAL_PRODUCTS_PATH, recovered); } catch { }
        return recovered;
      }
      try { console.warn("[catalog] loadProducts local failed:", e?.message || e); } catch { }
    }
  }

  if (fs.existsSync(CANONICAL_PRODUCTS_PATH)) {
    try { return requireFresh(CANONICAL_PRODUCTS_PATH) || {}; } catch (e) {
      try { console.warn("[catalog] loadProducts canonical failed:", e?.message || e); } catch { }
    }
  }

  return {};
}

function reloadCatalogFromDisk(source = 'disk') {
  const raw = loadProducts();                 // requireFresh(LOCAL_PRODUCTS_PATH)
  const normalized = normalizeCatalog(raw);   // ensure numeric fields
  try {
    validateCatalogOrThrow(normalized, source);
    setCatalogInMemory(normalized, source);
  } catch (e) {
    if (e && e.code === "INVALID_CATALOG") {
      console.error('[catalog] invalid catalog loaded from disk - keeping previous in memory:', e.issues?.[0] || e.message);
      return;
    }
    throw e;
  }
}
let _catalogWatchStarted = false;
let _catalogReloadTimer = null;

function startCatalogAutoRefresh() {
  if (_catalogWatchStarted) return;
  _catalogWatchStarted = true;

  // Ensure local mirror exists before watching
  try { initialiseProductsStore(); } catch { /* ignore */ }

  try {
    // watchFile (polling) is usually more reliable than fs.watch on servers/containers
    fs.watchFile(LOCAL_PRODUCTS_PATH, { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      if (getCatalogFileMode() !== "products_js") return;

      if (_catalogReloadTimer) clearTimeout(_catalogReloadTimer);
      _catalogReloadTimer = setTimeout(() => {
        // Avoid redundant reloads (e.g., multiple rapid writes)
        try {
          const mtime = fs.statSync(LOCAL_PRODUCTS_PATH).mtimeMs;
          if (mtime === productsLocalMtimeMs) return;
        } catch { /* ignore */ }

        try {
          reloadCatalogFromDisk('watchFile change');
        } catch (e) {
          console.warn('[catalog] reload after change failed:', e?.message || e);
        }
      }, 250);
    });

    console.log(`[catalog] auto-refresh enabled (watching ${LOCAL_PRODUCTS_PATH})`);
  } catch (e) {
    console.warn('[catalog] failed to start auto-refresh:', e?.message || e);
  }
}


let _splitWatchStarted = false;
let _splitReloadTimer = null;

function startSplitCatalogAutoRefresh() {
  if (_splitWatchStarted) return;
  _splitWatchStarted = true;

  try { fs.mkdirSync(CATALOG_SPLIT_DIR, { recursive: true }); } catch { }

  const onChange = () => {
    if (getCatalogFileMode() !== "split_json") return;
    if (_splitReloadTimer) clearTimeout(_splitReloadTimer);
    _splitReloadTimer = setTimeout(() => {
      try {
        reloadCatalogFromSplitDisk("watch:split");
        console.log("[catalog] reloaded from split files (watch)");
      } catch (e) {
        console.warn("[catalog] split watch reload failed:", e?.message || e);
      }
    }, 150);
  };

  try {
    fs.watchFile(CATALOG_SPLIT_PRODUCTS_FILE, { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      onChange();
    });
  } catch { }

  try {
    fs.watchFile(CATALOG_SPLIT_CATEGORIES_FILE, { interval: 1000 }, (curr, prev) => {
      if (!curr || !prev) return;
      if (curr.mtimeMs === prev.mtimeMs) return;
      onChange();
    });
  } catch { }
}



async function saveProducts(data, source = 'saveProducts') {
  const normalized = normalizeCatalog(data);
  validateCatalogOrThrow(normalized, source);

  if (CATALOG_SOURCE === 'db') {
    // Persist to DB first (durable), then update RAM caches.
    await persistCatalogToDb(normalized, { replace: true });
    setCatalogInMemory(normalized, source);

    // Optional disk mirror (best-effort)
    if (CATALOG_DISK_MIRROR) {
      try { writeProductsJs(LOCAL_PRODUCTS_PATH, normalized); }
      catch (e) { console.warn('[catalog] disk mirror write failed:', e?.message || e); }
    }
    return;
  }

  // File-backed mode
  setCatalogInMemory(normalized, source);

  // Persist according to active file mode.
  if (getCatalogFileMode() === "split_json") {
    await saveCatalogToDisk(normalized, source);
  } else {
    writeProductsJs(LOCAL_PRODUCTS_PATH, normalized);
    // keep split mirrors up to date best-effort
    try { writeSplitCatalogFilesFromLegacy(normalized); } catch { }
  }
}

let exchangeRates = {};

// ---- Catalog boot ----
(function bootCatalog() {
  if (CATALOG_SOURCE === 'file') {
    // File-backed mode: choose between ServerProducts.js (products_js) and split JSON files (split_json)
    initialiseProductsStore();
    try { fs.mkdirSync(CATALOG_SPLIT_DIR, { recursive: true }); } catch { }

    const mode = getCatalogFileMode();
    if (mode === "split_json") {
      // If split files don't exist yet, create them from current in-memory catalog (best-effort)
      try {
        if (!fs.existsSync(CATALOG_SPLIT_PRODUCTS_FILE) || !fs.existsSync(CATALOG_SPLIT_CATEGORIES_FILE)) {
          writeSplitCatalogFilesFromLegacy(productsData || {});
        }
      } catch { }

      try {
        reloadCatalogFromSplitDisk("boot:split");
        startSplitCatalogAutoRefresh();
        return;
      } catch (e) {
        console.warn("[catalog] split boot load failed, falling back to ServerProducts.js:", e?.message || e);
        // fallthrough to legacy JS load
      }
    }

    reloadCatalogFromDisk('boot:file');
    startCatalogAutoRefresh();
    return;
  }

  // DB-backed mode (MongoDB; 1 document per category)
  // Keep a best-effort disk mirror for backups/fallback if enabled.
  try { ensureDataDir(); } catch { /* ignore */ }

  // Fallback: warm RAM from disk/canonical so /products isn't empty during DB warm-up
  try {
    if (fs.existsSync(LOCAL_PRODUCTS_PATH)) {
      reloadCatalogFromDisk('boot:fallback-disk');
    } else if (fs.existsSync(CANONICAL_PRODUCTS_PATH)) {
      const canon = requireFresh(CANONICAL_PRODUCTS_PATH) || {};
      setCatalogInMemory(normalizeCatalog(canon), 'boot:fallback-canonical');
    }
  } catch (e) {
    console.warn('[catalog] fallback load failed:', e?.message || e);
  }

  const run = async () => {
    try {
      await ensureDbCatalogSeeded();
      const normalized = await reloadCatalogFromDb('boot:db');

      // Write disk mirror best-effort (do not fail boot if disk is read-only)
      if (CATALOG_DISK_MIRROR) {
        try { writeProductsJs(LOCAL_PRODUCTS_PATH, normalized); }
        catch (e) { console.warn('[catalog] disk mirror write failed:', e?.message || e); }
      }

      console.log('[catalog] DB catalog ready (per-category documents)');
    } catch (e) {
      console.error('[catalog] DB boot failed:', e?.message || e);
    }
  };

  if (mongoose.connection.readyState === 1) run();
  else mongoose.connection.once('open', run);
})();

// Boot the tariffs mirror, populate RAM cache + precomputed payloads, and auto-refresh on file changes
initialiseTariffsStore();
startTariffsAutoRefresh();



const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const COUNTER_PATH = path.join(__dirname, 'counter.json');

let purchaseCounter = 1;
let globalPurchaseCounter = 1;
// Admin: force a reconcile after pulling canonical from Git
app.post('/admin/products/sync', authMiddleware, async (req, res) => {
  try {
    const canonical = requireFresh(CANONICAL_PRODUCTS_PATH);
    const local = (CATALOG_SOURCE === 'db') ? (productsData || {}) : requireFresh(LOCAL_PRODUCTS_PATH);

    let reconciled = normalizeCatalog(mergeCanonicalIntoLocal(canonical, local));

    // Remove tombstoned products (prevents resurrecting deleted productIds)
    if (deletedProductIds && deletedProductIds.size) {
      const filtered = {};
      for (const [cat, arr] of Object.entries(reconciled || {})) {
        if (!Array.isArray(arr)) { filtered[cat] = arr; continue; }
        filtered[cat] = arr.filter(p => {
          const pid = p && typeof p === 'object' ? String(p.productId || '').trim() : '';
          return !pid || !deletedProductIds.has(pid);
        });
      }
      reconciled = normalizeCatalog(filtered);
    }
    try {
      await saveProducts(reconciled, 'admin/products/sync');
    } catch (e) {
      if (e && e.code === "INVALID_CATALOG") {
        return res.status(400).json({ error: "INVALID_CATALOG", issues: (e.issues || []).slice(0, ZOD_ERR_MAX) });
      }
      return res.status(500).json({ error: String(e?.message || e) });
    }

    res.json({ ok: true, message: 'Reconciled local with canonical' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Load counters from file or create if missing
try {
  if (fs.existsSync(COUNTER_PATH)) {
    const counters = JSON.parse(fs.readFileSync(COUNTER_PATH, 'utf-8'));
    purchaseCounter = counters.purchaseCounter || 1;
    globalPurchaseCounter = counters.globalPurchaseCounter || 1;
    console.log(`✅ Loaded counters from counter.json (purchaseCounter=${purchaseCounter}, globalPurchaseCounter=${globalPurchaseCounter})`);
  } else {
    const initialCounters = { purchaseCounter, globalPurchaseCounter };
    fs.writeFileSync(COUNTER_PATH, JSON.stringify(initialCounters, null, 2));
    console.log("📁 counter.json not found — created a new one with initial values.");
  }
} catch (error) {
  console.error("❌ Failed to load or create counter.json:", error.message);
}

// Admin: download the current catalog as ServerProducts.js (module.exports = {...};)
// In DB mode, this is generated from RAM (DB-backed); in file mode it is read from disk.
app.get('/admin/products/local/download', authMiddleware, (req, res) => {
  try {
    let js = '';
    if (fs.existsSync(LOCAL_PRODUCTS_PATH)) {
      js = fs.readFileSync(LOCAL_PRODUCTS_PATH, 'utf8');
    } else {
      js = 'module.exports = ' + JSON.stringify(productsData || {}, null, 2) + ';\n';
    }

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ServerProducts.js"');
    return res.send(js);
  } catch (e) {
    console.error('download local products failed:', e);
    return res.status(500).json({ error: 'Failed to download ServerProducts.js' });
  }
});

function _timestampSafe() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function _parseProductsFromJsText(text) {
  const t = String(text || '').replace(/^\uFEFF/, '').trim();

  // Accept either:
  //  A) "module.exports = { ... };"
  //  B) pure JSON: "{ ... }"
  let jsonPart = t;
  const m = t.match(/module\.exports\s*=\s*([\s\S]*?)\s*;?\s*$/);
  if (m && m[1]) jsonPart = m[1].trim();

  // Must be strict JSON (server's writeProductsJs produces this format)
  const obj = JSON.parse(jsonPart);
  return normalizeCatalog(obj);
}

// Admin: replace the LOCAL ServerProducts.js completely
// Send body as text/plain containing the entire ServerProducts.js file content.
app.post(
  '/admin/products/local/replace',
  authMiddleware,
  express.text({
    type: ['text/plain', 'application/javascript', 'text/javascript', 'application/x-javascript'],
    limit: '25mb'
  }),
  async (req, res) => {
    try {
      // In DB mode, only touch the disk catalog mirror if enabled.
      if (CATALOG_SOURCE === 'file' || CATALOG_DISK_MIRROR) {
        try { initialiseProductsStore(); } catch (e) { console.warn('[catalog] init local mirror failed (continuing):', e?.message || e); }
      }

      const incomingText = req.body;
      if (!incomingText || typeof incomingText !== 'string') {
        return res.status(400).json({ error: 'Missing file content (send as text/plain)' });
      }

      // Backup current local file (best-effort)
      if (fs.existsSync(LOCAL_PRODUCTS_PATH)) {
        try {
          const backupPath = path.join(DATA_DIR, `ServerProducts.backup.${_timestampSafe()}.js`);
          fs.copyFileSync(LOCAL_PRODUCTS_PATH, backupPath);
        } catch (e) {
          console.warn('[catalog] backup failed (continuing):', e?.message || e);
        }
      }
      const catalog = _parseProductsFromJsText(incomingText);
      const normalized = normalizeCatalog(catalog);

      try {
        await saveProducts(normalized, 'admin/products/local/replace');
      } catch (e) {
        console.error('replace local products persist failed:', e);
        if (e && e.code === "INVALID_CATALOG") {
          return res.status(400).json({ error: "INVALID_CATALOG", issues: (e.issues || []).slice(0, ZOD_ERR_MAX) });
        }
        return res.status(500).json({ error: String(e?.message || e) });
      }

      return res.json({
        ok: true,
        message: 'Local ServerProducts.js replaced',
        categories: Object.keys(productsData || {}).length
      });
    } catch (e) {
      console.error('replace local products failed:', e);
      return res.status(400).json({ error: String(e?.message || e) });
    }
  }
);
// Admin: download the LOCAL tariffs.json (data/tariffs/tariffs.json)
app.get('/admin/tariffs/download', authMiddleware, (req, res) => {
  try {
    initialiseTariffsStore(); // ensure local exists + warm RAM
    if (!fs.existsSync(LOCAL_TARIFFS_PATH)) {
      return res.status(404).json({ error: 'Local tariffs.json not found' });
    }

    const json = fs.readFileSync(LOCAL_TARIFFS_PATH, 'utf8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tariffs.json"');
    return res.send(json);
  } catch (e) {
    console.error('download local tariffs failed:', e);
    return res.status(500).json({ error: 'Failed to download local tariffs.json' });
  }
});

// Admin: replace tariffs.json (upload from management frontend)
// - Send as "text/plain" (raw file content) OR as "application/json" (parsed object)
app.post(
  '/admin/tariffs/replace',
  authMiddleware,
  express.text({ type: ['text/plain'], limit: '512kb' }),
  (req, res) => {
    try {
      initialiseTariffsStore();

      // Accept either:
      //  - text/plain: req.body is a string containing JSON
      //  - application/json: req.body is an object (parsed by global express.json)
      let nextTariffs;
      if (typeof req.body === 'string') {
        nextTariffs = _parseTariffsFromJsonText(req.body);
      } else if (req.body && typeof req.body === 'object') {
        nextTariffs = _validateTariffsObject(req.body);
      } else {
        return res.status(400).json({ error: 'Missing tariffs payload (send JSON object or text/plain JSON)' });
      }

      ensureTariffsDir();

      // Backup current local file (if exists)
      if (fs.existsSync(LOCAL_TARIFFS_PATH)) {
        const backupPath = path.join(TARIFFS_DIR, `tariffs.backup.${_timestampSafe()}.json`);
        fs.copyFileSync(LOCAL_TARIFFS_PATH, backupPath);
      }

      writeTariffsJson(LOCAL_TARIFFS_PATH, nextTariffs);
      setTariffsInMemory(nextTariffs, 'admin/tariffs/replace');

      return res.json({
        ok: true,
        message: 'Local tariffs.json replaced',
        keys: Object.keys(tariffsData || {}).length
      });
    } catch (e) {
      console.error('replace tariffs failed:', e);
      return res.status(400).json({ error: String(e?.message || e) });
    }
  }
);

// Save counters back to file
function saveCounters() {
  const counters = {
    purchaseCounter,
    globalPurchaseCounter
  };
  try {
    fs.writeFileSync(COUNTER_PATH, JSON.stringify(counters, null, 2));
    console.log(`💾 Saved counters (purchaseCounter=${purchaseCounter}, globalPurchaseCounter=${globalPurchaseCounter})`);
  } catch (error) {
    console.error("❌ Failed to save counters:", error.message);
  }
}

updateExchangeRates(); // 👈 MUST run on startup!



setInterval(updateExchangeRates, FX_REFRESH_MS);

app.get("/rates", (req, res) => {
  if (!cachedRates) {
    return res.status(503).json({ error: "Exchange rates not available yet." });
  }
  res.json(cachedRates);
});

['get', 'post', 'put', 'delete'].forEach(method => {
  const original = app[method].bind(app);
  app[method] = function (route, ...handlers) {
    // Preserve Express setting getters: app.get('env'), app.get('etag'), app.get('json spaces'), ...
    if (method === 'get' && handlers.length === 0 && typeof route === 'string' && !route.startsWith('/')) {
      return original(route);
    }
    console.log(`Registering route: ${method.toUpperCase()} ${route}`);
    return original(route, ...handlers);
  };
});



// 📦 Transporter for store/customer emails (SHOP_EMAIL)
const SHOP_SMTP_USER = String(process.env.SHOP_EMAIL || process.env.STORE_EMAIL || "").trim();
const SHOP_SMTP_PASS = String(process.env.SHOP_EMAIL_PASSWORD || "").trim();

const confirmationTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: (SHOP_SMTP_USER && SHOP_SMTP_PASS) ? { user: SHOP_SMTP_USER, pass: SHOP_SMTP_PASS } : undefined,
  connectionTimeout: 10000
});

if (SHOP_SMTP_USER && SHOP_SMTP_PASS) {
  confirmationTransporter.verify()
    .then(() => console.log("[smtp] shop AUTH OK as", SHOP_SMTP_USER))
    .catch((e) => console.error("[smtp] shop AUTH FAILED as", SHOP_SMTP_USER, e?.message || e));
} else {
  console.warn("⚠ [smtp] shop mailer disabled: set SHOP_EMAIL and SHOP_EMAIL_PASSWORD");
}

// 🛠 Transporter for support emails (contact form)
// - sends TO SUPPORT_EMAIL (or ADMIN_EMAIL fallback)
// - authenticates with SUPPORT_EMAIL / SUPPORT_EMAIL_PASSWORD
const SUPPORT_TO_EMAIL =
  String(process.env.SUPPORT_EMAIL || "").trim() ||
  String(process.env.ADMIN_EMAIL || "").trim() ||
  "snagletshophelp@gmail.com";

const CONTACT_SMTP_USER = String(process.env.SUPPORT_EMAIL || "").trim();
const CONTACT_SMTP_PASS = String(process.env.SUPPORT_EMAIL_PASSWORD || "").trim();

// Visible header: Contact Form <support@email>
const CONTACT_FROM =
  process.env.CONTACT_FROM ||
  (CONTACT_SMTP_USER
    ? `Contact Form <${CONTACT_SMTP_USER}>`
    : (SHOP_SMTP_USER ? `Contact Form <${SHOP_SMTP_USER}>` : "Contact Form <no-reply@snagletshop.com>"));

const supportTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: (CONTACT_SMTP_USER && CONTACT_SMTP_PASS) ? { user: CONTACT_SMTP_USER, pass: CONTACT_SMTP_PASS } : undefined,
  connectionTimeout: 10000
});

if (CONTACT_SMTP_USER && CONTACT_SMTP_PASS) {
  supportTransporter.verify()
    .then(() => console.log("[smtp] support AUTH OK as", CONTACT_SMTP_USER))
    .catch((e) => console.error("[smtp] support AUTH FAILED as", CONTACT_SMTP_USER, e?.message || e));
} else {
  console.warn("⚠ [smtp] support mailer disabled: set SUPPORT_EMAIL and SUPPORT_EMAIL_PASSWORD");
}



async function updateExchangeRates() {
  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/EUR", { timeout: 10000 });
    if (response.data?.result !== "success" || !response.data?.rates) {
      throw new Error("Exchange rate API did not return success.");
    }

    cachedRates = {
      rates: response.data.rates,
      base: response.data.base_code || "EUR",
      fetchedAt: Date.now(),
    };

    lastFetched = cachedRates.fetchedAt;
    pushFxHistory(cachedRates);

    console.log("✅ Exchange rates updated. base =", cachedRates.base, "sample =", {
      USD: cachedRates.rates.USD,
      GBP: cachedRates.rates.GBP,
    });

    return cachedRates;
  } catch (error) {
    console.error("❌ Failed to fetch exchange rates:", error.message);
    return cachedRates; // keep last known good
  }
}



async function getLiveEurRatesSafe() {
  const now = Date.now();
  const isFresh = cachedRates && (now - lastFetched) < FX_REFRESH_MS;
  if (isFresh) return cachedRates;

  if (!fxRefreshPromise) {
    fxRefreshPromise = (async () => {
      await updateExchangeRates();
    })().finally(() => {
      fxRefreshPromise = null;
    });
  }

  try { await fxRefreshPromise; } catch (_) { }
  if (cachedRates) return cachedRates;
  throw new Error("Exchange rates not available");
}

app.get("/api/proxy-rates", async (req, res) => {
  try {
    const rates = await getLiveEurRatesSafe();
    if (!rates) return res.status(503).json({ error: "Exchange rates not available yet." });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: "Proxy failed", details: err?.message || String(err) });
  }
});


// ✅ Webhook must be raw, so don't use bodyParser.json() here 


const DISPATCH_FILE = path.join(__dirname, 'dispatch-control.txt');
const DISPATCH_LOG = path.join(__dirname, 'dispatched-log.txt');

async function processDispatchControlFile() {
  if (!fs.existsSync(DISPATCH_FILE)) return;

  const today = new Date().toLocaleDateString("sk-SK").replace(/\./g, '-').replace(/\s/g, '');
  const lines = fs.readFileSync(DISPATCH_FILE, 'utf-8').split('\n').filter(Boolean);

  const alreadyDispatched = fs.existsSync(DISPATCH_LOG)
    ? new Set(fs.readFileSync(DISPATCH_LOG, 'utf-8').split('\n').filter(Boolean))
    : new Set();

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();
    if (!line) continue;

    const [rawDate, orderId, emailFromFile, status] = line.split(/\s+/);
    const fileDate = String(rawDate || '').replace(/\./g, '-');

    if (fileDate !== today || status !== 'yes' || alreadyDispatched.has(orderId)) continue;

    try {
      const order = await Order.findOne({ orderId }).lean();
      if (!order) {
        console.warn(`⚠️ Order ID ${orderId} not found in DB`);
        continue;
      }

      // Some dispatch files carry the email; keep as fallback (do not overwrite if already stored)
      if (emailFromFile && (!order.customer || !order.customer.email)) {
        order.customer = order.customer || {};
        order.customer.email = String(emailFromFile).trim();
      }

      await sendDispatchedEmail(order);
      fs.appendFileSync(DISPATCH_LOG, orderId + "\n");
      console.log(`📬 Dispatched email sent for Order ID: ${orderId}`);
    } catch (e) {
      console.warn(`⚠️ Dispatch processing failed for ${orderId}:`, e?.message || e);
    }
  }
}


// Run every 10 minutes
setInterval(() => { processDispatchControlFile().catch(e => console.warn('⚠ dispatch interval error:', e?.message || e)); }, 10 * 60 * 1000);
async function sendDispatchedEmail(order) {
  const storeEmail = process.env.STORE_EMAIL || process.env.SHOP_EMAIL;
  const userEmail = order?.customer?.email;

  if (!storeEmail) {
    console.warn("⚠ [mail] STORE_EMAIL/SHOP_EMAIL not set; cannot send dispatched email");
    return { skipped: true };
  }
  if (!userEmail) {
    console.warn("⚠ [mail] order has no customer email; cannot send dispatched email");
    return { skipped: true };
  }

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const orderId = order?.orderId || "";
  const items = Array.isArray(order?.items) ? order.items : [];
  const productList = items.map(it => {
    const qty = Number(it.quantity || 1);
    const name = esc(it.name || "");
    const sel = esc(formatSelectedOptions(it.selectedOptions, it.selectedOption));
    return `- ${qty}x ${name}${sel ? ` (${sel})` : ""}`;
  }).join("\n");

  const c = order.customer || {};
  const addressLines = [
    `${esc(c.firstName || "")} ${esc(c.lastName || "")}`.trim(),
    esc(c.address1 || ""),
    esc(c.address2 || ""),
    `${esc(c.postalCode || "")} ${esc(c.city || "")}`.trim(),
    esc(c.region || ""),
    esc(c.countryCode || "")
  ].filter(Boolean).join("<br>");

  const emailContent = `
    <div style="background-color:#111;color:#fff;padding:20px;font-family:Arial,sans-serif;">
      <h2 style="color:#00ffcc;margin:0 0 10px 0;">Your order has been dispatched! 🚚</h2>
      <p style="margin:0 0 10px 0;">Order ID: <strong>${esc(orderId)}</strong></p>
      <p style="margin:0 0 10px 0;">We're excited to let you know your package is on the way. Here’s what you ordered:</p>
      <pre style="color:#ccc;background:#0b0b0b;padding:12px;border-radius:8px;white-space:pre-wrap;">${productList}</pre>
      <p style="margin:10px 0 6px 0;">It will be delivered to:</p>
      <p style="margin:0 0 18px 0;">${addressLines}</p>
      <p style="margin-top: 20px;">Thanks again for shopping with SnagletShop!</p>
    </div>
  `;

  await confirmationTransporter.sendMail({
    from: `"SnagletShop" <${storeEmail}>`,
    to: userEmail,
    subject: `🚚 Your Order Has Been Dispatched — Order ID: ${orderId}`,
    html: emailContent
  });

  console.log(`✅ Dispatch email sent to ${redactEmail(userEmail)}`);
}


// ✅ Now use JSON middleware (after webhook!)

function findOrderInLogs(orderId) {
  const orderLines = fs.readFileSync(path.join(ORDER_DIR, 'orders.txt'), 'utf-8').split('\n');
  const startIndex = orderLines.findIndex(line => line.includes(`Order ID: ${orderId}`));
  if (startIndex === -1) return null;

  const endIndex = orderLines.findIndex((line, i) => i > startIndex && line.includes("*//////////////////*"));

  const chunk = orderLines.slice(startIndex, endIndex > -1 ? endIndex : undefined);
  const email = chunk.find(l => l.includes("Customer Email:"))?.split("Customer Email:")[1].trim();
  const nameLine = chunk.find(l => l.includes("User Name:"))?.split("User Name:")[1].trim();
  const [name, surname] = nameLine?.split(" ") || [];
  const address = chunk.find(l => l.includes("Address:"))?.split("Address:")[1].trim();
  const cityLine = chunk.find(l => l.includes("\t"))?.trim();
  const street = chunk[chunk.findIndex(l => l.includes("Customer Paid:")) - 1]?.trim();

  const productLines = [];
  for (let i = startIndex + 4; i < chunk.length; i += 3) {
    const name = chunk[i]?.trim();
    const link = chunk[i + 1]?.trim();
    const priceLine = chunk[i + 2]?.trim();
    if (!name || !priceLine) break;
    const price = priceLine.match(/€([\d.]+)/)?.[1] || "0";
    productLines.push({ name, productLink: link, price, quantity: 1 });
  }

  return {
    userDetails: {
      name,
      surname,
      email,
      address: street,
      city: cityLine?.split(",")[0],
      postalCode: cityLine?.split(",")[1]?.trim(),
      country: address,
    },
    products: productLines
  };
}

// ✅ Function to sanitize and clean price inputs
function sanitizePrice(v) {
  if (v == null) return 0;
  // allow "12,34", "€12.34", etc.
  const s = String(v).replace(/[^0-9,.\-]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
async function sendDiscrepancyEmail(userDetails, discrepancies) {
  const storeEmail = process.env.STORE_EMAIL || process.env.SHOP_EMAIL;
  const adminEmail = process.env.ADMIN_EMAIL; // Your email for alerts

  const discrepancyList = discrepancies.map(d =>
    `<li>Product: ${d.name}<br>Issue: ${d.issue}</li>`
  ).join("");

  const emailContent = `
        <h2>⚠️ Product Data Mismatch Alert ⚠️</h2>
        <p>A discrepancy was found in the order placed by ${userDetails.name} (${userDetails.email}):</p>
        <ul>${discrepancyList}</ul>
        <hr>
        <p>Check your system to resolve the issue.</p>
    `;

  try {
    await confirmationTransporter.sendMail({
      from: `"Store Admin" <${storeEmail}>`,
      to: adminEmail,
      subject: "Product Data Mismatch Detected",
      html: emailContent
    });
    console.log(`✅ Discrepancy alert email sent to admin: ${redactEmail(adminEmail)}`);
  } catch (error) {
    console.error(`❌ Error sending discrepancy email: ${error.message}`);
  }
}

function verifyProducts(website, receivedProducts) {
  if (!productsData[website]) {
    console.error(`⚠️ No products found for website: ${website}`);
    return { valid: false, discrepancies: [{ issue: "Website not found" }] };
  }

  let discrepancies = [];

  receivedProducts.forEach((receivedProduct) => {
    let categoryFound = false;
    let productFound = false;

    // Search in all categories
    for (let category in productsData[website]) {
      let storedProducts = productsData[website][category];

      let matchedProduct = storedProducts.find(p => p.name === receivedProduct.name);
      if (matchedProduct) {
        categoryFound = true;
        productFound = true;

        if (sanitizePrice(matchedProduct.price) !== sanitizePrice(receivedProduct.price)) {
          discrepancies.push({
            name: receivedProduct.name,
            issue: `Price mismatch (Expected: ${matchedProduct.price}, Received: ${receivedProduct.price})`
          });
        }

        if (matchedProduct.productLink !== receivedProduct.productLink) {
          discrepancies.push({
            name: receivedProduct.name,
            issue: `Product link mismatch (Expected: ${matchedProduct.productLink}, Received: ${receivedProduct.productLink})`
          });
        }
        break;
      }
    }

    if (!categoryFound) {
      discrepancies.push({ name: receivedProduct.name, issue: "Category not found" });
    }
    if (!productFound) {
      discrepancies.push({ name: receivedProduct.name, issue: "Product not found" });
    }
  });

  return { valid: discrepancies.length === 0, discrepancies };
}


const ORDER_ID_FILE = path.join(__dirname, "usedOrderIDs.txt");

// Generate a unique 9-digit order ID
function generateUniqueOrderId() {
  // short, sortable-ish id: YYYYMMDD-HHMMSS-rand
  const d = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rnd}`;
}

async function appendPurchaseToDriveFile(userDetails, products, totalExpected, pricePaid) {

  const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || process.env.GOOGLE_DRIVE_FILE_ID;

  if (!sheets || !spreadsheetId) {
    console.warn("⚠️ Google Sheets not configured; skipping appendPurchaseToDriveFile");
    return;
  }


  const sheetName = 'Purchases';

  const now = new Date();
  const purchaseTime = now.toLocaleString("sk-SK", {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  console.log("📦 Raw products array received for Google Sheets:", products);

  const rows = products.map((p, index) => {
    if (!p || !p.name) {
      console.warn(`⚠️ Skipping product at index ${index}:`, p);
      return null;
    }

    const name = `${p.name}${p.selectedOption ? ` (${p.selectedOption})` : ''}`;
    const link = p.productLink || "N/A";
    const expectedPrice = parseDecimalLoose(p.expectedPurchasePrice || p.price || 0);
    const expectedPriceFormatted = expectedPrice.toFixed(2);

    const qty = parseInt(p.quantity) || 1;

    const currentPurchaseNumber = purchaseCounter++;
    saveCounters();

    return [
      currentPurchaseNumber,
      purchaseTime,
      userDetails.name,
      userDetails.surname,
      userDetails.email,
      userDetails.country,
      userDetails.city,
      userDetails.postalCode,
      userDetails.street,
      name,
      link,
      expectedPriceFormatted,
      p.price,
      qty,
      (expectedPrice * qty).toFixed(2)
    ];


  }).filter(Boolean); // Remove nulls

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows }
    });
    console.log("✅ Purchase data appended to Google Sheet.");
  } catch (error) {
    console.error("❌ Failed to append to Google Sheet:", error.message);
  }
}



function getCatalogProductRef(clientItem) {
  const productId = String(clientItem?.productId || clientItem?.id || clientItem?.pid || "").trim();
  const productLink = String(clientItem?.productLink || "").trim();
  const canonicalLink = canonicalizeProductLink(productLink);
  const name = String(clientItem?.name || "").trim();

  if (productId && productsById.has(productId)) return productsById.get(productId);
  if (canonicalLink && productsByCanonLink.has(canonicalLink)) return productsByCanonLink.get(canonicalLink);
  if (productLink && productsByLink.has(productLink)) return productsByLink.get(productLink);
  if (name && (process.env.ALLOW_CATALOG_LOOKUP_BY_NAME === '1' || process.env.NODE_ENV !== 'production') && productsByName.has(name)) return productsByName.get(name);

  return null;
}


function requireCatalogProductRef(clientItem) {
  const hit = getCatalogProductRef(clientItem);
  if (hit) return hit;

  const ref = String(clientItem?.productLink || clientItem?.name || "").trim() || "unknown";
  const err = new Error(`PRODUCT_NOT_FOUND: ${ref}`);
  err.code = "PRODUCT_NOT_FOUND";
  err.ref = ref;
  throw err;
}

function round2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) {
    // Avoid silently corrupting accounting data. Keep legacy behavior (0) but log once per callsite.
    try {
      const err = new Error("round2 received non-finite");
      const key = String(err.stack || "").split("\n").slice(2, 4).join("|");
      global.__round2Warned = global.__round2Warned || new Set();
      if (!global.__round2Warned.has(key)) {
        global.__round2Warned.add(key);
        console.error("[round2][non-finite]", { value: n, callsite: key });
      }
    } catch { }
    return 0;
  }
  return Math.round(x * 100) / 100;
}

function round2Strict(n, ctx = "value") {
  const x = Number(n);
  if (!Number.isFinite(x)) {
    throw new Error(`[round2Strict] non-finite ${ctx}: ${String(n)}`);
  }
  return Math.round(x * 100) / 100;
}


function sanitizeSelectedOptions(rawSelectedOptions, legacySelectedOption) {
  const out = [];
  const arr = Array.isArray(rawSelectedOptions) ? rawSelectedOptions : [];
  for (const o of arr.slice(0, 8)) {
    // Accept either {label,value} or [label,value]
    const label = (o && typeof o === "object" && !Array.isArray(o)) ? String(o.label ?? "") : String((Array.isArray(o) ? o[0] : "") ?? "");
    const value = (o && typeof o === "object" && !Array.isArray(o)) ? String(o.value ?? "") : String((Array.isArray(o) ? o[1] : "") ?? "");
    const l = label.trim().slice(0, 60);
    const v = value.trim().slice(0, 80);
    if (!v) continue;
    out.push({ label: l, value: v });
  }
  // Back-compat: if legacySelectedOption is provided but no structured options
  const legacy = String(legacySelectedOption || "").trim().slice(0, 120);
  if (!out.length && legacy) {
    out.push({ label: "", value: legacy });
  }
  return out;
}


function formatSelectedOptionsKey(selectedOptions, legacySelectedOption) {
  const sel = sanitizeSelectedOptions(selectedOptions, legacySelectedOption);
  return sel.map(o => {
    const l = String(o.label || "").trim().replace(/[:=|]+/g, " ").trim();
    const v = String(o.value || "").trim().replace(/[|]+/g, " ").trim();
    return l ? `${l}=${v}` : v;
  }).filter(Boolean).join(" | ");
}

function resolveVariantPriceEUR(product, selectedOptions, legacySelectedOption, experiments) {
  const ex = (experiments && typeof experiments === "object") ? experiments : null;
  const useB = ex && String(ex.pr || "").toUpperCase() === "B";

  const baseA = parseDecimalLoose(product?.price);
  const baseB = parseDecimalLoose(product?.priceB);
  const base = (useB && Number.isFinite(baseB) && baseB > 0) ? baseB : baseA;

  const mapA = (product && typeof product === "object") ? product.variantPrices : null;
  const mapB = (product && typeof product === "object") ? product.variantPricesB : null;
  const map = (useB && mapB && typeof mapB === "object" && !Array.isArray(mapB)) ? mapB : mapA;

  if (!map || typeof map !== "object" || Array.isArray(map)) return base;

  const sel = sanitizeSelectedOptions(selectedOptions, legacySelectedOption);
  const candidates = [];

  const fullKey = sel.length ? formatSelectedOptionsKey(sel, "") : "";
  if (fullKey) candidates.push(fullKey);

  if (sel.length) {
    const vOnly = sel.map(o => String(o.value || "").trim()).filter(Boolean).join(" | ");
    if (vOnly && vOnly !== fullKey) candidates.push(vOnly);
  }

  if (sel.length === 1) {
    const l = String(sel[0].label || "").trim();
    const v = String(sel[0].value || "").trim();
    if (l && v) candidates.push(`${l}=${v}`);
    if (v) candidates.push(v);
  }

  const legacy = String(legacySelectedOption || "").trim();
  if (legacy) candidates.push(legacy);

  for (const k of candidates) {
    const key = String(k || "").trim();
    if (!key) continue;
    const num = parseDecimalLoose(map[key]);
    if (Number.isFinite(num) && num > 0) return num;
  }

  return base;
}

function formatSelectedOptionSummary(selectedOptions, legacySelectedOption) {
  const arr = Array.isArray(selectedOptions) ? selectedOptions : [];
  const parts = [];
  for (const o of arr) {
    const label = String(o?.label ?? "").trim();
    const value = String(o?.value ?? "").trim();
    if (!value) continue;
    if (!label) { parts.push(value); continue; }
    const cleanLabel = label.endsWith(":") ? label.slice(0, -1) : label;
    parts.push(`${cleanLabel}: ${value}`);
  }
  if (parts.length) return parts.join(", ");
  return String(legacySelectedOption || "").trim();
}

// Back-compat alias: some templates call formatSelectedOptions(...)
function formatSelectedOptions(selectedOptions, legacySelectedOption) {
  return formatSelectedOptionSummary(selectedOptions, legacySelectedOption);
}

function publicTokenHash(token) {
  const salt = String(PUBLIC_TOKEN_SALT || "");
  return crypto.createHash("sha256").update(String(token) + "|" + salt, "utf8").digest("hex");
}

function timingSafeEqualHex(aHex, bHex) {
  const a = Buffer.from(String(aHex || ""), "utf8");
  const b = Buffer.from(String(bHex || ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function addStatusHistory(order, from, to, by = "system", note = "") {
  if (!order) return;
  const prev = Array.isArray(order.statusHistory) ? order.statusHistory[order.statusHistory.length - 1] : null;
  // avoid duplicates on webhook retries
  if (prev && prev.to === to && prev.from === from) return;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ at: new Date(), from: String(from || ""), to: String(to || ""), by: String(by || "system"), note: String(note || "") });
}

function addNote(order, text, by = "admin") {
  if (!order) return;
  const t = String(text || "").trim();
  if (!t) return;
  order.notes = order.notes || [];
  order.notes.push({ at: new Date(), by: String(by || "admin"), text: t.slice(0, 5000) });
}

async function ensureInvoiceNumber(order) {
  if (!order) return;
  if (order.accounting && order.accounting.invoiceNumber) return;

  // Resolve model lazily to avoid "InvoiceCounter is not defined" in edge startup states
  let InvoiceCounterModel = null;
  try {
    InvoiceCounterModel = mongoose.models.InvoiceCounter || mongoose.model("InvoiceCounter");
  } catch {
    const schema = new mongoose.Schema({
      year: { type: Number, required: true, unique: true, index: true },
      seq: { type: Number, default: 0 }
    }, { timestamps: true });
    InvoiceCounterModel = mongoose.models.InvoiceCounter || mongoose.model("InvoiceCounter", schema);
  }

  const paidAt = order.paidAt ? new Date(order.paidAt) : new Date();
  const year = paidAt.getUTCFullYear();

  const counter = await InvoiceCounterModel.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const prefix = String(INVOICE_PREFIX || "").trim();
  const invoiceNumber = prefix
    ? `${prefix}-${year}-${String(counter.seq).padStart(6, "0")}`
    : `${year}-${String(counter.seq).padStart(6, "0")}`;

  order.accounting = order.accounting || {};
  order.accounting.invoiceNumber = invoiceNumber;
  order.accounting.invoiceIssuedAt = new Date();
  order.accounting.customerCountryCode = order.customer?.countryCode || order.accounting.customerCountryCode || "";
}


async function enrichStripeFeesIfMissing(order) {
  try {
    if (!order?.stripe?.paymentIntentId) return;
    if (order?.costs?.stripeFeeMinor != null) return;

    const stripeClient = initStripe();
    if (!stripeClient) return;

    const pi = await stripeClient.paymentIntents.retrieve(order.stripe.paymentIntentId, {
      expand: ["charges.data.balance_transaction"]
    });

    const bt = pi?.charges?.data?.[0]?.balance_transaction;
    const feeMinor = bt?.fee;
    const currency = bt?.currency;

    if (typeof feeMinor !== "number" || !currency) return;

    order.costs = order.costs || {};
    order.costs.stripeFeeMinor = feeMinor;
    order.costs.stripeFeeCurrency = String(currency).toUpperCase();

    const fee = feeMinor / 100;
    // Convert to EUR using the same FX used for amount computation when non-EUR
    let feeEUR = null;
    const cur = (order.pricing?.currency || "EUR").toUpperCase();
    const fx = Number(order.pricing?.exchangeRate || 1);

    if (String(currency).toUpperCase() === "EUR") {
      feeEUR = fee;
    } else if (cur === String(currency).toUpperCase() && fx > 0) {
      // order.pricing.exchangeRate: currency per 1 EUR => currencyAmount / fx = EUR
      feeEUR = fee / fx;
    }

    if (feeEUR != null && Number.isFinite(feeEUR)) {
      order.costs.stripeFeeEUR = Math.round(feeEUR * 100) / 100;
    }
  } catch (e) {
    console.warn("[stripe] fee enrichment failed:", e?.message || e);
  }
}




app.post("/create-payment-intent", paymentIntentLimiter, async (req, res) => {
  try {

    // ---- PI DEBUG (always-on, low-volume) ----
    const reqId = (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8));
    try {
      const b = (req && req.body) ? req.body : {};
      const items = Array.isArray(b.productsFull) && b.productsFull.length ? b.productsFull : (Array.isArray(b.products) ? b.products : []);
      const sample = items.slice(0, 3).map(it => ({
        id: it?.id ?? null,
        productId: it?.productId ?? null,
        pid: it?.pid ?? null,
        name: it?.name ?? null,
        productLink: it?.productLink ?? null,
        qty: it?.quantity ?? it?.qty ?? null,
        price: it?.price ?? null,
        unitPriceEUR: it?.unitPriceEUR ?? null,
        hasRecoToken: !!it?.recoDiscountToken,
        recoPct: it?.recoDiscountPct ?? null
      }));
      console.error('[PI][REQ]', {
        reqId,
        ip: String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
        origin: String(req.headers.origin || ''),
        referer: String(req.headers.referer || ''),
        ua: String(req.headers['user-agent'] || ''),
        currency: b.currency || null,
        country: b.country || null,
        expectedClientTotal: b.expectedClientTotal ?? null,
        clientAmountCents: b.clientAmountCents ?? null,
        fxFetchedAt: b.fxFetchedAt ?? null,
        applyTariff: b.applyTariff ?? null,
        checkoutId: b.checkoutId ?? null,
        itemsCount: items.length,
        hasRecoToken: sample.some(x => x.hasRecoToken),
        sampleItems: sample
      });
    } catch (e) {
      console.error('[PI][REQ][LOG_FAIL]', { reqId, msg: String(e && e.message || e) });
    }

    // Basic origin allowlist (browser requests) + Turnstile (blocks most server-to-server abuse)
    if (!originIsAllowed(req)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const fraud = await _fraudCheck(req, "pi");
    if (!fraud.ok) {
      return res.status(429).json({ error: fraud.code || "FRAUD_VELOCITY" });
    }

    // Best-effort client IP (helps Turnstile remoteip)
    const ip =
      String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip || "")
        .split(",")[0]
        .trim();

    const turnstileToken =
      (req.body && (req.body.turnstileToken || req.body.turnstile)) ||
      req.get("cf-turnstile-response") ||
      req.get("x-turnstile-token") ||
      "";

    const ts = await verifyTurnstile(String(turnstileToken || ""), ip);
    if (!ts.ok) {
      return res.status(403).json({ error: "TURNSTILE_FAILED", details: ts.reason });
    }
    const parsedBody = PaymentIntentBodySchema.safeParse(req.body || {});
    if (!parsedBody.success) return zodBadRequest(res, parsedBody, "Invalid payment intent payload");

    // Ensure Stripe client is available
    const stripeClient = stripe || initStripe();
    if (!stripeClient) {
      return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });
    }


    const {
      websiteOrigin,
      currency,
      country,
      products,
      productsFull,
      expectedClientTotal,
      applyTariff,
      metadata,
      fxFetchedAt, // optional: client can send the exact snapshot timestamp it used
      experiments
    } = parsedBody.data || {};

    // Server-trusted A/B assignments (prevents client tampering, especially for pricing).
    const ab = await computeAbExperimentsForRequest(req, res);
    const experimentsServer = (ab && ab.experiments && typeof ab.experiments === "object") ? ab.experiments : {};


    const origin = String(websiteOrigin || req.headers.origin || "").trim();
    const currencyUsed = String(currency || "EUR").trim().toUpperCase();

    const incomingProducts = Array.isArray(products) ? products : [];
    const incomingProductsFull = Array.isArray(productsFull) ? productsFull : [];
    const itemsIn = (incomingProductsFull.length ? incomingProductsFull : incomingProducts);

    if (!itemsIn.length) return res.status(400).json({ error: "No products provided" });
    if (!productsFlatCache?.length) return res.status(503).json({ error: "Catalog not loaded yet" });

    const toCents = (n) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return 0;
      return Math.round(x * 100);
    };

    const normCC = (v) => (v ? String(v).trim().toUpperCase() : "");
    const countryCode = normCC(country) || null;

    // ---- Build canonical items + compute totals in EUR (SERVER TRUTH) ----
    // NOTE:
    // - itemsTotalAfterItemDiscountsEUR: after item-level reco discounts (this is the base for tier/bundle incentives)
    // - itemsTotalBeforeAnyDiscountsEUR: before any discounts at all (used for accurate discount reporting)
    let itemsTotalAfterItemDiscountsEUR = 0;
    let itemsTotalBeforeAnyDiscountsEUR = 0;

    // Recommendation discount guardrails (optional, auto-applied tokens from /recs)
    const recoCfgGlobal = await RecoConfig.findOne({ widgetId: RECO_WIDGET_DEFAULT, scope: "global", scopeId: null }).lean();
    const recoDiscountCfg = (recoCfgGlobal && recoCfgGlobal.discount && typeof recoCfgGlobal.discount === "object") ? recoCfgGlobal.discount : {};
    const recoDiscountEnabled = !!recoDiscountCfg.enabled;
    const recoDiscountMinPct = Math.max(0, Number(recoDiscountCfg.minPct || 0) || 0);
    const recoDiscountMaxPct = Math.max(recoDiscountMinPct, Number(recoDiscountCfg.maxPct || 0) || 0);
    const recoDiscountMinMarginPct = Math.max(0, Math.min(0.99, Number(recoDiscountCfg.minMarginPct || 0.20) || 0.20));


    const normalizedItems = [];
    for (const p of itemsIn.slice(0, 200)) {
      const qty = Math.min(50, Math.max(1, parseInt(p?.quantity ?? 1, 10) || 1));
      const legacySelectedOption = String(p?.selectedOption || "").slice(0, 120);
      const selectedOptions = sanitizeSelectedOptions(p?.selectedOptions, legacySelectedOption);
      const selectedOption = String(formatSelectedOptionSummary(selectedOptions, legacySelectedOption) || "").slice(0, 160);

      // SERVER TRUTH: lookup from in-RAM catalog
      const cat = requireCatalogProductRef(p);

      const unitEUR = round2(resolveVariantPriceEUR(cat, selectedOptions, legacySelectedOption, experimentsServer));
      const expectedPurchase = parseDecimalLoose(cat.expectedPurchasePrice || unitEUR);
      let unitOriginalEUR = unitEUR;
      let unitEURDiscounted = null;
      let recoDiscountPctApplied = 0;
      let recoDiscountTokenUsed = "";

      if (recoDiscountEnabled) {
        const tokenIn = String(p?.recoDiscountToken || "").trim();
        if (tokenIn) {
          const parsedTok = _recoParseDiscountToken(tokenIn);
          if (parsedTok && String(parsedTok.targetProductId) === String(cat.productId)) {
            let pct = Number(parsedTok.pct || 0);
            if (Number.isFinite(pct)) {
              pct = Math.max(recoDiscountMinPct, Math.min(recoDiscountMaxPct, pct));
              if (pct > 0) {
                // One-time redemption (prevents token reuse)
                const discounted = round2(unitOriginalEUR * (1 - pct / 100));
                const purchase = parseDecimalLoose(cat.expectedPurchasePrice || unitOriginalEUR);
                const marginPct = (discounted - purchase) / Math.max(0.01, discounted);

                if (marginPct >= recoDiscountMinMarginPct) {
                  // Reserve/redeem the token ONLY if we're actually going to apply the discount.
                  const tokenHash = _recoDiscountTokenHash(tokenIn);
                  try {
                    await RecoDiscountRedemption.create({ tokenHash, usedAt: new Date(), expiresAt: new Date(parsedTok.exp) });

                    unitOriginalEUR = round2(unitOriginalEUR);
                    recoDiscountPctApplied = pct;
                    recoDiscountTokenUsed = tokenIn;
                    // store discounted in a temp var
                    unitEURDiscounted = discounted;
                  } catch (e) {
                    // duplicate tokenHash => already used; ignore discount
                  }
                }

              }
            }
          }
        }
      }

      const finalUnitEUR = (typeof unitEURDiscounted === 'number' && Number.isFinite(unitEURDiscounted)) ? round2(unitEURDiscounted) : round2(unitEUR);
      if (!Number.isFinite(finalUnitEUR) || finalUnitEUR <= 0) {
        const ref = String(cat.productLink || cat.name || "unknown").slice(0, 200);
        const err = new Error(`INVALID_CATALOG_PRICE: ${ref}`);
        err.code = "INVALID_CATALOG_PRICE";
        throw err;
      }
      itemsTotalBeforeAnyDiscountsEUR += round2(unitEUR) * qty;
      itemsTotalAfterItemDiscountsEUR += finalUnitEUR * qty;

      normalizedItems.push({
        name: String(cat.name || "").slice(0, 120),
        productId: String(cat.productId || "").trim(),
        selectedOption,
        selectedOptions,
        quantity: qty,
        unitPriceEUR: round2(finalUnitEUR),
        unitPriceOriginalEUR: (recoDiscountPctApplied ? round2(unitOriginalEUR) : null),
        recoDiscountPct: round2(recoDiscountPctApplied),
        recoDiscountToken: recoDiscountTokenUsed,
        price: round2(finalUnitEUR),
        expectedPurchasePrice: round2(expectedPurchase),
        expectedPurchase: round2(expectedPurchase),
        productLink: String(cat.productLink || "").slice(0, 500),
        image: String(cat.image || "").slice(0, 500),
        description: String(cat.description || "").slice(0, 2000),
      });
    }

    const baseTotalEUR = round2Strict(itemsTotalAfterItemDiscountsEUR, "itemsTotalAfterItemDiscountsEUR");
    if (!Number.isFinite(baseTotalEUR) || baseTotalEUR < 0) {
      return res.status(400).json({ error: "Invalid basket total" });
    }
    const baseTotalBeforeAnyDiscountsEUR = round2(itemsTotalBeforeAnyDiscountsEUR);

    // ---- Incentives (tier / bundle / shipping), then Tariff ----
    // Important: incentives are applied BEFORE tariff so totals are predictable and match the storefront.
    // Ensure runtime config is fresh enough (cheap TTL cache).
    try { await refreshIncentivesRuntime(); } catch { }

    const incentives = computeCartIncentivesServer({ baseTotalEUR, normalizedItems });
    const totalBeforeTariffEUR = Number(incentives?.totalWithShippingEUR ?? baseTotalEUR) || baseTotalEUR;

    // ---- Tariff (decimals: 0.2 = +20%) ----
    const tariff = (Number(getTariffPctForCountry(countryCode)) || 0);
    const applyTariffServer = APPLY_TARIFF_SERVER;
    const totalEUR = totalBeforeTariffEUR * (applyTariffServer ? (1 + tariff) : 1);


    // ---- FX candidates: latest + immediately-previous, or explicit fxFetchedAt ----
    let exchangeRate = 1;
    let fxUsedAt = null;

    const computeAmountCentsForRate = (rate) => {
      const totalInCurrency = (currencyUsed === "EUR") ? totalEUR : (totalEUR * Number(rate || 1));
      return toCents(totalInCurrency);
    };

    // Determine the client cents (if provided)
    const clientCents = (req.body && Number.isFinite(Number(req.body.clientAmountCents))) ? parseInt(req.body.clientAmountCents, 10) : 0; // only enforce mismatch when client sends integer cents

    if (currencyUsed !== "EUR") {
      // Ensure latest FX exists
      const latestFx = await getLiveEurRatesSafe();

      // Try to use fxHistory if present; otherwise rely on latest only
      const history =
        (typeof fxHistory !== "undefined" && Array.isArray(fxHistory)) ? fxHistory :
          (Array.isArray(global.fxHistory) ? global.fxHistory : []);

      // Build candidate snapshots:
      // - If client sends fxFetchedAt: accept ONLY that snapshot (must exist in history)
      // - Else: try [latest, immediately-previous] to handle refresh during shopping
      let candidates = [];

      if (fxFetchedAt != null) {
        const ts = Number(fxFetchedAt);
        const snap = history.find((s) => Number(s?.fetchedAt) === ts);
        if (!snap) {
          return res.status(409).json({
            error: "FX_SNAPSHOT_NOT_FOUND",
            message: "Exchange rate snapshot expired. Please refresh and try again.",
            fxFetchedAt: ts
          });
        }
        candidates = [snap];
      } else {
        // newest->oldest
        const sorted = history.slice().sort((a, b) => Number(b?.fetchedAt || 0) - Number(a?.fetchedAt || 0));

        // candidate 1: latest (prefer latestFx object if it has fetchedAt, else history newest)
        candidates.push(latestFx);

        // candidate 2: immediately previous (second newest), but only if it differs from latest
        const newest = sorted[0];
        const prev = sorted[1];
        const newestAt = Number(newest?.fetchedAt || latestFx?.fetchedAt || 0);
        if (prev && Number(prev?.fetchedAt) && Number(prev.fetchedAt) !== newestAt) {
          candidates.push(prev);
        }
      }

      const trySnapshot = (snap) => {
        const rate = snap?.rates?.[currencyUsed];
        if (!rate || !Number.isFinite(rate)) return null;
        const cents = computeAmountCentsForRate(rate);
        return { rate: Number(rate), cents, fetchedAt: snap?.fetchedAt || null };
      };

      // Pick FX:
      // - If no expected total: use first candidate (latest preference)
      // - If expected total: accept first candidate that matches within tolerance
      const tolerance = 2;
      let picked = null;

      if (!clientCents) {
        picked = trySnapshot(candidates[0]);
      } else {
        for (const c of candidates) {
          const r = trySnapshot(c);
          if (!r) continue;
          if (Math.abs(r.cents - clientCents) <= tolerance) {
            picked = r;
            break;
          }
        }
        // If still not picked, we’ll use latest for serverAmountCents in the mismatch response
        if (!picked) picked = trySnapshot(candidates[0]);
      }

      if (!picked) {
        return res.status(500).json({ error: `FX rate missing for ${currencyUsed}` });
      }

      exchangeRate = picked.rate;
      fxUsedAt = picked.fetchedAt;
    }

    const amountCents = computeAmountCentsForRate(exchangeRate);

    if (!Number.isFinite(amountCents) || amountCents < 0) {
      return res.status(400).json({ error: "Amount too small or invalid" });
    }

    // Allow 0-value checkouts (e.g., 100% discounts / store credit). Stripe requires a minimum amount
    // for most currencies, so we handle 0-value carts without creating a PaymentIntent.
    const isFreeCheckout = (amountCents === 0);

    if (!isFreeCheckout && amountCents < 50) {
      return res.status(400).json({ error: "Amount too small or invalid" });
    }
    // ---- Rounded totals for logging + persistence ----
    const _baseTotalBeforeAnyRounded = round2(baseTotalBeforeAnyDiscountsEUR);
    const _baseTotalAfterItemRounded = round2(baseTotalEUR);
    const _subtotalAfterRounded = round2(Number(incentives?.subtotalAfterDiscountsEUR ?? baseTotalEUR) || baseTotalEUR);
    const _totalDiscountRounded = round2(Math.max(0, _baseTotalBeforeAnyRounded - _subtotalAfterRounded));
    const _effectivePct = (_baseTotalBeforeAnyRounded > 0) ? round2((_totalDiscountRounded / _baseTotalBeforeAnyRounded) * 100) : 0;


    // ---- Mismatch check ----
    if (clientCents) {
      if (Math.abs(clientCents - amountCents) > 2) {
        try {
          console.error('[PI][TOTAL_MISMATCH]', {
            reqId,
            clientAmountCents: clientCents,
            serverAmountCents: amountCents,
            diffCents: (amountCents - clientCents),
            currency: currencyUsed,
            country: countryCode,
            fxFetchedAtClient: fxFetchedAt || null,
            fxFetchedAtUsed: fxUsedAt || null,
            exchangeRateUsed: exchangeRate || null,
            applyTariffServer: applyTariffServer,
            applyTariffClient: (applyTariff === true),
            applyTariff: !!applyTariffServer,
            tariffPct: Number(tariff) || 0,
            totals: {
              baseTotalEUR: _baseTotalBeforeAnyRounded, itemsTotalAfterItemDiscountsEUR: _baseTotalAfterItemRounded, subtotalAfterDiscountsEUR: _subtotalAfterRounded,
              totalDiscountEUR: _totalDiscountRounded,
              effectivePct: _effectivePct, shippingFeeEUR: round2(Number(incentives?.shippingFeeEUR ?? 0) || 0), totalBeforeTariffEUR: round2(Number(totalBeforeTariffEUR) || 0), totalEUR: round2(totalEUR)
            },
            discounts: { tierPct: Number(incentives?.tierPct || 0) || 0, tierDiscountEUR: round2(Number(incentives?.tierDiscountEUR || 0) || 0), bundlePct: Number(incentives?.bundlePct || 0) || 0, bundleDiscountEUR: round2(Number(incentives?.bundleDiscountEUR || 0) || 0), freeShippingEligible: !!(incentives?.freeShippingEligible) },
            itemsIn: (itemsIn || []).slice(0, 10).map(p => ({ id: p?.id ?? null, productId: p?.productId ?? null, pid: p?.pid ?? null, qty: p?.quantity ?? p?.qty ?? null, price: p?.price ?? null, unitPriceEUR: p?.unitPriceEUR ?? null, productLink: p?.productLink ?? null, hasRecoToken: !!p?.recoDiscountToken, recoPct: p?.recoDiscountPct ?? null })),
            normalizedItems: (normalizedItems || []).slice(0, 10).map(x => ({ productId: x?.productId ?? null, qty: x?.quantity ?? null, unitEUR: x?.unitPriceEUR ?? null, unitOriginalEUR: x?.unitPriceOriginalEUR ?? null, recoDiscountPctApplied: x?.recoDiscountPct ?? null, recoDiscountTokenUsed: x?.recoDiscountToken ? 'yes' : 'no' }))
          });
          console.error('[PI][TOTAL_MISMATCH][SUMMARY]', { reqId, clientAmountCents: clientCents, serverAmountCents: amountCents, diffCents: (amountCents - clientCents), currency: currencyUsed, country: countryCode, hasRecoToken: (itemsIn || []).some(p => !!p?.recoDiscountToken) });
        } catch (e) {
          console.error('[PI][TOTAL_MISMATCH][LOG_FAIL]', { reqId, msg: String(e && e.message || e) });
        }
        return res.status(409).json({
          error: "TOTAL_MISMATCH",
          message: "Pricing changed. Please refresh and try again.",
          serverAmountCents: amountCents,
          clientAmountCents: clientCents,
          currency: currencyUsed,
          fxFetchedAtUsed: fxUsedAt,
          applyTariff: !!applyTariffServer,
          clientApplyTariff: (applyTariff === true),
          tariffPct: Number(tariff) || 0,
          experimentsServer: experimentsServer
        });
      }
    }

    // ---- Create / Update Draft checkout (cached, NOT a real order) ----
    const checkoutIdIn = parsedBody.data?.checkoutId ? String(parsedBody.data.checkoutId).trim() : "";
    const checkoutTokenIn = parsedBody.data?.checkoutToken ? String(parsedBody.data.checkoutToken).trim() : "";

    const pricingPayload = {
      currency: currencyUsed,
      totalPaidEUR: round2Strict(totalEUR, "totalPaidEUR"),
      // Before any discounts (reco + bundle + tier)
      baseTotalEUR: _baseTotalBeforeAnyRounded,
      itemsTotalBeforeAnyDiscountsEUR: _baseTotalBeforeAnyRounded,
      // After item-level reco discounts, before bundle/tier incentives
      itemsTotalAfterItemDiscountsEUR: _baseTotalAfterItemRounded,
      subtotalAfterDiscountsEUR: _subtotalAfterRounded,
      totalDiscountEUR: _totalDiscountRounded,
      effectivePct: _effectivePct,
      shippingFeeEUR: round2(Number(incentives?.shippingFeeEUR ?? 0) || 0),
      totalBeforeTariffEUR: round2(Number(totalBeforeTariffEUR) || 0),

      // Record tariff inputs used at checkout (for audit / validation)
      customerCountryCode: countryCode || "",
      applyTariff: !!applyTariffServer,
      tariffPct: Number(tariff) || 0,

      discounts: {
        applyToDiscountedItems: (incentives?.applyToDiscountedItems !== false),
        tierPct: Number(incentives?.tierPct || 0) || 0,
        tierDiscountEUR: round2(Number(incentives?.tierDiscountEUR || 0) || 0),
        tierEligibleSubtotalEUR: round2(Number(incentives?.tierEligibleSubtotalEUR ?? 0) || 0),
        tierBaseEUR: round2(Number(incentives?.tierBaseEUR ?? 0) || 0),
        bundlePct: Number(incentives?.bundlePct || 0) || 0,
        bundleDiscountEUR: round2(Number(incentives?.bundleDiscountEUR || 0) || 0)
      },

      freeShippingEligible: !!(incentives?.freeShippingEligible),

      // FX snapshot used for non-EUR orders
      exchangeRate: Number(exchangeRate) || 1,
      fxFetchedAt: fxUsedAt,
      amountCents: amountCents,

      // Experiment flags used at pricing time (debug/audit)
      experimentsServer: experimentsServer
    };

    let draft = null;
    let publicToken = null;

    if (checkoutIdIn) {
      if (!mongoose.Types.ObjectId.isValid(checkoutIdIn)) {
        return res.status(400).json({ error: "Invalid checkoutId" });
      }

      draft = await DraftOrder.findById(checkoutIdIn);
      if (!draft) return res.status(404).json({ error: "CHECKOUT_NOT_FOUND" });

      // Auth required for updating an existing checkout.
      // Preferred: checkout token (publicToken)
      const providedToken = String(checkoutTokenIn || "").trim();
      if (!providedToken) return res.status(401).json({ error: "Unauthorized" });

      const hash = publicTokenHash(providedToken);
      const stored = draft.public?.tokenHash || "";
      if (!stored || !timingSafeEqualHex(hash, stored)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      publicToken = providedToken;

      // Update draft fields (keep existing customer details if already collected)
      draft.status = "CHECKOUT";
      draft.websiteOrigin = origin;
      draft.items = (incentives && incentives.itemsEnriched ? incentives.itemsEnriched : normalizedItems);
      draft.pricing = pricingPayload;
      draft.accounting = draft.accounting || {};
      if (countryCode) draft.accounting.customerCountryCode = countryCode;
      draft.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    } else {
      publicToken = crypto.randomBytes(16).toString("hex");
      const tokenHash = publicTokenHash(publicToken);

      draft = await DraftOrder.create({
        status: "CHECKOUT",
        public: { tokenHash, createdAt: new Date() },
        websiteOrigin: origin,
        customer: {},
        items: (incentives && incentives.itemsEnriched ? incentives.itemsEnriched : normalizedItems),
        pricing: pricingPayload,
        accounting: { customerCountryCode: countryCode || "" },
        stripe: {},
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      });
    }

    // ---- Create / Update Stripe PaymentIntent (draftId in metadata) ----
    const order_summary =
      metadata && typeof metadata === "object" && metadata.order_summary != null
        ? String(metadata.order_summary).slice(0, 499)
        : "";

    const buildMetadata = (existing = {}) => ({
      ...existing,
      draftId: String(draft._id),
      websiteOrigin: origin,
      country: countryCode || "",
      tariff: String(tariff),
      fxFetchedAt: fxUsedAt ? String(fxUsedAt) : "",
      order_summary
    });

    const existingPiId = String(draft?.stripe?.paymentIntentId || "").trim();
    let paymentIntent = null;

    // 0-value carts: no PaymentIntent is required; finalize via /finalize-order free path.
    if (isFreeCheckout) {
      // Persist the draft with a stable marker so finalize can validate
      try {
        draft.status = "FREE_CHECKOUT";
        draft.stripe = draft.stripe || {};
        draft.stripe.paymentIntentId = null;
        await draft.save();
      } catch (e) {
        console.error("[PI][FREE_CHECKOUT][DRAFT_SAVE_FAIL]", { reqId, msg: String(e?.message || e) });
      }

      return res.json({
        ok: true,
        free: true,
        draftId: String(draft._id),
        checkoutId: String(draft._id),
        checkoutPublicToken: publicToken || null,
        currency: currencyUsed
      });
    }

    if (existingPiId && existingPiId.startsWith("pi_")) {
      try {
        const existingPi = await stripeClient.paymentIntents.retrieve(existingPiId);
        const sameCurrency = String(existingPi?.currency || "").toLowerCase() === currencyUsed.toLowerCase();
        const status = String(existingPi?.status || "");

        // Stripe allows amount updates only in certain states.
        const canUpdateAmount = (status === "requires_payment_method" || status === "requires_confirmation");

        if (sameCurrency && canUpdateAmount) {
          paymentIntent = await stripeClient.paymentIntents.update(existingPiId, {
            amount: amountCents,
            metadata: buildMetadata((existingPi && existingPi.metadata) ? existingPi.metadata : {})
          });
        }
      } catch (e) {
        console.warn("[stripe] existing PI update failed; creating a new PI:", e?.message || e);
        paymentIntent = null;
      }
    }

    if (!paymentIntent) {
      paymentIntent = await stripeClient.paymentIntents.create({
        amount: amountCents,
        currency: currencyUsed.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: buildMetadata()
      });
    }

    // Sync PI back to draft
    draft.stripe = draft.stripe || {};
    draft.stripe.paymentIntentId = paymentIntent.id;
    draft.stripe.currency = currencyUsed;
    draft.pricing = pricingPayload;
    draft.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await draft.save();

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      checkoutId: String(draft._id),
      checkoutPublicToken: publicToken,
      amountCents,
      currency: currencyUsed,
      fxFetchedAtUsed: fxUsedAt,
      applyTariff: applyTariffServer,
      applyTariff: !!applyTariffServer,
      tariffPct: Number(tariff) || 0,
      experiments: experimentsServer,
      experimentsServer: experimentsServer
    });
  } catch (err) {
    if (err?.code === "PRODUCT_NOT_FOUND") {
      return res.status(400).json({
        error: "PRODUCT_NOT_FOUND",
        message: "A product in your cart no longer exists (or pricing changed). Please refresh.",
        ref: err.ref
      });
    }
    if (err?.code === "INVALID_CATALOG_PRICE") {
      return res.status(500).json({ error: "INVALID_CATALOG_PRICE", message: err.message });
    }

    console.error("❌ Error creating payment intent:", err);
    return res.status(500).json({ error: "Failed to create payment intent" });
  }
});




async function mergePaymentIntentMetadata(paymentIntentId, patch) {
  try {
    const stripeClient = initStripe();
    if (!stripeClient) return;

    const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    const cur = (pi && pi.metadata && typeof pi.metadata === "object") ? pi.metadata : {};
    const next = { ...cur };

    for (const [k, v] of Object.entries(patch || {})) {
      if (!k) continue;
      // Stripe metadata values must be strings
      next[String(k).slice(0, 40)] = (v == null) ? "" : String(v).slice(0, 500);
    }

    await stripeClient.paymentIntents.update(paymentIntentId, { metadata: next });
  } catch (e) {
    console.warn("⚠ mergePaymentIntentMetadata failed:", e?.message || e);
  }
}

app.post("/store-user-details", storeDetailsLimiter, async (req, res) => {
  try {
    const { checkoutId, token, paymentIntentId, clientSecret, userDetails } = req.body || {};
    if (!userDetails || typeof userDetails !== "object") {
      return res.status(400).json({ error: "Missing userDetails" });
    }
    // Hard cap payload size to prevent abuse (best-effort, since body is already parsed)
    try {
      const raw = JSON.stringify(userDetails);
      if (raw && raw.length > 6000) {
        return res.status(413).json({ error: "userDetails too large" });
      }
      const keys = Object.keys(userDetails || {});
      if (keys.length > 40) {
        return res.status(400).json({ error: "Too many fields in userDetails" });
      }
    } catch { }

    const cid = checkoutId ? String(checkoutId).trim() : "";
    const piid = paymentIntentId ? String(paymentIntentId).trim() : "";

    if (!cid && !piid) {
      return res.status(400).json({ error: "Missing checkoutId or paymentIntentId" });
    }

    // Locate draft first (preferred), otherwise fall back to a real order (if already finalized)
    let draft = null;
    let order = null;

    if (cid) {
      if (!mongoose.Types.ObjectId.isValid(cid)) return res.status(400).json({ error: "Invalid checkoutId" });
      draft = await DraftOrder.findById(cid);
      if (!draft) return res.status(404).json({ error: "CHECKOUT_NOT_FOUND" });

      // Token auth for draft
      const providedToken = String(token || "").trim();
      if (!providedToken) return res.status(401).json({ error: "Unauthorized" });
      const hash = publicTokenHash(providedToken);
      const stored = draft.public?.tokenHash || "";
      if (!stored || !timingSafeEqualHex(hash, stored)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      // If no checkoutId, authorize via clientSecret against the PI.
      const providedSecret = String(clientSecret || "").trim();
      if (!piid || !piid.startsWith("pi_")) return res.status(400).json({ error: "Invalid paymentIntentId" });
      if (!providedSecret || !providedSecret.includes("_secret_")) return res.status(400).json({ error: "clientSecret is required" });

      const stripeClient = initStripe();
      if (!stripeClient) return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });

      const pi = await stripeClient.paymentIntents.retrieve(piid);
      const serverSecret = String(pi?.client_secret || "");
      if (!serverSecret) return res.status(500).json({ error: "client_secret missing on PaymentIntent" });
      const a = Buffer.from(serverSecret, "utf8");
      const b = Buffer.from(providedSecret, "utf8");
      const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);
      if (!ok) return res.status(401).json({ error: "Unauthorized" });

      draft = await DraftOrder.findOne({ "stripe.paymentIntentId": piid });
      if (!draft) {
        // Maybe already finalized
        order = await Order.findOne({ "stripe.paymentIntentId": piid });
        if (!order) return res.status(404).json({ error: "Not found" });
      }
    }

    const target = draft || order;
    if (!target) return res.status(404).json({ error: "Not found" });

    // ---- SANITIZE + STORE DETAILS ----
    const clean = (v, max = 200) => String(v == null ? "" : v).trim().slice(0, max);

    const emailRaw = clean(userDetails.email, 200).toLowerCase();
    const email = (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw)) ? emailRaw : "";

    const phoneRaw = clean(userDetails.phone, 40);
    const phone = phoneRaw.replace(/[^0-9+()\-\s]/g, "").slice(0, 40);

    const cc = clean(userDetails.countryCode || userDetails.country, 3).toUpperCase();
    const countryCode = (/^[A-Z]{2}$/.test(cc)) ? cc : "";

    const marketingOptIn = !!(userDetails.marketingOptIn === true || userDetails.marketingConsent === true);

    target.customer = {
      firstName: clean(userDetails.firstName ?? userDetails.name, 80),
      lastName: clean(userDetails.lastName ?? userDetails.surname, 80),
      email,
      phone,
      address1: clean(userDetails.address1 ?? userDetails.street, 120),
      address2: clean(userDetails.address2, 120),
      city: clean(userDetails.city, 80),
      region: clean(userDetails.region ?? userDetails.state, 80),
      postalCode: clean(userDetails.postalCode ?? userDetails.zip, 30),
      countryCode,

      marketingOptIn: marketingOptIn ? true : !!(target.customer?.marketingOptIn),
      marketingOptInAt: marketingOptIn ? new Date() : (target.customer?.marketingOptInAt || null),
      marketingUnsubscribedAt: target.customer?.marketingUnsubscribedAt || null
    };

    // Keep helpful country code in accounting too
    target.accounting = target.accounting || {};
    if (countryCode) target.accounting.customerCountryCode = countryCode;

    // Ensure we store PI id if it exists
    if (piid) {
      target.stripe = target.stripe || {};
      if (!target.stripe.paymentIntentId) target.stripe.paymentIntentId = piid;
    }

    await target.save();

    // Patch Stripe metadata (preserving existing keys)
    const piForMeta = String(piid || target?.stripe?.paymentIntentId || "").trim();
    if (piForMeta && piForMeta.startsWith("pi_")) {
      await mergePaymentIntentMetadata(piForMeta, {
        draftId: draft ? String(draft._id) : "",
        orderId: order ? String(order.orderId || "") : "",
        customerEmail: target.customer.email || "",
        country: countryCode || ""
      });
    }

    return res.json({ ok: true, checkoutId: draft ? String(draft._id) : null, orderId: order ? String(order.orderId || "") : null });
  } catch (err) {
    console.error("store-user-details error:", err);
    return res.status(500).json({ error: "Failed to store details" });
  }
});


// Public: serve the latest tariffs (from RAM, precomputed JSON)
app.get('/tariffs', (req, res) => {
  if (tariffsETag && req.headers['if-none-match'] === tariffsETag) {
    return res.status(304).end();
  }
  return sendTariffsJson(res);
});

// Backwards compatibility (your frontend used /countries)
// Returns array of {code, tariff}
app.get('/countries', (req, res) => {
  const codes = Object.keys(tariffsData || {}).sort();
  const countries = codes.map(code => ({ code, tariff: tariffsData[code] }));
  res.json(countries);
});






async function sendEmail(userDetails, products, orderId) {
  const storeEmail = process.env.STORE_EMAIL;
  const userEmail = userDetails.email;
  const usedCurrency = userDetails.currency || 'EUR';
  const exchangeRate = cachedRates?.rates?.[usedCurrency] || 1;

  console.log(`📧 Sending order confirmation email to ${redactEmail(userEmail)} in ${usedCurrency}`);

  const totalPrice = products.reduce((sum, p) => {
    const price = parseFloat(p.price) || 0;
    const qty = parseInt(p.quantity) || 1;
    return sum + price * qty;
  }, 0);

  const convertedTotal = (totalPrice * exchangeRate).toFixed(2);

  // Truncation Helpers
  function truncateDescription(text, maxLines = 3, maxCharsPerLine = 30) {
    const lines = [];
    let currentLine = "";

    for (const word of text.split(" ")) {
      if ((currentLine + " " + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length === maxLines - 1) break;
      }
    }

    if (lines.length < maxLines && currentLine) {
      lines.push(currentLine);
    }

    if (lines.length === maxLines) {
      const words = lines[maxLines - 1].split(" ");
      words.pop();
      lines[maxLines - 1] = words.join(" ") + "...";
    }

    return lines.join(" ");
  }
  function truncateName(text, maxLines = 1, maxCharsPerLine = 28) {
    const lines = [];
    let currentLine = "";

    for (const word of text.split(" ")) {
      if ((currentLine + " " + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length === maxLines - 1) break;
      }
    }

    if (lines.length < maxLines && currentLine) {
      lines.push(currentLine);
    }

    if (lines.length === maxLines) {
      const words = lines[maxLines - 1].split(" ");
      words.pop();
      lines[maxLines - 1] = words.join(" ") + "...";
    }

    return lines.join(" ");
  }

  const productRows = products.map(p => {
    const price = parseFloat(p.price) || 0;
    const qty = parseInt(p.quantity) || 1;
    const convertedPrice = (price * exchangeRate).toFixed(2);
    const shortDescription = truncateDescription(p.description);
    const shortName = truncateName(p.name);

    return `
        <table class="product-table" role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
                <td style="width: 25%; padding: 10px;">
                    <a href="${_emailProductLink(p)}" target="_blank" style="text-decoration: none;">
                        <img src="${p.image}" alt="${p.name}" style="width: 100%; max-width: 120px; height: auto; display: block; border-radius: 6px;">
                    </a>
                </td>
                <td style="width: 75%; padding: 10px; vertical-align: top;">
                    <p style="margin: 0; font-weight: bold; font-size: 16px;">
                        <a href="${_emailProductLink(p)}" target="_blank" class="product-name">${p.name}</a>
                    </p>
                    <p class="product-description" style="margin: 4px 0; font-size: 14px;">${shortDescription}</p>
                    <p class="product-price" style="margin: 4px 0; font-weight: bold;">${_emailFormatCurrency(Number(convertedPrice), usedCurrency)}</p>
                </td>
            </tr>
        </table>
        `;
  }).join("");

  const emailContent = `
    <style>
        body, .container {
            background-color: #111;
            color: white;
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        a {
            color: #fff;
            text-decoration: none;
        }
        hr {
            border-color: #333;
        }
        .product-table {
            background-color: #222;
            color: #fff;
            border: 1px solid #444;
            border-radius: 6px;
            font-family: Arial, sans-serif;
        }
        .product-name {
            color: #fff;
        }
        .product-description {
            color: #ccc;
        }
        .product-price {
            color: #fff;
        }

        @media (prefers-color-scheme: light) {
            body, .container {
                background-color: #fff !important;
                color: #000 !important;
            }
            a {
                color: #0066cc !important;
                text-decoration: underline !important;
            }
            hr {
                border-color: #ccc !important;
            }
            .product-table {
                background-color: #f9f9f9 !important;
                color: #000 !important;
                border: 1px solid #ccc !important;
            }
            .product-name {
                color: #0066cc !important;
            }
            .product-description {
                color: #444 !important;
            }
            .product-price {
                color: #000 !important;
            }
        }
    </style>

    <div class="container">
        <div style="text-align: center; padding-bottom: 20px;">
            <h2>SnagletShop</h2>
            <h2>Hi, ${userDetails.name}!</h2>
            <p>Your package has been sent 🚚</p>
            <p style="color: #ccc;">Order ID: <strong style="color: #0f0;">${orderId}</strong></p>
        </div>

        <h3 style="border-bottom: 1px solid; padding-bottom: 5px;">Package Details</h3>
        ${productRows}

        <div style="text-align: right; font-size: 16px; font-weight: bold; padding-top: 20px;">
            Total: ${_emailFormatCurrency(Number(convertedTotal), usedCurrency)}
        </div>

        <div style="padding-top: 20px;">
            <h4>Ship To:</h4>
            <p style="margin: 0;">${userDetails.address}</p>
            <p style="margin: 0;">${userDetails.city}, ${userDetails.postalCode}</p>
            <p style="margin: 0;">${userDetails.country}</p>
        </div>

        <hr style="margin-top: 30px;">
        <p style="font-size: 13px; color: #888;">Thank you for shopping with us.<br>Your Store Team</p>
    </div>
    `;

  try {
    await confirmationTransporter.sendMail({
      from: `"Your Store" <${storeEmail}>`,
      to: userEmail,
      subject: `🧾 Your Order Confirmation — Order ID: ${orderId}`,
      html: emailContent
    });
    console.log(`✅ Email sent to user: ${redactEmail(userEmail)} with Order ID ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
  }
}







app.use(express.static(path.join(__dirname, "frontend")))


const ORDER_DIR = path.join(__dirname, 'orders');
if (!fs.existsSync(ORDER_DIR)) fs.mkdirSync(ORDER_DIR);



function writeOrderToFile(order) {
  const now = new Date();
  const paidAt = order?.paidAt ? new Date(order.paidAt) : now;

  const purchaseTime = paidAt.toLocaleString("sk-SK", {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });

  const dateString = now.toLocaleDateString("sk-SK").replace(/\./g, '-').replace(/\s/g, '');
  const dayFileName = `day-orders-${dateString}.txt`;
  const masterFilePath = path.join(ORDER_DIR, 'orders.txt');
  const dayFilePath = path.join(ORDER_DIR, dayFileName);

  const c = order?.customer || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const pricing = order?.pricing || {};
  const opShip = order?.operator?.shipping || {};
  const costs = order?.costs || {};
  const stripe = order?.stripe || {};

  const paidEUR = Number(pricing.totalPaidEUR || 0);
  const baseTotalEUR = Number(pricing.baseTotalEUR || 0);
  const tariffPct = Number(pricing.tariffPct || 0);
  const currencyUsed = String(pricing.currency || stripe.currency || "EUR");
  const amountMinor = (stripe.amountMinor != null) ? Number(stripe.amountMinor) : Number(pricing.amountCents || 0);
  const approxOriginal = Number.isFinite(amountMinor) ? (amountMinor / 100) : 0;

  const expectedPurchaseTotal = items.reduce((sum, it) => {
    const qty = Number(it.quantity || 1);
    const exp = Number(it.expectedPurchase || 0);
    return sum + (qty * exp);
  }, 0);

  const shippingAli = Number(opShip.aliExpress || 0);
  const shipping3rd = Number(opShip.thirdParty1 || 0) + Number(opShip.thirdParty2 || 0);
  const shippingTotal = shippingAli + shipping3rd;
  const stripeFeeEUR = Number(costs.stripeFeeEUR || 0);

  const profitPreview = paidEUR - (expectedPurchaseTotal + shippingTotal + stripeFeeEUR);

  const lines = [];
  lines.push(`Order ID: ${order?.orderId || ""}`);
  lines.push(`Purchase Time: ${purchaseTime}`);
  lines.push(`Status: ${order?.status || ""}`);
  lines.push("");

  lines.push("Customer:");
  lines.push(`\tName: ${(c.firstName || "").trim()} ${(c.lastName || "").trim()}`.trim());
  lines.push(`\tEmail: ${c.email || ""}`);
  lines.push(`\tPhone: ${c.phone || ""}`);
  lines.push(`\tAddress: ${(c.address1 || "").trim()} ${(c.address2 || "").trim()}`.trim());
  lines.push(`\tCity/ZIP: ${(c.city || "").trim()} ${(c.postalCode || "").trim()}`.trim());
  lines.push(`\tRegion/Country: ${(c.region || "").trim()} ${(c.countryCode || "").trim()}`.trim());
  lines.push("");

  lines.push("Items:");
  for (const it of items) {
    const qty = Number(it.quantity || 1);
    const name = String(it.name || "");
    const sel = formatSelectedOptions(it.selectedOptions, it.selectedOption);
    const link = String(it.productLink || it.url || "");
    lines.push(`\t- ${qty}x ${name}${sel ? ` (${sel})` : ""}`);
    if (link) lines.push(`\t  Link: ${link}`);
    const unit = Number(it.unitPriceEUR || 0);
    const exp = Number(it.expectedPurchase || 0);
    if (unit) lines.push(`\t  Base unit EUR: ${unit.toFixed(2)} | Base line EUR: ${(unit * qty).toFixed(2)}`);
    if (exp) lines.push(`\t  Expected purchase EUR: ${(exp).toFixed(2)} / unit | ${(exp * qty).toFixed(2)} total`);
  }
  lines.push("");

  lines.push(`Base total (EUR): €${baseTotalEUR.toFixed(2)}`);
  lines.push(`Tariff (%): ${tariffPct.toFixed(2)}`);
  lines.push(`Customer paid (EUR): €${paidEUR.toFixed(2)}`);
  if (currencyUsed && approxOriginal) lines.push(`Customer paid (original): ~${approxOriginal.toFixed(2)} ${currencyUsed}`);
  lines.push(`Shipping (EUR): €${shippingTotal.toFixed(2)} (AliExpress: €${shippingAli.toFixed(2)} | 3rd party: €${shipping3rd.toFixed(2)})`);
  if (stripeFeeEUR) lines.push(`Stripe fee (EUR): €${stripeFeeEUR.toFixed(2)}`);
  lines.push(`Expected purchase total (EUR): €${expectedPurchaseTotal.toFixed(2)}`);
  lines.push(`Profit preview (EUR): €${profitPreview.toFixed(2)}`);
  lines.push("*//////////////////*\n");

  const finalText = lines.join("\n") + "\n";

  try {
    fs.appendFileSync(masterFilePath, finalText, 'utf8');
    fs.appendFileSync(dayFilePath, finalText, 'utf8');
    console.log("📝 Order written to:", masterFilePath, "and", dayFilePath);
  } catch (err) {
    console.error("❌ Failed to write order to file:", err.message);
  }
}

async function writeOrderToExcel(order) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("sk-SK").split(".").join("-"); // DD-MM-YYYY
  const yearStr = now.getFullYear().toString();

  const dailyPath = path.join(__dirname, `orders/day-orders-${dateStr}.xlsx`);
  const yearlyPath = path.join(__dirname, `orders/year-orders-${yearStr}.xlsx`);

  const c = order?.customer || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const pricing = order?.pricing || {};
  const opShip = order?.operator?.shipping || {};
  const costs = order?.costs || {};

  const paidEUR = Number(pricing.totalPaidEUR || 0);
  const baseTotalEUR = Number(pricing.baseTotalEUR || 0) || items.reduce((s, it) => s + (Number(it.unitPriceEUR || 0) * Number(it.quantity || 1)), 0);

  const shippingAli = Number(opShip.aliExpress || 0);
  const shipping3rd = Number(opShip.thirdParty1 || 0) + Number(opShip.thirdParty2 || 0);
  const stripeFeeEUR = Number(costs.stripeFeeEUR || 0);

  for (const filePath of [dailyPath, yearlyPath]) {
    const workbook = fs.existsSync(filePath)
      ? await new ExcelJS.Workbook().xlsx.readFile(filePath)
      : new ExcelJS.Workbook();

    const sheet = workbook.worksheets[0] || workbook.addWorksheet("Objednávky");

    // Header (create once)
    if (sheet.rowCount === 0) {
      sheet.addRow([
        "Dátum", "Objednávka ID", "Meno", "Email", "Telefón", "Adresa",
        "Produkt", "Predajná cena (€)", "Nákupná cena (€)",
        "Doprava z Aliexpress (€)", "Doprava 3. strana (€)",
        "Stripe poplatok (€)", "Zisk pred zdanením (€)",
        "Zisk po dani a odpisoch (€)", "Link na produkt"
      ]);
    }

    const baseRow = sheet.rowCount + 1;
    const farby = ["DFFFD6", "D6ECFF"];
    const color = farby[(baseRow % 2)];

    let sumPredaj = 0, sumNakup = 0, sumAli = 0, sum3rd = 0, sumStripe = 0, sumZisk = 0, sumZiskPo = 0;

    items.forEach((it, i) => {
      const qty = Number(it.quantity || 1);
      const unitBase = Number(it.unitPriceEUR || 0);
      const lineBase = unitBase * qty;

      // Allocate paid EUR proportionally to base (fallback: all to first row)
      const predaj = (baseTotalEUR > 0)
        ? (paidEUR * (lineBase / baseTotalEUR))
        : (i === 0 ? paidEUR : 0);

      const expUnit = Number(it.expectedPurchase || 0);
      const nakup = expUnit * qty;

      const ali = (i === 0) ? shippingAli : 0;
      const delivery = (i === 0) ? shipping3rd : 0;
      const stripeFee = (i === 0) ? stripeFeeEUR : 0;

      const zisk = predaj - nakup - ali - delivery - stripeFee;
      const ziskPo = zisk * 0.75;

      sumPredaj += predaj;
      sumNakup += nakup;
      sumAli += ali;
      sum3rd += delivery;
      sumStripe += stripeFee;
      sumZisk += zisk;
      sumZiskPo += ziskPo;

      const sel = formatSelectedOptions(it.selectedOptions, it.selectedOption);
      const productName = `${it.name || ""}${sel ? ` (${sel})` : ""}`.trim();
      const link = it.productLink || it.url || "";


      const row = sheet.addRow([
        i === 0 ? sanitizeSpreadsheetText(dateStr) : "",
        i === 0 ? sanitizeSpreadsheetText(order?.orderId || "") : "",
        i === 0 ? sanitizeSpreadsheetText(`${(c.firstName || "").trim()} ${(c.lastName || "").trim()}`.trim()) : "",
        i === 0 ? sanitizeSpreadsheetText(c.email || "") : "",
        i === 0 ? sanitizeSpreadsheetText(c.phone || "") : "",
        i === 0 ? sanitizeSpreadsheetText(`${(c.address1 || "").trim()}, ${(c.city || "").trim()}, ${(c.postalCode || "").trim()}, ${(c.countryCode || "").trim()}`.replace(/^,\s*|,\s*,/g, "")) : "",
        sanitizeSpreadsheetText(productName),
        Number(predaj.toFixed(2)),
        Number(nakup.toFixed(2)),
        Number(ali.toFixed(2)),
        Number(delivery.toFixed(2)),
        Number(stripeFee.toFixed(2)),
        Number(zisk.toFixed(2)),
        Number(ziskPo.toFixed(2)),
        sanitizeSpreadsheetText(link || "")
      ]);

      if (link && /^https?:\/\//i.test(String(link))) row.getCell(15).hyperlink = String(link);

      row.eachCell(cell => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color }
        };
      });
    });

    // Summary row
    const summaryRow = sheet.addRow([
      "", "", "", "", "", "",
      "🧮 Súčet za objednávku",
      Number(sumPredaj.toFixed(2)),
      Number(sumNakup.toFixed(2)),
      Number(sumAli.toFixed(2)),
      Number(sum3rd.toFixed(2)),
      Number(sumStripe.toFixed(2)),
      Number(sumZisk.toFixed(2)),
      Number(sumZiskPo.toFixed(2)),
      ""
    ]);
    summaryRow.eachCell(cell => { cell.font = { bold: true }; });

    // Separator row
    const separatorRow = sheet.addRow([]);
    separatorRow.eachCell(cell => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "000000" }
      };
      cell.font = { color: { argb: "000000" } };
    });

    await workbook.xlsx.writeFile(filePath);
  }
}






try {
  // Optional: reconcile with canonical catalog on change (useful in file mode).
  // In DB mode, we merge canonical into current RAM (DB-backed) and persist back to DB.
  fs.watch(CANONICAL_PRODUCTS_PATH, { persistent: false }, (evt) => {
    if (evt !== 'change') return;

    const doReconcile = async () => {
      try {
        const canonical = requireFresh(CANONICAL_PRODUCTS_PATH);
        const local = (CATALOG_SOURCE === 'db') ? (productsData || {}) : requireFresh(LOCAL_PRODUCTS_PATH);
        const reconciled = mergeCanonicalIntoLocal(canonical, local);
        await saveProducts(reconciled, 'catalog canonical change');
        console.log('[catalog] Reconciled catalog after canonical change');
      } catch (e) {
        console.warn('[catalog] live reconcile failed:', e.message);
      }
    };

    // Only run automatically when explicitly enabled, or when in file mode (legacy behavior).
    const enabled = (CATALOG_SOURCE === 'file') || String(process.env.ENABLE_CANONICAL_RECONCILE || '').toLowerCase() === 'true';
    if (enabled) doReconcile();
  });
} catch { }


// Public: storefront fetches current prices
app.get('/products', (req, res) => {
  if (productsETag) res.set('ETag', productsETag);
  res.set('Cache-Control', 'public, max-age=300');

  const inm = String(req.headers['if-none-match'] || '');
  if (productsETag && inm === productsETag) return res.status(304).end();

  res.type('application/json').send(productsJsonCache);
});


// Optional: flattened list
app.get('/products/flat', (req, res) => {
  if (productsFlatETag) res.set('ETag', productsFlatETag);
  res.set('Cache-Control', 'public, max-age=300');

  const inm = String(req.headers['if-none-match'] || '');
  if (productsFlatETag && inm === productsFlatETag) return res.status(304).end();

  res.type('application/json').send(productsFlatJsonCache);
});

// New canonical catalog endpoint: productId catalog + category ID lists

// Public: contribution-ranked products (for profit-optimized trending/best-of lists)
app.get('/products/contribution', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(60, Number(req.query.limit || 20) || 20));
    const minSold = Math.max(0, Number(req.query.minSold || 3) || 3);

    const stats = await ProductProfitStats.find({ soldQty: { $gte: minSold } }).lean().catch(() => []);
    stats.sort((a, b) => (Number(b.contributionEUR || 0) - Number(a.contributionEUR || 0)));
    const top = stats.slice(0, limit);
    const ids = top.map(x => x.productId).filter(Boolean);

    const prods = await Product.find({ productId: { $in: ids }, enabled: { $ne: false } }).lean().catch(() => []);
    const byId = new Map(prods.map(p => [p.productId, p]));
    const items = top.map(s => {
      const p = byId.get(s.productId);
      if (!p) return null;
      return {
        productId: p.productId,
        name: p.name,
        price: p.price,
        images: Array.isArray(p.images) ? p.images : [],
        productLink: p.productLink,
        contributionEUR: Number(s.contributionEUR || 0) || 0,
        soldQty: Number(s.soldQty || 0) || 0,
        refundRate: Number(s.refundRate || 0) || 0
      };
    }).filter(Boolean);

    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get('/catalog', (req, res) => {
  if (catalogBundleETag) res.set('ETag', catalogBundleETag);
  res.set('Cache-Control', 'public, max-age=300');

  const inm = String(req.headers['if-none-match'] || '');
  if (catalogBundleETag && inm === catalogBundleETag) return res.status(304).end();

  res.type('application/json').send(catalogBundleJsonCache);
});

// Public: lookup product by productId
app.get('/product/by-id/:productId', (req, res) => {
  const id = String(req.params.productId || '').trim();
  const p = productsByIdCache[id];
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json({ product: p });
});

// Public: server policy/config
app.get('/config', (req, res) => {
  res.type('application/json').send(JSON.stringify({ applyTariff: APPLY_TARIFF_SERVER }));
});

app.get('/storefront-config', (req, res) => {
  // Optional: enforce same origin allowlist (keeps random third-party scraping down)
  try {
    if (!originIsAllowed(req)) return res.status(403).json({ error: "FORBIDDEN" });
  } catch { }

  const cfg = getIncentivesRuntimeSync();
  const ff = getFeatureFlagsRuntimeSyncBestEffort();

  const incentivesEnabled = (__INCENTIVES_RUNTIME?.enabled !== false) && (ff?.incentives?.enabled !== false);

  const payload = {
    featureFlags: ff || null,
    cartIncentives: {
      enabled: incentivesEnabled,
      freeShipping: cfg.freeShipping,
      tierDiscount: cfg.tierDiscount,
      bundles: cfg.bundles,
      topup: cfg.topup
    },
    config: { applyTariff: APPLY_TARIFF_SERVER }
  };

  res.set('Cache-Control', 'public, max-age=300');
  res.type('application/json').send(JSON.stringify(payload));
});

// Admin: update product price/purchase price from management UI
app.patch('/admin/product-price', authMiddleware, async (req, res) => {
  const { productLink, name, newRetailPriceEUR, purchasePriceEUR } = req.body || {};
  const canonIn = canonicalizeProductLink(productLink || '');
  const idIn = String(req.body?.productId || '').trim();
  if (!productLink && !name && !idIn) return res.status(400).json({ error: 'productId, productLink or name required' });

  let found = null, catName = null, idx = -1;
  for (const [c, arr] of Object.entries(productsData || {})) {
    for (let i = 0; i < (arr || []).length; i++) {
      const p = arr[i];
      if (p && typeof p === 'object' &&
        ((productLink && (p.productLink === productLink || canonicalizeProductLink(p.productLink || '') === canonIn)) || (idIn && String(p.productId || '').trim() === idIn) || (name && p.name === name))) {
        found = p; catName = c; idx = i; break;
      }
    }
    if (found) break;
  }
  if (!found) return res.status(404).json({ error: 'Product not found' });

  if (purchasePriceEUR != null) found.expectedPurchasePrice = parseDecimalLoose(purchasePriceEUR);
  if (newRetailPriceEUR != null) found.price = Number(newRetailPriceEUR) || 0;

  try {
    await saveProducts(productsData, 'admin/product-price');
  } catch (e) {
    if (e && e.code === "INVALID_CATALOG") {
      return res.status(400).json({ error: "INVALID_CATALOG", issues: (e.issues || []).slice(0, ZOD_ERR_MAX) });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
  return res.json({ ok: true, product: { category: catName, index: idx, ...found } });
});


// Admin: read canonical catalog (productsById + categoryIdLists)
app.get('/admin/catalog', authMiddleware, (req, res) => {
  res.type('application/json').send(catalogBundleJsonCache);
});

// Admin: update pricing by productId (selling + purchase)
app.patch('/admin/products/:productId/pricing', authMiddleware, async (req, res) => {
  const id = String(req.params.productId || '').trim();
  if (!id) return res.status(400).json({ error: 'productId required' });

  const selling = req.body?.sellingPriceEUR;
  const purchase = req.body?.purchasePriceEUR;

  let updated = 0;
  for (const [cat, arr] of Object.entries(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue;
      if (String(p.productId || '').trim() !== id) continue;
      if (selling != null && selling !== '') p.price = Number(selling) || 0;
      if (purchase != null && purchase !== '') p.expectedPurchasePrice = parseDecimalLoose(purchase);
      updated++;
    }
  }

  if (!updated) return res.status(404).json({ error: 'product not found' });

  try {
    // Persist to mirror
    await saveCatalogToDisk(productsData, "change");
  } catch { }

  saveCatalogToDiskFireAndForget(productsData, "pricing_update");
  return res.json({ ok: true, updated });
});

// Bulk pricing update: accepts {updates:[{productId,sellingPriceEUR,purchasePriceEUR},...]} or an array.
app.patch('/admin/products/pricing/bulk', authMiddleware, async (req, res) => {
  const payload = req.body;
  const updates = Array.isArray(payload) ? payload : (payload?.updates || []);
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be an array' });

  // Build map for faster lookup
  const byId = new Map();
  for (const u of updates) {
    if (!u) continue;
    const id = String(u.productId || u.id || '').trim();
    if (!id) continue;
    const selling = u.sellingPriceEUR;
    const purchase = u.purchasePriceEUR;
    byId.set(id, { selling, purchase });
  }

  let updatedProducts = 0;
  const updatedIds = [];
  for (const [cat, arr] of Object.entries(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue;
      const id = String(p.productId || '').trim();
      if (!id) continue;
      const u = byId.get(id);
      if (!u) continue;

      const selling = u.selling;
      const purchase = u.purchase;

      if (selling != null && selling !== '') p.price = Number(selling) || 0;
      if (purchase != null && purchase !== '') p.expectedPurchasePrice = parseDecimalLoose(purchase);

      updatedProducts++;
      updatedIds.push(id);
      byId.delete(id);
    }
  }

  if (updatedProducts === 0) {
    return res.status(404).json({ error: 'no matching products found', notFound: Array.from(byId.keys()) });
  }

  try {
    await saveCatalogToDisk(productsData, "bulk_pricing_update");
  } catch { /* ignore */ }
  saveCatalogToDiskFireAndForget(productsData, "bulk_pricing_update");

  return res.json({ ok: true, updatedProducts, updatedIds, notFound: Array.from(byId.keys()) });
});


// ===== Contact form protection (/send-message) =====
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.CONTACT_MAX_PER_15MIN || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages. Please try again later." }
});

// Simple per-(ip,email) cooldown to stop bursts even within the same window
const _contactLastSent = new Map();
function isCoolingDown(ip, email) {
  const key = `${ip || "unknown"}|${String(email || "").toLowerCase()}`;
  const now = Date.now();
  const last = _contactLastSent.get(key) || 0;
  const cooldownMs = Number(process.env.CONTACT_COOLDOWN_MS || 60_000); // default 60s
  if (now - last < cooldownMs) return true;
  _contactLastSent.set(key, now);

  // lightweight cleanup
  if (_contactLastSent.size > 5000) {
    for (const [k, t] of _contactLastSent) {
      if (now - t > 6 * 60 * 60 * 1000) _contactLastSent.delete(k);
    }
  }
  return false;
}

function originIsAllowed(req) {
  // Uses the same allowlist as CORS (CORS_ORIGINS + defaults).
  // IMPORTANT: requests made from server-side tools (curl), same-origin navigations,
  // or some embedded contexts may omit the Origin header. Those should not be blocked.
  const origin = req.get("Origin");
  if (!origin) return true;
  const normalized = String(origin).replace(/\/+$/, "");

  // Allow file:// pages (Origin: null) only when explicitly enabled (dev-only).
  if (normalized === "null" && ALLOW_NULL_ORIGIN) return true;

  return allowedOrigins.has(normalized);
}

function sanitizeNoCRLF(v, maxLen) {
  const s = String(v ?? "").replace(/[\r\n]/g, " ").trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function sanitizeMessage(v, maxLen) {
  let s = String(v ?? "");
  s = s.replace(/\u0000/g, "");               // strip nulls
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.trim();
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function isValidEmail(email) {
  if (!email) return false;
  if (email.length > 200) return false;
  if (/[\r\n]/.test(email)) return false; // header injection guard
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true }; // allow if not configured

  if (!token) return { ok: false, reason: "missing token" };

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);
  if (ip) params.append("remoteip", ip);

  try {
    const { data } = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 }
    );
    return { ok: !!data?.success, reason: data };
  } catch (e) {
    return { ok: false, reason: e?.message || "verify failed" };
  }
}

app.post("/send-message", contactLimiter, async (req, res) => {
  // Enforce browser origin (blocks most server-to-server abuse)
  if (!originIsAllowed(req)) {
    return res.status(403).json({ message: "Forbidden." });
  }

  // Best-effort client IP
  const ip = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip || "")
    .split(",")[0]
    .trim();

  // Read body
  const { email, message, turnstileToken, website } = req.body || {};

  const cleanEmail = sanitizeNoCRLF(email, 200);
  const cleanMsg = sanitizeMessage(message, 4000);
  const websiteVal = String(website || "").trim();

  // Honeypot: if filled, pretend success but don't send
  if (websiteVal) {
    console.warn("[contact] honeypot hit:", { ip, email: cleanEmail, website: websiteVal.slice(0, 80) });
    return res.json({ message: "Your message has been sent successfully!" });
  }

  // Validate input
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }
  if ((cleanMsg || "").length < 5) {
    return res.status(400).json({ message: "Please enter a message (at least 5 characters)." });
  }

  // Cooldown guard
  if (isCoolingDown(ip, cleanEmail)) {
    return res.status(429).json({ message: "Please wait a moment before sending another message." });
  }

  // CAPTCHA (Turnstile) verification (only enforced if TURNSTILE_SECRET_KEY is set)
  const captcha = await verifyTurnstile(String(turnstileToken || ""), ip);
  if (!captcha.ok) {
    console.warn("[contact] blocked by captcha:", captcha.reason);
    return res.status(400).json({
      error: "TURNSTILE_FAILED",
      message: "Turnstile verification failed. Please refresh and try again.",
    });
  }

  // Ensure support mail is configured
  if (!CONTACT_SMTP_USER || !CONTACT_SMTP_PASS) {
    console.error("[contact] SUPPORT_EMAIL / SUPPORT_EMAIL_PASSWORD not set; cannot send contact email");
    return res.status(503).json({ message: "Support email is not configured." });
  }

  try {
    const info = await supportTransporter.sendMail({
      from: CONTACT_FROM,
      to: SUPPORT_TO_EMAIL,
      replyTo: cleanEmail,
      subject: "New Contact Form Message",
      text: `From: ${cleanEmail}\nIP: ${ip || "unknown"}\n${cleanMsg}`,
    });

    console.log("[contact] email queued:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (Array.isArray(info?.rejected) && info.rejected.length) {
      return res.status(502).json({ message: "Email rejected by provider. Please email us directly." });
    }

    return res.json({ message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return res.status(500).json({ message: "Failed to send message." });
  }
});


async function sendAdminEmail({ to, subject, text, attachments }) {
  const fromAddress = process.env.STORE_EMAIL || process.env.SHOP_EMAIL;
  const adminRecipient = to || process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;

  if (!fromAddress) {
    console.warn("⚠ [mail] STORE_EMAIL/SHOP_EMAIL not set; cannot send admin email");
    return { skipped: true };
  }
  if (!adminRecipient) {
    console.warn("⚠ [mail] ADMIN_EMAIL/STORE_EMAIL not set; skipping admin email");
    return { skipped: true };
  }

  try {
    await confirmationTransporter.sendMail({
      from: `"SnagletBot" <${fromAddress}>`,
      to: adminRecipient,
      subject,
      text,
      attachments
    });
    console.log(`✅ Admin report email sent to ${adminRecipient}`);
  } catch (error) {
    console.error("❌ Failed to send admin report email:", error.message);
  }
}

async function buildDbSnapshotZip({ dateStr, outDir }) {
  // Exports Orders + Products collections into a single ZIP (NDJSON files) and returns the ZIP path.
  // This is intended for daily admin reporting emails.
  try {
    const snapshotsDir = path.join(outDir || __dirname, "orders", "snapshots");
    if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir, { recursive: true });

    const zipPath = path.join(snapshotsDir, `db-snapshot-${dateStr}.zip`);

    // If a snapshot already exists for today, reuse it to avoid duplicated work.
    if (fs.existsSync(zipPath)) return zipPath;

    const tmpDir = path.join(snapshotsDir, `.tmp-${process.pid}-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const ordersFile = path.join(tmpDir, "orders.ndjson");
    const productsFile = path.join(tmpDir, "products.ndjson");
    const metaFile = path.join(tmpDir, "meta.txt");

    const writeNdjson = async (cursor, filePath) => {
      return new Promise((resolve, reject) => {
        const out = fs.createWriteStream(filePath, { encoding: "utf8" });
        out.on("error", reject);
        (async () => {
          try {
            let n = 0;
            for await (const doc of cursor) {
              out.write(JSON.stringify(doc ?? null) + "\n");
              n++;
            }
            out.end(() => resolve(n));
          } catch (e) {
            try { out.destroy(); } catch { }
            reject(e);
          }
        })();
      });
    };

    // Stream exports (does not load everything into RAM)
    const ordersCursor = Order.find({}).sort({ createdAt: -1 }).lean().cursor();
    const productsCursor = Product.find({}).sort({ createdAt: -1 }).lean().cursor();

    const [ordersCount, productsCount] = await Promise.all([
      writeNdjson(ordersCursor, ordersFile),
      writeNdjson(productsCursor, productsFile),
    ]);

    const meta =
      `DB Snapshot: ${dateStr}\n` +
      `GeneratedAt: ${new Date().toISOString()}\n` +
      `OrdersCount: ${ordersCount}\n` +
      `ProductsCount: ${productsCount}\n`;
    fs.writeFileSync(metaFile, meta, "utf8");

    // ZIP them
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", resolve);
      output.on("error", reject);
      archive.on("warning", (err) => {
        console.warn("[snapshot] archiver warning:", err?.message || err);
      });
      archive.on("error", reject);

      archive.pipe(output);
      archive.file(ordersFile, { name: "orders.ndjson" });
      archive.file(productsFile, { name: "products.ndjson" });
      archive.file(metaFile, { name: "meta.txt" });
      archive.finalize();
    });

    // Cleanup tmp
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { }

    return zipPath;
  } catch (e) {
    console.error("❌ [snapshot] failed to build DB snapshot zip:", e?.message || e);
    return null;
  }
}

schedule.scheduleJob("0 0 * * *", async () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("sk-SK").split(".").join("-");

  const attachments = [];
  const dayTxt = path.join(__dirname, `orders/day-orders-${dateStr}.txt`);
  const dayXlsx = path.join(__dirname, `orders/day-orders-${dateStr}.xlsx`);

  if (fs.existsSync(dayTxt)) attachments.push({ filename: `day-orders-${dateStr}.txt`, path: dayTxt });
  if (fs.existsSync(dayXlsx)) attachments.push({ filename: `day-orders-${dateStr}.xlsx`, path: dayXlsx });

  // Attach full DB snapshot (Orders + Products) as a ZIP so the email always contains data,
  // even if the daily order files are missing/empty.
  const dbSnapZip = await buildDbSnapshotZip({ dateStr, outDir: __dirname });
  if (dbSnapZip && fs.existsSync(dbSnapZip)) {
    attachments.push({ filename: `db-snapshot-${dateStr}.zip`, path: dbSnapZip });
  }


  const emailBody =
    `Krásny deň Ti prajem, Majko,\n\n` +
    `V prílohe sú denné súbory objednávok za ${dateStr} a kompletný DB snapshot (orders + products).\n\n` +
    `S pozdravom,\nSnagletBot`;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;
  if (!adminEmail) {
    console.warn("⚠ [daily-report] ADMIN_EMAIL/STORE_EMAIL not set; skipping daily report email");
    return;
  }

  await sendAdminEmail({
    to: adminEmail,
    subject: `Denné reporty objednávok - ${dateStr}`,
    text: emailBody,
    attachments
  });
});




async function debugListDriveFiles(fileId) {
  if (!drive) {
    console.warn("⚠️ Google Drive not configured; skipping debugListDriveFiles");
    return;
  }
  const fid = String(fileId || process.env.GOOGLE_DRIVE_FILE_ID || process.env.GOOGLE_SHEET_ID || "").trim();
  if (!fid) {
    console.warn("⚠️ No GOOGLE_DRIVE_FILE_ID/GOOGLE_SHEET_ID set; skipping debugListDriveFiles");
    return;
  }

  try {
    const res = await drive.files.get({
      fileId: fid,
      fields: 'id, name',
      supportsAllDrives: true
    });


    console.log("✅ Service account CAN access the file:");
    console.log(`- ${res.data.name}: ${res.data.id}`);
  } catch (error) {
    console.error("❌ Google Drive access failed:", error.message);
  }
}
async function shareFileWithUser(fileId, userEmail) {
  if (!drive) {
    console.warn("⚠️ Google Drive not configured; skipping shareFileWithUser");
    return;
  }
  const fid = String(fileId || "").trim();
  const email = String(userEmail || "").trim();
  if (!fid || !email) {
    console.warn("⚠️ Missing fileId/email; skipping shareFileWithUser");
    return;
  }
  try {
    await drive.permissions.create({
      fileId: fid,
      resource: {
        type: 'user',
        role: 'writer', // You can also use 'reader' or 'commenter'
        emailAddress: email,
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    console.log(`✅ File shared with ${redactEmail(userEmail)}`);
  } catch (error) {
    console.error(`❌ Failed to share file: ${error.message}`);
  }
}
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function requireFresh(file) {
  delete require.cache[require.resolve(file)];
  return require(file);
}

function writeProductsJs(file, obj) {
  ensureDataDir();

  const js = 'module.exports = ' + JSON.stringify(obj, null, 2) + ';\n';
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;

  fs.writeFileSync(tmp, js, 'utf8');
  fs.renameSync(tmp, file); // atomic on same filesystem
}

function productKey(p) {
  return (p && typeof p === 'object') ? (
    (p.productLink && String(p.productLink).trim()) ||
    (p.link && String(p.link).trim()) ||
    (p.name && String(p.name).trim()) ||
    null
  ) : null;
}

function indexAllByKey(catalog) {
  const map = new Map();
  for (const [cat, arr] of Object.entries(catalog || {})) {
    (arr || []).forEach(p => {
      const key = productKey(p);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ category: cat, product: p });
    });
  }
  return map;
}

// Keep content from canonical; preserve your edited numeric fields from local
function mergeCanonicalIntoLocal(canonical, local) {
  const localIndex = indexAllByKey(local);
  const merged = {};

  for (const [cat, canonArr] of Object.entries(canonical || {})) {
    merged[cat] = (canonArr || []).map(canonP => {
      const key = productKey(canonP);
      const localFirst = key && (localIndex.get(key)?.[0]?.product);

      const out = { ...canonP }; // names/descriptions/images/categories come from canonical

      // Persist server-side overrides
      if (localFirst && localFirst.expectedPurchasePrice != null) {
        out.expectedPurchasePrice = Number(localFirst.expectedPurchasePrice) || 0;
      } else if (out.expectedPurchasePrice != null) {
        out.expectedPurchasePrice = Number(out.expectedPurchasePrice) || 0;
      }

      // Optional: also preserve your edited retail price if you change it via management UI
      if (localFirst && localFirst.price != null) {
        out.price = parseDecimalLoose(localFirst.price);
      } else if (out.price != null) {
        out.price = parseDecimalLoose(out.price);
      }

      return out;
    });
  }

  // Categories or items missing in canonical are implicitly dropped by iterating canonical only
  return merged;
}

function initialiseProductsStore() {
  ensureDataDir();

  // Ensure canonical exists (so requireFresh won't crash on fresh installs)
  if (!fs.existsSync(CANONICAL_PRODUCTS_PATH)) {
    try {
      writeProductsJs(CANONICAL_PRODUCTS_PATH, {});
      console.warn(`[catalog] Canonical catalog missing; created empty at ${CANONICAL_PRODUCTS_PATH}`);
    } catch (e) {
      console.warn('[catalog] failed to create empty canonical:', e.message);
    }
  }

  // First-time: seed local mirror from canonical
  if (!fs.existsSync(LOCAL_PRODUCTS_PATH)) {
    const canonical = requireFresh(CANONICAL_PRODUCTS_PATH) || {};
    writeProductsJs(LOCAL_PRODUCTS_PATH, canonical);
    console.log(`[catalog] Seeded local at ${LOCAL_PRODUCTS_PATH}`);
  }

  // Reconcile on boot (canonical → local; preserve edited fields)
  if (CATALOG_SOURCE === 'file') {
    try {
      const canonical = requireFresh(CANONICAL_PRODUCTS_PATH) || {};
      const local = requireFresh(LOCAL_PRODUCTS_PATH) || {};
      const reconciled = mergeCanonicalIntoLocal(canonical, local);
      writeProductsJs(LOCAL_PRODUCTS_PATH, reconciled);
      console.log('[catalog] Reconciled local copy with canonical on boot');
    } catch (e) {
      console.warn('[catalog] reconcile failed on boot:', e.message);
    }
  }
}


// ✅ Start Server

// ===== Expenses endpoints =====
registerExpensesRoutes(app, { requireAdmin, Expense, dataDir: DATA_DIR });

// ===== Stripe reconciliation (admin) =====
function requireStripeReady(res) {
  const stripeClient = stripe || initStripe();
  if (!stripeClient) {
    res.status(503).json({ error: "Stripe is not configured (missing STRIPE_SECRET_KEY/STRIPE_API_KEY)" });
    return null;
  }
  return stripeClient;
}

app.get("/admin/reconcile/payouts", requireAdmin, async (req, res) => {
  const stripeClient = requireStripeReady(res);
  if (!stripeClient) return;
  const from = req.query.from ? Math.floor(new Date(req.query.from).getTime() / 1000) : undefined;
  const to = req.query.to ? Math.floor(new Date(req.query.to).getTime() / 1000) : undefined;

  const params = { limit: 20 };
  if (from) params.created = { ...(params.created || {}), gte: from };
  if (to) params.created = { ...(params.created || {}), lte: to };

  const payouts = await stripeClient.payouts.list(params);
  const out = [];
  for (const p of payouts.data) {
    // Summarize balance transactions for this payout (gross/fees/net)
    let gross = 0, fees = 0, net = 0;
    let hasMore = true;
    let starting_after = undefined;
    // cap iterations
    for (let i = 0; i < 5 && hasMore; i++) {
      const bt = await stripeClient.balanceTransactions.list({
        payout: p.id,
        limit: 100,
        ...(starting_after ? { starting_after } : {})
      });
      for (const t of bt.data) {
        // amounts are in minor units of t.currency
        net += t.net || 0;
        fees += t.fee || 0;
        gross += t.amount || 0;
      }
      hasMore = bt.has_more;
      starting_after = bt.data?.[bt.data.length - 1]?.id;
    }
    out.push({
      id: p.id,
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      arrival_date: p.arrival_date,
      created: p.created,
      statement_descriptor: p.statement_descriptor || "",
      totalsMinor: { gross, fees, net }
    });
  }
  res.json({ payouts: out });
});

app.get("/admin/reconcile/unmatched", requireAdmin, async (req, res) => {
  const stripeClient = requireStripeReady(res);
  if (!stripeClient) return;

  const from = req.query.from ? Math.floor(new Date(req.query.from).getTime() / 1000) : undefined;
  const to = req.query.to ? Math.floor(new Date(req.query.to).getTime() / 1000) : undefined;

  const params = { limit: 100 };
  if (from) params.created = { ...(params.created || {}), gte: from };
  if (to) params.created = { ...(params.created || {}), lte: to };

  const pis = await stripeClient.paymentIntents.list(params);
  const succeeded = pis.data.filter(pi => pi.status === "succeeded");
  const ids = succeeded.map(pi => pi.id);

  const existing = await Order.find({ "stripe.paymentIntentId": { $in: ids } }, { "stripe.paymentIntentId": 1, orderId: 1 }).lean();
  const set = new Set(existing.map(o => o.stripe?.paymentIntentId).filter(Boolean));

  const unmatched = succeeded.filter(pi => !set.has(pi.id)).map(pi => ({
    id: pi.id,
    amount: pi.amount,
    currency: pi.currency,
    created: pi.created,
    description: pi.description || "",
    receipt_email: pi.receipt_email || "",
    customer: pi.customer || null
  }));

  res.json({ unmatched, matchedCount: succeeded.length - unmatched.length, checked: succeeded.length });
});

// ===== Backup / export everything (admin) =====
app.get("/admin/backup/export.zip", requireAdmin, async (req, res) => {
  const includeAttachments = String(req.query.includeAttachments || "0") === "1";
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="snagletshop_backup_${stamp}.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    try { res.status(500).end(String(err?.message || err)); } catch { }
  });
  archive.pipe(res);

  // Orders
  const orders = await Order.find({}).lean();
  archive.append(JSON.stringify({ exportedAt: now.toISOString(), count: orders.length, orders }, null, 2), { name: "orders.json" });

  // Expenses
  const expenses = await Expense.find({}).lean();
  archive.append(JSON.stringify({ exportedAt: now.toISOString(), count: expenses.length, expenses }, null, 2), { name: "expenses.json" });

  // Settings placeholder (future)
  archive.append(JSON.stringify({ exportedAt: now.toISOString(), settings: {} }, null, 2), { name: "settings.json" });

  // Attachments (optional)
  if (includeAttachments) {
    for (const e of expenses) {
      for (const a of (e.attachments || [])) {
        if (a.storagePath && fs.existsSync(a.storagePath)) {
          archive.file(a.storagePath, { name: `expense_attachments/${e._id}/${a.filename}` });
        }
      }
    }
  }

  await archive.finalize();
});

// ===== Analytics (admin) =====
function canonicalProductKeyFromItem(item) {
  const link = String(item?.productLink || "");
  const m = link.match(/\/item\/(\d+)\.html/i) || link.match(/aliexpress\.com\/item\/(\d+)/i);
  if (m) return `ae:${m[1]}`;
  if (!link) return "unknown";
  // strip query params
  return link.split("?")[0];
}

app.get("/admin/analytics/profit", requireAdmin, async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const group = String(req.query.group || "product");

  const orders = await Order.find({
    createdAt: { $gte: from, $lte: to },
    status: "PAID"
  }).lean();

  if (group === "country") {
    const map = new Map();
    for (const o of orders) {
      const country = (o?.accounting?.customerCountryCode || o?.customer?.countryCode || o?.customer?.country || "").toUpperCase() || "UNKNOWN";
      const f = computeOrderFinancials(o);
      const prev = map.get(country) || { key: country, orders: 0, netRevenue: 0, fees: 0, shipping: 0, cogs: 0, otherOrderCosts: 0, profit: 0 };
      prev.orders += 1;
      prev.netRevenue += f.netRevenue;
      prev.fees += f.fees;
      prev.shipping += f.shipping;
      prev.cogs += f.cogs;
      prev.otherOrderCosts += f.other;
      prev.profit += f.net;
      map.set(country, prev);
    }
    const rows = Array.from(map.values()).sort((a, b) => b.profit - a.profit);
    return res.json({ group: "country", rows });
  }

  // default: product-level profit allocation
  const map = new Map();
  for (const o of orders) {
    const f = computeOrderFinancials(o);
    const items = o.items || [];
    const itemRevenue = items.map(it => Number(it.unitPriceEUR || 0) * Number(it.quantity || 0));
    const orderItemsRevenue = itemRevenue.reduce((a, b) => a + b, 0) || 1;
    // allocate order-level fees+shipping+other proportionally by item revenue share
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const share = (itemRevenue[i] || 0) / orderItemsRevenue;
      const key = canonicalProductKeyFromItem(it);
      const qty = Number(it.quantity || 0) || 0;
      const revenue = itemRevenue[i] || 0;
      const cogs = (Number(it.expectedPurchase || 0) || 0) * qty;
      const refunds = f.refunds * share;
      const fees = f.fees * share;
      const ship = f.shipping * share;
      const other = (f.other) * share;
      const netRevenue = revenue - refunds;
      const profit = netRevenue - fees - ship - cogs - other;

      const prev = map.get(key) || { key, name: it.name || "", qty: 0, revenue: 0, refunds: 0, netRevenue: 0, fees: 0, shipping: 0, cogs: 0, otherOrderCosts: 0, profit: 0 };
      prev.qty += qty;
      prev.revenue += revenue;
      prev.refunds += refunds;
      prev.netRevenue += netRevenue;
      prev.fees += fees;
      prev.shipping += ship;
      prev.cogs += cogs;
      prev.otherOrderCosts += other;
      prev.profit += profit;
      if (!prev.name && it.name) prev.name = it.name;
      map.set(key, prev);
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  res.json({ group: "product", rows });
});

async function renameProductId(oldId, newId) {
  oldId = String(oldId || "").trim();
  newId = String(newId || "").trim();
  if (!oldId || !newId) throw new Error("oldId/newId required");
  if (oldId === newId) return;

  // ensure newId doesn't already exist
  for (const arr of Object.values(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== "object") continue;
      if (String(p.productId || "").trim() === newId) {
        throw new Error("new productId already exists");
      }
    }
  }

  // rename in productsData
  let renamed = 0;
  for (const arr of Object.values(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== "object") continue;
      if (String(p.productId || "").trim() === oldId) {
        p.productId = newId;
        renamed++;
      }
    }
  }

  if (!renamed) throw new Error("product not found");

  // Persist + rebuild caches + DB sync + snapshot
  await saveCatalogToDisk(productsData, `rename_${oldId}_to_${newId}`);
}

// Admin: create a new product (adds to catalog + DB + snapshot)
app.post('/admin/products', authMiddleware, async (req, res) => {
  const body = req.body || {};

  let categories = body.categories;
  if (!Array.isArray(categories) || !categories.length) {
    const single = String(body.category || "").trim();
    categories = single ? [single] : [];
  }
  categories = categories.map(c => String(c || "").trim()).filter(Boolean);
  if (!categories.length) return res.status(400).json({ error: "categories required" });

  const name = String(body.name || "").trim();
  if (!name) return res.status(400).json({ error: "name required" });

  const productLink = body.productLink != null ? String(body.productLink).trim() : "";
  const canonicalLink = canonicalizeProductLink(productLink);


  // allow specifying productId. If missing (or legacy/url-derived), mint a new non-URL-derived id.
  const idx = rebuildCatalogIndexes(productsData || {});
  const taken = new Set(Object.keys(idx.productsById || {}));

  let productId = String(body.productId || "").trim();

  const providedIsValid =
    productId &&
    !_isLegacyOrUrlDerivedProductId(productId, productLink, canonicalLink);

  if (providedIsValid) {
    if (taken.has(productId)) {
      return res.status(400).json({ error: "productId already exists" });
    }
    taken.add(productId);
  } else {
    productId = _generateUniqueProductId(taken);
  }


  // If this productId was previously deleted, remove tombstone (explicit re-add)
  tombstoneRemove(productId);

  const price = parseDecimalLoose(body.price);
  const priceB = parseDecimalLoose(body.priceB);
  const expectedPurchasePrice = parseDecimalLoose(body.expectedPurchasePrice);

  const variantPrices = _sanitizeVariantPrices(body.variantPrices);
  const variantPricesB = _sanitizeVariantPrices(body.variantPricesB);

  const variantPurchasePrices = _sanitizeVariantPrices(body.variantPurchasePrices);
  const pricedOptionGroupRaw = body.pricedOptionGroup != null ? body.pricedOptionGroup : body.pricedOptionCategory;
  const pricedOptionGroup = pricedOptionGroupRaw != null ? String(pricedOptionGroupRaw).trim() : "";

  const description = body.description != null ? String(body.description) : "";
  const nameB = body.nameB != null ? String(body.nameB) : "";
  const descriptionB = body.descriptionB != null ? String(body.descriptionB) : "";
  const deliveryText = body.deliveryText != null ? String(body.deliveryText) : "";
  const deliveryTextB = body.deliveryTextB != null ? String(body.deliveryTextB) : "";

  let images = [];
  if (Array.isArray(body.images)) images = body.images.map(x => String(x || "").trim()).filter(Boolean);
  if (typeof body.images === "string") images = String(body.images).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (typeof body.image === "string" && body.image.trim()) images.unshift(body.image.trim());

  // Optional A/B image variant
  let imagesB = [];
  if (Array.isArray(body.imagesB)) imagesB = body.imagesB.map(x => String(x || "").trim()).filter(Boolean);
  if (typeof body.imagesB === "string") imagesB = String(body.imagesB).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const imageB = (body.imageB != null) ? String(body.imageB || "").trim() : "";
  if (imageB) imagesB.unshift(imageB);

  // Deduplicate
  images = Array.from(new Set(images));
  imagesB = Array.from(new Set(imagesB));

  // Options: legacy productOptions (single group) + optionGroups (multi-group)
  let optionGroups = undefined;
  let productOptions = undefined;
  try {
    const coerced = coerceOptionsFromBody(body);
    optionGroups = coerced.optionGroups;
    productOptions = coerced.productOptions;
    if (optionGroups === null) optionGroups = undefined;
    if (productOptions === null) productOptions = undefined;

    // Cap combined payload size
    const rawStr = JSON.stringify({ optionGroups, productOptions });
    if (rawStr && rawStr.length > 30000) return res.status(400).json({ error: 'options too large' });
  } catch (e) {
    return res.status(400).json({ error: String(e?.message || e) });
  }

  const product = normalizeCatalog({
    _tmp: [{
      name,
      productLink,
      canonicalLink,
      productId,
      price,
      ...(Number.isFinite(priceB) && priceB > 0 ? { priceB } : {}),
      expectedPurchasePrice,
      description,
      ...(nameB ? { nameB } : {}),
      ...(descriptionB ? { descriptionB } : {}),
      ...(deliveryText ? { deliveryText } : {}),
      ...(deliveryTextB ? { deliveryTextB } : {}),
      images,
      ...(imagesB && imagesB.length ? { imagesB } : {}),
      ...(imageB ? { imageB } : {}),
      ...(variantPrices !== undefined ? { variantPrices } : {}),
      ...(variantPricesB !== undefined ? { variantPricesB } : {}),
      ...(variantPurchasePrices !== undefined ? { variantPurchasePrices } : {}),
      ...(pricedOptionGroup ? { pricedOptionGroup, pricedOptionCategory: pricedOptionGroup } : {}),
      ...(productOptions !== undefined ? { productOptions } : {}),
      ...(optionGroups !== undefined ? { optionGroups } : {})
    }]
  })._tmp[0];

  // Insert product into each selected category (can belong to multiple categories)
  for (const category of categories) {
    if (!productsData[category]) productsData[category] = [];
    const arr = Array.isArray(productsData[category]) ? productsData[category] : [];

    // avoid duplicate
    if (arr.some(x => x && typeof x === "object" && String(x.productId || "").trim() === productId)) continue;

    // keep icon meta row first (if present)
    const hasIconMeta = arr.length && arr[0] && typeof arr[0] === "object" &&
      typeof arr[0].icon === "string" && String(arr[0].icon).trim() &&
      (!arr[0].productLink || !String(arr[0].productLink).trim()) &&
      (!arr[0].name || !String(arr[0].name).trim());

    const prodCopy = { ...product }; // insert a copy
    if (hasIconMeta) {
      productsData[category] = [arr[0], ...arr.slice(1), prodCopy];
    } else {
      productsData[category] = [...arr, prodCopy];
    }
  }

  // Persist + sync + snapshot
  await saveCatalogToDisk(productsData, "product_create");

  res.json({ ok: true, productId });
});

// Admin: update product details by productId (name, links, prices, options, images)
app.patch('/admin/products/:productId', authMiddleware, async (req, res) => {
  const id = String(req.params.productId || '').trim();
  const newProductId = req.body?.newProductId != null ? String(req.body.newProductId).trim() : null;
  if (!id) return res.status(400).json({ error: 'productId required' });

  const body = req.body || {};
  const categoriesReq = Array.isArray(body.categories) ? body.categories.map(c => String(c || "").trim()).filter(Boolean) : null;
  const name = body.name != null ? String(body.name) : null;
  const productLink = body.productLink != null ? String(body.productLink) : null;
  const canonicalLink = productLink ? canonicalizeProductLink(productLink) : null;

  const nameB = body.nameB != null ? String(body.nameB) : null;
  const descriptionB = body.descriptionB != null ? String(body.descriptionB) : null;
  const deliveryText = body.deliveryText != null ? String(body.deliveryText) : null;
  const deliveryTextB = body.deliveryTextB != null ? String(body.deliveryTextB) : null;

  const description = body.description != null ? String(body.description) : null;

  // Allow either explicit fields or the previous pricing names
  const sellingPrice =
    body.price != null ? body.price :
      body.sellingPriceEUR != null ? body.sellingPriceEUR :
        null;

  const sellingPriceB = body.priceB != null ? body.priceB : null;

  const purchasePrice =
    body.expectedPurchasePrice != null ? body.expectedPurchasePrice :
      body.purchasePriceEUR != null ? body.purchasePriceEUR :
        null;

  // images: accept array of strings
  let images = null;
  if (Array.isArray(body.images)) {
    images = body.images.map(x => String(x || '').trim()).filter(Boolean);
  } else if (typeof body.images === 'string') {
    images = String(body.images).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  }
  // variantPrices: accept object or JSON string, or null to delete
  const hasVariantPrices = Object.prototype.hasOwnProperty.call(body, "variantPrices");
  let variantPrices = undefined;
  if (hasVariantPrices) {
    if (body.variantPrices === null) variantPrices = null;
    else variantPrices = _sanitizeVariantPrices(body.variantPrices);
    if (variantPrices === undefined) variantPrices = null;
  }

  // variantPricesB: accept object or JSON string, or null to delete
  const hasVariantPricesB = Object.prototype.hasOwnProperty.call(body, "variantPricesB");
  let variantPricesB = undefined;
  if (hasVariantPricesB) {
    if (body.variantPricesB === null) variantPricesB = null;
    else variantPricesB = _sanitizeVariantPrices(body.variantPricesB);
    if (variantPricesB === undefined) variantPricesB = null;
  }

  // variantPurchasePrices: accept object or JSON string, or null to delete
  const hasVariantPurchasePrices = Object.prototype.hasOwnProperty.call(body, "variantPurchasePrices");
  let variantPurchasePrices = undefined;
  if (hasVariantPurchasePrices) {
    if (body.variantPurchasePrices === null) variantPurchasePrices = null;
    else variantPurchasePrices = _sanitizeVariantPrices(body.variantPurchasePrices);
    if (variantPurchasePrices === undefined) variantPurchasePrices = null;
  }

  // pricedOptionGroup/pricedOptionCategory: accept string, or null/empty to delete
  const hasPricedOptionGroup =
    Object.prototype.hasOwnProperty.call(body, "pricedOptionGroup") ||
    Object.prototype.hasOwnProperty.call(body, "pricedOptionCategory");
  let pricedOptionGroup = undefined;
  if (hasPricedOptionGroup) {
    const raw = Object.prototype.hasOwnProperty.call(body, "pricedOptionGroup")
      ? body.pricedOptionGroup
      : body.pricedOptionCategory;
    if (raw === null) pricedOptionGroup = null;
    else {
      const s = String(raw ?? "").trim();
      pricedOptionGroup = s || null;
    }
  }



  // Options: legacy productOptions (single group) + optionGroups (multi-group)
  let optionGroups = undefined;
  let productOptions = undefined;
  try {
    const coerced = coerceOptionsFromBody(body);
    optionGroups = coerced.optionGroups;
    productOptions = coerced.productOptions;

    const rawStr = JSON.stringify({ optionGroups, productOptions });
    if (rawStr && rawStr.length > 30000) return res.status(400).json({ error: 'options too large' });
  } catch (e) {
    return res.status(400).json({ error: String(e?.message || e) });
  }

  let effectiveId = id;
  if (newProductId && newProductId !== id) {
    try {
      await renameProductId(id, newProductId);
      // continue edits on new id
      effectiveId = newProductId;
    } catch (e) {
      return res.status(400).json({ error: String(e?.message || e) });
    }
  }


  // Apply to all occurrences in productsData
  let updated = 0;
  for (const arr of Object.values(productsData || {})) {
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue;
      if (String(p.productId || '').trim() !== effectiveId) continue;

      if (name !== null) p.name = name;
      if (nameB !== null) p.nameB = nameB;
      if (productLink !== null) p.productLink = productLink;
      if (canonicalLink !== null) p.canonicalLink = canonicalLink;


      if (description !== null) p.description = description;
      if (descriptionB !== null) p.descriptionB = descriptionB;
      if (deliveryText !== null) p.deliveryText = deliveryText;
      if (deliveryTextB !== null) p.deliveryTextB = deliveryTextB;

      if (sellingPrice !== null && sellingPrice !== '') p.price = Number(sellingPrice) || 0;
      if (sellingPriceB !== null && sellingPriceB !== '') p.priceB = Number(sellingPriceB) || 0;
      if (purchasePrice !== null && purchasePrice !== '') p.expectedPurchasePrice = parseDecimalLoose(purchasePrice);

      if (images !== null) {
        // prefer existing field name if present
        if (Array.isArray(p.images) || p.images === undefined) p.images = images;
        else if (Array.isArray(p.imageLinks) || p.imageLinks === undefined) p.imageLinks = images;
        else p.images = images;
      }

      if (variantPrices !== undefined) {
        if (variantPrices === null) delete p.variantPrices;
        else p.variantPrices = variantPrices;
      }

      if (variantPricesB !== undefined) {
        if (variantPricesB === null) delete p.variantPricesB;
        else p.variantPricesB = variantPricesB;
      }

      if (variantPurchasePrices !== undefined) {
        if (variantPurchasePrices === null) delete p.variantPurchasePrices;
        else p.variantPurchasePrices = variantPurchasePrices;
      }

      if (pricedOptionGroup !== undefined) {
        if (pricedOptionGroup === null) {
          delete p.pricedOptionGroup;
          delete p.pricedOptionCategory;
        } else {
          p.pricedOptionGroup = pricedOptionGroup;
          p.pricedOptionCategory = pricedOptionGroup;
        }
      }

      if (optionGroups !== undefined) {
        if (optionGroups === null) delete p.optionGroups;
        else p.optionGroups = optionGroups;
      }

      if (productOptions !== undefined) {
        if (productOptions === null) delete p.productOptions;
        else p.productOptions = productOptions;
      }

      updated++;
    }
  }

  // If categories were provided, move productId across category lists.
  if (categoriesReq) {
    // Find a template product (first occurrence)
    let templateProd = null;

    // Remove product from all categories first
    for (const [cat, arr] of Object.entries(productsData || {})) {
      if (!Array.isArray(arr)) continue;
      const kept = [];
      for (const p of arr) {
        if (!p || typeof p !== "object") { kept.push(p); continue; }
        if (String(p.productId || "").trim() === effectiveId) {
          if (!templateProd) templateProd = p;
          continue; // remove
        }
        kept.push(p);
      }
      productsData[cat] = kept;
    }

    // Re-insert into requested categories
    for (const cat of categoriesReq) {
      if (!productsData[cat]) productsData[cat] = [];
      const arr = Array.isArray(productsData[cat]) ? productsData[cat] : [];
      const hasIconMeta = arr.length && arr[0] && typeof arr[0] === "object" &&
        typeof arr[0].icon === "string" && String(arr[0].icon).trim() &&
        (!arr[0].productLink || !String(arr[0].productLink).trim()) &&
        (!arr[0].name || !String(arr[0].name).trim());

      const prodCopy = { ...(templateProd || { productId: effectiveId, name: name || "" }) };
      prodCopy.productId = effectiveId; // enforce current id
      // ensure edits applied (name/link/price/images/options) are included
      if (name !== null) prodCopy.name = name;
      if (productLink !== null) prodCopy.productLink = productLink;
      if (canonicalLink !== null) prodCopy.canonicalLink = canonicalLink;
      if (sellingPrice !== null && sellingPrice !== '') prodCopy.price = Number(sellingPrice) || 0;
      if (sellingPriceB !== null && sellingPriceB !== '') prodCopy.priceB = Number(sellingPriceB) || 0;
      if (purchasePrice !== null && purchasePrice !== '') prodCopy.expectedPurchasePrice = parseDecimalLoose(purchasePrice);
      if (nameB !== null) prodCopy.nameB = nameB;
      if (description !== null) prodCopy.description = description;
      if (descriptionB !== null) prodCopy.descriptionB = descriptionB;
      if (deliveryText !== null) prodCopy.deliveryText = deliveryText;
      if (deliveryTextB !== null) prodCopy.deliveryTextB = deliveryTextB;
      if (images !== null) prodCopy.images = images;
      if (variantPrices !== undefined) {
        if (variantPrices === null) delete prodCopy.variantPrices;
        else prodCopy.variantPrices = variantPrices;
      }
      if (variantPricesB !== undefined) {
        if (variantPricesB === null) delete prodCopy.variantPricesB;
        else prodCopy.variantPricesB = variantPricesB;
      }
      if (variantPurchasePrices !== undefined) {
        if (variantPurchasePrices === null) delete prodCopy.variantPurchasePrices;
        else prodCopy.variantPurchasePrices = variantPurchasePrices;
      }
      if (pricedOptionGroup !== undefined) {
        if (pricedOptionGroup === null) {
          delete prodCopy.pricedOptionGroup;
          delete prodCopy.pricedOptionCategory;
        } else {
          prodCopy.pricedOptionGroup = pricedOptionGroup;
          prodCopy.pricedOptionCategory = pricedOptionGroup;
        }
      }
      if (optionGroups !== undefined) {
        if (optionGroups === null) delete prodCopy.optionGroups;
        else prodCopy.optionGroups = optionGroups;
      }
      if (productOptions !== undefined) {
        if (productOptions === null) delete prodCopy.productOptions;
        else prodCopy.productOptions = productOptions;
      }

      if (hasIconMeta) {
        productsData[cat] = [arr[0], ...arr.slice(1), prodCopy];
      } else {
        productsData[cat] = [...arr, prodCopy];
      }
    }
  }
  if (!updated) return res.status(404).json({ error: 'product not found' });

  try { await saveCatalogToDisk(productsData, "change"); } catch { }


  res.json({ ok: true, updated });
});

// 
// ===== Admin: catalog storage mode (file-backed only) =====
app.get("/admin/catalog/filemode", authMiddleware, (req, res) => {
  return res.json({
    ok: true,
    catalogSource: CATALOG_SOURCE,
    mode: getCatalogFileMode(),
    modes: ["products_js", "split_json"],
    splitFiles: {
      dir: CATALOG_SPLIT_DIR,
      products: fs.existsSync(CATALOG_SPLIT_PRODUCTS_FILE),
      categories: fs.existsSync(CATALOG_SPLIT_CATEGORIES_FILE)
    }
  });
});

app.post(
  "/admin/catalog/filemode",
  authMiddleware,
  express.json({ limit: "1mb" }),
  async (req, res) => {
    try {
      if (CATALOG_SOURCE !== "file") {
        return res.status(409).json({ error: "CATALOG_SOURCE is not file; set CATALOG_SOURCE=file to use filemode switching." });
      }
      const mode = String(req.body?.mode || "").trim();
      setCatalogFileMode(mode);

      if (getCatalogFileMode() === "split_json") {
        // Ensure split files exist (convert from current RAM if needed)
        try {
          if (!fs.existsSync(CATALOG_SPLIT_PRODUCTS_FILE) || !fs.existsSync(CATALOG_SPLIT_CATEGORIES_FILE)) {
            writeSplitCatalogFilesFromLegacy(productsData || {});
          }
        } catch { }
        reloadCatalogFromSplitDisk("admin:filemode:set");
        startSplitCatalogAutoRefresh();
      } else {
        reloadCatalogFromDisk("admin:filemode:set");
        startCatalogAutoRefresh();
      }

      return res.json({ ok: true, mode: getCatalogFileMode() });
    } catch (e) {
      return res.status(400).json({ error: String(e?.message || e) });
    }
  }
);

// Convert current ServerProducts.js (or RAM fallback) into split catalog files.
app.post("/admin/catalog/convert/to-split", authMiddleware, async (req, res) => {
  try {
    try { fs.mkdirSync(CATALOG_SPLIT_DIR, { recursive: true }); } catch { }

    let data = null;
    if (fs.existsSync(LOCAL_PRODUCTS_PATH)) {
      const jsText = fs.readFileSync(LOCAL_PRODUCTS_PATH, "utf-8");
      try {
        data = _parseProductsFromJsText(jsText);
      } catch {
        try { data = requireFresh(LOCAL_PRODUCTS_PATH); } catch { }
      }
    }
    if (!data) data = (productsData || {});

    const normalized = normalizeCatalog(data);
    validateCatalogOrThrow(normalized, "admin:convert:to-split");
    const out = writeSplitCatalogFilesFromLegacy(normalized);

    return res.json({
      ok: true,
      mode: getCatalogFileMode(),
      products: Object.keys(out.productsById || {}).length,
      categories: Object.keys(out.categoryIdLists || {}).length
    });
  } catch (e) {
    if (e && e.code === "INVALID_CATALOG") {
      return res.status(400).json({ error: "INVALID_CATALOG", issues: (e.issues || []).slice(0, ZOD_ERR_MAX) });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// ===== Admin: catalog file access + version history =====
app.get("/admin/catalog/file", authMiddleware, (req, res) => {
  // Return the canonical bundle (productsById + categories)
  const bundle = loadCatalogBundleFromDisk();
  if (!bundle) return res.status(404).json({ error: "catalog.json not found" });
  res.json(bundle);
});

app.put("/admin/catalog/file", authMiddleware, async (req, res) => {
  const bundle = req.body;
  const err = validateCatalogBundle(bundle);
  if (err) return res.status(400).json({ error: err });

  // Persist and rebuild caches
  saveCatalogBundleToDisk(bundle);

  // rebuild productsData from bundle for legacy endpoints and internal logic (preserve icon meta rows)
  const prev = productsData;
  const legacyForData = buildLegacyCatalogFromIds(bundle.productsById || {}, bundle.categories || {}, prev);
  productsData = normalizeCatalog(legacyForData);

  // refresh caches
  catalogBundleJsonCache = JSON.stringify(bundle);
  catalogBundleETag = `"${crypto.createHash('sha1').update(catalogBundleJsonCache).digest('hex')}"`;
  productsByIdCache = bundle.productsById || {};
  categoryIdListsCache = bundle.categories || {};

  const legacy = buildLegacyCatalogFromIds(bundle.productsById, bundle.categories, productsData);
  productsJsonCache = JSON.stringify({ catalog: legacy, config: { applyTariff: APPLY_TARIFF_SERVER }, applyTariff: APPLY_TARIFF_SERVER });
  productsETag = `"${crypto.createHash('sha1').update(productsJsonCache).digest('hex')}"`;
  productsFlatCache = buildFlatCatalog(productsData);
  productsFlatJsonCache = JSON.stringify(productsFlatCache);
  productsFlatETag = `"${crypto.createHash('sha1').update(productsFlatJsonCache).digest('hex')}"`;

  rebuildLookupMapsFromFlat();
  // Sync DB + snapshot
  await syncCatalogToDb(bundle);
  await snapshotCatalog("catalog_file_upload");

  res.json({ ok: true });
});

// Admin: category ID lists only (for storefront lists)
app.get("/admin/catalog/category-lists", authMiddleware, (req, res) => {
  const bundle = loadCatalogBundleFromDisk();
  if (!bundle) return res.status(404).json({ error: "catalog.json not found" });
  res.json({ categories: bundle.categories || {} });
});

app.put("/admin/catalog/category-lists", authMiddleware, async (req, res) => {
  const payload = req.body || {};
  const categories = payload.categories;
  if (!categories || typeof categories !== "object") return res.status(400).json({ error: "categories missing" });

  const bundle = loadCatalogBundleFromDisk();
  if (!bundle) return res.status(404).json({ error: "catalog.json not found" });

  // Validate ids exist (or allow empty lists)
  const productsById = bundle.productsById || {};
  for (const [cat, ids] of Object.entries(categories)) {
    if (!Array.isArray(ids)) return res.status(400).json({ error: `category '${cat}' must be an array` });
    for (const id of ids) {
      const pid = String(id || "").trim();
      if (!pid) continue;
      if (!productsById[pid]) return res.status(400).json({ error: `unknown productId '${pid}' in category '${cat}'` });
    }
  }

  // Apply
  bundle.categories = categories;

  // Persist and rebuild productsData (preserve icon meta rows)
  saveCatalogBundleToDisk(bundle);

  const prev = productsData;
  const legacyForData = buildLegacyCatalogFromIds(bundle.productsById || {}, bundle.categories || {}, prev);
  productsData = normalizeCatalog(legacyForData);

  // Persist split mirrors in split_json mode so category edits survive restarts
  if (CATALOG_SOURCE === "file" && getCatalogFileMode() === "split_json") {
    try { await saveCatalogToDisk(productsData, "category_lists_update"); } catch { }
  }


  // Refresh caches
  catalogBundleJsonCache = JSON.stringify(bundle);
  catalogBundleETag = `"${crypto.createHash('sha1').update(catalogBundleJsonCache).digest('hex')}"`;
  productsByIdCache = bundle.productsById || {};
  categoryIdListsCache = bundle.categories || {};

  const legacy = buildLegacyCatalogFromIds(bundle.productsById, bundle.categories, productsData);
  productsJsonCache = JSON.stringify({ catalog: legacy, config: { applyTariff: APPLY_TARIFF_SERVER }, applyTariff: APPLY_TARIFF_SERVER });
  productsETag = `"${crypto.createHash('sha1').update(productsJsonCache).digest('hex')}"`;
  productsFlatCache = buildFlatCatalog(productsData);
  productsFlatJsonCache = JSON.stringify(productsFlatCache);
  productsFlatETag = `"${crypto.createHash('sha1').update(productsFlatJsonCache).digest('hex')}"`;

  rebuildLookupMapsFromFlat();
  await syncCatalogToDb(bundle);
  await snapshotCatalog("category_lists_update");

  res.json({ ok: true });
});

// Admin: category meta (icons, renames)
app.get("/admin/catalog/categories-meta", authMiddleware, (req, res) => {
  try {
    const idx = rebuildCatalogIndexes(productsData || {});
    const cats = Object.keys(idx.categoryIdLists || {}).sort((a, b) => a.localeCompare(b));
    const out = {};
    for (const c of cats) {
      const icon = _extractIconMetaFromCategoryArr((productsData || {})[c]);
      out[c] = { icon: icon ? String(icon) : "" };
    }
    res.json({ ok: true, categoriesMeta: out });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/admin/catalog/category-meta", authMiddleware, express.json({ limit: "1mb" }), async (req, res) => {
  try {
    const body = req.body || {};
    const oldName = String(body.category || body.oldName || "").trim();
    if (!oldName) return res.status(400).json({ error: "category required" });

    const nextName = String(body.newName || "").trim();
    const wantsRename = !!nextName && nextName !== oldName;

    // Icon input (links only on UI; server stores strings)
    const hasIconFields =
      Object.prototype.hasOwnProperty.call(body, "icon") ||
      Object.prototype.hasOwnProperty.call(body, "iconUrl") ||
      Object.prototype.hasOwnProperty.call(body, "iconLightUrl") ||
      Object.prototype.hasOwnProperty.call(body, "iconDarkUrl") ||
      Object.prototype.hasOwnProperty.call(body, "iconLight") ||
      Object.prototype.hasOwnProperty.call(body, "iconDark");

    const iconLight = String(body.iconLightUrl || body.iconLight || "").trim();
    const iconDark = String(body.iconDarkUrl || body.iconDark || "").trim();

    let icon = "";
    if (iconLight || iconDark) {
      if (iconLight && iconDark) icon = JSON.stringify({ light: iconLight, dark: iconDark });
      else icon = iconLight || iconDark;
    } else if (Object.prototype.hasOwnProperty.call(body, "icon") || Object.prototype.hasOwnProperty.call(body, "iconUrl")) {
      icon = String(body.icon || body.iconUrl || "").trim();
    }

    const data = JSON.parse(JSON.stringify(productsData || {}));
    if (!data[oldName]) return res.status(404).json({ error: "category not found" });

    let key = oldName;
    if (wantsRename) {
      if (data[nextName]) return res.status(409).json({ error: "target category already exists" });
      data[nextName] = data[oldName];
      delete data[oldName];
      key = nextName;
    }

    if (hasIconFields) {
      const arr = Array.isArray(data[key]) ? data[key] : [];
      const isIconMeta = (p) =>
        p && typeof p === "object" &&
        typeof p.icon === "string" && String(p.icon).trim() &&
        (!p.productLink || !String(p.productLink).trim()) &&
        (!p.name || !String(p.name).trim());

      const metaIdx = arr.findIndex(isIconMeta);
      const iconTrim = String(icon || "").trim();

      if (!iconTrim) {
        if (metaIdx !== -1) arr.splice(metaIdx, 1);
      } else {
        if (metaIdx !== -1) {
          arr[metaIdx] = { ...arr[metaIdx], icon: iconTrim };
        } else {
          arr.unshift({ icon: iconTrim });
        }
      }
      data[key] = arr;
    }

    await saveProducts(data, "admin:category-meta");
    res.json({ ok: true, category: key });
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

app.get("/admin/catalog/versions", authMiddleware, (req, res) => {
  const items = listCatalogVersions();
  res.json({ versions: items });
});

app.get("/admin/catalog/versions/:stamp/json", authMiddleware, (req, res) => {
  const stamp = String(req.params.stamp || "").trim();
  const file = path.join(CATALOG_VERSIONS_DIR, `catalog_${stamp}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "not found" });
  res.type("application/json").send(fs.readFileSync(file, "utf-8"));
});

app.get("/admin/catalog/versions/:stamp/db", authMiddleware, (req, res) => {
  const stamp = String(req.params.stamp || "").trim();
  const file = path.join(CATALOG_VERSIONS_DIR, `db_products_${stamp}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "not found" });
  res.type("application/json").send(fs.readFileSync(file, "utf-8"));
});

app.post("/admin/catalog/versions/:stamp/restore", authMiddleware, async (req, res) => {
  const stamp = String(req.params.stamp || "").trim();
  const file = path.join(CATALOG_VERSIONS_DIR, `catalog_${stamp}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "not found" });

  const bundle = JSON.parse(fs.readFileSync(file, "utf-8"));
  const err = validateCatalogBundle(bundle);
  if (err) return res.status(400).json({ error: err });

  // Persist as current
  saveCatalogBundleToDisk(bundle);

  const rebuilt = {};
  for (const [cat, ids] of Object.entries(bundle.categories || {})) {
    rebuilt[cat] = (ids || []).map(id => bundle.productsById[String(id)]).filter(Boolean);
  }
  productsData = normalizeCatalog(rebuilt);

  catalogBundleJsonCache = JSON.stringify(bundle);
  catalogBundleETag = `"${crypto.createHash('sha1').update(catalogBundleJsonCache).digest('hex')}"`;
  productsByIdCache = bundle.productsById || {};
  categoryIdListsCache = bundle.categories || {};

  const legacy = buildLegacyCatalogFromIds(bundle.productsById, bundle.categories, productsData);
  productsJsonCache = JSON.stringify({ catalog: legacy, config: { applyTariff: APPLY_TARIFF_SERVER }, applyTariff: APPLY_TARIFF_SERVER });
  productsETag = `"${crypto.createHash('sha1').update(productsJsonCache).digest('hex')}"`;
  productsFlatCache = buildFlatCatalog(productsData);
  productsFlatJsonCache = JSON.stringify(productsFlatCache);
  productsFlatETag = `"${crypto.createHash('sha1').update(productsFlatJsonCache).digest('hex')}"`;

  rebuildLookupMapsFromFlat();
  await syncCatalogToDb(bundle);
  await snapshotCatalog("restore_" + stamp);

  res.json({ ok: true });
});// Public config for storefront (no secrets)
app.get("/public-config", (req, res) => {
  const raw = String(ACTIVE_STRIPE_PUBLISHABLE_KEY || "").trim();
  // Safety: never expose anything that doesn't look like a publishable key
  const safePk = (/^pk_(test|live)_/.test(raw) && !raw.includes("sk_") && raw.length < 200) ? raw : null;
  res.json({
    stripePublishableKey: safePk,
    applyTariffServer: APPLY_TARIFF_SERVER,
    stripeMode: STRIPE_TEST_MODE ? "test" : "live"
  });
});
// ===== Analytics time series (admin) =====
function toISODate(d) {
  const dd = new Date(d);
  const y = dd.getUTCFullYear();
  const m = String(dd.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dd.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

app.get("/admin/analytics/timeseries", requireAdmin, async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const interval = String(req.query.interval || "day"); // day|week|month (day implemented)

  const orders = await Order.find({
    createdAt: { $gte: from, $lte: to },
    status: "PAID"
  }).lean();

  const buckets = new Map(); // key -> agg
  for (const o of orders) {
    const key = toISODate(o.createdAt); // day bucket
    const f = computeOrderFinancials(o);
    const prev = buckets.get(key) || {
      date: key,
      orders: 0,
      gross: 0,
      refunds: 0,
      netRevenue: 0,
      fees: 0,
      shipping: 0,
      cogs: 0,
      otherOrderCosts: 0,
      profit: 0
    };
    prev.orders += 1;
    prev.gross += f.gross;
    prev.refunds += f.refunds;
    prev.netRevenue += f.netRevenue;
    prev.fees += f.fees;
    prev.shipping += f.shipping;
    prev.cogs += f.cogs;
    prev.otherOrderCosts += f.other;
    prev.profit += f.net;
    buckets.set(key, prev);
  }

  // Fill missing days in range for consistent graphing
  const out = [];
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = toISODate(d);
    const row = buckets.get(key) || {
      date: key,
      orders: 0,
      gross: 0,
      refunds: 0,
      netRevenue: 0,
      fees: 0,
      shipping: 0,
      cogs: 0,
      otherOrderCosts: 0,
      profit: 0
    };
    out.push(row);
  }

  res.json({ interval, from, to, rows: out });
});// ===== Admin self-test (Stripe) =====
// Dry by default. To actually create a 1 EUR PaymentIntent, set STRIPE_SELFTEST_ALLOW=1 and call with ?run=1
app.get("/admin/selftest/stripe", requireAdmin, async (req, res) => {
  const out = {
    ok: true,
    nodeEnv: process.env.NODE_ENV || null,
    stripeMode: STRIPE_TEST_MODE ? "test" : "live",
    hasStripeSecretKey: !!STRIPE_SECRET_KEY,
    hasStripePublishableKey: !!ACTIVE_STRIPE_PUBLISHABLE_KEY,
    hasStripeWebhookSecret: !!ACTIVE_STRIPE_WEBHOOK_SECRET,
    canRunActiveTest: (process.env.STRIPE_SELFTEST_ALLOW === "1") && (String(req.query.run || "") === "1"),
    activeTest: null,
    notes: []
  };

  if (!out.hasStripeSecretKey) { out.ok = false; out.notes.push("Missing active STRIPE_SECRET_KEY (live) or STRIPE_SECRET_KEY_TEST (test)"); }
  if (!out.hasStripePublishableKey) { out.notes.push("Missing active Stripe publishable key (STRIPE_PUBLISHABLE_KEY or STRIPE_PUBLISHABLE_KEY_TEST) (storefront Stripe init will fail)"); }
  if (!out.hasStripeWebhookSecret) { out.notes.push("Missing active Stripe webhook secret (STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET_TEST) (orders may not finalize)"); }

  if (out.canRunActiveTest) {
    try {
      const stripeClient = stripe || initStripe();
      if (!stripeClient) throw new Error('Stripe not configured');
      const pi = await stripeClient.paymentIntents.create({
        amount: 100, // 1.00 in minor units
        currency: "eur",
        metadata: { selftest: "1", createdAt: new Date().toISOString() }
      });
      out.activeTest = { paymentIntentId: pi.id, status: pi.status };
    } catch (e) {
      out.ok = false;
      out.activeTest = { error: String(e?.message || e) };
    }
  } else {
    out.notes.push("Active test disabled. Set STRIPE_SELFTEST_ALLOW=1 and call with ?run=1 to create a 1 EUR PaymentIntent.");
  }

  res.json(out);
});








app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Email automations (runs only when enabled via management frontend)
  startEmailWorkersOnce();
  startOpsMonitorOnce();

  const enableDriveStartup = String(process.env.ENABLE_DRIVE_STARTUP || "").toLowerCase() === "true";
  if (!enableDriveStartup) return;

  const fileId = (process.env.GOOGLE_DRIVE_FILE_ID || process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || "").trim();
  const shareEmail = (process.env.DRIVE_SHARE_EMAIL || process.env.ADMIN_EMAIL || process.env.STORE_EMAIL || "").trim();

  try {
    await debugListDriveFiles(fileId);
  } catch (e) {
    console.warn("⚠️ debugListDriveFiles failed:", e?.message || e);
  }

  try {
    if (fileId && shareEmail) await shareFileWithUser(fileId, shareEmail);
  } catch (e) {
    console.warn("⚠️ shareFileWithUser failed:", e?.message || e);
  }
});





// ===== Accounting helpers =====
function sumExpectedCogsEUR(order) {
  const items = (order && order.items) || [];
  let cogs = 0;
  for (const it of items) {
    const unit = Number(it.expectedPurchase || 0);
    const qty = Number(it.quantity || 0);
    cogs += unit * qty;
  }
  return cogs;
}

function getShippingCostEUR(order) {
  if (order?.costs?.shippingCostEUR != null) return Number(order.costs.shippingCostEUR) || 0;
  const a = order?.fulfillment?.agent?.costEUR;
  const s = order?.fulfillment?.self?.costEUR;
  return Number(a ?? s ?? 0) || 0;
}

function getStripeFeeEUR(order) {
  if (order?.costs?.stripeFeeEUR != null) return Number(order.costs.stripeFeeEUR) || 0;
  return 0;
}

function getOtherCostEUR(order) {
  if (order?.costs?.otherCostEUR != null) return Number(order.costs.otherCostEUR) || 0;
  return 0;
}

function getGrossRevenueEUR(order) {
  return Number(order?.pricing?.totalPaidEUR || 0) || 0;
}

function getRefundsEUR(order) {
  // Prefer manual tracking fields if present; otherwise derive from Stripe refunds when currency is EUR
  let manual = Number(order?.refundTracking?.amountEUR || 0) || 0;
  if (manual > 0) return manual;
  const currency = (order?.stripe?.currency || order?.pricing?.currency || "").toLowerCase();
  if (currency !== "eur") return 0;
  const refunds = order?.stripe?.refunds || [];
  let sum = 0;
  for (const r of refunds) sum += Number(r.amountMinor || 0);
  return sum / 100;
}

function computeOrderFinancials(order) {
  const gross = getGrossRevenueEUR(order);
  const refunds = getRefundsEUR(order);
  const netRevenue = gross - refunds;
  const fees = getStripeFeeEUR(order);
  const shipping = getShippingCostEUR(order);
  const cogs = sumExpectedCogsEUR(order);
  const other = getOtherCostEUR(order);
  const net = netRevenue - fees - shipping - cogs - other;
  return { gross, refunds, netRevenue, fees, shipping, cogs, other, net };
}
// ===== Accounting & Close endpoints =====


app.get("/admin/accounting/summary", requireAdmin, async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);

  const paidOrders = await Order.find({
    createdAt: { $gte: from, $lte: to },
    status: "PAID"
  }).lean();

  let gross = 0, refunds = 0, netRevenue = 0, fees = 0, shipping = 0, cogs = 0, other = 0;
  for (const o of paidOrders) {
    const f = computeOrderFinancials(o);
    gross += f.gross;
    refunds += f.refunds;
    netRevenue += f.netRevenue;
    fees += f.fees;
    shipping += f.shipping;
    cogs += f.cogs;
    other += f.other;
  }

  const expenses = await Expense.find({ date: { $gte: from, $lte: to } }).lean();
  let otherExpenses = 0;
  for (const e of expenses) otherExpenses += Number(e.amountEUR || 0) || 0;

  const net = netRevenue - fees - shipping - cogs - other - otherExpenses;

  res.json({
    period: { from, to },
    orders: paidOrders.length,
    revenue: { gross, refunds, net: netRevenue },
    fees, shipping, cogs,
    costs: { otherOrderCosts: other },
    expenses: { other: otherExpenses, count: expenses.length },
    net,
    vat: {
      turnoverEUR: netRevenue,
      thresholdReached: netRevenue >= 50000
    }
  });
});



app.get("/admin/accounting/export.csv", requireAdmin, async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);

  const orders = await Order.find({
    createdAt: { $gte: from, $lte: to },
    status: "PAID"
  }).lean();

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=accounting_export.csv");

  res.write("rowType,refId,date,grossRevenue,refunds,netRevenue,fees,shipping,cogs,otherOrderCosts,otherExpenses,net\n");

  for (const o of orders) {
    const f = computeOrderFinancials(o);
    res.write(`order,${o.orderId || o._id},${new Date(o.createdAt).toISOString()},${f.gross},${f.refunds},${f.netRevenue},${f.fees},${f.shipping},${f.cogs},${f.other},,${f.net}\n`);
  }

  const expenses = await Expense.find({ date: { $gte: from, $lte: to } }).sort({ date: 1 }).lean();
  for (const e of expenses) {
    const amt = Number(e.amountEUR || 0) || 0;
    res.write(`expense,${e._id},${new Date(e.date).toISOString()},,,,,,,,,${amt},${-amt}\n`);
  }

  res.end();
});

// ===== End