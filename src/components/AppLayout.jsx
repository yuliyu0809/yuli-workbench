import { Sidebar } from './Sidebar.jsx';

export function AppLayout({ activePage, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,#f7cfdd_0,#f7cfdd_18%,transparent_34%),radial-gradient(circle_at_88%_18%,#ffe7ef_0,#ffe7ef_16%,transparent_32%),linear-gradient(135deg,#fffaf6_0%,#fff4f8_52%,#f7e9ef_100%)] px-6 py-6 text-ink">
      <div className="mx-auto flex max-w-[1440px] gap-6">
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
