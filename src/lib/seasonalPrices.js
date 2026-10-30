// November 2026 supplier price sheet. These are shared by AG, DS and HX.
const november2026 = {
  P0052: [
    { cost: 4.5, minimumSalePrice: 8.5 },
    { cost: 5.5, minimumSalePrice: 10.3 },
    { cost: 8.8, minimumSalePrice: 14.3 },
    { cost: 12, minimumSalePrice: 18.5 },
  ],
  P0062: [
    { cost: 5, minimumSalePrice: 9.52 },
    { cost: 6, minimumSalePrice: 11.43 },
    { cost: 9.5, minimumSalePrice: 16.52 },
    { cost: 13, minimumSalePrice: 20.8 },
  ],
};

const productIdFor = (product) => {
  if (november2026[product?.id]) return product.id;
  const name = String(product?.productName || '');
  if (name.startsWith('USB银线鞭炮灯')) return 'P0052';
  if (name.startsWith('电池盒银线鞭炮灯')) return 'P0062';
  return null;
};

const specIndexFor = (spec) => {
  const id = String(spec?.baseSpecId || spec?.id || '');
  const idMatch = id.match(/P00(?:52|62)-spec-([1-4])(?:-pack-\d+)?$/);
  if (idMatch) return Number(idMatch[1]) - 1;
  const name = String(spec?.baseSpecName || spec?.name || '').replace(/\s/g, '');
  return ['1.5+2米50灯', '3+2米100灯', '6+2米200灯', '9+2米300灯'].findIndex((prefix) => name.startsWith(prefix));
};

const shanghaiYearMonth = (date) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit' }).formatToParts(date);
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
};

export function novemberPriceFor(product, spec, date = new Date()) {
  if (shanghaiYearMonth(date) !== '2026-11') return null;
  const productId = productIdFor(product);
  const index = specIndexFor(spec);
  const basePrice = november2026[productId]?.[index];
  if (!basePrice) return null;
  const namePack = String(spec?.name || '').match(/[·\s](\d+)件装/);
  const packQuantity = Math.max(1, Number(spec?.packQuantity || namePack?.[1]) || 1);
  return {
    cost: Number((basePrice.cost * packQuantity).toFixed(2)),
    minimumSalePrice: packQuantity === 1 ? basePrice.minimumSalePrice : null,
    packQuantity,
  };
}

export function novemberPricingActive(date = new Date()) {
  return shanghaiYearMonth(date) === '2026-11';
}
