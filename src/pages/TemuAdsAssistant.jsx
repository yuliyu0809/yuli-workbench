import { Copy, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input, Select } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import {
  calculateActivityPrice,
  calculateAdSimulation,
  calculateDiscountReverse,
  calculateRoasRecommendations,
  copyResultText,
  formatDiscount,
  formatMoney,
  getRecommendedTier,
} from '../utils/adCalculator.js';
import { getProductSku } from '../utils/productSchema.js';

const tierCards = [
  { title: '激进测款档', roas: '3.5 - 4.2', text: '快速测款、优先拿前10单、利润较低' },
  { title: '平衡出单档', roas: '4.5 - 5.5', text: '兼顾销量和利润，适合已有基础销量产品' },
  { title: '利润优先档', roas: '6+', text: '控制广告成本，利润优先，适合稳定链接' },
];

function firstInput(products) {
  const product = products[0];
  const sku = product?.skus?.[0];
  return {
    productId: product?.id || 'manual',
    skuId: sku?.id || 'manual-sku',
    productName: product?.name || '手动产品',
    skuName: sku?.name || '手动规格',
    supplyPrice: sku?.supplyPrice || 13.5,
    activityPrice: 20.79,
    originalPrice: 27.7,
    discount: 0.7,
    roas: 4.68,
    targetProfit: 3,
    isNewProduct: 'yes',
    discountMode: 'quick',
    reverseTargetProfit: 3,
    reservedAdCost: 3,
    targetRoas: 4.5,
  };
}

function numberValue(value) {
  return Number(value) || 0;
}

