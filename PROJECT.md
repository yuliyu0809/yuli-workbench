# Yuliの工作台 项目架构文档

## 当前版本号

当前业务版本：V1.5

当前工程版本：`1.0.0`

项目类型：本地 React + Vite 单页应用，无服务器、无数据库，数据保存在浏览器 LocalStorage。

## 技术架构

- 前端框架：React
- 构建工具：Vite
- 样式方案：TailwindCSS
- 图标库：lucide-react
- 数据存储：LocalStorage
- 运行方式：`npm run dev`
- 构建方式：`npm run build`

## 模块说明

### 首页

用于查看当前工作台概览，包括产品数量、提示词数量、利润记录、广告记录等核心数据入口。

### 标题工坊

用于生成 TEMU 商品标题。当前保留基础标题生成能力，后续可改为读取产品配置中心的标题模板和 SKU 信息。

### 提示词工坊

用于生成 TEMU 灯饰图片提示词。当前已从固定场景库升级为 Prompt Assets Library 模式：

- 从产品配置中心读取产品和 SKU
- 从提示词素材库读取素材池
- 随机抽取场景词、构图词、镜头词、灯光词、氛围词
- 动态生成中文提示词和英文提示词
- 支持保存历史记录

### 提示词素材库

用于维护提示词素材池。数据结构为：

```text
产品
└─ 颜色
   └─ 图片类型
      └─ 素材分类
```

素材分类包括：

- 场景词
- 构图词
- 镜头词
- 灯光词
- 氛围词
- 节日词
- 欧洲元素词

### 利润中心

用于集中处理多种利润测算场景，包括 ROAS 利润、活动价、折扣反推、组合优惠、保本价等复合计算。

### TEMU广告助手

用于 TEMU 广告和活动价判断，包含：

1. 新品ROAS档位推荐
2. 广告利润模拟器
3. TEMU活动价计算器
4. 可打折扣反推器

支持：

- 产品和 SKU 联动
- 自动带出供货价
- 保存最近 10 条广告计算记录
- 一键复制计算结果

### 利润计算器

旧版轻量利润计算工具，当前支持产品 + SKU 联动、ROAS、折扣、供货价自动带出。

### 我的规则中心

用于展示 TEMU 灯饰运营规则，例如：

- 禁止出现 waterproof
- 统一使用 IP44
- 禁止酒、酒杯、水印、清晰人脸
- TEMU欧洲站优先庭院、阳台、花园、门廊场景

### 产品配置中心

项目核心数据源。当前结构为：

```text
产品
└─ 多个规格 SKU
```

支持新增、编辑、删除产品和 SKU。

### 备份中心

用于自动保存本地数据快照，最多保留最近 10 份，并支持下载 JSON 备份文件。

## 页面说明

| 页面文件 | 页面名称 | 说明 |
|---|---|---|
| `Dashboard.jsx` | 首页 | 展示工作台概览和快捷入口 |
| `TitleWorkshop.jsx` | 标题工坊 | 生成 TEMU 商品标题 |
| `PromptWorkshop.jsx` | 提示词工坊 | 基于素材库动态生成中英文提示词 |
| `PromptAssetsLibrary.jsx` | 提示词素材库 | 编辑产品、颜色、图片类型下的素材池 |
| `ProfitCenter.jsx` | 利润中心 | 复合利润和折扣测算中心 |
| `TemuAdsAssistant.jsx` | TEMU广告助手 | ROAS、广告利润、活动价、折扣反推 |
| `ProfitCalculator.jsx` | 利润计算器 | 轻量 SKU 利润测算 |
| `RulesCenter.jsx` | 我的规则中心 | 展示运营规则 |
| `ProductCenter.jsx` | 产品配置中心 | 管理产品和 SKU |
| `BackupCenter.jsx` | 备份中心 | 管理本地自动备份 |

## 数据结构说明

### 产品 Product

```js
{
  id: "product-solar-kerosene-string",
  name: "太阳能煤油灯串",
  category: "太阳能灯串",
  englishName: "Solar Kerosene Lantern String Lights",
  skus: [Sku],
  specs: ["5m20LED", "6.5m30LED"],
  dimensions: ["5m / 20LED", "6.5m / 30LED"],
  sellingPoints: ["IP44", "太阳能充电", "8种模式"],
  costPrice: 18.8,
  defaultTitleTemplate: "{count} Solar Kerosene Lantern String Lights...",
  defaultSceneLibrary: ["庭院", "阳台", "花园", "门廊"],
  colorScenes: {
    warm: ["木质凉亭"],
    white: ["现代露台"],
    colorful: ["花园派对"]
  },
  note: "备注",
  updatedAt: "2026-06-02"
}
```

说明：`specs`、`dimensions`、`costPrice`、`colorScenes` 是兼容旧版本保留字段。新功能优先使用 `skus` 和提示词素材库。

