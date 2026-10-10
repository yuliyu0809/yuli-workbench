import test from 'node:test';
import assert from 'node:assert/strict';
import { createTitleTranslationController, titleTranslationDirection } from './titleTranslation.js';

const harness = (translate = async (text) => `translated ${text}`) => {
  const timers = new Map(); const results = []; const statuses = []; let id = 0;
  const controller = createTitleTranslationController({ translate, onResult: (result) => results.push(result), onStatus: (...args) => statuses.push(args), setTimer: (fn) => { timers.set(++id, fn); return id; }, clearTimer: (key) => timers.delete(key) });
  const run = async () => { const jobs = [...timers.values()]; timers.clear(); await Promise.all(jobs.map((fn) => fn())); };
  return { controller, timers, results, statuses, run };
};

test('translation identifies language even when pasted into the other field', () => {
  assert.equal(titleTranslationDirection('USB 灯串 50 LEDs', 'englishTitle').langpair, 'zh-CN|en');
  assert.deepEqual(titleTranslationDirection('Woolen strips + light string + bow tie', 'chineseTitle'), { sourceKey: 'englishTitle', targetKey: 'chineseTitle', langpair: 'en|zh-CN' });
});

test('typing is debounced and results do not schedule reverse translation', async () => {
  const h = harness();
  h.controller.request('灯', 'chineseTitle');
  h.controller.request('灯串', 'chineseTitle');
  assert.equal(h.timers.size, 1);
  await h.run();
  assert.equal(h.results.length, 1);
  assert.equal(h.results[0].source, '灯串');
  assert.equal(h.timers.size, 0);
});

test('late responses cannot overwrite a newer edit in either field', async () => {
  const pending = [];
  const h = harness((text, direction, signal) => new Promise((resolve) => pending.push({ text, signal, resolve })));
  h.controller.request('旧标题', 'chineseTitle', { immediate: true });
  h.controller.request('New title', 'englishTitle', { immediate: true });
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve('新标题'); await Promise.resolve();
  pending[0].resolve('Old title'); await Promise.resolve();
  assert.equal(h.results.length, 1);
  assert.equal(h.results[0].translated, '新标题');
});

test('composition and clearing cancel pending translation', async () => {
  const h = harness();
  h.controller.request('灯', 'chineseTitle');
  h.controller.request('灯串', 'chineseTitle', { composing: true });
  assert.equal(h.timers.size, 0);
  h.controller.request('灯串', 'chineseTitle');
  h.controller.cancel();
  await h.run();
  assert.equal(h.results.length, 0);
});

test('service failures keep existing titles and expose a retry message', async () => {
  const h = harness(async () => { throw new Error('quota'); });
  h.controller.request('灯串', 'chineseTitle');
  await h.run();
  assert.equal(h.results.length, 0);
  assert.ok(h.statuses.some(([status, message]) => status === 'error' && message.includes('重新翻译')));
});
