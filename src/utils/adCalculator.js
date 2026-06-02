function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export function formatMoney(value) {
  return `¥${round(Number(value) || 0).toFixed(2)}`;
}

export function formatDiscount(value) {
  const discount = Number(value) || 0;
  return `${discount.toFixed(2)} / ${(discount * 10).toFixed(1)}折`;
}

export function calculateAdSimulation({ supplyPrice, activityPrice, roas }) {
  const price = Number(activityPrice) || 0;
  const cost = Number(supplyPrice) || 0;
  const roasValue = Number(roas) || 0;
  const adCost = roasValue > 0 ? price / roasValue : 0;
  const profit = price - cost - adCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return {
    adCost: round(adCost),
    profit: round(profit),
    margin: round(margin),
    risk: getRiskLevel(profit),
  };
}

export function calculateActivityPrice({ supplyPrice, originalPrice, discount, roas, targetProfit }) {
  const cost = Number(supplyPrice) || 0;
  const original = Number(originalPrice) || 0;
  const discountRate = Number(discount) || 0;
  const roasValue = Number(roas) || 0;
  const target = Number(targetProfit) || 0;
  const activityPrice = original * discountRate;
  const adCost = roasValue > 0 ? activityPrice / roasValue : 0;
  const finalProfit = activityPrice - cost - adCost;
  const margin = activityPrice > 0 ? (finalProfit / activityPrice) * 100 : 0;
  const breakEvenRoas = activityPrice > cost ? activityPrice / (activityPrice - cost) : 0;
  const targetDenominator = activityPrice - cost - target;
  const targetProfitRoas = targetDenominator > 0 ? activityPrice / targetDenominator : 0;

  return {
    activityPrice: round(activityPrice),
    adCost: round(adCost),
    finalProfit: round(finalProfit),
    margin: round(margin),
    breakEvenRoas: round(breakEvenRoas),
    targetProfitRoas: round(targetProfitRoas),
    advice: getActivityAdvice(finalProfit),
  };
}

export function calculateRoasRecommendations({ supplyPrice, activityPrice }) {
  const price = Number(activityPrice) || 0;
  const cost = Number(supplyPrice) || 0;
  return {
    breakEvenRoas: round(roasForProfit(price, cost, 0)),
    profit3Roas: round(roasForProfit(price, cost, 3)),
    profit5Roas: round(roasForProfit(price, cost, 5)),
    profit8Roas: round(roasForProfit(price, cost, 8)),
  };
}

export function calculateDiscountReverse(input) {
  const cost = Number(input.supplyPrice) || 0;
  const original = Number(input.originalPrice) || 0;
  const targetProfit = Number(input.reverseTargetProfit) || 0;
  const reservedAdCost = Number(input.reservedAdCost) || 0;
  const targetRoas = Number(input.targetRoas) || 0;
  const mode = input.discountMode || 'quick';

  if (mode === 'quick') {
    const minActivityPrice = cost + targetProfit + reservedAdCost;
    const minDiscount = original > 0 ? minActivityPrice / original : 0;
    return buildDiscountResult({
      minActivityPrice,
      minDiscount,
      estimatedAdCost: reservedAdCost,
      estimatedProfit: targetProfit,
      mode,
    });
  }

  const denominator = targetRoas > 0 ? 1 - 1 / targetRoas : 0;
  const minActivityPrice = denominator > 0 ? (cost + targetProfit) / denominator : 0;
  const minDiscount = original > 0 ? minActivityPrice / original : 0;
  const estimatedAdCost = targetRoas > 0 ? minActivityPrice / targetRoas : 0;
  const estimatedProfit = minActivityPrice - cost - estimatedAdCost;

  return buildDiscountResult({
    minActivityPrice,
    minDiscount,
    estimatedAdCost,
    estimatedProfit,
    mode,
  });
}

export function calculateBundleDiscount({ supplyPrice, unitPrice, quantity, bundleDiscount, reservedAdCost }) {
  const cost = Number(supplyPrice) || 0;
  const price = Number(unitPrice) || 0;
  const qty = Number(quantity) || 0;
  const discount = Number(bundleDiscount) || 0;
  const adCost = Number(reservedAdCost) || 0;
  const bundlePrice = price * qty * discount;
  const totalCost = cost * qty;
  const finalProfit = bundlePrice - totalCost - adCost;
  const unitProfit = qty > 0 ? finalProfit / qty : 0;
  const margin = bundlePrice > 0 ? (finalProfit / bundlePrice) * 100 : 0;

  return {
    bundlePrice: round(bundlePrice),
    totalCost: round(totalCost),
    reservedAdCost: round(adCost),
    finalProfit: round(finalProfit),
    unitProfit: round(unitProfit),
    margin: round(margin),
    advice: getBundleAdvice(finalProfit),
  };
}

