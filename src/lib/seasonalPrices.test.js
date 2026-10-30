import test from 'node:test';
import assert from 'node:assert/strict';
import { novemberPriceFor, novemberPricingActive } from './seasonalPrices.js';

const usb = { id: 'P0052', productName: 'USB银线鞭炮灯 （暖、彩、白） （8功能） （可2件装）' };
const battery = { id: 'P0062', productName: '电池盒银线鞭炮灯 （暖、彩、白） （8功能） （可2件装）' };
const spec = (number, packQuantity = 1) => ({ id: `P0052-spec-${number}-pack-${packQuantity}`, name: `3+2米100灯 · ${packQuantity}件装`, packQuantity });

test('November prices use the supplied one-pack costs and minimum sale prices', () => {
  const date = new Date('2026-11-15T00:00:00+08:00');
  for (const [product, expected] of [
    [usb, [[4.5, 8.5], [5.5, 10.3], [8.8, 14.3], [12, 18.5]]],
    [battery, [[5, 9.52], [6, 11.43], [9.5, 16.52], [13, 20.8]]],
  ]) {
    expected.forEach(([cost, minimumSalePrice], index) => {
      assert.deepEqual(novemberPriceFor(product, { id: `${product.id}-spec-${index + 1}`, name: '规格' }, date), { cost, minimumSalePrice, packQuantity: 1 });
    });
  }
});

test('all three stores use the same price by product and specification', () => {
  const date = new Date('2026-11-15T00:00:00+08:00');
  for (const store of ['AG', 'DS', 'HX']) {
    const link = { store, productName: usb.productName };
    assert.deepEqual(novemberPriceFor(link, { name: '3+2米100灯 · 1件装' }, date), { cost: 5.5, minimumSalePrice: 10.3, packQuantity: 1 });
  }
});

test('two-pack gets doubled November supply cost but keeps its calculated minimum', () => {
  assert.deepEqual(novemberPriceFor(usb, spec(2, 2), new Date('2026-11-15T00:00:00+08:00')), { cost: 11, minimumSalePrice: null, packQuantity: 2 });
});

test('the November-only prices start and end at Shanghai midnight', () => {
  assert.equal(novemberPriceFor(usb, spec(2), new Date('2026-10-31T23:59:59+08:00')), null);
  assert.equal(novemberPricingActive(new Date('2026-11-01T00:00:00+08:00')), true);
  assert.equal(novemberPriceFor(usb, spec(2), new Date('2026-12-01T00:00:00+08:00')), null);
});

test('unrelated products keep their normal prices', () => {
  assert.equal(novemberPriceFor({ id: 'P0001', productName: '其他产品' }, spec(2), new Date('2026-11-15T00:00:00+08:00')), null);
});
