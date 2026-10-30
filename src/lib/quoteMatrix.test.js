import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteDiscountLimit, visibleQuoteDiscounts } from './quoteMatrix.js';

test('8.5 discount annotation shows 8.5 and higher quote rows, never 8', () => {
  const limit = quoteDiscountLimit([0.85]);
  assert.equal(limit, 8.5);
  assert.deepEqual(visibleQuoteDiscounts([7, 7.5, 8, 8.5, 9], limit), [8.5, 9]);
  const savedRows = [7, 7.5, 8, 8.5, 9].map((discount) => ({ discount, prices: [{ amount: 12 }] }));
  assert.deepEqual(visibleQuoteDiscounts(savedRows, limit).map((row) => row.discount), [8.5, 9]);
  assert.equal(savedRows.length, 5);
});

test('multiple annotations use the lowest marked discount', () => {
  const limit = quoteDiscountLimit([0.9, 0.85, 0.7]);
  assert.equal(limit, 7);
  assert.deepEqual(visibleQuoteDiscounts([6.5, 7, 7.5, 8, 8.5, 9], limit), [7, 7.5, 8, 8.5, 9]);
});

test('without an annotation, existing quote rows remain visible', () => {
  assert.equal(quoteDiscountLimit([]), null);
  assert.deepEqual(visibleQuoteDiscounts([7, 8, 9], null), [7, 8, 9]);
});
