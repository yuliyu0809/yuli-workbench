import { ClipboardCopy, Sparkles, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

const tiers = [
  { id: '8', label: '8折', rate: 0.8 },
  { id: '85', label: '8.5折', rate: 0.85 },
  { id: '9', label: '9折', rate: 0.9 },
];

function numberValue(value) {
  const parsed = Number(String(value ?? '').replace(/[¥￥,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return `¥${numberValue(value).toFixed(2)}`;
}

function plainMoney(value) {
  return numberValue(value).toFixed(2).replace(/\.00$/, '');
}

function discountLabel(rate) {
  if (!rate) return '-';
  return `${(rate * 10).toFixed(1).replace(/\.0$/, '')}折`;
}

function profitTone(value) {
  const profit = numberValue(value);
  if (profit < 0) return 'text-[#b83d3d]';
  if (profit < 3) return 'text-[#9b6a00]';
  return 'text-[#1f6736]';
}

function calculate(input) {
  const supplyPrice = numberValue(input.supplyPrice);
  const originalPrice = numberValue(input.originalPrice);
  const roas = numberValue(input.roas);
  const targetProfit = numberValue(input.targetProfit);
  const reservedAdCost = numberValue(input.reservedAdCost);
  const roasFactor = roas > 1 ? 1 - 1 / roas : 0;
  const tierRows = tiers.map((tier) => {
    const activityPrice = originalPrice * tier.rate;
    const roasAdCost = roas > 0 ? activityPrice / roas : 0;
    const profit = activityPrice - supplyPrice - roasAdCost - reservedAdCost;
    return { ...tier, activityPrice, roasAdCost, profit };
  });
  const breakEvenPrice = roasFactor > 0 ? (supplyPrice + reservedAdCost) / roasFactor : 0;
  const minimumActivityPrice = roasFactor > 0 ? (supplyPrice + reservedAdCost + targetProfit) / roasFactor : 0;
  const breakEvenDiscount = originalPrice > 0 ? breakEvenPrice / originalPrice : 0;
  const suggestedTier = tierRows.find((row) => row.profit >= targetProfit);
  const profitableTier = tierRows.find((row) => row.profit >= 0);

  let status = {
    tone: 'bg-[#fff4e8] text-[#8a5a00]',
    title: '请先输入有效价格和 ROAS',
    description: 'ROAS 需要大于 1，系统才能反推保本活动价和建议折扣。',
    copyTier: '-',
  };

  if (originalPrice > 0 && supplyPrice > 0 && roasFactor > 0) {
    if (suggestedTier?.id === '8') {
      status = {
        tone: 'bg-[#eefaf1] text-[#1f6736]',
        title: '✅ 可打8折',
        description: '8折后仍能覆盖供货价、ROAS广告费、预留广告费和目标利润。',
        copyTier: suggestedTier.label,
      };
    } else if (suggestedTier) {
      status = {
        tone: 'bg-[#fff4e8] text-[#8a5a00]',
        title: `⚠️ 最低建议${suggestedTier.label}`,
        description: `${suggestedTier.label}起可达到当前目标利润，低于该档位利润不足。`,
        copyTier: suggestedTier.label,
      };
    } else if (profitableTier?.id === '9') {
      status = {
        tone: 'bg-[#fff4e8] text-[#8a5a00]',
        title: '⚠️ 9折可保本，目标利润不足',
        description: '当前参数下 9折不亏本，但达不到目标利润。',
        copyTier: '9折保本',
      };
    } else {
      status = {
        tone: 'bg-[#fff0f0] text-[#a33]',
        title: '❌ 低于9折会亏损',
        description: '当前参数下活动折扣空间很小，建议调高售价、降低成本或提高ROAS。',
        copyTier: '不可报活动',
      };
    }
  }

  return {
    supplyPrice,
    originalPrice,
    roas,
    targetProfit,
    reservedAdCost,
    tierRows,
    minimumActivityPrice,
    breakEvenPrice,
    breakEvenDiscount,
    status,
  };
}

export function QuickActivityCalculator() {
  const [input, setInput] = useState({
    supplyPrice: '16.5',
    originalPrice: '29.7',
    roas: '4.68',
    targetProfit: '3',
    reservedAdCost: '3',
  });
  const result = useMemo(() => calculate(input), [input]);

  function updateField(field, value) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  async function copyResult() {
    const text = [
      `供货价：${plainMoney(result.supplyPrice)}`,
      `售价：${plainMoney(result.originalPrice)}`,
      `ROAS：${plainMoney(result.roas)}`,
      `保本折扣：${discountLabel(result.breakEvenDiscount)}`,
      `建议活动：${result.status.copyTier}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    window.alert('测算结果已复制。');
  }

  return (
    <>
      <PageHeader
        eyebrow="Quick Activity Check"
        title="快速活动测算"
        description="临时报活动时快速判断最低折扣、保本空间和是否亏损。此工具独立测算，不读取产品信息库，不写入商品档案，也不同步云端。"
        action={<Button onClick={copyResult}><ClipboardCopy size={16} />一键复制结果</Button>}
      />

      <div className={`mb-5 rounded-3xl px-5 py-4 ${result.status.tone}`}>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Zap size={20} />
          <span>{result.status.title}</span>
        </div>
        <p className="mt-1 text-sm leading-6 opacity-85">{result.status.description}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="最低活动价" value={money(result.minimumActivityPrice)} accent="#9cc9bd" />
        <MetricCard label="保本活动价" value={money(result.breakEvenPrice)} accent="#f4c76f" />
        <MetricCard label="保本折扣" value={discountLabel(result.breakEvenDiscount)} accent="#eaa6bd" />
        <MetricCard label="建议活动" value={result.status.copyTier} accent="#a9b7e8" />
      </div>

      <div className="mt-5 grid grid-cols-[0.8fr_1.2fr] gap-5">
        <GlassPanel>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={19} className="text-[#a85672]" />
            <h3 className="text-lg font-semibold text-ink">测算参数</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="供货价">
              <Input type="number" step="0.01" value={input.supplyPrice} onChange={(event) => updateField('supplyPrice', event.target.value)} />
            </Field>
            <Field label="原售价">
              <Input type="number" step="0.01" value={input.originalPrice} onChange={(event) => updateField('originalPrice', event.target.value)} />
            </Field>
            <Field label="ROAS">
              <Input type="number" step="0.01" value={input.roas} onChange={(event) => updateField('roas', event.target.value)} />
            </Field>
            <Field label="目标利润">
              <Input type="number" step="0.01" value={input.targetProfit} onChange={(event) => updateField('targetProfit', event.target.value)} />
            </Field>
            <Field label="预留广告费">
              <Input type="number" step="0.01" value={input.reservedAdCost} onChange={(event) => updateField('reservedAdCost', event.target.value)} />
            </Field>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="text-lg font-semibold text-ink">折扣档利润</h3>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white/58">
            <div className="grid grid-cols-[0.8fr_1fr_1fr_1fr] border-b border-[#e8edf1] bg-white/72 px-4 py-3 text-xs font-medium text-muted">
              <span>折扣档</span>
              <span>活动价</span>
              <span>ROAS广告费</span>
              <span>预计利润</span>
            </div>
            {result.tierRows.map((row) => (
              <div key={row.id} className="grid grid-cols-[0.8fr_1fr_1fr_1fr] border-t border-[#e8edf1] px-4 py-3 text-sm text-ink first:border-t-0">
                <span className="font-semibold">{row.label}</span>
                <span>{money(row.activityPrice)}</span>
                <span>{money(row.roasAdCost)}</span>
                <span className={`font-semibold ${profitTone(row.profit)}`}>{money(row.profit)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/64 px-4 py-3">
              <div className="text-xs text-muted">计算口径</div>
              <div className="mt-1 text-sm font-semibold text-ink">活动价 - 供货价 - ROAS广告费 - 预留广告费</div>
            </div>
            <div className="rounded-2xl bg-white/64 px-4 py-3">
              <div className="text-xs text-muted">最低活动价</div>
              <div className="mt-1 text-sm font-semibold text-ink">达到目标利润所需售价</div>
            </div>
            <div className="rounded-2xl bg-white/64 px-4 py-3">
              <div className="text-xs text-muted">保本活动价</div>
              <div className="mt-1 text-sm font-semibold text-ink">利润为 0 的临界售价</div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
