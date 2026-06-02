import { Copy, RefreshCw, Save, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Select } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import {
  generatePromptFromAssets,
  getColorLabel,
  getImageTypeLabel,
} from '../utils/promptGenerator.js';
import { getAssetPool, hasRequiredAssets } from '../utils/promptAssetSchema.js';
import { getProductSku } from '../utils/productSchema.js';

const colorOptions = [
  { value: 'warm', label: '暖色' },
  { value: 'white', label: '白色' },
  { value: 'colorful', label: '彩色' },
];

const imageTypeOptions = [
  { value: 'main', label: '主图' },
  { value: 'scene', label: '场景图' },
  { value: 'grid', label: '四宫格' },
  { value: 'size', label: '尺寸图' },
  { value: 'sku', label: 'SKU图' },
];

const platformOptions = [
  { value: 'temuEu', label: 'TEMU欧洲站' },
  { value: 'amazonEu', label: 'Amazon欧洲站' },
];

function createInitialForm(product) {
  return {
    productId: product?.id || '',
    skuId: product?.skus?.[0]?.id || '',
    color: 'warm',
    imageType: 'scene',
    platform: 'temuEu',
  };
}

function normalizeHistoryItem(item) {
  if (typeof item === 'string') {
    return {
      id: item,
      productName: '历史提示词',
      skuName: '-',
      colorLabel: '-',
      imageTypeLabel: '-',
      platformLabel: '-',
      chinese: item,
      english: item,
      createdAt: '',
    };
  }
  return item;
}

export function PromptWorkshop({ products, promptAssets, prompts, setPrompts, onNavigate }) {
  const firstProduct = products[0];
  const [form, setForm] = useState(() => createInitialForm(firstProduct));
  const [runId, setRunId] = useState(0);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) || firstProduct,
    [firstProduct, form.productId, products],
  );
  const selectedSku = useMemo(
    () => getProductSku(selectedProduct, form.skuId),
    [form.skuId, selectedProduct],
  );
  const assetPool = useMemo(
    () => getAssetPool(promptAssets, form.productId, form.color, form.imageType),
    [form, promptAssets],
  );
  const ready = hasRequiredAssets(assetPool);
  const result = useMemo(
    () => generatePromptFromAssets(form, selectedProduct, selectedSku, assetPool),
    [assetPool, form, runId, selectedProduct, selectedSku],
  );
  const history = useMemo(() => prompts.map(normalizeHistoryItem), [prompts]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setRunId((current) => current + 1);
  }

  function handleProductChange(productId) {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({
      ...current,
      productId,
      skuId: product?.skus?.[0]?.id || '',
    }));
    setRunId((current) => current + 1);
  }

  function regenerate() {
    setRunId((current) => current + 1);
  }

  function savePrompt() {
    if (!selectedProduct || !ready) {
      return;
    }
    const record = {
      id: `prompt-${Date.now()}`,
      productId: form.productId,
      skuId: form.skuId,
      productName: selectedProduct.name,
      skuName: selectedSku?.name || '',
      colorLabel: result.colorLabel,
      imageTypeLabel: result.imageTypeLabel,
      platformLabel: result.platformLabel,
      pickedAssets: result.pickedAssets,
      chinese: result.chinese,
      english: result.english,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setPrompts([...history, record]);
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <>
      <PageHeader
        eyebrow="Prompt Assets Engine"
        title="提示词工坊"
        description="从提示词素材库随机抽取场景词、构图词、镜头词、灯光词和氛围词，动态组合中英文提示词。"
        action={
          <Button onClick={savePrompt} disabled={!selectedProduct || !ready}>
            <Save size={16} />保存历史
          </Button>
        }
      />

      {!selectedProduct ? (
        <GlassPanel>
          <h3 className="text-lg font-semibold text-ink">暂无产品</h3>
          <p className="mt-3 text-sm leading-6 text-muted">请先到产品配置中心新增产品，再生成提示词。</p>
          <Button className="mt-5" onClick={() => onNavigate?.('productsCenter')}>去配置产品</Button>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-[0.86fr_1.14fr] gap-5">
          <GlassPanel>
            <div className="grid grid-cols-2 gap-4">
              <Field label="产品">
                <Select value={form.productId} onChange={(event) => handleProductChange(event.target.value)}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="规格SKU">
                <Select value={form.skuId} onChange={(event) => updateField('skuId', event.target.value)}>
                  {(selectedProduct?.skus || []).map((sku) => (
                    <option key={sku.id} value={sku.id}>{sku.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="颜色">
                <Select value={form.color} onChange={(event) => updateField('color', event.target.value)}>
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="图片类型">
                <Select value={form.imageType} onChange={(event) => updateField('imageType', event.target.value)}>
                  {imageTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="平台">
                <Select value={form.platform} onChange={(event) => updateField('platform', event.target.value)}>
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="blush" onClick={regenerate} disabled={!ready}>
                <RefreshCw size={15} />重新生成
              </Button>
              <Button variant="soft" onClick={() => onNavigate?.('promptAssets')}>
                管理素材库
              </Button>
            </div>

            {!ready ? (
              <div className="mt-5 rounded-2xl border border-[#f0b8c8] bg-[#fff2f6] p-4 text-sm leading-6 text-[#8f405d]">
                当前产品 / 颜色 / 图片类型的素材池不完整。至少需要场景词、构图词、镜头词、灯光词、氛围词各 1 条。
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl bg-white/64 p-4">
              <div className="text-sm font-semibold text-ink">当前抽取素材</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
                <p>产品：{selectedProduct.name}</p>
                <p>规格：{selectedSku?.name || '-'}</p>
                <p>颜色：{getColorLabel(form.color).zh}</p>
                <p>图片类型：{getImageTypeLabel(form.imageType).zh}</p>
                <p>场景词：{result.pickedAssets.scene || '-'}</p>
                <p>构图词：{result.pickedAssets.composition || '-'}</p>
                <p>镜头词：{result.pickedAssets.lens || '-'}</p>
                <p>灯光词：{result.pickedAssets.lighting || '-'}</p>
                <p>氛围词：{result.pickedAssets.mood || '-'}</p>
              </div>
            </div>
          </GlassPanel>

          <div className="space-y-5">
            {[
              ['中文提示词', result.chinese],
              ['英文提示词', result.english],
            ].map(([label, text]) => (
              <GlassPanel key={label}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-ink">{label}</h3>
                  <Button variant="soft" onClick={() => copyText(text)} disabled={!ready}>
                    <Copy size={15} />一键复制
                  </Button>
                </div>
                <p className="mt-4 rounded-2xl bg-white/68 p-4 text-sm leading-7 text-ink">{text}</p>
              </GlassPanel>
            ))}
            <Button className="w-full" onClick={savePrompt} disabled={!ready}>
              <WandSparkles size={16} />保存当前中英文提示词
            </Button>
          </div>
        </div>
      )}

      <GlassPanel className="mt-5">
        <h3 className="text-lg font-semibold text-ink">历史记录</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {history.slice(-6).reverse().map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/62 p-4">
              <div className="font-medium text-ink">{item.productName}</div>
              <div className="mt-1 text-xs text-muted">
                {item.skuName || '-'} · {item.colorLabel} · {item.imageTypeLabel}
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{item.chinese}</p>
              <div className="mt-3 text-xs text-muted">{item.createdAt}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}
