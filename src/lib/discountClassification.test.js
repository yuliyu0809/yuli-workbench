import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesDiscountTier } from './discountClassification.js';

test('manual minimum 8.5 overrides automatic 9 and includes higher tiers', () => {
  assert.equal(matchesDiscountTier([0.85], 0.9, 0.85), true);
  assert.equal(matchesDiscountTier([0.85], 0.9, 0.9), true);
  assert.equal(matchesDiscountTier([0.85], 0.9, 0.8), false);
});
test('multiple manual labels use the lowest eligible discount', () => {
  assert.equal(matchesDiscountTier([0.85, 0.8, 0.85], 0.9, 0.8), true);
  assert.equal(matchesDiscountTier([0.85, 0.8], 0.9, 0.9), true);
  assert.equal(matchesDiscountTier([0.85, 0.8], 0.6, 0.75), false);
});
test('manual minimum 6.5 includes every tier from 6.5 to 9 but not 6', () => {
  for (const tier of [0.65, 0.7, 0.75, 0.8, 0.85, 0.9]) assert.equal(matchesDiscountTier([0.65], 0.9, tier), true);
  assert.equal(matchesDiscountTier([0.65], 0.6, 0.6), false);
});
test('removing all labels restores automatic eligibility', () => {
  assert.equal(matchesDiscountTier([], 0.8, 0.85), true);
  assert.equal(matchesDiscountTier([], 0.9, 0.85), false);
  assert.equal(matchesDiscountTier([], null, 0.9), false);
});
