export function quoteDiscountLimit(manualDiscounts) {
  const values = (manualDiscounts || [])
    .map((discount) => Number((Number(discount) * 10).toFixed(1)))
    .filter((discount) => Number.isFinite(discount) && discount > 0 && discount <= 10);
  return values.length ? Math.min(...values) : null;
}

export function visibleQuoteDiscounts(discounts, limit) {
  return limit == null ? discounts : discounts.filter((item) => Number(item?.discount ?? item) >= limit);
}

export function missingQuoteDiscounts(rows, limit, previousLimit = null, legacy = false) {
  if (limit == null) return [];
  if (!legacy && (previousLimit == null || limit >= previousLimit)) return [];
  const upper = legacy ? 9 : Math.min(9, previousLimit - 0.5);
  const existing = new Set(rows.map((row) => Number(row.discount ?? row)));
  const missing = [];
  for (let discount = limit; discount <= upper; discount = Number((discount + 0.5).toFixed(1))) {
    if (!existing.has(discount)) missing.push(discount);
  }
  return missing;
}

export function recommendedQuotePrice(salePrice, discount) {
  const price = Number(salePrice);
  const rate = Number(discount);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.floor(price * rate * 10 + 1e-8) / 100;
}
