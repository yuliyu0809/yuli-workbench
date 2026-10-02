import test from 'node:test';
import assert from 'node:assert/strict';
import { removeAdSkuPreservingTotals, summarizeSkcAdRows } from './skcAdSummary.js';

test('SKC-level revenue and ad spend are counted once while SKU costs add up', () => {
  const summary = summarizeSkcAdRows([
    { item: { financialScope: 'skc-total', adSpend: 20, adSales: 100, adOrders: 2 }, metrics: { afterSalesTotal: 4, productCost: 20, profit: null } },
    { item: { financialScope: 'skc-total', adSpend: 0, adSales: 0, adOrders: 1 }, metrics: { afterSalesTotal: 2, productCost: 12, profit: null } },
  ]);
  assert.equal(summary.adSpend, 20);
  assert.equal(summary.adSales, 100);
  assert.equal(summary.orders, 3);
  assert.equal(summary.profit, 42);
});

test('historical SKU-level profits are preserved in group totals', () => {
  const summary = summarizeSkcAdRows([
    { item: { adSpend: 5, adSales: 20, adOrders: 1 }, metrics: { afterSalesTotal: 1, productCost: 4, profit: 10 } },
    { item: { adSpend: 3, adSales: 10, adOrders: 1 }, metrics: { afterSalesTotal: 1, productCost: 2, profit: 4 } },
  ]);
  assert.equal(summary.profit, 14);
});

test('deleting the carrier SKU preserves actual SKC totals on the remaining SKU', () => {
  const rows = [
    { id: 'a', financialScope: 'skc-total', recordDate: '2026-10-03', store: 'AG', productId: 'p', skc: '123', adSpend: 20, adSales: 100 },
    { id: 'b', financialScope: 'skc-total', recordDate: '2026-10-03', store: 'AG', productId: 'p', skc: '123', adSpend: 0, adSales: 0 },
  ];
  assert.deepEqual(removeAdSkuPreservingTotals(rows, rows[0]).map(({ id, adSpend, adSales }) => ({ id, adSpend, adSales })), [{ id: 'b', adSpend: 20, adSales: 100 }]);
});
