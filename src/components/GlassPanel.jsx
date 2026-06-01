export function GlassPanel({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-white/70 bg-white/58 p-5 shadow-soft backdrop-blur-2xl ${className}`}>
      {children}
    </section>
  );
}
