import { ArrowRight, Calculator, ClipboardList, PenLine, Sparkles } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

const shortcuts = [
  { id: 'titles', title: '标题工坊', text: '生成 TEMU 太阳能灯饰英文标题', icon: PenLine },
  { id: 'prompts', title: '提示词工坊', text: '生成灯串、引路灯场景图提示词', icon: Sparkles },
  { id: 'profit', title: '利润计算器', text: '测算灯饰单件利润和保本价', icon: Calculator },
  { id: 'rules', title: '我的规则中心', text: '查看灯饰运营固定规则', icon: ClipboardList },
];

export function Dashboard({ products, titles, prompts, profitRecords, rules, onNavigate }) {
  return (
    <>
      <PageHeader
        eyebrow="TEMU Lighting Desk"
        title="太阳能灯饰运营工作台"
        description="围绕 TEMU 欧洲站太阳能灯串和庭院引路灯，集中处理标题、图片提示词、利润测算和运营规则。"
      />

      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="灯饰产品" value={products.length} accent="#eaa6bd" />
        <MetricCard label="标题草稿" value={titles.length} accent="#f4c76f" />
        <MetricCard label="提示词" value={prompts.length} accent="#9cc9bd" />
        <MetricCard label="利润记录" value={profitRecords.length} accent="#a9b7e8" />
        <MetricCard label="运营规则" value={rules.length} accent="#d6a8e8" />
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <GlassPanel key={item.id} className="min-h-44">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff2f6] text-[#9f526d]">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
                </div>
                <Button variant="soft" className="mt-5 w-fit" onClick={() => onNavigate(item.id)}>
                  打开 <ArrowRight size={16} />
                </Button>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-[1.25fr_0.75fr] gap-4">
        <GlassPanel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">最近产品</h3>
            <Button variant="ghost" onClick={() => onNavigate('prompts')}>生成场景图提示词</Button>
          </div>
          <div className="space-y-3">
            {products.slice(0, 4).map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-2xl bg-white/62 px-4 py-3">
                <div>
                  <div className="font-medium text-ink">{product.name}</div>
                  <div className="mt-1 text-xs text-muted">{product.category} · {product.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">¥{product.price}</div>
                  <div className="mt-1 text-xs text-muted">IP44 · {product.updatedAt}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="text-lg font-semibold text-ink">灯饰模板</h3>
          <div className="mt-4 space-y-3">
            {['欧洲庭院场景', '阳台栏杆灯串', '花园路径引路灯', '尺寸规格图'].map((item) => (
              <div key={item} className="rounded-2xl bg-white/62 px-4 py-3 text-sm font-medium text-ink">
                {item}
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