export function calculateBreakEvenPrice(input) {
  const cost = Number(input.supplyPrice) || 0;
  const targetProfit = Number(input.breakEvenTargetProfit) || 0;
  const reservedAdCost = Number(input.breakEvenAdCost) || 0;
  const targetRoas = Number(input.breakEvenRoas) || 0;
  const mode = input.breakEvenMode || 'fixed';

  if (mode === 'fixed') {
    const minPrice = cost + targetProfit + reservedAdCost;
    return {
      minPrice: round(minPrice),
      estimatedAdCost: round(reservedAdCost),
      estimatedProfit: round(targetProfit),
      suggestedRange: `${formatMoney(minPrice)} - ${formatMoney(minPrice * 1.18)}`,
    };
  }

  const denominator = targetRoas > 0 ? 1 - 1 / targetRoas : 0;
  const minPrice = denominator > 0 ? (cost + targetProfit) / denominator : 0;
  const estimatedAdCost = targetRoas > 0 ? minPrice / targetRoas : 0;
  const estimatedProfit = minPrice - cost - estimatedAdCost;
  return {
    minPrice: round(minPrice),
    estimatedAdCost: round(estimatedAdCost),
    estimatedProfit: round(estimatedProfit),
    suggestedRange: `${formatMoney(minPrice)} - ${formatMoney(minPrice * 1.18)}`,
  };
}

export function getRecommendedTier(profit) {
  if (profit < 0) return '亏损风险';
  if (profit < 3) return '激进测款档';
  if (profit < 6) return '平衡出单档';
  return '利润优先档';
}

export function copyResultText({ productName, skuName, supplyPrice, activityPrice, roas, adCost, profit, margin, advice }) {
  return [
    `产品：${productName || '-'}`,
    `规格：${skuName || '-'}`,
    `供货价：${formatMoney(supplyPrice)}`,
    `活动价：${formatMoney(activityPrice)}`,
    `ROAS：${Number(roas || 0).toFixed(2)}`,
    `广告费：${formatMoney(adCost)}`,
    `预计利润：${formatMoney(profit)}`,
    `利润率：${round(Number(margin) || 0).toFixed(2)}%`,
    `建议：${advice || '-'}`,
  ].join('\n');
}

function buildDiscountResult({ minActivityPrice, minDiscount, estimatedAdCost, estimatedProfit, mode }) {
  const overLimit = minDiscount > 1;
  return {
    minActivityPrice: round(minActivityPrice),
    minDiscount: round(minDiscount),
    estimatedAdCost: round(estimatedAdCost),
    estimatedProfit: round(estimatedProfit),
    suggestedDiscount: overLimit ? '当前售价不足以满足利润要求' : suggestDiscount(minDiscount),
    risk: overLimit ? '售价不足' : getRiskLevel(estimatedProfit),
    advice: overLimit
      ? '当前售价不足以满足利润要求，建议提高售价或降低利润目标。'
      : mode === 'quick'
        ? `建议活动折扣：${suggestDiscount(minDiscount)}`
        : `建议活动档位：${suggestDiscount(minDiscount)}`,
  };
}

function suggestDiscount(minDiscount) {
  const stepped = Math.ceil((minDiscount * 10) * 2) / 2;
  return `${stepped.toFixed(1)}折以上`;
}

function roasForProfit(price, cost, profit) {
  const denominator = price - cost - profit;
  return denominator > 0 ? price / denominator : 0;
}

function getRiskLevel(profit) {
  if (profit < 0) return '亏损风险';
  if (profit < 3) return '低利润测款';
  if (profit < 6) return '可接受';
  return '利润健康';
}

function getActivityAdvice(profit) {
  if (profit < 0) return '不建议参加，当前活动价会亏损。';
  if (profit < 3) return '可以测款，但不建议长期跑。';
  if (profit <= 6) return '可以参加，适合新品冲销量。';
  return '建议参加，利润空间较好。';
}

function getBundleAdvice(profit) {
  if (profit < 0) return '亏损，不建议参加';
  if (profit < 3) return '低利润测款';
  if (profit <= 6) return '谨慎参加';
  return '可以参加';
}
