'use strict';

const ECONOMIC_ORDER_STATUSES = Object.freeze(['PAID', 'PLACED_WITH_AGENT', 'REFUNDED', 'CHARGEBACK']);

function coerceDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getEconomicOrderDate(order) {
  return coerceDate(order?.paidAt) || coerceDate(order?.createdAt) || coerceDate(order?.updatedAt) || null;
}

function isEconomicOrder(order) {
  return !!(coerceDate(order?.paidAt) || ECONOMIC_ORDER_STATUSES.includes(String(order?.status || '').toUpperCase()));
}

function isEconomicOrderInRange(order, from, to) {
  if (!isEconomicOrder(order)) return false;
  const at = getEconomicOrderDate(order);
  if (!at) return false;
  if (from && at < from) return false;
  if (to && at > to) return false;
  return true;
}

function buildEconomicOrdersQuery({ from, to, extra = {} } = {}) {
  const dateOr = [];
  if (from || to) {
    const paidAt = {};
    const createdAt = {};
    if (from) {
      paidAt.$gte = from;
      createdAt.$gte = from;
    }
    if (to) {
      paidAt.$lte = to;
      createdAt.$lte = to;
    }
    dateOr.push({ paidAt });
    dateOr.push({ createdAt });
  }

  const economicOr = [
    { paidAt: { $ne: null } },
    { status: { $in: ECONOMIC_ORDER_STATUSES.slice() } },
  ];

  const clauses = [{ $or: economicOr }];
  if (dateOr.length) clauses.push({ $or: dateOr });
  if (extra && Object.keys(extra).length) clauses.push(extra);
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

module.exports = {
  ECONOMIC_ORDER_STATUSES,
  getEconomicOrderDate,
  isEconomicOrder,
  isEconomicOrderInRange,
  buildEconomicOrdersQuery,
};
