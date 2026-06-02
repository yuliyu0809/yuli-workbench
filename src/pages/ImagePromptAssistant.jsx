import { Copy, Image as ImageIcon, Save, Trash2, Upload, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Select } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { extractImageProfile, generateImagePromptAnalysis } from '../utils/imagePromptAnalyzer.js';
import { getProductSku } from '../utils/productSchema.js';

const colorOptions = [
  { value: 'auto', label: '自动识别' },
  { value: 'warm', label: '暖色' },
  { value: 'white', label: '白色' },
  { value: 'colorful', label: '彩色' },
];

const platformOptions = [
  { value: 'temuEu', label: 'TEMU欧洲站' },
  { value: 'amazonEu', label: 'Amazon欧洲站' },
];

function createInitialForm(product) {
  return {
    productId: product?.id || '',
    skuId: product?.skus?.[0]?.id || '',
    color: 'auto',
    platform: 'temuEu',
  };
}

function normalizeRecord(record) {
  return {
    id: record.id || `image-analysis-${Date.now()}`,
    productName: record.productName || '未命名产品',
    skuName: record.skuName || '-',
    fileName: record.fileName || '-',
    thumbnail: record.thumbnail || '',
    analysis: record.analysis || {},
    createdAt: record.createdAt || '',
  };
}

