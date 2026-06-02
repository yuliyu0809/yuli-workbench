const colorNames = {
  warm: '暖色',
  white: '白色',
  colorful: '彩色',
  black: '黑色',
  brown: '棕色',
  green: '绿色',
  silver: '银色',
  unknown: '未识别',
};

const productTypeRules = [
  { keys: ['煤油', 'kerosene', 'lantern'], type: '太阳能煤油灯串', shape: '复古煤油灯造型，灯罩轮廓明显，适合庭院悬挂' },
  { keys: ['足球', 'football', 'soccer'], type: '太阳能足球灯串', shape: '足球球体造型，表面有运动主题纹理' },
  { keys: ['气泡', 'bubble', 'ball'], type: '太阳能气泡球灯串', shape: '圆球灯泡造型，透明气泡质感，发光面柔和' },
  { keys: ['蘑菇', 'mushroom'], type: '太阳能蘑菇引路灯', shape: '蘑菇伞盖造型，适合草坪和小径布置' },
  { keys: ['string', '串灯', 'fairy'], type: '太阳能装饰灯串', shape: '连续灯串结构，适合悬挂、缠绕和户外装饰' },
];

function cleanList(values) {
  return Array.isArray(values) ? values.filter(Boolean) : [];
}

function includesAny(text, keys) {
  return keys.some((key) => text.includes(key.toLowerCase()));
}

function guessProductType(fileName, product) {
  const text = `${fileName || ''} ${product?.name || ''} ${product?.englishName || ''}`.toLowerCase();
  const matched = productTypeRules.find((rule) => includesAny(text, rule.keys));
  if (matched) {
    return matched;
  }
  return {
    type: product?.name || '太阳能户外装饰灯',
    shape: '户外太阳能灯饰造型，适合欧洲庭院、阳台、花园和门廊场景',
  };
}

function guessMaterial(product) {
  const text = `${product?.name || ''} ${product?.note || ''} ${cleanList(product?.sellingPoints).join(' ')}`.toLowerCase();
  if (text.includes('玻璃') || text.includes('glass')) return '玻璃或透明灯罩';
  if (text.includes('藤') || text.includes('rattan')) return '藤编质感与塑料灯体';
  if (text.includes('金属') || text.includes('metal') || text.includes('铁')) return '金属质感外壳';
  if (text.includes('蘑菇')) return '塑料灯罩与插地杆结构';
  return '户外耐用塑料与太阳能面板组件';
}

function guessCutout(productType, sellingPoints) {
  const text = `${productType} ${sellingPoints.join(' ')}`.toLowerCase();
  if (text.includes('煤油') || text.includes('lantern')) return '灯罩框架和复古提手形成明显镂空结构';
  if (text.includes('足球')) return '球面拼块纹理，局部透光装饰元素';
  if (text.includes('气泡') || text.includes('bubble')) return '透明球壳内含气泡纹理，形成层次透光效果';
  if (text.includes('蘑菇')) return '伞盖下沿透光，灯体与草坪场景融合';
  return '灯体透光结构清晰，适合强调发光细节';
}

function colorFromRgb({ r, g, b }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const warmth = r - b;

  if (max - min > 55 && r > 145 && g > 90 && b < 110) return 'warm';
  if (max - min < 35 && max > 172) return 'white';
  if (max - min > 70 && (g > 140 || b > 140 || r > 170)) return 'colorful';
  if (max < 70) return 'black';
  if (warmth > 35 && r > 100 && g > 65) return 'brown';
  if (g > r + 25 && g > b + 20) return 'green';
  return 'unknown';
}

export async function extractImageProfile(file) {
  if (!file) {
    return null;
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const sampleSize = 80;
  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, sampleSize, sampleSize);
  const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let index = 0; index < pixels.length; index += 16) {
    const alpha = pixels[index + 3];
    if (alpha < 80) continue;
    r += pixels[index];
    g += pixels[index + 1];
    b += pixels[index + 2];
    count += 1;
  }

  const rgb = count
    ? { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) }
    : { r: 0, g: 0, b: 0 };

  const thumbCanvas = document.createElement('canvas');
  const maxSide = 360;
  const ratio = Math.min(maxSide / image.width, maxSide / image.height, 1);
  thumbCanvas.width = Math.max(1, Math.round(image.width * ratio));
  thumbCanvas.height = Math.max(1, Math.round(image.height * ratio));
  thumbCanvas.getContext('2d').drawImage(image, 0, 0, thumbCanvas.width, thumbCanvas.height);

  return {
    dataUrl,
    thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.72),
    fileName: file.name,
    fileSize: file.size,
    width: image.width,
    height: image.height,
    dominantRgb: rgb,
    dominantColor: colorFromRgb(rgb),
  };
}

export function generateImagePromptAnalysis({ profile, product, sku, color, platform }) {
  const sellingPoints = cleanList(product?.sellingPoints);
  const productRule = guessProductType(profile?.fileName, product);
  const detectedColor = color && color !== 'auto' ? color : profile?.dominantColor || 'unknown';
  const colorLabel = colorNames[detectedColor] || colorNames.unknown;
  const material = guessMaterial(product);
  const cutout = guessCutout(productRule.type, sellingPoints);
  const lightEffect = detectedColor === 'white'
    ? '清透白光，适合现代阳台和极简露台'
    : detectedColor === 'colorful'
      ? '彩色发光，适合节日派对和花园聚会'
      : '暖金色发光，适合庭院晚餐、木质凉亭和门廊氛围';

  const skuText = sku?.name ? `，规格 ${sku.name}` : '';
  const platformText = platform === 'amazonEu' ? 'Amazon欧洲站' : 'TEMU欧洲站';
  const priorityPoints = ['Solar Powered', '8 Lighting Modes', 'IP44', 'Outdoor Decoration'];
  const mergedPoints = [...priorityPoints, ...sellingPoints].filter((point, index, array) => array.indexOf(point) === index);

  const chinesePrompt = [
    `${productRule.type}${skuText}，${colorLabel}，${productRule.shape}`,
    `材质表现：${material}`,
    `镂空/透光元素：${cutout}`,
    `光效：${lightEffect}`,
    `${platformText}商品图风格，真实欧洲户外场景，干净高级商业摄影，突出太阳能面板和灯体细节，禁止水印、酒杯、清晰人脸`,
  ].join('。');

  const englishPrompt = [
    `${productRule.type}${sku?.name ? `, ${sku.name}` : ''}, ${colorLabel} color, ${productRule.shape}`,
    `material look: ${material}`,
    `cutout and translucent details: ${cutout}`,
    `lighting effect: ${lightEffect}`,
    `${platformText} product image style, realistic European outdoor scene, clean premium commercial photography, highlight solar panel and lamp details, no watermark, no wine glass, no clear face`,
  ].join('. ');

  const titleKeywords = [
    sku?.name,
    product?.englishName || productRule.type,
    'Solar Powered',
    'IP44',
    '8 Lighting Modes',
    'Outdoor Decoration',
    colorLabel,
  ].filter(Boolean);

  return {
    productType: productRule.type,
    shapeFeature: productRule.shape,
    material,
    color: colorLabel,
    cutoutElement: cutout,
    lightEffect,
    chinesePrompt,
    englishPrompt,
    sellingPointSuggestions: mergedPoints.slice(0, 8),
    titleKeywords,
    platformLabel: platformText,
  };
}
