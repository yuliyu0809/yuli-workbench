# Yuliの工作台 项目结构

```text
Yuliの工作台/
├─ index.html
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ README.md
├─ PROJECT_STRUCTURE.md
├─ PROJECT_MANUAL.md
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ index.css
│  ├─ components/
│  │  ├─ AppLayout.jsx
│  │  ├─ Button.jsx
│  │  ├─ Field.jsx
│  │  ├─ GlassPanel.jsx
│  │  ├─ MetricCard.jsx
│  │  ├─ PageHeader.jsx
│  │  └─ Sidebar.jsx
│  ├─ data/
│  │  └─ sampleData.js
│  ├─ hooks/
│  │  ├─ useAutoBackup.js
│  │  └─ useLocalStorage.js
│  ├─ pages/
│  │  ├─ BackupCenter.jsx
│  │  ├─ Dashboard.jsx
│  │  ├─ ProfitCalculator.jsx
│  │  ├─ ProductCenter.jsx
│  │  ├─ PromptWorkshop.jsx
│  │  ├─ RulesCenter.jsx
│  │  └─ TitleWorkshop.jsx
│  └─ utils/
│     ├─ backupManager.js
│     ├─ profitCalculator.js
│     ├─ promptGenerator.js
│     ├─ storageKeys.js
│     └─ titleGenerator.js
├─ dist/
└─ node_modules/
```

## 目录说明

- `src/pages`：每个功能页面独立维护。
- `src/components`：通用布局、按钮、表单、毛玻璃面板等 UI 组件。
- `src/utils`：标题生成、提示词生成、利润计算、备份管理和存储 key。
- `src/hooks`：LocalStorage 和自动备份相关 Hook。
- `src/data`：灯饰产品样例、规则和默认历史数据。
- `dist`：生产构建输出，不进入 Git 仓库。
- `node_modules`：依赖目录，不进入 Git 仓库。
