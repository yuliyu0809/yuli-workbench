export function quoteDiscountLimit(manualDiscounts) {
  const values = (manualDiscounts || [])
    .map((discount) => Number((Number(discount) * 10).toFixed(1)))
    .filter((discount) => Number.isFinite(discount) && discount > 0 && discount <= 10);
  return values.length ? Math.min(...values) : null;
}

export function visibleQuoteDiscounts(discounts, limit) {
  return limit == null ? discounts : discounts.filter((item) => Number(item?.discount ?? item) >= limit);
}