export function ImagePromptAssistant({ products, imageAnalyses, setImageAnalyses, onNavigate }) {
  const firstProduct = products[0];
  const [form, setForm] = useState(() => createInitialForm(firstProduct));
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) || firstProduct,
    [firstProduct, form.productId, products],
  );
  const selectedSku = useMemo(
    () => getProductSku(selectedProduct, form.skuId),
    [form.skuId, selectedProduct],
  );
  const analysis = useMemo(
    () => (profile ? generateImagePromptAnalysis({
      profile,
      product: selectedProduct,
      sku: selectedSku,
      color: form.color,
      platform: form.platform,
    }) : null),
    [form.color, form.platform, profile, selectedProduct, selectedSku],
  );
  const history = useMemo(
    () => (Array.isArray(imageAnalyses) ? imageAnalyses.map(normalizeRecord) : []).slice(0, 30),
    [imageAnalyses],
  );

  function handleProductChange(productId) {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({
      ...current,
      productId,
      skuId: product?.skus?.[0]?.id || '',
    }));
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请上传 JPG、PNG 或 WebP 格式的产品图片。');
      return;
    }
    setError('');
    setStatus('正在分析图片外观...');
    try {
      const nextProfile = await extractImageProfile(file);
      setProfile(nextProfile);
      setStatus('分析完成，可以复制或保存记录。');
    } catch {
      setError('图片读取失败，请换一张图片重试。');
      setStatus('');
    }
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  function saveRecord() {
    if (!analysis || !profile) return;
    const record = {
      id: `image-analysis-${Date.now()}`,
      productId: selectedProduct?.id || '',
      skuId: selectedSku?.id || '',
      productName: selectedProduct?.name || analysis.productType,
      skuName: selectedSku?.name || '',
      fileName: profile.fileName,
      thumbnail: profile.thumbnail,
      imageSize: `${profile.width}x${profile.height}`,
      analysis,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setImageAnalyses([record, ...history].slice(0, 30));
    setStatus('已保存到识图分析记录。');
  }

  function clearHistory() {
    setImageAnalyses([]);
  }

  const resultItems = analysis ? [
    ['产品类型', analysis.productType],
    ['造型特征', analysis.shapeFeature],
    ['材质', analysis.material],
    ['颜色', analysis.color],
    ['镂空元素', analysis.cutoutElement],
    ['光效特征', analysis.lightEffect],
  ] : [];

  return (
    <>
      <PageHeader
        eyebrow="AI Image Prompt Assistant"
        title="AI识图提示词助手"
        description="上传产品图后，本地分析产品外观、颜色和灯饰特征，并结合产品配置中心生成中英文提示词、卖点建议和标题关键词。"
        action={
          <Button onClick={saveRecord} disabled={!analysis}>
            <Save size={16} />保存分析
          </Button>
        }
      />

      <div className="grid grid-cols-[0.82fr_1.18fr] gap-5">
        <GlassPanel>
          <div className="rounded-2xl border border-dashed border-[#e8b8c8] bg-white/55 p-5 text-center">
            <input id="product-image-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <label htmlFor="product-image-upload" className="flex cursor-pointer flex-col items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f6d8e4] text-[#8f405d]">
                <Upload size={24} />
              </span>
              <span className="text-sm font-semibold text-ink">上传产品图片</span>
              <span className="text-xs leading-5 text-muted">支持 JPG / PNG / WebP，图片只在当前浏览器本地处理。</span>
            </label>
          </div>

          {profile ? (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white/65">
              <img src={profile.dataUrl} alt="上传的产品图" className="max-h-[360px] w-full object-contain" />
              <div className="grid grid-cols-3 gap-3 border-t border-white/70 p-4 text-xs text-muted">
                <span>{profile.fileName}</span>
                <span>{profile.width} x {profile.height}</span>
                <span>RGB {profile.dominantRgb.r}, {profile.dominantRgb.g}, {profile.dominantRgb.b}</span>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex min-h-[260px] items-center justify-center rounded-2xl bg-white/45 text-sm text-muted">
              <ImageIcon size={20} className="mr-2" />等待上传产品图片
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field label="产品">
              <Select value={form.productId} onChange={(event) => handleProductChange(event.target.value)}>
                {products.length ? products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                )) : <option value="">暂无产品</option>}
              </Select>
            </Field>
            <Field label="规格SKU">
              <Select value={form.skuId} onChange={(event) => setForm((current) => ({ ...current, skuId: event.target.value }))}>
                {(selectedProduct?.skus || []).map((sku) => (
                  <option key={sku.id} value={sku.id}>{sku.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="颜色">
              <Select value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}>
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="平台">
              <Select value={form.platform} onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}>
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          {!products.length ? (
            <div className="mt-5 rounded-2xl bg-[#fff2f6] p-4 text-sm leading-6 text-[#8f405d]">
              产品配置中心暂无产品。你仍可上传图片分析，但建议先补充产品和SKU，生成结果会更准确。
              <Button variant="ghost" className="ml-2" onClick={() => onNavigate?.('productsCenter')}>去配置</Button>
            </div>
          ) : null}

          {status ? <div className="mt-4 text-sm text-muted">{status}</div> : null}
          {error ? <div className="mt-4 rounded-xl bg-[#fff2f6] px-4 py-3 text-sm text-[#8f405d]">{error}</div> : null}
        </GlassPanel>

        <div className="space-y-5">
          <GlassPanel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">识别结果</h3>
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs text-muted">
                {analysis?.platformLabel || '等待分析'}
              </span>
            </div>
            {analysis ? (
              <div className="grid grid-cols-2 gap-3">
                {resultItems.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/64 p-4">
                    <div className="text-xs text-muted">{label}</div>
                    <div className="mt-2 text-sm font-medium leading-6 text-ink">{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/54 p-6 text-sm leading-6 text-muted">
                上传产品图后会自动提取产品类型、造型、材质、颜色、镂空元素和光效特征。
              </div>
            )}
          </GlassPanel>

          {analysis ? (
            <>
              {[
                ['中文提示词', analysis.chinesePrompt],
                ['英文提示词', analysis.englishPrompt],
                ['卖点建议', analysis.sellingPointSuggestions.join(' / ')],
                ['标题关键词', analysis.titleKeywords.join(' / ')],
              ].map(([label, value]) => (
                <GlassPanel key={label}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-ink">{label}</h3>
                    <Button variant="soft" onClick={() => copyText(value)}>
                      <Copy size={15} />复制
                    </Button>
                  </div>
                  <p className="text-sm leading-7 text-[#5f5559]">{value}</p>
                </GlassPanel>
              ))}
            </>
          ) : null}
        </div>
      </div>

      <GlassPanel className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">分析记录</h3>
            <p className="mt-1 text-sm text-muted">最近保存 30 条，保存在当前浏览器 LocalStorage。</p>
          </div>
          <Button variant="ghost" onClick={clearHistory} disabled={!history.length}>
            <Trash2 size={15} />清空
          </Button>
        </div>

        {history.length ? (
          <div className="grid grid-cols-3 gap-4">
            {history.map((record) => (
              <div key={record.id} className="rounded-2xl bg-white/62 p-4">
                {record.thumbnail ? (
                  <img src={record.thumbnail} alt={record.fileName} className="mb-3 h-28 w-full rounded-xl object-cover" />
                ) : null}
                <div className="text-sm font-semibold text-ink">{record.productName}</div>
                <div className="mt-1 text-xs text-muted">{record.skuName || '-'} · {record.createdAt}</div>
                <div className="mt-3 line-clamp-3 text-xs leading-5 text-muted">{record.analysis?.chinesePrompt}</div>
                <Button
                  variant="soft"
                  className="mt-3 w-full"
                  onClick={() => copyText(record.analysis?.chinesePrompt || '')}
                >
                  <WandSparkles size={14} />复制提示词
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/50 p-6 text-center text-sm text-muted">暂无分析记录。</div>
        )}
      </GlassPanel>
    </>
  );
}
