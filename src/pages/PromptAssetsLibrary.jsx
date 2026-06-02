import { Brain, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { assetCategories } from '../data/defaultPromptAssets.js';
import { Button } from '../components/Button.jsx';
import { Field, Select, Textarea } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { getAssetPool } from '../utils/promptAssetSchema.js';

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

function listToText(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function textToList(value) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export function PromptAssetsLibrary({ products, promptAssets, setPromptAssets }) {
  const firstProduct = products[0];
  const [form, setForm] = useState({
    productId: firstProduct?.id || '',
    color: 'warm',
    imageType: 'scene',
    category: 'scene',
  });
  const [assetText, setAssetText] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) || firstProduct,
    [firstProduct, form.productId, products],
  );
  const pool = useMemo(
    () => getAssetPool(promptAssets, form.productId, form.color, form.imageType),
    [form, promptAssets],
  );
  const currentText = listToText(pool[form.category]);

  useEffect(() => {
    setAssetText(currentText);
  }, [currentText]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveCategory(value) {
    const nextAssets = promptAssets.map((record) => {
      if (record.productId !== form.productId) {
        return record;
      }
      return {
        ...record,
        colors: {
          ...record.colors,
          [form.color]: {
            ...record.colors[form.color],
            [form.imageType]: {
              ...record.colors[form.color][form.imageType],
              [form.category]: textToList(value),
            },
          },
        },
      };
    });
    setPromptAssets(nextAssets);
  }

  return (
    <>
      <PageHeader
        eyebrow="Prompt Assets Library"
        title="提示词素材库"
        description="按产品、颜色、图片类型维护素材池。提示词工坊会随机抽取场景词、构图词、镜头词、灯光词和氛围词进行动态组合。"
      />

      <div className="grid grid-cols-[0.82fr_1.18fr] gap-5">
        <GlassPanel>
          <div className="mb-4 flex items-center gap-2">
            <Brain size={19} className="text-[#a85672]" />
            <h3 className="text-lg font-semibold text-ink">素材定位</h3>
          </div>
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
            <Field label="素材分类">
              <Select value={form.category} onChange={(event) => updateField('category', event.target.value)}>
                {assetCategories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-5 rounded-2xl bg-white/64 p-4 text-sm leading-6 text-muted">
            <div className="font-medium text-ink">当前产品</div>
            <p className="mt-2">{selectedProduct?.name || '-'}</p>
            <p className="mt-2">每行一个素材。删除某行即删除素材，修改文字即编辑素材，新增一行即新增素材。</p>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">
              {assetCategories.find((item) => item.key === form.category)?.label}
            </h3>
            <Button variant="blush" onClick={() => saveCategory(assetText)}>
              <Save size={15} />保存素材
            </Button>
          </div>
          <Textarea
            key={`${form.productId}-${form.color}-${form.imageType}-${form.category}`}
            value={assetText}
            onChange={(event) => setAssetText(event.target.value)}
            className="min-h-[420px]"
          />
        </GlassPanel>
      </div>
    </>
  );
}
