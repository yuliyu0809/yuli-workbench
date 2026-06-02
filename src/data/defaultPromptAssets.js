export const assetCategories = [
  { key: 'scene', label: '场景词' },
  { key: 'composition', label: '构图词' },
  { key: 'lens', label: '镜头词' },
  { key: 'lighting', label: '灯光词' },
  { key: 'mood', label: '氛围词' },
  { key: 'holiday', label: '节日词' },
  { key: 'europe', label: '欧洲元素词' },
];

const baseAssetPool = {
  scene: ['欧洲庭院角落', '阳台栏杆装饰', '花园小径', '门廊入口'],
  composition: ['中景商业摄影', '产品占画面40%', '自然垂落', '对角线构图'],
  lens: ['50mm', '轻微景深', '真实商业摄影'],
  lighting: ['柔和环境光', '傍晚蓝调时刻', '产品自然发光'],
  mood: ['高级温馨', '干净舒适', '户外生活感'],
  holiday: ['日常庭院装饰', '周末家庭聚会'],
  europe: ['石墙庭院', '木质露台', '藤编家具'],
};

const keroseneWarm = {
  scene: ['石墙围合的南法庭院', '葡萄藤长廊休闲区', '木质凉亭晚餐区', '藤编家具庭院角落', '橄榄树下休闲露台'],
  composition: ['中景商业摄影', '自然垂落', '对角线构图', '产品占画面40%'],
  lens: ['50mm', '轻微景深', '真实商业摄影'],
  lighting: ['暖金色发光', '傍晚蓝调时刻', '柔和环境光'],
  mood: ['乡村庭院氛围', '温暖复古', '安静高级'],
  holiday: ['夏日晚餐布置', '周末庭院聚会'],
  europe: ['南法石墙', '橄榄树', '木质凉亭', '藤编家具'],
};

function pool(overrides = {}) {
  return Object.fromEntries(assetCategories.map(({ key }) => [key, overrides[key] || baseAssetPool[key]]));
}

function productAssets(productId, colorPools) {
  const imageTypes = ['main', 'scene', 'grid', 'size', 'sku'];
  const colors = ['warm', 'white', 'colorful'];
  return {
    productId,
    colors: Object.fromEntries(
      colors.map((color) => [
        color,
        Object.fromEntries(imageTypes.map((imageType) => [imageType, pool(colorPools[color])])),
      ]),
    ),
  };
}

export const defaultPromptAssets = [
  productAssets('product-solar-kerosene-string', {
    warm: keroseneWarm,
    white: {
      scene: ['现代露台玻璃围栏', '极简白色阳台', '浅灰石材庭院', '现代户外餐桌旁', '白墙门廊入口'],
      composition: ['干净留白构图', '水平线构图', '产品居中偏右', '现代商业摄影'],
      lens: ['35mm', '清晰产品焦点', '轻微背景虚化'],
      lighting: ['冷白色发光', '清爽自然光', '柔和暮色'],
      mood: ['现代简洁', '清爽高级', '安静理性'],
      europe: ['玻璃栏杆', '浅色石材', '现代露台家具'],
    },
    colorful: {
      scene: ['花园派对灯光布置', '生日聚会甜品桌旁', '节日庭院入口', '彩色气球花园角落', '户外庆祝餐桌上方'],
      composition: ['活泼对角线构图', '多层次背景', '产品占画面45%', '庆祝氛围构图'],
      lens: ['35mm', '真实派对摄影', '轻微动感背景'],
      lighting: ['彩色发光', '节日氛围光', '夜晚柔和环境光'],
      mood: ['欢乐节日感', '活泼温馨', '派对氛围'],
      holiday: ['生日派对', '节日布置', '花园聚会'],
      europe: ['欧洲花园餐桌', '庭院花架', '户外木桌'],
    },
  }),
  productAssets('product-solar-soccer-string', {
    warm: { scene: ['草坪亲子游戏区', '木质栅栏花园', '门廊足球主题角落'] },
    white: { scene: ['现代阳台围栏', '简洁户外运动区', '白色庭院墙面'] },
    colorful: { scene: ['花园生日派对', '儿童户外庆祝场景', '节日球迷聚会'] },
  }),
  productAssets('product-solar-bubble-ball-string', {
    warm: { scene: ['花园廊架休闲区', '藤编沙发庭院角落', '暖光露台植物旁'] },
    white: { scene: ['玻璃阳台植物区', '现代白色露台', '极简植物墙旁'] },
    colorful: { scene: ['节庆花园背景', '彩灯派对餐桌', '户外庆祝长桌'] },
  }),
  productAssets('product-solar-mushroom-path', {
    warm: { scene: ['乡村庭院小径', '木门入口草坪边', '石板花园路径'] },
    white: { scene: ['极简花园步道', '现代庭院入口', '石板露台边缘'] },
    colorful: { scene: ['童话花园角落', '节日草坪装饰', '儿童花园路径'] },
  }),
];
