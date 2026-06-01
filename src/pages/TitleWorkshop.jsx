import { Copy, Save, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input, Select, Textarea } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { generateTitles } from '../utils/titleGenerator.js';

const initialForm = {
  englishName: '10LED Solar Kerosene Lantern String Lights',
  keyword: 'solar lantern string lights',
  feature: 'IP44 solar powered warm white outdoor decorative lighting',
  scene: 'European patio, balcony, garden and porch decor',
  audience: 'TEMU Europe garden and balcony decor buyers',
  style: 'conversion',
};

export function TitleWorkshop({ titles, setTitles }) {
  const [form, setForm] = useState(initialForm);
  const [results, setResults] = useState(() => generateTitles(initialForm));

  const savedPreview = useMemo(() => titles.slice(-3).reverse(), [titles]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleGenerate() {
    setResults(generateTitles(form));
  }

  function saveTitle(title) {
    if (!titles.includes(title)) {
      setTitles([...titles, title]);
    }
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <>
      <PageHeader
        eyebrow="TEMU Title Studio"
        title="标题工坊"
        description="面向 TEMU 太阳能灯饰标题，默认强调 IP44、太阳能、庭院、阳台、花园和门廊场景。"
        action={<Button onClick={handleGenerate}><WandSparkles size={16} />生成标题</Button>}
      />

      <div className="grid grid-cols-[0.92fr_1.08fr] gap-5">
        <GlassPanel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="英文产品名">
              <Input value={form.englishName} onChange={(e) => updateField('englishName', e.target.value)} />
            </Field>
            <Field label="核心关键词">
              <Input value={form.keyword} onChange={(e) => updateField('keyword', e.target.value)} />
            </Field>
            <Field label="目标人群">
              <Input value={form.audience} onChange={(e) => updateField('audience', e.target.value)} />
            </Field>
            <Field label="标题风格">
              <Select value={form.style} onChange={(e) => updateField('style', e.target.value)}>
                <option value="conversion">高转化型</option>
                <option value="simple">简洁型</option>
                <option value="keyword">关键词覆盖型</option>
                <option value="gift">礼品场景型</option>
              </Select>
            </Field>
            <Field label="核心卖点">
              <Textarea value={form.feature} onChange={(e) => updateField('feature', e.target.value)} />
            </Field>
            <Field label="使用场景">
              <Textarea value={form.scene} onChange={(e) => updateField('scene', e.target.value)} />
            </Field>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="mb-4 text-lg font-semibold text-ink">生成结果</h3>
          <div className="space-y-3">
            {results.map((title) => (
              <div key={title} className="rounded-2xl bg-white/68 p-4">
                <p className="text-sm leading-6 text-ink">{title}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="soft" onClick={() => copyText(title)}><Copy size={15} />复制</Button>
                  <Button variant="blush" onClick={() => saveTitle(title)}><Save size={15} />保存</Button>
                  <span className="ml-auto self-center text-xs text-muted">{title.length} 字符</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-5">
        <h3 className="text-lg font-semibold text-ink">最近保存</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {savedPreview.map((item) => (
            <div key={item} className="rounded-2xl bg-white/62 p-4 text-sm leading-6 text-muted">{item}</div>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}