export function TemuAdsAssistant({ products, adRecords, setAdRecords }) {
  const [input, setInput] = useState(() => firstInput(products));
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === input.productId),
    [input.productId, products],
  );
  const selectedSku = useMemo(() => getProductSku(selectedProduct, input.skuId), [input.skuId, selectedProduct]);

  useEffect(() => {
    if (!products.length) return;
    const validProduct = products.find((product) => product.id === input.productId) || products[0];
    const validSku = validProduct?.skus?.find((sku) => sku.id === input.skuId) || validProduct?.skus?.[0];
    if (validProduct && (input.productId !== validProduct.id || input.skuId !== validSku?.id || input.productName !== validProduct.name || input.skuName !== validSku?.name || Number(input.supplyPrice) !== Number(validSku?.supplyPrice || 0))) {
      setInput((current) => ({
        ...current,
        productId: validProduct.id,
        skuId: validSku?.id || '',
        productName: validProduct.name,
        skuName: validSku?.name || current.skuName,
        supplyPrice: validSku?.supplyPrice ?? current.supplyPrice,
      }));
    }
  }, [input.productId, input.productName, input.skuId, input.skuName, input.supplyPrice, products]);

  const roasRecommendation = useMemo(() => calculateRoasRecommendations(input), [input]);
  const adSimulation = useMemo(() => calculateAdSimulation(input), [input]);
  const activityResult = useMemo(() => calculateActivityPrice(input), [input]);
  const discountReverse = useMemo(() => calculateDiscountReverse(input), [input]);
  const recommendedTier = getRecommendedTier(adSimulation.profit);
  const hasProducts = products.length > 0;
  const hasInputIssue = numberValue(input.supplyPrice) <= 0 || numberValue(input.activityPrice) <= 0 || numberValue(input.roas) <= 0;

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

  function copyCurrent(result, advice) {
    copyText(copyResultText({
      productName: input.productName,
      skuName: input.skuName,
      supplyPrice: input.supplyPrice,
      activityPrice: result.activityPrice ?? input.activityPrice,
      roas: input.roas,
      adCost: result.adCost ?? result.estimatedAdCost,
      profit: result.profit ?? result.finalProfit ?? result.estimatedProfit,
      margin: result.margin,
      advice,
    }));
  }

  function copyDiscountReverse() {
    copyText([
      `产品：${input.productName || '-'}`,
      `规格：${input.skuName || '-'}`,
      `供货价：${formatMoney(input.supplyPrice)}`,
      `原售价：${formatMoney(input.originalPrice)}`,
      `最低活动价：${formatMoney(discountReverse.minActivityPrice)}`,
      `最低折扣：${formatDiscount(discountReverse.minDiscount)}`,
      `预计广告费：${formatMoney(discountReverse.estimatedAdCost)}`,
      `预计利润：${formatMoney(discountReverse.estimatedProfit)}`,
      `建议：${discountReverse.advice}`,
    ].join('\n'));
  }

  function saveRecord() {
    const record = {
      id: `ad-${Date.now()}`,
      productName: input.productName,
      skuName: input.skuName,
      supplyPrice: numberValue(input.supplyPrice),
      activityPrice: activityResult.activityPrice,
      roas: numberValue(input.roas),
      finalProfit: activityResult.finalProfit,
      recommendedTier,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setAdRecords([record, ...adRecords].slice(0, 10));
  }

  return (
    <>
      <PageHeader
        eyebrow="TEMU Ads Desk"
        title="TEMU广告助手"
        description="新品ROAS档位、广告利润模拟、TEMU活动价计算和可打折扣反推集中在一个模块。"
        action={<Button onClick={saveRecord} disabled={hasInputIssue}><Save size={16} />保存记录</Button>}
      />

      {hasInputIssue ? (
        <div className="mb-5 rounded-2xl border border-[#f0b8c8] bg-[#fff2f6] p-4 text-sm text-[#8f405d]">
          请确认供货价、活动价和ROAS都大于 0，计算结果才有参考价值。
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
              <Field label="产品名称">
                <Input value={input.productName} onChange={(event) => updateField('productName', event.target.value)} />
              </Field>
              <Field label="规格SKU">
                <Input value={input.skuName} onChange={(event) => updateField('skuName', event.target.value)} />
              </Field>
            </>
          )}
          <Field label="供货价">
            <Input type="number" value={input.supplyPrice} onChange={(event) => updateField('supplyPrice', event.target.value)} />
          </Field>
          <Field label="是否新品">
            <Select value={input.isNewProduct} onChange={(event) => updateField('isNewProduct', event.target.value)}>
              <option value="yes">是</option>
              <option value="no">否</option>
            </Select>
          </Field>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-2 gap-5">
        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">新品ROAS档位推荐</h3>
            <Button variant="soft" onClick={() => copyCurrent(adSimulation, recommendedTier)}><Copy size={15} />一键复制</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="活动价">
              <Input type="number" value={input.activityPrice} onChange={(event) => updateField('activityPrice', event.target.value)} />
            </Field>
            <Field label="目标利润">
              <Input type="number" value={input.targetProfit} onChange={(event) => updateField('targetProfit', event.target.value)} />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <MetricCard label="保本ROAS" value={roasRecommendation.breakEvenRoas.toFixed(2)} accent="#eaa6bd" />
            <MetricCard label="利润3元" value={roasRecommendation.profit3Roas.toFixed(2)} accent="#f4c76f" />
            <MetricCard label="利润5元" value={roasRecommendation.profit5Roas.toFixed(2)} accent="#9cc9bd" />
            <MetricCard label="利润8元" value={roasRecommendation.profit8Roas.toFixed(2)} accent="#a9b7e8" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {tierCards.map((tier) => (
              <div key={tier.title} className="rounded-2xl bg-white/64 p-3">
                <div className="font-medium text-ink">{tier.title}</div>
                <div className="mt-1 text-xs text-muted">ROAS {tier.roas}</div>
                <div className="mt-1 text-xs leading-5 text-muted">{tier.text}</div>
              </div>
            ))}
          </div>
          {input.isNewProduct === 'yes' ? (
            <div className="mt-4 rounded-2xl bg-[#fff7fa]/80 p-3 text-sm leading-6 text-[#8f405d]">
              新品前10单可以接受较低利润，优先获取基础销量和链接权重。
            </div>
          ) : null}
        </GlassPanel>

        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">广告利润模拟器</h3>
            <Button variant="soft" onClick={() => copyCurrent(adSimulation, adSimulation.risk)}><Copy size={15} />一键复制</Button>
          </div>
          <Field label="ROAS">
            <Input type="number" value={input.roas} onChange={(event) => updateField('roas', event.target.value)} />
          </Field>
          <div className="mt-4 space-y-3">
            {[
              ['预计广告费', formatMoney(adSimulation.adCost)],
              ['预计利润', formatMoney(adSimulation.profit)],
              ['预计利润率', `${adSimulation.margin.toFixed(2)}%`],
              ['风险等级', adSimulation.risk],
            ].map(([label, value]) => (
              <ResultRow key={label} label={label} value={value} />
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">TEMU活动价计算器</h3>
            <Button variant="soft" onClick={() => copyCurrent(activityResult, activityResult.advice)}><Copy size={15} />一键复制</Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="原售价">
              <Input type="number" value={input.originalPrice} onChange={(event) => updateField('originalPrice', event.target.value)} />
            </Field>
            <Field label="活动折扣（8=8折 / 0.8=8折 / 80=80%）">
              <Input type="number" step="0.01" value={input.discount} onChange={(event) => updateField('discount', event.target.value)} />
            </Field>
            <Field label="当前ROAS">
              <Input type="number" value={input.roas} onChange={(event) => updateField('roas', event.target.value)} />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['活动价', formatMoney(activityResult.activityPrice)],
              ['广告费', formatMoney(activityResult.adCost)],
              ['最终利润', formatMoney(activityResult.finalProfit)],
              ['利润率', `${activityResult.margin.toFixed(2)}%`],
              ['保本ROAS', activityResult.breakEvenRoas.toFixed(2)],
              ['目标利润ROAS', activityResult.targetProfitRoas.toFixed(2)],
            ].map(([label, value]) => <ResultRow key={label} label={label} value={value} />)}
          </div>
          <div className="mt-4 rounded-2xl bg-[#fff7fa]/80 p-3 text-sm leading-6 text-[#8f405d]">
            {activityResult.advice}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">可打折扣反推器</h3>
            <Button variant="soft" onClick={copyDiscountReverse}><Copy size={15} />一键复制</Button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Field label="模式">
              <Select value={input.discountMode} onChange={(event) => updateField('discountMode', event.target.value)}>
                <option value="quick">快速模式</option>
                <option value="pro">专业模式</option>
              </Select>
            </Field>
            <Field label="原售价">
              <Input type="number" value={input.originalPrice} onChange={(event) => updateField('originalPrice', event.target.value)} />
            </Field>
            <Field label="目标利润">
              <Input type="number" value={input.reverseTargetProfit} onChange={(event) => updateField('reverseTargetProfit', event.target.value)} />
            </Field>
            {input.discountMode === 'quick' ? (
              <Field label="预留广告费">
                <Input type="number" value={input.reservedAdCost} onChange={(event) => updateField('reservedAdCost', event.target.value)} />
              </Field>
            ) : (
              <Field label="目标ROAS">
                <Input type="number" value={input.targetRoas} onChange={(event) => updateField('targetRoas', event.target.value)} />
              </Field>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              ['最低活动价', formatMoney(discountReverse.minActivityPrice)],
              ['最低折扣', formatDiscount(discountReverse.minDiscount)],
              ['预计广告费', formatMoney(discountReverse.estimatedAdCost)],
              ['预计利润', formatMoney(discountReverse.estimatedProfit)],
              ['建议活动档位', discountReverse.suggestedDiscount],
              ['风险等级', discountReverse.risk],
            ].map(([label, value]) => <ResultRow key={label} label={label} value={value} />)}
          </div>
          <div className="mt-4 rounded-2xl bg-[#fff7fa]/80 p-3 text-sm leading-6 text-[#8f405d]">
            {discountReverse.advice}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">广告计算历史</h3>
          <Button variant="ghost" onClick={() => setAdRecords([])}><Trash2 size={15} />清空历史</Button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {adRecords.slice(0, 10).map((record) => (
            <div key={record.id} className="rounded-2xl bg-white/62 p-4">
              <div className="font-medium text-ink">{record.productName}</div>
              <div className="mt-1 text-xs text-muted">{record.skuName}</div>
              <div className="mt-3 text-sm leading-6 text-muted">
                活动价 {formatMoney(record.activityPrice)}<br />
                ROAS {Number(record.roas).toFixed(2)}<br />
                利润 {formatMoney(record.finalProfit)}
              </div>
              <div className="mt-2 text-xs text-muted">{record.recommendedTier}</div>
              <div className="mt-2 text-xs text-muted">{record.createdAt}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/64 px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <strong className="text-sm text-ink">{value}</strong>
    </div>
  );
}
