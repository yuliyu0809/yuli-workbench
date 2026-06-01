import { Calculator, ClipboardList, DatabaseBackup, Home, PenLine, Sparkles } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: '首页', icon: Home },
  { id: 'titles', label: '标题工坊', icon: PenLine },
  { id: 'prompts', label: '提示词工坊', icon: Sparkles },
  { id: 'profit', label: '利润计算器', icon: Calculator },
  { id: 'rules', label: '我的规则中心', icon: ClipboardList },
  { id: 'backups', label: '备份中心', icon: DatabaseBackup },
];

export function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sticky top-6 h-[calc(100vh-48px)] w-64 shrink-0 rounded-3xl border border-white/70 bg-white/55 p-4 shadow-glass backdrop-blur-2xl">
      <div className="rounded-2xl bg-white/70 p-4">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted">TEMU Lighting</div>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Yuliの工作台</h1>
      </div>

      <nav className="mt-5 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-medium transition ${
                active ? 'bg-ink text-white shadow-soft' : 'text-[#5f5559] hover:bg-white/70'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-[#fff7fa]/80 p-4 text-sm text-muted">
        <div className="font-medium text-ink">本地模式</div>
        <p className="mt-1 leading-6">灯饰规则、标题和提示词都保存在当前浏览器。</p>
      </div>
    </aside>
  );
}