### SKU

```js
{
  id: "sku-kerosene-5m20led",
  name: "5m20LED",
  supplyPrice: 13.5,
  length: "5m",
  ledCount: "20LED",
  size: "5m灯串，20颗LED，煤油灯造型灯罩",
  note: "基础款"
}
```

### 提示词素材 Prompt Assets

```js
{
  productId: "product-solar-kerosene-string",
  colors: {
    warm: {
      scene: {
        scene: ["石墙围合的南法庭院"],
        composition: ["中景商业摄影"],
        lens: ["50mm"],
        lighting: ["暖金色发光"],
        mood: ["乡村庭院氛围"],
        holiday: ["夏日晚餐布置"],
        europe: ["南法石墙"]
      }
    }
  }
}
```

实际层级为：

```text
productId
└─ colors
   └─ warm / white / colorful
      └─ main / scene / grid / size / sku
         └─ scene / composition / lens / lighting / mood / holiday / europe
```

### 提示词历史 Prompt Record

```js
{
  id: "prompt-...",
  productId: "product-solar-kerosene-string",
  skuId: "sku-kerosene-5m20led",
  productName: "太阳能煤油灯串",
  skuName: "5m20LED",
  colorLabel: "暖色",
  imageTypeLabel: "场景图",
  platformLabel: "TEMU欧洲站",
  pickedAssets: {},
  chinese: "...",
  english: "...",
  createdAt: "2026/6/2 10:00:00"
}
```

### 广告记录 Ad Record

```js
{
  id: "ad-...",
  productName: "太阳能煤油灯串",
  skuName: "5m20LED",
  supplyPrice: 13.5,
  activityPrice: 20.79,
  roas: 4.68,
  finalProfit: 2.85,
  recommendedTier: "激进测款档",
  createdAt: "2026/6/2 10:00:00"
}
```

### 利润中心记录 Profit Center Record

```js
{
  id: "profit-center-...",
  productName: "太阳能煤油灯串",
  skuName: "5m20LED",
  type: "activity / roas / discount / bundle / breakeven",
  input: {},
  result: {},
  createdAt: "2026/6/2 10:00:00"
}
```

### 自动备份 Backup

```js
{
  id: "backup-...",
  reason: "auto",
  createdAt: "2026/6/2 10:00:00",
  version: "1.2",
  data: {
    products: [],
    titles: [],
    prompts: [],
    promptAssets: [],
    profitRecords: [],
    adRecords: [],
    profitCenterRecords: [],
    rules: []
  }
}
```

## LocalStorage结构说明

| Key | 用途 |
|---|---|
| `yuli.products.v1.3` | 产品配置中心数据，包含产品和 SKU |
| `yuli.titles.v1.1` | 标题工坊保存的标题草稿 |
| `yuli.prompts.v1.2` | 提示词工坊保存的提示词历史 |
| `yuli.promptAssets.v1` | 提示词素材库 |
| `yuli.profitRecords.v1.1` | 旧版利润计算器记录 |
| `yuli.profitCenterRecords.v1` | 利润中心记录 |
| `yuli.adRecords.v1` | TEMU广告助手历史记录 |
| `yuli.rules.v1.1` | 我的规则中心规则 |
| `yuli.backups.v1` | 自动备份快照 |

## 核心工具文件

| 文件 | 说明 |
|---|---|
| `src/utils/productSchema.js` | 产品结构规范化，兼容旧数据 |
| `src/utils/promptAssetSchema.js` | 提示词素材库结构规范化 |
| `src/utils/promptGenerator.js` | 提示词动态生成 |
| `src/utils/adCalculator.js` | 广告、活动价、折扣反推计算 |
| `src/utils/profitCalculator.js` | 利润计算 |
| `src/utils/backupManager.js` | 备份生成与下载 |
| `src/utils/storageKeys.js` | LocalStorage key 集中管理 |

## 后续开发路线图

### V1.6 数据清理与一致性

- 统一修复历史文件中出现的乱码显示。
- 将旧版 `colorScenes` 彻底迁移到 `promptAssets`。
- 给产品、SKU、素材、广告记录加入导入/导出功能。

### V1.7 标题工坊升级

- 标题工坊改为读取产品配置中心。
- 支持按 SKU、场景、卖点生成标题。
- 加入标题禁词检查和字符长度提示。

### V1.8 素材库增强

- 支持批量复制素材。
- 支持素材标签。
- 支持按图片类型批量复制素材池。
- 支持随机生成多组提示词候选。

### V1.9 广告助手增强

- 支持广告预算、点击成本、转化率反推。
- 支持保存不同投放方案。
- 支持广告记录图表化。

### V2.0 本地数据管理

- 增加完整 JSON 导入恢复。
- 增加 Excel/CSV 导出。
- 增加一键备份全部数据。
- 增加数据版本迁移工具。
