import { CheckCircle2, ClipboardList } from 'lucide-react';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

export function RulesCenter({ rules }) {
  return (
    <>
      <PageHeader
        eyebrow="Operation Rules"
        title="我的规则中心"
        description="把 TEMU 灯饰运营里需要反复遵守的标题、场景和图片规范集中放在这里，写标题和提示词时可以随时对照。"
      />

      <div className="grid grid-cols-[0.72fr_1.28fr] gap-5">
        <GlassPanel>
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2f6] text-[#a85672]">
                <ClipboardList size={22} />
              </div>
              <h3 className="text-xl font-semibold text-ink">灯饰运营规则</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                V1.1 预置为太阳能户外灯饰场景，优先覆盖欧洲站常用庭院、阳台、花园和门廊表达。
              </p>
            </div>
            <div className="mt-8 rounded-2xl bg-white/64 p-4">
              <div className="text-sm text-muted">当前规则数量</div>
              <div className="mt-2 text-4xl font-semibold text-ink">{rules.length}</div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="grid grid-cols-2 gap-3">
            {rules.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-2xl bg-white/66 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#a85672]" size={18} />
                <p className="text-sm leading-6 text-ink">{rule}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
