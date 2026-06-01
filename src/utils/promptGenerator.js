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

const sceneMap = {
  'light-001': {
    warm: {
      zh: '庭院晚餐、木质凉亭',
      en: 'courtyard dinner setting, wooden gazebo',
    },
    white: {
      zh: '现代阳台、极简露台',
      en: 'modern balcony, minimalist terrace',
    },
    colorful: {
      zh: '节日派对、花园聚会',
      en: 'festival party, garden gathering',
    },
  },
  'light-002': {
    warm: {
      zh: '草坪亲子游戏区、门廊足球主题角落',
      en: 'lawn family play area, porch soccer-themed corner',
    },
    white: {
      zh: '现代阳台围栏、简洁户外运动区',
      en: 'modern balcony railing, clean outdoor sports corner',
    },
    colorful: {
      zh: '花园生日派对、儿童户外庆祝场景',
      en: 'garden birthday party, kids outdoor celebration scene',
    },
  },
  'light-003': {
    warm: {
      zh: '花园廊架、藤编休闲区',
      en: 'garden pergola, rattan lounge area',
    },
    white: {
      zh: '玻璃阳台、现代白色露台',
      en: 'glass balcony, modern white terrace',
    },
    colorful: {
      zh: '节庆花园、彩灯派对背景',
      en: 'holiday garden, colorful party light backdrop',
    },
  },
  'light-004': {
    warm: {
      zh: '庭院小径、木门入口',
      en: 'courtyard pathway, wooden gate entrance',
    },
    white: {
      zh: '极简花园步道、石板露台边缘',
      en: 'minimal garden walkway, stone patio edge',
    },
    colorful: {
      zh: '童话花园、节日草坪装饰',
      en: 'fairy-tale garden, festive lawn decoration',
    },
  },
};

const imageTypeDirectives = {
  main: {
    zh: '产品居中清晰展示，干净电商主图构图，突出太阳能灯饰外观和发光效果',
    en: 'centered clean e-commerce composition, clear product focus, show the solar light design and glow effect',
  },
  scene: {
    zh: '真实户外使用场景，产品自然安装，环境有生活感但不出现清晰人脸',
    en: 'realistic outdoor usage scene, product naturally installed, lived-in atmosphere without clear human faces',
  },
  grid: {
    zh: '四宫格布局，分别展示整体场景、灯光细节、安装位置、太阳能面板特写',
    en: 'four-panel layout showing full scene, lighting detail, installation position, and solar panel close-up',
  },
  size: {
    zh: '尺寸图，上半部分真实场景图，下半部分展示规格、尺寸、太阳能面板参数',
    en: 'size chart image, top half realistic usage scene, bottom half specifications, dimensions, and solar panel parameters',
  },
  sku: {
    zh: 'SKU图，清晰区分颜色版本，保持同一产品不同颜色对应不同场景类别',
    en: 'SKU variant image, clearly separate color versions, keep each color matched to a different scene category',
  },
};

const platformDirectives = {
  temuEu: {
    zh: '适合TEMU欧洲站，优先庭院、阳台、花园、门廊场景，画面直接、商品感强',
    en: 'optimized for TEMU Europe, prioritize patio, balcony, garden, and porch scenes, direct product-focused image',
  },
  amazonEu: {
    zh: '适合Amazon欧洲站，画面更干净高级，强调真实材质、安装方式和使用价值',
    en: 'optimized for Amazon Europe, cleaner premium look, emphasize realistic material, installation, and practical value',
  },
};

function getScene(productId, color) {
  return sceneMap[productId]?.[color] || sceneMap['light-001'].warm;
}

function getLabel(source, key, fallback) {
  return source[key] || fallback;
}

export function generatePrompt(form, product) {
  const color = getLabel(colorLabels, form.color, colorLabels.warm);
  const imageType = getLabel(imageTypeLabels, form.imageType, imageTypeLabels.scene);
  const platform = getLabel(platformLabels, form.platform, platformLabels.temuEu);
  const scene = getScene(form.productId, form.color);
  const imageDirective = getLabel(imageTypeDirectives, form.imageType, imageTypeDirectives.scene);
  const platformDirective = getLabel(platformDirectives, form.platform, platformDirectives.temuEu);
  const productNameZh = product?.name || '太阳能灯饰产品';
  const productNameEn = product?.englishName || 'solar outdoor lighting product';
  const specs = product?.specs || 'IP44 solar outdoor light';
  const sellingPoints = product?.sellingPoints || 'solar powered outdoor decorative lighting';

  const chinese = [
    `${platform.zh}${imageType.zh}提示词：${productNameZh}`,
    `颜色：${color.zh}`,
    `指定场景：${scene.zh}`,
    `规格卖点：${specs}；${sellingPoints}`,
    `画面要求：${imageDirective.zh}`,
    `平台要求：${platformDirective.zh}`,
    '统一使用 IP44，不出现 waterproof 字样',
    '禁止出现酒、酒杯、水印、清晰人脸',
    '真实户外灯饰摄影，光线自然，商品主体清晰，画面干净高级',
  ].join('，');

  const english = [
    `${platform.en} ${imageType.en} prompt: ${productNameEn}`,
    `${color.en} light version`,
    `scene category: ${scene.en}`,
    `specifications and selling points: ${specs}; ${sellingPoints}`,
    `image requirement: ${imageDirective.en}`,
    `platform requirement: ${platformDirective.en}`,
    'use IP44 only, do not use the word waterproof',
    'no alcohol, no wine glass, no watermark, no clear human face',
    'realistic outdoor lighting photography, natural light, clear product focus, clean premium composition',
  ].join(', ');

  return {
    chinese,
    english,
    sceneZh: scene.zh,
    sceneEn: scene.en,
    colorLabel: color.zh,
    imageTypeLabel: imageType.zh,
    platformLabel: platform.zh,
  };
}
