const colorLabels = {
  warm: { zh: '暖色', en: 'warm white' },
  white: { zh: '白色', en: 'cool white' },
  colorful: { zh: '彩色', en: 'colorful' },
};

const imageTypeLabels = {
  main: { zh: '主图', en: 'main image' },
  scene: { zh: '场景图', en: 'lifestyle scene image' },
  grid: { zh: '四宫格', en: 'four-panel collage image' },
  size: { zh: '尺寸图', en: 'size chart image' },
  sku: { zh: 'SKU图', en: 'SKU variant image' },
};

const platformLabels = {
  temuEu: { zh: 'TEMU欧洲站', en: 'TEMU Europe' },
  amazonEu: { zh: 'Amazon欧洲站', en: 'Amazon Europe' },
};

const imageTypeDirectives = {
  main: {
    zh: '主图模板：产品主体突出，强调点击率，色彩饱和度高，干净浅色背景，主体占画面中心，灯光效果清晰可见',
    en: 'main image template: strong product hero focus, CTR-oriented composition, high saturation, clean light background, centered product, visible lighting effect',
  },
  scene: {
    zh: '场景图模板：中景构图，真实生活化，欧洲户外氛围，产品自然安装在场景中，环境有质感但不抢主体',
    en: 'lifestyle scene template: medium shot, realistic daily life feeling, European outdoor atmosphere, product naturally installed, premium environment without stealing focus',
  },
  grid: {
    zh: '四宫格模板：四个不同场景或角度，统一高级商业摄影风格，分别展示整体氛围、灯光细节、安装位置、太阳能面板',
    en: 'four-panel template: four different scenes or angles, unified premium commercial photography style, show full ambience, lighting detail, installation position, and solar panel',
  },
  size: {
    zh: '尺寸图模板：上半真实场景，下半尺寸参数；左侧规格对比，中间产品尺寸，右侧太阳能板尺寸',
    en: 'size chart template: top half realistic scene, bottom half size parameters; left specification comparison, center product dimensions, right solar panel dimensions',
  },
  sku: {
    zh: 'SKU图模板：不同规格对应不同使用场景，清晰区分规格版本，保持统一高级电商视觉',
    en: 'SKU image template: different specifications matched with different usage scenes, clearly separate variants, consistent premium e-commerce style',
  },
};

function pick(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return '';
  }
  return list[Math.floor(Math.random() * list.length)];
}

function joinList(value, fallback = '') {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join('、') || fallback;
  }
  return value || fallback;
}

function getLabel(source, key, fallback) {
  return source[key] || fallback;
}

export function getColorLabel(color) {
  return getLabel(colorLabels, color, colorLabels.warm);
}

export function getImageTypeLabel(imageType) {
  return getLabel(imageTypeLabels, imageType, imageTypeLabels.scene);
}

export function getPlatformLabel(platform) {
  return getLabel(platformLabels, platform, platformLabels.temuEu);
}

export function generatePromptFromAssets(form, product, sku, assetPool) {
  const color = getColorLabel(form.color);
  const imageType = getImageTypeLabel(form.imageType);
  const platform = getPlatformLabel(form.platform);
  const imageDirective = getLabel(imageTypeDirectives, form.imageType, imageTypeDirectives.scene);
  const productNameZh = product?.name || '太阳能灯饰产品';
  const productNameEn = product?.englishName || productNameZh;
  const skuText = sku ? `${sku.name}，${sku.length || '-'}，${sku.ledCount || '-'}，${sku.size || '-'}` : '未选择SKU';
  const sellingPoints = joinList(product?.sellingPoints, '太阳能充电、IP44、户外装饰');
  const pickedAssets = {
    scene: pick(assetPool.scene),
    composition: pick(assetPool.composition),
    lens: pick(assetPool.lens),
    lighting: pick(assetPool.lighting),
    mood: pick(assetPool.mood),
    holiday: pick(assetPool.holiday),
    europe: pick(assetPool.europe),
  };

  const chinese = [
    `${platform.zh}${imageType.zh}提示词：${productNameZh}`,
    `规格SKU：${skuText}`,
    `颜色：${color.zh}`,
    `场景词：${pickedAssets.scene}`,
    `构图词：${pickedAssets.composition}`,
    `镜头词：${pickedAssets.lens}`,
    `灯光词：${pickedAssets.lighting}`,
    `氛围词：${pickedAssets.mood}`,
    pickedAssets.holiday ? `节日词：${pickedAssets.holiday}` : '',
    pickedAssets.europe ? `欧洲元素词：${pickedAssets.europe}` : '',
    `卖点：${sellingPoints}`,
    `图片类型要求：${imageDirective.zh}`,
    '重要规则：同一产品不同颜色必须使用不同场景素材池，禁止混用',
    '统一使用 IP44，不出现 waterproof 字样；禁止酒、酒杯、水印、清晰人脸',
    '真实高级商业摄影，商品主体清晰，画面干净，适合电商平台上架',
  ].filter(Boolean).join('，');

  const english = [
    `${platform.en} ${imageType.en} prompt: ${productNameEn}`,
    `SKU specification: ${sku?.name || '-'}, ${sku?.length || '-'}, ${sku?.ledCount || '-'}, ${sku?.size || '-'}`,
    `color version: ${color.en}`,
    `scene asset: ${pickedAssets.scene}`,
    `composition asset: ${pickedAssets.composition}`,
    `lens asset: ${pickedAssets.lens}`,
    `lighting asset: ${pickedAssets.lighting}`,
    `mood asset: ${pickedAssets.mood}`,
    pickedAssets.holiday ? `holiday asset: ${pickedAssets.holiday}` : '',
    pickedAssets.europe ? `European element asset: ${pickedAssets.europe}` : '',
    `selling points: ${sellingPoints}`,
    `image type requirement: ${imageDirective.en}`,
    'important rule: different colors of the same product must use different scene asset pools, do not mix them',
    'use IP44 only, do not use the word waterproof; no alcohol, no wine glass, no watermark, no clear human face',
    'realistic premium commercial photography, clear product focus, clean e-commerce composition',
  ].filter(Boolean).join(', ');

  return {
    chinese,
    english,
    pickedAssets,
    productName: productNameZh,
    skuName: sku?.name || '',
    colorLabel: color.zh,
    imageTypeLabel: imageType.zh,
    platformLabel: platform.zh,
  };
}
