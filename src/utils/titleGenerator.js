const colorLabels = {
  warm: { zh: '暖色', en: 'Warm White', de: 'Warmweiss', fr: 'Blanc Chaud' },
  white: { zh: '白色', en: 'White', de: 'Weiss', fr: 'Blanc' },
  colorful: { zh: '彩色', en: 'Multicolor', de: 'Bunt', fr: 'Multicolore' },
};

const platformLabels = {
  temu: 'TEMU欧洲站',
  amazon: 'Amazon欧洲站',
  german: '德国站',
  french: '法国站',
};

function cleanText(value) {
  return String(value || '').replace(/waterproof/gi, '').replace(/\s+/g, ' ').trim();
}

function uniqueList(values) {
  return [...new Set(values.map(cleanText).filter(Boolean))];
}

function sortSkuNames(skus = []) {
  return [...skus].sort((a, b) => scoreSku(b.name) - scoreSku(a.name)).map((sku) => sku.name);
}

function scoreSku(name = '') {
  const text = String(name);
  const led = Number(text.match(/(\d+)\s*LED/i)?.[1] || 0);
  const length = Number(text.match(/(\d+(?:\.\d+)?)\s*m/i)?.[1] || 0);
  const pcs = Number(text.match(/(\d+)\s*PCS/i)?.[1] || 0);
  return led * 10 + length + pcs * 5;
}

function fitLength(title, targetChars) {
  const target = Number(targetChars) || 0;
  if (!target || title.length <= target) {
    return title;
  }
  const parts = title.split(', ');
  const kept = [];
  for (const part of parts) {
    const next = [...kept, part].join(', ');
    if (next.length <= target || kept.length < 2) {
      kept.push(part);
    }
  }
  return kept.join(', ');
}

function joinComma(values) {
  return uniqueList(values).join(', ');
}

export function getColorLabel(color) {
  return colorLabels[color] || colorLabels.warm;
}

export function getPlatformLabel(platform) {
  return platformLabels[platform] || platformLabels.temu;
}

export function generateMarketplaceTitles({ product, sku, color, sellingPoints, platform, targetChars }) {
  const productName = cleanText(product?.englishName || product?.name || 'Solar Outdoor Lights');
  const skuName = cleanText(sku?.name || '');
  const skuInfo = uniqueList([skuName, sku?.length, sku?.ledCount]).join(' ');
  const sortedSpecs = sortSkuNames(product?.skus || []);
  const colorInfo = getColorLabel(color);
  const points = uniqueList([
    ...(Array.isArray(sellingPoints) ? sellingPoints : String(sellingPoints || '').split(/\r?\n|,|、/)),
    'Solar Powered',
    '8 Lighting Modes',
    'IP44',
    'Outdoor Decoration',
  ]);
  const commonEnglish = joinComma([
    skuInfo,
    productName,
    colorInfo.en,
    'Solar Powered',
    '8 Lighting Modes',
    'IP44',
    'Outdoor Decoration',
    'Garden Patio Balcony Porch',
  ]);

  const amazonEnglish = joinComma([
    skuInfo,
    productName,
    colorInfo.en,
    'Solar Powered Outdoor String Lights',
    '8 Lighting Modes',
    'IP44 Garden Patio Balcony Porch Decoration',
  ]);

  const german = joinComma([
    skuInfo,
    productName,
    colorInfo.de,
    'Solarbetrieben',
    '8 Lichtmodi',
    'IP44',
    'Aussen Dekoration fuer Garten Terrasse Balkon Veranda',
  ]);

  const french = joinComma([
    skuInfo,
    productName,
    colorInfo.fr,
    'Alimentation Solaire',
    '8 Modes Lumineux',
    'IP44',
    'Decoration Exterieure Jardin Terrasse Balcon Porche',
  ]);

  const chinese = [
    skuInfo,
    product?.name || '太阳能户外灯饰',
    colorInfo.zh,
    '太阳能充电',
    '8种模式',
    'IP44',
    '户外庭院/阳台/花园/门廊装饰',
  ].filter(Boolean).join('，');

  return {
    platformLabel: getPlatformLabel(platform),
    sortedSpecs,
    sellingPoints: points,
    english: fitLength(platform === 'amazon' ? amazonEnglish : commonEnglish, targetChars),
    amazon: fitLength(amazonEnglish, targetChars),
    german: fitLength(german, targetChars),
    french: fitLength(french, targetChars),
    chinese: fitLength(chinese, targetChars),
  };
}
