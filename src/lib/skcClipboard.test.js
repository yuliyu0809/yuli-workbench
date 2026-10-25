import test from 'node:test';
import assert from 'node:assert/strict';
import { skcsForClipboard, skcClipboardText } from './skcClipboard.js';

test('copies only the displayed SKCs in row order, separated by Chinese commas', () => {
  const visibleLinks = [
    { productCode: ' 123 ' },
    { productCode: '456' },
    { productCode: '123' },
    { productCode: ' ' },
    { productCode: 'ABC' },
    { productCode: 'abc' },
  ];
  assert.deepEqual(skcsForClipboard(visibleLinks), ['123', '456', 'ABC']);
  assert.equal(skcClipboardText(visibleLinks), '123、456、ABC');
});

test('empty list has nothing to copy', () => {
  assert.equal(skcClipboardText([]), '');
});
