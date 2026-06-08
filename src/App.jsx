import { useMemo, useState } from 'react';
import { AppLayout } from './components/AppLayout.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useProductLibraryCloudSync } from './hooks/useProductLibraryCloudSync.js';
import { useStoreArchiveCloudSync } from './hooks/useStoreArchiveCloudSync.js';
import { ProductInfoLibrary } from './pages/ProductInfoLibrary.jsx';
import { ProfitCalculator } from './pages/ProfitCalculator.jsx';
import { StoreProductArchive } from './pages/StoreProductArchive.jsx';
import { TemuAdsAssistant } from './pages/TemuAdsAssistant.jsx';
import { getProductLibraryProducts } from './utils/productLibrary.js';
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

const defaultStoreProductArchive = {
  stores: [
    { id: 'store-1', name: 'DS', products: [] },
    { id: 'store-2', name: 'HX', products: [] },
    { id: 'store-3', name: 'AG', products: [] },
  ],
};

const defaultProductLibrary = { products: [] };

export default function App() {
  const [activePage, setActivePage] = useState('storeArchive');
  const [profitRecords, setProfitRecords] = useLocalStorage(storageKeys.profitRecords, sampleProfitRecords);
  const [adRecords, setAdRecords] = useLocalStorage(storageKeys.adRecords, []);
  const [storeProductArchive, setStoreProductArchive] = useLocalStorage(storageKeys.storeProductArchive, defaultStoreProductArchive);
  const [productLibrary, setProductLibrary] = useLocalStorage(storageKeys.productLibrary, defaultProductLibrary);
  const storeArchiveSync = useStoreArchiveCloudSync(storeProductArchive, setStoreProductArchive);
  const productLibrarySync = useProductLibraryCloudSync(productLibrary, setProductLibrary);
  const normalizedProducts = useMemo(() => getProductLibraryProducts(productLibrary), [productLibrary]);

  const commonProps = {
    products: normalizedProducts,
    profitRecords,
    adRecords,
    storeProductArchive,
    productLibrary,
    storeArchiveSync,
    productLibrarySync,
    setProfitRecords,
    setAdRecords,
    setStoreProductArchive,
    setProductLibrary,
  };

  const pages = {
    storeArchive: <StoreProductArchive {...commonProps} />,
    productLibrary: <ProductInfoLibrary {...commonProps} />,
    profit: <ProfitCalculator {...commonProps} />,
    ads: <TemuAdsAssistant {...commonProps} />,
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {pages[activePage] || pages.storeArchive}
    </AppLayout>
  );
}