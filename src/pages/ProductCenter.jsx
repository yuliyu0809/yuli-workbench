import { Edit3, Package, Plus, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input, Textarea } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { normalizeProduct } from '../utils/productSchema.js';

const emptySku = {
  id: '',
  name: '',
  supplyPrice: 0,
  length: '',
  ledCount: '',
  size: '',
  note: '',
};

const emptyProduct = {
  id: '',
  name: '',
  category: '',
  englishName: '',
  skus: [],
  sellingPoints: [],
  defaultTitleTemplate: '',
  defaultSceneLibrary: [],
  colorScenes: { warm: [], white: [], colorful: [] },
  note: '',
  updatedAt: '',
};

function listToText(value) {
  return Array.isArray(value) ? value.join('\n') : value || '';
}

function textToList(value) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function toForm(product) {
  const normalized = normalizeProduct(product);
  return {
    ...emptyProduct,
    ...normalized,
    sellingPointsText: listToText(normalized.sellingPoints),
    defaultSceneLibraryText: listToText(normalized.defaultSceneLibrary),
    warmScenesText: listToText(normalized.colorScenes?.warm),
    whiteScenesText: listToText(normalized.colorScenes?.white),
    colorfulScenesText: listToText(normalized.colorScenes?.colorful),
  };
}

function fromForm(form) {
  const skus = form.skus.map((sku, index) => ({
    id: sku.id || `sku-${Date.now()}-${index}`,
    name: sku.name.trim() || `SKU${index + 1}`,
    supplyPrice: Number(sku.supplyPrice) || 0,
    length: sku.length.trim(),
    ledCount: sku.ledCount.trim(),
    size: sku.size.trim(),
    note: sku.note.trim(),
  }));

  return normalizeProduct({
    id: form.id || `product-${Date.now()}`,
    name: form.name.trim(),
    category: form.category.trim(),
    englishName: form.englishName.trim(),
    skus,
    specs: skus.map((sku) => sku.name),
    dimensions: skus.map((sku) => sku.size).filter(Boolean),
    sellingPoints: textToList(form.sellingPointsText || ''),
    costPrice: Number(skus[0]?.supplyPrice || 0),
    defaultTitleTemplate: form.defaultTitleTemplate.trim(),
    defaultSceneLibrary: textToList(form.defaultSceneLibraryText || ''),
    colorScenes: {
      warm: textToList(form.warmScenesText || ''),
      white: textToList(form.whiteScenesText || ''),
      colorful: textToList(form.colorfulScenesText || ''),
    },
    note: form.note.trim(),
    updatedAt: new Date().toLocaleDateString('zh-CN'),
  });
}

