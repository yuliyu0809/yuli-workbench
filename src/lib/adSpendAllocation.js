export function allocateSkcAdSpend(total, rows) {
  const amount = Math.round(Number(total || 0) * 100);
  if (!rows.length) return [];
  const sales = rows.map((row) => Math.max(0, Number(row.adSales) || 0));
  const orders = rows.map((row) => Math.max(0, Number(row.adOrders) || 0));
  const weights = sales.some(Boolean) ? sales : orders.some(Boolean) ? orders : rows.map(() => 1);
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let allocated = 0;
  let seenWeight = 0;
  return weights.map((weight, index) => {
    seenWeight += weight;
    const cents = (index === weights.length - 1 ? amount : Math.round(amount * seenWeight / weightTotal)) - allocated;
    allocated += cents;
    return cents / 100;
  });
}
