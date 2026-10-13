import test from 'node:test';
import assert from 'node:assert/strict';
import { lightingCatalogVersion, lightingProductCatalog } from './lightingProductCatalog.js';

const product = (name) => lightingProductCatalog.find((item) => item.productName === name);

test('updated price reference retains stable product IDs and current supply costs', () => {
  assert.equal(lightingCatalogVersion, '20260918-profit-v2');
  assert.equal(lightingProductCatalog.length, 148);
  const wreath = product('USB铜丝红果松针圣诞花环 （暖、彩、白） （8功能）');
  assert.equal(wreath.id, 'P0059');
  assert.equal(wreath.specs[0].cost, 17);
  const tree = product('电池盒樱花棕色树枝灯');
  assert.equal(tree.id, 'P0136');
  assert.equal(tree.specs[0].cost, 5.8);
  assert.equal(tree.sourceRow, 322);
});

test('new two-piece products have separate IDs and keep retired catalog items out of the active list', () => {
  const pack = product('电池盒樱花棕色树枝灯 单根2件装');
  assert.equal(pack.id, 'P0148');
  assert.deepEqual(pack.specs.map(({ name, cost }) => ({ name, cost })), [{ name: '2*20灯', cost: 11 }]);
  assert.equal(lightingProductCatalog.some((item) => item.id === 'P0134' || item.id === 'P0135'), false);
});
