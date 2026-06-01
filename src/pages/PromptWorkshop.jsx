import { Copy, Save, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Select } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { generatePrompt } from '../utils/promptGenerator.js';

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

function initialForm(product) {
  return {
    productId: product?.id || 'light-001',
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

export function PromptWorkshop({ products, prompts, setPrompts }) {
  const firstProduct = products[0];
  const [form, setForm] = useState(() => initialForm(firstProduct));

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) || firstProduct,
    [firstProduct, form.productId, products],
  );

  const result = useMemo(() => generatePrompt(form, selectedProduct), [form, selectedProduct]);
  const history = useMemo(() => prompts.map(normalizeHistoryItem), [prompts]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function savePrompt() {
    const record = {
      id: `prompt-${Date.now()}`,
      productId: form.productId,
      productName: selectedProduct.name,
      colorLabel: result.colorLabel,
      imageTypeLabel: result.imageTypeLabel,
      platformLabel: result.platformLabel,
      sceneZh: result.sceneZh,
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
        eyebrow="TEMU Lighting Prompt Generator"
        title="提示词工坊"
        description="按产品、颜色、图片类型和平台自动生成灯饰提示词。同一产品的暖色、白色、彩色会匹配不同场景类别，避免复用相似场景。"
        action={<Button onClick={savePrompt}><Save size={16} />保存历史</Button>}
      />

      <div className="grid grid-cols-[0.86fr_1.14fr] gap-5">
        <GlassPanel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="产品">
              <Select value={form.productId} onChange={(event) => updateField('productId', event.target.value)}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="颜色">
              <Select value={form.color} onChange={(event) => updateField('color', event.target.value)}>
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="图片类型">
              <Select value={form.imageType} onChange={(event) => updateField('imageType', event.target.value)}>
                {imageTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="平台">
              <Select value={form.platform} onChange={(event) => updateField('platform', event.target.value)}>
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-5 rounded-2xl bg-white/64 p-4">
            <div className="text-sm font-semibold text-ink">当前自动匹配</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <p>产品：{selectedProduct.name}</p>
              <p>场景类别：{result.sceneZh}</p>
              <p>规格：{selectedProduct.specs}</p>
              <p>卖点：{selectedProduct.sellingPoints}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-[#fff7fa]/80 p-4 text-sm leading-6 text-muted">
            <div className="font-medium text-ink">固定规则</div>
            <p className="mt-2">不同颜色自动匹配不同场景；统一使用 IP44；禁止 waterproof、酒、酒杯、水印、清晰人脸。</p>
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
                <Button variant="soft" onClick={() => copyText(text)}>
                  <Copy size={15} />一键复制
                </Button>
              </div>
              <p className="mt-4 rounded-2xl bg-white/68 p-4 text-sm leading-7 text-ink">{text}</p>
            </GlassPanel>
          ))}

          <Button className="w-full" onClick={savePrompt}>
            <WandSparkles size={16} />保存当前中英文提示词
          </Button>
        </div>
      </div>

      <GlassPanel className="mt-5">
        <h3 className="text-lg font-semibold text-ink">历史记录</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {history.slice(-6).reverse().map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/62 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">{item.productName}</div>
                  <div className="mt-1 text-xs text-muted">
                    {item.colorLabel} · {item.imageTypeLabel} · {item.platformLabel}
                  </div>
                </div>
                <Button variant="ghost" className="min-h-8 px-2 py-1" onClick={() => copyText(item.english)}>
                  <Copy size={14} />
                </Button>
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
