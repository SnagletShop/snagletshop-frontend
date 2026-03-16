'use strict';
const mongoose = require('mongoose');

const InvoiceCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true });

const InvoiceCounter = mongoose.models.InvoiceCounter || mongoose.model('InvoiceCounter', InvoiceCounterSchema);

module.exports = { InvoiceCounter, InvoiceCounterSchema };
