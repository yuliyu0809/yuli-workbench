export const englishNegativePrompt =
  'no children, no kids, no babies, no cups, no mugs, no drinkware, no RV, no camper, no motorhome';

export const chineseNegativePrompt =
  '禁止出现儿童、小孩、婴儿、青少年；禁止出现杯子、马克杯、水杯、酒杯、饮料杯等杯具；禁止出现房车、露营车、RV、camper、motorhome';

export const globalPromptBanRules = [
  '场景提示词生成的图片中，禁止出现儿童、小孩、婴儿、青少年等儿童元素。',
  '禁止出现杯子、马克杯、水杯、酒杯、饮料杯等杯具元素。',
  '禁止出现房车、露营车、RV、camper、motorhome等元素。',
];

const bannedAssetTerms = [
  'child',
  'children',
  'kid',
  'kids',
  'baby',
  'babies',
  'teen',
  'teenager',
  'teenagers',
  'cup',
  'cups',
  'mug',
  'mugs',
  'drinkware',
  'rv',
  'camper',
  'motorhome',
  '儿童',
  '小孩',
  '婴儿',
  '青少年',
  '杯子',
  '马克杯',
  '水杯',
  '酒杯',
  '饮料杯',
  '杯具',
  '房车',
  '露营车',
];

export function filterBannedPromptAssets(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter((value) => {
    const text = String(value || '').toLowerCase();
    return !bannedAssetTerms.some((term) => text.includes(term));
  });
}
