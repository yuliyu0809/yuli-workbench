import { Copy, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input, Select } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import {
  calculateActivityPrice,
  calculateAdSimulation,
  calculateBreakEvenPrice,
  calculateBundleDiscount,
  calculateDiscountReverse,
  copyResultText,
  formatDiscount,
  formatMoney,
} from '../utils/adCalculator.js';
import { getProductSku } from '../utils/productSchema.js';

function firstInput(products) {
  const product = products[0];
  const sku = product?.skus?.[0];
  return {
    productId: product?.id || 'manual',
    skuId: sku?.id || 'manual-sku',
    productName: product?.name || '手动产品',
    skuName: sku?.name || '手动规格',
    supplyPrice: sku?.supplyPrice || 13.5,
    price: 27.7,
    originalPrice: 27.7,
    discount: 0.75,
    roas: 4.5,
    targetProfit: 3,
    discountMode: 'quick',
    reverseTargetProfit: 3,
    reservedAdCost: 3,
    targetRoas: 4.5,
    quantity: 2,
    bundleDiscount: 0.85,
    bundleAdCost: 3,
    targetTotalProfit: 3,
    breakEvenMode: 'fixed',
    breakEvenTargetProfit: 3,
    breakEvenAdCost: 3,
    breakEvenRoas: 4.5,
  };
}

