import { Calculator, Copy, Edit3, Image as ImageIcon, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input, Select, Textarea } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { CloudSyncPanel } from '../components/sync/CloudSyncPanel.jsx';
import { discountInputText, formatDiscount, parseDiscountInput } from '../utils/discountUtils.js';
import { getProductLibrary } from '../utils/productLibrary.js';

const defaultStores = [
  { id: 'store-1', name: 'DS', products: [] },
  { id: 'store-2', name: 'HX', products: [] },
  { id: 'store-3', name: 'AG', products: [] },
];

const legacyStoreNames = { '店铺1': 'DS', '店铺名1': 'DS', '店铺2': 'HX', '店铺名2': 'HX', '店铺3': 'AG', '店铺名3': 'AG' };
const emptySku = { sku: '', supplyPrice: '', originalPrice: '', discountInput: '', activityPrice: '', roas: '', includeInActivity: true };
const emptyForm = { storeId: 'store-1', imageDataUrl: '', productName: '', skc: '', isActive: true, activityType: '', productUrl: '', note: '', skus: [{ ...emptySku }] };
const backupKey = 'yuli.storeProductArchive.backups.v1';
const maxImageBytes = 300 * 1024;
const maxImageDataUrlLength = 450 * 1024;
const activityTiers = [
  { id: 'all', label: '全部', rate: 0 },
  { id: '8', label: '8折', rate: 0.8 },
  { id: '85', label: '8.5折', rate: 0.85 },
  { id: '9', label: '9折', rate: 0.9 },
];
const defaultActivityTarget = { targetProfit: '3', reservedAdCost: '3' };

