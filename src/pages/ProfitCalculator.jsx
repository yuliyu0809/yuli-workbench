import { Calculator, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { calculateProfit } from '../utils/profitCalculator.js';

const initialInput = {
  productName: '太阳能煤油灯串',
  price: 49.9,
  cost: 18.8,
  shipping: 5.6,
  adCost: 3.2,
  commissionRate: 7,
  refundRate: 2,
};

function money(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

export function ProfitCalculator({ profitRecords, setProfitRecords }) {
  const [input, setInput] = useState(initialInput);
  const result = useMemo(() => calculateProfit(input), [input]);

  function updateField(field, value) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function saveRecord() {
    const record = {
      id: `profit-${Date.now()}`,
      productName: input.productName,
      price: Number(input.price) || 0,
      profit: result.profit,
      margin: result.margin,
      createdAt: new Date().toLocaleDateString('zh-CN'),
    };
    setProfitRecords([...profitRecords, record]);
  }

  return (
    <>
      <PageHeader
        eyebrow="TEMU Margin Desk"
        title="利润计算器"
        description="针对太阳能灯串和庭院引路灯，输入售价、供货价、运费、广告成本和平台费用，快速判断利润空间。"
        action={<Button onClick={saveRecord}><Save size={16} />保存记录</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="单件利润" value={money(result.profit)} accent={result.profit >= 0 ? '#9cc9bd' : '#e97878'} />
        <MetricCard label="利润率" value={`${result.margin.toFixed(1)}%`} accent="#eaa6bd" />
        <MetricCard label="保本售价" value={money(result.breakEvenPrice)} accent="#f4c76f" />
        <MetricCard label="总成本" value={money(result.totalCost)} accent="#a9b7e8" />
      </div>

      <div className="mt-5 grid grid-cols-[0.9fr_1.1fr] gap-5">
        <GlassPanel>
          <div className="mb-4 flex items-center gap-2">
            <Calculator size={19} className="text-[#a85672]" />
            <h3 className="text-lg font-semibold text-ink">成本参数</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="产品名称">
              <Input value={input.productName} onChange={(e) => updateField('productName', e.target.value)} />
            </Field>
            <Field label="销售价">
              <Input type="number" value={input.price} onChange={(e) => updateField('price', e.target.value)} />
            </Field>
            <Field label="供货价">
              <Input type="number" value={input.cost} onChange={(e) => updateField('cost', e.target.value)} />
            </Field>
            <Field label="运费">
              <Input type="number" value={input.shipping} onChange={(e) => updateField('shipping', e.target.value)} />
            </Field>
            <Field label="广告成本">
              <Input type="number" value={input.adCost} onChange={(e) => updateField('adCost', e.target.value)} />
            </Field>
            <Field label="平台佣金 %">
              <Input type="number" value={input.commissionRate} onChange={(e) => updateField('commissionRate', e.target.value)} />
            </Field>
            <Field label="退款预留 %">
              <Input type="number" value={input.refundRate} onChange={(e) => updateField('refundRate', e.target.value)} />
            </Field>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="text-lg font-semibold text-ink">测算明细</h3>
          <div className="mt-4 space-y-3">
            {[
              ['供货价', money(input.cost)],
              ['运费', money(input.shipping)],
              ['广告成本', money(input.adCost)],
              ['平台佣金', money(result.commission)],
              ['退款预留', money(result.refundReserve)],
              ['建议售价区间', `${money(result.suggestedLow)} - ${money(result.suggestedHigh)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-white/64 px-4 py-3">
                <span className="text-sm text-muted">{label}</span>
                <strong className="text-sm text-ink">{value}</strong>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-5">
        <h3 className="text-lg font-semibold text-ink">最近保存记录</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {profitRecords.slice(-6).reverse().map((record) => (
            <div key={record.id} className="rounded-2xl bg-white/62 p-4">
              <div className="font-medium text-ink">{record.productName}</div>
              <div className="mt-3 text-sm text-muted">利润 {money(record.profit)} · 利润率 {record.margin.toFixed(1)}%</div>
              <div className="mt-2 text-xs text-muted">{record.createdAt}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}
