function numericValue(value) {
  const parsed = Number(String(value ?? '').replace(/[??,%\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDiscountInput(value) {
  const parsed = numericValue(value);
  if (parsed > 0 && parsed <= 1) return parsed;
  if (parsed > 1 && parsed <= 10) return parsed / 10;
  if (parsed > 10 && parsed <= 100) return parsed / 100;
  return 0;
}

export function formatDiscount(value) {
  const discount = Number(value) || 0;
  return `${discount.toFixed(2)} / ${(discount * 10).toFixed(1)}折`;
}

export function discountInputText(value) {
  const discount = Number(value) || 0;
  if (!discount) return '';
  return (discount * 10).toFixed(1).replace(/\.0$/, '');
}
