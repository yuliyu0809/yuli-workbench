import { Download, Edit3, FileSpreadsheet, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '../components/Button.jsx';
import { Field, Input } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { CloudSyncPanel } from '../components/sync/CloudSyncPanel.jsx';
import { cleanProductName, getProductLibrary } from '../utils/productLibrary.js';

const emptyLibrary = { products: [] };
const emptySku = { sku: '', supplyPrice: '' };
const emptyForm = { id: '', productName: '', skus: [{ ...emptySku }] };

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function numberValue(value) {
  const parsed = Number(String(value ?? '').replace(/[¥￥,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return numberValue(value).toFixed(2);
}

function normalizeSku(sku) {
  return {
    id: sku.id || makeId('sku'),
    sku: String(sku.sku || sku.name || '').trim(),
    supplyPrice: numberValue(sku.supplyPrice),
  };
}

function normalizeProduct(product) {
  const productName = cleanProductName(product.productName || product.name);
  const skus = Array.isArray(product.skus) ? product.skus : [];
  return {
    id: product.id || makeId('product-lib'),
    productName,
    skus: skus.map(normalizeSku).filter((sku) => productName && sku.sku),
    updatedAt: product.updatedAt || nowText(),
  };
}

export function normalizeProductLibrary(library) {
  return getProductLibrary(library);
}

function headerText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function findColumn(headers, candidates) {
  return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

function parseRows(rows) {
  const headerIndex = rows.findIndex((row) => {
    const headers = row.map(headerText);
    return findColumn(headers, ['名称', '品名', '产品']) >= 0 && findColumn(headers, ['规格', 'sku']) >= 0 && findColumn(headers, ['供货价', '成本价', '采购价']) >= 0;
  });
  const headers = (rows[headerIndex >= 0 ? headerIndex : 0] || []).map(headerText);
  const nameCol = findColumn(headers, ['产品名称', '商品名称', '名称', '品名', '产品']);
  const skuCol = findColumn(headers, ['规格sku', 'sku', '规格', '型号']);
  const priceCol = findColumn(headers, ['供货价', '供货价格', '成本价', '采购价']);
  const start = headerIndex >= 0 ? headerIndex + 1 : 1;
  const imported = [];
  let currentName = '';

  rows.slice(start).forEach((row) => {
    const rawName = row[nameCol >= 0 ? nameCol : 0];
    const nextName = cleanProductName(rawName);
    if (nextName) currentName = nextName;
    const sku = String(row[skuCol >= 0 ? skuCol : 1] || '').trim();
    const supplyPrice = numberValue(row[priceCol >= 0 ? priceCol : 2]);
    if (currentName && sku && supplyPrice > 0) {
      imported.push({ productName: currentName, skus: [{ sku, supplyPrice }] });
    }
  });

  return normalizeProductLibrary({ products: imported });
}

async function parseFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return parseRows(rows);
}

function mergeLibraries(current, incoming) {
  return normalizeProductLibrary({ products: [...(current.products || []), ...(incoming.products || [])] });
}

function ProductEditorModal({ form, setForm, onClose, onSave, title }) {
  const updateSku = (index, patch) => {
    setForm((current) => ({
      ...current,
      skus: current.skus.map((sku, skuIndex) => (skuIndex === index ? { ...sku, ...patch } : sku)),
    }));
  };

  const addSku = () => setForm((current) => ({ ...current, skus: [...current.skus, { ...emptySku }] }));
  const removeSku = (index) => setForm((current) => ({ ...current, skus: current.skus.filter((_, skuIndex) => skuIndex !== index) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2529]/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] border border-white/80 bg-[#fff9fb] p-5 shadow-glass">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-white/85 p-2 text-ink"><X size={18} /></button>
        </div>

        <div className="mt-4">
          <Field label="产品名称">
            <Input value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} />
          </Field>
        </div>

        <div className="mt-4 rounded-3xl bg-white/55 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink">规格SKU</h3>
            <Button variant="soft" onClick={addSku}><Plus size={14} />新增SKU</Button>
          </div>
          <div className="space-y-2">
            {form.skus.map((sku, index) => (
              <div key={sku.id || index} className="grid grid-cols-[1fr_180px_40px] gap-2 rounded-2xl bg-white/75 p-2">
                <Input value={sku.sku} onChange={(event) => updateSku(index, { sku: event.target.value })} placeholder="规格SKU" />
                <Input type="number" step="0.01" value={sku.supplyPrice} onChange={(event) => updateSku(index, { supplyPrice: event.target.value })} placeholder="供货价" />
                <button type="button" onClick={() => removeSku(index)} className="rounded-xl text-[#a33] hover:bg-white"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="soft" onClick={onClose}>取消</Button>
          <Button className="bg-[#f27a2d] hover:bg-[#df6720]" onClick={onSave} disabled={!form.productName.trim() || !form.skus.some((sku) => String(sku.sku || '').trim())}>保存</Button>
        </div>
      </div>
    </div>
  );
}

export function ProductInfoLibrary({ productLibrary, setProductLibrary, productLibrarySync }) {
  const library = normalizeProductLibrary(productLibrary || emptyLibrary);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef(null);

  const filteredProducts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return library.products;
    return library.products.filter((product) => product.productName.toLowerCase().includes(keyword));
  }, [library.products, searchText]);

  const totalSkuCount = library.products.reduce((sum, product) => sum + product.skus.length, 0);
  const updateLibrary = (next) => setProductLibrary(normalizeProductLibrary(next));

  const openNewProduct = () => {
    setMode('create');
    setEditingProduct(null);
    setForm({ ...emptyForm, skus: [{ ...emptySku }] });
    setIsModalOpen(true);
  };

  const openEditProduct = (product) => {
    setMode('edit');
    setEditingProduct(product);
    setForm({
      id: product.id,
      productName: product.productName,
      skus: product.skus.map((sku) => ({ ...sku })),
    });
    setIsModalOpen(true);
  };

  const closeEditor = () => {
    setIsModalOpen(false);
    setMode('create');
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const saveProduct = () => {
    const normalized = normalizeProduct({ ...form, id: form.id || makeId('product-lib'), updatedAt: nowText() });
    if (!normalized.productName || !normalized.skus.length) return;
    const withoutCurrent = library.products.filter((product) => product.id !== editingProduct?.id);
    updateLibrary({ products: [normalized, ...withoutCurrent] });
    closeEditor();
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = await parseFile(file);
    updateLibrary(mergeLibraries(library, imported));
    event.target.value = '';
  };

  const deleteProduct = (productId) => {
    if (!window.confirm('确认删除这个产品吗？')) return;
    updateLibrary({ products: library.products.filter((product) => product.id !== productId) });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-library-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="TEMU运营后台"
        title="产品信息库"
        description="导入后的产品、SKU 和供货价均可编辑，并同步到 Supabase。"
      />

      <CloudSyncPanel sync={productLibrarySync} />

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-4">
        <GlassPanel className="py-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white/75 px-4 py-2">
              <Search size={18} className="text-muted" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="搜索产品名称"
                className="h-9 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-[#b9aab0]"
              />
            </div>
            <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv,.doc,.docx" className="hidden" onChange={handleImport} />
            <Button variant="soft" onClick={() => fileInputRef.current?.click()}><Upload size={15} />导入Excel/CSV</Button>
            <Button variant="soft" onClick={exportJson}><Download size={15} />导出JSON</Button>
            <Button className="bg-[#f27a2d] hover:bg-[#df6720]" onClick={openNewProduct}><Plus size={16} />手动新增</Button>
          </div>
        </GlassPanel>
        <GlassPanel className="min-w-60 py-4">
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <div><div className="text-2xl font-semibold text-ink">{library.products.length}</div><div className="text-muted">产品</div></div>
            <div><div className="text-2xl font-semibold text-[#9a4b00]">{totalSkuCount}</div><div className="text-muted">SKU</div></div>
          </div>
        </GlassPanel>
      </div>

      <div className="mt-4 grid gap-3">
        {filteredProducts.map((product) => (
          <article key={product.id} className="rounded-3xl border border-white/70 bg-white/62 p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{product.productName}</h2>
                <p className="mt-1 text-sm text-muted">{product.skus.length} 个规格SKU，更新：{product.updatedAt || '-'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="soft" onClick={() => openEditProduct(product)}><Edit3 size={15} />编辑</Button>
                <Button variant="ghost" className="text-[#a33]" onClick={() => deleteProduct(product.id)}><Trash2 size={15} />删除产品</Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.skus.map((sku) => (
                <div key={sku.id} className="rounded-2xl bg-white/75 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink"><FileSpreadsheet size={14} />{sku.sku}</div>
                  <div className="mt-2 text-sm text-muted">供货价 <span className="font-semibold text-ink">¥{money(sku.supplyPrice)}</span></div>
                </div>
              ))}
            </div>
          </article>
        ))}

        {!filteredProducts.length ? (
          <GlassPanel className="py-10 text-center">
            <FileSpreadsheet className="mx-auto text-muted" size={24} />
            <h3 className="mt-3 text-lg font-semibold text-ink">暂无产品信息</h3>
            <p className="mt-1 text-sm text-muted">导入 Excel / CSV，或手动新增一个产品。</p>
          </GlassPanel>
        ) : null}
      </div>

      {isModalOpen ? (
        <ProductEditorModal
          title={mode === 'edit' ? '编辑产品' : '手动新增产品'}
          form={form}
          setForm={setForm}
          onClose={closeEditor}
          onSave={saveProduct}
        />
      ) : null}
    </>
  );
}