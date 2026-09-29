import test from 'node:test';
import assert from 'node:assert/strict';
import { creationTimeForLink, sortProductLinksNewestFirst } from './productLinkOrder.js';

test('new links retain their creation time when edited', () => {
  const createdAt = '2026-09-25T08:00:00.000Z';
  assert.equal(creationTimeForLink(null, createdAt), createdAt);
  assert.equal(creationTimeForLink({ createdAt, updatedAt: '2026-09-30T08:00:00.000Z' }, '2026-10-01T08:00:00.000Z'), createdAt);
});

test('an older link edit does not move it above a newer link', () => {
  const older = { id: 'older', createdAt: '2026-09-25T08:00:00.000Z', updatedAt: '2026-09-30T08:00:00.000Z' };
  const newer = { id: 'newer', createdAt: '2026-09-28T08:00:00.000Z', updatedAt: '2026-09-28T08:00:00.000Z' };
  assert.deepEqual(sortProductLinksNewestFirst([older, newer]).map((link) => link.id), ['newer', 'older']);
});

test('legacy links use their saved time until edited, and tied links keep their order', () => {
  const old = { id: 'old', updatedAt: '2026-09-22T08:00:00.000Z' };
  const recent = { id: 'recent', updatedAt: '2026-09-26T08:00:00.000Z' };
  assert.equal(creationTimeForLink(old, '2026-09-30T08:00:00.000Z'), old.updatedAt);
  assert.deepEqual(sortProductLinksNewestFirst([old, recent]).map((link) => link.id), ['recent', 'old']);
  assert.deepEqual(sortProductLinksNewestFirst([{ id: 'first' }, { id: 'second' }]).map((link) => link.id), ['first', 'second']);
});
