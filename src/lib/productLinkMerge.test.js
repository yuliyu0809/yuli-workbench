import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProductLinks, normalizeProductLinks } from './productLinkMerge.js';

const older = { id: 'a', productCode: '123', store: 'AG', productName: '灯', updatedAt: '2026-09-01', specs: [{ id: 's', name: '20灯', cost: 7, salePrice: 20 }], imageDataUrl: 'original', manualPriceMatrix: [{ discount: 7, prices: [{ specId: 's', amount: 12 }] }] };
const newer = { ...older, id: 'b', updatedAt: '2026-09-02', imageDataUrl: 'different', specs: [{ ...older.specs[0], salePrice: 22 }], manualPriceMatrix: [] };
test('same SKC uses newest link and preserves full older prices, quotes and image', () => {
  const result = mergeProductLinks([older], [newer]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'b');
  assert.deepEqual(result[0].duplicateVariants, [older]);
  assert.equal(older.duplicateVariants, undefined);
});
test('normalization and repeatedly importing stale records are idempotent', () => {
  const initial = mergeProductLinks([older, newer]);
  assert.deepEqual(mergeProductLinks(initial), initial);
  let current = initial;
  for (let i = 0; i < 20; i++) current = mergeProductLinks([older], current);
  assert.deepEqual(current, initial);
});
test('blank SKCs stay separate; SKCs are normalized and globally unique', () => {
  assert.equal(mergeProductLinks([{ id: 'x' }, { id: 'y' }]).length, 2);
  assert.equal(mergeProductLinks([older, { ...newer, productCode: ' 123 ', store: 'DS' }]).length, 1);
});
test('archives survive editing and primary switch', () => {
  const merged = mergeProductLinks([older, newer]);
  const updated = { ...older, updatedAt: '2026-09-03' };
  const result = mergeProductLinks(merged, [updated]);
  assert.equal(result[0].id, 'a');
  assert.equal(result[0].duplicateVariants[0].id, 'b');
  assert.deepEqual(mergeProductLinks(result), result);
});
test('legacy references redirect while ads and manual activities stay unchanged', () => {
  const workspace = { discounts: [older, newer], priceReferences: [{ id: 'r', discountId: 'a' }], adRecords: [{ id: '1', skc: '123' }, { id: '2', skc: '123' }], manualActivities: [{ id: 'm', productCode: '123' }] };
  const result = normalizeProductLinks(workspace);
  assert.equal(result.priceReferences[0].discountId, 'b');
  assert.deepEqual(result.adRecords, workspace.adRecords);
  assert.deepEqual(result.manualActivities, workspace.manualActivities);
});
