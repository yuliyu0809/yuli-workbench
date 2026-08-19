import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './lib/supabaseClient.js';
import { lightingCatalogVersion, lightingProductCatalog } from './data/lightingProductCatalog.js';

const STORE_ALL = '全部店铺';
const stores = ['AG', 'DS', 'HX'];
const sourceProductCategories = [...new Set(lightingProductCatalog.map((item) => item.sourceCategory).filter(Boolean))];
const tiers = [0.9, 0.85, 0.8, 0.75, 0.7];
const emptyWorkspace = { discounts: [], priceReferences: [], products: [], operations: [], tasks: [], launches: [] };
const nav = [
  ['overview', '⌂', '运营总览'],
  ['discounts', '%', '商品折扣'],
  ['data', '⌁', '运营数据'],
  ['products', '□', '商品档案'],
  ['tasks', '✓', '运营任务'],
];
const titles = {
  overview: ['早上好，郁荔', '这是三个店铺今天的运营情况。'],
  discounts: ['商品折扣', '按照成本与售价自动计算可承受的折扣档位。'],
  data: ['运营数据', '记录并对比 AG、DS、HX 的每日核心指标。'],
  products: ['商品档案', '已按《灯饰产品价格表（20260818）》整理，保留商品规格、供货成本与包装信息。'],
  tasks: ['运营任务', '把每天要做的事放在一个清晰的队列里。'],
};

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const launchQuantity = (item) => Math.max(1, Number(item?.quantity) || 1);
const money = (value) => `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
const signedMoney = (value) => `${Number(value) > 0 ? '+' : Number(value) < 0 ? '−' : ''}${money(Math.abs(Number(value) || 0))}`;
const discountText = (value) => value ? `${Number((value * 10).toFixed(1))}折` : '不建议打折';
const hasWorkspaceRecords = (data) => ['discounts', 'priceReferences', 'products', 'operations', 'tasks', 'launches'].some((key) => Array.isArray(data?.[key]) && data[key].length > 0);
const getRecommended = (cost, salePrice) => {
  const minimum = (Number(cost) + 6) / Number(salePrice);
  return [...tiers].reverse().find((tier) => tier >= minimum) ?? null;
};
const normalizeProductSpecs = (product) => Array.isArray(product?.specs) && product.specs.length
  ? product.specs.map((spec) => ({
      ...spec,
      id: spec.id || uid(),
      name: spec.name || '默认规格',
      cost: Number(spec.cost || 0),
      packageSize: spec.packageSize || '',
      itemWeight: spec.itemWeight ?? '',
      packageWeight: spec.packageWeight ?? '',
      cartonQty: spec.cartonQty ?? '',
    }))
  : [{ id: `${product?.id || uid()}-default`, name: '默认规格', cost: Number(product?.cost || 0) }];
const productCategoryOf = (product) => product?.category === '地插灯' ? '地插灯' : '灯串';
const normalizeDiscountSpecs = (record) => Array.isArray(record?.specs) && record.specs.length
  ? record.specs.map((spec) => {
      const cost = Number(spec.cost || 0); const salePrice = Number(spec.salePrice || 0);
      return { ...spec, id: spec.id || uid(), name: spec.name || '默认规格', cost, salePrice, minimumRatio: salePrice > 0 ? (cost + 6) / salePrice : null, recommendedDiscount: salePrice > 0 ? getRecommended(cost, salePrice) : null };
    })
  : [{ id: `${record?.id || uid()}-default`, name: '默认规格', cost: Number(record?.cost || 0), salePrice: Number(record?.salePrice || 0), minimumRatio: Number(record?.minimumRatio || 0), recommendedDiscount: record?.recommendedDiscount ?? null }];
const summarizeDiscountSpecs = (specs) => {
  const calculated = specs.map((spec) => {
    const cost = Number(spec.cost); const salePrice = Number(spec.salePrice);
    return { ...spec, cost, salePrice, minimumRatio: (cost + 6) / salePrice, recommendedDiscount: getRecommended(cost, salePrice) };
  });
  const limitingSpec = calculated.reduce((worst, spec) => !worst || spec.minimumRatio > worst.minimumRatio ? spec : worst, null);
  const recommendedDiscount = calculated.some((spec) => spec.recommendedDiscount === null) ? null : Math.max(...calculated.map((spec) => spec.recommendedDiscount));
  return { specs: calculated, limitingSpec, minimumRatio: limitingSpec?.minimumRatio || null, recommendedDiscount };
};
const recordRecommended = (record) => Array.isArray(record?.specs) && record.specs.length ? summarizeDiscountSpecs(normalizeDiscountSpecs(record)).recommendedDiscount : record?.recommendedDiscount ?? null;
const valueRange = (values, formatter) => {
  const numbers = values.map(Number).filter(Number.isFinite);
  if (!numbers.length) return '—';
  const minimum = Math.min(...numbers); const maximum = Math.max(...numbers);
  return minimum === maximum ? formatter(minimum) : `${formatter(minimum)}–${formatter(maximum)}`;
};
const parseReferencePrices = (value) => [...new Set(String(value || '').split(/[，,、\s]+/).map(Number).filter((price) => Number.isFinite(price) && price > 0))];
const referenceState = (ownPrice, peerPrices, updatedAt) => {
  const prices = peerPrices.map(Number).filter((price) => Number.isFinite(price) && price > 0);
  const peerMinimum = prices.length ? Math.min(...prices) : null;
  const validOwnPrice = Number.isFinite(Number(ownPrice)) && Number(ownPrice) > 0;
  const difference = peerMinimum == null || !validOwnPrice ? null : Number(ownPrice) - peerMinimum;
  const age = updatedAt ? (Date.now() - new Date(updatedAt).getTime()) / 86400000 : Infinity;
  const level = difference == null ? 'missing' : difference < -1 ? 'risk' : difference < 0 ? 'notice' : 'safe';
  return { peerMinimum, difference, stale: age > 7, level };
};
const resolveReferenceProduct = (reference, products, discounts) => {
  const direct = products.find((item) => item.id === reference?.productId);
  if (direct) return direct;
  const legacyDiscount = discounts.find((item) => item.id === reference?.discountId);
  return products.find((item) => item.productName === legacyDiscount?.productName) || null;
};

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem('yuli.public.workspace.v1') || 'null');
    const current = parsed && typeof parsed === 'object' ? { ...emptyWorkspace, ...parsed } : { ...emptyWorkspace };
    if (current.productCatalogVersion === lightingCatalogVersion) return current;
    return { ...current, products: lightingProductCatalog, productCatalogVersion: lightingCatalogVersion };
  } catch {
    return { ...emptyWorkspace, products: lightingProductCatalog, productCatalogVersion: lightingCatalogVersion };
  }
}

const applyLightingCatalog = (data) => {
  const current = { ...emptyWorkspace, ...(data && typeof data === 'object' ? data : {}) };
  if (current.productCatalogVersion === lightingCatalogVersion) return { workspace: current, changed: false };
  return {
    workspace: { ...current, products: lightingProductCatalog, productCatalogVersion: lightingCatalogVersion },
    changed: true,
  };
};

async function imageToDataUrl(file) {
  if (!file) return '';
  const image = await createImageBitmap(file);
  const max = 560;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><button className="modal-close" onClick={onClose}>×</button><h2>{title}</h2>{children}</div></div>;
}
function Empty({ text }) { return <div className="empty">{text}</div>; }

export default function App() {
  const [page, setPage] = useState('overview');
  const [store, setStore] = useState(STORE_ALL);
  const [workspace, setWorkspace] = useState(readLocal);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [discountView, setDiscountView] = useState('activity');
  const [toast, setToast] = useState('');
  const [cloud, setCloud] = useState('正在连接云端…');
  const hydrated = useRef(false);
  const skipNextPush = useRef(false);

  const update = (key, records) => setWorkspace((current) => ({ ...current, [key]: records }));
  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    localStorage.setItem('yuli.public.workspace.v1', JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) { setCloud('已保存到本机'); hydrated.current = true; return; }
      const { data, error } = await supabase.from('public_workspace').select('data,updated_at').eq('workspace_key', 'main').maybeSingle();
      if (!alive) return;
      if (error) { setCloud('已保存到本机 · 云端待启用'); hydrated.current = true; return; }
      if (data?.data && hasWorkspaceRecords(data.data)) {
        const migrated = applyLightingCatalog(data.data);
        skipNextPush.current = true;
        setWorkspace(migrated.workspace);
        if (migrated.changed) {
          const { error: catalogError } = await supabase.from('public_workspace').upsert({ workspace_key: 'main', data: migrated.workspace, updated_at: new Date().toISOString() }, { onConflict: 'workspace_key' });
          setCloud(catalogError ? '商品档案已更新到本机 · 云端同步失败' : '商品档案已更新并同步');
        } else {
          setCloud('云端已连接');
        }
      } else if (hasWorkspaceRecords(workspace)) {
        const { error: uploadError } = await supabase.from('public_workspace').upsert({ workspace_key: 'main', data: workspace, updated_at: new Date().toISOString() }, { onConflict: 'workspace_key' });
        setCloud(uploadError ? '本机数据已保留 · 云端同步失败' : '本机数据已同步到云端');
      } else {
        setCloud('云端已连接');
      }
      hydrated.current = true;
    }
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated.current || !supabase) return;
    if (skipNextPush.current) { skipNextPush.current = false; return; }
    const timer = window.setTimeout(async () => {
      setCloud('正在同步…');
      const { error } = await supabase.from('public_workspace').upsert({ workspace_key: 'main', data: workspace, updated_at: new Date().toISOString() }, { onConflict: 'workspace_key' });
      setCloud(error ? '已保存到本机 · 云端同步失败' : '已同步到云端');
    }, 700);
    return () => clearTimeout(timer);
  }, [workspace]);

  const visible = (records) => store === STORE_ALL ? records : records.filter((item) => item.store === store || item.store === STORE_ALL);
  const todayOps = visible(workspace.operations).filter((item) => item.recordDate === today());
  const totals = todayOps.reduce((sum, item) => ({ sales: sum.sales + Number(item.sales), orders: sum.orders + Number(item.orders), listed: sum.listed + Number(item.listedProducts) }), { sales: 0, orders: 0, listed: 0 });
  const pending = visible(workspace.tasks).filter((item) => !item.completed);
  const todayTaskCount = workspace.tasks.filter((item) => item.period === 'today').length;
  const discountProductCount = new Set(workspace.discounts.map((item) => item.productName).filter(Boolean)).size;
  const pageTitle = titles[page];

  const openNew = (kind) => { setEditing(null); setModal(kind); };
  const openEdit = (kind, item) => { setEditing(item); setModal(kind); };
  const closeModal = () => { setModal(null); setEditing(null); };
  const remove = (key, item, label) => {
    if (!confirm(`确定删除“${label}”吗？`)) return;
    update(key, workspace[key].filter((row) => row.id !== item.id));
    notify('已删除');
  };

  const saveProduct = (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const specIds = data.getAll('specId'); const names = data.getAll('specName'); const costs = data.getAll('specCost');
    const packageSizes = data.getAll('specPackageSize'); const itemWeights = data.getAll('specItemWeight');
    const packageWeights = data.getAll('specPackageWeight'); const cartonQtys = data.getAll('specCartonQty');
    const specs = names.map((name, index) => ({
      id: specIds[index] || uid(),
      name: String(name).trim(),
      cost: Number(costs[index]),
      packageSize: String(packageSizes[index] || '').trim(),
      itemWeight: itemWeights[index] === '' ? '' : Number(itemWeights[index]),
      packageWeight: packageWeights[index] === '' ? '' : Number(packageWeights[index]),
      cartonQty: cartonQtys[index] === '' ? '' : Number(cartonQtys[index]),
    })).filter((spec) => spec.name);
    const sourceCategory = String(data.get('sourceCategory') || '').trim();
    const sourceExample = lightingProductCatalog.find((item) => item.sourceCategory === sourceCategory);
    const next = { id: editing?.id || uid(), category: sourceExample?.category || editing?.category || '灯串', sourceCategory, productName: String(data.get('productName')).trim(), specs, cost: specs[0]?.cost || 0, imageDataUrl: editing?.imageDataUrl || '', imageNote: editing?.imageNote || '', updatedAt: new Date().toISOString() };
    update('products', editing ? workspace.products.map((item) => item.id === editing.id ? next : item) : [next, ...workspace.products]); closeModal(); notify('商品档案已保存');
  };
  const saveOperation = (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const next = { id: editing?.id || uid(), store: data.get('store'), recordDate: data.get('recordDate'), sales: Number(data.get('sales')), orders: Number(data.get('orders')), refundAmount: Number(data.get('refundAmount')), listedProducts: Number(data.get('listedProducts')), note: data.get('note'), updatedAt: new Date().toISOString() };
    update('operations', editing ? workspace.operations.map((item) => item.id === editing.id ? next : item) : [next, ...workspace.operations]); closeModal(); notify('运营数据已保存');
  };
  const saveTask = (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const next = { id: editing?.id || uid(), title: String(data.get('title')).trim(), period: data.get('period'), store: data.get('store'), priority: data.get('priority'), note: data.get('note'), completed: editing?.completed || false, updatedAt: new Date().toISOString() };
    update('tasks', editing ? workspace.tasks.map((item) => item.id === editing.id ? next : item) : [next, ...workspace.tasks]); closeModal(); notify('任务已保存');
  };
  const saveLaunch = (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const next = { id: editing?.id || uid(), quantity: Math.max(1, Number(data.get('quantity')) || 1), store: data.get('store'), launchDate: data.get('launchDate'), note: data.get('note'), updatedAt: new Date().toISOString() };
    update('launches', editing ? workspace.launches.map((item) => item.id === editing.id ? next : item) : [next, ...workspace.launches]); closeModal(); notify('上新条数已保存');
  };
  const saveDiscount = async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const specIds = data.getAll('specId'); const specNames = data.getAll('specName'); const specCosts = data.getAll('specCost'); const specPrices = data.getAll('specSalePrice');
    const summary = summarizeDiscountSpecs(specNames.map((name, index) => ({ id: specIds[index] || uid(), name: String(name).trim() || '默认规格', cost: Number(specCosts[index]), salePrice: Number(specPrices[index]) })));
    const limitingSpec = summary.limitingSpec;
    let imageDataUrl = editing?.imageDataUrl || ''; const file = data.get('image'); if (file?.size) imageDataUrl = await imageToDataUrl(file);
    const reportableDiscount = summary.recommendedDiscount;
    const profits = reportableDiscount ? summary.specs.map((spec) => spec.salePrice * reportableDiscount - spec.cost - 3) : [];
    const legacyFields = editing ? {
      ...(editing.selectedDiscount != null ? { selectedDiscount: editing.selectedDiscount } : {}),
      ...(editing.startDate ? { startDate: editing.startDate } : {}),
      ...(editing.endDate ? { endDate: editing.endDate } : {}),
    } : {};
    const next = { id: editing?.id || uid(), store: data.get('store'), productCode: String(data.get('productCode')).trim(), productName: String(data.get('productName')).trim(), specs: summary.specs, limitingSpecName: limitingSpec?.name || '默认规格', cost: limitingSpec?.cost || 0, salePrice: limitingSpec?.salePrice || 0, minimumRatio: summary.minimumRatio, recommendedDiscount: reportableDiscount, discountedPrice: reportableDiscount ? limitingSpec?.salePrice * reportableDiscount : 0, profit: profits.length ? Math.min(...profits) : 0, note: data.get('note'), imageDataUrl, updatedAt: new Date().toISOString(), ...legacyFields };
    update('discounts', editing ? workspace.discounts.map((item) => item.id === editing.id ? next : item) : [next, ...workspace.discounts]); closeModal(); notify('折扣记录已保存');
  };
  const savePriceReference = (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const productId = String(data.get('productId'));
    const product = workspace.products.find((item) => item.id === productId);
    if (!product) { notify('请先选择商品档案'); return; }
    const specIds = data.getAll('referenceSpecId'); const specNames = data.getAll('referenceSpecName'); const priceValues = data.getAll('referencePrices');
    const specs = specIds.map((specId, index) => ({ specId: String(specId), specName: String(specNames[index]), prices: parseReferencePrices(priceValues[index]) })).filter((spec) => spec.prices.length);
    if (!specs.length) { notify('请至少填写一个同事售价'); return; }
    const existing = editing || (workspace.priceReferences || []).find((item) => item.productId === productId || resolveReferenceProduct(item, workspace.products, workspace.discounts)?.id === productId);
    const next = { id: existing?.id || uid(), productId, specs, note: data.get('note'), updatedAt: new Date().toISOString() };
    const records = workspace.priceReferences || [];
    update('priceReferences', existing ? records.map((item) => item.id === existing.id ? next : item) : [next, ...records]); closeModal(); notify('同事售价已保存');
  };

  return <div className="shell">
    <aside>
      <div className="brand"><b>Y</b><div><strong>郁荔运营台</strong><small>STORE OS</small></div></div>
      <p className="section-label">工作区</p>
      <nav>{nav.map(([key, icon, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => { setPage(key); setSearch(''); }}><i>{icon}</i>{label}</button>)}</nav>
      <div className="daily"><span>✦</span><strong>今日小结</strong><p>今天有 {todayTaskCount} 项运营任务，已记录 {discountProductCount} 个折扣商品。</p><button onClick={() => setPage('tasks')}>查看待办 →</button></div>
      <div className="profile"><b>荔</b><div><strong>郁荔</strong><small>{cloud}</small></div></div>
    </aside>
    <main>
      <header><div className="store-tabs">{[STORE_ALL, ...stores].map((name) => <button key={name} className={store === name ? 'selected' : ''} onClick={() => setStore(name)}>{name !== STORE_ALL && <em className={`dot ${name.toLowerCase()}`} />}{name}</button>)}</div><span>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())}</span></header>
      <section className="content">
        <div className="page-head"><div><small>{store === STORE_ALL ? '三店合计' : `${store} 店铺`}</small><h1>{pageTitle[0]}</h1><p>{pageTitle[1]}</p></div>{page !== 'overview' && <button className="primary" onClick={() => openNew(page === 'data' ? 'operation' : page === 'products' ? 'product' : page === 'tasks' ? 'task' : discountView === 'reference' ? 'priceReference' : 'discount')}>＋ {page === 'data' ? '新增记录' : page === 'products' ? '新增商品' : page === 'tasks' ? '新增任务' : discountView === 'reference' ? '录入同事售价' : '新增折扣记录'}</button>}</div>
        {page === 'overview' && <Overview totals={totals} workspace={workspace} store={store} pending={pending} setPage={setPage} onAdd={() => openNew('launch')} onEdit={(item) => openEdit('launch', item)} onDelete={(item) => remove('launches', item, `${item.store} ${item.launchDate} ${launchQuantity(item)}条`)} />}
        {page === 'discounts' && <Discounts mode={discountView} setMode={setDiscountView} records={visible(workspace.discounts)} allDiscounts={workspace.discounts} products={workspace.products} references={workspace.priceReferences || []} search={search} setSearch={setSearch} onEdit={(item) => openEdit('discount', item)} onDelete={(item) => remove('discounts', item, item.productName)} onEditReference={(item) => openEdit('priceReference', item)} onDeleteReference={(item) => remove('priceReferences', item, '同事售价记录')} />}
        {page === 'data' && <Operations records={visible(workspace.operations)} onEdit={(item) => openEdit('operation', item)} onDelete={(item) => remove('operations', item, `${item.store} ${item.recordDate}`)} />}
        {page === 'products' && <Products records={workspace.products} search={search} setSearch={setSearch} onEdit={(item) => openEdit('product', item)} onDelete={(item) => remove('products', item, item.productName)} />}
        {page === 'tasks' && <Tasks records={visible(workspace.tasks)} update={(records) => update('tasks', records)} onEdit={(item) => openEdit('task', item)} onDelete={(item) => remove('tasks', item, item.title)} />}
      </section>
    </main>
    {modal === 'product' && <ProductForm editing={editing} onSubmit={saveProduct} onClose={closeModal} />}
    {modal === 'operation' && <Modal title={editing ? '修改运营数据' : '录入运营数据'} onClose={closeModal}><form onSubmit={saveOperation}><div className="form-grid"><Field label="店铺"><select name="store" defaultValue={editing?.store || (store === STORE_ALL ? 'AG' : store)}>{stores.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="日期"><input name="recordDate" type="date" defaultValue={editing?.recordDate || today()} required /></Field><Field label="销售额"><input name="sales" type="number" min="0" step="0.01" defaultValue={editing?.sales || 0} /></Field><Field label="订单数"><input name="orders" type="number" min="0" defaultValue={editing?.orders || 0} /></Field><Field label="退款金额"><input name="refundAmount" type="number" min="0" step="0.01" defaultValue={editing?.refundAmount || 0} /></Field><Field label="在售商品数"><input name="listedProducts" type="number" min="0" defaultValue={editing?.listedProducts || 0} /></Field></div><Field label="备注"><textarea name="note" defaultValue={editing?.note} /></Field><FormActions onClose={closeModal} /></form></Modal>}
    {modal === 'task' && <Modal title={editing ? '修改任务' : '新增任务'} onClose={closeModal}><form onSubmit={saveTask}><Field label="任务内容"><input name="title" defaultValue={editing?.title} required /></Field><div className="form-grid"><Field label="时间"><select name="period" defaultValue={editing?.period || 'today'}><option value="today">今天</option><option value="week">本周</option></select></Field><Field label="店铺"><select name="store" defaultValue={editing?.store || STORE_ALL}>{[STORE_ALL, ...stores].map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="优先级"><select name="priority" defaultValue={editing?.priority || '普通'}><option>高</option><option>普通</option><option>低</option></select></Field></div><Field label="备注"><textarea name="note" defaultValue={editing?.note} /></Field><FormActions onClose={closeModal} /></form></Modal>}
    {modal === 'launch' && <Modal title={editing ? '修改上新记录' : '新增上新记录'} onClose={closeModal}><form onSubmit={saveLaunch}><div className="form-grid"><Field label="店铺"><select name="store" defaultValue={editing?.store || (store === STORE_ALL ? 'AG' : store)}>{stores.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="上新日期"><input name="launchDate" type="date" defaultValue={editing?.launchDate || today()} required /></Field><Field label="上新条数"><input name="quantity" type="number" min="1" step="1" defaultValue={launchQuantity(editing)} required /></Field></div><Field label="备注"><textarea name="note" defaultValue={editing?.note} placeholder="可选填" /></Field><FormActions onClose={closeModal} /></form></Modal>}
    {modal === 'discount' && <DiscountForm editing={editing} products={workspace.products} currentStore={store} onSubmit={saveDiscount} onClose={closeModal} />}
    {modal === 'priceReference' && <PriceReferenceForm editing={editing} products={workspace.products} discounts={visible(workspace.discounts)} allDiscounts={workspace.discounts} onSubmit={savePriceReference} onClose={closeModal} />}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function FormActions({ onClose }) { return <div className="actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">保存</button></div>; }

function Overview({ totals, workspace, store, pending, setPage, onAdd, onEdit, onDelete }) {
  const filteredDiscounts = store === STORE_ALL ? workspace.discounts : workspace.discounts.filter((item) => item.store === store);
  const monthKey = today().slice(0, 7);
  const monthLaunches = (workspace.launches || [])
    .filter((item) => item.launchDate?.startsWith(monthKey) && (store === STORE_ALL || item.store === store))
    .sort((a, b) => String(b.launchDate).localeCompare(String(a.launchDate)));
  const target = 31;
  const monthlyQuantity = monthLaunches.reduce((total, item) => total + launchQuantity(item), 0);
  const remaining = Math.max(0, target - monthlyQuantity);
  const progress = Math.min(100, (monthlyQuantity / target) * 100);
  return <>
    <div className="metrics"><Metric label="今日销售额" value={money(totals.sales)} /><Metric label="今日订单" value={totals.orders} /><Metric label="在售商品" value={totals.listed} /><Metric label="折扣记录" value={filteredDiscounts.length} /><Metric label="待办任务" value={pending.length} /></div>
    <div className="overview-grid">
      <div className="panel"><div className="panel-title"><div><h2>近期运营记录</h2><p>数据由你录入，不展示示例数据</p></div><button onClick={() => setPage('data')}>查看全部</button></div>{workspace.operations.length ? workspace.operations.slice(0, 5).map((item) => <div className="mini-row" key={item.id}><b>{item.store}</b><span>{item.recordDate}</span><strong>{money(item.sales)}</strong></div>) : <Empty text="暂无运营数据" />}</div>
      <div className="panel"><div className="panel-title"><div><h2>今日待办</h2><p>完成后可直接勾选</p></div><button onClick={() => setPage('tasks')}>查看任务</button></div>{pending.length ? pending.slice(0, 5).map((item) => <div className="mini-row" key={item.id}><b>{item.store}</b><span>{item.title}</span><strong>{item.priority}</strong></div>) : <Empty text="今天暂无待办" />}</div>
      <div className="panel launch-panel">
        <div className="panel-title"><div><h2>本月上新</h2><p>每月目标 31 条链接 · 已完成 {monthlyQuantity} 条 · 还差 {remaining} 条</p></div><button className="launch-add" onClick={onAdd}>＋ 记录上新</button></div>
        <div className="launch-progress"><div><span style={{ width: `${progress}%` }} /></div><strong>{monthlyQuantity} / {target}</strong></div>
        <LaunchChart records={monthLaunches} target={target} />
        {monthLaunches.length ? <div className="launch-list">{monthLaunches.map((item) => <div className="launch-row" key={item.id}><Badge>{item.store}</Badge><span className="launch-date">{item.launchDate}</span><strong className="launch-count">上新 {launchQuantity(item)} 条</strong><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></div>)}</div> : <Empty text="本月还没有上新记录，点击“记录上新”开始录入" />}
      </div>
    </div>
  </>;
}
function LaunchChart({ records, target }) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = Math.min(now.getDate(), daysInMonth);
  const counts = records.reduce((result, item) => {
    const day = Number(String(item.launchDate || '').slice(8, 10));
    if (day >= 1 && day <= daysInMonth) result[day] = (result[day] || 0) + launchQuantity(item);
    return result;
  }, {});
  let cumulative = 0;
  const actual = Array.from({ length: currentDay }, (_, index) => {
    const day = index + 1; cumulative += counts[day] || 0; return { day, value: cumulative };
  });
  const ideal = Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, value: target * ((index + 1) / daysInMonth) }));
  const x = (day) => 52 + ((day - 1) / Math.max(1, daysInMonth - 1)) * 716;
  const y = (value) => 18 + (1 - Math.min(value, target) / target) * 142;
  const points = (rows) => rows.map((point) => `${x(point.day).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ');
  const yTicks = [0, 8, 16, 24, 31];
  const xTicks = [...new Set([1, 8, 15, 22, daysInMonth])].filter((day) => day <= daysInMonth);
  const latest = actual[actual.length - 1] || { day: 1, value: 0 };
  return <div className="launch-chart">
    <div className="chart-head"><strong>本月累计上新趋势</strong><div><span className="legend actual" />实际进度<span className="legend ideal" />理想进度</div></div>
    <svg viewBox="0 0 800 190" role="img" aria-label={`本月已完成 ${latest.value} 条，上新目标 ${target} 条`}>
      {yTicks.map((tick) => <g key={tick}><line className="chart-grid" x1="52" x2="768" y1={y(tick)} y2={y(tick)} /><text x="42" y={y(tick) + 4} textAnchor="end">{tick}</text></g>)}
      {xTicks.map((tick) => <text key={tick} x={x(tick)} y="181" textAnchor="middle">{tick}日</text>)}
      <polyline className="ideal-line" points={points(ideal)} />
      <polyline className="actual-line" points={points(actual)} />
      <circle className="actual-dot" cx={x(latest.day)} cy={y(latest.value)} r="4.5" />
    </svg>
  </div>;
}
function Metric({ label, value }) { return <div className="metric"><i /><span>{label}</span><strong>{value}</strong></div>; }
function TableShell({ title, subtitle, search, setSearch, children }) { return <div className="panel table-panel"><div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div>{setSearch && <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索商品名称" />}</div>{children}</div>; }
function RowActions({ onEdit, onDelete }) { return <div className="row-actions"><button onClick={onEdit}>编辑</button><button className="danger" onClick={onDelete}>删除</button></div>; }

function Products({ records, search, setSearch, onEdit, onDelete }) {
  const [categoryFilter, setCategoryFilter] = useState('全部商品');
  const totalSpecs = records.reduce((total, item) => total + normalizeProductSpecs(item).length, 0);
  const sourceCategories = [...new Set([...sourceProductCategories, ...records.map((item) => item.sourceCategory).filter(Boolean)])];
  const filtered = records.filter((item) => {
    const matchesCategory = categoryFilter === '全部商品' || item.sourceCategory === categoryFilter;
    const matchesSearch = `${item.productName}${item.sourceCategory || ''}${normalizeProductSpecs(item).map((spec) => `${spec.name}${spec.packageSize || ''}`).join('')}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  return <>
    <div className="catalog-summary">
      <div><small>商品</small><strong>{records.length}</strong></div>
      <div><small>规格</small><strong>{totalSpecs}</strong></div>
      <p>来源：灯饰产品价格表（20260818）<br />原表图片公式不兼容，图片暂时留空</p>
    </div>
    <div className="product-category-tabs">{['全部商品', ...sourceCategories].map((category) => {
      const count = category === '全部商品' ? records.length : records.filter((item) => item.sourceCategory === category).length;
      return <button type="button" key={category} className={categoryFilter === category ? 'selected' : ''} onClick={() => setCategoryFilter(category)}><span>{category}</span><b>{count}</b></button>;
    })}</div>
    <TableShell title="灯饰产品价格表" subtitle={`当前查看：${categoryFilter}；点击规格数量可展开成本与包装详情`} search={search} setSearch={setSearch}><table><thead><tr><th>分类标题</th><th>商品名称</th><th>规格与成本</th><th>成本范围</th><th>操作</th></tr></thead><tbody>{filtered.map((item) => { const specs = normalizeProductSpecs(item); return <tr key={item.id}><td><Badge>{item.sourceCategory || '未分类'}</Badge></td><td><strong>{item.productName}</strong></td><td><details className="catalog-specs"><summary>{specs.length} 个规格</summary><div>{specs.map((spec) => <span key={spec.id}><b>{spec.name}</b><strong>{money(spec.cost)}</strong><small>包装：{spec.packageSize || '—'}　单品重：{spec.itemWeight || '—'}　包装重：{spec.packageWeight || '—'}　装箱数：{spec.cartonQty || '—'}</small></span>)}</div></details></td><td><strong>{valueRange(specs.map((spec) => spec.cost), money)}</strong></td><td><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></td></tr>; })}{!filtered.length && <tr><td colSpan="5"><Empty text={categoryFilter === '全部商品' ? '暂无商品档案，点击“新增商品”开始录入' : `暂无“${categoryFilter}”商品`} /></td></tr>}</tbody></table></TableShell>
  </>;
}
function Operations({ records, onEdit, onDelete }) { return <TableShell title="运营数据记录" subtitle="已保存的数据可以随时修改或删除"><table><thead><tr><th>日期</th><th>店铺</th><th>销售额</th><th>订单</th><th>退款</th><th>在售商品</th><th>操作</th></tr></thead><tbody>{records.map((item) => <tr key={item.id}><td>{item.recordDate}</td><td><Badge>{item.store}</Badge></td><td>{money(item.sales)}</td><td>{item.orders}</td><td>{money(item.refundAmount)}</td><td>{item.listedProducts}</td><td><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></td></tr>)}{!records.length && <tr><td colSpan="7"><Empty text="暂无运营数据，点击“新增记录”开始录入" /></td></tr>}</tbody></table></TableShell>; }
function Tasks({ records, update, onEdit, onDelete }) {
  const section = (period, title) => { const rows = records.filter((item) => item.period === period); return <div className="panel task-panel"><div className="panel-title"><h2>{title}</h2><Badge>{rows.length}</Badge></div>{rows.map((item) => <div className={`task ${item.completed ? 'done' : ''}`} key={item.id}><input type="checkbox" checked={item.completed} onChange={() => update(records.map((row) => row.id === item.id ? { ...row, completed: !row.completed } : row))} /><div><strong>{item.title}</strong><small>{item.store} · {item.priority}优先级</small></div><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></div>)}{!rows.length && <Empty text="暂无任务" />}</div>; };
  return <div className="task-grid">{section('today', '今天')}{section('week', '本周')}</div>;
}
function Discounts({ mode, setMode, records, allDiscounts, products, references, search, setSearch, onEdit, onDelete, onEditReference, onDeleteReference }) {
  return <>
    <div className="discount-view-tabs">
      <button type="button" className={mode === 'activity' ? 'selected' : ''} onClick={() => { setMode('activity'); setSearch(''); }}>活动折扣</button>
      <button type="button" className={mode === 'reference' ? 'selected' : ''} onClick={() => { setMode('reference'); setSearch(''); }}>同事售价参考</button>
    </div>
    {mode === 'activity'
      ? <DiscountActivity records={records} search={search} setSearch={setSearch} onEdit={onEdit} onDelete={onDelete} />
      : <PriceReferences discounts={records} allDiscounts={allDiscounts} products={products} references={references} search={search} setSearch={setSearch} onEdit={onEditReference} onDelete={onDeleteReference} />}
  </>;
}

function DiscountActivity({ records, search, setSearch, onEdit, onDelete }) {
  const [tierFilter, setTierFilter] = useState(null);
  const filtered = records.filter((item) => {
    const specNames = normalizeDiscountSpecs(item).map((spec) => spec.name).join('');
    const recommended = recordRecommended(item);
    const matchesSearch = `${item.productName}${item.productCode}${specNames}`.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === null || (recommended && recommended <= tierFilter);
    return matchesSearch && matchesTier;
  });
  const toggleTier = (tier) => setTierFilter((current) => current === tier ? null : tier);

  return <>
    <div className="metrics tier-metrics">
      {tiers.map((tier) => {
        const count = records.filter((item) => { const recommended = recordRecommended(item); return recommended && recommended <= tier; }).length;
        return <button type="button" className={`metric tier-metric ${tierFilter === tier ? 'selected' : ''}`} key={tier} onClick={() => toggleTier(tier)}>
          <i />
          <span>可以报</span>
          <strong>{discountText(tier)}</strong>
          <small>{count} 个商品</small>
        </button>;
      })}
    </div>
    <TableShell title="商品折扣记录" subtitle={`按（成本 + 6）÷ 售价计算最低可报档位${tierFilter ? ` · 当前查看可报 ${discountText(tierFilter)} 的商品` : ''}`} search={search} setSearch={setSearch}>
      <table><thead><tr><th>商品</th><th>店铺</th><th>成本</th><th>售价</th><th>最低折扣</th><th>最低可报</th><th>折后价</th><th>折后利润</th><th>操作</th></tr></thead><tbody>
        {filtered.map((item) => { const specs = normalizeDiscountSpecs(item); const summary = summarizeDiscountSpecs(specs); const reportableDiscount = summary.recommendedDiscount; const profits = reportableDiscount ? specs.map((spec) => spec.salePrice * reportableDiscount - spec.cost - 3) : []; return <tr key={item.id}><td><div className="product-cell"><span className="thumb">{item.imageDataUrl ? <img src={item.imageDataUrl} alt="" /> : '折'}</span><span><strong>{item.productName}</strong><small>{item.productCode}{specs.length > 1 ? ` · ${specs.length}个规格 · 限制规格：${summary.limitingSpec?.name}` : ` · ${specs[0]?.name}`}</small></span></div></td><td><Badge>{item.store}</Badge></td><td>{valueRange(specs.map((spec) => spec.cost), money)}</td><td>{valueRange(specs.map((spec) => spec.salePrice), money)}</td><td>{discountText(summary.minimumRatio)}</td><td><Badge>{discountText(reportableDiscount)}</Badge></td><td>{reportableDiscount ? valueRange(specs.map((spec) => spec.salePrice * reportableDiscount), money) : '—'}</td><td className={profits.length && Math.min(...profits) < 0 ? 'negative' : 'positive'}>{profits.length ? `最低 ${money(Math.min(...profits))}` : '—'}</td><td><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></td></tr>; })}
        {!filtered.length && <tr><td colSpan="9"><Empty text={tierFilter ? `暂无可以报 ${discountText(tierFilter)} 的商品` : '暂无折扣记录，点击“新增折扣记录”开始录入'} /></td></tr>}
      </tbody></table>
    </TableShell>
  </>;
}

function PriceReferences({ discounts, allDiscounts, products, references, search, setSearch, onEdit, onDelete }) {
  const [filter, setFilter] = useState('all');
  const rows = references.flatMap((reference) => {
    const product = resolveReferenceProduct(reference, products, allDiscounts);
    if (!product) return [];
    const productSpecs = normalizeProductSpecs(product);
    return (reference.specs || []).flatMap((savedSpec) => {
      const productSpec = productSpecs.find((item) => item.id === savedSpec.specId) || productSpecs.find((item) => item.name === savedSpec.specName);
      if (!productSpec) return [];
      const matchedPrices = discounts.flatMap((discount) => {
        if (discount.productName !== product.productName) return [];
        const discountSpec = normalizeDiscountSpecs(discount).find((item) => item.id === productSpec.id) || normalizeDiscountSpecs(discount).find((item) => item.name === productSpec.name);
        if (!discountSpec) return [];
        return [{ discount, discountSpec }];
      });
      const priceRows = matchedPrices.length ? matchedPrices : [{ discount: null, discountSpec: null }];
      return priceRows.map(({ discount, discountSpec }) => ({ reference, product, productSpec, discount, ownPrice: discountSpec?.salePrice ?? null, peerPrices: savedSpec.prices || [], ...referenceState(discountSpec?.salePrice, savedSpec.prices || [], reference.updatedAt) }));
    });
  }).sort((a, b) => {
    const rank = { risk: 0, notice: 1, safe: 2, missing: 3 };
    return rank[a.level] - rank[b.level] || Number(b.stale) - Number(a.stale) || a.product.productName.localeCompare(b.product.productName, 'zh-CN');
  });
  const counts = rows.reduce((result, row) => ({ ...result, [row.level]: result[row.level] + 1, stale: result.stale + Number(row.stale) }), { safe: 0, notice: 0, risk: 0, missing: 0, stale: 0 });
  const filtered = rows.filter((row) => {
    const matchesSearch = `${row.product.productName}${row.productSpec.name}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'stale' ? row.stale : row.level === filter);
    return matchesSearch && matchesFilter;
  });
  const stateLabel = (level) => ({ safe: '价格安全', notice: '略低', risk: '低价风险', missing: '待补价格' }[level]);

  return <>
    <div className="reference-metrics">
      <button type="button" className={filter === 'safe' ? 'selected' : ''} onClick={() => setFilter(filter === 'safe' ? 'all' : 'safe')}><span className="reference-dot safe" /><small>价格安全</small><strong>{counts.safe}</strong><em>个规格</em></button>
      <button type="button" className={filter === 'notice' ? 'selected' : ''} onClick={() => setFilter(filter === 'notice' ? 'all' : 'notice')}><span className="reference-dot notice" /><small>略低但未超 ¥1</small><strong>{counts.notice}</strong><em>个规格</em></button>
      <button type="button" className={filter === 'risk' ? 'selected' : ''} onClick={() => setFilter(filter === 'risk' ? 'all' : 'risk')}><span className="reference-dot risk" /><small>低价风险</small><strong>{counts.risk}</strong><em>个规格</em></button>
      <button type="button" className={filter === 'stale' ? 'selected' : ''} onClick={() => setFilter(filter === 'stale' ? 'all' : 'stale')}><span className="reference-dot stale" /><small>超过7天未更新</small><strong>{counts.stale}</strong><em>个规格</em></button>
    </div>
    <TableShell title="同事售价参考" subtitle="直接关联商品档案，并自动匹配各店铺的折扣售价；低于同事最低价超过 ¥1 时标红" search={search} setSearch={setSearch}>
      <table className="reference-table"><thead><tr><th>商品</th><th>店铺</th><th>规格</th><th>你的售价</th><th>同事价格</th><th>同事最低价</th><th>价差</th><th>风险状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
        {filtered.map((row) => <tr className={row.level === 'risk' ? 'risk-row' : ''} key={`${row.reference.id}-${row.productSpec.id}-${row.discount?.id || 'unmatched'}`}><td><div className="product-cell"><span className="thumb">{row.discount?.imageDataUrl ? <img src={row.discount.imageDataUrl} alt="" /> : '价'}</span><span><strong>{row.product.productName}</strong><small>{productCategoryOf(row.product)}</small></span></div></td><td>{row.discount ? <Badge>{row.discount.store}</Badge> : '—'}</td><td><strong>{row.productSpec.name}</strong></td><td>{row.ownPrice == null ? '未录入售价' : money(row.ownPrice)}</td><td>{row.peerPrices.map(money).join('、') || '—'}</td><td><strong>{row.peerMinimum == null ? '—' : money(row.peerMinimum)}</strong></td><td className={row.level === 'risk' ? 'negative' : row.difference < 0 ? 'reference-notice' : row.difference == null ? '' : 'positive'}>{row.difference == null ? '—' : signedMoney(row.difference)}</td><td><span className={`risk-badge ${row.level}`}>{stateLabel(row.level)}</span>{row.stale && <span className="stale-badge">待更新</span>}</td><td>{new Date(row.reference.updatedAt).toLocaleDateString('zh-CN')}</td><td><RowActions onEdit={() => onEdit(row.reference)} onDelete={() => onDelete(row.reference)} /></td></tr>)}
        {!filtered.length && <tr><td colSpan="10"><Empty text={rows.length ? '当前筛选条件下暂无记录' : '暂无同事售价，点击“录入同事售价”开始记录'} /></td></tr>}
      </tbody></table>
    </TableShell>
  </>;
}
function ProductForm({ editing, onSubmit, onClose }) {
  const [specRows, setSpecRows] = useState(() => normalizeProductSpecs(editing));
  const updateSpec = (id, key, value) => setSpecRows((rows) => rows.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const addSpec = () => setSpecRows((rows) => [...rows, { id: uid(), name: '', cost: '', packageSize: '', itemWeight: '', packageWeight: '', cartonQty: '' }]);
  const removeSpec = (id) => setSpecRows((rows) => rows.length === 1 ? rows : rows.filter((row) => row.id !== id));
  const categoryOptions = editing?.sourceCategory && !sourceProductCategories.includes(editing.sourceCategory) ? [editing.sourceCategory, ...sourceProductCategories] : sourceProductCategories;
  return <Modal title={editing ? '修改商品档案' : '新增商品档案'} onClose={onClose}><form className="catalog-form" onSubmit={onSubmit}><div className="form-grid"><Field label="分类标题"><select name="sourceCategory" defaultValue={editing?.sourceCategory || sourceProductCategories[0]} required>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="商品名称"><input name="productName" defaultValue={editing?.productName} required /></Field></div><div className="spec-editor catalog-spec-editor"><div className="spec-editor-head"><b>规格、成本及包装资料</b><button type="button" onClick={addSpec}>＋ 添加规格</button></div>{specRows.map((spec, index) => <div className="catalog-spec-edit-row" key={spec.id}><span>{index + 1}</span><input type="hidden" name="specId" value={spec.id} /><input name="specName" value={spec.name} onChange={(event) => updateSpec(spec.id, 'name', event.target.value)} placeholder="规格" required /><input name="specCost" type="number" min="0" step="0.01" value={spec.cost} onChange={(event) => updateSpec(spec.id, 'cost', event.target.value)} placeholder="成本价" required /><input name="specPackageSize" value={spec.packageSize || ''} onChange={(event) => updateSpec(spec.id, 'packageSize', event.target.value)} placeholder="包装尺寸" /><input name="specItemWeight" value={spec.itemWeight || ''} onChange={(event) => updateSpec(spec.id, 'itemWeight', event.target.value)} placeholder="单品重量" /><input name="specPackageWeight" value={spec.packageWeight || ''} onChange={(event) => updateSpec(spec.id, 'packageWeight', event.target.value)} placeholder="包装重量" /><input name="specCartonQty" value={spec.cartonQty || ''} onChange={(event) => updateSpec(spec.id, 'cartonQty', event.target.value)} placeholder="装箱数" /><button type="button" className="danger" disabled={specRows.length === 1} onClick={() => removeSpec(spec.id)}>删除</button></div>)}</div><FormActions onClose={onClose} /></form></Modal>;
}
function DiscountForm({ editing, products, currentStore, onSubmit, onClose }) {
  const [productName, setProductName] = useState(editing?.productName || '');
  const [specRows, setSpecRows] = useState(() => normalizeDiscountSpecs(editing));
  const completedSpecs = specRows.filter((spec) => spec.name && Number(spec.salePrice) > 0);
  const summary = completedSpecs.length ? summarizeDiscountSpecs(completedSpecs) : null;
  const updateSpec = (id, key, value) => setSpecRows((rows) => rows.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const removeSpec = (id) => setSpecRows((rows) => rows.length === 1 ? rows : rows.filter((row) => row.id !== id));
  const selectProduct = (name) => {
    setProductName(name); const found = products.find((item) => item.productName === name);
    if (found) setSpecRows(normalizeProductSpecs(found).map((spec) => ({ ...spec, salePrice: '' })));
  };
  return <Modal title={editing ? '修改折扣记录' : '新增折扣记录'} onClose={onClose}><form onSubmit={onSubmit}><div className="form-grid"><Field label="店铺"><select name="store" defaultValue={editing?.store || (currentStore === STORE_ALL ? 'AG' : currentStore)}>{stores.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="商品编号"><input name="productCode" defaultValue={editing?.productCode} /></Field></div><Field label="商品名称"><ProductNamePicker products={products} value={productName} onChange={selectProduct} /></Field><div className="spec-editor discount-spec-editor"><div className="spec-editor-head"><b>各规格成本与售价</b><small>核不过价的规格可以移除，不参与产品档位计算</small></div>{specRows.map((spec, index) => <div className="discount-spec-row" key={spec.id}><span>{index + 1}</span><input type="hidden" name="specId" value={spec.id} /><input name="specName" value={spec.name} onChange={(event) => updateSpec(spec.id, 'name', event.target.value)} placeholder="规格" required /><input name="specCost" type="number" min="0" step="0.01" value={spec.cost} onChange={(event) => updateSpec(spec.id, 'cost', event.target.value)} placeholder="成本价" required /><input name="specSalePrice" type="number" min="0.01" step="0.01" value={spec.salePrice} onChange={(event) => updateSpec(spec.id, 'salePrice', event.target.value)} placeholder="售价" required /><b>{Number(spec.salePrice) > 0 ? discountText(getRecommended(spec.cost, spec.salePrice)) : '—'}</b><button type="button" className="remove-spec" disabled={specRows.length === 1} onClick={() => removeSpec(spec.id)}>移除</button></div>)}</div><div className="calc-note">产品最低折扣：{summary ? discountText(summary.minimumRatio) : '—'}　产品最低可报：<b>{summary ? discountText(summary.recommendedDiscount) : '—'}</b>{summary?.limitingSpec && <span>　限制规格：{summary.limitingSpec.name}</span>}</div><Field label="商品图片"><input name="image" type="file" accept="image/*" /></Field><Field label="备注"><textarea name="note" defaultValue={editing?.note} /></Field><FormActions onClose={onClose} /></form></Modal>;
}

function PriceReferenceForm({ editing, products, discounts, allDiscounts, onSubmit, onClose }) {
  const legacyProduct = resolveReferenceProduct(editing, products, allDiscounts);
  const editingProductId = editing?.productId || legacyProduct?.id || '';
  const [productId, setProductId] = useState(editingProductId || products[0]?.id || '');
  const selected = products.find((item) => item.id === productId);
  const specs = selected ? normalizeProductSpecs(selected) : [];
  const savedPrices = (spec) => {
    if (productId !== editingProductId) return '';
    const saved = (editing?.specs || []).find((item) => item.specId === spec.id) || (editing?.specs || []).find((item) => item.specName === spec.name);
    return (saved?.prices || []).join('、');
  };
  const ownPrices = (spec) => discounts.flatMap((discount) => {
    if (discount.productName !== selected?.productName) return [];
    const match = normalizeDiscountSpecs(discount).find((item) => item.id === spec.id) || normalizeDiscountSpecs(discount).find((item) => item.name === spec.name);
    return match ? [`${discount.store} ${money(match.salePrice)}`] : [];
  });
  return <Modal title={editing ? '修改同事售价' : '录入同事售价'} onClose={onClose}>
    {products.length ? <form onSubmit={onSubmit}>
      <Field label="选择商品档案"><select name="productId" value={productId} onChange={(event) => setProductId(event.target.value)} required>{products.map((item) => <option value={item.id} key={item.id}>{productCategoryOf(item)} · {item.productName}</option>)}</select></Field>
      <div className="reference-editor" key={productId}>
        <div className="reference-editor-head"><div><b>按商品档案规格填写同事售价</b><small>你的售价会从同名、同规格的折扣记录中自动匹配</small></div><span>多个价格用逗号隔开</span></div>
        {specs.map((spec, index) => <div className="reference-edit-row" key={spec.id}>
          <span>{index + 1}</span><div><b>{spec.name}</b><small>你的售价：{ownPrices(spec).join(' / ') || '尚未录入折扣售价'}</small></div>
          <input type="hidden" name="referenceSpecId" value={spec.id} /><input type="hidden" name="referenceSpecName" value={spec.name} />
          <input name="referencePrices" defaultValue={savedPrices(spec)} placeholder="如：29.9、28.9" aria-label={`${spec.name}的同事售价`} />
        </div>)}
      </div>
      <div className="reference-rule"><b>判断规则</b><span>你的售价低于同事最低价超过 ¥1，将自动标记为低价风险。</span></div>
      <Field label="备注"><textarea name="note" defaultValue={editing?.note} placeholder="可选填" /></Field><FormActions onClose={onClose} />
    </form> : <><Empty text="请先在商品档案中新增商品，再录入同事售价" /><div className="actions"><button type="button" onClick={onClose}>关闭</button></div></>}
  </Modal>;
}
function ProductNamePicker({ products, value, onChange }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const matchingProducts = products.filter((item) => !value || item.productName.toLowerCase().includes(value.toLowerCase()));
  useEffect(() => {
    const closePicker = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closePicker);
    document.addEventListener('touchstart', closePicker);
    return () => {
      document.removeEventListener('mousedown', closePicker);
      document.removeEventListener('touchstart', closePicker);
    };
  }, []);
  const chooseProduct = (name) => {
    onChange(name);
    setOpen(false);
  };
  return <div className="product-name-picker" ref={pickerRef}>
    <input name="productName" value={value} onChange={(event) => { onChange(event.target.value); setOpen(true); }} placeholder="可输入名称，也可点右侧选择" autoComplete="off" required />
    <button type="button" className="product-picker-toggle" onClick={() => setOpen((current) => !current)} aria-label="选择商品" aria-expanded={open}>{open ? '▲' : '▼'}</button>
    {open && <div className="product-picker-menu">
      {matchingProducts.length ? matchingProducts.map((item) => <button type="button" key={item.id} onClick={() => chooseProduct(item.productName)}><b>{item.productName}</b><small>{productCategoryOf(item)} · {normalizeProductSpecs(item).length} 个规格</small></button>) : <p>{products.length ? '没有匹配的商品，可继续直接输入' : '商品档案暂无商品，可直接输入名称'}</p>}
    </div>}
  </div>;
}
function Badge({ children }) { return <span className="badge">{children}</span>; }