export function ProfitCenter({ products, profitCenterRecords, setProfitCenterRecords }) {
  const [input, setInput] = useState(() => firstInput(products));
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === input.productId),
    [input.productId, products],
  );
  const selectedSku = useMemo(() => getProductSku(selectedProduct, input.skuId), [input.skuId, selectedProduct]);
  const hasProducts = products.length > 0;
  const invalid = Number(input.supplyPrice) <= 0;

  const roasResult = useMemo(
    () => calculateAdSimulation({ supplyPrice: input.supplyPrice, activityPrice: input.price, roas: input.roas }),
    [input],
  );
  const activityResult = useMemo(() => calculateActivityPrice(input), [input]);
  const discountResult = useMemo(() => calculateDiscountReverse(input), [input]);
  const bundleResult = useMemo(
    () => calculateBundleDiscount({
      supplyPrice: input.supplyPrice,
      unitPrice: input.price,
      quantity: input.quantity,
      bundleDiscount: input.bundleDiscount,
      reservedAdCost: input.bundleAdCost,
    }),
    [input],
  );
  const breakEvenResult = useMemo(() => calculateBreakEvenPrice(input), [input]);

  function updateField(field, value) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function handleProductChange(productId) {
    const product = products.find((item) => item.id === productId);
    const sku = product?.skus?.[0];
    setInput((current) => ({
      ...current,
      productId,
      skuId: sku?.id || 'manual-sku',
      productName: product?.name || current.productName,
      skuName: sku?.name || current.skuName,
      supplyPrice: sku?.supplyPrice ?? current.supplyPrice,
    }));
  }

  function handleSkuChange(skuId) {
    const sku = getProductSku(selectedProduct, skuId);
    setInput((current) => ({
      ...current,
      skuId,
      skuName: sku?.name || current.skuName,
      supplyPrice: sku?.supplyPrice ?? current.supplyPrice,
    }));
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  function copyResult(result, advice, activityPrice = input.price, roas = input.roas) {
    copyText(copyResultText({
      productName: input.productName,
      skuName: input.skuName,
      supplyPrice: input.supplyPrice,
      activityPrice,
      roas,
      adCost: result.adCost ?? result.estimatedAdCost ?? result.reservedAdCost,
      profit: result.profit ?? result.finalProfit ?? result.estimatedProfit,
      margin: result.margin,
      advice,
    }));
  }

  function saveRecord(type, result, activityPrice = input.price, discount = input.discount, roas = input.roas) {
    const record = {
      id: `profit-center-${Date.now()}`,
      type,
      productName: input.productName,
      skuName: input.skuName,
      supplyPrice: Number(input.supplyPrice) || 0,
      activityPrice: Number(activityPrice) || 0,
      discount: Number(discount) || 0,
      roas: Number(roas) || 0,
      adCost: Number(result.adCost ?? result.estimatedAdCost ?? result.reservedAdCost ?? 0),
      finalProfit: Number(result.profit ?? result.finalProfit ?? result.estimatedProfit ?? 0),
      margin: Number(result.margin || 0),
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setProfitCenterRecords([record, ...profitCenterRecords].slice(0, 20));
  }

  return (
    <>
      <PageHeader
        eyebrow="Profit Control Center"
        title="利润中心"
        description="集中判断价格是否赚钱、活动能不能报、ROAS该开多少、最低折扣和最低售价。"
      />

      {invalid ? (
        <div className="mb-5 rounded-2xl border border-[#f0b8c8] bg-[#fff2f6] p-4 text-sm text-[#8f405d]">
          请确认供货价大于 0。涉及 ROAS 的计算也需要 ROAS 大于 0。
        </div>
      ) : null}

      <GlassPanel className="mb-5">
        <div className="grid grid-cols-4 gap-4">
          {hasProducts ? (
            <>
              <Field label="产品名称">
                <Select value={input.productId} onChange={(event) => handleProductChange(event.target.value)}>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </Select>
              </Field>
              <Field label="规格SKU">
                <Select value={input.skuId} onChange={(event) => handleSkuChange(event.target.value)}>
                  {(selectedProduct?.skus || []).map((sku) => <option key={sku.id} value={sku.id}>{sku.name}</option>)}
                </Select>
              </Field>
            </>
          ) : (
            <>
              <Field label="产品名称"><Input value={input.productName} onChange={(e) => updateField('productName', e.target.value)} /></Field>
              <Field label="规格SKU"><Input value={input.skuName} onChange={(e) => updateField('skuName', e.target.value)} /></Field>
            </>
          )}
          <Field label="供货价">
            <Input type="number" value={input.supplyPrice} onChange={(e) => updateField('supplyPrice', e.target.value)} />
          </Field>
          <Field label="售价 / 活动价">
            <Input type="number" value={input.price} onChange={(e) => updateField('price', e.target.value)} />
          </Field>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-2 gap-5">
        <ToolCard title="ROAS利润计算器" onCopy={() => copyResult(roasResult, roasResult.risk)} onSave={() => saveRecord('ROAS利润计算器', roasResult)}>
          <Field label="ROAS"><Input type="number" value={input.roas} onChange={(e) => updateField('roas', e.target.value)} /></Field>
          <Rows rows={[
            ['广告费', formatMoney(roasResult.adCost)],
            ['预计利润', formatMoney(roasResult.profit)],
            ['利润率', `${roasResult.margin.toFixed(2)}%`],
            ['风险等级', roasResult.risk],
          ]} />
        </ToolCard>

        <ToolCard title="活动价计算器" onCopy={() => copyResult(activityResult, activityResult.advice, activityResult.activityPrice)} onSave={() => saveRecord('活动价计算器', activityResult, activityResult.activityPrice)}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="原售价"><Input type="number" value={input.originalPrice} onChange={(e) => updateField('originalPrice', e.target.value)} /></Field>
            <Field label="活动折扣"><Input type="number" step="0.01" value={input.discount} onChange={(e) => updateField('discount', e.target.value)} /></Field>
            <Field label="目标利润"><Input type="number" value={input.targetProfit} onChange={(e) => updateField('targetProfit', e.target.value)} /></Field>
          </div>
          <Rows rows={[
            ['活动价', formatMoney(activityResult.activityPrice)],
            ['广告费', formatMoney(activityResult.adCost)],
            ['最终利润', formatMoney(activityResult.finalProfit)],
            ['利润率', `${activityResult.margin.toFixed(2)}%`],
            ['保本ROAS', activityResult.breakEvenRoas.toFixed(2)],
            ['目标利润ROAS', activityResult.targetProfitRoas.toFixed(2)],
            ['建议', activityResult.advice],
          ]} />
        </ToolCard>

        <ToolCard title="可打折扣反推器" onCopy={() => copyResult(discountResult, discountResult.advice, discountResult.minActivityPrice)} onSave={() => saveRecord('可打折扣反推器', discountResult, discountResult.minActivityPrice, discountResult.minDiscount)}>
          <div className="grid grid-cols-4 gap-3">
            <Field label="模式">
              <Select value={input.discountMode} onChange={(e) => updateField('discountMode', e.target.value)}>
                <option value="quick">快速模式</option>
                <option value="pro">专业模式</option>
              </Select>
            </Field>
            <Field label="原售价"><Input type="number" value={input.originalPrice} onChange={(e) => updateField('originalPrice', e.target.value)} /></Field>
            <Field label="目标利润"><Input type="number" value={input.reverseTargetProfit} onChange={(e) => updateField('reverseTargetProfit', e.target.value)} /></Field>
            {input.discountMode === 'quick' ? (
              <Field label="预留广告费"><Input type="number" value={input.reservedAdCost} onChange={(e) => updateField('reservedAdCost', e.target.value)} /></Field>
            ) : (
              <Field label="目标ROAS"><Input type="number" value={input.targetRoas} onChange={(e) => updateField('targetRoas', e.target.value)} /></Field>
            )}
          </div>
          <Rows rows={[
            ['最低活动价', formatMoney(discountResult.minActivityPrice)],
            ['最低折扣', formatDiscount(discountResult.minDiscount)],
            ['中文折扣', `${(discountResult.minDiscount * 10).toFixed(1)}折`],
            ['预计广告费', formatMoney(discountResult.estimatedAdCost)],
            ['预计利润', formatMoney(discountResult.estimatedProfit)],
            ['风险等级', discountResult.risk],
            ['建议', discountResult.advice],
          ]} />
        </ToolCard>

        <ToolCard title="组合折扣计算器" onCopy={() => copyResult(bundleResult, bundleResult.advice, bundleResult.bundlePrice)} onSave={() => saveRecord('组合折扣计算器', bundleResult, bundleResult.bundlePrice, input.bundleDiscount)}>
          <div className="grid grid-cols-4 gap-3">
            <Field label="购买件数"><Input type="number" value={input.quantity} onChange={(e) => updateField('quantity', e.target.value)} /></Field>
            <Field label="组合折扣"><Input type="number" step="0.01" value={input.bundleDiscount} onChange={(e) => updateField('bundleDiscount', e.target.value)} /></Field>
            <Field label="预留广告费"><Input type="number" value={input.bundleAdCost} onChange={(e) => updateField('bundleAdCost', e.target.value)} /></Field>
            <Field label="目标总利润"><Input type="number" value={input.targetTotalProfit} onChange={(e) => updateField('targetTotalProfit', e.target.value)} /></Field>
          </div>
          <Rows rows={[
            ['组合成交价', formatMoney(bundleResult.bundlePrice)],
            ['总供货价', formatMoney(bundleResult.totalCost)],
            ['预留广告费', formatMoney(bundleResult.reservedAdCost)],
            ['最终利润', formatMoney(bundleResult.finalProfit)],
            ['单件利润', formatMoney(bundleResult.unitProfit)],
            ['利润率', `${bundleResult.margin.toFixed(2)}%`],
            ['建议', bundleResult.advice],
          ]} />
        </ToolCard>

        <ToolCard title="保本售价计算器" onCopy={() => copyResult(breakEvenResult, breakEvenResult.suggestedRange, breakEvenResult.minPrice)} onSave={() => saveRecord('保本售价计算器', breakEvenResult, breakEvenResult.minPrice)}>
          <div className="grid grid-cols-4 gap-3">
            <Field label="模式">
              <Select value={input.breakEvenMode} onChange={(e) => updateField('breakEvenMode', e.target.value)}>
                <option value="fixed">固定广告费</option>
                <option value="roas">ROAS模式</option>
              </Select>
            </Field>
            <Field label="目标利润"><Input type="number" value={input.breakEvenTargetProfit} onChange={(e) => updateField('breakEvenTargetProfit', e.target.value)} /></Field>
            {input.breakEvenMode === 'fixed' ? (
              <Field label="预留广告费"><Input type="number" value={input.breakEvenAdCost} onChange={(e) => updateField('breakEvenAdCost', e.target.value)} /></Field>
            ) : (
              <Field label="目标ROAS"><Input type="number" value={input.breakEvenRoas} onChange={(e) => updateField('breakEvenRoas', e.target.value)} /></Field>
            )}
          </div>
          <Rows rows={[
            ['最低售价', formatMoney(breakEvenResult.minPrice)],
            ['预计广告费', formatMoney(breakEvenResult.estimatedAdCost)],
            ['预计利润', formatMoney(breakEvenResult.estimatedProfit)],
            ['建议售价区间', breakEvenResult.suggestedRange],
          ]} />
        </ToolCard>
      </div>

      <GlassPanel className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">利润计算历史</h3>
          <Button variant="ghost" onClick={() => setProfitCenterRecords([])}><Trash2 size={15} />清空历史</Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {profitCenterRecords.slice(0, 20).map((record) => (
            <div key={record.id} className="rounded-2xl bg-white/62 p-4">
              <div className="font-medium text-ink">{record.type}</div>
              <div className="mt-1 text-xs text-muted">{record.productName} · {record.skuName}</div>
              <div className="mt-3 text-sm leading-6 text-muted">
                价格 {formatMoney(record.activityPrice)}<br />
                利润 {formatMoney(record.finalProfit)}<br />
                利润率 {Number(record.margin || 0).toFixed(2)}%
              </div>
              <Button variant="ghost" className="mt-2 min-h-8 px-2 py-1" onClick={() => copyResult(record, record.type, record.activityPrice, record.roas)}>
                <Copy size={14} />复制
              </Button>
            </div>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}

function ToolCard({ title, children, onCopy, onSave }) {
  return (
    <GlassPanel>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <div className="flex gap-2">
          <Button variant="soft" onClick={onCopy}><Copy size={15} />一键复制</Button>
          <Button variant="blush" onClick={onSave}><Save size={15} />保存</Button>
        </div>
      </div>
      {children}
    </GlassPanel>
  );
}

function Rows({ rows }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between rounded-2xl bg-white/64 px-4 py-3">
          <span className="text-sm text-muted">{label}</span>
          <strong className="text-sm text-ink">{value}</strong>
        </div>
      ))}
    </div>
  );
}
