// Manual labels specify the minimum eligible discount; automatic eligibility is a fallback.
export function matchesDiscountTier(manualDiscounts, recommended, tier) {
  const labels = manualDiscounts.map(Number).filter((value) => Number.isFinite(value) && value > 0 && value <= 1);
  return labels.length
    ? Math.min(...labels) <= tier + 1e-8
    : Boolean(recommended && recommended <= tier + 1e-8);
}
