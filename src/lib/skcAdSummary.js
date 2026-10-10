export function summarizeSkcAdRows(rows) {
  const items = rows.map(({ item }) => item);
  const orders = items.reduce((sum, item) => sum + Number(item.adOrders || 0), 0);
  const adSpend = items.reduce((sum, item) => sum + Number(item.adSpend || 0), 0);
  const adSales = items.reduce((sum, item) => sum + Number(item.adSales || 0), 0);
  const afterSales = rows.every(({ metrics }) => metrics.afterSalesTotal != null)
    ? rows.reduce((sum, { metrics }) => sum + metrics.afterSalesTotal, 0) : null;
  const productCost = rows.every(({ metrics }) => metrics.productCost != null)
    ? rows.reduce((sum, { metrics }) => sum + metrics.productCost, 0) : null;
  const isSkcTotal = items.length > 0 && items.every((item) => item.financialScope === 'skc-total');
  const profit = isSkcTotal
    ? afterSales != null && productCost != null ? adSales - adSpend - afterSales - productCost : null
    : rows.every(({ metrics }) => metrics.profit != null) ? rows.reduce((sum, { metrics }) => sum + metrics.profit, 0) : null;
  return { orders, adSpend, adSales, afterSales, productCost, profit,
    adSpendPerOrder: orders > 0 ? adSpend / orders : null,
    profitPerOrder: profit != null && orders ? profit / orders : null,
    profitRate: profit != null && adSales ? profit / adSales : null };
}

export function removeAdSkuPreservingTotals(records, target) {
  const remaining = records.filter((row) => row.id !== target.id);
  if (target.financialScope !== 'skc-total') return remaining;
  const normalize = (value) => String(value || '').trim().toUpperCase();
  const sibling = remaining.find((row) => row.financialScope === 'skc-total' && row.recordDate === target.recordDate
    && row.store === target.store && row.productId === target.productId && normalize(row.skc) === normalize(target.skc));
  return sibling ? remaining.map((row) => row.id === sibling.id
    ? { ...row, adSpend: Number(row.adSpend || 0) + Number(target.adSpend || 0), adSales: Number(row.adSales || 0) + Number(target.adSales || 0) }
    : row) : remaining;
}
