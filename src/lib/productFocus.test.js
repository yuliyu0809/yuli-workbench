import test from 'node:test';
import assert from 'node:assert/strict';
import { focusCoverage, mergeProductFocus } from './productFocus.js';

test('coverage counts distinct SKC links per store, not specifications', () => {
  const products = [{ id: 'p1', productName: '灯串' }, { id: 'p2', productName: '树灯' }];
  const links = [{ productId: 'p1', store: 'AG', productCode: 'A', specs: [{}, {}] }, { productId: 'p1', store: 'AG', productCode: 'a' }, { productId: 'p1', store: 'HX', productCode: 'H' }];
  const rows = focusCoverage(products, links, { p1: { active: true }, p2: { active: false } }, ['AG', 'DS', 'HX']);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].counts, { AG: 1, DS: 0, HX: 1 });
  assert.deepEqual(rows[0].missing, ['DS']);
  assert.deepEqual(rows[0].pendingLinks, ['DS']);
});

test('a store marked priced is complete even before its link is added', () => {
  const products = [{ id: 'p1', productName: '灯串' }];
  const links = [{ productId: 'p1', store: 'AG', productCode: 'A' }];
  const pricing = { 'p1:DS': { active: true }, 'p1:HX': { active: true } };
  const [row] = focusCoverage(products, links, { p1: { active: true } }, ['AG', 'DS', 'HX'], pricing);
  assert.deepEqual(row.missing, []);
  assert.deepEqual(row.pendingLinks, ['DS', 'HX']);
});

test('newer focus changes win, including unmarking', () => {
  assert.deepEqual(mergeProductFocus({ p1: { active: true, updatedAt: '2026-10-01T10:00:00Z' } }, { p1: { active: false, updatedAt: '2026-10-01T11:00:00Z' } }), { p1: { active: false, updatedAt: '2026-10-01T11:00:00Z' } });
});
