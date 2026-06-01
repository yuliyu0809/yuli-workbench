import { useState } from 'react';
import { AppLayout } from './components/AppLayout.jsx';
import { operationRules, sampleProducts, samplePrompts, sampleTitles } from './data/sampleData.js';
import { useAutoBackup } from './hooks/useAutoBackup.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { BackupCenter } from './pages/BackupCenter.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { ProfitCalculator } from './pages/ProfitCalculator.jsx';
import { PromptWorkshop } from './pages/PromptWorkshop.jsx';
import { RulesCenter } from './pages/RulesCenter.jsx';
import { TitleWorkshop } from './pages/TitleWorkshop.jsx';
import { storageKeys } from './utils/storageKeys.js';

const sampleProfitRecords = [
  {
    id: 'profit-sample-001',
    productName: '太阳能煤油灯串',
    price: 49.9,
    profit: 18.21,
    margin: 36.5,
    createdAt: '2026/6/1',
  },
];

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [products] = useLocalStorage(storageKeys.products, sampleProducts);
  const [titles, setTitles] = useLocalStorage(storageKeys.titles, sampleTitles);
  const [prompts, setPrompts] = useLocalStorage(storageKeys.prompts, samplePrompts);
  const [profitRecords, setProfitRecords] = useLocalStorage(storageKeys.profitRecords, sampleProfitRecords);
  const [rules] = useLocalStorage(storageKeys.rules, operationRules);
  const backupData = {
    products,
    titles,
    prompts,
    profitRecords,
    rules,
  };
  const { backups, createBackup } = useAutoBackup(backupData);

  const commonProps = {
    products,
    titles,
    prompts,
    profitRecords,
    rules,
    backups,
    setTitles,
    setPrompts,
    setProfitRecords,
  };

  const pages = {
    dashboard: <Dashboard {...commonProps} onNavigate={setActivePage} />,
    titles: <TitleWorkshop {...commonProps} />,
    prompts: <PromptWorkshop {...commonProps} />,
    profit: <ProfitCalculator {...commonProps} />,
    rules: <RulesCenter {...commonProps} />,
    backups: <BackupCenter {...commonProps} onCreateBackup={createBackup} />,
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {pages[activePage] || pages.dashboard}
    </AppLayout>
  );
}
