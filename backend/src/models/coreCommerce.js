'use strict';

const mongoose = require('mongoose');

const SelectedOptionSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    value: { type: String, default: '' },
  },
  { _id: false },
);

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    selectedOption: { type: String, default: '' },
    selectedOptions: { type: [SelectedOptionSchema], default: [] },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceEUR: { type: Number, required: true, min: 0 },
    unitPriceOriginalEUR: { type: Number, default: null, min: 0 },
    recoDiscountPct: { type: Number, default: 0, min: 0, max: 80 },
    recoDiscountToken: { type: String, default: '' },
    appliedBundlePct: { type: Number, default: 0, min: 0, max: 80 },
    bundleDiscountEURLine: { type: Number, default: 0, min: 0 },
    appliedTierPct: { type: Number, default: 0, min: 0, max: 80 },
    tierDiscountEURLine: { type: Number, default: 0, min: 0 },
    tierEligibleForThisItem: { type: Boolean, default: null },
    unitPricePaidEffectiveEUR: { type: Number, default: null, min: 0 },
    totalPaidEffectiveEUR: { type: Number, default: null, min: 0 },
    expectedPurchase: { type: Number, default: 0, min: 0 },
    actualPurchaseEUR: { type: Number, default: null, min: 0 },
    supplierLink: { type: String, default: '' },
    supplierSku: { type: String, default: '' },
    productLink: { type: String, default: '' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false, minimize: false },
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
  marketingOptIn: { type: Boolean, default: false },
  marketingOptInAt: { type: Date, default: null },
  marketingUnsubscribedAt: { type: Date, default: null },
}, { _id: false });

const PricingSchema = new mongoose.Schema({
  currency: { type: String, default: 'EUR' },
  totalPaidEUR: { type: Number, default: 0 },
  baseTotalEUR: { type: Number, default: 0 },
  itemsTotalBeforeAnyDiscountsEUR: { type: Number, default: 0 },
  itemsTotalAfterItemDiscountsEUR: { type: Number, default: 0 },
  subtotalAfterDiscountsEUR: { type: Number, default: 0 },
  totalDiscountEUR: { type: Number, default: 0 },
  effectivePct: { type: Number, default: 0 },
  shippingFeeEUR: { type: Number, default: 0 },
  totalBeforeTariffEUR: { type: Number, default: 0 },
  applyTariff: { type: Boolean, default: false },
  tariffPct: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 1 },
  fxFetchedAt: { type: Number, default: null },
  amountCents: { type: Number, default: 0 },
  discounts: {
    applyToDiscountedItems: { type: Boolean, default: true },
    tierPct: { type: Number, default: 0 },
    tierDiscountEUR: { type: Number, default: 0 },
    bundlePct: { type: Number, default: 0 },
    bundleDiscountEUR: { type: Number, default: 0 },
  },
  freeShippingEligible: { type: Boolean, default: false },
  experiments: { type: mongoose.Schema.Types.Mixed, default: {} },
  note: { type: String, default: '' },
}, { _id: false, minimize: false });

const FulfillmentSchema = new mongoose.Schema({
  method: { type: String, enum: ['SELF', 'AGENT'], default: 'SELF' },
  packages: [{ weightKg: Number, lengthCm: Number, widthCm: Number, heightCm: Number }],
  customs: {
    contents: [{ description: String, hsCode: String, originCountry: String, quantity: Number, unitValueEUR: Number }],
    totalValueEUR: Number,
    incoterm: { type: String, default: 'DDP' },
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
    raw: mongoose.Schema.Types.Mixed,
  },
  self: {
    carrier: String,
    service: String,
    tracking: [{ code: String, carrier: String, url: String }],
    costEUR: Number,
  },
}, { _id: false });

