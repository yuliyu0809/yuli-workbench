import { useMemo, useState } from 'react';
import { AppLayout } from './components/AppLayout.jsx';
import { defaultPromptAssets } from './data/defaultPromptAssets.js';
import { operationRules, sampleProducts, samplePrompts, sampleTitles } from './data/sampleData.js';
import { useAutoBackup } from './hooks/useAutoBackup.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { BackupCenter } from './pages/BackupCenter.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { ImagePromptAssistant } from './pages/ImagePromptAssistant.jsx';
import { ProfitCalculator } from './pages/ProfitCalculator.jsx';
import { ProfitCenter } from './pages/ProfitCenter.jsx';
import { ProductCenter } from './pages/ProductCenter.jsx';
import { PromptAssetsLibrary } from './pages/PromptAssetsLibrary.jsx';
import { PromptWorkshop } from './pages/PromptWorkshop.jsx';
import { RulesCenter } from './pages/RulesCenter.jsx';
import { TemuAdsAssistant } from './pages/TemuAdsAssistant.jsx';
import { TitleWorkshop } from './pages/TitleWorkshop.jsx';
import { normalizePromptAssets } from './utils/promptAssetSchema.js';
import { normalizeProducts } from './utils/productSchema.js';
import { storageKeys } from './utils/storageKeys.js';

const sampleProfitRecords = [
  {
    id: 'profit-sample-001',
    productName: '太阳能煤油灯串',
    skuName: '5m20LED',
    price: 49.9,
    roas: 3,
    discount: 0,
    supplyPrice: 13.5,
    profit: 19.77,
    margin: 39.6,
    createdAt: '2026/6/2',
  },
];

const sampleAdRecords = [];
const sampleProfitCenterRecords = [];
const sampleImageAnalyses = [];

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useLocalStorage(storageKeys.products, sampleProducts);
  const normalizedProducts = useMemo(() => normalizeProducts(products), [products]);
  const saveProducts = (nextProducts) => setProducts(normalizeProducts(nextProducts));
  const [titles, setTitles] = useLocalStorage(storageKeys.titles, sampleTitles);
  const [prompts, setPrompts] = useLocalStorage(storageKeys.prompts, samplePrompts);
  const [promptAssets, setPromptAssets] = useLocalStorage(storageKeys.promptAssets, defaultPromptAssets);
  const [profitRecords, setProfitRecords] = useLocalStorage(storageKeys.profitRecords, sampleProfitRecords);
  const [adRecords, setAdRecords] = useLocalStorage(storageKeys.adRecords, sampleAdRecords);
  const [profitCenterRecords, setProfitCenterRecords] = useLocalStorage(storageKeys.profitCenterRecords, sampleProfitCenterRecords);
  const [imageAnalyses, setImageAnalyses] = useLocalStorage(storageKeys.imageAnalyses, sampleImageAnalyses);
  const [rules] = useLocalStorage(storageKeys.rules, operationRules);

  const normalizedPromptAssets = useMemo(
    () => normalizePromptAssets(promptAssets, normalizedProducts),
    [normalizedProducts, promptAssets],
  );

  const backupData = {
    products: normalizedProducts,
    titles,
    prompts,
    promptAssets: normalizedPromptAssets,
    profitRecords,
    adRecords,
    profitCenterRecords,
    imageAnalyses,
    rules,
  };
  const { backups, createBackup } = useAutoBackup(backupData);

  const commonProps = {
    products: normalizedProducts,
    titles,
    prompts,
    promptAssets: normalizedPromptAssets,
    profitRecords,
    adRecords,
    profitCenterRecords,
    imageAnalyses,
    rules,
    backups,
    setProducts: saveProducts,
    setTitles,
    setPrompts,
    setPromptAssets,
    setProfitRecords,
    setAdRecords,
    setProfitCenterRecords,
    setImageAnalyses,
  };

  const pages = {
    dashboard: <Dashboard {...commonProps} onNavigate={setActivePage} />,
    titles: <TitleWorkshop {...commonProps} />,
    prompts: <PromptWorkshop {...commonProps} onNavigate={setActivePage} />,
    imagePrompts: <ImagePromptAssistant {...commonProps} onNavigate={setActivePage} />,
    promptAssets: <PromptAssetsLibrary {...commonProps} />,
    profitCenter: <ProfitCenter {...commonProps} />,
    ads: <TemuAdsAssistant {...commonProps} />,
    profit: <ProfitCalculator {...commonProps} />,
    rules: <RulesCenter {...commonProps} />,
    productsCenter: <ProductCenter {...commonProps} />,
    backups: <BackupCenter {...commonProps} onCreateBackup={createBackup} />,
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {pages[activePage] || pages.dashboard}
    </AppLayout>
  );
}
