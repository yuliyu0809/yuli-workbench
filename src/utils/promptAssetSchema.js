import { assetCategories } from '../data/defaultPromptAssets.js';

const imageTypes = ['main', 'scene', 'grid', 'size', 'sku'];
const colors = ['warm', 'white', 'colorful'];

function emptyPool() {
  return Object.fromEntries(assetCategories.map(({ key }) => [key, []]));
}

export function normalizePromptAssets(records, products = []) {
  const source = Array.isArray(records) ? records : [];
  const byProduct = new Map(source.map((record) => [record.productId, record]));

  return products.map((product) => {
    const existing = byProduct.get(product.id);
    const colorsObject = {};
    colors.forEach((color) => {
      colorsObject[color] = {};
      imageTypes.forEach((imageType) => {
        colorsObject[color][imageType] = {
          ...emptyPool(),
          ...(existing?.colors?.[color]?.[imageType] || {}),
        };
      });
    });
    return { productId: product.id, colors: colorsObject };
  });
}

export function getAssetPool(promptAssets, productId, color, imageType) {
  return promptAssets.find((item) => item.productId === productId)?.colors?.[color]?.[imageType] || emptyPool();
}

export function hasRequiredAssets(pool) {
  return ['scene', 'composition', 'lens', 'lighting', 'mood'].every(
    (key) => Array.isArray(pool[key]) && pool[key].length > 0,
  );
}
