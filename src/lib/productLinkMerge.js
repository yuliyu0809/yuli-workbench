// Only product links are unique by SKC. Ads and activity rows must stay separate.
const skcKey = (record) => String(record.productCode || record.skc || '').trim().toUpperCase();
const snapshot = ({ duplicateVariants, ...record }) => record;

export function mergeProductLinks(...lists) {
  const byId = new Map();
  for (const record of lists.flat()) {
    const previous = byId.get(record.id);
    byId.set(record.id, { ...record, duplicateVariants: [...(previous?.duplicateVariants || []), ...(record.duplicateVariants || [])] });
  }
  const groups = new Map();
  for (const record of byId.values()) {
    const key = skcKey(record) || `id:${record.id}`;
    groups.set(key, [...(groups.get(key) || []), record]);
  }
  return [...groups.values()].map((group) => {
    // Prefer the latest saved link; tie-break by id so all computers agree.
    const ranked = [...group].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || String(a.id).localeCompare(String(b.id)));
    const primary = ranked[0];
    const variants = new Map();
    for (const record of ranked) {
      for (const archived of record.duplicateVariants || []) variants.set(JSON.stringify(snapshot(archived)), snapshot(archived));
      if (record.id !== primary.id) variants.set(JSON.stringify(snapshot(record)), snapshot(record));
    }
    const archived = [...variants.values()].filter((record) => record.id !== primary.id);
    const result = { ...primary };
    if (archived.length) result.duplicateVariants = archived;
    else delete result.duplicateVariants;
    return result;
  });
}

export function normalizeProductLinks(workspace) {
  const discounts = mergeProductLinks(workspace.discounts || []);
  const redirects = new Map();
  for (const link of discounts) for (const variant of link.duplicateVariants || []) redirects.set(variant.id, link.id);
  return { ...workspace, discounts, priceReferences: (workspace.priceReferences || []).map((record) => redirects.has(record.discountId) ? { ...record, discountId: redirects.get(record.discountId) } : record) };
}
