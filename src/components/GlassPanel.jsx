export function GlassPanel({ children, className = '' }) {
  return (
    <section className={`glass-surface rounded-3xl p-5 ${className}`}>
      {children}
    </section>
  );
}
