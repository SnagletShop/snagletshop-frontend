'use strict';

const { buildEconomicOrdersQuery, isEconomicOrderInRange } = require('./orderFinancialQuery');

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
  let manual = Number(order?.refundTracking?.amountEUR || 0) || 0;
  if (manual > 0) return manual;
  const currency = (order?.stripe?.currency || order?.pricing?.currency || '').toLowerCase();
  if (currency === 'eur') {
    const refunds = order?.stripe?.refunds || [];
    let sum = 0;
    for (const r of refunds) sum += Number(r.amountMinor || 0);
    if (sum > 0) return sum / 100;
  }
  if (String(order?.status || '').toUpperCase() === 'CHARGEBACK') {
    return Number(order?.pricing?.totalPaidEUR || 0) || 0;
  }
  return 0;
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

async function buildAccountingSummary({ Order, Expense, from, to }) {
  const paidOrders = (await Order.find(buildEconomicOrdersQuery({ from, to })).lean())
    .filter((order) => isEconomicOrderInRange(order, from, to));
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
  return {
    period: { from, to },
    orders: paidOrders.length,
    revenue: { gross, refunds, net: netRevenue },
    fees, shipping, cogs,
    costs: { otherOrderCosts: other },
    expenses: { other: otherExpenses, count: expenses.length },
    net,
    vat: { turnoverEUR: netRevenue, thresholdReached: netRevenue >= 50000 },
    paidOrders,
    expenseRows: expenses,
  };
}

module.exports = { computeOrderFinancials, buildAccountingSummary };
