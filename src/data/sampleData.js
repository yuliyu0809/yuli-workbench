import { globalPromptBanRules } from './globalPromptRules.js';

export const defaultProducts = [
  {
    id: 'product-solar-kerosene-string',
    name: '太阳能煤油灯串',
    category: '太阳能灯串',
    englishName: 'Solar Kerosene Lantern String Lights',
    skus: [
      {
        id: 'sku-kerosene-5m20led',
        name: '5m20LED',
        supplyPrice: 13.5,
        length: '5m',
        ledCount: '20LED',
        size: '5m灯串，20颗LED，煤油灯造型灯罩',
        note: '基础款，适合主推低价引流。',
      },
      {
        id: 'sku-kerosene-6-5m30led',
        name: '6.5m30LED',
        supplyPrice: 16.5,
        length: '6.5m',
        ledCount: '30LED',
        size: '6.5m灯串，30颗LED，煤油灯造型灯罩',
        note: '更适合庭院和凉亭场景。',
      },
    ],
    specs: ['5m20LED', '6.5m30LED'],
    dimensions: ['5m / 20LED', '6.5m / 30LED', '太阳能面板参数展示区'],
    sellingPoints: ['IP44', '太阳能充电', '8种模式', '复古煤油灯造型'],
    costPrice: 18.8,
    defaultTitleTemplate:
      '{count} Solar Kerosene Lantern String Lights, IP44 Outdoor Garden Patio Balcony Porch Decor',
    defaultSceneLibrary: ['庭院', '阳台', '花园', '门廊'],
    colorScenes: {
      warm: ['木质凉亭', '乡村庭院', '石墙花园'],
      white: ['现代露台', '极简阳台', '玻璃庭院'],
      colorful: ['花园派对', '生日聚会', '节日布置'],
    },
    note: '复古煤油灯造型适合做夜晚氛围场景，避免酒杯、水印和清晰人脸。',
    updatedAt: '2026-06-02',
  },
  {
    id: 'product-solar-soccer-string',
    name: '太阳能足球灯串',
    category: '太阳能主题灯串',
    englishName: 'Solar Soccer Ball String Lights',
    skus: [
      {
        id: 'sku-soccer-5m20led',
        name: '5m20LED',
        supplyPrice: 12.8,
        length: '5m',
        ledCount: '20LED',
        size: '5m灯串，20颗足球灯罩LED',
        note: '适合阳台和小花园场景。',
      },
      {
        id: 'sku-soccer-6-5m30led',
        name: '6.5m30LED',
        supplyPrice: 15.8,
        length: '6.5m',
        ledCount: '30LED',
        size: '6.5m灯串，30颗足球灯罩LED',
        note: '适合派对和花园聚会场景。',
      },
    ],
    specs: ['5m20LED', '6.5m30LED'],
    dimensions: ['5m / 20LED', '6.5m / 30LED', '足球灯罩直径展示', '太阳能面板参数展示区'],
    sellingPoints: ['IP44', '太阳能充电', '8种模式', '足球主题造型'],
    costPrice: 16.5,
    defaultTitleTemplate:
      '{count} Solar Soccer Ball String Lights, IP44 Football Theme Outdoor Garden Balcony Decor',
    defaultSceneLibrary: ['草坪', '阳台围栏', '花园派对', '门廊'],
    colorScenes: {
      warm: ['草坪亲子游戏区', '门廊足球主题角落', '木质栅栏花园'],
      white: ['现代阳台围栏', '简洁户外运动区', '白色庭院墙面'],
      colorful: ['花园生日派对', '儿童户外庆祝场景', '节日球迷聚会'],
    },
    note: '适合突出足球主题和户外派对氛围，不要出现酒精饮品。',
    updatedAt: '2026-06-02',
  },
  {
    id: 'product-solar-bubble-ball-string',
    name: '太阳能气泡球灯串',
    category: '太阳能氛围灯串',
    englishName: 'Solar Bubble Ball String Lights',
    skus: [
      {
        id: 'sku-bubble-5m20led',
        name: '5m20LED',
        supplyPrice: 13.2,
        length: '5m',
        ledCount: '20LED',
        size: '5m灯串，20颗气泡球LED',
        note: '适合阳台植物区。',
      },
      {
        id: 'sku-bubble-6-5m30led',
        name: '6.5m30LED',
        supplyPrice: 16.2,
        length: '6.5m',
        ledCount: '30LED',
        size: '6.5m灯串，30颗气泡球LED',
        note: '适合花园廊架和露台。',
      },
      {
        id: 'sku-bubble-7m50led',
        name: '7m50LED',
        supplyPrice: 21.5,
        length: '7m',
        ledCount: '50LED',
        size: '7m灯串，50颗气泡球LED',
        note: '适合大场景四宫格和派对场景。',
      },
    ],
    specs: ['5m20LED', '6.5m30LED', '7m50LED'],
    dimensions: ['气泡球灯罩细节', '灯串总长', '灯珠间距', '太阳能面板参数展示区'],
    sellingPoints: ['IP44', '太阳能充电', '8种模式', '透明气泡球灯罩'],
    costPrice: 17.2,
    defaultTitleTemplate:
      '{count} Solar Bubble Ball String Lights, IP44 Outdoor Globe Lights for Garden Patio Balcony',
    defaultSceneLibrary: ['花园廊架', '阳台植物区', '庭院休闲区', '门廊'],
    colorScenes: {
      warm: ['花园廊架', '藤编休闲区', '暖光庭院角落'],
      white: ['玻璃阳台', '现代白色露台', '极简植物墙'],
      colorful: ['节庆花园', '彩灯派对背景', '户外庆祝餐桌'],
    },
    note: '重点展示透明气泡球灯罩质感和夜晚光影层次。',
    updatedAt: '2026-06-02',
  },
  {
    id: 'product-solar-mushroom-path',
    name: '太阳能蘑菇引路灯',
    category: '太阳能引路灯',
    englishName: 'Solar Mushroom Pathway Lights',
    skus: [
      {
        id: 'sku-mushroom-4pcs',
        name: '4PCS',
        supplyPrice: 18.5,
        length: '4支装',
        ledCount: '4灯头',
        size: '4支蘑菇插地灯，单灯约30cm',
        note: '适合小路径和门廊通道。',
      },
      {
        id: 'sku-mushroom-6pcs',
        name: '6PCS',
        supplyPrice: 24.8,
        length: '6支装',
        ledCount: '6灯头',
        size: '6支蘑菇插地灯，单灯约30cm',
        note: '适合庭院路径主推规格。',
      },
      {
        id: 'sku-mushroom-8pcs',
        name: '8PCS',
        supplyPrice: 31.6,
        length: '8支装',
        ledCount: '8灯头',
        size: '8支蘑菇插地灯，单灯约30cm',
        note: '适合大草坪和花园边缘。',
      },
    ],
    specs: ['4PCS', '6PCS', '8PCS'],
    dimensions: ['插地高度', '蘑菇灯头尺寸', '灯杆长度', '太阳能面板参数展示区'],
    sellingPoints: ['IP44', '太阳能充电', '自动感光', '蘑菇造型'],
    costPrice: 22.6,
    defaultTitleTemplate:
      '{count} Solar Mushroom Pathway Lights, IP44 Garden Stake Lights for Lawn Yard Walkway',
    defaultSceneLibrary: ['花园路径', '草坪边缘', '庭院入口', '门廊通道'],
    colorScenes: {
      warm: ['庭院小径', '木门入口', '乡村花园边缘'],
      white: ['极简花园步道', '石板露台边缘', '现代庭院入口'],
      colorful: ['童话花园', '节日草坪装饰', '儿童花园角落'],
    },
    note: '尺寸图按上半真实场景图，下半规格/尺寸/太阳能面板参数制作。',
    updatedAt: '2026-06-02',
  },
];