function numberValue(value) {
  const parsed = Number(String(value ?? '').replace(/[¥￥,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
function money(value) { return numberValue(value).toFixed(2); }
function percent(value) { return `${numberValue(value).toFixed(1)}%`; }
function skuMetrics(row) {
  const supplyPrice = numberValue(row.supplyPrice);
  const originalPrice = numberValue(row.originalPrice);
  const enteredDiscount = parseDiscountInput(row.discountInput ?? row.discount);
  const legacyActivityPrice = numberValue(row.activityPrice || row.price);
  const legacyDiscount = originalPrice > 0 && legacyActivityPrice > 0 ? legacyActivityPrice / originalPrice : 0;
  const discount = enteredDiscount || legacyDiscount;
  const activityPrice = originalPrice > 0 && discount > 0 ? originalPrice * discount : legacyActivityPrice;
  const roas = numberValue(row.roas);
  const adCost = roas > 0 ? activityPrice / roas : 0;
  const profit = activityPrice - supplyPrice - adCost;
  const margin = activityPrice > 0 ? (profit / activityPrice) * 100 : 0;
  return { supplyPrice, originalPrice, activityPrice, roas, discount, adCost, profit, margin };
}
function profitTone(profit) {
  if (profit < 0) return 'text-[#b83d3d]';
  if (profit <= 3) return 'text-[#9b6a00]';
  if (profit <= 6) return 'text-[#2e7c47]';
  return 'text-[#1f6736]';
}
function activityTierLabel(tierId) {
  return activityTiers.find((tier) => tier.id === tierId)?.label || '不可报活动';
}
function activityTierForSku(row, targetProfit, reservedAdCost) {
  if (row.includeInActivity === false) return { minimumPrice: 0, recommendedTier: 'inactive', profits: { 8: 0, 85: 0, 9: 0 } };
  const supplyPrice = numberValue(row.supplyPrice);
  const originalPrice = numberValue(row.originalPrice);
  const target = numberValue(targetProfit);
  const adReserve = numberValue(reservedAdCost);
  const minimumPrice = supplyPrice + target + adReserve;
  const profits = {
    8: originalPrice * 0.8 - supplyPrice - adReserve,
    85: originalPrice * 0.85 - supplyPrice - adReserve,
    9: originalPrice * 0.9 - supplyPrice - adReserve,
  };
  let recommendedTier = 'none';
  if (originalPrice * 0.8 >= minimumPrice) recommendedTier = '8';
  else if (originalPrice * 0.85 >= minimumPrice) recommendedTier = '85';
  else if (originalPrice * 0.9 >= minimumPrice) recommendedTier = '9';
  return { minimumPrice, recommendedTier, profits };
}
function activeSkuRows(product) {
  return product.skus.filter((row) => row.includeInActivity !== false);
}
function productActivityTier(product, targetProfit, reservedAdCost) {
  const rows = activeSkuRows(product);
  if (!rows.length) return 'none';
  const tierRank = { 8: 1, 85: 2, 9: 3, none: 4, inactive: 4 };
  return rows.reduce((currentTier, row) => {
    const rowTier = activityTierForSku(row, targetProfit, reservedAdCost).recommendedTier;
    return tierRank[rowTier] > tierRank[currentTier] ? rowTier : currentTier;
  }, '8');
}
function productMatchesTier(product, tierId, targetProfit, reservedAdCost) {
  if (tierId === 'all') return true;
  return productActivityTier(product, targetProfit, reservedAdCost) === tierId;
}
function normalizeSku(row) {
  const originalPrice = numberValue(row.originalPrice);
  const metrics = skuMetrics(row);
  return {
    id: row.id || `sku-row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sku: String(row.sku || row.skuName || '').trim(),
    supplyPrice: numberValue(row.supplyPrice),
    originalPrice,
    discount: metrics.discount,
    activityPrice: metrics.activityPrice,
    roas: numberValue(row.roas),
    includeInActivity: row.includeInActivity !== false,
  };
}
function normalizeProduct(product) {
  const legacySku = product.sku || product.skuName ? [product] : [];
  const rows = Array.isArray(product.skus) ? product.skus : legacySku;
  return {
    id: product.id || `store-product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    imageDataUrl: safeImageDataUrl(product.imageDataUrl),
    productName: product.productName || '',
    skc: product.skc || '',
    isActive: Boolean(product.isActive),
    activityType: product.activityType || '',
    productUrl: product.productUrl || product.url || '',
    note: product.note || '',
    updatedAt: product.updatedAt || product.createdAt || '',
    skus: rows.map(normalizeSku).filter((row) => row.sku),
  };
}
function normalizeArchive(archive) {
  const source = archive && typeof archive === 'object' ? archive : {};
  const topLevelProducts = Array.isArray(source.products) ? source.products : [];
  const sourceStores = Array.isArray(source.stores) && source.stores.length ? source.stores : defaultStores;
  const stores = defaultStores.map((defaultStore, index) => {
    const store = sourceStores[index] || defaultStore;
    const ownProducts = Array.isArray(store.products) ? store.products : [];
    const migratedProducts = topLevelProducts.filter((product) => product.storeId === store.id || product.storeName === store.name);
    return {
      id: store.id || defaultStore.id,
      name: legacyStoreNames[store.name] || store.name || defaultStore.name,
      products: [...ownProducts, ...migratedProducts].map(normalizeProduct).filter((product) => product.skus.length),
    };
  });
  return { stores };
}
function safeImageDataUrl(value) {
  const text = String(value || '');
  if (!text.startsWith('data:image/')) return '';
  if (text.length > maxImageDataUrlLength) return '';
  return text;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败'));
    };
    image.src = url;
  });
}

async function compressImage(file) {
  const image = await loadImageFromFile(file);
  const scale = Math.min(600 / image.width, 600 / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('浏览器不支持图片压缩');
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.6));
  const finalBlob = blob || await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.6));
  if (!finalBlob) throw new Error('图片压缩失败');
  if (finalBlob.size > maxImageBytes) {
    throw new Error('图片压缩后仍超过300KB，请换一张更小的图片。');
  }
  return blobToDataUrl(finalBlob);
}

