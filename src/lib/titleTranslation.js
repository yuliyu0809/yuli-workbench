export function titleTranslationDirection(text, field = 'chineseTitle') {
  const chinese = /\p{Script=Han}/u.test(text) || (!/[a-z]/i.test(text) && field === 'chineseTitle');
  return chinese
    ? { sourceKey: 'chineseTitle', targetKey: 'englishTitle', langpair: 'zh-CN|en' }
    : { sourceKey: 'englishTitle', targetKey: 'chineseTitle', langpair: 'en|zh-CN' };
}

export function createTitleTranslationController({ translate, onResult, onStatus, delay = 800, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let timer;
  let controller;
  let revision = 0;
  const cancel = () => {
    revision += 1;
    if (timer != null) clearTimer(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
    onStatus('idle');
  };
  const request = (value, field, { immediate = false, composing = false } = {}) => {
    cancel();
    const source = String(value || '').trim();
    if (!source || composing) return;
    if (new TextEncoder().encode(source).length > 480) { onStatus('error', '标题太长，请缩短后再翻译'); return; }
    const token = revision;
    const direction = titleTranslationDirection(source, field);
    const run = async () => {
      timer = undefined;
      const active = new AbortController();
      controller = active;
      onStatus('busy');
      try {
        const result = await translate(source, direction.langpair, active.signal);
        if (token === revision) onResult({ ...direction, source, translated: result });
      } catch (error) {
        if (token === revision && error?.name !== 'AbortError') onStatus('error', '暂时无法翻译，请点击“重新翻译”重试');
      } finally {
        if (token === revision) { controller = undefined; onStatus('idle'); }
      }
    };
    if (immediate) void run();
    else timer = setTimer(run, delay);
  };
  return { request, cancel };
}
