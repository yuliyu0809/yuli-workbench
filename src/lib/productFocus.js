export function mergeProductFocus(primary = {}, secondary = {}) {
  const merged = { ...primary };
  for (const [id, entry] of Object.entries(secondary || {})) {
    if (!entry || typeof entry.active !== 'boolean') continue;
    const previous = merged[id];
    if (!previous || String(entry.updatedAt || '') >= String(previous.updatedAt || '')) merged[id] = entry;
  }
  return merged;
}

export function focusCoverage(products = [], links = [], focus = {}, stores = []) {
  return products.filter((product) => focus?.[product.id]?.active).map((product) => {
    const counts = Object.fromEntries(stores.map((store) => [store, new Set(links.filter((link) => link.store === store
      && (link.productId ? link.productId === product.id : link.productName === product.productName))
      .map((link) => String(link.productCode || link.skc || '').trim().toUpperCase()).filter(Boolean)).size]));
    return { product, counts, missing: stores.filter((store) => !counts[store]) };
  }).sort((left, right) => right.missing.length - left.missing.length || left.product.productName.localeCompare(right.product.productName, 'zh-CN'));
}