export function ProductCenter({ products, setProducts }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) || products[0] || emptyProduct,
    [products, selectedId],
  );
  const [form, setForm] = useState(() => toForm(selectedProduct));

  function selectProduct(product) {
    setSelectedId(product.id);
    setForm(toForm(product));
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSku(index, field, value) {
    setForm((current) => ({
      ...current,
      skus: current.skus.map((sku, skuIndex) => (skuIndex === index ? { ...sku, [field]: value } : sku)),
    }));
  }

  function addSku() {
    setForm((current) => ({
      ...current,
      skus: [
        ...current.skus,
        {
          ...emptySku,
          id: `sku-${Date.now()}`,
          name: `SKU${current.skus.length + 1}`,
        },
      ],
    }));
  }

  function deleteSku(index) {
    setForm((current) => ({
      ...current,
      skus: current.skus.filter((_, skuIndex) => skuIndex !== index),
    }));
  }

  function createNewProduct() {
    const draft = normalizeProduct({
      ...emptyProduct,
      id: `product-${Date.now()}`,
      name: '新产品',
      category: '太阳能灯饰',
      skus: [{ ...emptySku, id: `sku-${Date.now()}`, name: '默认规格' }],
      updatedAt: new Date().toLocaleDateString('zh-CN'),
    });
    setSelectedId(draft.id);
    setForm(toForm(draft));
  }

  function saveProduct() {
    const nextProduct = fromForm(form);
    if (!nextProduct.name) {
      return;
    }
    const exists = products.some((product) => product.id === nextProduct.id);
    const nextProducts = exists
      ? products.map((product) => (product.id === nextProduct.id ? nextProduct : product))
      : [...products, nextProduct];
    setProducts(nextProducts);
    setSelectedId(nextProduct.id);
    setForm(toForm(nextProduct));
  }

  function deleteProduct(productId) {
    const nextProducts = products.filter((product) => product.id !== productId);
    setProducts(nextProducts);
    const nextSelected = nextProducts[0] || emptyProduct;
    setSelectedId(nextSelected.id || '');
    setForm(toForm(nextSelected));
  }

  return (
    <>
      <PageHeader
        eyebrow="Product Data Source"
        title="产品配置中心"
        description="产品下面可以维护多个规格 SKU。利润计算器和提示词工坊都会从这里读取产品、SKU、供货价、尺寸和场景库。"
        action={<Button onClick={createNewProduct}><Plus size={16} />新增产品</Button>}
      />

      <div className="grid grid-cols-[0.78fr_1.22fr] gap-5">
        <GlassPanel>
          <div className="mb-4 flex items-center gap-2">
            <Package size={19} className="text-[#a85672]" />
            <h3 className="text-lg font-semibold text-ink">产品列表</h3>
          </div>

          <div className="space-y-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => selectProduct(product)}
                className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                  selectedId === product.id ? 'bg-ink text-white shadow-soft' : 'bg-white/64 text-ink hover:bg-white'
                }`}
              >
                <div className="font-medium">{product.name}</div>
                <div className={`mt-1 text-xs ${selectedId === product.id ? 'text-white/72' : 'text-muted'}`}>
                  {product.category} · {product.skus.length} 个SKU
                </div>
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">产品资料</h3>
            <div className="flex gap-2">
              <Button variant="blush" onClick={saveProduct}><Save size={15} />保存</Button>
              {form.id ? (
                <Button variant="soft" onClick={() => deleteProduct(form.id)}><Trash2 size={15} />删除</Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="产品名称">
              <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </Field>
            <Field label="产品分类">
              <Input value={form.category} onChange={(event) => updateField('category', event.target.value)} />
            </Field>
            <Field label="英文名称">
              <Input value={form.englishName} onChange={(event) => updateField('englishName', event.target.value)} />
            </Field>
            <Field label="默认标题模板">
              <Input
                value={form.defaultTitleTemplate}
                onChange={(event) => updateField('defaultTitleTemplate', event.target.value)}
              />
            </Field>
            <Field label="卖点">
              <Textarea
                value={form.sellingPointsText}
                onChange={(event) => updateField('sellingPointsText', event.target.value)}
              />
            </Field>
            <Field label="默认场景库">
              <Textarea
                value={form.defaultSceneLibraryText}
                onChange={(event) => updateField('defaultSceneLibraryText', event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5 rounded-2xl bg-white/64 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Edit3 size={17} className="text-[#a85672]" />
                <h4 className="font-semibold text-ink">规格 SKU</h4>
              </div>
              <Button variant="soft" onClick={addSku}><Plus size={15} />新增SKU</Button>
            </div>
            <div className="space-y-4">
              {form.skus.map((sku, index) => (
                <div key={sku.id || index} className="rounded-2xl bg-white/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-ink">SKU {index + 1}</div>
                    <Button variant="ghost" className="min-h-8 px-2 py-1" onClick={() => deleteSku(index)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="规格名称">
                      <Input value={sku.name} onChange={(event) => updateSku(index, 'name', event.target.value)} />
                    </Field>
                    <Field label="供货价">
                      <Input
                        type="number"
                        value={sku.supplyPrice}
                        onChange={(event) => updateSku(index, 'supplyPrice', event.target.value)}
                      />
                    </Field>
                    <Field label="长度">
                      <Input value={sku.length} onChange={(event) => updateSku(index, 'length', event.target.value)} />
                    </Field>
                    <Field label="LED数量">
                      <Input value={sku.ledCount} onChange={(event) => updateSku(index, 'ledCount', event.target.value)} />
                    </Field>
                    <Field label="尺寸">
                      <Input value={sku.size} onChange={(event) => updateSku(index, 'size', event.target.value)} />
                    </Field>
                    <Field label="备注">
                      <Input value={sku.note} onChange={(event) => updateSku(index, 'note', event.target.value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/64 p-4">
            <h4 className="mb-4 font-semibold text-ink">颜色对应场景库</h4>
            <div className="grid grid-cols-3 gap-4">
              <Field label="暖色">
                <Textarea value={form.warmScenesText} onChange={(event) => updateField('warmScenesText', event.target.value)} />
              </Field>
              <Field label="白色">
                <Textarea value={form.whiteScenesText} onChange={(event) => updateField('whiteScenesText', event.target.value)} />
              </Field>
              <Field label="彩色">
                <Textarea
                  value={form.colorfulScenesText}
                  onChange={(event) => updateField('colorfulScenesText', event.target.value)}
                />
              </Field>
            </div>
            <Field label="备注">
              <Textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} />
            </Field>
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
