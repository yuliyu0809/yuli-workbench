import XLSX from 'xlsx';
import { lightingProductCatalog as previous } from '../src/data/lightingProductCatalog.js';
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const key = value => clean(value).replace(/\s/g, '');
const workbook = XLSX.readFile(process.argv[2], { cellFormula: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
const products = []; let category = ''; let current;
for (const [index, row] of rows.entries()) {
  if (row[0] && !row[2] && !row[4] && row[0] !== '序号') { category = clean(row[0]); current = null; }
  if (row[2] && typeof row[4] === 'number') {
    current = { sourceCategory: category, productName: clean(row[2]), sourceRow: index + 1, specs: [] };
    products.push(current);
  }
  if (current && typeof row[4] === 'number' && row[3] !== '') current.specs.push({ name: clean(row[3]), cost: Number(row[4].toFixed(6)), sourceRow: index + 1 });
}
const oldByName = new Map(previous.map(p => [key(p.productName), p]));
let nextId = Math.max(...previous.map(p => Number(p.id.slice(1)))) + 1;
const changes = [], added = [], matched = new Set();
const result = products.map(product => {
  const old = oldByName.get(key(product.productName));
  const id = old?.id || `P${String(nextId++).padStart(4, '0')}`;
  if (old) matched.add(old.id); else added.push(product.productName);
  const specs = product.specs.map((spec, index) => {
    const oldSpec = old?.specs.find(s => key(s.name) === key(spec.name));
    if (oldSpec && oldSpec.cost !== spec.cost) changes.push({ product: product.productName, spec: spec.name, before: oldSpec.cost, after: spec.cost });
    return { ...oldSpec, ...spec, id: oldSpec?.id || `${id}-20260918-spec-${index + 1}` };
  });
  return { ...old, ...product, productName: old?.productName || product.productName, id, category: old?.category || '灯串', specs, cost: specs[0].cost, imageDataUrl: old?.imageDataUrl || '', imageNote: old?.imageNote || '原表图片公式不兼容，待补充', updatedAt: '2026-09-18T00:00:00.000+08:00' };
});
const absent = previous.filter(p => !matched.has(p.id));
const formulaMismatches = result.flatMap(p => p.specs.filter(s => {
  const rate = s.cost <= 6 ? .3 : s.cost <= 12 ? .25 : s.cost <= 18 ? .2 : s.cost <= 24 ? .17 : s.cost <= 30 ? .15 : s.cost <= 36 ? .13 : .12;
  return Math.abs(s.cost / (1 - .05 - .125 - rate) - Number(rows[s.sourceRow - 1][10])) > .00001;
}).map(s => ({ product: p.productName, spec: s.name, row: s.sourceRow })));
console.log(JSON.stringify({ report: { rows: rows.length, products: result.length, specs: result.reduce((n,p)=>n+p.specs.length,0), changes, added, absent: absent.map(p=>p.productName), formulaMismatches }, products: result }));
