// Only product links are unique by SKC. Ads and activity rows must stay separate.
const skcKey = (record) => String(record.productCode || record.skc || '').trim().toUpperCase();
const snapshot = ({ duplicateVariants, ...record }) => record;

export function mergeProductLinks(...lists) {
  const byId = new Map();
  for (const record of lists.flat()) {
    byId.set(record.id, record);
  }
  const groups = new Map();
  for (const record of byId.values()) {
    const key = skcKey(record) || `id:${record.id}`;
    groups.set(key, [...(groups.get(key) || []), record]);
  }
  return [...groups.values()].map((group) => {
    // Prefer the latest saved link; tie-break by id so all computers agree.
    const ranked = [...group].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || String(a.id).localeCompare(String(b.id)));
    // Explicitly discard duplicates and archives; do not combine their fields.
    return snapshot(ranked[0]);
  });
}

export function normalizeProductLinks(workspace) {
  const discounts = mergeProductLinks(workspace.discounts || []);
  const redirects = new Map();
  const canonical = new Map(discounts.filter(skcKey).map((link) => [skcKey(link), link.id]));
  for (const link of workspace.discounts || []) {
    const retainedId = canonical.get(skcKey(link)) || link.id;
    redirects.set(link.id, retainedId);
    for (const variant of link.duplicateVariants || []) redirects.set(variant.id, retainedId);
  }
  return { ...workspace, discounts, priceReferences: (workspace.priceReferences || []).map((record) => redirects.has(record.discountId) ? { ...record, discountId: redirects.get(record.discountId) } : record) };
}
