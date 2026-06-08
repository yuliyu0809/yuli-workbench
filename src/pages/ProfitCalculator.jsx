import { Calculator, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field, Input, Select } from '../components/Field.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { calculateSkuProfit } from '../utils/profitCalculator.js';
import { parseDiscountInput } from '../utils/discountUtils.js';
import { getProductSku } from '../utils/productSchema.js';

function money(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

export function ProfitCalculator({ products, profitRecords, setProfitRecords }) {
  const firstProduct = products[0];
  const [input, setInput] = useState({
    productId: firstProduct?.id || '',
    skuId: firstProduct?.skus?.[0]?.id || '',
    price: 49.9,
    roas: 3,
    discount: 0,
  });

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === input.productId) || firstProduct,
    [firstProduct, input.productId, products],
  );
  const selectedSku = useMemo(
    () => getProductSku(selectedProduct, input.skuId),
    [input.skuId, selectedProduct],
  );

  useEffect(() => {
    if (!products.length) return;
    const validProduct = products.find((product) => product.id === input.productId) || products[0];
    const validSku = validProduct?.skus?.find((sku) => sku.id === input.skuId) || validProduct?.skus?.[0];
    if (validProduct && (input.productId !== validProduct.id || input.skuId !== validSku?.id)) {
      setInput((current) => ({
        ...current,
        productId: validProduct.id,
        skuId: validSku?.id || '',
      }));
    }
  }, [input.productId, input.skuId, products]);
  const result = useMemo(
    () => calculateSkuProfit({ ...input, supplyPrice: selectedSku?.supplyPrice || 0 }),
    [input, selectedSku],
  );

  function updateField(field, value) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function handleProductChange(productId) {
    const product = products.find((item) => item.id === productId);
    setInput((current) => ({
      ...current,
      productId,
      skuId: product?.skus?.[0]?.id || '',
    }));
  }

  function saveRecord() {
    if (!selectedProduct || !selectedSku) {
      return;
    }
    const record = {
      id: `profit-${Date.now()}`,
      productName: selectedProduct.name,
      skuName: selectedSku.name,
      price: Number(input.price) || 0,
      roas: Number(input.roas) || 0,
      discount: parseDiscountInput(input.discount),
      supplyPrice: selectedSku.supplyPrice,
      profit: result.profit,
      margin: result.margin,
      createdAt: new Date().toLocaleDateString('zh-CN'),
    };
    setProfitRecords([...profitRecords, record]);
  }

  return (
    <>
      <PageHeader
        eyebrow="SKU Margin Desk"
        title="利润计算器"
        description="先选择产品和规格 SKU，系统自动带出供货价。你只需要输入售价、ROAS 和折扣，即可测算利润。"
        action={<Button onClick={saveRecord} disabled={!selectedSku}><Save size={16} />保存记录</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="单件利润" value={money(result.profit)} accent={result.profit >= 0 ? '#9cc9bd' : '#e97878'} />
        <MetricCard label="利润率" value={`${result.margin.toFixed(1)}%`} accent="#eaa6bd" />
        <MetricCard label="折后售价" value={money(result.actualPrice)} accent="#f4c76f" />
        <MetricCard label="广告成本" value={money(result.adCost)} accent="#a9b7e8" />
      </div>

      <div className="mt-5 grid grid-cols-[0.9fr_1.1fr] gap-5">
        <GlassPanel>
          <div className="mb-4 flex items-center gap-2">
            <Calculator size={19} className="text-[#a85672]" />
            <h3 className="text-lg font-semibold text-ink">利润参数</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="产品">
              <Select value={input.productId} onChange={(event) => handleProductChange(event.target.value)}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="规格SKU">
              <Select value={input.skuId} onChange={(event) => updateField('skuId', event.target.value)}>
                {(selectedProduct?.skus || []).map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="供货价">
              <Input value={selectedSku?.supplyPrice ?? ''} readOnly />
            </Field>
            <Field label="售价">
              <Input type="number" value={input.price} onChange={(event) => updateField('price', event.target.value)} />
            </Field>
            <Field label="ROAS">
              <Input type="number" value={input.roas} onChange={(event) => updateField('roas', event.target.value)} />
            </Field>
            <Field label="折扣（8=8折 / 0.8=8折 / 80=80%）">
              <Input type="number" value={input.discount} onChange={(event) => updateField('discount', event.target.value)} />
            </Field>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="text-lg font-semibold text-ink">测算明细</h3>
          <div className="mt-4 space-y-3">
            {[
              ['产品', selectedProduct?.name || '-'],
              ['规格SKU', selectedSku?.name || '-'],
              ['供货价', money(selectedSku?.supplyPrice)],
              ['原售价', money(input.price)],
              ['折后售价', money(result.actualPrice)],
              ['ROAS广告成本', money(result.adCost)],
              ['利润', money(result.profit)],
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
              <div className="mt-1 text-xs text-muted">{record.skuName || '未记录SKU'}</div>
              <div className="mt-3 text-sm text-muted">利润 {money(record.profit)} · 利润率 {Number(record.margin || 0).toFixed(1)}%</div>
              <div className="mt-2 text-xs text-muted">{record.createdAt}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}
