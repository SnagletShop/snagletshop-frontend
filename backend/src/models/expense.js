'use strict';
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  vendor: { type: String, default: "" },
  description: { type: String, default: "" },
  category: { type: String, default: "" }, // e.g. ads, software, shipping, supplies
  amountEUR: { type: Number, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  attachments: [{
    id: { type: String, required: true },
    filename: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Expense = mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
module.exports = { Expense, ExpenseSchema };
