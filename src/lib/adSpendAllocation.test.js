import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateSkcAdSpend } from './adSpendAllocation.js';

test('one SKC total is distributed by SKU sales without duplicating money', () => {
  const allocated = allocateSkcAdSpend(10.01, [{ adSales: 100 }, { adSales: 200 }]);
  assert.deepEqual(allocated, [3.34, 6.67]);
  assert.equal(allocated.reduce((sum, value) => sum + value, 0), 10.01);
});

test('zero sales falls back to orders, then equal shares', () => {
  assert.deepEqual(allocateSkcAdSpend(9, [{ adOrders: 1 }, { adOrders: 2 }]), [3, 6]);
  assert.deepEqual(allocateSkcAdSpend(1, [{}, {}]), [0.5, 0.5]);
  assert.deepEqual(allocateSkcAdSpend(0.03, [{}, {}, {}, {}, {}]), [0.01, 0, 0.01, 0, 0.01]);
});
