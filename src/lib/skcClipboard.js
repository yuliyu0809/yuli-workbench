export function skcsForClipboard(links) {
  const seen = new Set();
  return links.flatMap((link) => {
    const skc = String(link.productCode || '').trim();
    const key = skc.toUpperCase();
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [skc];
  });
}

export function skcClipboardText(links) {
  return skcsForClipboard(links).join('、');
}
