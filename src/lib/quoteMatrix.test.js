import test from 'node:test';
import assert from 'node:assert/strict';
import { missingQuoteDiscounts, quoteDiscountLimit, recommendedQuotePrice, visibleQuoteDiscounts } from './quoteMatrix.js';

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

test('legacy 5.5 quote matrix gains every missing half-discount through 9 without replacing prices', () => {
  const saved = [{ discount: 5.5, prices: [{ amount: 12 }] }, ...[7, 7.5, 8, 8.5, 9].map((discount) => ({ discount, prices: [] }))];
  assert.deepEqual(missingQuoteDiscounts(saved, 5.5, null, true), [6, 6.5]);
  assert.equal(saved[0].prices[0].amount, 12);
});

test('a saved matrix respects removed rows unless the marked minimum moves lower', () => {
  const saved = [7, 8, 8.5, 9].map((discount) => ({ discount }));
  assert.deepEqual(missingQuoteDiscounts(saved, 7, 7), []);
  assert.deepEqual(missingQuoteDiscounts(saved, 6, 7), [6, 6.5]);
});

test('recommended quote price truncates to two decimals for each specification and discount', () => {
  assert.equal(recommendedQuotePrice(14.75, 8.5), 12.53);
  assert.equal(recommendedQuotePrice(16.66, 8.5), 14.16);
  assert.equal(recommendedQuotePrice(19.06, 9), 17.15);
  assert.equal(recommendedQuotePrice('', 8.5), null);
});
