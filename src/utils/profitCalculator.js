import { parseDiscountInput } from './discountUtils.js';

export function calculateProfit(input) {
  const price = Number(input.price) || 0;
  const cost = Number(input.cost) || 0;
  const shipping = Number(input.shipping) || 0;
  const adCost = Number(input.adCost) || 0;
  const refundRate = Number(input.refundRate) || 0;
  const commissionRate = Number(input.commissionRate) || 0;

  const commission = price * (commissionRate / 100);
  const refundReserve = price * (refundRate / 100);
  const totalCost = cost + shipping + adCost + commission + refundReserve;
  const profit = price - totalCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const breakEvenPrice = (cost + shipping + adCost) / Math.max(0.01, 1 - (commissionRate + refundRate) / 100);
  const suggestedLow = breakEvenPrice / 0.75;
  const suggestedHigh = breakEvenPrice / 0.62;

  return {
    commission,
    refundReserve,
    totalCost,
    profit,
    margin,
    breakEvenPrice,
    suggestedLow,
    suggestedHigh,
  };
}

export function calculateSkuProfit(input) {
  const price = Number(input.price) || 0;
  const discountRate = parseDiscountInput(input.discount);
  const roas = Number(input.roas) || 0;
  const supplyPrice = Number(input.supplyPrice) || 0;
  const actualPrice = price * discountRate;
  const adCost = roas > 0 ? actualPrice / roas : 0;
  const profit = actualPrice - supplyPrice - adCost;
  const margin = actualPrice > 0 ? (profit / actualPrice) * 100 : 0;

  return {
    actualPrice,
    supplyPrice,
    adCost,
    profit,
    margin,
  };
}
