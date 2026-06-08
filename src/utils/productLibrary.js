function makeId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function numberValue(value) {
  const parsed = Number(String(value ?? '').replace(/[¥￥,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function cleanProductName(value) {
  return String(value || '')
    .replace(/[（(?\[].*?[）)?\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLibrarySku(sku, productId, index) {
  const skuName = String(sku?.sku || sku?.name || '').trim();
  return {
    id: sku?.id || (productId || 'product') + '-sku-' + (index + 1),
    sku: skuName,
    name: skuName,
    supplyPrice: numberValue(sku?.supplyPrice ?? sku?.costPrice ?? sku?.cost),
  };
}

function normalizeLibraryProduct(product, index = 0) {
  const productName = cleanProductName(product?.productName || product?.name);
  const productId = product?.id || 'product-lib-' + (index + 1);
  const skus = Array.isArray(product?.skus) ? product.skus : [];
  return {
    id: productId,
    productName,
    name: productName,
    skus: skus.map((sku, skuIndex) => normalizeLibrarySku(sku, productId, skuIndex)).filter((sku) => productName && sku.sku),
    updatedAt: product?.updatedAt || '',
  };
}

export function getProductLibrary(library) {
  const products = Array.isArray(library?.products) ? library.products : [];
  const map = new Map();

  products.map(normalizeLibraryProduct).forEach((product) => {
    if (!product.productName || !product.skus.length) return;
    if (!map.has(product.productName)) {
      map.set(product.productName, { ...product, skus: [] });
    }
    const target = map.get(product.productName);
    product.skus.forEach((sku) => {
      const existing = target.skus.find((item) => item.sku === sku.sku);
      if (existing) {
        existing.supplyPrice = sku.supplyPrice;
        existing.name = sku.sku;
      } else {
        target.skus.push(sku);
      }
    });
    target.updatedAt = product.updatedAt || target.updatedAt;
  });

  return { products: [...map.values()].sort((a, b) => a.productName.localeCompare(b.productName, 'zh-CN')) };
}

export function getProductLibraryProducts(library) {
  return getProductLibrary(library).products.map((product, productIndex) => ({
    id: product.id || 'library-product-' + (productIndex + 1),
    name: product.productName,
    productName: product.productName,
    category: '产品信息库',
    englishName: '',
    skus: product.skus.map((sku, skuIndex) => ({
      id: sku.id || (product.id || 'library-product') + '-sku-' + (skuIndex + 1),
      name: sku.sku,
      sku: sku.sku,
      supplyPrice: numberValue(sku.supplyPrice),
      length: '',
      ledCount: '',
      size: '',
      note: '',
    })),
    specs: product.skus.map((sku) => sku.sku),
    dimensions: [],
    sellingPoints: [],
    costPrice: numberValue(product.skus[0]?.supplyPrice),
    defaultTitleTemplate: '',
    defaultSceneLibrary: [],
    colorScenes: { warm: [], white: [], colorful: [] },
    note: '',
    updatedAt: product.updatedAt || '',
  }));
}