function readBackups() {
  try {
    const raw = window.localStorage.getItem(backupKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeBackup(snapshot) {
  try {
    const backups = readBackups();
    const next = [{ id: `backup-${Date.now()}`, createdAt: new Date().toLocaleString('zh-CN', { hour12: false }), data: snapshot }, ...backups].slice(0, 5);
    window.localStorage.setItem(backupKey, JSON.stringify(next));
  } catch (error) {
    console.error('店铺档案备份失败', error);
  }
}

function latestBackup() {
  return readBackups()[0]?.data || null;
}

function SafeImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  const safeSrc = safeImageDataUrl(src);
  if (!safeSrc || failed) return <ImageIcon size={24} />;
  return <img src={safeSrc} alt={alt} className={className} onError={() => setFailed(true)} />;
}
function suggestActivity(row, targetProfit, targetRoas) {
  const metrics = skuMetrics(row);
  const roas = numberValue(targetRoas || metrics.roas);
  const profit = numberValue(targetProfit);
  const denominator = roas > 1 ? 1 - 1 / roas : 0;
  const suggestedPrice = denominator > 0 ? (metrics.supplyPrice + profit) / denominator : 0;
  const suggestedDiscount = metrics.originalPrice > 0 ? suggestedPrice / metrics.originalPrice : 0;
  return { suggestedPrice, suggestedDiscount, roas, profit };
}
function Modal({ title, children, onClose, width = 'max-w-4xl' }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2529]/60 p-4"><div className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-[1.75rem] border border-white/80 bg-[#fff9fb] p-5 shadow-glass`}><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-ink">{title}</h2><button type="button" onClick={onClose} className="rounded-full bg-white/85 p-2 text-ink hover:bg-white"><X size={18} /></button></div>{children}</div></div>;
}
function MetricCell({ label, value, className = '' }) {
  return <div className="rounded-2xl bg-white/70 px-3 py-2"><div className="text-[11px] text-muted">{label}</div><div className={`mt-0.5 text-sm font-semibold text-ink ${className}`}>{value || '-'}</div></div>;
}
function buildCopyText(product, storeName) {
  return [`店铺：${storeName}`, `商品名称：${product.productName}`, `SKC：${product.skc}`, ...product.skus.map((row) => {
    const m = skuMetrics(row);
    return `${row.sku} / 供货价¥${money(m.supplyPrice)} / 原售价¥${money(m.originalPrice)} / 折扣${formatDiscount(m.discount)} / 活动价¥${money(m.activityPrice)} / 利润¥${money(m.profit)}`;
  })].join('\n');
}

export function StoreProductArchive({ storeProductArchive, setStoreProductArchive, storeArchiveSync, productLibrary }) {
  const archive = normalizeArchive(storeProductArchive);
  const library = getProductLibrary(productLibrary || { products: [] });
  const [activeStoreId, setActiveStoreId] = useState(archive.stores[0]?.id || 'store-1');
  const [searchText, setSearchText] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [calcTarget, setCalcTarget] = useState(null);
  const [calcInput, setCalcInput] = useState({ discountInput: '', targetProfit: '3', targetRoas: '3' });
  const [tierFilter, setTierFilter] = useState('all');
  const [activityTarget, setActivityTarget] = useState(defaultActivityTarget);
  const [previewImage, setPreviewImage] = useState(null);

  const activeStore = archive.stores.find((store) => store.id === activeStoreId) || archive.stores[0];
  const selectedLibraryProduct = library.products.find((product) => product.productName === form.productName);
  const productNames = library.products.map((product) => product.productName);
  const updateArchive = (nextArchive) => {
    const previous = normalizeArchive(storeProductArchive);
    const next = normalizeArchive(nextArchive);
    try {
      writeBackup(previous);
      setStoreProductArchive(next);
    } catch (error) {
      console.error('保存店铺档案失败，已恢复旧数据', error);
      setStoreProductArchive(previous);
      window.alert('保存失败，已恢复旧数据。');
    }
  };
  const updateStoreProducts = (storeId, products) => updateArchive({ stores: archive.stores.map((store) => store.id === storeId ? { ...store, products } : store) });

  const openNewForm = () => { setEditingId(null); setForm({ ...emptyForm, storeId: activeStore.id }); setShowForm(true); };
  const openEditForm = (product) => { setEditingId(product.id); setForm({ ...emptyForm, ...product, storeId: activeStore.id, skus: product.skus.map((row) => ({ ...row, includeInActivity: row.includeInActivity !== false, discountInput: discountInputText(skuMetrics(row).discount) })) }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm, storeId: activeStore.id }); };

  const applyProduct = (productName) => {
    const product = library.products.find((item) => item.productName === productName);
    setForm((current) => ({
      ...current,
      productName,
      skus: product?.skus?.length ? [{ ...emptySku, sku: product.skus[0].sku, supplyPrice: product.skus[0].supplyPrice, includeInActivity: true }] : current.skus,
    }));
  };
  const updateSkuRow = (index, patch) => {
    setForm((current) => ({ ...current, skus: current.skus.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row) }));
  };
  const selectSku = (index, skuValue) => {
    const matched = selectedLibraryProduct?.skus.find((item) => item.sku === skuValue);
    updateSkuRow(index, { sku: skuValue, supplyPrice: matched ? matched.supplyPrice : form.skus[index].supplyPrice });
  };
  const addSkuRow = () => setForm((current) => ({ ...current, skus: [...current.skus, { ...emptySku }] }));
  const removeSkuRow = (index) => setForm((current) => ({ ...current, skus: current.skus.filter((_, rowIndex) => rowIndex !== index) }));

  const saveProduct = () => {
    const targetStoreId = form.storeId || activeStore.id;
    const targetStore = archive.stores.find((store) => store.id === targetStoreId) || activeStore;
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const product = normalizeProduct({ ...form, id: editingId || `store-product-${Date.now()}`, updatedAt: now });
    if (!product.skus.length) return;
    const nextStores = archive.stores.map((store) => {
      const productsWithoutEditing = store.products.filter((item) => item.id !== editingId);
      if (store.id !== targetStore.id) return { ...store, products: productsWithoutEditing };
      return { ...store, products: editingId ? [product, ...productsWithoutEditing] : [product, ...store.products] };
    });
    updateArchive({ stores: nextStores });
    setActiveStoreId(targetStore.id);
    closeForm();
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imageDataUrl = await compressImage(file);
      setForm((current) => ({ ...current, imageDataUrl }));
    } catch (error) {
      console.error('图片处理失败', error);
      window.alert(error?.message || '图片处理失败，请换一张图片。');
    } finally {
      event.target.value = '';
    }
  };

  const filteredProducts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return activeStore.products
      .filter((product) => productMatchesTier(product, tierFilter, activityTarget.targetProfit, activityTarget.reservedAdCost))
      .filter((product) => {
        if (!keyword) return true;
        return [product.productName, product.skc, ...product.skus.map((row) => row.sku)].some((value) => String(value || '').toLowerCase().includes(keyword));
      });
  }, [activeStore.products, activityTarget.reservedAdCost, activityTarget.targetProfit, searchText, tierFilter]);
  const stats = useMemo(() => {
    const tierCounts = activeStore.products.reduce((counts, product) => {
      const tier = productActivityTier(product, activityTarget.targetProfit, activityTarget.reservedAdCost);
      if (counts[tier] !== undefined) counts[tier] += 1;
      return counts;
    }, { 8: 0, 85: 0, 9: 0, none: 0 });
    return {
      total: activeStore.products.length,
      skuCount: activeStore.products.reduce((sum, product) => sum + product.skus.length, 0),
      active: activeStore.products.filter((product) => product.isActive).length,
      tierCounts,
    };
  }, [activeStore.products, activityTarget.reservedAdCost, activityTarget.targetProfit]);

  return (
    <>
      <PageHeader eyebrow="TEMU运营后台" title="店铺商品价格档案" description="一个 SKC 一张商品卡片，卡片内管理多个 SKU 的供货价、活动价、ROAS 和利润。" />
      <CloudSyncPanel sync={storeArchiveSync} />
      <div className="mt-3 flex justify-end"><Button variant="soft" onClick={() => { const backup = latestBackup(); if (!backup) { window.alert('暂无可恢复备份。'); return; } setStoreProductArchive(normalizeArchive(backup)); window.alert('已恢复最近备份。'); }}>恢复最近备份</Button></div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-4">
        <div className="grid grid-cols-3 gap-3">{archive.stores.map((store) => <button key={store.id} type="button" onClick={() => setActiveStoreId(store.id)} className={`rounded-3xl border px-5 py-4 text-left transition ${store.id === activeStore.id ? 'border-[#f0a1b8] bg-[#fff1f6] shadow-soft' : 'border-white/70 bg-white/60 hover:bg-white/80'}`}><div className="text-3xl font-semibold text-ink">{store.name}</div><div className="mt-1 text-sm text-muted">{store.products.length} 个SKC</div></button>)}</div>
        <GlassPanel className="min-w-[34rem] py-4"><div className="grid grid-cols-6 gap-3 text-center text-sm"><div><div className="text-2xl font-semibold text-ink">{stats.total}</div><div className="text-muted">全部商品</div></div><div><div className="text-2xl font-semibold text-[#9a4b00]">{stats.skuCount}</div><div className="text-muted">SKU</div></div><div><div className="text-2xl font-semibold text-[#237242]">{stats.active}</div><div className="text-muted">活动</div></div><div><div className="text-2xl font-semibold text-[#d8582a]">{stats.tierCounts[8]}</div><div className="text-muted">8折商品</div></div><div><div className="text-2xl font-semibold text-[#c06b00]">{stats.tierCounts[85]}</div><div className="text-muted">8.5折商品</div></div><div><div className="text-2xl font-semibold text-[#8b5f9b]">{stats.tierCounts[9]}</div><div className="text-muted">9折商品</div></div></div></GlassPanel>
      </div>

      <GlassPanel className="mt-4 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm font-semibold text-ink">报活动折扣档位</div><div className="mt-2 flex flex-wrap gap-2">{activityTiers.map((tier) => <button key={tier.id} type="button" onClick={() => setTierFilter(tier.id)} className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${tierFilter === tier.id ? 'border-[#f0a1b8] bg-[#fff1f6] text-[#9a405c] shadow-soft' : 'border-white/70 bg-white/65 text-muted hover:bg-white'}`}>{tier.label}</button>)}</div></div><div className="grid grid-cols-2 gap-3"><Field label="目标利润"><Input type="number" step="0.01" value={activityTarget.targetProfit} onChange={(event) => setActivityTarget((current) => ({ ...current, targetProfit: event.target.value }))} /></Field><Field label="预留广告费"><Input type="number" step="0.01" value={activityTarget.reservedAdCost} onChange={(event) => setActivityTarget((current) => ({ ...current, reservedAdCost: event.target.value }))} /></Field></div></div></GlassPanel>

      <GlassPanel className="mt-4 py-4"><div className="flex items-center gap-3"><div className="flex flex-1 items-center gap-3 rounded-2xl bg-white/75 px-4 py-2"><Search size={18} className="text-muted" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="搜索商品名称 / SKC / SKU" className="h-9 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-[#b9aab0]" /></div><Button onClick={openNewForm} className="bg-[#f27a2d] hover:bg-[#df6720]"><Plus size={16} />新增商品</Button></div></GlassPanel>

      <div className="mt-4 grid gap-3">
        {filteredProducts.map((product) => (
          <article key={product.id} className="rounded-3xl border border-white/70 bg-white/62 p-3 shadow-soft">
            <div className="grid grid-cols-[96px_1fr_112px] gap-3">
              <button type="button" onClick={() => product.imageDataUrl && setPreviewImage(product.imageDataUrl)} className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white/80 text-muted"><SafeImage src={product.imageDataUrl} alt={product.productName} className="h-full w-full object-cover" /></button>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-ink">{product.productName || '未命名商品'}</h2><span className="rounded-full bg-white/75 px-3 py-1 text-xs text-muted">SKC：{product.skc || '-'}</span><span className="rounded-full bg-white/75 px-3 py-1 text-xs text-muted">{product.isActive ? '活动中' : '未活动'}</span><span className="text-xs text-muted">更新：{product.updatedAt || '-'}</span><span className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-[#9a405c]">推荐档：{activityTierLabel(productActivityTier(product, activityTarget.targetProfit, activityTarget.reservedAdCost))}</span></div>
                <div className="mt-3 overflow-hidden rounded-2xl bg-white/55"><div className="grid grid-cols-[minmax(120px,1.15fr)_56px_80px_80px_102px_80px_64px_80px_80px_74px_104px_90px_96px_90px] border-b border-[#e8edf1] bg-white/70 px-3 py-2 text-xs font-medium text-muted"><span>规格SKU</span><span>参与</span><span>供货价</span><span>原售价</span><span>折扣</span><span>活动价</span><span>ROAS</span><span>广告费</span><span>利润</span><span>利润率</span><span>推荐档</span><span>8折利润</span><span>8.5折利润</span><span>9折利润</span></div>{product.skus.map((row) => { const m = skuMetrics(row); const tier = activityTierForSku(row, activityTarget.targetProfit, activityTarget.reservedAdCost); return <div key={row.id} className={`grid grid-cols-[minmax(120px,1.15fr)_56px_80px_80px_102px_80px_64px_80px_80px_74px_104px_90px_96px_90px] border-t border-[#e8edf1] px-3 py-2 text-sm text-ink first:border-t-0 ${row.includeInActivity === false ? 'opacity-45' : ''}`}><span className="font-semibold">{row.sku}</span><span>{row.includeInActivity === false ? '否' : '是'}</span><span>¥{money(m.supplyPrice)}</span><span>¥{money(m.originalPrice)}</span><span>{formatDiscount(m.discount)}</span><span>¥{money(m.activityPrice)}</span><span>{money(m.roas)}</span><span>¥{money(m.adCost)}</span><span className={profitTone(m.profit)}>¥{money(m.profit)}</span><span className={profitTone(m.profit)}>{percent(m.margin)}</span><span className={tier.recommendedTier === 'none' ? 'text-[#b83d3d]' : row.includeInActivity === false ? 'text-muted' : 'font-semibold text-[#9a405c]'}>{activityTierLabel(tier.recommendedTier)}</span><span className={profitTone(tier.profits[8])}>¥{money(tier.profits[8])}</span><span className={profitTone(tier.profits[85])}>¥{money(tier.profits[85])}</span><span className={profitTone(tier.profits[9])}>¥{money(tier.profits[9])}</span></div>; })}</div>
              </div>
              <div className="flex flex-col gap-2"><Button variant="soft" className="min-h-8 px-2 py-1" onClick={() => openEditForm(product)}><Edit3 size={14} />编辑</Button><Button variant="soft" className="min-h-8 px-2 py-1" onClick={() => navigator.clipboard.writeText(buildCopyText(product, activeStore.name))}><Copy size={14} />复制</Button><Button className="min-h-8 bg-[#f27a2d] px-2 py-1 hover:bg-[#df6720]" onClick={() => { setCalcTarget({ product, row: product.skus[0] }); setCalcInput({ discountInput: discountInputText(skuMetrics(product.skus[0]).discount), targetProfit: '3', targetRoas: String(product.skus[0]?.roas || 3) }); }}><Calculator size={14} />报活动</Button><Button variant="ghost" className="min-h-8 px-2 py-1 text-[#a33]" onClick={() => updateStoreProducts(activeStore.id, activeStore.products.filter((item) => item.id !== product.id))}><Trash2 size={14} />删除</Button></div>
            </div>
          </article>
        ))}
        {!filteredProducts.length ? <GlassPanel className="py-10 text-center"><Search className="mx-auto text-muted" size={24} /><h3 className="mt-3 text-lg font-semibold text-ink">当前店铺暂无商品</h3><p className="mt-1 text-sm text-muted">先到产品信息库导入价格表，再新增店铺商品。</p></GlassPanel> : null}
      </div>

      {showForm ? <Modal title={editingId ? '编辑商品' : '新增商品'} onClose={closeForm} width="max-w-5xl"><div className="mt-4 grid grid-cols-4 gap-3"><Field label="店铺"><Select value={form.storeId} onChange={(event) => setForm({ ...form, storeId: event.target.value })}>{archive.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</Select></Field><Field label="产品名称：搜索选择"><Input list="product-library-options" value={form.productName} onChange={(event) => applyProduct(event.target.value)} placeholder="输入产品名称搜索" /><datalist id="product-library-options">{productNames.map((name) => <option key={name} value={name} />)}</datalist></Field><Field label="SKC"><Input value={form.skc} onChange={(event) => setForm({ ...form, skc: event.target.value })} /></Field><Field label="活动状态"><Select value={form.isActive ? 'yes' : 'no'} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'yes' })}><option value="yes">活动中</option><option value="no">未活动</option></Select></Field><Field label="活动类型"><Input value={form.activityType} onChange={(event) => setForm({ ...form, activityType: event.target.value })} /></Field><Field label="商品链接"><Input value={form.productUrl} onChange={(event) => setForm({ ...form, productUrl: event.target.value })} /></Field><Field label="商品图片"><Input type="file" accept="image/*" onChange={handleImage} /></Field></div>
        <div className="mt-4 rounded-3xl bg-white/55 p-3"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-ink">SKU列表</h3><Button variant="soft" onClick={addSkuRow}><Plus size={14} />添加SKU</Button></div><div className="space-y-2">{form.skus.map((row, index) => { const m = skuMetrics(row); return <div key={index} className="grid grid-cols-[1.2fr_repeat(9,1fr)_40px] gap-2 rounded-2xl bg-white/70 p-2"><div><Input list="selected-product-skus" value={row.sku} onChange={(event) => selectSku(index, event.target.value)} placeholder="规格SKU" /><datalist id="selected-product-skus">{selectedLibraryProduct?.skus.map((sku) => <option key={sku.sku} value={sku.sku} />)}</datalist></div><Select value={row.includeInActivity === false ? 'no' : 'yes'} onChange={(event) => updateSkuRow(index, { includeInActivity: event.target.value === 'yes' })}><option value="yes">参与</option><option value="no">不参与</option></Select><Input type="number" step="0.01" value={row.supplyPrice} onChange={(event) => updateSkuRow(index, { supplyPrice: event.target.value })} placeholder="供货价" /><Input type="number" step="0.01" value={row.originalPrice} onChange={(event) => updateSkuRow(index, { originalPrice: event.target.value })} placeholder="原售价" /><Input type="number" step="0.1" value={row.discountInput ?? discountInputText(m.discount)} onChange={(event) => updateSkuRow(index, { discountInput: event.target.value })} placeholder="折扣??8 / 0.8 / 80" /><MetricCell label="自动活动价" value={`¥${money(m.activityPrice)}`} /><Input type="number" step="0.01" value={row.roas} onChange={(event) => updateSkuRow(index, { roas: event.target.value })} placeholder="ROAS" /><MetricCell label="广告费" value={`¥${money(m.adCost)}`} /><MetricCell label="利润" value={`¥${money(m.profit)}`} className={profitTone(m.profit)} /><MetricCell label="利润率" value={percent(m.margin)} className={profitTone(m.profit)} /><button type="button" onClick={() => removeSkuRow(index)} className="rounded-xl text-[#a33] hover:bg-white"><X size={16} /></button></div>; })}</div></div>
        <div className="mt-3 grid grid-cols-[112px_1fr] gap-3"><button type="button" onClick={() => form.imageDataUrl && setPreviewImage(form.imageDataUrl)} className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-white/75 text-muted"><SafeImage src={form.imageDataUrl} alt="商品图片" className="h-full w-full object-cover" /></button><Field label="备注"><Textarea className="min-h-28" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field></div><div className="mt-4 flex justify-end gap-3"><Button variant="soft" onClick={closeForm}>取消</Button><Button onClick={saveProduct} disabled={!form.productName.trim() || !form.skc.trim()} className="bg-[#f27a2d] hover:bg-[#df6720]">保存</Button></div></Modal> : null}

      {calcTarget ? <Modal title="报活动计算" onClose={() => setCalcTarget(null)}><div className="mt-4 space-y-4"><div className="rounded-3xl bg-white/70 p-4"><h3 className="text-lg font-semibold text-ink">{calcTarget.product.productName} / {calcTarget.row.sku}</h3><p className="mt-1 text-sm text-muted">优先输入折扣，系统自动计算活动价、广告费、利润和利润率；也可以继续用目标利润和目标ROAS反推建议价。</p></div><div className="grid grid-cols-3 gap-3"><Field label="折扣"><Input type="number" step="0.1" value={calcInput.discountInput} onChange={(event) => setCalcInput({ ...calcInput, discountInput: event.target.value })} placeholder="折扣??8 / 0.8 / 80" /></Field><Field label="目标利润"><Input type="number" step="0.01" value={calcInput.targetProfit} onChange={(event) => setCalcInput({ ...calcInput, targetProfit: event.target.value })} /></Field><Field label="目标ROAS"><Input type="number" step="0.01" value={calcInput.targetRoas} onChange={(event) => setCalcInput({ ...calcInput, targetRoas: event.target.value })} /></Field></div>{(() => { const m = skuMetrics(calcTarget.row); const selectedDiscount = parseDiscountInput(calcInput.discountInput); const discountRow = { ...calcTarget.row, discountInput: calcInput.discountInput, roas: calcInput.targetRoas || calcTarget.row.roas }; const discountMetrics = selectedDiscount ? skuMetrics(discountRow) : m; const suggestion = suggestActivity(calcTarget.row, calcInput.targetProfit, calcInput.targetRoas); return <div className="grid grid-cols-4 gap-2 rounded-3xl bg-white/65 p-3"><MetricCell label="供货价" value={`¥${money(m.supplyPrice)}`} /><MetricCell label="原售价" value={`¥${money(m.originalPrice)}`} /><MetricCell label="输入折扣" value={formatDiscount(discountMetrics.discount)} /><MetricCell label="自动活动价" value={`¥${money(discountMetrics.activityPrice)}`} className="text-[#1f6736]" /><MetricCell label="广告费" value={`¥${money(discountMetrics.adCost)}`} /><MetricCell label="利润" value={`¥${money(discountMetrics.profit)}`} className={profitTone(discountMetrics.profit)} /><MetricCell label="利润率" value={percent(discountMetrics.margin)} className={profitTone(discountMetrics.profit)} /><MetricCell label="当前折扣" value={formatDiscount(m.discount)} /><MetricCell label="建议活动价" value={`¥${money(suggestion.suggestedPrice)}`} className="text-[#1f6736]" /><MetricCell label="建议折扣" value={formatDiscount(suggestion.suggestedDiscount)} className="text-[#1f6736]" /><MetricCell label="目标ROAS" value={money(suggestion.roas)} /><MetricCell label="目标利润" value={`¥${money(suggestion.profit)}`} /></div>; })()}<p className="rounded-2xl bg-[#fff4e8] px-4 py-3 text-sm leading-6 text-muted">折扣录入支持 8、7.5、0.8、80。活动价 = 原售价 × 折扣；建议活动价 = (供货价 + 目标利润) ÷ (1 - 1 ÷ 目标ROAS)。</p></div></Modal> : null}
      {previewImage ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2f2529]/70 p-6" onClick={() => setPreviewImage(null)}><button type="button" className="absolute right-6 top-6 rounded-full bg-white/90 p-2 text-ink" onClick={() => setPreviewImage(null)}><X size={20} /></button><img src={previewImage} alt="商品预览" className="max-h-[86vh] max-w-[86vw] rounded-3xl bg-white object-contain p-2 shadow-glass" /></div> : null}
    </>
  );
}
