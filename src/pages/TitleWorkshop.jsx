import { Copy, Save, Star, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input, Select, Textarea } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { generateMarketplaceTitles, getColorLabel, getPlatformLabel } from '../utils/titleGenerator.js';
import { getProductSku } from '../utils/productSchema.js';

const colorOptions = [
  { value: 'warm', label: '暖色' },
  { value: 'white', label: '白色' },
  { value: 'colorful', label: '彩色' },
];

const platformOptions = [
  { value: 'temu', label: 'TEMU欧洲站' },
  { value: 'amazon', label: 'Amazon欧洲站' },
  { value: 'german', label: '德国站' },
  { value: 'french', label: '法国站' },
];

function normalizeTitleRecord(item) {
  if (typeof item === 'string') {
    return {
      id: item,
      productName: '旧版标题',
      skuName: '-',
      platformLabel: '-',
      colorLabel: '-',
      titles: { english: item, german: '', french: '', chinese: '' },
      favorite: false,
      createdAt: '',
    };
  }
  return item;
}

function splitSellingPoints(text) {
  return String(text || '').split(/\r?\n|,|、/).map((item) => item.trim()).filter(Boolean);
}

export function TitleWorkshop({ products, titles, setTitles }) {
  const firstProduct = products[0];
  const [form, setForm] = useState({
    productId: firstProduct?.id || '',
    skuId: firstProduct?.skus?.[0]?.id || '',
    color: 'warm',
    platform: 'temu',
    targetChars: 180,
    sellingPointsText: (firstProduct?.sellingPoints || []).join('\n'),
  });
  const [search, setSearch] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) || firstProduct,
    [firstProduct, form.productId, products],
  );
  const selectedSku = useMemo(() => getProductSku(selectedProduct, form.skuId), [form.skuId, selectedProduct]);
  const generated = useMemo(
    () => generateMarketplaceTitles({
      product: selectedProduct,
      sku: selectedSku,
      color: form.color,
      platform: form.platform,
      targetChars: form.targetChars,
      sellingPoints: splitSellingPoints(form.sellingPointsText),
    }),
    [form, selectedProduct, selectedSku],
  );
  const history = useMemo(() => titles.map(normalizeTitleRecord), [titles]);
  const filteredHistory = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return history
      .filter((record) => {
        if (!keyword) return true;
        return JSON.stringify(record).toLowerCase().includes(keyword);
      })
      .slice(0, 50);
  }, [history, search]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleProductChange(productId) {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({
      ...current,
      productId,
      skuId: product?.skus?.[0]?.id || '',
      sellingPointsText: (product?.sellingPoints || []).join('\n'),
    }));
  }

  function saveHistory(language, title, favorite = false) {
    const record = {
      id: `title-${Date.now()}-${language}`,
      productId: form.productId,
      skuId: form.skuId,
      productName: selectedProduct?.name || '',
      skuName: selectedSku?.name || '',
      platformLabel: getPlatformLabel(form.platform),
      colorLabel: getColorLabel(form.color).zh,
      language,
      title,
      titles: {
        english: generated.english,
        german: generated.german,
        french: generated.french,
        chinese: generated.chinese,
      },
      favorite,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setTitles([record, ...history].slice(0, 50));
  }

  function toggleFavorite(recordId) {
    setTitles(history.map((record) => (
      record.id === recordId ? { ...record, favorite: !record.favorite } : record
    )));
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  const resultCards = [
    ['英文标题', 'english', generated.english],
    ['Amazon标题', 'amazon', generated.amazon],
    ['德语标题', 'german', generated.german],
    ['法语标题', 'french', generated.french],
    ['中文参考标题', 'chinese', generated.chinese],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Marketplace Title Studio"
        title="标题工坊"
        description="面向 TEMU 欧洲站、Amazon 欧洲站、德国站和法国站生成灯饰标题，自动读取产品、SKU、颜色和卖点。"
        action={<Button onClick={() => saveHistory('english', generated.english)}><Save size={16} />保存英文标题</Button>}
      />

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
                {colorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="平台">
              <Select value={form.platform} onChange={(event) => updateField('platform', event.target.value)}>
                {platformOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="目标字符数">
              <Input type="number" value={form.targetChars} onChange={(event) => updateField('targetChars', event.target.value)} />
            </Field>
            <div className="rounded-2xl bg-white/62 p-4 text-sm leading-6 text-muted">
              <div className="font-medium text-ink">默认规则</div>
              <p className="mt-2">数字放最前面；规格从大到小排序；禁止 waterproof；统一 IP44。</p>
            </div>
            <Field label="卖点">
              <Textarea value={form.sellingPointsText} onChange={(event) => updateField('sellingPointsText', event.target.value)} />
            </Field>
            <div className="rounded-2xl bg-white/62 p-4 text-sm leading-6 text-muted">
              <div className="font-medium text-ink">自动读取</div>
              <p className="mt-2">产品：{selectedProduct?.name || '-'}</p>
              <p>SKU：{selectedSku?.name || '-'}</p>
              <p>排序规格：{generated.sortedSpecs.join('、') || '-'}</p>
            </div>
          </div>
        </GlassPanel>

        <div className="space-y-4">
          {resultCards.map(([label, language, title]) => (
            <GlassPanel key={language}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{label}</h3>
                  <p className="mt-3 rounded-2xl bg-white/68 p-4 text-sm leading-7 text-ink">{title}</p>
                  <div className="mt-2 text-xs text-muted">{title.length} 字符</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="soft" onClick={() => copyText(title)}><Copy size={15} />复制</Button>
                  <Button variant="blush" onClick={() => saveHistory(language, title)}><Save size={15} />保存</Button>
                  <Button variant="soft" onClick={() => saveHistory(language, title, true)}><Star size={15} />收藏</Button>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>

      <GlassPanel className="mt-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">标题历史</h3>
          <Input className="max-w-sm" placeholder="搜索产品、标题、语言、平台" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filteredHistory.map((record) => (
            <div key={record.id} className="rounded-2xl bg-white/62 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">{record.productName}</div>
                  <div className="mt-1 text-xs text-muted">
                    {record.skuName} · {record.colorLabel} · {record.platformLabel} · {record.language || 'english'}
                  </div>
                </div>
                <Button variant={record.favorite ? 'blush' : 'ghost'} className="min-h-8 px-2 py-1" onClick={() => toggleFavorite(record.id)}>
                  <Star size={14} />
                </Button>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink">{record.title || record.titles?.english}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted">{record.createdAt}</span>
                <Button variant="soft" className="min-h-8 px-2 py-1" onClick={() => copyText(record.title || record.titles?.english)}>
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}