export const sampleProducts = defaultProducts;

export const operationRules = [
  ...globalPromptBanRules,
  '同一产品不同颜色必须使用不同场景',
  '标题数字放最前面',
  '禁止出现 waterproof',
  '统一使用 IP44',
  '尺寸图采用：上半真实场景图，下半规格/尺寸/太阳能面板参数',
  'TEMU欧洲站优先庭院、阳台、花园、门廊场景',
  '禁止出现酒、酒杯、水印、清晰人脸',
];

export const sampleTitles = [
  '20LED Solar Kerosene Lantern String Lights, IP44 Outdoor Garden Patio Balcony Porch Decor',
  '20LED Solar Soccer Ball String Lights, IP44 Football Theme Lights for Garden Balcony Porch',
];

export const samplePrompts = [
  {
    id: 'prompt-sample-001',
    productId: 'product-solar-kerosene-string',
    productName: '太阳能煤油灯串',
    colorLabel: '暖色',
    imageTypeLabel: '场景图',
    platformLabel: 'TEMU欧洲站',
    sceneZh: '木质凉亭、乡村庭院、石墙花园',
    chinese:
      'TEMU欧洲站场景图提示词：太阳能煤油灯串，颜色：暖色，指定场景：木质凉亭、乡村庭院、石墙花园，统一使用 IP44，禁止出现酒、酒杯、水印、清晰人脸。',
    english:
      'TEMU Europe lifestyle scene image prompt: Solar Kerosene Lantern String Lights, warm white light version, scene category: wooden gazebo, country courtyard, stone wall garden, use IP44 only, no alcohol, no wine glass, no watermark, no clear human face.',
    createdAt: '2026/6/2 09:00:00',
  },
];