const RefundSchema = new mongoose.Schema({ id: String, amountMinor: Number, currency: String, reason: String, status: String, createdAt: Date }, { _id: false });
const StripeInfoSchema = new mongoose.Schema({ paymentIntentId: { type: String }, currency: String, amountMinor: Number, refunds: { type: [RefundSchema], default: [] } }, { _id: false });
const LastPaymentErrorSchema = new mongoose.Schema({ message: String, code: String, declineCode: String, type: String, at: Date }, { _id: false });
const SideEffectsSchema = new mongoose.Schema({ fileWrittenAt: Date, excelWrittenAt: Date }, { _id: false });
const PublicSchema = new mongoose.Schema({ tokenHash: { type: String, default: '' }, createdAt: { type: Date, default: null } }, { _id: false });
const OperatorShippingSchema = new mongoose.Schema({ aliExpress: { type: Number, default: 0, min: 0 }, thirdParty1: { type: Number, default: 0, min: 0 }, thirdParty2: { type: Number, default: 0, min: 0 } }, { _id: false });
const OperatorTrackingSchema = new mongoose.Schema({ code: { type: String, default: '' }, carrier: { type: String, default: '' }, url: { type: String, default: '' }, addedAt: { type: Date, default: () => new Date() } }, { _id: false });
const OperatorSchema = new mongoose.Schema({
  procurementStatus: { type: String, default: 'AWAITING_PAYMENT' },
  supplierProvider: { type: String, default: '' },
  supplierOrderId: { type: String, default: '' },
  purchasedAt: { type: Date, default: null },
  supplierCostEUR: { type: Number, default: null, min: 0 },
  tracking: { type: [OperatorTrackingSchema], default: [] },
  shipping: { type: OperatorShippingSchema, default: () => ({}) },
  internalNote: { type: String, default: '' },
  deliveredAt: { type: Date, default: null },
  doneAt: { type: Date, default: null },
}, { _id: false });
const NoteEntrySchema = new mongoose.Schema({ at: { type: Date, default: () => new Date() }, by: { type: String, default: 'admin' }, text: { type: String, default: '' } }, { _id: false });
const StatusHistorySchema = new mongoose.Schema({ at: { type: Date, default: () => new Date() }, from: { type: String, default: '' }, to: { type: String, default: '' }, by: { type: String, default: 'system' }, note: { type: String, default: '' } }, { _id: false });
const AccountingSchema = new mongoose.Schema({ invoiceNumber: { type: String, default: '' }, invoiceIssuedAt: { type: Date, default: null }, customerCountryCode: { type: String, default: '' }, vatScheme: { type: String, default: '' } }, { _id: false });
const CostsSchema = new mongoose.Schema({ stripeFeeMinor: { type: Number, default: null, min: 0 }, stripeFeeCurrency: { type: String, default: '' }, stripeFeeEUR: { type: Number, default: null, min: 0 }, shippingCostEUR: { type: Number, default: null, min: 0 }, otherCostEUR: { type: Number, default: null, min: 0 } }, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: 'PENDING_PAYMENT', index: true },
  websiteOrigin: { type: String, default: '' },
  customer: { type: CustomerSchema, default: () => ({}) },
  items: { type: [ItemSchema], default: [] },
  pricing: { type: PricingSchema, default: () => ({}) },
  fulfillment: { type: FulfillmentSchema, default: () => ({}) },
  stripe: { type: StripeInfoSchema, default: () => ({}) },
  lastPaymentError: { type: LastPaymentErrorSchema, default: null },
  paidAt: Date,
  emailSentAt: Date,
  shippedEmailSentAt: Date,
  expiresAt: { type: Date },
  sideEffects: { type: SideEffectsSchema, default: () => ({}) },
  public: { type: PublicSchema, default: () => ({}) },
  operator: { type: OperatorSchema, default: () => ({}) },
  notes: { type: [NoteEntrySchema], default: [] },
  statusHistory: { type: [StatusHistorySchema], default: [] },
  accounting: { type: AccountingSchema, default: () => ({}) },
  costs: { type: CostsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
}, { minimize: false });
OrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OrderSchema.index({ 'stripe.paymentIntentId': 1 }, { unique: true, partialFilterExpression: { 'stripe.paymentIntentId': { $type: 'string' } } });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'operator.procurementStatus': 1, createdAt: -1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.pre('save', function(next){ this.updatedAt = new Date(); next(); });

const DraftOrderSchema = new mongoose.Schema({
  status: { type: String, default: 'CHECKOUT', index: true },
  websiteOrigin: { type: String, default: '' },
  customer: { type: CustomerSchema, default: () => ({}) },
  items: { type: [ItemSchema], default: [] },
  pricing: { type: PricingSchema, default: () => ({}) },
  stripe: { type: StripeInfoSchema, default: () => ({}) },
  lastPaymentError: { type: LastPaymentErrorSchema, default: null },
  public: { type: PublicSchema, default: () => ({}) },
  accounting: { type: AccountingSchema, default: () => ({}) },
  orderId: { type: String, default: '', index: true },
  completedAt: { type: Date, default: null },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
}, { minimize: false });
DraftOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
DraftOrderSchema.index({ 'stripe.paymentIntentId': 1 }, { unique: true, partialFilterExpression: { 'stripe.paymentIntentId': { $type: 'string' } } });
DraftOrderSchema.index({ status: 1, createdAt: -1 });
DraftOrderSchema.pre('save', function(next){ this.updatedAt = new Date(); next(); });

const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true, unique: true },
  name: { type: String, default: '' },
  productLink: { type: String, default: null, index: true, unique: true, sparse: true },
  canonicalLink: { type: String, default: null },
  price: { type: Number, default: 0 },
  expectedPurchasePrice: { type: Number, default: 0 },
  description: { type: String, default: '' },
  images: { type: [String], default: [] },
  productOptions: { type: mongoose.Schema.Types.Mixed, default: null },
  categories: { type: [String], default: [] },
  updatedFromCatalogAt: { type: Date, default: null },
}, { timestamps: true });

const CatalogCategorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  icon: { type: String, default: '' },
  order: { type: Number, default: 0 },
  products: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true, minimize: false });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const DraftOrder = mongoose.models.DraftOrder || mongoose.model('DraftOrder', DraftOrderSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const CatalogCategory = mongoose.models.CatalogCategory || mongoose.model('CatalogCategory', CatalogCategorySchema);

module.exports = {
  SelectedOptionSchema,
  ItemSchema,
  CustomerSchema,
  PricingSchema,
  FulfillmentSchema,
  Order,
  DraftOrder,
  Product,
  CatalogCategory,
};
