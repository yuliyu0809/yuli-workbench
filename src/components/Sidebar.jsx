import {
  BadgeDollarSign,
  Calculator,
  Zap,
  LibraryBig,
  Store,
} from 'lucide-react';

const navItems = [
  { id: 'profit', label: '利润计算器', icon: Calculator },
  { id: 'ads', label: 'TEMU广告助手', icon: BadgeDollarSign },
  { id: 'storeArchive', label: '店铺商品档案', icon: Store },
  { id: 'productLibrary', label: '产品信息库', icon: LibraryBig },
  { id: 'quickActivity', label: '⚡ 快速活动测算', icon: Zap },
];

export function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sticky top-6 h-[calc(100vh-48px)] w-60 shrink-0 rounded-3xl border border-white/70 bg-white/60 p-4 shadow-glass backdrop-blur-2xl">
      <div className="rounded-2xl bg-white/75 p-4">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted">TEMU OPS</div>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Yuli运营后台</h1>
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
                active
                  ? 'bg-ink text-white shadow-soft'
                  : 'text-[#5f5559] hover:bg-white/75'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-[#fff7fa]/85 p-4 text-sm text-muted">
        <div className="font-medium text-ink">Supabase 云同步</div>
        <p className="mt-1 leading-6">店铺档案与产品信息库支持多设备同步。</p>
      </div>
    </aside>
  );
}
