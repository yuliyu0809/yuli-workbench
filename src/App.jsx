import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './lib/supabaseClient.js';

const STORE_ALL = '全部店铺';
const stores = ['AG', 'DS', 'HX'];
const tiers = [0.9, 0.85, 0.8, 0.75, 0.7];
const emptyWorkspace = { discounts: [], products: [], operations: [], tasks: [] };
const nav = [
  ['overview', '⌂', '运营总览'],
  ['discounts', '%', '商品折扣'],
  ['data', '⌁', '运营数据'],
  ['products', '□', '商品档案'],
  ['tasks', '✓', '运营任务'],
];
const titles = {
  overview: ['早上好，雨荔', '这是三个店铺今天的运营情况。'],
  discounts: ['商品折扣', '按照成本与售价自动计算可承受的折扣档位。'],
  data: ['运营数据', '记录并对比 AG、DS、HX 的每日核心指标。'],
  products: ['商品档案', '集中记录商品名称和成本价，不区分店铺。'],
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
const money = (value) => `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
const discountText = (value) => value ? `${Number((value * 10).toFixed(1))}折` : '不建议打折';
const statusOf = (record) => today() < record.startDate ? '未开始' : today() > record.endDate ? '已结束' : '进行中';
const hasWorkspaceRecords = (data) => ['discounts', 'products', 'operations', 'tasks'].some((key) => Array.isArray(data?.[key]) && data[key].length > 0);
const getRecommended = (cost, salePrice) => {
  const minimum = (Number(cost) + 6) / Number(salePrice);
  return [...tiers].reverse().find((tier) => tier >= minimum) ?? null;
};

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem('yuli.public.workspace.v1') || 'null');
    return parsed && typeof parsed === 'object' ? { ...emptyWorkspace, ...parsed } : emptyWorkspace;
  } catch { return emptyWorkspace; }
}

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
        skipNextPush.current = true;
        setWorkspace({ ...emptyWorkspace, ...data.data });
        setCloud('云端已连接');
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
    const next = { id: editing?.id || uid(), productName: String(data.get('productName')).trim(), cost: Number(data.get('cost')), updatedAt: new Date().toISOString() };
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
  const saveDiscount = async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const cost = Number(data.get('cost')); const salePrice = Number(data.get('salePrice')); const selectedDiscount = Number(data.get('selectedDiscount'));
    let imageDataUrl = editing?.imageDataUrl || ''; const file = data.get('image'); if (file?.size) imageDataUrl = await imageToDataUrl(file);
    const next = { id: editing?.id || uid(), store: data.get('store'), productCode: String(data.get('productCode')).trim(), productName: String(data.get('productName')).trim(), cost, salePrice, minimumRatio: (cost + 6) / salePrice, recommendedDiscount: getRecommended(cost, salePrice), selectedDiscount, discountedPrice: salePrice * selectedDiscount, profit: salePrice * selectedDiscount - cost - 6, startDate: data.get('startDate'), endDate: data.get('endDate'), note: data.get('note'), imageDataUrl, updatedAt: new Date().toISOString() };
    update('discounts', editing ? workspace.discounts.map((item) => item.id === editing.id ? next : item) : [next, ...workspace.discounts]); closeModal(); notify('折扣记录已保存');
  };

  return <div className="shell">
    <aside>
      <div className="brand"><b>Y</b><div><strong>雨荔运营台</strong><small>STORE OS</small></div></div>
      <p className="section-label">工作区</p>
      <nav>{nav.map(([key, icon, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => { setPage(key); setSearch(''); }}><i>{icon}</i>{label}</button>)}</nav>
      <div className="daily"><span>✦</span><strong>今日小结</strong><p>已记录 {workspace.products.length} 个商品，今天有 {pending.filter((item) => item.period === 'today').length} 项运营任务。</p><button onClick={() => setPage('tasks')}>查看待办 →</button></div>
      <div className="profile"><b>荔</b><div><strong>雨荔</strong><small>{cloud}</small></div></div>
    </aside>
    <main>
      <header><div className="store-tabs">{[STORE_ALL, ...stores].map((name) => <button key={name} className={store === name ? 'selected' : ''} onClick={() => setStore(name)}>{name !== STORE_ALL && <em className={`dot ${name.toLowerCase()}`} />}{name}</button>)}</div><span>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())}</span></header>
      <section className="content">
        <div className="page-head"><div><small>{store === STORE_ALL ? '三店合计' : `${store} 店铺`}</small><h1>{pageTitle[0]}</h1><p>{pageTitle[1]}</p></div>{page !== 'overview' && <button className="primary" onClick={() => openNew(page === 'data' ? 'operation' : page === 'products' ? 'product' : page === 'tasks' ? 'task' : 'discount')}>＋ 新增{page === 'data' ? '记录' : page === 'products' ? '商品' : page === 'tasks' ? '任务' : '折扣记录'}</button>}</div>
        {page === 'overview' && <Overview totals={totals} workspace={workspace} store={store} pending={pending} setPage={setPage} />}
        {page === 'discounts' && <Discounts records={visible(workspace.discounts)} search={search} setSearch={setSearch} onEdit={(item) => openEdit('discount', item)} onDelete={(item) => remove('discounts', item, item.productName)} />}
        {page === 'data' && <Operations records={visible(workspace.operations)} onEdit={(item) => openEdit('operation', item)} onDelete={(item) => remove('operations', item, `${item.store} ${item.recordDate}`)} />}
        {page === 'products' && <Products records={workspace.products} search={search} setSearch={setSearch} onEdit={(item) => openEdit('product', item)} onDelete={(item) => remove('products', item, item.productName)} />}
        {page === 'tasks' && <Tasks records={visible(workspace.tasks)} update={(records) => update('tasks', records)} onEdit={(item) => openEdit('task', item)} onDelete={(item) => remove('tasks', item, item.title)} />}
      </section>
    </main>
    {modal === 'product' && <Modal title={editing ? '修改商品档案' : '新增商品档案'} onClose={closeModal}><form onSubmit={saveProduct}><Field label="商品名称"><input name="productName" defaultValue={editing?.productName} required /></Field><Field label="成本价"><input name="cost" type="number" min="0" step="0.01" defaultValue={editing?.cost} required /></Field><FormActions onClose={closeModal} /></form></Modal>}
    {modal === 'operation' && <Modal title={editing ? '修改运营数据' : '录入运营数据'} onClose={closeModal}><form onSubmit={saveOperation}><div className="form-grid"><Field label="店铺"><select name="store" defaultValue={editing?.store || (store === STORE_ALL ? 'AG' : store)}>{stores.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="日期"><input name="recordDate" type="date" defaultValue={editing?.recordDate || today()} required /></Field><Field label="销售额"><input name="sales" type="number" min="0" step="0.01" defaultValue={editing?.sales || 0} /></Field><Field label="订单数"><input name="orders" type="number" min="0" defaultValue={editing?.orders || 0} /></Field><Field label="退款金额"><input name="refundAmount" type="number" min="0" step="0.01" defaultValue={editing?.refundAmount || 0} /></Field><Field label="在售商品数"><input name="listedProducts" type="number" min="0" defaultValue={editing?.listedProducts || 0} /></Field></div><Field label="备注"><textarea name="note" defaultValue={editing?.note} /></Field><FormActions onClose={closeModal} /></form></Modal>}
    {modal === 'task' && <Modal title={editing ? '修改任务' : '新增任务'} onClose={closeModal}><form onSubmit={saveTask}><Field label="任务内容"><input name="title" defaultValue={editing?.title} required /></Field><div className="form-grid"><Field label="时间"><select name="period" defaultValue={editing?.period || 'today'}><option value="today">今天</option><option value="week">本周</option></select></Field><Field label="店铺"><select name="store" defaultValue={editing?.store || STORE_ALL}>{[STORE_ALL, ...stores].map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="优先级"><select name="priority" defaultValue={editing?.priority || '普通'}><option>高</option><option>普通</option><option>低</option></select></Field></div><Field label="备注"><textarea name="note" defaultValue={editing?.note} /></Field><FormActions onClose={closeModal} /></form></Modal>}
    {modal === 'discount' && <DiscountForm editing={editing} products={workspace.products} currentStore={store} onSubmit={saveDiscount} onClose={closeModal} />}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function FormActions({ onClose }) { return <div className="actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">保存</button></div>; }

function Overview({ totals, workspace, store, pending, setPage }) {
  const filteredDiscounts = store === STORE_ALL ? workspace.discounts : workspace.discounts.filter((item) => item.store === store);
  return <><div className="metrics"><Metric label="今日销售额" value={money(totals.sales)} /><Metric label="今日订单" value={totals.orders} /><Metric label="在售商品" value={totals.listed} /><Metric label="折扣记录" value={filteredDiscounts.length} /><Metric label="待办任务" value={pending.length} /></div><div className="overview-grid"><div className="panel"><div className="panel-title"><div><h2>近期运营记录</h2><p>数据由你录入，不展示示例数据</p></div><button onClick={() => setPage('data')}>查看全部</button></div>{workspace.operations.length ? workspace.operations.slice(0, 5).map((item) => <div className="mini-row" key={item.id}><b>{item.store}</b><span>{item.recordDate}</span><strong>{money(item.sales)}</strong></div>) : <Empty text="暂无运营数据" />}</div><div className="panel"><div className="panel-title"><div><h2>今日待办</h2><p>完成后可直接勾选</p></div><button onClick={() => setPage('tasks')}>查看任务</button></div>{pending.length ? pending.slice(0, 5).map((item) => <div className="mini-row" key={item.id}><b>{item.store}</b><span>{item.title}</span><strong>{item.priority}</strong></div>) : <Empty text="今天暂无待办" />}</div></div></>;
}
function Metric({ label, value }) { return <div className="metric"><i /><span>{label}</span><strong>{value}</strong></div>; }
function TableShell({ title, subtitle, search, setSearch, children }) { return <div className="panel table-panel"><div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div>{setSearch && <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索商品名称" />}</div>{children}</div>; }
function RowActions({ onEdit, onDelete }) { return <div className="row-actions"><button onClick={onEdit}>编辑</button><button className="danger" onClick={onDelete}>删除</button></div>; }

function Products({ records, search, setSearch, onEdit, onDelete }) {
  const filtered = records.filter((item) => item.productName.toLowerCase().includes(search.toLowerCase()));
  return <TableShell title="商品成本价格表" subtitle="只记录商品名称和成本价，所有店铺共用" search={search} setSearch={setSearch}><table><thead><tr><th>商品名称</th><th>成本价</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.productName}</strong></td><td>{money(item.cost)}</td><td>{new Date(item.updatedAt).toLocaleString('zh-CN')}</td><td><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></td></tr>)}{!filtered.length && <tr><td colSpan="4"><Empty text="暂无商品档案，点击“新增商品”开始录入" /></td></tr>}</tbody></table></TableShell>;
}
function Operations({ records, onEdit, onDelete }) { return <TableShell title="运营数据记录" subtitle="已保存的数据可以随时修改或删除"><table><thead><tr><th>日期</th><th>店铺</th><th>销售额</th><th>订单</th><th>退款</th><th>在售商品</th><th>操作</th></tr></thead><tbody>{records.map((item) => <tr key={item.id}><td>{item.recordDate}</td><td><Badge>{item.store}</Badge></td><td>{money(item.sales)}</td><td>{item.orders}</td><td>{money(item.refundAmount)}</td><td>{item.listedProducts}</td><td><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></td></tr>)}{!records.length && <tr><td colSpan="7"><Empty text="暂无运营数据，点击“新增记录”开始录入" /></td></tr>}</tbody></table></TableShell>; }
function Tasks({ records, update, onEdit, onDelete }) {
  const section = (period, title) => { const rows = records.filter((item) => item.period === period); return <div className="panel task-panel"><div className="panel-title"><h2>{title}</h2><Badge>{rows.length}</Badge></div>{rows.map((item) => <div className={`task ${item.completed ? 'done' : ''}`} key={item.id}><input type="checkbox" checked={item.completed} onChange={() => update(records.map((row) => row.id === item.id ? { ...row, completed: !row.completed } : row))} /><div><strong>{item.title}</strong><small>{item.store} · {item.priority}优先级</small></div><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></div>)}{!rows.length && <Empty text="暂无任务" />}</div>; };
  return <div className="task-grid">{section('today', '今天')}{section('week', '本周')}</div>;
}
function Discounts({ records, search, setSearch, onEdit, onDelete }) {
  const [tierFilter, setTierFilter] = useState(null);
  const filtered = records.filter((item) => {
    const matchesSearch = `${item.productName}${item.productCode}`.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === null || item.recommendedDiscount === tierFilter;
    return matchesSearch && matchesTier;
  });
  const toggleTier = (tier) => setTierFilter((current) => current === tier ? null : tier);

  return <>
    <div className="metrics tier-metrics">
      {tiers.map((tier) => {
        const count = records.filter((item) => item.recommendedDiscount === tier).length;
        return <button type="button" className={`metric tier-metric ${tierFilter === tier ? 'selected' : ''}`} key={tier} onClick={() => toggleTier(tier)}>
          <i />
          <span>最低可报</span>
          <strong>{discountText(tier)}</strong>
          <small>{count} 个商品</small>
        </button>;
      })}
    </div>
    <TableShell title="商品折扣记录" subtitle={`按（成本 + 6）÷ 售价计算最低可报档位${tierFilter ? ` · 当前查看 ${discountText(tierFilter)}` : ''}`} search={search} setSearch={setSearch}>
      <table><thead><tr><th>商品</th><th>店铺</th><th>成本</th><th>售价</th><th>最低折扣</th><th>最低可报</th><th>实际折扣</th><th>折后价</th><th>折后利润</th><th>状态</th><th>操作</th></tr></thead><tbody>
        {filtered.map((item) => <tr key={item.id}><td><div className="product-cell"><span className="thumb">{item.imageDataUrl ? <img src={item.imageDataUrl} alt="" /> : '折'}</span><span><strong>{item.productName}</strong><small>{item.productCode}</small></span></div></td><td><Badge>{item.store}</Badge></td><td>{money(item.cost)}</td><td>{money(item.salePrice)}</td><td>{discountText(item.minimumRatio)}</td><td><Badge>{discountText(item.recommendedDiscount)}</Badge></td><td>{discountText(item.selectedDiscount)}</td><td>{money(item.discountedPrice)}</td><td className={item.profit < 0 ? 'negative' : 'positive'}>{money(item.profit)}</td><td><Badge>{statusOf(item)}</Badge></td><td><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></td></tr>)}
        {!filtered.length && <tr><td colSpan="11"><Empty text={tierFilter ? `暂无最低可报 ${discountText(tierFilter)} 的商品` : '暂无折扣记录，点击“新增折扣记录”开始录入'} /></td></tr>}
      </tbody></table>
    </TableShell>
  </>;
}
function DiscountForm({ editing, products, currentStore, onSubmit, onClose }) {
  const [productName, setProductName] = useState(editing?.productName || '');
  const [cost, setCost] = useState(editing?.cost ?? '');
  const [salePrice, setSalePrice] = useState(editing?.salePrice ?? '');
  const recommended = cost !== '' && Number(salePrice) > 0 ? getRecommended(cost, salePrice) : null;
  const selectProduct = (name) => { setProductName(name); const found = products.find((item) => item.productName === name); if (found) setCost(found.cost); };
  return <Modal title={editing ? '修改折扣记录' : '新增折扣记录'} onClose={onClose}><form onSubmit={onSubmit}><div className="form-grid"><Field label="店铺"><select name="store" defaultValue={editing?.store || (currentStore === STORE_ALL ? 'AG' : currentStore)}>{stores.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="商品编号"><input name="productCode" defaultValue={editing?.productCode} /></Field></div><Field label="商品名称"><input name="productName" list="product-options" value={productName} onChange={(e) => selectProduct(e.target.value)} required /><datalist id="product-options">{products.map((item) => <option key={item.id} value={item.productName} />)}</datalist></Field><div className="form-grid"><Field label="成本价"><input name="cost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required /></Field><Field label="售价"><input name="salePrice" type="number" min="0.01" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required /></Field></div><div className="calc-note">最低折扣：{Number(salePrice) > 0 ? discountText((Number(cost) + 6) / Number(salePrice)) : '—'}　推荐档位：<b>{discountText(recommended)}</b></div><div className="form-grid"><Field label="实际折扣"><select name="selectedDiscount" defaultValue={editing?.selectedDiscount || recommended || 0.9}>{tiers.map((tier) => <option value={tier} key={tier}>{discountText(tier)}</option>)}</select></Field><Field label="商品图片"><input name="image" type="file" accept="image/*" /></Field><Field label="开始日期"><input name="startDate" type="date" defaultValue={editing?.startDate || today()} required /></Field><Field label="结束日期"><input name="endDate" type="date" defaultValue={editing?.endDate || today()} required /></Field></div><Field label="备注"><textarea name="note" defaultValue={editing?.note} /></Field><FormActions onClose={onClose} /></form></Modal>;
}
function Badge({ children }) { return <span className="badge">{children}</span>; }
