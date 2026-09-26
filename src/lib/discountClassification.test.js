import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesDiscountTier } from './discountClassification.js';

test('manual 8.5 label overrides automatic 9 classification and is exact', () => {
  assert.equal(matchesDiscountTier([0.85], 0.9, 0.85), true);
  assert.equal(matchesDiscountTier([0.85], 0.9, 0.9), false);
  assert.equal(matchesDiscountTier([0.85], 0.9, 0.8), false);
});
test('multiple manual labels each match, duplicate labels do not affect membership', () => {
  assert.equal(matchesDiscountTier([0.85, 0.8, 0.85], 0.9, 0.8), true);
  assert.equal(matchesDiscountTier([0.85, 0.8], 0.9, 0.9), false);
});
test('removing all labels restores automatic eligibility', () => {
  assert.equal(matchesDiscountTier([], 0.8, 0.85), true);
  assert.equal(matchesDiscountTier([], 0.9, 0.85), false);
  assert.equal(matchesDiscountTier([], null, 0.9), false);
});
