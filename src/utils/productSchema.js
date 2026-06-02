function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value ? [value] : [];
}

function createSkuFromLegacy(product, spec, index) {
  const name = spec || product?.name || `SKU${index + 1}`;
  return {
    id: `${product?.id || 'product'}-sku-${index + 1}`,
    name,
    supplyPrice: Number(product?.costPrice || product?.cost || 0),
    length: '',
    ledCount: '',
    size: ensureArray(product?.dimensions)[index] || ensureArray(product?.dimensions)[0] || '',
    note: '',
  };
}

export function normalizeProduct(product) {
  const specs = ensureArray(product?.specs);
  const skus = Array.isArray(product?.skus) && product.skus.length > 0
    ? product.skus.map((sku, index) => ({
        id: sku.id || `${product.id || 'product'}-sku-${index + 1}`,
        name: sku.name || specs[index] || `SKU${index + 1}`,
        supplyPrice: Number(sku.supplyPrice || sku.costPrice || sku.cost || product?.costPrice || product?.cost || 0),
        length: sku.length || '',
        ledCount: sku.ledCount || '',
        size: sku.size || '',
        note: sku.note || '',
      }))
    : (specs.length ? specs : ['默认规格']).map((spec, index) => createSkuFromLegacy(product, spec, index));

  return {
    id: product?.id || `product-${Date.now()}`,
    name: product?.name || '未命名产品',
    category: product?.category || '太阳能灯饰',
    englishName: product?.englishName || '',
    skus,
    specs,
    dimensions: ensureArray(product?.dimensions),
    sellingPoints: ensureArray(product?.sellingPoints),
    costPrice: Number(product?.costPrice || product?.cost || skus[0]?.supplyPrice || 0),
    defaultTitleTemplate: product?.defaultTitleTemplate || '',
    defaultSceneLibrary: ensureArray(product?.defaultSceneLibrary),
    colorScenes: {
      warm: ensureArray(product?.colorScenes?.warm),
      white: ensureArray(product?.colorScenes?.white),
      colorful: ensureArray(product?.colorScenes?.colorful),
    },
    note: product?.note || '',
    updatedAt: product?.updatedAt || '',
  };
}

export function normalizeProducts(products) {
  return Array.isArray(products) ? products.map(normalizeProduct) : [];
}

export function getProductSku(product, skuId) {
  return product?.skus?.find((sku) => sku.id === skuId) || product?.skus?.[0] || null;
}
