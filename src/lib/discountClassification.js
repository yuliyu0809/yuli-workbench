// Manual labels are exact categories; automatic eligibility is only a fallback.
export function matchesDiscountTier(manualDiscounts, recommended, tier) {
  const labels = manualDiscounts.map(Number).filter((value) => Number.isFinite(value) && value > 0 && value <= 1);
  return labels.length
    ? labels.some((value) => Math.abs(value - tier) < 1e-8)
    : Boolean(recommended && recommended <= tier + 1e-8);
}
